import React from "react";
import { View, Text, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { theme } from "../../styles/theme";

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
			<View style={styles.loadingModalContainer}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={styles.loadingModalText}>{text}</Text>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	loadingModalContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: theme.colors.backdrop,
	},
	loadingModalText: {
		marginTop: theme.spacing.sm,
		color: theme.colors.text,
		fontFamily: theme.font.family.regular,
		fontSize: theme.font.size.md,
	},
});
