import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCard } from "../ui/AnimatedCard";
import { theme } from "../../styles/theme";
import { Statistics } from "../../types/receipt.types";
import { formatCurrency } from "../../utils/formatCurrency";

interface StatsGridProps {
	statistics: Statistics;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ statistics }) => {
	return (
		<View style={styles.statsGrid}>
			<View style={styles.statCardWrapper}>
				<AnimatedCard style={styles.statCard}>
					<Ionicons
						name="receipt-outline"
						size={32}
						color={theme.colors.primary}
						style={styles.statIcon}
					/>
					<Text style={styles.statValue}>{statistics.totalTickets}</Text>
					<Text style={styles.statLabel}>Tickets</Text>
				</AnimatedCard>
			</View>

			<View style={styles.statCardWrapper}>
				<AnimatedCard style={styles.statCard}>
					<Ionicons
						name="cash-outline"
						size={32}
						color={theme.colors.secondary}
						style={styles.statIcon}
					/>
					<Text style={styles.statValue}>
						${formatCurrency(statistics.totalSpent)}
					</Text>
					<Text style={styles.statLabel}>Total Gastado</Text>
				</AnimatedCard>
			</View>

			<View style={styles.statCardWrapper}>
				<AnimatedCard style={styles.statCard}>
					<Ionicons
						name="trending-up-outline"
						size={32}
						color={theme.colors.warning}
						style={styles.statIcon}
					/>
					<Text style={styles.statValue}>
						${formatCurrency(statistics.averageTicket)}
					</Text>
					<Text style={styles.statLabel}>Promedio</Text>
				</AnimatedCard>
			</View>

			<View style={styles.statCardWrapper}>
				<AnimatedCard style={styles.statCard}>
					<Ionicons
						name="cart-outline"
						size={32}
						color={theme.colors.success}
						style={styles.statIcon}
					/>
					<Text style={styles.statValue}>{statistics.totalItems}</Text>
					<Text style={styles.statLabel}>Productos</Text>
				</AnimatedCard>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginBottom: theme.spacing.md,
	},
	statCardWrapper: {
		width: "48%",
		marginBottom: theme.spacing.md,
	},
	statCard: {
		width: "100%",
		padding: theme.spacing.lg,
		alignItems: "center",
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
	},
	statIcon: {
		marginBottom: theme.spacing.sm,
	},
	statValue: {
		fontSize: theme.font.size.h6,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	statLabel: {
		fontSize: theme.font.size.sm,
		fontFamily: theme.font.family.regular,
		color: theme.colors.textSecondary,
		textAlign: "center",
	},
});
