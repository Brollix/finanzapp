import React from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useOcr } from "../src/context/OcrContext";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { ReceiptItem, ReceiptData } from "../src/types/receipt.types";
import { ProductDetailsModal } from "../src/components/ProductDetailsModal";

const ReceiptItemRow = ({
	item,
	onPress,
}: {
	item: ReceiptItem;
	onPress: (item: ReceiptItem) => void;
}) => (
	<TouchableOpacity onPress={() => onPress(item)}>
		<View style={styles.itemRow}>
			<View style={styles.itemInfo}>
				<Text style={styles.product}>{item.product}</Text>
				{item.brand && <Text style={styles.brand}>({item.brand})</Text>}
			</View>
			<View style={styles.itemMeta}>
				<Text style={styles.quantity}>x{item.quantity}</Text>
				<Text style={styles.price}>${item.price.toFixed(2)}</Text>
			</View>
		</View>
	</TouchableOpacity>
);

export default function TicketScreen() {
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
		return <Text style={styles.loading}>Cargando...</Text>;
	}
	if (!data && status === "error" && error) {
		return <Text style={styles.error}>Error: {error.message}</Text>;
	}
	if (!receipt) {
		return <Text style={styles.empty}>No hay receipt cargado.</Text>;
	}

	return (
		<View style={core.flex1}>
			<View style={styles.header}>
				<Text style={styles.supermarket}>{receipt.supermarket}</Text>
				<Text style={styles.datetime}>{receipt.datetime}</Text>
			</View>

			<FlatList
				data={receipt.items}
				keyExtractor={(_, index) => index.toString()}
				renderItem={({ item }) => (
					<ReceiptItemRow item={item} onPress={handleItemPress} />
				)}
				contentContainerStyle={styles.list}
			/>

			<View style={styles.totalBar}>
				<Text style={styles.totalLabel}>TOTAL</Text>
				<Text style={styles.totalValue}>${receipt.total.toFixed(2)}</Text>
			</View>

			<ProductDetailsModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				item={selectedItem}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.primary,
	},
	supermarket: {
		fontSize: theme.font.size.h1,
		fontFamily: theme.font.family.bold,
		color: theme.colors.onPrimary,
	},
	datetime: {
		fontSize: theme.font.size.md,
		color: theme.colors.onPrimary,
	},
	list: {
		padding: theme.spacing.md,
	},
	itemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.sm,
		padding: theme.spacing.sm,
		backgroundColor: theme.colors.surface,
		borderRadius: 8,
		elevation: 2,
	},
	itemInfo: {
		flexDirection: "column",
	},
	product: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	brand: {
		fontSize: theme.font.size.sm,
		color: theme.colors.secondary,
	},
	itemMeta: {
		flexDirection: "row",
		alignItems: "center",
	},
	quantity: {
		fontSize: theme.font.size.md,
		marginRight: theme.spacing.sm,
		color: theme.colors.text,
	},
	price: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	totalBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.primary,
	},
	totalLabel: {
		fontSize: theme.font.size.h2,
		fontFamily: theme.font.family.bold,
		color: theme.colors.onPrimary,
	},
	totalValue: {
		fontSize: theme.font.size.h2,
		fontFamily: theme.font.family.bold,
		color: theme.colors.onPrimary,
	},
	loading: {
		fontSize: theme.font.size.md,
		textAlign: "center",
		marginTop: theme.spacing.lg,
	},
	error: {
		fontSize: theme.font.size.md,
		color: theme.colors.error,
		textAlign: "center",
		marginTop: theme.spacing.lg,
	},
	empty: {
		fontSize: theme.font.size.md,
		textAlign: "center",
		marginTop: theme.spacing.lg,
	},
});
