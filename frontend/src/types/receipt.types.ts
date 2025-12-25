export interface ReceiptItem {
	product: string; // nombre genérico del producto
	brand?: string; // marca (opcional)
	quantity: number;
	price: number;
	unit_price?: number; // precio por unidad o por kg (opcional para compatibilidad con datos antiguos)
	is_weight?: boolean;
	discount?: number;
	promotion?: string;
}

export interface ReceiptData {
	supermarket: string; // nombre comercial limpio
	datetime: string;
	total: number; // precio final pagado (con descuentos aplicados)
	subtotal?: number; // precio antes de descuentos
	items: ReceiptItem[];
	discounts?: { description: string; amount: number }[];
	total_saved?: number;
}

export interface Receipt extends ReceiptData {
	id: string;
	user_id: string;
	image_url?: string;
	created_at: string;
}

export interface TopProduct {
	name: string;
	count: number;
	totalSpent: number;
}

export interface Statistics {
	totalTickets: number;
	totalSpent: number;
	averageTicket: number;
	totalItems: number;
	mostFrequentSupermarket: string;
	mostBoughtProduct: TopProduct | null;
	topProducts: TopProduct[];
}
