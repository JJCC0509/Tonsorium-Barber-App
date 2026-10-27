import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { ApiUser } from '../types/api';
import { setAuthToken, setOnUnauthorized } from '../services/api';
import { loginUser, registerUser } from '../services/auth.api';

const SESSION_KEY = 'tonsorium_session';

interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  isGuest: boolean;
  loading: boolean;
  login: (input: { email: string; password: string; remember: boolean }) => Promise<ApiUser>;
  register: (input: {
    fullName: string;
    email: string;
    phone?: string;
    preferredShop: string;
    password: string;
    confirmPassword: string;
  }) => Promise<ApiUser>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveSession(token: string, user: ApiUser): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ token, user }));
  } catch {
    // Sin almacenamiento seguro la sesión queda solo en memoria.
  }
}

async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // Nada que hacer: ya no hay sesión persistida.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setIsGuest(false);
    await clearSession();
  }, []);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    setOnUnauthorized(() => {
      void logout();
    });
    return () => setOnUnauthorized(null);
  }, [logout]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(SESSION_KEY);
        if (raw && active) {
          const parsed = JSON.parse(raw) as { token: string; user: ApiUser };
          if (typeof parsed.token === 'string' && parsed.user) {
            setToken(parsed.token);
            setUser(parsed.user);
          }
        }
      } catch {
        // Sin sesión restaurable: se queda en Login.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: { email: string; password: string; remember: boolean }) => {
    const res = await loginUser(input);
    setToken(res.token);
    setUser(res.user);
    setIsGuest(false);
    if (input.remember) {
      await saveSession(res.token, res.user);
    } else {
      await clearSession();
    }
    return res.user;
  }, []);

  const register = useCallback(
    async (input: {
      fullName: string;
      email: string;
      phone?: string;
      preferredShop: string;
      password: string;
      confirmPassword: string;
    }) => {
      const res = await registerUser(input);
      setToken(res.token);
      setUser(res.user);
      setIsGuest(false);
      await saveSession(res.token, res.user);
      return res.user;
    },
    [],
  );

  const loginAsGuest = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsGuest(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isGuest, loading, login, register, loginAsGuest, logout }),
    [user, token, isGuest, loading, login, register, loginAsGuest, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
