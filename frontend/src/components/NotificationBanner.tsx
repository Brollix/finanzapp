import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotificationStore } from "../services/inAppNotification.service";
import { theme } from "@/styles/theme";

/**
 * In-app notification banner component
 * Minimalist, transparent, centered notification
 */
export const NotificationBanner: React.FC = () => {
	const notifications = useNotificationStore((state) => state.notifications);
	const removeNotification = useNotificationStore(
		(state) => state.removeNotification
	);
	const insets = useSafeAreaInsets();

	const currentNotification = notifications[notifications.length - 1];

	if (!currentNotification) {
		return null;
	}

	const getConfig = () => {
		switch (currentNotification.type) {
			case "success":
				return { color: theme.colors.success };
			case "error":
				return { color: theme.colors.error };
			case "info":
				return { color: theme.colors.info };
			case "processing":
				return { color: theme.colors.warning };
			default:
				return { color: theme.colors.text };
		}
	};

	const config = getConfig();

	return (
		<Animated.View
			entering={FadeIn.duration(400)}
			exiting={FadeOut.duration(400)}
			style={[
				styles.container,
				{
					paddingTop: insets.top + theme.spacing.sm,
				},
			]}
		>
			<TouchableOpacity
				style={styles.touchableArea}
				activeOpacity={0.8}
				onPress={() => {
					if (currentNotification.action) {
						currentNotification.action.onPress();
					}
					removeNotification(currentNotification.id);
				}}
			>
				<View style={styles.content}>
					<Text style={[styles.title, { color: config.color }]}>
						{currentNotification.title}
					</Text>
					<Text style={styles.message}>{currentNotification.message}</Text>
					{currentNotification.action && (
						<Text style={[styles.hint, { color: config.color }]}>
							Tocá para ver el ticket
						</Text>
					)}
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 9999,
		alignItems: "center",
		justifyContent: "flex-start",
	},
	touchableArea: {
		width: "90%",
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.lg,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.backgroundVariant, // Solid opaque background
		borderRadius: theme.borderRadius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		// Shadows
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
		elevation: 8,
	},
	content: {
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: theme.font.size.lg, // Larger text
		fontWeight: theme.font.weight.bold,
		fontFamily: theme.font.family.bold,
		textAlign: "center",
		marginBottom: 4,
		textShadowColor: "rgba(0, 0, 0, 0.75)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 4,
	},
	message: {
		color: theme.colors.text,
		fontSize: theme.font.size.md, // Larger message
		fontFamily: theme.font.family.regular,
		textAlign: "center",
		marginBottom: 4,
		textShadowColor: "rgba(0, 0, 0, 0.75)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 4,
	},
	hint: {
		fontSize: theme.font.size.sm,
		fontFamily: theme.font.family.bold,
		marginTop: 4,
		opacity: 0.9,
		textShadowColor: "rgba(0, 0, 0, 0.75)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 4,
	},
});
