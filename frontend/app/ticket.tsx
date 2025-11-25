import React from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOcr } from "../src/context/OcrContext";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { ReceiptItem, ReceiptData } from "../src/types/receipt.types";
import { ProductDetailsModal } from "../src/components/modals/ProductDetailsModal";

const ReceiptItemRow = ({
	item,
	onPress,
}: {
	item: ReceiptItem;
	onPress: (item: ReceiptItem) => void;
}) => (
	<TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.7}>
		<View style={styles.itemRow}>
			<View style={styles.iconContainer}>
				<Ionicons
					name="pricetag-outline"
					size={20}
					color={theme.colors.primary}
				/>
			</View>
			<View style={styles.itemInfo}>
				<Text style={styles.product} numberOfLines={1}>
					{item.product}
				</Text>
				{item.brand && (
					<Text style={styles.brand} numberOfLines={1}>
						{item.brand}
					</Text>
				)}
			</View>
			<View style={styles.itemMeta}>
				<Text style={styles.quantity}>
					{item.is_weight ? `${item.quantity} kg` : `x${item.quantity}`}
				</Text>
				<Text style={styles.price}>${item.price.toFixed(2)}</Text>
			</View>
		</View>
	</TouchableOpacity>
);

export default function TicketScreen() {
	const router = useRouter();
	const { data } = useLocalSearchParams();
	const { receipt: contextReceipt, status, error } = useOcr();
	const [selectedItem, setSelectedItem] = React.useState<ReceiptItem | null>(
		null
	);
	const [modalVisible, setModalVisible] = React.useState(false);

	const handleItemPress = (item: ReceiptItem) => {
		setSelectedItem(item);
		setModalVisible(true);
	};

	let receipt: ReceiptData | null = null;

	if (data) {
		try {
			receipt = JSON.parse(data as string);
		} catch (e) {
			console.error("Error parsing receipt data:", e);
		}
	} else {
		receipt = contextReceipt;
	}

	if (!data && status === "loading") {
		return (
			<View style={core.centeredContent}>
				<Text style={core.text}>Cargando...</Text>
			</View>
		);
	}
	if (!data && status === "error" && error) {
		return (
			<View style={core.centeredContent}>
				<Text style={core.errorText}>Error: {error.message}</Text>
			</View>
		);
	}
	if (!receipt) {
		return (
			<View style={core.centeredContent}>
				<Text style={core.text}>No hay receipt cargado.</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={core.safeArea}>
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Ionicons name="arrow-back" size={24} color={theme.colors.text} />
				</TouchableOpacity>
				<View>
					<Text style={styles.supermarket}>{receipt.supermarket}</Text>
					<Text style={styles.datetime}>{receipt.datetime}</Text>
				</View>
			</View>

			<FlatList
				data={receipt.items}
				keyExtractor={(_, index) => index.toString()}
				renderItem={({ item }) => (
					<ReceiptItemRow item={item} onPress={handleItemPress} />
				)}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
			/>

			<View style={styles.totalBar}>
				<View>
					<Text style={styles.totalLabel}>TOTAL</Text>
					<Text style={styles.itemCount}>{receipt.items.length} items</Text>
				</View>
				<Text style={styles.totalValue}>${receipt.total.toFixed(2)}</Text>
			</View>

			<ProductDetailsModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				item={selectedItem}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	header: {
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.backgroundVariant,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.surface,
		flexDirection: "row",
		alignItems: "center",
	},
	backButton: {
		marginRight: theme.spacing.md,
		padding: theme.spacing.xs,
	},
	supermarket: {
		fontSize: theme.font.size.h4,
		fontFamily: theme.font.family.bold,
		color: theme.colors.primary,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	datetime: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
		marginTop: 2,
	},
	list: {
		padding: theme.spacing.md,
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: theme.spacing.sm,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
		borderWidth: 1,
		borderColor: "transparent",
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: theme.colors.background,
		justifyContent: "center",
		alignItems: "center",
		marginRight: theme.spacing.md,
	},
	itemInfo: {
		flex: 1,
		marginRight: theme.spacing.md,
	},
	product: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: 2,
	},
	brand: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textTertiary,
	},
	itemMeta: {
		alignItems: "flex-end",
	},
	quantity: {
		fontSize: theme.font.size.xs,
		color: theme.colors.textSecondary,
		marginBottom: 2,
	},
	price: {
		fontSize: theme.font.size.lg,
		fontFamily: theme.font.family.bold,
		color: theme.colors.primary,
	},
	totalBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.backgroundVariant,
		borderTopWidth: 1,
		borderTopColor: theme.colors.surface,
	},
	totalLabel: {
		fontSize: theme.font.size.sm,
		color: theme.colors.textSecondary,
		letterSpacing: 1,
		marginBottom: 2,
	},
	itemCount: {
		fontSize: theme.font.size.xs,
		color: theme.colors.textSecondary,
	},
	totalValue: {
		fontSize: theme.font.size.h2,
		fontFamily: theme.font.family.bold,
		color: theme.colors.primary,
	},
});
