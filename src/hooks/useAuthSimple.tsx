/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderSimple: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchProfileAndSetUser = async (userObj: unknown) => {
      // Versão simplificada - não consulta profiles
      const u = userObj as any;
      setUser({
        id: u.id,
        email: u.email ?? '',
        name: userObj.user_metadata?.name || '',
        role: userObj.user_metadata?.role || 'user',
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const { user } = data.session;
        fetchProfileAndSetUser(user);
        setIsAuthenticated(true);
      }
    });
    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchProfileAndSetUser(session.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.user_metadata?.name || '',
        role: data.user.user_metadata?.role || 'user',
      });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (email: string, password: string, name: string, role: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        logger.error('Erro ao recarregar sessão:', error);
        return false;
      }
      if (data.session) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          name: data.session.user.user_metadata?.name || '',
          role: data.session.user.user_metadata?.role || 'user',
        });
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Erro ao recarregar sessão:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, register, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthSimple = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthSimple must be used within an AuthProviderSimple');
  }
  return context;
}; 