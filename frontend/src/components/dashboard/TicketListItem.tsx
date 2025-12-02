import React from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { AnimatedCard } from "../ui/AnimatedCard";
import { Receipt } from "../../types/receipt.types";
import { theme } from "../../styles/theme";
import { core } from "../../styles/core.styles";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatReceiptDateTime } from "../../utils/dateUtils";

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
			{(() => {
				const effectiveSaved =
					(item.total_saved || 0) > 0
						? item.total_saved || 0
						: item.items?.reduce((acc, i) => acc + (i.discount || 0), 0) || 0;

				if (effectiveSaved <= 0) return null;

				return (
					<Text
						style={{
							color: theme.colors.success,
							fontSize: theme.font.size.sm,
							fontWeight: "bold",
							marginTop: 4,
						}}
					>
						Ahorrado: ${formatCurrency(effectiveSaved)}
					</Text>
				);
			})()}
		</AnimatedCard>
	);
};
