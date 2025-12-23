import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { theme } from "@/styles/theme";
import { ReceiptItem } from "@/types/receipt.types";
import { useAlert } from "@/context/AlertContext";

interface ManualItemFormProps {
	visible: boolean;
	item: ReceiptItem | null;
	onSave: (item: ReceiptItem) => void;
	onCancel: () => void;
}

export const ManualItemForm: React.FC<ManualItemFormProps> = ({
	visible,
	item,
	onSave,
	onCancel,
}) => {
	const { showAlert } = useAlert();
	const [product, setProduct] = useState(item?.product || "");
	const [brand, setBrand] = useState(item?.brand || "");
	const [quantity, setQuantity] = useState(item?.quantity?.toString() || "");
	const [price, setPrice] = useState(item?.price?.toString() || "");
	const [isWeight, setIsWeight] = useState(item?.is_weight || false);
	const [discount, setDiscount] = useState(item?.discount?.toString() || "");
	const [promotion, setPromotion] = useState(item?.promotion || "");

	// Update state when item changes
	React.useEffect(() => {
		if (item) {
			setProduct(item.product);
			setBrand(item.brand || "");
			setQuantity(item.quantity.toString());
			setPrice(item.price.toString());
			setIsWeight(item.is_weight || false);
			setDiscount(item.discount?.toString() || "");
			setPromotion(item.promotion || "");
		} else {
			setProduct("");
			setBrand("");
			setQuantity("");
			setPrice("");
			setIsWeight(false);
			setDiscount("");
			setPromotion("");
		}
	}, [item, visible]);

	const handleSave = () => {
		if (!product.trim()) {
			showAlert("Error", "El nombre del producto es requerido", undefined, "error");
			return;
		}
		if (!quantity || parseFloat(quantity) <= 0) {
			showAlert("Error", "La cantidad debe ser mayor a 0", undefined, "error");
			return;
		}
		if (!price || parseFloat(price) <= 0) {
			showAlert("Error", "El precio debe ser mayor a 0", undefined, "error");
			return;
		}

		onSave({
			product: product.trim(),
			brand: brand.trim() || undefined,
			quantity: parseFloat(quantity),
			price: parseFloat(price),
			is_weight: isWeight,
			discount: discount ? parseFloat(discount) : undefined,
			promotion: promotion.trim() || undefined,
		});

		// Reset form
		setProduct("");
		setBrand("");
		setQuantity("");
		setPrice("");
		setIsWeight(false);
		setDiscount("");
		setPromotion("");
	};

	if (!visible) return null;

	return (
		<View style={styles.modalOverlay}>
			<View style={styles.modalContent}>
				<Text style={styles.modalTitle}>
					{item ? "Editar Item" : "Agregar Item"}
				</Text>

				<Input
					label="Producto *"
					value={product}
					onChangeText={setProduct}
					placeholder="Ej: Leche"
					containerStyle={styles.inputContainer}
				/>

				<Input
					label="Marca (opcional)"
					value={brand}
					onChangeText={setBrand}
					placeholder="Ej: La Serenísima"
					containerStyle={styles.inputContainer}
				/>

				<Input
					label="Cantidad *"
					value={quantity}
					onChangeText={setQuantity}
					placeholder="Ej: 1"
					keyboardType="decimal-pad"
					containerStyle={styles.inputContainer}
				/>

				<Input
					label="Precio Total *"
					value={price}
					onChangeText={setPrice}
					placeholder="Ej: 150.50"
					keyboardType="decimal-pad"
					containerStyle={styles.inputContainer}
				/>

				<Input
					label="Descuento (opcional)"
					value={discount}
					onChangeText={setDiscount}
					placeholder="Ej: 500"
					keyboardType="decimal-pad"
					containerStyle={styles.inputContainer}
				/>

				<Input
					label="Promoción (opcional)"
					value={promotion}
					onChangeText={setPromotion}
					placeholder="Ej: 2x1"
					containerStyle={styles.inputContainer}
				/>

				<TouchableOpacity
					style={styles.weightToggle}
					onPress={() => setIsWeight(!isWeight)}
					activeOpacity={0.7}
				>
					<Ionicons
						name={isWeight ? "checkbox" : "square-outline"}
						size={24}
						color={theme.colors.primary}
					/>
					<Text style={styles.weightToggleText}>
						Producto vendido por peso (kg)
					</Text>
				</TouchableOpacity>

				<View style={styles.modalButtons}>
					<Button
						title="Cancelar"
						variant="outline"
						onPress={onCancel}
						style={styles.modalButton}
					/>
					<Button
						title="Guardar"
						onPress={handleSave}
						style={styles.modalButton}
					/>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: theme.colors.backdrop,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 1000,
	},
	modalContent: {
		width: "90%",
		maxWidth: 400,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.xl,
		padding: theme.spacing.xl,
		maxHeight: "80%",
	},
	modalTitle: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.lg,
		textAlign: "center",
	},
	inputContainer: {
		marginBottom: theme.spacing.md,
	},
	weightToggle: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: theme.spacing.md,
		padding: theme.spacing.sm,
	},
	weightToggleText: {
		fontSize: theme.font.size.md,
		color: theme.colors.text,
		marginLeft: theme.spacing.sm,
		flex: 1,
	},
	modalButtons: {
		flexDirection: "row",
		gap: theme.spacing.md,
		marginTop: theme.spacing.lg,
	},
	modalButton: {
		flex: 1,
	},
});
