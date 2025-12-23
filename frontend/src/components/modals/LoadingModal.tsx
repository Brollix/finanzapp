import React from "react";
import { View, Text, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { theme } from "@/styles/theme";
import { core } from "@/styles/core.styles";

interface LoadingModalProps {
	visible: boolean;
	text?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
	visible,
	text = "Cargando...",
}) => {
	return (
		<Modal transparent visible={visible} animationType="fade">
			<View style={core.modalBackdropCentered}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={styles.loadingModalText}>{text}</Text>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	loadingModalText: {
		marginTop: theme.spacing.sm,
		color: theme.colors.text,
		fontFamily: theme.font.family.regular,
		fontSize: theme.font.size.md,
	},
});
