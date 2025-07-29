import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { theme } from '@/styles/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  overlayStyle?: StyleProp<ViewStyle>;
  disableBackdropPress?: boolean;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    maxWidth: '90%',
  },
});

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  animationType = 'fade',
  transparent = true,
  contentContainerStyle,
  overlayStyle,
  disableBackdropPress = false,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const handleBackdropPress = () => {
    if (!disableBackdropPress) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <RNModal
      animationType={animationType}
      transparent={transparent}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity: fadeAnim },
            overlayStyle,
          ]}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.content, contentContainerStyle]}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};
