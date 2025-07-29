import { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Menu from '../../src/components/Menu';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

import { styles } from '../../src/styles/index.styles';
import { theme } from '../../src/styles/theme';
import { useOcr } from '../../src/context/OcrContext';

export default function HomeScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [fabModalVisible, setFabModalVisible] = useState(false);
  const { isLoading, ocrResult, ocrError, clearOcrState } = useOcr();

  const handleAddManually = () => {
    setFabModalVisible(false);
    Alert.alert('Próximamente', 'La función para agregar registros manualmente estará disponible pronto.');
  };

  const handleScanTicket = () => {
    setFabModalVisible(false);
    router.push('/(tabs)/capture');
  };

  useEffect(() => {
    if (ocrResult) {
      const recognizedText = ocrResult.text || '';
      Alert.alert(
        'Éxito',
        `Ticket procesado. Texto: ${recognizedText.substring(
          0,
          80
        )}...`
      );
      clearOcrState();
    }
    if (ocrError) {
      Alert.alert('Error', 'No se pudo procesar la foto. Inténtalo de nuevo.');
      console.error('OCR Error:', ocrError);
      clearOcrState();
    }
  }, [ocrResult, ocrError]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Menu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
      <View style={styles.homeContainer}>
        {/* Header */}
        <View style={styles.homeHeader}>
          <Pressable onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" style={styles.headerIcon} />
          </Pressable>
          <Text style={styles.homeTitle}>Dashboard</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Body Content */}
        <View style={styles.homeCardContainer}>
          <Card style={styles.card}>
            <Text style={styles.text}>Balance del Mes</Text>
            <Text style={styles.h2}>$1,234.56</Text>
          </Card>
          <Card style={styles.card}>
            <Text style={styles.text}>Última Transacción</Text>
            <Text style={styles.h4}>Compra en Supermercado - $50.00</Text>
          </Card>
        </View>

        {/* FAB */}
        <Pressable style={styles.fab} onPress={() => setFabModalVisible(true)}>
          <Ionicons name="add" style={styles.fabIcon} />
        </Pressable>

        {/* FAB Modal */}
        <Modal
          transparent
          visible={fabModalVisible}
          animationType="fade"
          onRequestClose={() => setFabModalVisible(false)}
        >
          <Pressable
            style={styles.fabModalBackdrop}
            onPressOut={() => setFabModalVisible(false)}
          >
            <View style={styles.fabModalContainer}>
              <Text style={styles.fabModalTitle}>Agregar Registro</Text>
              <Button
                title="Escanear Ticket"
                onPress={handleScanTicket}
                fullWidth
                style={styles.fabModalButton}
                leftIcon={<Ionicons name="camera-outline" />}
              />
              <Button
                title="Agregar Manualmente"
                onPress={handleAddManually}
                fullWidth
                variant="secondary"
                style={styles.fabModalButton}
                leftIcon={<Ionicons name="create-outline" />}
              />
            </View>
          </Pressable>
        </Modal>
      </View>

      {/* Loading Spinner Modal */}
      <Modal
        transparent
        visible={isLoading}
        animationType="fade"
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 10, color: theme.colors.background, fontFamily: theme.font.family.regular }}>Procesando imagen...</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}