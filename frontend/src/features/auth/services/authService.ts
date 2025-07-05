import { supabase } from '../../../lib/supabase';
import { AuthCredentials, User } from '../types';

export const authService = {
  async signIn(credentials: AuthCredentials): Promise<User> {
    const { email, password } = credentials;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No se pudo obtener la información del usuario');
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
    };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
    };
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'finanzapp://reset-password',
    });

    if (error) {
      throw new Error(error.message);
    }
  },
};
