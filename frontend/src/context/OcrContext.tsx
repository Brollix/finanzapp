import React, { createContext, useState, useContext, ReactNode } from "react";
import { ReceiptData } from "../types/receipt.types";

export type OcrStatus = "idle" | "loading" | "success" | "error";

interface OcrContextState {
	status: OcrStatus;
	receipt: ReceiptData | null;
	error: Error | null;
}

interface OcrContextType extends OcrContextState {
	startOcr: () => void;
	setOcrSuccess: (receipt: ReceiptData) => void;
	setOcrError: (error: Error) => void;
	resetOcr: () => void;
}

const OcrContext = createContext<OcrContextType | undefined>(undefined);

export const OcrProvider = ({ children }: { children: ReactNode }) => {
	const [status, setStatus] = useState<OcrStatus>("idle");
	const [receipt, setReceipt] = useState<ReceiptData | null>(null);
	const [error, setError] = useState<Error | null>(null);

	const startOcr = () => {
		setStatus("loading");
		setReceipt(null);
		setError(null);
	};

	const setOcrSuccess = (data: ReceiptData) => {
		setReceipt(data);
		setStatus("success");
		setError(null);
	};

	const setOcrError = (err: Error) => {
		setError(err);
		setStatus("error");
	};

	const resetOcr = () => {
		setStatus("idle");
		setReceipt(null);
		setError(null);
	};

	return (
		<OcrContext.Provider
			value={{
				status,
				receipt,
				error,
				startOcr,
				setOcrSuccess,
				setOcrError,
				resetOcr,
			}}
		>
			{children}
		</OcrContext.Provider>
	);
};

export const useOcr = () => {
	const context = useContext(OcrContext);
	if (context === undefined) {
		throw new Error("useOcr must be used within an OcrProvider");
	}
	return context;
};
