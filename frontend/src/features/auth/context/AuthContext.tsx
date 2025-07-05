import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AuthCredentials, AuthContextType, User } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../../../lib/supabase';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;
      setUser(currentUser ? { id: currentUser.id, email: currentUser.email || '' } : null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (credentials: AuthCredentials) => {
    await authService.signIn(credentials);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
  }, []);

  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    return await authService.getCurrentUser();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await authService.resetPassword(email);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
    getCurrentUser,
    resetPassword,
  }), [user, loading, signIn, signOut, getCurrentUser, resetPassword]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
