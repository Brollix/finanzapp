import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
	View,
	Text,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
	StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";
import { ForgotPasswordModal } from "../src/components/modals/ForgotPasswordModal";
import { useAlert } from "@/context/AlertContext";

function LoginForm() {
	const { showAlert } = useAlert();
	const { signIn, resendConfirmationEmail } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);

	const router = useRouter();

	const handleLogin = async () => {
		if (!email || !password) {
			alert("Por favor ingresa tu correo y contraseña");
			return;
		}

		setLoading(true);
		try {
			await signIn({ email, password }, rememberMe);
			router.replace("/");
		} catch (error: any) {
			// Manejar error de email no verificado
			if (
				error.message?.includes("Email not confirmed") ||
				error.message?.includes("email_not_confirmed")
			) {
				showAlert(
					"Email no verificado",
					"Por favor confirma tu email antes de iniciar sesión. ¿Quieres reenviar el email de confirmación?",
					[
						{
							text: "Cancelar",
							style: "cancel",
						},
						{
							text: "Reenviar",
							onPress: async () => {
								try {
									await resendConfirmationEmail(email);
									showAlert(
										"Éxito",
										"Email reenviado. Revisa tu bandeja de entrada.",
										undefined,
										"success"
									);
								} catch (e: any) {
									showAlert(
										"Error",
										e.message || "No se pudo reenviar el email",
										undefined,
										"error"
									);
								}
							},
						},
					],
					"warning"
				);
			} else if (error.message?.includes("Invalid login credentials")) {
				// Solo logueamos el error si NO es credenciales inválidas
				showAlert(
					"Error de inicio de sesión",
					"Email o contraseña incorrectos. ¿Quieres crear una cuenta nueva?",
					[
						{
							text: "Intentar de nuevo",
							style: "cancel",
						},
						{
							text: "Crear cuenta",
							onPress: () => router.push("/register"),
						},
					],
					"error"
				);
			} else {
				showAlert(
					"Error de inicio de sesión",
					error.message || "No pudimos iniciar sesión. Inténtalo de nuevo.",
					undefined,
					"error"
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.formContainer}>
			<Input
				label="Correo electrónico"
				placeholder="tucorreo@example.com"
				value={email}
				onChangeText={setEmail}
				autoCapitalize="none"
				autoComplete="email"
				keyboardType="email-address"
			/>
			<Input
				label="Contraseña"
				placeholder="••••••••"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<View style={styles.rememberMeContainer}>
				<TouchableOpacity
					onPress={() => setRememberMe(!rememberMe)}
					style={styles.checkboxContainer}
					activeOpacity={0.7}
				>
					<Ionicons
						name={rememberMe ? "checkbox" : "square-outline"}
						size={24}
						color={
							rememberMe ? theme.colors.primary : theme.colors.textSecondary
						}
					/>
					<Text style={styles.rememberMeText}>Recordarme</Text>
				</TouchableOpacity>
			</View>
			<Button
				title={loading ? "Cargando..." : "Iniciar sesión"}
				onPress={handleLogin}
				disabled={loading}
				fullWidth
				variant="primary"
				style={styles.button}
			/>
		</View>
	);
}

export default function LoginScreen() {
	const router = useRouter();
	const [forgotPasswordModalVisible, setForgotPasswordModalVisible] =
		useState(false);

	const handleForgotPassword = () => {
		setForgotPasswordModalVisible(true);
	};

	const handleRegister = () => {
		router.push("/register");
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[core.safeArea, styles.container]}
		>
			<View style={core.centeredContent}>
				<View style={styles.authHeader}>
					<Text style={styles.authTitle}>Finanzapp</Text>
					<Text style={styles.subtitle}>Inicia sesión para continuar.</Text>
				</View>

				<LoginForm />

				<View>
					<TouchableOpacity
						onPress={handleForgotPassword}
						style={styles.forgotPassword}
					>
						<Text style={core.linkText}>¿Olvidaste tu contraseña?</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={handleRegister}
						style={styles.registerLink}
					>
						<Text style={core.linkText}>¿No tienes una cuenta?</Text>
					</TouchableOpacity>
				</View>

				<ForgotPasswordModal
					visible={forgotPasswordModalVisible}
					onClose={() => setForgotPasswordModalVisible(false)}
				/>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: theme.colors.background,
	},
	authHeader: {
		alignItems: "center",
		marginBottom: theme.spacing.lg,
	},
	authTitle: {
		...core.h1,
		color: theme.colors.primary,
		marginBottom: theme.spacing.sm,
	},
	formContainer: {
		width: "90%",
		maxWidth: 400,
	},
	subtitle: {
		...core.text,
		fontSize: theme.font.size.lg,
		color: theme.colors.secondary,
		textAlign: "center",
		marginBottom: theme.spacing.md,
	},
	button: {
		marginTop: theme.spacing.md,
	},
	rememberMeContainer: {
		marginTop: theme.spacing.md,
		marginBottom: theme.spacing.sm,
	},
	checkboxContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	rememberMeText: {
		...core.text,
		fontSize: theme.font.size.sm,
		color: theme.colors.text,
		marginLeft: theme.spacing.sm,
	},
	forgotPassword: {
		marginTop: theme.spacing.lg,
	},
	registerLink: {
		marginTop: theme.spacing.sm,
	},
});
