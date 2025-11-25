import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
} from "react";
import { AuthCredentials, AuthContextType, User } from "../types";
import { authService } from "../services/authService";
import { supabase } from "../../../lib/supabase";

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Función para obtener la sesión inicial y establecer el estado de carga.
		const fetchSession = async () => {
			try {
				// Intenta obtener la sesión actual de Supabase.
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (session) {
					// Usamos authService para obtener el perfil completo (incluyendo username)
					const userWithProfile = await authService.getCurrentUser();
					setUser(userWithProfile);
				} else {
					setUser(null);
				}
			} catch (error) {
				console.error("Error al obtener la sesión:", error);
				setUser(null);
			} finally {
				// Es crucial establecer loading en false aquí, para que la app
				// sepa que la comprobación inicial ha terminado.
				setLoading(false);
			}
		};

		fetchSession();

		// Este listener se encarga de los cambios de autenticación DESPUÉS de la carga inicial.
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			if (session?.user) {
				const userWithProfile = await authService.getCurrentUser();
				setUser(userWithProfile);
			} else {
				setUser(null);
			}
		});

		return () => {
			subscription?.unsubscribe();
		};
	}, []);

	const signIn = useCallback(async (credentials: AuthCredentials) => {
		await authService.signIn(credentials);
	}, []);

	const signUp = useCallback(async (credentials: AuthCredentials) => {
		await authService.signUp(credentials);
	}, []);

	const signOut = useCallback(async () => {
		// Clear user state first to ensure immediate logout
		setUser(null);
		await authService.signOut();
	}, []);

	const getCurrentUser = useCallback(async (): Promise<User | null> => {
		return await authService.getCurrentUser();
	}, []);

	const resetPassword = useCallback(async (email: string) => {
		await authService.resetPassword(email);
	}, []);

	const updateProfile = useCallback(
		async (profile: Partial<User>) => {
			if (!user?.id) return;
			await authService.updateProfile(user.id, profile);
			// Update local state
			setUser((prev) => (prev ? { ...prev, ...profile } : null));
		},
		[user]
	);

	const value = useMemo(
		() => ({
			user,
			loading,
			signIn,
			signUp,
			signOut,
			getCurrentUser,
			resetPassword,
			updateProfile,
		}),
		[
			user,
			loading,
			signIn,
			signUp,
			signOut,
			getCurrentUser,
			resetPassword,
			updateProfile,
		]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth debe ser usado dentro de un AuthProvider");
	}
	return context;
};
