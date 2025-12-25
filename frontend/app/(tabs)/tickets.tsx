import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { TicketActionModal } from "@/components/modals/TicketActionModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/context/AuthContext";

import { core } from "@/styles/core.styles";
import { theme } from "@/styles/theme";

import { useReceipts } from "@/context/ReceiptContext";
import { Receipt } from "@/types/receipt.types";
import { TicketListItem } from "@/components/dashboard/TicketListItem";
import { LoadingModal } from "@/components/modals/LoadingModal";
import { useAlert } from "@/context/AlertContext";

export default function TicketsScreen() {
	const { showAlert } = useAlert();
	const router = useRouter();
	const { user } = useAuth();
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [actionModalVisible, setActionModalVisible] = useState(false);
	const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
		null
	);
	const {
		receipts,
		loading,
		error,
		fetchReceipts,
		refreshReceipts,
		removeReceipt,
	} = useReceipts();
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		fetchReceipts();
	}, [fetchReceipts]);

	useEffect(() => {
		if (error) {
			showAlert("Error", error, undefined, "error");
		}
	}, [error]);

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
			const { error, data } = await supabase
				.from("receipts")
				.delete()
				.eq("id", selectedReceiptId)
				.select();

			if (error) throw error;

			removeReceipt(selectedReceiptId);
			setDeleteModalVisible(false);
			setSelectedReceiptId(null);
		} catch (error) {
			showAlert("Error", "No se pudo eliminar el ticket", undefined, "error");
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
