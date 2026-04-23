import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { fetchApi, ApiError } from '@/lib/api';
import { Usuario } from '@/types';

interface AuthContextData {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredToken();
  }, []);

  async function loadStoredToken() {
    try {
      const storedToken = await storage.getToken();
      if (storedToken) {
        setToken(storedToken);
        const me = await fetchApi<Usuario>('/auth/me', {}, storedToken);
        setUser(me);
      }
    } catch {
      await storage.removeToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, senha: string) {
    const data = await fetchApi<{ access_token: string; usuario: Usuario }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, senha }) },
    );
    await storage.setToken(data.access_token);
    setToken(data.access_token);
    setUser(data.usuario);
  }

  async function logout() {
    await storage.removeToken();
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!token) return;
    try {
      const me = await fetchApi<Usuario>('/auth/me', {}, token);
      setUser(me);
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
