import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	FlatList,
	Pressable,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../src/styles/theme";
import { core } from "../src/styles/core.styles";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { receiptApi } from "../src/services/receiptApi";
import { Receipt } from "../src/types/receipt.types";
import { parseReceiptDate } from "../src/utils/dateUtils";

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

	useEffect(() => {
		fetchData();
	}, [user]);

	const fetchData = async () => {
		if (!user) return;
		try {
			setLoading(true);
			const receipts = await receiptApi.getUserReceipts(user.id);
			processReceipts(receipts);
		} catch (error) {
			console.error("Error fetching receipts:", error);
		} finally {
			setLoading(false);
		}
	};

	const processReceipts = (receipts: Receipt[]) => {
		const groups: Record<string, MonthSavings> = {};
		let total = 0;

		receipts.forEach((r) => {
			if (!r.total_saved || r.total_saved <= 0) return;

			total += r.total_saved;
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

			groups[monthKey].totalSaved += r.total_saved;
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
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Ionicons name="arrow-back" size={24} color={theme.colors.text} />
				</Pressable>
				<Text style={styles.title}>Mis Ahorros</Text>
				<View style={{ width: 40 }} />
			</View>

			<View style={styles.summaryContainer}>
				<Text style={styles.summaryLabel}>Total Ahorrado Histórico</Text>
				<Text style={styles.summaryAmount}>${totalAllTime.toFixed(2)}</Text>
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
											${item.totalSaved.toFixed(2)}
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
									{item.receipts.map((receipt) => (
										<Pressable
											key={receipt.id}
											style={styles.ticketItem}
											onPress={() => handleTicketPress(receipt)}
										>
											<View style={styles.ticketInfo}>
												<Text style={styles.ticketStore}>
													{receipt.supermarket}
												</Text>
												<Text style={styles.ticketDate}>
													{receipt.datetime}
												</Text>
											</View>
											<Text style={styles.ticketSaved}>
												+${(receipt.total_saved || 0).toFixed(2)}
											</Text>
										</Pressable>
									))}
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
		justifyContent: "space-between",
		padding: theme.spacing.md,
	},
	backButton: {
		padding: theme.spacing.sm,
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
		backgroundColor: theme.colors.surface,
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
	ticketItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.backgroundVariant,
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
	emptyText: {
		color: theme.colors.textSecondary,
		textAlign: "center",
		marginTop: theme.spacing.xl,
	},
});
