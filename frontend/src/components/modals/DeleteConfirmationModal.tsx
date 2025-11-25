import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "@/styles/theme";
import { styles as globalStyles } from "@/styles/index.styles";
import { Button } from "../ui/Button";
import { Ionicons } from "@expo/vector-icons";

interface DeleteConfirmationModalProps {
	visible: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title?: string;
	message?: string;
}

export const DeleteConfirmationModal: React.FC<
	DeleteConfirmationModalProps
> = ({
	visible,
	onClose,
	onConfirm,
	title = "Eliminar elemento",
	message = "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.",
}) => {
	return (
		<Modal
			transparent
			visible={visible}
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable style={styles.backdrop} onPress={onClose}>
				<View
					style={[globalStyles.centeredModalContent, styles.container]}
					onStartShouldSetResponder={() => true}
				>
					<View style={styles.iconContainer}>
						<Ionicons
							name="trash-outline"
							size={32}
							color={theme.colors.error}
						/>
					</View>

					<Text style={styles.title}>{title}</Text>
					<Text style={styles.message}>{message}</Text>

					<View style={styles.buttonContainer}>
						<Button
							title="Cancelar"
							onPress={onClose}
							variant="secondary"
							style={StyleSheet.flatten([styles.button, styles.cancelButton])}
						/>
						<Button
							title="Eliminar"
							onPress={onConfirm}
							variant="danger"
							style={StyleSheet.flatten([styles.button, styles.deleteButton])}
						/>
					</View>
				</View>
			</Pressable>
		</Modal>
	);
};

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: theme.colors.backdrop,
		justifyContent: "center",
		alignItems: "center",
	},
	container: {
		width: "100%",
		maxWidth: 400,
		alignItems: "center",
		backgroundColor: theme.colors.backgroundVariant,
	},
	iconContainer: {
		width: 64,
		height: 64,
		borderRadius: theme.borderRadius.full,
		backgroundColor: theme.colors.background,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: theme.spacing.md,
	},
	title: {
		fontSize: theme.font.size.h4,
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
		flexDirection: "row",
		gap: theme.spacing.md,
		width: "100%",
	},
	button: {
		flex: 1,
	},
	cancelButton: {
		backgroundColor: theme.colors.success,
	},
	deleteButton: {
		backgroundColor: theme.colors.secondary,
	},
});
