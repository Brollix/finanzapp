import { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	Alert,
	FlatList,
	RefreshControl,
	StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { DeleteConfirmationModal } from "../../src/components/modals/DeleteConfirmationModal";
import { TicketActionModal } from "../../src/components/modals/TicketActionModal";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/features/auth/context/AuthContext";

import { core } from "../../src/styles/core.styles";
import { theme } from "../../src/styles/theme";

import { useReceipts } from "../../src/context/ReceiptContext";
import { Receipt } from "../../src/types/receipt.types";
import { TicketListItem } from "../../src/components/dashboard/TicketListItem";
import { LoadingModal } from "../../src/components/modals/LoadingModal";

export default function TicketsScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [actionModalVisible, setActionModalVisible] = useState(false);
	const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
		null
	);
	const { receipts, loading, fetchReceipts, refreshReceipts, removeReceipt } =
		useReceipts();
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		fetchReceipts();
	}, [fetchReceipts]);

	const onRefresh = async () => {
		setRefreshing(true);
		await refreshReceipts();
		setRefreshing(false);
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
			}

			removeReceipt(selectedReceiptId);
			setDeleteModalVisible(false);
			setSelectedReceiptId(null);
		} catch (error) {
			console.error("Error deleting receipt:", error);
			Alert.alert("Error", "No se pudo eliminar el ticket");
		}
	};

	return (
		<SafeAreaView style={core.safeArea}>
			<View style={styles.homeContainer}>
				{/* Header */}
				<View style={styles.homeHeader}>
					<Text style={styles.homeTitle}>Tus Tickets</Text>
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
	homeCardContainer: {
		flex: 1,
	},
});
