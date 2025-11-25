export interface AuthCredentials {
	email: string;
	password: string;
}

export interface User {
	id: string;
	email: string;
	username?: string;
	full_name?: string;
	avatar_url?: string;
}

export interface AuthContextType {
	user: User | null;
	loading: boolean;
	signIn: (credentials: AuthCredentials) => Promise<void>;
	signUp: (credentials: AuthCredentials) => Promise<void>;
	signOut: () => Promise<void>;
	getCurrentUser: () => Promise<User | null>;
	resetPassword: (email: string) => Promise<void>;
	updateProfile: (profile: Partial<User>) => Promise<void>;
}
