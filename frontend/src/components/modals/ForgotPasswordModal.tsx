import React, { useState } from "react";
import {
	View,
	Text,
	Modal,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { theme } from "@/styles/theme";
import { core } from "@/styles/core.styles";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAlert } from "@/context/AlertContext";

interface ForgotPasswordModalProps {
	visible: boolean;
	onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
	visible,
	onClose,
}) => {
	const { showAlert } = useAlert();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const { resetPassword } = useAuth();

	const handleResetPassword = async () => {
		if (!email.trim()) {
			showAlert("Error", "Por favor ingresa tu correo electrónico", undefined, "error");
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			showAlert("Error", "Por favor ingresa un correo electrónico válido", undefined, "error");
			return;
		}

		try {
			setLoading(true);
			await resetPassword(email);
			showAlert(
				"Éxito",
				"Revisa tu correo electrónico para restablecer tu contraseña",
				[
					{
						text: "OK",
						onPress: () => {
							setEmail("");
							onClose();
						},
					},
				],
				"success"
			);
		} catch (error: any) {
			showAlert(
				"Error",
				error.message || "No se pudo enviar el email de recuperación",
				undefined,
				"error"
			);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setEmail("");
		onClose();
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={handleClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={core.modalBackdrop}
			>
				<View style={[core.modalContainer, styles.modalContent]}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Recuperar Contraseña</Text>
						<Pressable onPress={handleClose}>
							<Ionicons name="close" size={24} color={theme.colors.text} />
						</Pressable>
					</View>
					<Text style={styles.modalSubtitle}>
						Ingresa tu correo electrónico y te enviaremos un enlace para
						restablecer tu contraseña
					</Text>

					<Input
						label="Correo electrónico"
						placeholder="tucorreo@example.com"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						autoComplete="email"
						keyboardType="email-address"
						containerStyle={styles.inputSpacing}
						leftIcon={
							<Ionicons
								name="mail-outline"
								size={20}
								color={theme.colors.textSecondary}
							/>
						}
					/>

					<View style={styles.modalActions}>
						<Button
							title="Cancelar"
							onPress={handleClose}
							variant="outline"
							style={styles.flex1}
						/>
						<View style={{ width: theme.spacing.md }} />
						<Button
							title="Enviar"
							onPress={handleResetPassword}
							loading={loading}
							style={styles.flex1}
						/>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalContent: {
		paddingBottom: theme.spacing.xl * 2,
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.xs,
	},
	modalTitle: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		flex: 1,
	},
	modalSubtitle: {
		fontSize: theme.font.size.md,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xl,
	},
	inputSpacing: {
		marginBottom: theme.spacing.md,
	},
	modalActions: {
		marginTop: theme.spacing.lg,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	flex1: {
		flex: 1,
	},
});
