import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Modal } from "./Modal";
import { theme } from "@/styles/theme";
import { styles } from "@/styles/index.styles";

export type AlertType = "default" | "success" | "warning" | "error";

export interface AlertButton {
	text: string;
	onPress?: () => void;
	style?: "default" | "cancel" | "destructive";
}

interface AlertProps {
	visible: boolean;
	title?: string;
	message?: string;
	buttons?: AlertButton[];
	type?: AlertType;
	onDismiss?: () => void;
}

const getTypeColor = (type: AlertType): string => {
	switch (type) {
		case "success":
			return theme.colors.success;
		case "warning":
			return theme.colors.warning;
		case "error":
			return theme.colors.error;
		default:
			return theme.colors.primary;
	}
};

export const Alert: React.FC<AlertProps> = ({
	visible,
	title,
	message,
	buttons = [{ text: "OK" }],
	type = "default",
	onDismiss,
}) => {
	const handleButtonPress = (button: AlertButton) => {
		if (button.onPress) {
			button.onPress();
		}
		if (onDismiss) {
			onDismiss();
		}
	};

	const typeColor = getTypeColor(type);

	return (
		<Modal
			visible={visible}
			onClose={onDismiss || (() => {})}
			disableBackdropPress={buttons.length > 1}
		>
			<View style={styles.alertContainer}>
				{title && (
					<Text style={[styles.alertTitle, { color: typeColor }]}>
						{title}
					</Text>
				)}
				{message && <Text style={styles.alertMessage}>{message}</Text>}
				<View style={styles.alertButtonRow}>
					{buttons.map((button, index) => {
						const isCancel = button.style === "cancel";
						const isDestructive = button.style === "destructive";
						const isLast = index === buttons.length - 1;

						let buttonStyle = styles.alertButton;
						let textStyle = styles.alertButtonText;

						if (isDestructive) {
							buttonStyle = [
								styles.alertButton,
								styles.alertButtonDestructive,
							];
							textStyle = [
								styles.alertButtonText,
								styles.alertButtonDestructiveText,
							];
						} else if (isCancel) {
							buttonStyle = [styles.alertButton, styles.alertButtonCancel];
							textStyle = [
								styles.alertButtonText,
								styles.alertButtonCancelText,
							];
						} else {
							buttonStyle = [
								styles.alertButton,
								styles.alertButtonDefault,
								{ backgroundColor: typeColor },
							];
							textStyle = [
								styles.alertButtonText,
								styles.alertButtonDefaultText,
							];
						}

						return (
							<Pressable
								key={index}
								style={[
									buttonStyle,
									!isLast && styles.alertButtonSpacing,
								]}
								onPress={() => handleButtonPress(button)}
							>
								<Text style={textStyle}>{button.text}</Text>
							</Pressable>
						);
					})}
				</View>
			</View>
		</Modal>
	);
};

