export interface ReceiptItem {
	product: string; // nombre genérico del producto
	brand?: string; // marca (opcional)
	quantity: number;
	price: number;
	is_weight?: boolean;
}

export interface ReceiptData {
	supermarket: string; // nombre comercial limpio
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
