import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, TouchableOpacityProps, View } from 'react-native';
import { styles } from '@/styles/index.styles';
import { theme } from '@/styles/theme';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title = '',
  variant = 'primary',
  fullWidth = false,
  style,
  textStyle,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const buttonStyles: ViewStyle[] = [styles.uiButton];
  const textStyles: TextStyle[] = [styles.uiButtonText];
  let iconColor = theme.colors.onPrimary;

  if (fullWidth) buttonStyles.push(styles.uiButtonFullWidth);
  if (disabled) buttonStyles.push(styles.uiButtonDisabled);

  switch (variant) {
    case 'primary':
      buttonStyles.push(styles.uiButtonPrimary);
      textStyles.push(styles.uiButtonPrimaryText);
      iconColor = theme.colors.onPrimary;
      break;
    case 'secondary':
      buttonStyles.push(styles.uiButtonSecondary);
      textStyles.push(styles.uiButtonSecondaryText);
      iconColor = theme.colors.onSecondary;
      break;
    case 'outline':
      buttonStyles.push(styles.uiButtonOutline);
      textStyles.push(styles.uiButtonOutlineText);
      iconColor = theme.colors.primary;
      break;
    case 'danger':
      buttonStyles.push(styles.uiButtonDanger);
      textStyles.push(styles.uiButtonDangerText);
      iconColor = theme.colors.onError;
      break;
  }

  const isIconOnly = !title && (leftIcon || rightIcon);

  if (isIconOnly) {
    buttonStyles.push({
      width: 64,
      height: 64,
      borderRadius: 32,
      paddingHorizontal: 0,
      minWidth: 0,
      justifyContent: 'center',
    });
  }

  if (style) buttonStyles.push(style);
  if (textStyle) textStyles.push(textStyle);

  const renderIcon = (icon: React.ReactNode) => {
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        color: iconColor,
        size: isIconOnly ? 30 : 20, // Larger icon for icon-only buttons
      });
    }
    return icon;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      {isIconOnly ? (
        renderIcon(leftIcon || rightIcon)
      ) : (
        <>
          {leftIcon && (
            <View style={styles.uiButtonIconLeft}>{renderIcon(leftIcon)}</View>
          )}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && (
            <View style={styles.uiButtonIconRight}>{renderIcon(rightIcon)}</View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};