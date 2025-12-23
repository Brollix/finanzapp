import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import { AuthCredentials, User } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { withTimeout } from "../../../utils/timeout";

export const authService = {
	async signIn(
		credentials: AuthCredentials,
		rememberMe: boolean = true
	): Promise<User> {
		const { email, password } = credentials;

		// Si no quiere ser recordado, limpiar sesión persistente antes de login
		if (!rememberMe) {
			// Limpiar cualquier sesión persistente previa
			await AsyncStorage.removeItem(
				"sb-bluhllaqxvvflaguamwe.supabase.co-auth-token"
			);
		}

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			throw new Error(error.message);
		}

		if (!data.user) {
			throw new Error("No se pudo obtener la información del usuario");
		}

		return {
			id: data.user.id,
			email: data.user.email || "",
		};
	},

	async signUp(credentials: AuthCredentials): Promise<User> {
		const { email, password } = credentials;
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: "finanzapp://auth/callback",
			},
		});

		if (error) {
			throw new Error(error.message);
		}

		if (!data.user) {
			throw new Error("No se pudo crear el usuario");
		}

		// Verificar si necesita confirmación de email
		if (data.session === null) {
			throw new Error("EMAIL_CONFIRMATION_REQUIRED");
		}

		return {
			id: data.user.id,
			email: data.user.email || "",
		};
	},

	async signOut(): Promise<void> {
		const { error } = await supabase.auth.signOut();
		if (error) {
			throw new Error(error.message);
		}
	},

	async getCurrentUser(): Promise<User | null> {
		// Verificar configuración de Supabase antes de intentar llamadas
		if (!isSupabaseConfigured) {
			return null;
		}

		try {
			// Get user with timeout (5 seconds)
			const getUserPromise = supabase.auth.getUser();
			const {
				data: { user },
				error,
			} = await withTimeout(
				getUserPromise,
				5000,
				"Timeout al obtener usuario de Supabase"
			);

			if (error || !user) {
				return null;
			}

			// Fetch profile data with timeout (5 seconds)
			try {
				const profilePromise = supabase
					.from("profiles")
					.select("username, full_name, avatar_url")
					.eq("id", user.id)
					.single();

				const { data: profile, error: profileError } = await withTimeout(
					profilePromise,
					5000,
					"Timeout al obtener perfil de usuario"
				);

				if (profileError) {
					// Return user without profile data if profile fetch fails
					return {
						id: user.id,
						email: user.email || "",
					};
				}

				return {
					id: user.id,
					email: user.email || "",
					...(profile || {}),
				};
			} catch (profileError: any) {
				// Return user without profile data if profile fetch fails
				return {
					id: user.id,
					email: user.email || "",
				};
			}
		} catch (error: any) {
			// Timeout is expected if there are connectivity issues
			return null;
		}
	},

	async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
		const { error } = await supabase.from("profiles").upsert({
			id: userId,
			...updates,
			updated_at: new Date().toISOString(),
		});

		if (error) {
			throw new Error(error.message);
		}
	},

	async resetPassword(email: string): Promise<void> {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: "finanzapp://reset-password",
		});

		if (error) {
			throw new Error(error.message);
		}
	},

	async resendConfirmationEmail(email: string): Promise<void> {
		const { error } = await supabase.auth.resend({
			type: "signup",
			email: email,
			options: {
				emailRedirectTo: "finanzapp://auth/callback",
			},
		});
		if (error) {
			throw new Error(error.message);
		}
	},
};
