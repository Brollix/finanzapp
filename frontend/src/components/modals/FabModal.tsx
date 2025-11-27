import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../ui/Button";
import { core } from "../../styles/core.styles";
import { theme } from "../../styles/theme";

interface FabModalProps {
	visible: boolean;
	onClose: () => void;
	onScan: () => void;
	onManual: () => void;
}

export const FabModal: React.FC<FabModalProps> = ({
	visible,
	onClose,
	onScan,
	onManual,
}) => {
	return (
		<Modal
			transparent
			visible={visible}
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable style={core.modalBackdrop} onPressOut={onClose}>
				<View style={core.modalContainer}>
					<Text style={styles.fabModalTitle}>Agregar Registro</Text>
					<Button
						title="Escanear Ticket"
						onPress={onScan}
						fullWidth
						style={styles.fabModalButton}
						leftIcon={<Ionicons name="camera-outline" />}
					/>
					<Button
						title="Agregar Manualmente"
						onPress={onManual}
						fullWidth
						variant="secondary"
						style={styles.fabModalButton}
						leftIcon={<Ionicons name="create-outline" />}
					/>
				</View>
			</Pressable>
		</Modal>
	);
};

const styles = StyleSheet.create({
	fabModalTitle: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.lg,
		textAlign: "center",
	},
	fabModalButton: {
		marginTop: theme.spacing.sm,
	},
});
