import React, { useRef } from "react";
import { Pressable, ViewStyle, StyleProp, Animated } from "react-native";
import { Card } from "./Card";

interface AnimatedCardProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
	onLongPress?: () => void;
	variant?: "elevated" | "outlined" | "filled";
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
	children,
	style,
	onPress,
	onLongPress,
	variant,
}) => {
	const scale = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scale, {
			toValue: 0.95,
			useNativeDriver: true,
			speed: 20,
			bounciness: 10,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(scale, {
			toValue: 1,
			useNativeDriver: true,
			speed: 20,
			bounciness: 10,
		}).start();
	};

	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			delayLongPress={500}
		>
			<Animated.View style={[{ transform: [{ scale }] }]}>
				<Card style={style} variant={variant}>
					{children}
				</Card>
			</Animated.View>
		</Pressable>
	);
};
