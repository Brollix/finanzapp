import React from "react";
import {
	Modal,
	View,
	Text,
	StyleSheet,
	Pressable,
	FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../styles/theme";
import { core } from "../../styles/core.styles";

interface TopProduct {
	name: string;
	count: number;
	totalSpent: number;
}

interface TopProductsModalProps {
	visible: boolean;
	onClose: () => void;
	topProducts: TopProduct[];
}

export const TopProductsModal = ({
	visible,
	onClose,
	topProducts,
}: TopProductsModalProps) => {
	const renderItem = ({ item, index }: { item: TopProduct; index: number }) => (
		<View style={styles.productItem}>
			<View style={styles.rankContainer}>
				<Text style={styles.rankText}>{index + 1}</Text>
			</View>
			<View style={styles.productInfo}>
				<Text style={styles.productName} numberOfLines={1}>
					{item.name}
				</Text>
				<Text style={styles.productStats}>
					{item.count.toFixed(2).replace(/\.00$/, "")} Cant. • $
					{item.totalSpent.toFixed(2)}
				</Text>
			</View>
			{index < 3 && (
				<Ionicons
					name="trophy"
					size={20}
					color={
						index === 0
							? "#FFD700" // Gold
							: index === 1
							? "#C0C0C0" // Silver
							: "#CD7F32" // Bronze
					}
				/>
			)}
		</View>
	);

	return (
		<Modal
			animationType="slide"
			transparent={true}
			visible={visible}
			onRequestClose={onClose}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>Top 10 Productos</Text>
						<Pressable onPress={onClose} style={styles.closeButton}>
							<Ionicons name="close" size={24} color={theme.colors.text} />
						</Pressable>
					</View>

					<FlatList
						data={topProducts}
						renderItem={renderItem}
						keyExtractor={(item, index) => `${item.name}-${index}`}
						contentContainerStyle={styles.listContent}
						showsVerticalScrollIndicator={false}
						ListEmptyComponent={
							<Text style={styles.emptyText}>No hay datos disponibles</Text>
						}
					/>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: theme.colors.backdrop,
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: theme.colors.background,
		borderTopLeftRadius: theme.borderRadius.xl,
		borderTopRightRadius: theme.borderRadius.xl,
		height: "70%",
		padding: theme.spacing.lg,
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.lg,
	},
	title: {
		fontSize: theme.font.size.h2,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	closeButton: {
		padding: theme.spacing.xs,
	},
	listContent: {
		paddingBottom: theme.spacing.xl,
	},
	productItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	rankContainer: {
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: theme.colors.backgroundVariant,
		justifyContent: "center",
		alignItems: "center",
		marginRight: theme.spacing.md,
	},
	rankText: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.bold,
		color: theme.colors.primary,
	},
	productInfo: {
		flex: 1,
		marginRight: theme.spacing.md,
	},
	productName: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.regular,
		color: theme.colors.text,
		marginBottom: 2,
	},
	productStats: {
		fontSize: theme.font.size.sm,
		fontFamily: theme.font.family.regular,
		color: theme.colors.textSecondary,
	},
	emptyText: {
		textAlign: "center",
		marginTop: theme.spacing.xl,
		color: theme.colors.textSecondary,
		fontSize: theme.font.size.md,
	},
});
