import React from 'react';
import { TextInput, TextInputProps, View, Text, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { styles } from '@/styles/index.styles';
import { theme } from '@/styles/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
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
  ...props
}) => {
  const textInputStyles = [styles.uiInput, inputStyle];
  if (disabled) {
    textInputStyles.push(styles.uiInputDisabled);
  }

  return (
    <View style={[styles.uiInputContainer, containerStyle]}>
      {label && <Text style={[styles.uiInputLabel, labelStyle]}>{label}</Text>}
      <View style={[
        styles.uiInputBox,
        error ? styles.uiInputErrorContainer : {},
        disabled ? styles.uiInputDisabledContainer : {},
      ]}>
        {leftIcon && <View style={styles.uiInputIcon}>{leftIcon}</View>}
        <TextInput
          style={textInputStyles}
          placeholderTextColor={theme.colors.placeholder}
          editable={!disabled}
          {...props}
        />
        {rightIcon && <View style={styles.uiInputIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.uiInputErrorText}>{error}</Text>}
    </View>
  );
};
