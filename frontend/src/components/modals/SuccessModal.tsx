import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "@/styles/theme";
import { core } from "@/styles/core.styles";
import { Button } from "../ui/Button";
import { Ionicons } from "@expo/vector-icons";

interface SuccessModalProps {
	visible: boolean;
	onClose: () => void;
	title?: string;
	message?: string;
	buttonText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
	visible,
	onClose,
	title = "Éxito",
	message = "Operación realizada correctamente.",
	buttonText = "Continuar",
}) => {
	return (
		<Modal
			transparent
			visible={visible}
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable style={core.modalBackdropCentered} onPress={onClose}>
				<View
					style={core.modalContentCentered}
					onStartShouldSetResponder={() => true}
				>
					<View style={styles.iconContainer}>
						<Ionicons
							name="checkmark-circle-outline"
							size={64}
							color={theme.colors.success}
						/>
					</View>

					<Text style={styles.title}>{title}</Text>
					<Text style={styles.message}>{message}</Text>

					<View style={styles.buttonContainer}>
						<Button
							title={buttonText}
							onPress={onClose}
							variant="primary"
							style={styles.button}
						/>
					</View>
				</View>
			</Pressable>
		</Modal>
	);
};

const styles = StyleSheet.create({
	iconContainer: {
		marginBottom: theme.spacing.md,
	},
	title: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.sm,
		textAlign: "center",
	},
	message: {
		fontSize: theme.font.size.md,
		color: theme.colors.textSecondary,
		textAlign: "center",
		marginBottom: theme.spacing.xl,
		fontFamily: theme.font.family.regular,
		lineHeight: theme.font.size.md * 1.5,
	},
	buttonContainer: {
		width: "100%",
	},
	button: {
		width: "100%",
	},
});
