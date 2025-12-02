export interface ReceiptItem {
	product: string; // Product name without brand
	brand?: string; // Brand name (optional)
	quantity: number;
	price: number;
	is_weight?: boolean; // True if item is sold by weight (kg, g)
	product_id?: string; // ID from products table
	discount?: number; // Discount amount for this item
	promotion?: string; // Promotion description (e.g., "2x1", "50% 2da u.")
}

export interface Discount {
	description: string;
	amount: number;
}

export interface ReceiptData {
	supermarket: string;
	datetime: string;
	total: number; // Final price paid (with discounts applied)
	subtotal?: number; // Price before discounts
	items: ReceiptItem[];
	discounts?: Discount[]; // List of all discounts found
	total_saved?: number; // Total amount saved
}

export interface Receipt extends ReceiptData {
	id: string;
	user_id: string;
	image_url?: string;
	created_at: string;
}
