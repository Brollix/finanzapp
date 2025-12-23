import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/components/ui/Button";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { ReceiptData, Receipt } from "../src/types/receipt.types";
import { receiptApi } from "../src/services/receiptApi";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { useReceipts } from "../src/context/ReceiptContext";
import { useAlert } from "@/context/AlertContext";

export default function ReceiptConfirmationScreen() {
	const { showAlert } = useAlert();
	const router = useRouter();
	const params = useLocalSearchParams();
	const { user } = useAuth();
	const { addReceipt } = useReceipts();
	const [loading, setLoading] = useState(false);

	// Parse receipt data from params
	const receiptData: ReceiptData | Receipt | null = params.receipt
		? JSON.parse(params.receipt as string)
		: null;

	if (!receiptData) {
		return (
			<SafeAreaView style={core.safeArea}>
				<View style={[core.container, core.center]}>
					<Text style={core.text}>No se encontraron datos del ticket.</Text>
					<Button title="Volver" onPress={() => router.back()} />
				</View>
			</SafeAreaView>
		);
	}

	const handleConfirm = async () => {
		if (!user) return;

		try {
			setLoading(true);

			// If the receipt already has an ID, it's likely already saved by the process endpoint.
			// However, if we want to be sure, we can update it or just acknowledge.
			// Based on the flow, if it has an ID, we assume it's saved.
			// If it doesn't have an ID, we must save it.

			if ((receiptData as Receipt).id) {
				// Already saved, just go home
				// Ideally we should add it to context if it's not there, but since it was processed
				// it might not be in the list yet if we didn't refresh.
				// So let's add it to be safe.
				addReceipt(receiptData as Receipt);
				router.dismissAll();
				router.replace("/(tabs)/tickets");
			} else {
				// Not saved yet (manual creation flow or if process didn't save)
				const created = await receiptApi.createManualReceipt(receiptData);
				addReceipt(created);
				router.dismissAll();
				router.replace("/(tabs)/tickets");
			}
		} catch (error) {
			showAlert("Error", "No se pudo guardar el ticket.", undefined, "error");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = () => {
		// Navigate to manual entry for editing, passing the data
		router.push({
			pathname: "/manual-entry",
			params: { receipt: JSON.stringify(receiptData) },
		});
	};

	return (
		<SafeAreaView style={core.safeArea}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Confirmar Ticket</Text>
			</View>

			<ScrollView style={core.flex1} contentContainerStyle={styles.content}>
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<View style={styles.iconContainer}>
							<Ionicons name="receipt" size={32} color={theme.colors.primary} />
						</View>
						<View style={styles.headerTextContainer}>
							<Text style={styles.supermarket}>{receiptData.supermarket}</Text>
							<Text style={styles.date}>{receiptData.datetime}</Text>
						</View>
					</View>

					<View style={styles.divider} />

					<View style={styles.itemsContainer}>
						<Text style={styles.sectionTitle}>Items Detectados</Text>
						{receiptData.items.map((item, index) => (
							<View key={index} style={styles.itemRow}>
								<Text style={styles.itemQuantity}>
									{item.is_weight ? `${item.quantity}kg` : `x${item.quantity}`}
								</Text>
								<Text style={styles.itemName} numberOfLines={1}>
									{item.product}
								</Text>
								<Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
							</View>
						))}
					</View>

					<View style={styles.divider} />

					<View style={styles.totalContainer}>
						<Text style={styles.totalLabel}>TOTAL</Text>
						<Text style={styles.totalValue}>
							${receiptData.total.toFixed(2)}
						</Text>
					</View>
				</View>

				<View style={styles.infoContainer}>
					<Ionicons
						name="information-circle-outline"
						size={24}
						color={theme.colors.textSecondary}
					/>
					<Text style={styles.infoText}>
						Revisa que los datos sean correctos antes de confirmar.
					</Text>
				</View>
			</ScrollView>

			<View style={styles.footer}>
				<Button
					title="Editar Datos"
					variant="outline"
					onPress={handleEdit}
					style={styles.editButton}
				/>
				<Button
					title="Confirmar y Guardar"
					onPress={handleConfirm}
					loading={loading}
					style={styles.confirmButton}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	header: {
		padding: theme.spacing.lg,
		alignItems: "center",
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.surface,
	},
	headerTitle: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	content: {
		padding: theme.spacing.lg,
	},
	card: {
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
		shadowColor: theme.colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: theme.spacing.md,
	},
	iconContainer: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: theme.colors.backgroundVariant,
		justifyContent: "center",
		alignItems: "center",
		marginRight: theme.spacing.md,
	},
	headerTextContainer: {
		flex: 1,
	},
	supermarket: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	date: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
	},
	divider: {
		height: 1,
		backgroundColor: theme.colors.border,
		marginVertical: theme.spacing.md,
	},
	itemsContainer: {
		marginBottom: theme.spacing.md,
	},
	sectionTitle: {
		fontSize: theme.font.size.sm,
		fontFamily: theme.font.family.bold,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.sm,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	itemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.sm,
	},
	itemQuantity: {
		width: 40,
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
	},
	itemName: {
		flex: 1,
		fontSize: theme.font.size.md,
		color: theme.colors.text,
		marginRight: theme.spacing.sm,
	},
	itemPrice: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	totalContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: theme.spacing.xs,
	},
	totalLabel: {
		fontSize: theme.font.size.lg,
		fontFamily: theme.font.family.bold,
		color: theme.colors.textSecondary,
	},
	totalValue: {
		fontSize: theme.font.size.h1,
		fontFamily: theme.font.family.bold,
		color: theme.colors.primary,
	},
	infoContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: theme.spacing.xl,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.md,
	},
	infoText: {
		flex: 1,
		marginLeft: theme.spacing.md,
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
	},
	footer: {
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.background,
		borderTopWidth: 1,
		borderTopColor: theme.colors.surface,
		gap: theme.spacing.md,
	},
	editButton: {
		marginBottom: 0,
	},
	confirmButton: {
		marginBottom: 0,
	},
});
