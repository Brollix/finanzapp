import React from "react";
import {
	TextInput,
	TextInputProps,
	View,
	Text,
	ViewStyle,
	TextStyle,
	StyleProp,
} from "react-native";
import { styles } from "@/styles/index.styles";
import { theme } from "@/styles/theme";

export interface InputProps extends TextInputProps {
	label?: string;
	labelStyle?: StyleProp<TextStyle>;
	error?: string;
	containerStyle?: StyleProp<ViewStyle>;
	disabled?: boolean;
	inputStyle?: TextStyle;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	borderColor?: string;
}

export const Input: React.FC<InputProps> = ({
	label,
	labelStyle,
	error,
	containerStyle,
	disabled = false,
	inputStyle,
	leftIcon,
	rightIcon,
	borderColor,
	onFocus,
	onBlur,
	...props
}) => {
	const [isFocused, setIsFocused] = React.useState(false);
	const textInputStyles = [styles.uiInput, inputStyle];
	if (disabled) {
		textInputStyles.push(styles.uiInputDisabled);
	}

	const handleFocus = (e: any) => {
		setIsFocused(true);
		onFocus?.(e);
	};

	const handleBlur = (e: any) => {
		setIsFocused(false);
		onBlur?.(e);
	};

	return (
		<View style={[styles.uiInputContainer, containerStyle]}>
			{label && <Text style={[styles.uiInputLabel, labelStyle]}>{label}</Text>}
			<View
				style={[
					styles.uiInputBox,
					error ? styles.uiInputErrorContainer : {},
					disabled ? styles.uiInputDisabledContainer : {},
					isFocused && !borderColor && !error
						? { borderColor: theme.colors.primary, borderWidth: 2 }
						: {},
					borderColor ? { borderColor } : {},
				]}
			>
				{leftIcon && <View style={styles.uiInputIcon}>{leftIcon}</View>}
				<TextInput
					style={textInputStyles}
					placeholderTextColor={theme.colors.placeholder}
					editable={!disabled}
					onFocus={handleFocus}
					onBlur={handleBlur}
					{...props}
				/>
				{rightIcon && <View style={styles.uiInputIcon}>{rightIcon}</View>}
			</View>
			{error && <Text style={styles.uiInputErrorText}>{error}</Text>}
		</View>
	);
};
