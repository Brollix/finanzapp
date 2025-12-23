import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useReceipts, ReceiptProvider } from "../ReceiptContext";
import { Receipt } from "@/types/receipt.types";

// Mock dependencies
jest.mock("@/lib/supabase", () => ({
	supabase: {
		from: jest.fn(() => ({
			select: jest.fn(() => ({
				eq: jest.fn(() => ({
					order: jest.fn(() => Promise.resolve({ data: [], error: null })),
				})),
			})),
		})),
	},
}));

jest.mock("@/features/auth/context/AuthContext", () => ({
	useAuth: () => ({
		user: { id: "test-user-id", email: "test@example.com" },
		loading: false,
		signOut: jest.fn(),
	}),
}));

describe("ReceiptContext", () => {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ReceiptProvider>{children}</ReceiptProvider>
	);

	it("should provide receipts context", () => {
		const { result } = renderHook(() => useReceipts(), { wrapper });

		expect(result.current).toBeDefined();
		expect(Array.isArray(result.current.receipts)).toBe(true);
		expect(typeof result.current.addReceipt).toBe("function");
		expect(typeof result.current.updateReceipt).toBe("function");
		expect(typeof result.current.removeReceipt).toBe("function");
	});

	it("should initialize with empty receipts array", () => {
		const { result } = renderHook(() => useReceipts(), { wrapper });

		expect(result.current.receipts).toEqual([]);
	});

	it("should add a receipt", () => {
		const { result } = renderHook(() => useReceipts(), { wrapper });

		const mockReceipt: Receipt = {
			id: "1",
			user_id: "test-user",
			supermarket: "Test Market",
			datetime: "2025-01-01T12:00:00",
			total: 100,
			total_saved: 10,
			items: [],
			created_at: "2025-01-01T12:00:00",
		};

		act(() => {
			result.current.addReceipt(mockReceipt);
		});

		expect(result.current.receipts).toContainEqual(mockReceipt);
	});

	it("should remove a receipt", () => {
		const { result } = renderHook(() => useReceipts(), { wrapper });

		const mockReceipt: Receipt = {
			id: "1",
			user_id: "test-user",
			supermarket: "Test Market",
			datetime: "2025-01-01T12:00:00",
			total: 100,
			total_saved: 10,
			items: [],
			created_at: "2025-01-01T12:00:00",
		};

		act(() => {
			result.current.addReceipt(mockReceipt);
		});

		expect(result.current.receipts).toHaveLength(1);

		act(() => {
			result.current.removeReceipt("1");
		});

		expect(result.current.receipts).toHaveLength(0);
	});
});

