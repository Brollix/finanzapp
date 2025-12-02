import React from "react";
import {
	Modal,
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TouchableWithoutFeedback,
} from "react-native";
import { styles } from "../../styles/index.styles";
import { theme } from "../../styles/theme";

import { ReceiptItem } from "../../types/receipt.types";
import { formatCurrency } from "../../utils/formatCurrency";

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
				<View style={localStyles.backdrop}>
					<TouchableWithoutFeedback>
						<View
							style={[
								localStyles.modalContainer,
								{ width: "100%", alignItems: "stretch" },
							]}
						>
							<View style={localStyles.header}>
								<Text style={localStyles.title}>Detalle del Producto</Text>
								<TouchableOpacity onPress={onClose}>
									<Text style={localStyles.closeButton}>✕</Text>
								</TouchableOpacity>
							</View>

							<View style={localStyles.productInfo}>
								<Text style={localStyles.productName}>{item.product}</Text>
								{!!item.brand && (
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
										${formatCurrency(item.price)}
									</Text>
								</View>

								<View style={[localStyles.detailRow, localStyles.highlightRow]}>
									<Text style={localStyles.highlightLabel}>
										Precio por {isWeight ? "kilo" : "unidad"}:
									</Text>
									<Text style={localStyles.highlightValue}>
										${formatCurrency(unitPrice)}
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
	backdrop: {
		flex: 1,
		backgroundColor: theme.colors.backdrop,
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.xl,
		padding: theme.spacing.xl,
		margin: theme.spacing.lg,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.lg,
	},
	title: {
		fontSize: theme.font.size.h4,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	closeButton: {
		fontSize: theme.font.size.h4,
		color: theme.colors.textSecondary,
		padding: theme.spacing.xs,
	},
	productInfo: {
		marginBottom: theme.spacing.xl,
	},
	productName: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	brandName: {
		fontSize: theme.font.size.xl,
		color: theme.colors.textTertiary,
	},
	detailsContainer: {
		backgroundColor: theme.colors.background,
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
