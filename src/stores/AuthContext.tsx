import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';
import { getToken, setToken, removeToken } from '../services/tokenService';
import type { User, RegisterRequest } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<{ pendingApproval: boolean; message?: string; restaurantSlug?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.auth.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      removeToken();
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.auth.login({ username, password });
    // console.log(response);
    if (!response.access_token) {
      throw new Error('Login response missing access token');
    }
    setToken(response.access_token);
    setTokenState(response.access_token);
    const userData = await api.auth.getMe();
    setUser(userData);
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<{ pendingApproval: boolean; message?: string; restaurantSlug?: string }> => {
    const response = await api.auth.register(data);
    if (!response.access_token) {
      return { pendingApproval: true, message: response.message, restaurantSlug: response.restaurant_slug };
    }
    setToken(response.access_token);
    setTokenState(response.access_token);
    const userData = await api.auth.getMe();
    setUser(userData);
    return { pendingApproval: false, restaurantSlug: response.restaurant_slug };
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
    setTokenState(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
