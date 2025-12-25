import React from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Receipt } from "@/types/receipt.types";
import { theme } from "@/styles/theme";
import { core } from "@/styles/core.styles";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatReceiptDateTime } from "@/utils/dateUtils";

interface TicketListItemProps {
	item: Receipt;
	onLongPress: (id: string) => void;
}

export const TicketListItem: React.FC<TicketListItemProps> = ({
	item,
	onLongPress,
}) => {
	const router = useRouter();

	return (
		<AnimatedCard
			style={[core.card, { marginBottom: theme.spacing.md }]}
			onPress={() =>
				router.push({
					pathname: "/ticket",
					params: { data: JSON.stringify(item) },
				})
			}
			onLongPress={() => onLongPress(item.id)}
		>
			<Text style={core.text}>{item.supermarket}</Text>
			<Text style={core.h4}>{formatReceiptDateTime(item.datetime)}</Text>
			<Text style={core.h2}>${formatCurrency(item.total)}</Text>
			{item.total_saved && item.total_saved > 0 && (
				<Text
					style={{
						color: theme.colors.success,
						fontSize: theme.font.size.sm,
						fontWeight: "bold",
						marginTop: 4,
					}}
				>
					Ahorrado: ${formatCurrency(item.total_saved)}
				</Text>
			)}
		</AnimatedCard>
	);
};
