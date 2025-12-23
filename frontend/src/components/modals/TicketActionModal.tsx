import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "@/styles/theme";
import { core } from "@/styles/core.styles";
import { Button } from "../ui/Button";
import { Ionicons } from "@expo/vector-icons";

interface TicketActionModalProps {
	visible: boolean;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

export const TicketActionModal: React.FC<TicketActionModalProps> = ({
	visible,
	onClose,
	onEdit,
	onDelete,
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
					<Text style={styles.title}>Opciones del Ticket</Text>
					<Text style={styles.message}>¿Qué deseas hacer con este ticket?</Text>

					<View style={styles.buttonContainer}>
						<Button
							title="Editar"
							onPress={onEdit}
							variant="primary"
							style={styles.button}
							leftIcon={<Ionicons name="create-outline" />}
						/>
						<Button
							title="Eliminar"
							onPress={onDelete}
							variant="danger"
							style={styles.button}
							leftIcon={<Ionicons name="trash-outline" />}
						/>
					</View>

					<Button
						title="Cancelar"
						onPress={onClose}
						variant="outline"
						style={styles.cancelButton}
					/>
				</View>
			</Pressable>
		</Modal>
	);
};

const styles = StyleSheet.create({
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
	},
	buttonContainer: {
		width: "100%",
		gap: theme.spacing.md,
		marginBottom: theme.spacing.md,
	},
	button: {
		width: "100%",
	},
	cancelButton: {
		width: "100%",
		marginTop: theme.spacing.xs,
	},
});
