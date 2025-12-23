import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { theme } from "@/styles/theme";

interface DashboardActionCardProps {
	hasTickets: boolean;
	onPress: () => void;
}

export const DashboardActionCard: React.FC<DashboardActionCardProps> = ({
	hasTickets,
	onPress,
}) => {
	return (
		<AnimatedCard style={styles.dashboardCard} onPress={onPress}>
			<View style={styles.dashboardContent}>
				<View>
					<Text style={styles.dashboardTitle}>
						{hasTickets ? "Ver Todos los Tickets" : "Cargar Ticket"}
					</Text>
					<Text style={styles.dashboardSubtitle}>
						{hasTickets
							? "Accede al dashboard completo"
							: "No tienes tickets. ¡Carga uno ahora!"}
					</Text>
				</View>
				<Ionicons
					name={hasTickets ? "arrow-forward-circle" : "add-circle"}
					size={40}
					color={theme.colors.primary}
				/>
			</View>
		</AnimatedCard>
	);
};

const styles = StyleSheet.create({
	dashboardCard: {
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.lg,
	},
	dashboardContent: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	dashboardTitle: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.onPrimary,
		marginBottom: theme.spacing.xs,
	},
	dashboardSubtitle: {
		fontSize: theme.font.size.sm,
		fontFamily: theme.font.family.regular,
		color: theme.colors.onPrimary,
		opacity: 0.9,
	},
});
