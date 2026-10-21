import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearToken, getToken, http, setToken } from '../api/http';
import type { User } from '../models/user.model';

interface AuthResponse {
  accessToken: string;
}

export interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  updateFullName: (fullName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    if (!getToken()) {
      setCurrentUser(null);
      return;
    }
    try {
      setCurrentUser(await http.get<User>('/users/me'));
    } catch {
      clearToken();
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    void loadCurrentUser().finally(() => setLoading(false));
  }, [loadCurrentUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await http.post<AuthResponse>('/auth/login', { email, password });
      setToken(res.accessToken);
      await loadCurrentUser();
    },
    [loadCurrentUser],
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const res = await http.post<AuthResponse>('/auth/register', { email, password, fullName });
      setToken(res.accessToken);
      await loadCurrentUser();
    },
    [loadCurrentUser],
  );

  const updateFullName = useCallback(async (fullName: string) => {
    setCurrentUser(await http.patch<User>('/users/me', { fullName }));
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await http.patch<void>('/users/me/password', { currentPassword, newPassword });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setCurrentUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: currentUser !== null,
      loading,
      login,
      register,
      logout,
      updateFullName,
      changePassword,
    }),
    [currentUser, loading, login, register, logout, updateFullName, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
