import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, setAuthToken } from '../services/apiClient';
import { login as loginRequest, register as registerRequest } from '../services/auth.service';
import { fetchMe, updateMe } from '../services/profile.service';
import type { MeResponse, RegisterInput, UpdateMeInput } from '../types/api';

/** El token solo se guarda si el usuario marco "Recordarme" (o al registrarse). */
const TOKEN_KEY = 'tonsorium.session.token';

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn' | 'restoreFailed';

interface AuthContextValue {
  status: AuthStatus;
  me: MeResponse | null;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  retryRestore: () => Promise<void>;
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

  /**
   * Rehidrata el token guardado y lo valida contra `GET /me`.
   *
   * Solo un 401 prueba que la sesion dejo de ser valida, y unicamente en ese
   * caso se descarta el token. Un fallo de red (sin conexion, o el backend
   * dormido en el plan gratuito de Render) NO debe cerrar la sesion: se pasa a
   * `restoreFailed` y el usuario decide si reintentar.
   */
  const restoreSession = useCallback(async () => {
    setStatus('restoring');

    let stored: string | null = null;
    try {
      stored = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      stored = null;
    }

    if (!stored) {
      setAuthToken(null);
      setMe(null);
      setStatus('signedOut');
      return;
    }

    setAuthToken(stored);
    try {
      const result = await fetchMe();
      setMe(result);
      setStatus('signedIn');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearStoredToken();
        setMe(null);
        setStatus('signedOut');
        return;
      }
      setStatus('restoreFailed');
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

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
    () => ({ status, me, signIn, signUp, signOut, refreshMe, retryRestore: restoreSession, updateProfile }),
    [status, me, signIn, signUp, signOut, refreshMe, restoreSession, updateProfile],
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
