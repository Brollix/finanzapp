export interface ReceiptItem {
	product: string; // nombre genérico del producto
	brand?: string; // marca (opcional)
	quantity: number;
	price: number;
}

export interface ReceiptData {
	supermarket: string; // nombre comercial limpio
	datetime: string;
	total: number;
	items: ReceiptItem[];
}
