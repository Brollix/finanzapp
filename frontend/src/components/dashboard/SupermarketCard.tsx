import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCard } from "../ui/AnimatedCard";
import { theme } from "../../styles/theme";

interface SupermarketCardProps {
	supermarketName: string;
}

export const SupermarketCard: React.FC<SupermarketCardProps> = ({
	supermarketName,
}) => {
	return (
		<AnimatedCard style={styles.supermarketCard}>
			<View style={styles.supermarketHeader}>
				<Ionicons
					name="storefront-outline"
					size={24}
					color={theme.colors.primary}
				/>
				<Text style={styles.supermarketTitle}>Supermercado Frecuente</Text>
			</View>
			<Text style={styles.supermarketName}>{supermarketName}</Text>
		</AnimatedCard>
	);
};

const styles = StyleSheet.create({
	supermarketCard: {
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
	},
	supermarketHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: theme.spacing.sm,
	},
	supermarketTitle: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.regular,
		color: theme.colors.textSecondary,
		marginLeft: theme.spacing.sm,
	},
	supermarketName: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
});
