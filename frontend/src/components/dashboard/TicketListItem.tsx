import React from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { AnimatedCard } from "../ui/AnimatedCard";
import { Receipt } from "../../types/receipt.types";
import { theme } from "../../styles/theme";
import { core } from "../../styles/core.styles";

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
			<Text style={core.h4}>{item.datetime}</Text>
			<Text style={core.h2}>${item.total.toFixed(2)}</Text>
		</AnimatedCard>
	);
};
