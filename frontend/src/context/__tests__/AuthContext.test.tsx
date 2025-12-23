import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { useAuth, AuthProvider } from "../../../src/features/auth/context/AuthContext";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
	supabase: {
		auth: {
			getSession: jest.fn(),
			onAuthStateChange: jest.fn(() => ({
				data: { subscription: { unsubscribe: jest.fn() } },
			})),
			signOut: jest.fn(),
		},
	},
}));

describe("AuthContext", () => {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<AuthProvider>{children}</AuthProvider>
	);

	it("should provide auth context", () => {
		const { result } = renderHook(() => useAuth(), { wrapper });

		expect(result.current).toBeDefined();
		expect(result.current.user).toBeNull();
		expect(result.current.loading).toBeDefined();
		expect(typeof result.current.signOut).toBe("function");
	});

	it("should have signOut function", () => {
		const { result } = renderHook(() => useAuth(), { wrapper });

		expect(typeof result.current.signOut).toBe("function");
	});

	it("should initialize with loading state", () => {
		const { result } = renderHook(() => useAuth(), { wrapper });

		expect(result.current.loading).toBe(true);
	});
});

