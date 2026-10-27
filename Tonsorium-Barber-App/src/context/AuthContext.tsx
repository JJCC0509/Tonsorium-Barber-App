import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from '../services/apiClient';
import { login as loginRequest, register as registerRequest } from '../services/auth.service';
import { fetchMe, updateMe } from '../services/profile.service';
import type { MeResponse, RegisterInput, UpdateMeInput } from '../types/api';

/** El token solo se guarda si el usuario marco "Recordarme" (o al registrarse). */
const TOKEN_KEY = 'tonsorium.session.token';

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  me: MeResponse | null;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateProfile: (input: UpdateMeInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function clearStoredToken(): Promise<void> {
  setAuthToken(null);
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Si el almacenamiento seguro falla, la sesion en memoria ya quedo limpia.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [me, setMe] = useState<MeResponse | null>(null);

  // Al arrancar: rehidratar el token y validarlo contra GET /me.
  useEffect(() => {
    let active = true;

    const restore = async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          setAuthToken(stored);
          const result = await fetchMe();
          if (active) {
            setMe(result);
            setStatus('signedIn');
          }
          return;
        }
      } catch {
        await clearStoredToken();
      }

      if (active) {
        setMe(null);
        setStatus('signedOut');
      }
    };

    void restore();
    return () => {
      active = false;
    };
  }, []);

  const persistToken = useCallback(async (token: string, remember: boolean) => {
    setAuthToken(token);
    try {
      if (remember) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      // Sin almacenamiento seguro la sesion sigue viva en memoria.
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const { token } = await loginRequest({ email, password });
      await persistToken(token, remember);

      try {
        const result = await fetchMe();
        setMe(result);
        setStatus('signedIn');
      } catch (error) {
        await clearStoredToken();
        throw error;
      }
    },
    [persistToken],
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      const { token } = await registerRequest(input);
      await persistToken(token, true);

      try {
        const result = await fetchMe();
        setMe(result);
        setStatus('signedIn');
      } catch (error) {
        await clearStoredToken();
        throw error;
      }
    },
    [persistToken],
  );

  const signOut = useCallback(async () => {
    setMe(null);
    setStatus('signedOut');
    await clearStoredToken();
  }, []);

  const refreshMe = useCallback(async () => {
    const result = await fetchMe();
    setMe(result);
  }, []);

  const updateProfile = useCallback(async (input: UpdateMeInput) => {
    const result = await updateMe(input);
    setMe(result);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, me, signIn, signUp, signOut, refreshMe, updateProfile }),
    [status, me, signIn, signUp, signOut, refreshMe, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}
