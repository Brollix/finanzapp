import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { styles } from '@/styles/index.styles';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
}) => {
  const cardStyles = [
    styles.card,
    variant === 'elevated' && styles.cardElevated,
    variant === 'outlined' && styles.cardOutlined,
    variant === 'filled' && styles.cardFilled,
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
};
