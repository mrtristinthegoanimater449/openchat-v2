import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { apiUrl } from '../lib/apiBase';

export interface Account {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email?: string;
  createdAt?: number;
}

interface AuthContextType {
  session: Account | null;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logIn: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: (credential: string) => Promise<{ success: boolean; message: string }>;
  logOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'openchat_token';

async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  return { ok: res.ok, status: res.status, data };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api('/api/auth/me')
      .then(({ ok, data }) => {
        if (ok && data?.user) setSession(data.user);
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const finish = useCallback((data: any) => {
    if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
    if (data?.user) setSession(data.user);
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    const { ok, data } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!ok) return { success: false, message: data?.message ?? 'Sign up failed.' };
    finish(data);
    return { success: true, message: 'Account created!' };
  }, [finish]);

  const logIn = useCallback(async (username: string, password: string) => {
    const { ok, data } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!ok) return { success: false, message: data?.message ?? 'Log in failed.' };
    finish(data);
    return { success: true, message: 'Welcome back!' };
  }, [finish]);

  const signInWithGoogle = useCallback(
    async (credential: string) => {
      const { ok, data } = await api('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      if (!ok) return { success: false, message: data?.message ?? 'Google sign-in failed.' };
      finish(data);
      return { success: true, message: 'Signed in with Google!' };
    },
    [finish]
  );

  const logOut = useCallback(() => {
    api('/api/auth/logout', { method: 'POST', body: '{}' }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, signUp, logIn, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
