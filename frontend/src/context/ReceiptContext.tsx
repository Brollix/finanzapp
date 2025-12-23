import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
} from "react";
import { Receipt } from "../types/receipt.types";
import { receiptApi } from "../services/receiptApi";
import { useAuth } from "../features/auth/context/AuthContext";

interface ReceiptContextType {
	receipts: Receipt[];
	loading: boolean;
	error: string | null;
	fetchReceipts: (force?: boolean) => Promise<void>;
	addReceipt: (receipt: Receipt) => void;
	updateReceipt: (receipt: Receipt) => void;
	removeReceipt: (id: string) => void;
	refreshReceipts: () => Promise<void>;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export const ReceiptProvider = ({ children }: { children: ReactNode }) => {
	const { user } = useAuth();
	const [receipts, setReceipts] = useState<Receipt[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loaded, setLoaded] = useState(false);

	const fetchReceipts = useCallback(
		async (force = false) => {
			if (!user) return;
			// If we already have data and we are not forcing a refresh, do nothing.
			if (loaded && !force) return;

			try {
				setLoading(true);
				setError(null);
				const data = await receiptApi.getUserReceipts();
				setReceipts(data || []);
				setLoaded(true);
			} catch (err) {
				setError("No se pudieron cargar los tickets");
			} finally {
				setLoading(false);
			}
		},
		[user, loaded]
	);

	const refreshReceipts = useCallback(async () => {
		await fetchReceipts(true);
	}, [fetchReceipts]);

	const addReceipt = useCallback((receipt: Receipt) => {
		setReceipts((prev) => [receipt, ...prev]);
	}, []);

	const updateReceipt = useCallback((updatedReceipt: Receipt) => {
		setReceipts((prev) =>
			prev.map((r) => (r.id === updatedReceipt.id ? updatedReceipt : r))
		);
	}, []);

	const removeReceipt = useCallback((id: string) => {
		setReceipts((prev) => prev.filter((r) => r.id !== id));
	}, []);

	return (
		<ReceiptContext.Provider
			value={{
				receipts,
				loading,
				error,
				fetchReceipts,
				addReceipt,
				updateReceipt,
				removeReceipt,
				refreshReceipts,
			}}
		>
			{children}
		</ReceiptContext.Provider>
	);
};

export const useReceipts = () => {
	const context = useContext(ReceiptContext);
	if (context === undefined) {
		throw new Error("useReceipts must be used within a ReceiptProvider");
	}
	return context;
};
