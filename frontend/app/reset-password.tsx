import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
	View,
	Text,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Alert,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";
import { theme } from "../src/styles/theme";
import { core } from "../src/styles/core.styles";
import { supabase } from "../src/lib/supabase";

export default function ResetPasswordScreen() {
	const router = useRouter();
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [initializing, setInitializing] = useState(true);
	const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
	const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
		useState(false);

	useEffect(() => {
		const handleDeepLink = async (url: string | null) => {
			if (!url) {
				// If no URL, check if we already have a valid session
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (session) {
					setInitializing(false);
					return;
				}
				// No session and no URL, redirect to login
				Alert.alert(
					"Enlace inválido",
					"Este enlace de recuperación ha expirado o es inválido. Por favor solicita uno nuevo.",
					[
						{
							text: "OK",
							onPress: () => router.replace("/login"),
						},
					]
				);
				return;
			}

			// Only process if it's a reset-password URL
			if (!url.includes("reset-password")) {
				return;
			}

			try {
				// Supabase sends tokens in the hash fragment:
				// finanzapp://reset-password#access_token=...&refresh_token=...&type=recovery&...

				let accessToken: string | null = null;
				let refreshToken: string | null = null;

				// 1. Try to extract from hash manually (most reliable for Supabase)
				const hashIndex = url.indexOf("#");
				if (hashIndex !== -1) {
					const hash = url.substring(hashIndex + 1);
					// Manual parsing to avoid URLSearchParams issues
					const pairs = hash.split("&");
					for (const pair of pairs) {
						const [key, value] = pair.split("=");
						if (key === "access_token") accessToken = decodeURIComponent(value);
						if (key === "refresh_token") refreshToken = decodeURIComponent(value);
					}
				}

				// 2. Fallback: Try expo-linking queryParams (in case it's sent as query params)
				const parsed = Linking.parse(url);
				if (!accessToken || !refreshToken) {
					if (parsed.queryParams) {
						if (parsed.queryParams.access_token) {
							accessToken = Array.isArray(parsed.queryParams.access_token)
								? parsed.queryParams.access_token[0]
								: parsed.queryParams.access_token;
						}
						if (parsed.queryParams.refresh_token) {
							refreshToken = Array.isArray(parsed.queryParams.refresh_token)
								? parsed.queryParams.refresh_token[0]
								: parsed.queryParams.refresh_token;
						}
					}
				}

				if (accessToken && refreshToken) {
					const { error } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					});

					if (error) throw error;
					setInitializing(false);
				} else {
					// Check if we already have a valid session
					const {
						data: { session },
					} = await supabase.auth.getSession();
					if (session) {
						setInitializing(false);
					} else {
						throw new Error("No tokens found in URL");
					}
				}
			} catch (error: any) {
				console.error("Error handling password reset callback:", error);
				Alert.alert(
					"Enlace inválido",
					"Este enlace de recuperación ha expirado o es inválido. Por favor solicita uno nuevo.",
					[
						{
							text: "OK",
							onPress: () => router.replace("/login"),
						},
					]
				);
			}
		};

		// Handle app launch from deep link
		Linking.getInitialURL().then(handleDeepLink);

		// Handle deep link while app is running
		const subscription = Linking.addEventListener("url", ({ url }) =>
			handleDeepLink(url)
		);

		return () => {
			subscription.remove();
		};
	}, [router]);

	const handlePasswordUpdate = async () => {
		if (newPassword !== confirmPassword) {
			Alert.alert("Error", "Las contraseñas no coinciden");
			return;
		}

		if (newPassword.length < 6) {
			Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
			return;
		}

		try {
			setLoading(true);
			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) throw error;

			Alert.alert(
				"Éxito",
				"Tu contraseña ha sido actualizada correctamente",
				[
					{
						text: "OK",
						onPress: () => router.replace("/login"),
					},
				]
			);
		} catch (error: any) {
			if (
				error.message?.includes("expired") ||
				error.message?.includes("invalid")
			) {
				Alert.alert(
					"Enlace expirado",
					"Este enlace de recuperación ha expirado. Por favor solicita uno nuevo.",
					[
						{
							text: "OK",
							onPress: () => router.replace("/login"),
						},
					]
				);
			} else {
				Alert.alert("Error", error.message || "No se pudo actualizar la contraseña");
			}
		} finally {
			setLoading(false);
		}
	};

	const shouldShowValidation =
		newPassword.length > 0 ||
		confirmPassword.length > 0 ||
		isNewPasswordFocused ||
		isConfirmPasswordFocused;

	const passwordsMatch = newPassword === confirmPassword && newPassword.length >= 6;

	if (initializing) {
		return (
			<View
				style={[
					core.flex1,
					core.center,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={{ color: theme.colors.textSecondary, marginTop: 20 }}>
					Verificando enlace...
				</Text>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[core.safeArea, styles.container]}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				<View style={core.centeredContent}>
					<View style={styles.header}>
						<Ionicons
							name="lock-closed"
							size={64}
							color={theme.colors.primary}
							style={styles.icon}
						/>
						<Text style={styles.title}>Restablecer Contraseña</Text>
						<Text style={styles.subtitle}>
							Ingresa tu nueva contraseña segura
						</Text>
					</View>

					<View style={styles.formContainer}>
						<Input
							label="Nueva Contraseña"
							value={newPassword}
							onChangeText={setNewPassword}
							onFocus={() => setIsNewPasswordFocused(true)}
							onBlur={() => setIsNewPasswordFocused(false)}
							secureTextEntry
							placeholder="Mínimo 6 caracteres"
							containerStyle={styles.inputSpacing}
							borderColor={
								shouldShowValidation
									? passwordsMatch
										? theme.colors.success
										: theme.colors.error
									: undefined
							}
							rightIcon={
								shouldShowValidation ? (
									<Ionicons
										name={passwordsMatch ? "checkmark-circle" : "alert-circle"}
										size={20}
										color={
											passwordsMatch ? theme.colors.success : theme.colors.error
										}
									/>
								) : undefined
							}
						/>
						<Input
							label="Confirmar Contraseña"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							onFocus={() => setIsConfirmPasswordFocused(true)}
							onBlur={() => setIsConfirmPasswordFocused(false)}
							secureTextEntry
							placeholder="Repite la contraseña"
							containerStyle={styles.inputSpacing}
							borderColor={
								shouldShowValidation
									? passwordsMatch
										? theme.colors.success
										: theme.colors.error
									: undefined
							}
							rightIcon={
								shouldShowValidation ? (
									<Ionicons
										name={passwordsMatch ? "checkmark-circle" : "alert-circle"}
										size={20}
										color={
											passwordsMatch ? theme.colors.success : theme.colors.error
										}
									/>
								) : undefined
							}
						/>

						<Button
							title={loading ? "Actualizando..." : "Actualizar Contraseña"}
							onPress={handlePasswordUpdate}
							loading={loading}
							disabled={!passwordsMatch || loading}
							fullWidth
							variant="primary"
							style={styles.button}
						/>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: theme.colors.background,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		paddingVertical: theme.spacing.xl,
	},
	header: {
		alignItems: "center",
		marginBottom: theme.spacing.xl,
	},
	icon: {
		marginBottom: theme.spacing.md,
	},
	title: {
		...core.h1,
		color: theme.colors.primary,
		marginBottom: theme.spacing.sm,
		textAlign: "center",
	},
	subtitle: {
		...core.text,
		fontSize: theme.font.size.lg,
		color: theme.colors.textSecondary,
		textAlign: "center",
		marginBottom: theme.spacing.md,
	},
	formContainer: {
		width: "90%",
		maxWidth: 400,
	},
	inputSpacing: {
		marginBottom: theme.spacing.md,
	},
	button: {
		marginTop: theme.spacing.lg,
	},
});

