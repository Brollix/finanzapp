import { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	Pressable,
	SafeAreaView,
	Alert,
	FlatList,
	RefreshControl,
	StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Menu from "../src/components/Menu";
import { DeleteConfirmationModal } from "../src/components/modals/DeleteConfirmationModal";
import { TicketActionModal } from "../src/components/modals/TicketActionModal";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/features/auth/context/AuthContext";

import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";

import { receiptApi } from "../src/services/receiptApi";
import { Receipt } from "../src/types/receipt.types";
import { FabModal } from "../src/components/modals/FabModal";
import { TicketListItem } from "../src/components/dashboard/TicketListItem";
import { LoadingModal } from "../src/components/modals/LoadingModal";

export default function HomeScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [menuVisible, setMenuVisible] = useState(false);
	const [fabModalVisible, setFabModalVisible] = useState(false);
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [actionModalVisible, setActionModalVisible] = useState(false);
	const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
		null
	);
	const [receipts, setReceipts] = useState<Receipt[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const fetchReceipts = async () => {
		if (!user) return;

		try {
			setLoading(true);
			const data = await receiptApi.getUserReceipts(user.id);

			setReceipts(data || []);
		} catch (error) {
			console.error("Error fetching receipts:", error);
			Alert.alert("Error", "No se pudieron cargar los tickets");
		} finally {
			setLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchReceipts();
		setRefreshing(false);
	};

	// Fetch receipts when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			fetchReceipts();
		}, [user])
	);

	const handleAddManually = () => {
		setFabModalVisible(false);
		router.push("/manual-entry");
	};

	const handleScanTicket = () => {
		setFabModalVisible(false);
		router.push("/capture");
	};

	const handleLongPress = (id: string) => {
		setSelectedReceiptId(id);
		setActionModalVisible(true);
	};

	const handleEdit = () => {
		if (!selectedReceiptId) return;
		const receipt = receipts.find((r) => r.id === selectedReceiptId);
		if (receipt) {
			setActionModalVisible(false);
			router.push({
				pathname: "/manual-entry",
				params: { receipt: JSON.stringify(receipt) },
			});
		}
	};

	const handleDeleteRequest = () => {
		setActionModalVisible(false);
		// Small delay to allow the first modal to close smoothly
		setTimeout(() => {
			setDeleteModalVisible(true);
		}, 300);
	};

	const handleDelete = async () => {
		if (!selectedReceiptId) return;

		try {
			console.log("Attempting to delete receipt:", selectedReceiptId);
			const { error, data } = await supabase
				.from("receipts")
				.delete()
				.eq("id", selectedReceiptId)
				.select();

			console.log("Delete result:", { error, data });

			if (error) throw error;

			if (!data || data.length === 0) {
				console.warn("No rows deleted. Possible RLS issue or ID mismatch.");
				// Optional: Alert the user if it looked like it failed silently
				// Alert.alert("Aviso", "No se encontró el registro para borrar.");
			}

			const updatedReceipts = receipts.filter(
				(r) => r.id !== selectedReceiptId
			);
			setReceipts(updatedReceipts);
			setDeleteModalVisible(false);
			setSelectedReceiptId(null);

			if (updatedReceipts.length === 0) {
				router.replace("/home");
			}
		} catch (error) {
			console.error("Error deleting receipt:", error);
			Alert.alert("Error", "No se pudo eliminar el ticket");
		}
	};

	return (
		<SafeAreaView style={core.safeArea}>
			<Menu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
			<View style={styles.homeContainer}>
				{/* Header */}
				<View style={styles.homeHeader}>
					<Pressable onPress={() => setMenuVisible(true)}>
						<Ionicons name="menu" style={styles.headerIcon} />
					</Pressable>
					<Text style={styles.homeTitle}>Tus Tickets</Text>
					<View style={styles.headerPlaceholder} />
				</View>

				{/* Body Content */}
				<View style={styles.homeCardContainer}>
					<FlatList
						data={receipts}
						keyExtractor={(item) => item.id}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
						}
						renderItem={({ item }) => (
							<TicketListItem item={item} onLongPress={handleLongPress} />
						)}
					/>
				</View>

				{/* FAB */}
				<Pressable
					style={styles.fabCentered}
					onPress={() => setFabModalVisible(true)}
				>
					<Ionicons name="add" size={40} color={theme.colors.onPrimary} />
				</Pressable>

				{/* FAB Modal */}
				<FabModal
					visible={fabModalVisible}
					onClose={() => setFabModalVisible(false)}
					onScan={handleScanTicket}
					onManual={handleAddManually}
				/>
			</View>

			{/* Loading Spinner Modal */}
			<LoadingModal visible={loading} text="Cargando tickets..." />

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				visible={deleteModalVisible}
				onClose={() => {
					setDeleteModalVisible(false);
					setSelectedReceiptId(null);
				}}
				onConfirm={handleDelete}
				title="Eliminar Ticket"
				message="¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer."
			/>

			<TicketActionModal
				visible={actionModalVisible}
				onClose={() => {
					setActionModalVisible(false);
					setSelectedReceiptId(null);
				}}
				onEdit={handleEdit}
				onDelete={handleDeleteRequest}
			/>
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
	homeCardContainer: {
		flex: 1,
	},
	fabCentered: {
		position: "absolute",
		bottom: theme.spacing.lg,
		alignSelf: "center",
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: theme.colors.primary,
		justifyContent: "center",
		alignItems: "center",
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
});
