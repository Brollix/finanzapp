import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
	View,
	Text,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
	StyleSheet,
	Alert,
} from "react-native";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";

function LoginForm() {
	const { signIn } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const router = useRouter();

	const handleLogin = async () => {
		if (!email || !password) {
			alert("Por favor ingresa tu correo y contraseña");
			return;
		}

		setLoading(true);
		try {
			await signIn({ email, password });
			router.replace("/");
		} catch (error: any) {
			// Solo logueamos el error si NO es credenciales inválidas
			if (!error.message?.includes("Invalid login credentials")) {
				console.error("Error al iniciar sesión:", error);
			}

			Alert.alert(
				"Error de inicio de sesión",
				"No pudimos iniciar sesión. ¿Quieres crear una cuenta nueva?",
				[
					{
						text: "Intentar de nuevo",
						style: "cancel",
					},
					{
						text: "Crear cuenta",
						onPress: () => router.push("/register"),
					},
				]
			);
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

	const handleForgotPassword = () => {
		alert("Función de recuperación de contraseña");
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
	forgotPassword: {
		marginTop: theme.spacing.lg,
	},
	registerLink: {
		marginTop: theme.spacing.sm,
	},
});
