export interface ReceiptItem {
	product: string; // Product name without brand
	brand?: string; // Brand name (optional)
	quantity: number;
	price: number;
	is_weight?: boolean; // True if item is sold by weight (kg, g)
	product_id?: string; // ID from products table
}

export interface ReceiptData {
	supermarket: string;
	datetime: string;
	total: number;
	items: ReceiptItem[];
}

export interface Receipt extends ReceiptData {
	id: string;
	user_id: string;
	image_url?: string;
	created_at: string;
}
