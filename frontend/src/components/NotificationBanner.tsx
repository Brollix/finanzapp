import React from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Animated,
} from "react-native";
import { useNotificationStore } from "../services/inAppNotification.service";

/**
 * In-app notification banner component
 * Displays notifications at the top of the screen
 */
export const NotificationBanner: React.FC = () => {
	const notifications = useNotificationStore((state) => state.notifications);
	const removeNotification = useNotificationStore(
		(state) => state.removeNotification
	);

	// Only show the most recent notification
	const currentNotification = notifications[notifications.length - 1];

	if (!currentNotification) {
		return null;
	}

	const getBackgroundColor = () => {
		switch (currentNotification.type) {
			case "success":
				return "#10B981"; // Green
			case "error":
				return "#EF4444"; // Red
			case "info":
				return "#3B82F6"; // Blue
			case "processing":
				return "#F59E0B"; // Orange
			default:
				return "#6B7280"; // Gray
		}
	};

	const getIcon = () => {
		switch (currentNotification.type) {
			case "success":
				return "✅";
			case "error":
				return "❌";
			case "info":
				return "ℹ️";
			case "processing":
				return "⏳";
			default:
				return "📢";
		}
	};

	return (
		<View style={styles.container}>
			<View
				style={[styles.notification, { backgroundColor: getBackgroundColor() }]}
			>
				<View style={styles.content}>
					<Text style={styles.icon}>{getIcon()}</Text>
					<View style={styles.textContainer}>
						<Text style={styles.title}>{currentNotification.title}</Text>
						<Text style={styles.message}>{currentNotification.message}</Text>
					</View>
				</View>

				<View style={styles.actions}>
					{currentNotification.action && (
						<TouchableOpacity
							style={styles.actionButton}
							onPress={() => {
								currentNotification.action?.onPress();
								removeNotification(currentNotification.id);
							}}
						>
							<Text style={styles.actionText}>
								{currentNotification.action.label}
							</Text>
						</TouchableOpacity>
					)}

					<TouchableOpacity
						style={styles.closeButton}
						onPress={() => removeNotification(currentNotification.id)}
					>
						<Text style={styles.closeText}>✕</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 9999,
		paddingTop: 50, // Account for status bar
		paddingHorizontal: 16,
	},
	notification: {
		borderRadius: 12,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	content: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	icon: {
		fontSize: 24,
		marginRight: 12,
	},
	textContainer: {
		flex: 1,
	},
	title: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	message: {
		color: "#FFFFFF",
		fontSize: 14,
		opacity: 0.9,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "center",
		marginTop: 8,
	},
	actionButton: {
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
		marginRight: 8,
	},
	actionText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "600",
	},
	closeButton: {
		padding: 4,
	},
	closeText: {
		color: "#FFFFFF",
		fontSize: 20,
		fontWeight: "600",
	},
});
