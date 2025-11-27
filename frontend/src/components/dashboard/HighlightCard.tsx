import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCard } from "../ui/AnimatedCard";
import { theme } from "../../styles/theme";
import { TopProduct } from "../../types/receipt.types";

interface HighlightCardProps {
	product: TopProduct;
	onPress: () => void;
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
	product,
	onPress,
}) => {
	return (
		<AnimatedCard style={styles.highlightCard} onPress={onPress}>
			<View style={styles.highlightHeader}>
				<Ionicons
					name="basket-outline"
					size={24}
					color={theme.colors.primary}
				/>
				<Text style={styles.highlightTitle}>Producto Más Comprado</Text>
			</View>
			<View style={styles.highlightContent}>
				<Text style={styles.highlightValue}>{product.name}</Text>
				<Text style={styles.highlightSubValue}>
					{product.count.toFixed(2).replace(/\.00$/, "")} Cant.
				</Text>
			</View>
			<View style={styles.tapHintContainer}>
				<Text style={styles.tapHint}>Ver Top 10</Text>
				<Ionicons
					name="chevron-forward"
					size={16}
					color={theme.colors.textSecondary}
				/>
			</View>
		</AnimatedCard>
	);
};

const styles = StyleSheet.create({
	highlightCard: {
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
	},
	highlightHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: theme.spacing.sm,
	},
	highlightTitle: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.regular,
		color: theme.colors.textSecondary,
		marginLeft: theme.spacing.sm,
	},
	highlightContent: {
		marginBottom: theme.spacing.sm,
	},
	highlightValue: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: 2,
	},
	highlightSubValue: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.regular,
		color: theme.colors.primary,
	},
	tapHintContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
	},
	tapHint: {
		fontSize: theme.font.size.sm,
		fontFamily: theme.font.family.regular,
		color: theme.colors.textSecondary,
		marginRight: 2,
	},
});
