import { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	Pressable,
	Alert,
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Menu from "../src/components/Menu";
import { TopProductsModal } from "../src/components/modals/TopProductsModal";
import { receiptApi } from "../src/services/receiptApi";
import { Receipt } from "../src/types/receipt.types";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { calculateStatistics } from "../src/utils/statistics";
import { Statistics } from "../src/types/receipt.types";
import { StatsGrid } from "../src/components/dashboard/StatsGrid";
import { HighlightCard } from "../src/components/dashboard/HighlightCard";
import { SupermarketCard } from "../src/components/dashboard/SupermarketCard";
import { DashboardActionCard } from "../src/components/dashboard/DashboardActionCard";
import { FabModal } from "../src/components/modals/FabModal";

export default function HomeScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [menuVisible, setMenuVisible] = useState(false);
	const [topProductsModalVisible, setTopProductsModalVisible] = useState(false);
	const [fabModalVisible, setFabModalVisible] = useState(false);
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
			const data = await receiptApi.getUserReceipts(user.id);

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

	const handleAddManually = () => {
		setFabModalVisible(false);
		router.push("/manual-entry");
	};

	const handleScanTicket = () => {
		setFabModalVisible(false);
		router.push("/capture");
	};

	return (
		<SafeAreaView style={core.safeArea}>
			<Menu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
			<TopProductsModal
				visible={topProductsModalVisible}
				onClose={() => setTopProductsModalVisible(false)}
				topProducts={statistics.topProducts}
			/>
			<View style={styles.homeContainer}>
				{/* Header */}
				<View style={styles.homeHeader}>
					<Pressable onPress={() => setMenuVisible(true)}>
						<Ionicons name="menu" style={styles.headerIcon} />
					</Pressable>
					<Text style={styles.homeTitle}>Inicio</Text>
					<View style={styles.headerPlaceholder} />
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

							{/* View All Tickets Button or Load Ticket Button */}
							<DashboardActionCard
								hasTickets={statistics.totalTickets > 0}
								onPress={() =>
									statistics.totalTickets > 0
										? router.push("/dashboard")
										: setFabModalVisible(true)
								}
							/>
						</>
					)}
				</ScrollView>

				{/* FAB Modal */}
				<FabModal
					visible={fabModalVisible}
					onClose={() => setFabModalVisible(false)}
					onScan={handleScanTicket}
					onManual={handleAddManually}
				/>
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
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.lg,
	},
	headerIcon: {
		fontSize: 28,
		color: theme.colors.text,
	},
	homeTitle: {
		fontSize: theme.font.size.h1,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		flex: 1,
		textAlign: "center",
	},
	headerPlaceholder: {
		width: 28,
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
