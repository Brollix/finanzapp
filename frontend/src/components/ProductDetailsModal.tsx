import React from "react";
import {
	Modal,
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TouchableWithoutFeedback,
} from "react-native";
import { styles } from "../styles/index.styles";
import { theme } from "../styles/theme";

import { ReceiptItem } from "../types/receipt.types";

interface ProductDetailsModalProps {
	visible: boolean;
	onClose: () => void;
	item: ReceiptItem | null;
}

export const ProductDetailsModal = ({
	visible,
	onClose,
	item,
}: ProductDetailsModalProps) => {
	if (!item) return null;

	const unitPrice = item.price / item.quantity;
	const isWeight = !Number.isInteger(item.quantity);

	return (
		<Modal
			animationType="slide"
			transparent={true}
			visible={visible}
			onRequestClose={onClose}
		>
			<TouchableWithoutFeedback onPress={onClose}>
				<View style={styles.modalBackdrop}>
					<TouchableWithoutFeedback>
						<View
							style={[
								styles.modalContainer,
								{ width: "100%", alignItems: "stretch" },
							]}
						>
							<View style={localStyles.header}>
								<Text style={styles.h4}>Detalle del Producto</Text>
								<TouchableOpacity onPress={onClose}>
									<Text style={localStyles.closeButton}>✕</Text>
								</TouchableOpacity>
							</View>

							<View style={localStyles.productInfo}>
								<Text style={styles.h3}>{item.product}</Text>
								{item.brand && (
									<Text style={localStyles.brandName}>{item.brand}</Text>
								)}
							</View>

							<View style={localStyles.detailsContainer}>
								<View style={localStyles.detailRow}>
									<Text style={localStyles.label}>Cantidad:</Text>
									<Text style={localStyles.value}>
										{item.quantity} {isWeight ? "kg" : "u"}
									</Text>
								</View>

								<View style={localStyles.detailRow}>
									<Text style={localStyles.label}>Precio Total:</Text>
									<Text style={localStyles.value}>
										${item.price.toFixed(2)}
									</Text>
								</View>

								<View style={[localStyles.detailRow, localStyles.highlightRow]}>
									<Text style={localStyles.highlightLabel}>
										Precio por {isWeight ? "kilo" : "unidad"}:
									</Text>
									<Text style={localStyles.highlightValue}>
										${unitPrice.toFixed(2)}
									</Text>
								</View>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

const localStyles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.lg,
	},
	closeButton: {
		fontSize: theme.font.size.h4,
		color: theme.colors.textSecondary,
		padding: theme.spacing.xs,
	},
	productInfo: {
		marginBottom: theme.spacing.xl,
	},
	brandName: {
		fontSize: theme.font.size.xl,
		color: theme.colors.textSecondary,
	},
	detailsContainer: {
		backgroundColor: theme.colors.surfaceVariant,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: theme.spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	label: {
		fontSize: theme.font.size.md,
		color: theme.colors.textSecondary,
	},
	value: {
		fontSize: theme.font.size.lg,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	highlightRow: {
		borderBottomWidth: 0,
		marginTop: theme.spacing.sm,
		paddingTop: theme.spacing.md,
	},
	highlightLabel: {
		fontSize: theme.font.size.lg,
		color: theme.colors.primary,
		fontFamily: theme.font.family.bold,
	},
	highlightValue: {
		fontSize: theme.font.size.xl,
		color: theme.colors.primary,
		fontFamily: theme.font.family.bold,
	},
});
