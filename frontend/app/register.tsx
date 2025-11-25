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
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";

function RegisterForm() {
	const { signUp } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const router = useRouter();

	const handleRegister = async () => {
		if (!email || !password) {
			alert("Por favor ingresa tu correo y contraseña");
			return;
		}

		setLoading(true);
		try {
			await signUp({ email, password });
			router.replace("/profile-setup");
		} catch (error: any) {
			console.error("Error al registrarse:", error);
			alert(error.message || "Error al crear la cuenta.");
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
				title={loading ? "Creando cuenta..." : "Registrarse"}
				onPress={handleRegister}
				disabled={loading}
				fullWidth
				variant="primary"
				style={styles.button}
			/>
		</View>
	);
}

export default function RegisterScreen() {
	const router = useRouter();

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[core.safeArea, styles.container]}
		>
			<View style={core.centeredContent}>
				<View style={styles.authHeader}>
					<Text style={styles.authTitle}>Crear Cuenta</Text>
					<Text style={styles.subtitle}>Únete a Finanzapp hoy.</Text>
				</View>

				<RegisterForm />

				<View>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.loginLink}
					>
						<Text style={core.linkText}>
							¿Ya tienes una cuenta? Inicia sesión
						</Text>
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
	loginLink: {
		marginTop: theme.spacing.lg,
	},
});
