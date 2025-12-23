import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
	View,
	Text,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
	StyleSheet,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { Button } from "../src/components/ui/Button";

export default function EmailConfirmationScreen() {
	const { resendConfirmationEmail } = useAuth();
	const router = useRouter();
	const params = useLocalSearchParams();
	const email = (params.email as string) || "";

	const [loading, setLoading] = useState(false);
	const [cooldown, setCooldown] = useState(0);

	useEffect(() => {
		if (cooldown > 0) {
			const timer = setTimeout(() => {
				setCooldown(cooldown - 1);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [cooldown]);

	const handleResend = async () => {
		if (!email) {
			Alert.alert("Error", "No se encontró el email");
			return;
		}

		if (cooldown > 0) {
			return;
		}

		setLoading(true);
		try {
			await resendConfirmationEmail(email);
			setCooldown(60); // 60 segundos de cooldown
			Alert.alert(
				"Email enviado",
				"Se ha reenviado el email de confirmación. Por favor revisa tu bandeja de entrada."
			);
		} catch (error: any) {
			Alert.alert("Error", error.message || "No se pudo reenviar el email");
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[core.safeArea, styles.container]}
		>
			<View style={core.centeredContent}>
				<View style={styles.iconContainer}>
					<Ionicons
						name="mail-outline"
						size={80}
						color={theme.colors.primary}
					/>
				</View>

				<View style={styles.contentContainer}>
					<Text style={styles.title}>Confirma tu email</Text>
					<Text style={styles.subtitle}>
						Hemos enviado un email de confirmación a:
					</Text>
					<Text style={styles.email}>{email}</Text>
					<Text style={styles.instructions}>
						Por favor revisa tu bandeja de entrada y haz clic en el enlace para
						confirmar tu cuenta.
					</Text>
				</View>

				<View style={styles.actionsContainer}>
					<Button
						title={
							loading
								? "Enviando..."
								: cooldown > 0
								? `Reenviar en ${cooldown}s`
								: "Reenviar email"
						}
						onPress={handleResend}
						disabled={loading || cooldown > 0}
						fullWidth
						variant="primary"
						style={styles.resendButton}
					/>

					<TouchableOpacity
						onPress={() => router.replace("/login")}
						style={styles.backLink}
					>
						<Text style={core.linkText}>Volver al inicio de sesión</Text>
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
	iconContainer: {
		alignItems: "center",
		marginBottom: theme.spacing.xl,
	},
	contentContainer: {
		width: "90%",
		maxWidth: 400,
		alignItems: "center",
		marginBottom: theme.spacing.xl,
	},
	title: {
		...core.h1,
		color: theme.colors.primary,
		marginBottom: theme.spacing.md,
		textAlign: "center",
	},
	subtitle: {
		...core.text,
		fontSize: theme.font.size.md,
		color: theme.colors.textSecondary,
		textAlign: "center",
		marginBottom: theme.spacing.sm,
	},
	email: {
		...core.text,
		fontSize: theme.font.size.md,
		color: theme.colors.primary,
		fontWeight: theme.font.weight.bold,
		textAlign: "center",
		marginBottom: theme.spacing.md,
	},
	instructions: {
		...core.text,
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
		textAlign: "center",
		lineHeight: 20,
	},
	actionsContainer: {
		width: "90%",
		maxWidth: 400,
		alignItems: "center",
	},
	resendButton: {
		marginBottom: theme.spacing.md,
	},
	backLink: {
		marginTop: theme.spacing.md,
	},
});

