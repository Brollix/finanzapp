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
import { AnimatedCard } from "../src/components/ui/AnimatedCard";
import { Button } from "../src/components/ui/Button";
import { TopProductsModal } from "../src/components/modals/TopProductsModal";
import { receiptApi } from "../src/services/receiptApi";
import { Receipt } from "../src/types/receipt.types";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";

interface TopProduct {
	name: string;
	count: number;
	totalSpent: number;
}

interface Statistics {
	totalTickets: number;
	totalSpent: number;
	averageTicket: number;
	totalItems: number;
	mostFrequentSupermarket: string;
	mostBoughtProduct: TopProduct | null;
	topProducts: TopProduct[];
}

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

	const calculateStatistics = (receipts: Receipt[]): Statistics => {
		if (receipts.length === 0) {
			return {
				totalTickets: 0,
				totalSpent: 0,
				averageTicket: 0,
				totalItems: 0,
				mostFrequentSupermarket: "-",
				mostBoughtProduct: null,
				topProducts: [],
			};
		}

		const totalTickets = receipts.length;
		const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0);
		const averageTicket = totalSpent / totalTickets;
		const totalItems = receipts.reduce(
			(sum, r) => sum + (r.items?.length || 0),
			0
		);

		// Find most frequent supermarket
		const supermarketCounts: { [key: string]: number } = {};
		receipts.forEach((r) => {
			supermarketCounts[r.supermarket] =
				(supermarketCounts[r.supermarket] || 0) + 1;
		});

		const mostFrequentSupermarket =
			Object.keys(supermarketCounts).length > 0
				? Object.entries(supermarketCounts).reduce((a, b) =>
						a[1] > b[1] ? a : b
				  )[0]
				: "-";

		// Calculate product stats
		const productStats: {
			[key: string]: { count: number; totalSpent: number };
		} = {};

		receipts.forEach((r) => {
			r.items?.forEach((item) => {
				// Normalize product name to avoid duplicates due to casing or minor differences
				const brand = item.brand ? `${item.brand} ` : "";
				const name = `${brand}${item.product}`.trim();

				if (!productStats[name]) {
					productStats[name] = { count: 0, totalSpent: 0 };
				}
				productStats[name].count += item.quantity;
				productStats[name].totalSpent += item.price;
			});
		});

		const sortedProducts = Object.entries(productStats)
			.map(([name, stats]) => ({
				name,
				...stats,
			}))
			.sort((a, b) => b.count - a.count); // Sort by count descending

		const mostBoughtProduct =
			sortedProducts.length > 0 ? sortedProducts[0] : null;
		const topProducts = sortedProducts.slice(0, 10);

		return {
			totalTickets,
			totalSpent,
			averageTicket,
			totalItems,
			mostFrequentSupermarket,
			mostBoughtProduct,
			topProducts,
		};
	};

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
							<View style={styles.statsGrid}>
								<View style={styles.statCardWrapper}>
									<AnimatedCard style={styles.statCard}>
										<Ionicons
											name="receipt-outline"
											size={32}
											color={theme.colors.primary}
											style={styles.statIcon}
										/>
										<Text style={styles.statValue}>
											{statistics.totalTickets}
										</Text>
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
											${statistics.totalSpent.toFixed(2)}
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
											${statistics.averageTicket.toFixed(2)}
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
										<Text style={styles.statValue}>
											{statistics.totalItems}
										</Text>
										<Text style={styles.statLabel}>Productos</Text>
									</AnimatedCard>
								</View>
							</View>

							{/* Most Bought Product Card */}
							{statistics.mostBoughtProduct && (
								<AnimatedCard
									style={styles.highlightCard}
									onPress={() => setTopProductsModalVisible(true)}
								>
									<View style={styles.highlightHeader}>
										<Ionicons
											name="basket-outline"
											size={24}
											color={theme.colors.primary}
										/>
										<Text style={styles.highlightTitle}>
											Producto Más Comprado
										</Text>
									</View>
									<View style={styles.highlightContent}>
										<Text style={styles.highlightValue}>
											{statistics.mostBoughtProduct.name}
										</Text>
										<Text style={styles.highlightSubValue}>
											{statistics.mostBoughtProduct.count
												.toFixed(2)
												.replace(/\.00$/, "")}{" "}
											Cant.
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
							)}

							{/* Most Frequent Supermarket */}
							<AnimatedCard style={styles.supermarketCard}>
								<View style={styles.supermarketHeader}>
									<Ionicons
										name="storefront-outline"
										size={24}
										color={theme.colors.primary}
									/>
									<Text style={styles.supermarketTitle}>
										Supermercado Frecuente
									</Text>
								</View>
								<Text style={styles.supermarketName}>
									{statistics.mostFrequentSupermarket}
								</Text>
							</AnimatedCard>

							{/* View All Tickets Button or Load Ticket Button */}
							{statistics.totalTickets > 0 ? (
								<AnimatedCard
									style={styles.dashboardCard}
									onPress={() => router.push("/dashboard")}
								>
									<View style={styles.dashboardContent}>
										<View>
											<Text style={styles.dashboardTitle}>
												Ver Todos los Tickets
											</Text>
											<Text style={styles.dashboardSubtitle}>
												Accede al dashboard completo
											</Text>
										</View>
										<Ionicons
											name="arrow-forward-circle"
											size={40}
											color={theme.colors.primary}
										/>
									</View>
								</AnimatedCard>
							) : (
								<AnimatedCard
									style={styles.dashboardCard}
									onPress={() => setFabModalVisible(true)}
								>
									<View style={styles.dashboardContent}>
										<View>
											<Text style={styles.dashboardTitle}>Cargar Ticket</Text>
											<Text style={styles.dashboardSubtitle}>
												No tienes tickets. ¡Carga uno ahora!
											</Text>
										</View>
										<Ionicons
											name="add-circle"
											size={40}
											color={theme.colors.primary}
										/>
									</View>
								</AnimatedCard>
							)}
						</>
					)}
				</ScrollView>

				{/* FAB Modal */}
				<Modal
					transparent
					visible={fabModalVisible}
					animationType="fade"
					onRequestClose={() => setFabModalVisible(false)}
				>
					<Pressable
						style={core.modalBackdrop}
						onPressOut={() => setFabModalVisible(false)}
					>
						<View style={core.modalContainer}>
							<Text style={styles.fabModalTitle}>Agregar Registro</Text>
							<Button
								title="Escanear Ticket"
								onPress={handleScanTicket}
								fullWidth
								style={styles.fabModalButton}
								leftIcon={<Ionicons name="camera-outline" />}
							/>
							<Button
								title="Agregar Manualmente"
								onPress={handleAddManually}
								fullWidth
								variant="secondary"
								style={styles.fabModalButton}
								leftIcon={<Ionicons name="create-outline" />}
							/>
						</View>
					</Pressable>
				</Modal>
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
	fabModalTitle: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.lg,
		textAlign: "center",
	},
	fabModalButton: {
		marginTop: theme.spacing.sm,
	},
});
