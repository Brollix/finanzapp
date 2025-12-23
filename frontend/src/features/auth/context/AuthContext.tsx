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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { withTimeout } from "../../../utils/timeout";

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Función para obtener la sesión inicial y establecer el estado de carga.
		const fetchSession = async () => {
			// Failsafe: asegurar que loading siempre se ponga en false
			// incluso si hay errores no capturados
			let loadingSet = false;
			const setLoadingFalse = () => {
				if (!loadingSet) {
					loadingSet = true;
					setLoading(false);
				}
			};

			try {
				// Envolver todo el proceso de inicialización con timeout de 10 segundos
				const sessionPromise = (async () => {
					try {
						// Intenta obtener la sesión actual de Supabase con timeout
						const getSessionPromise = supabase.auth.getSession();
						const {
							data: { session },
						} = await withTimeout(
							getSessionPromise,
							5000,
							"Timeout al obtener sesión de Supabase"
						);

						if (session) {
							// Usamos authService para obtener el perfil completo (incluyendo username)
							// authService.getCurrentUser ya tiene sus propios timeouts
							const userWithProfile = await authService.getCurrentUser();
							setUser(userWithProfile);
						} else {
							setUser(null);
						}
					} catch (error: any) {
						// Manejar timeouts como advertencias, no errores críticos
						if (error?.message?.includes("Timeout")) {
							console.warn(
								"Timeout al conectar con Supabase. Verifica tu conexión a internet."
							);
						} else {
							console.error("Error al obtener la sesión:", error);
						}
						// Si el refresh token es inválido, forzamos el cierre de sesión para limpiar el almacenamiento
						if (
							error?.message?.includes("Invalid Refresh Token") ||
							error?.message?.includes("Refresh Token Not Found")
						) {
							console.warn(
								"Refresh token inválido detectado. Cerrando sesión para limpiar estado."
							);
							// Force clear everything
							try {
								await AsyncStorage.removeItem(
									"sb-bluhllaqxvvflaguamwe.supabase.co-auth-token"
								);
								await supabase.auth.signOut();
							} catch (cleanupError) {
								console.warn("Error al limpiar sesión:", cleanupError);
							}
						}
						setUser(null);
					}
				})();

				// Timeout general de 10 segundos para todo el proceso
				await withTimeout(
					sessionPromise,
					10000,
					"Timeout general en inicialización de autenticación"
				);
			} catch (error: any) {
				// Manejar timeouts como advertencias, no errores críticos
				if (error?.message?.includes("Timeout")) {
					console.warn(
						"Timeout en inicialización de autenticación. Continuando con pantalla de login."
					);
				} else {
					console.error(
						"Error crítico en fetchSession (continuando con login):",
						error.message
					);
				}
				// En caso de error crítico, continuar sin usuario para mostrar login
				setUser(null);
			} finally {
				// Es crucial establecer loading en false aquí, para que la app
				// sepa que la comprobación inicial ha terminado.
				setLoadingFalse();
			}
		};

		fetchSession();

		// Este listener se encarga de los cambios de autenticación DESPUÉS de la carga inicial.
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			try {
				if (session?.user) {
					const userWithProfile = await authService.getCurrentUser();
					setUser(userWithProfile);
				} else {
					setUser(null);
				}
			} catch (error) {
				console.error("Error en onAuthStateChange:", error);
				setUser(null);
			}
		});

		return () => {
			subscription?.unsubscribe();
		};
	}, []);

	const signIn = useCallback(
		async (credentials: AuthCredentials, rememberMe?: boolean) => {
			await authService.signIn(credentials, rememberMe);
		},
		[]
	);

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

	const resendConfirmationEmail = useCallback(async (email: string) => {
		await authService.resendConfirmationEmail(email);
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
			resendConfirmationEmail,
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
			resendConfirmationEmail,
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
