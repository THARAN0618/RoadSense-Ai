import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { getMeApi, loginApi, logoutApi, registerApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
  switchDemoRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACCOUNTS: Record<Role, string> = {
  ADMIN: 'admin@roadsense.demo',
  AUTHORITY: 'authority@roadsense.demo',
  FIELD_WORKER: 'worker@roadsense.demo',
  CITIZEN: 'citizen@roadsense.demo',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const data = await getMeApi();
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginApi({ email, password });
    setUser(data.user);
  };

  const register = async (formData: any) => {
    const data = await registerApi(formData);
    setUser(data.user);
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  const switchDemoRole = async (role: Role) => {
    const email = DEMO_ACCOUNTS[role];
    if (email) {
      await login(email, 'Password123!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refetchUser: fetchCurrentUser,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
