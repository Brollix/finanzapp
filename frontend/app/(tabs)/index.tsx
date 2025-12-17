import { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { TopProductsModal } from "../../src/components/modals/TopProductsModal";
import { receiptApi } from "../../src/services/receiptApi";
import { Receipt } from "../../src/types/receipt.types";
import { useAuth } from "../../src/features/auth/context/AuthContext";
import { core } from "../../src/styles/core.styles";
import { theme } from "../../src/styles/theme";
import { calculateStatistics } from "../../src/utils/statistics";
import { Statistics } from "../../src/types/receipt.types";
import { StatsGrid } from "../../src/components/dashboard/StatsGrid";
import { HighlightCard } from "../../src/components/dashboard/HighlightCard";
import { SupermarketCard } from "../../src/components/dashboard/SupermarketCard";
import { DashboardActionCard } from "../../src/components/dashboard/DashboardActionCard";
import { SavingsSummaryCard } from "../../src/components/dashboard/SavingsSummaryCard";

export default function HomeScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [topProductsModalVisible, setTopProductsModalVisible] = useState(false);
	const [receipts, setReceipts] = useState<Receipt[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [statistics, setStatistics] = useState<Statistics>({
		totalTickets: 0,
		totalSpent: 0,
		averageTicket: 0,
		totalItems: 0,
		mostFrequentSupermarket: "-",
		mostBoughtProduct: null,
		topProducts: [],
	});

	const fetchReceipts = useCallback(async () => {
		if (!user) return;

		try {
			setLoading(true);
			const data = await receiptApi.getUserReceipts();

			setReceipts(data || []);
			setStatistics(calculateStatistics(data || []));
		} catch (error) {
			console.error("Error fetching receipts:", error);
		} finally {
			setLoading(false);
		}
	}, [user]);

	useFocusEffect(
		useCallback(() => {
			fetchReceipts();
		}, [fetchReceipts])
	);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchReceipts();
		setRefreshing(false);
	}, [fetchReceipts]);

	return (
		<SafeAreaView style={core.safeArea}>
			<TopProductsModal
				visible={topProductsModalVisible}
				onClose={() => setTopProductsModalVisible(false)}
				topProducts={statistics.topProducts}
			/>
			<View style={styles.homeContainer}>
				{/* Header */}
				<View style={styles.homeHeader}>
					<Text style={styles.homeTitle}>Inicio</Text>
				</View>

				{/* Body Content */}
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
					}
				>
					{loading && receipts.length === 0 ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={theme.colors.primary} />
							<Text style={styles.loadingText}>Cargando estadísticas...</Text>
						</View>
					) : (
						<>
							{/* Savings Summary Card */}
							{(() => {
								let totalSaved = 0;
								const storeSavings: Record<string, number> = {};

								receipts.forEach((r) => {
									let effectiveSaved = r.total_saved || 0;

									// If total_saved is missing or 0, try to calculate from items
									if (effectiveSaved <= 0 && r.items) {
										effectiveSaved = r.items.reduce(
											(acc, item) => acc + (item.discount || 0),
											0
										);
									}

									if (effectiveSaved > 0) {
										totalSaved += effectiveSaved;
										const store = r.supermarket || "Desconocido";
										storeSavings[store] =
											(storeSavings[store] || 0) + effectiveSaved;
									}
								});

								let bestStore = "";
								let maxSavings = 0;
								Object.entries(storeSavings).forEach(([store, saved]) => {
									if (saved > maxSavings) {
										maxSavings = saved;
										bestStore = store;
									}
								});

								return (
									<SavingsSummaryCard
										totalSaved={totalSaved}
										bestStore={bestStore}
										onPress={() => router.push("/(tabs)/discounts")}
									/>
								);
							})()}

							{/* Statistics Cards */}
							<StatsGrid statistics={statistics} />

							{/* Most Bought Product Card */}
							{statistics.mostBoughtProduct && (
								<HighlightCard
									product={statistics.mostBoughtProduct}
									onPress={() => setTopProductsModalVisible(true)}
								/>
							)}

							{/* Most Frequent Supermarket */}
							<SupermarketCard
								supermarketName={statistics.mostFrequentSupermarket}
							/>

							{/* View All Tickets Button */}
							<DashboardActionCard
								hasTickets={statistics.totalTickets > 0}
								onPress={() => router.push("/(tabs)/tickets")}
							/>
						</>
					)}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	homeContainer: {
		flex: 1,
		padding: theme.spacing.md,
	},
	homeHeader: {
		alignItems: "center",
		justifyContent: "center",
		marginBottom: theme.spacing.lg,
	},
	homeTitle: {
		fontSize: theme.font.size.h1,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		textAlign: "center",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: theme.spacing.lg,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingTop: theme.spacing.xl * 2,
	},
	loadingText: {
		marginTop: theme.spacing.md,
		color: theme.colors.textSecondary,
		fontFamily: theme.font.family.regular,
		fontSize: theme.font.size.md,
	},
});
