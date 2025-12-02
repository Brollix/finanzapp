import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../styles/theme";
import { core } from "../../styles/core.styles";
import { formatCurrency } from "../../utils/formatCurrency";

interface SavingsSummaryCardProps {
	totalSaved: number;
	bestStore: string;
	onPress: () => void;
}

export const SavingsSummaryCard: React.FC<SavingsSummaryCardProps> = ({
	totalSaved,
	bestStore,
	onPress,
}) => {
	if (totalSaved === 0) return null;

	return (
		<Pressable
			style={({ pressed }) => [
				styles.container,
				pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
			]}
			onPress={onPress}
		>
			<View style={styles.content}>
				<View style={styles.iconContainer}>
					<Ionicons name="pricetag" size={24} color={theme.colors.success} />
				</View>
				<View style={styles.infoContainer}>
					<Text style={styles.label}>Total Ahorrado</Text>
					<Text style={styles.amount}>${formatCurrency(totalSaved)}</Text>
					{bestStore && (
						<Text style={styles.bestStore}>
							Mejor en: <Text style={styles.storeName}>{bestStore}</Text>
						</Text>
					)}
				</View>
				<Ionicons
					name="chevron-forward"
					size={20}
					color={theme.colors.textSecondary}
				/>
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		elevation: 2,
		shadowColor: theme.colors.background,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		borderLeftWidth: 4,
		borderLeftColor: theme.colors.success,
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: theme.colors.backgroundVariant, // success with opacity
		justifyContent: "center",
		alignItems: "center",
		marginRight: theme.spacing.md,
	},
	infoContainer: {
		flex: 1,
	},
	label: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
		fontFamily: theme.font.family.regular,
	},
	amount: {
		fontSize: theme.font.size.h2,
		color: theme.colors.success,
		fontFamily: theme.font.family.bold,
	},
	bestStore: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
		marginTop: 2,
	},
	storeName: {
		color: theme.colors.text,
		fontFamily: theme.font.family.bold,
	},
});
