import React, { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Pressable,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/styles/theme";
import { core } from "../../src/styles/core.styles";
import { useAuth } from "../../src/features/auth/context/AuthContext";
import { receiptApi } from "../../src/services/receiptApi";
import { Receipt } from "../../src/types/receipt.types";
import {
	parseReceiptDate,
	formatReceiptDateTime,
} from "../../src/utils/dateUtils";
import { formatCurrency } from "../../src/utils/formatCurrency";

interface MonthSavings {
	month: string; // "YYYY-MM"
	monthLabel: string; // "Noviembre 2023"
	totalSaved: number;
	receiptCount: number;
	receipts: Receipt[];
}

export default function DiscountsScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [savingsByMonth, setSavingsByMonth] = useState<MonthSavings[]>([]);
	const [totalAllTime, setTotalAllTime] = useState(0);
	const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		if (!user) return;
		try {
			setLoading(true);
			const receipts = await receiptApi.getUserReceipts();
			processReceipts(receipts);
		} catch (error) {
			console.error("Error fetching receipts:", error);
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const processReceipts = (receipts: Receipt[]) => {
		const groups: Record<string, MonthSavings> = {};
		let total = 0;

		receipts.forEach((r) => {
			let effectiveSaved = r.total_saved || 0;

			// If total_saved is missing or 0, try to calculate from items
			if (effectiveSaved <= 0 && r.items) {
				effectiveSaved = r.items.reduce(
					(acc, item) => acc + (item.discount || 0),
					0
				);
			}

			if (effectiveSaved <= 0) return;

			total += effectiveSaved;
			const date = parseReceiptDate(r.datetime);

			// Validate date
			if (isNaN(date.getTime())) {
				console.warn("Invalid date for receipt:", r.id, r.datetime);
				return;
			}

			const monthKey = `${date.getFullYear()}-${String(
				date.getMonth() + 1
			).padStart(2, "0")}`;

			// Format label: "Month YYYY"
			const monthLabel = date.toLocaleDateString("es-ES", {
				month: "long",
				year: "numeric",
			});
			// Capitalize first letter
			const formattedLabel =
				monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

			if (!groups[monthKey]) {
				groups[monthKey] = {
					month: monthKey,
					monthLabel: formattedLabel,
					totalSaved: 0,
					receiptCount: 0,
					receipts: [],
				};
			}

			groups[monthKey].totalSaved += effectiveSaved;
			groups[monthKey].receiptCount += 1;
			groups[monthKey].receipts.push(r);
		});

		const sortedMonths = Object.values(groups).sort((a, b) =>
			b.month.localeCompare(a.month)
		);

		setSavingsByMonth(sortedMonths);
		setTotalAllTime(total);
	};

	const toggleMonth = (month: string) => {
		setExpandedMonth(expandedMonth === month ? null : month);
	};

	const handleTicketPress = (receipt: Receipt) => {
		router.push({
			pathname: "/ticket",
			params: { data: JSON.stringify(receipt) },
		});
	};

	return (
		<SafeAreaView style={core.safeArea}>
			<View style={styles.header}>
				<Text style={styles.title}>Mis Ahorros</Text>
			</View>

			<View style={styles.summaryContainer}>
				<Text style={styles.summaryLabel}>Total Ahorrado Histórico</Text>
				<Text style={styles.summaryAmount}>
					${formatCurrency(totalAllTime)}
				</Text>
			</View>

			{loading ? (
				<View style={core.centeredContent}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
				</View>
			) : (
				<FlatList
					data={savingsByMonth}
					keyExtractor={(item) => item.month}
					contentContainerStyle={styles.listContent}
					renderItem={({ item }) => (
						<View style={styles.monthCardContainer}>
							<Pressable
								style={styles.monthCard}
								onPress={() => toggleMonth(item.month)}
							>
								<View style={styles.monthHeader}>
									<Text style={styles.monthLabel}>{item.monthLabel}</Text>
									<View style={styles.amountContainer}>
										<Text style={styles.monthAmount}>
											${formatCurrency(item.totalSaved)}
										</Text>
										<Ionicons
											name={
												expandedMonth === item.month
													? "chevron-up"
													: "chevron-down"
											}
											size={20}
											color={theme.colors.textSecondary}
											style={{ marginLeft: 8 }}
										/>
									</View>
								</View>
								<Text style={styles.monthDetails}>
									{item.receiptCount} tickets con descuentos
								</Text>
							</Pressable>

							{expandedMonth === item.month && (
								<View style={styles.ticketsList}>
									{item.receipts.map((receipt) => {
										const rawDiscounts =
											receipt.discounts && receipt.discounts.length > 0
												? receipt.discounts
												: (receipt.items || [])
														.filter((item) => (item.discount || 0) > 0)
														.map((item) => ({
															description: item.promotion || "Descuento",
															amount: item.discount || 0,
														}));

										// Group discounts by description
										const discountsMap = new Map<string, number>();
										rawDiscounts.forEach((d) => {
											const current = discountsMap.get(d.description) || 0;
											discountsMap.set(d.description, current + d.amount);
										});

										const discountsToDisplay = Array.from(
											discountsMap.entries()
										).map(([description, amount]) => ({ description, amount }));

										return (
											<View key={receipt.id} style={styles.ticketWrapper}>
												<Pressable
													style={styles.ticketItem}
													onPress={() => handleTicketPress(receipt)}
												>
													<View style={styles.ticketInfo}>
														<Text style={styles.ticketStore}>
															{receipt.supermarket}
														</Text>
														<Text style={styles.ticketDate}>
															{formatReceiptDateTime(receipt.datetime)}
														</Text>
													</View>
													<Text style={styles.ticketSaved}>
														$
														{formatCurrency(
															(receipt.total_saved || 0) > 0
																? receipt.total_saved || 0
																: receipt.items?.reduce(
																		(acc, i) => acc + (i.discount || 0),
																		0
																  ) || 0
														)}
													</Text>
												</Pressable>

												{discountsToDisplay.length > 0 && (
													<View style={styles.discountsList}>
														{discountsToDisplay.map((d, i) => (
															<View key={i} style={styles.discountRow}>
																<Text
																	style={styles.discountName}
																	numberOfLines={1}
																>
																	{d.description}
																</Text>
																<Text style={styles.discountValue}>
																	-${formatCurrency(d.amount)}
																</Text>
															</View>
														))}
													</View>
												)}
											</View>
										);
									})}
								</View>
							)}
						</View>
					)}
					ListEmptyComponent={
						<View style={core.centeredContent}>
							<Text style={styles.emptyText}>
								No tienes descuentos registrados aún.
							</Text>
						</View>
					}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: theme.spacing.md,
	},
	title: {
		fontSize: theme.font.size.h4,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	summaryContainer: {
		alignItems: "center",
		paddingVertical: theme.spacing.xl,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.success,
	},
	summaryLabel: {
		fontSize: theme.font.size.md,
		color: theme.colors.textSecondary,
		fontFamily: theme.font.family.regular,
		marginBottom: theme.spacing.xs,
	},
	summaryAmount: {
		fontSize: theme.font.size.h1,
		color: theme.colors.success,
		fontFamily: theme.font.family.bold,
	},
	listContent: {
		padding: theme.spacing.md,
	},
	monthCardContainer: {
		marginBottom: theme.spacing.md,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.md,
		overflow: "hidden",
	},
	monthCard: {
		padding: theme.spacing.md,
		borderLeftWidth: 4,
		borderLeftColor: theme.colors.success,
	},
	monthHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.xs,
	},
	amountContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	monthLabel: {
		fontSize: theme.font.size.lg,
		color: theme.colors.text,
		fontFamily: theme.font.family.bold,
	},
	monthAmount: {
		fontSize: theme.font.size.xl,
		color: theme.colors.success,
		fontFamily: theme.font.family.bold,
	},
	monthDetails: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
	},
	ticketsList: {
		borderTopWidth: 1,
		borderTopColor: theme.colors.backgroundVariant,
		backgroundColor: theme.colors.background,
	},
	ticketWrapper: {
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.backgroundVariant,
	},
	ticketItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: theme.spacing.md,
	},
	ticketInfo: {
		flex: 1,
	},
	ticketStore: {
		fontSize: theme.font.size.md,
		color: theme.colors.text,
		fontFamily: theme.font.family.bold,
		marginBottom: 2,
	},
	ticketDate: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
	},
	ticketSaved: {
		fontSize: theme.font.size.lg,
		color: theme.colors.success,
		fontFamily: theme.font.family.bold,
		marginLeft: theme.spacing.md,
	},
	discountsList: {
		paddingHorizontal: theme.spacing.md,
		paddingBottom: theme.spacing.md,
	},
	discountRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	discountName: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
		flex: 1,
		marginRight: theme.spacing.md,
	},
	discountValue: {
		fontSize: theme.font.size.sm,
		color: theme.colors.success,
		fontFamily: theme.font.family.bold,
	},
	emptyText: {
		color: theme.colors.textSecondary,
		textAlign: "center",
		marginTop: theme.spacing.xl,
	},
});
