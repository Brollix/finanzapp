export interface AuthCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  // Agrega más campos según necesites
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
}
