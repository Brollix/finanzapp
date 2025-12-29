import { create } from "zustand";

export interface InAppNotification {
	id: string;
	title: string;
	message: string;
	type: "success" | "error" | "info" | "processing";
	timestamp: number;
	action?: {
		label: string;
		onPress: () => void;
	};
	autoHide?: boolean;
	duration?: number;
}

interface NotificationStore {
	notifications: InAppNotification[];
	addNotification: (
		notification: Omit<InAppNotification, "id" | "timestamp">
	) => string;
	removeNotification: (id: string) => void;
	clearAll: () => void;
}

/**
 * In-app notification store using Zustand
 * Manages notifications that appear within the app
 */
export const useNotificationStore = create<NotificationStore>((set) => ({
	notifications: [],

	addNotification: (notification) => {
		const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const newNotification: InAppNotification = {
			...notification,
			id,
			timestamp: Date.now(),
			autoHide: notification.autoHide ?? true,
			duration: notification.duration ?? 5000,
		};

		set((state) => ({
			notifications: [...state.notifications, newNotification],
		}));

		// Auto-remove after duration if autoHide is true
		if (newNotification.autoHide) {
			setTimeout(() => {
				set((state) => ({
					notifications: state.notifications.filter((n) => n.id !== id),
				}));
			}, newNotification.duration);
		}

		return id;
	},

	removeNotification: (id) => {
		set((state) => ({
			notifications: state.notifications.filter((n) => n.id !== id),
		}));
	},

	clearAll: () => {
		set({ notifications: [] });
	},
}));

/**
 * Helper functions for common notification types
 */
export const notificationService = {
	/**
	 * Show success notification
	 */
	success(
		title: string,
		message: string,
		action?: InAppNotification["action"]
	) {
		return useNotificationStore.getState().addNotification({
			title,
			message,
			type: "success",
			action,
		});
	},

	/**
	 * Show error notification
	 */
	error(title: string, message: string, action?: InAppNotification["action"]) {
		return useNotificationStore.getState().addNotification({
			title,
			message,
			type: "error",
			action,
			duration: 7000, // Errors stay longer
		});
	},

	/**
	 * Show info notification
	 */
	info(title: string, message: string, action?: InAppNotification["action"]) {
		return useNotificationStore.getState().addNotification({
			title,
			message,
			type: "info",
			action,
		});
	},

	/**
	 * Show processing notification (doesn't auto-hide)
	 */
	processing(title: string, message: string) {
		return useNotificationStore.getState().addNotification({
			title,
			message,
			type: "processing",
			autoHide: false, // Processing notifications stay until manually removed
		});
	},

	/**
	 * Remove a specific notification
	 */
	remove(id: string) {
		useNotificationStore.getState().removeNotification(id);
	},

	/**
	 * Clear all notifications
	 */
	clearAll() {
		useNotificationStore.getState().clearAll();
	},
};
