import React from "react";
import { render } from "@testing-library/react-native";
import { StatsGrid } from "../StatsGrid";
import { Statistics } from "@/types/receipt.types";

describe("StatsGrid", () => {
	const mockStatistics: Statistics = {
		totalTickets: 10,
		totalSpent: 5000,
		averageTicket: 500,
		totalItems: 50,
		mostFrequentSupermarket: "Carrefour",
		mostBoughtProduct: {
			name: "Leche",
			count: 5,
			totalSpent: 500,
		},
		topProducts: [
			{ name: "Leche", count: 5, totalSpent: 500 },
			{ name: "Pan", count: 3, totalSpent: 300 },
		],
	};

	it("should render correctly with statistics", () => {
		const { getByText } = render(<StatsGrid statistics={mockStatistics} />);

		expect(getByText("10")).toBeTruthy();
		expect(getByText("Tickets")).toBeTruthy();
	});

	it("should display total spent", () => {
		const { getByText } = render(<StatsGrid statistics={mockStatistics} />);

		expect(getByText("5000.00")).toBeTruthy();
		expect(getByText("Total Gastado")).toBeTruthy();
	});

	it("should display average ticket", () => {
		const { getByText } = render(<StatsGrid statistics={mockStatistics} />);

		expect(getByText("500.00")).toBeTruthy();
		expect(getByText("Ticket Promedio")).toBeTruthy();
	});

	it("should display total items", () => {
		const { getByText } = render(<StatsGrid statistics={mockStatistics} />);

		expect(getByText("50")).toBeTruthy();
		expect(getByText("Productos")).toBeTruthy();
	});
});

