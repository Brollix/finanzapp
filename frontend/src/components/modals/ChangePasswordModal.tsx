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
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/context/AlertContext";

interface ChangePasswordModalProps {
	visible: boolean;
	onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
	visible,
	onClose,
}) => {
	const { showAlert } = useAlert();
	const [loading, setLoading] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
	const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
		useState(false);

	const handlePasswordUpdate = async () => {
		if (newPassword !== confirmPassword) {
			showAlert("Error", "Las contraseñas no coinciden", undefined, "error");
			return;
		}

		if (newPassword.length < 6) {
			showAlert("Error", "La contraseña debe tener al menos 6 caracteres", undefined, "error");
			return;
		}

		try {
			setLoading(true);
			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) throw error;

			showAlert("Éxito", "Contraseña actualizada correctamente", undefined, "success");
			handleClose();
		} catch (error: any) {
			showAlert("Error", error.message, undefined, "error");
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setNewPassword("");
		setConfirmPassword("");
		onClose();
	};

	const shouldShowValidation =
		newPassword.length > 0 ||
		confirmPassword.length > 0 ||
		isNewPasswordFocused ||
		isConfirmPasswordFocused;

	const passwordsMatch = newPassword === confirmPassword;

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
						<Text style={styles.modalTitle}>Cambiar Contraseña</Text>
						<Pressable onPress={handleClose}>
							<Ionicons name="close" size={24} color={theme.colors.text} />
						</Pressable>
					</View>
					<Text style={styles.modalSubtitle}>
						Ingresa tu nueva contraseña segura
					</Text>

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

					<View style={styles.modalActions}>
						<Button
							title="Cancelar"
							onPress={handleClose}
							variant="outline"
							style={styles.flex1}
						/>
						<View style={{ width: theme.spacing.md }} />
						<Button
							title="Actualizar"
							onPress={handlePasswordUpdate}
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
