import { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	Pressable,
	Modal,
	SafeAreaView,
	Alert,
	ActivityIndicator,
	FlatList,
	RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Menu from "../src/components/Menu";
import { Button } from "../src/components/ui/Button";
import { Card } from "../src/components/ui/Card";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/features/auth/context/AuthContext";

import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";

interface Receipt {
	id: string;
	user_id: string;
	supermarket: string;
	datetime: string;
	total: number;
	items: { product: string; brand?: string; quantity: number; price: number }[];
	image_url?: string;
	created_at: string;
}

const screenStyles = {
	homeContainer: {
		...core.flex1,
		padding: theme.spacing.md,
	},
	homeHeader: {
		flexDirection: "row" as "row",
		justifyContent: "space-between" as "space-between",
		alignItems: "center" as "center",
		marginBottom: theme.spacing.lg,
	},
	headerIcon: {
		fontSize: 28,
		color: theme.colors.text,
	},
	homeTitle: {
		...core.h1,
		flex: 1,
		textAlign: "center" as "center",
	},
	headerPlaceholder: {
		width: 28,
	},
	homeCardContainer: {
		...core.flex1,
	},
	fab: {
		...core.fab,
	},
	fabIcon: {
		...core.fabIcon,
	},
	fabModalBackdrop: {
		...core.modalBackdrop,
	},
	fabModalContainer: {
		...core.modalContainer,
	},
	fabModalTitle: {
		...core.h3,
		marginBottom: theme.spacing.lg,
		textAlign: "center" as "center",
	},
	fabModalButton: {
		marginTop: theme.spacing.sm,
	},
	loadingModalContainer: {
		...core.flex1,
		...core.center,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	loadingModalText: {
		marginTop: theme.spacing.sm,
		color: theme.colors.background,
		fontFamily: theme.font.family.regular,
	},
};

export default function HomeScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [menuVisible, setMenuVisible] = useState(false);
	const [fabModalVisible, setFabModalVisible] = useState(false);
	const [receipts, setReceipts] = useState<Receipt[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const fetchReceipts = async () => {
		if (!user) return;

		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("receipts")
				.select("*")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false });

			if (error) {
				throw error;
			}

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
		Alert.alert(
			"Próximamente",
			"La función para agregar registros manualmente estará disponible pronto."
		);
	};

	const handleScanTicket = () => {
		setFabModalVisible(false);
		router.push("/capture");
	};

	const confirmDelete = (id: string) => {
		Alert.alert("Eliminar ticket", "¿Seguro que deseas eliminar este ticket?", [
			{ text: "Cancelar", style: "cancel" },
			{
				text: "Eliminar",
				style: "destructive",
				onPress: async () => {
					try {
						const { error } = await supabase
							.from("receipts")
							.delete()
							.eq("id", id);

						if (error) throw error;

						setReceipts((prev) => prev.filter((r) => r.id !== id));
					} catch (error) {
						console.error("Error deleting receipt:", error);
						Alert.alert("Error", "No se pudo eliminar el ticket");
					}
				},
			},
		]);
	};

	return (
		<SafeAreaView style={core.safeArea}>
			<Menu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
			<View style={screenStyles.homeContainer}>
				{/* Header */}
				<View style={screenStyles.homeHeader}>
					<Pressable onPress={() => setMenuVisible(true)}>
						<Ionicons name="menu" style={screenStyles.headerIcon} />
					</Pressable>
					<Text style={screenStyles.homeTitle}>Dashboard</Text>
					<View style={screenStyles.headerPlaceholder} />
				</View>

				{/* Body Content */}
				<View style={screenStyles.homeCardContainer}>
					<FlatList
						data={receipts}
						keyExtractor={(item) => item.id}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
						}
						renderItem={({ item }) => (
							<Pressable
								onPress={() =>
									router.push({
										pathname: "/ticket",
										params: { data: JSON.stringify(item) },
									})
								}
								onLongPress={() => confirmDelete(item.id)}
							>
								<Card style={[core.card, { marginBottom: theme.spacing.md }]}>
									<Text style={core.text}>{item.supermarket}</Text>
									<Text style={core.h4}>{item.datetime}</Text>
									<Text style={core.h2}>${item.total.toFixed(2)}</Text>
								</Card>
							</Pressable>
						)}
					/>
				</View>

				{/* FAB */}
				<Pressable
					style={screenStyles.fab}
					onPress={() => setFabModalVisible(true)}
				>
					<Ionicons name="add" style={screenStyles.fabIcon} />
				</Pressable>

				{/* FAB Modal */}
				<Modal
					transparent
					visible={fabModalVisible}
					animationType="fade"
					onRequestClose={() => setFabModalVisible(false)}
				>
					<Pressable
						style={screenStyles.fabModalBackdrop}
						onPressOut={() => setFabModalVisible(false)}
					>
						<View style={screenStyles.fabModalContainer}>
							<Text style={screenStyles.fabModalTitle}>Agregar Registro</Text>
							<Button
								title="Escanear Ticket"
								onPress={handleScanTicket}
								fullWidth
								style={screenStyles.fabModalButton}
								leftIcon={<Ionicons name="camera-outline" />}
							/>
							<Button
								title="Agregar Manualmente"
								onPress={handleAddManually}
								fullWidth
								variant="secondary"
								style={screenStyles.fabModalButton}
								leftIcon={<Ionicons name="create-outline" />}
							/>
						</View>
					</Pressable>
				</Modal>
			</View>

			{/* Loading Spinner Modal */}
			<Modal transparent visible={loading} animationType="fade">
				<View style={screenStyles.loadingModalContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={screenStyles.loadingModalText}>Cargando tickets...</Text>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
