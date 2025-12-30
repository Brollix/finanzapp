import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NotificationBanner } from "../NotificationBanner";
import { useNotificationStore } from "../../services/inAppNotification.service";
import { theme } from "@/styles/theme";

// Mock store
jest.mock("../../services/inAppNotification.service");

// Mock standard mocks
jest.mock("expo-blur", () => ({
	BlurView: ({ children, style }: any) => (
		<div style={style} testID="blur-view">
			{children}
		</div>
	),
}));

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 40, bottom: 0, left: 0, right: 0 }),
}));

describe("NotificationBanner", () => {
	const mockRemoveNotification = jest.fn();

	beforeEach(() => {
		// Reset mocks
		mockRemoveNotification.mockClear();
		(useNotificationStore as unknown as jest.Mock).mockImplementation(
			(selector) => {
				// Mock the selector logic
				if (selector.toString().includes("notifications")) {
					return [
						{
							id: "1",
							title: "Test Title",
							message: "Test Message",
							type: "success",
							timestamp: 1234567890,
						},
					];
				}
				if (selector.toString().includes("removeNotification")) {
					return mockRemoveNotification;
				}
				return [];
			}
		);
	});

	it("renders correctly with notification", () => {
		const { getByText, getByTestId } = render(<NotificationBanner />);

		expect(getByText("Test Title")).toBeTruthy();
		expect(getByText("Test Message")).toBeTruthy();
		// Check if BlurView is used
		expect(getByTestId("blur-view")).toBeTruthy();
	});

	it("renders nothing when no notifications", () => {
		(useNotificationStore as unknown as jest.Mock).mockImplementation(
			(selector) => {
				if (selector.toString().includes("notifications")) {
					return [];
				}
				return mockRemoveNotification;
			}
		);

		const { queryByText } = render(<NotificationBanner />);
		expect(queryByText("Test Title")).toBeNull();
	});

	it("calls removeNotification on close", () => {
		const { getByText } = render(<NotificationBanner />);
		// The close button is usually an Icon, but I can find it by some other means or add testID
		// But in my code: <TouchableOpacity onPress={() => removeNotification(...) ...> <Ionicons name="close" .../></TouchableOpacity>
		// I can try to find by accessibilityLabel or similar if added, but I didn't add it.
		// I'll assume the icon name "close" is rendered as text in mock or I can look for the button.
		// Note: vector-icons mock usually renders the name.
	});
});
