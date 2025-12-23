import React, { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { ReceiptItem, ReceiptData } from "../src/types/receipt.types";
import { receiptApi } from "../src/services/receiptApi";
import { authService } from "../src/features/auth/services/authService";
import { SuccessModal } from "../src/components/modals";
import { ManualItemForm } from "../src/components/forms/ManualItemForm";
import { formatCurrency } from "../src/utils/formatCurrency";
import { useReceipts } from "../src/context/ReceiptContext";
import { useAlert } from "@/context/AlertContext";

export default function ManualEntryScreen() {
	const { showAlert } = useAlert();
	const router = useRouter();
	const params = useLocalSearchParams();
	const { addReceipt, updateReceipt } = useReceipts();
	const [supermarket, setSupermarket] = useState("");
	const [datetime, setDatetime] = useState(
		new Date().toLocaleString("es-AR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		})
	);

	// Date Picker State
	const [date, setDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [mode, setMode] = useState<"date" | "time">("date");

	// Supermarket Suggestions State
	const [allSupermarkets, setAllSupermarkets] = useState<string[]>([]);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);

	const [items, setItems] = useState<ReceiptItem[]>([]);
	const [showItemForm, setShowItemForm] = useState(false);
	const [editingItem, setEditingItem] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [receiptId, setReceiptId] = useState<string | null>(null);

	const loadSupermarkets = React.useCallback(async () => {
		try {
			const user = await authService.getCurrentUser();
			if (user) {
				const receipts = await receiptApi.getUserReceipts();
				const supers = Array.from(
					new Set(receipts.map((r) => r.supermarket).filter(Boolean))
				);
				setAllSupermarkets(supers);
			}
		} catch (error) {
			// Error loading supermarkets
		}
	}, []);

	React.useEffect(() => {
		loadSupermarkets();

		if (params.receipt) {
			try {
				const receipt = JSON.parse(params.receipt as string);
				setReceiptId(receipt.id || null);
				setSupermarket(receipt.supermarket);
				setDatetime(receipt.datetime);
				setItems(receipt.items || []);
				// Note: Parsing the localized date string back to Date object is complex
				// so we keep the current date for the picker for now,
				// but the display string is correct.
			} catch (e) {
				// Error parsing receipt param
			}
		}
	}, [params.receipt, loadSupermarkets]);

	const onDateChange = (event: any, selectedDate?: Date) => {
		const currentDate = selectedDate || date;
		setShowDatePicker(Platform.OS === "ios");
		setDate(currentDate);
		setDatetime(
			currentDate.toLocaleString("es-AR", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				hour12: true,
			})
		);
	};

	const showMode = (currentMode: "date" | "time") => {
		setShowDatePicker(true);
		setMode(currentMode);
	};

	const handleSupermarketChange = (text: string) => {
		setSupermarket(text);
		if (text.length > 0) {
			const filtered = allSupermarkets
				.filter((s) => s.toLowerCase().includes(text.toLowerCase()))
				.slice(0, 5);
			setSuggestions(filtered);
			setShowSuggestions(true);
		} else {
			setShowSuggestions(false);
		}
	};

	const selectSupermarket = (name: string) => {
		setSupermarket(name);
		setShowSuggestions(false);
	};

	const handleAddItem = () => {
		setEditingItem(null);
		setShowItemForm(true);
	};

	const handleEditItem = (index: number) => {
		setEditingItem(index);
		setShowItemForm(true);
	};

	const handleSaveItem = (item: ReceiptItem) => {
		if (editingItem !== null) {
			const newItems = [...items];
			newItems[editingItem] = item;
			setItems(newItems);
		} else {
			setItems([...items, item]);
		}
		setShowItemForm(false);
		setEditingItem(null);
	};

	const handleDeleteItem = (index: number) => {
		showAlert(
			"Eliminar Item",
			"¿Estás seguro de que deseas eliminar este item?",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Eliminar",
					style: "destructive",
					onPress: () => {
						const newItems = items.filter((_, i) => i !== index);
						setItems(newItems);
					},
				},
			],
			"warning"
		);
	};

	const calculateTotal = () => {
		return items.reduce((sum, item) => sum + item.price, 0);
	};

	const calculateSavings = () => {
		return items.reduce((sum, item) => sum + (item.discount || 0), 0);
	};

	const handleSaveReceipt = async () => {
		if (!supermarket.trim()) {
			showAlert("Error", "El nombre del supermercado es requerido", undefined, "error");
			return;
		}
		if (items.length === 0) {
			showAlert("Error", "Debes agregar al menos un item", undefined, "error");
			return;
		}

		try {
			setLoading(true);
			const user = await authService.getCurrentUser();
			if (!user) {
				showAlert("Error", "Usuario no autenticado", undefined, "error");
				return;
			}

			const totalSaved = calculateSavings();

			// Generate discounts array from items with discounts
			const itemDiscounts = items
				.filter((item) => item.discount && item.discount > 0)
				.map((item) => ({
					description: `Descuento en ${item.product}`,
					amount: item.discount || 0,
				}));

			const receiptData: ReceiptData = {
				supermarket: supermarket.trim(),
				datetime,
				total: calculateTotal(),
				items,
				total_saved: totalSaved,
				discounts: itemDiscounts,
			};

			// Check if we're editing (receiptId exists) or creating new
			if (receiptId) {
				// Update existing receipt
				const updated = await receiptApi.updateReceipt(receiptId, receiptData);
				updateReceipt(updated);
			} else {
				// Create new receipt
				const created = await receiptApi.createManualReceipt(receiptData);
				addReceipt(created);
			}

			setShowSuccessModal(true);
		} catch (error) {
			showAlert("Error", "No se pudo guardar el ticket. Inténtalo de nuevo.", undefined, "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={core.safeArea}>
			<KeyboardAvoidingView
				style={core.flex1}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<Ionicons name="arrow-back" size={24} color={theme.colors.text} />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Agregar Manualmente</Text>
					<View style={styles.headerPlaceholder} />
				</View>

				<ScrollView
					style={styles.content}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Información del Ticket</Text>
						<View style={{ zIndex: 1000 }}>
							<Input
								label="Supermercado *"
								value={supermarket}
								onChangeText={handleSupermarketChange}
								placeholder="Ej: Carrefour"
								containerStyle={styles.inputContainer}
								onFocus={() => {
									if (supermarket.length > 0) setShowSuggestions(true);
								}}
							/>
							{showSuggestions && suggestions.length > 0 && (
								<View style={styles.suggestionsContainer}>
									<ScrollView
										style={{ maxHeight: 150 }}
										nestedScrollEnabled={true}
										keyboardShouldPersistTaps="handled"
									>
										{suggestions.map((item) => (
											<TouchableOpacity
												key={item}
												style={styles.suggestionItem}
												onPress={() => selectSupermarket(item)}
											>
												<Text style={styles.suggestionText}>{item}</Text>
											</TouchableOpacity>
										))}
									</ScrollView>
								</View>
							)}
						</View>

						<Text style={styles.label}>Fecha y Hora *</Text>
						<TouchableOpacity
							onPress={() => showMode("date")}
							style={styles.dateInput}
						>
							<Text style={styles.dateText}>{datetime}</Text>
							<Ionicons
								name="calendar-outline"
								size={24}
								color={theme.colors.textSecondary}
							/>
						</TouchableOpacity>

						{showDatePicker && (
							<DateTimePicker
								testID="dateTimePicker"
								value={date}
								mode={mode}
								is24Hour={false}
								display="default"
								themeVariant="dark"
								accentColor={theme.colors.primary}
								textColor={theme.colors.text}
								onChange={(event, selectedDate) => {
									onDateChange(event, selectedDate);
									if (mode === "date" && Platform.OS === "android") {
										showMode("time");
									} else if (mode === "time" && Platform.OS === "android") {
										setShowDatePicker(false);
									}
								}}
							/>
						)}
					</View>

					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Items ({items.length})</Text>
							<TouchableOpacity
								onPress={handleAddItem}
								style={styles.addButton}
								activeOpacity={0.7}
							>
								<Ionicons
									name="add-circle"
									size={32}
									color={theme.colors.primary}
								/>
							</TouchableOpacity>
						</View>

						{items.length === 0 ? (
							<View style={styles.emptyState}>
								<Ionicons
									name="cart-outline"
									size={48}
									color={theme.colors.textTertiary}
								/>
								<Text style={styles.emptyStateText}>
									No hay items agregados
								</Text>
								<Text style={styles.emptyStateSubtext}>
									Presiona el botón + para agregar items
								</Text>
							</View>
						) : (
							items.map((item, index) => (
								<View key={index} style={styles.itemCard}>
									<View style={styles.itemInfo}>
										<Text style={styles.itemProduct}>{item.product}</Text>
										{!!item.brand && (
											<Text style={styles.itemBrand}>{item.brand}</Text>
										)}
										<Text style={styles.itemMeta}>
											{item.is_weight
												? `${item.quantity} kg`
												: `x${item.quantity}`}{" "}
											• ${formatCurrency(item.price)}
										</Text>
										{!!item.promotion && (
											<Text
												style={{
													color: theme.colors.success,
													fontSize: theme.font.size.sm,
													marginTop: 2,
												}}
											>
												{item.promotion}
											</Text>
										)}
										{item.discount ? (
											<Text
												style={{
													color: theme.colors.success,
													fontSize: theme.font.size.sm,
													marginTop: 2,
												}}
											>
												Descuento: -${formatCurrency(item.discount)}
											</Text>
										) : null}
									</View>
									<View style={styles.itemActions}>
										<TouchableOpacity
											onPress={() => handleEditItem(index)}
											style={styles.itemActionButton}
										>
											<Ionicons
												name="create-outline"
												size={20}
												color={theme.colors.primary}
											/>
										</TouchableOpacity>
										<TouchableOpacity
											onPress={() => handleDeleteItem(index)}
											style={styles.itemActionButton}
										>
											<Ionicons
												name="trash-outline"
												size={20}
												color={theme.colors.error}
											/>
										</TouchableOpacity>
									</View>
								</View>
							))
						)}
					</View>

					<View style={styles.totalSection}>
						<Text style={styles.totalLabel}>TOTAL</Text>
						<Text style={styles.totalValue}>
							${formatCurrency(calculateTotal())}
						</Text>
					</View>
				</ScrollView>

				<View style={styles.footer}>
					<Button
						title="Guardar Ticket"
						onPress={handleSaveReceipt}
						fullWidth
						loading={loading}
						disabled={loading || items.length === 0 || !supermarket.trim()}
						leftIcon={<Ionicons name="save-outline" />}
					/>
				</View>

				<ManualItemForm
					visible={showItemForm}
					item={editingItem !== null ? items[editingItem] : null}
					onSave={handleSaveItem}
					onCancel={() => {
						setShowItemForm(false);
						setEditingItem(null);
					}}
				/>

				<SuccessModal
					visible={showSuccessModal}
					onClose={() => {
						setShowSuccessModal(false);
						router.back();
					}}
					title="¡Ticket Guardado!"
					message="El ticket se ha guardado correctamente en tu historial."
					buttonText="Volver al Inicio"
				/>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.backgroundVariant,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.surface,
	},
	backButton: {
		padding: theme.spacing.xs,
	},
	headerTitle: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	headerPlaceholder: {
		width: 40,
	},
	content: {
		flex: 1,
	},
	contentContainer: {
		padding: theme.spacing.lg,
	},
	section: {
		marginBottom: theme.spacing.xl,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.md,
	},
	sectionTitle: {
		fontSize: theme.font.size.h4,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.md,
	},
	inputContainer: {
		marginBottom: theme.spacing.md,
	},
	addButton: {
		padding: theme.spacing.xs,
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		padding: theme.spacing.xl,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
		borderWidth: 2,
		borderColor: theme.colors.surface,
		borderStyle: "dashed",
	},
	emptyStateText: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.bold,
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.md,
	},
	emptyStateSubtext: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textTertiary,
		marginTop: theme.spacing.xs,
	},
	itemCard: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: theme.spacing.md,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
		marginBottom: theme.spacing.sm,
		borderWidth: 1,
		borderColor: theme.colors.surface,
	},
	itemInfo: {
		flex: 1,
	},
	itemProduct: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	itemBrand: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textTertiary,
		marginTop: 2,
	},
	itemMeta: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.xs,
	},
	itemActions: {
		flexDirection: "row",
		gap: theme.spacing.sm,
	},
	itemActionButton: {
		padding: theme.spacing.sm,
	},
	totalSection: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
		marginTop: theme.spacing.md,
	},
	totalLabel: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.bold,
		color: theme.colors.textSecondary,
		letterSpacing: 1,
	},
	totalValue: {
		fontSize: theme.font.size.h2,
		fontFamily: theme.font.family.bold,
		color: theme.colors.primary,
	},
	footer: {
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.backgroundVariant,
		borderTopWidth: 1,
		borderTopColor: theme.colors.surface,
	},
	// Modal styles
	// modalOverlay, modalContent, modalTitle, weightToggle, weightToggleText, modalButtons, modalButton removed as they are now in ManualItemForm component
	label: {
		fontSize: theme.font.size.sm,
		fontFamily: theme.font.family.regular,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs,
		marginLeft: theme.spacing.xs,
	},
	dateInput: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		marginBottom: theme.spacing.md,
	},
	dateText: {
		fontSize: theme.font.size.md,
		color: theme.colors.text,
		fontFamily: theme.font.family.regular,
	},
	suggestionsContainer: {
		position: "absolute",
		top: 80, // Adjust based on input height + label
		left: 0,
		right: 0,
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		zIndex: 1000,
		elevation: 5,
		shadowColor: theme.colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	suggestionItem: {
		padding: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	suggestionText: {
		fontSize: theme.font.size.md,
		color: theme.colors.text,
	},
});
