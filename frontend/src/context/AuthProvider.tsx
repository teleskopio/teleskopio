import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type User = {
  username: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  AuthDisabled: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authDisabled, setAuthDisabled] = useState<boolean | null>(null);

  const fetchAuthData = useCallback(async () => {
    try {
      const res: any = await fetch('/api/auth_disabled', {
        headers: { 'Content-Type': 'application/json' },
      });
      const data: any = await res.json();
      setAuthDisabled(data.message);
    } catch (error: any) {
      setAuthDisabled(true);
      console.error(error);
    }
  }, [authDisabled]);

  useEffect(() => {
    fetchAuthData();
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<any> => {
    const res: any = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      return await res.json();
    }

    const data = await res.json();
    const { token } = data;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const user: User = { username: payload.username, role: payload.role };

    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { success: '' };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token, AuthDisabled: !!authDisabled }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
