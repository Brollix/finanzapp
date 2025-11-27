import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
	View,
	Text,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
} from "react-native";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";

export default function ProfileSetupScreen() {
	const { updateProfile, user } = useAuth();
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSave = async () => {
		if (!username.trim()) {
			alert("Por favor elige un nombre de usuario");
			return;
		}

		setLoading(true);
		try {
			await updateProfile({
				username: username.trim(),
				email: user?.email || "",
			});
			router.replace("/");
		} catch (error: any) {
			console.error("Error al guardar perfil:", error);
			if (error.message?.includes("unique constraint")) {
				alert("Este nombre de usuario ya está en uso. Por favor elige otro.");
			} else {
				alert("Error al guardar el perfil. Inténtalo de nuevo.");
			}
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
				<View style={styles.header}>
					<Text style={styles.title}>Configura tu Perfil</Text>
					<Text style={styles.subtitle}>
						Elige un nombre de usuario único para identificarte.
					</Text>
				</View>

				<View style={styles.formContainer}>
					<Input
						label="Nombre de usuario"
						placeholder="usuario123"
						value={username}
						onChangeText={setUsername}
						autoCapitalize="none"
						autoCorrect={false}
					/>

					<Button
						title={loading ? "Guardando..." : "Continuar"}
						onPress={handleSave}
						disabled={loading}
						fullWidth
						variant="primary"
						style={styles.button}
					/>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: theme.colors.background,
	},
	header: {
		alignItems: "center",
		marginBottom: theme.spacing.lg,
	},
	title: {
		...core.h1,
		color: theme.colors.primary,
		marginBottom: theme.spacing.sm,
	},
	subtitle: {
		...core.text,
		fontSize: theme.font.size.lg,
		color: theme.colors.secondary,
		textAlign: "center",
		marginBottom: theme.spacing.md,
	},
	formContainer: {
		width: "90%",
		maxWidth: 400,
	},
	button: {
		marginTop: theme.spacing.md,
	},
});
