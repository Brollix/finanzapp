import { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, SafeAreaView, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Menu from '../src/components/Menu';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { resolveBackendUrl } from '../src/utils/getBackendUrl';

import { core } from '../src/styles/core.styles';
import { theme } from '../src/styles/theme';
import { useOcr } from '../src/context/OcrContext';

// @ts-ignore
import formatted from '../src/data/formatted_ticket.json';

interface Ticket {
  id: string;
  supermarket: string;
  datetime: string;
  total: number | string;
  items: { description: string; quantity: number; price: number }[];
  text?: string; // raw text fallback
}



const extractTicket = () => {
  try {
    const raw = (formatted.choices[0].text as string).replace(/Answer:\s*/, '');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse formatted ticket', e);
    return null;
  }
};

const mock = extractTicket(); // sample placeholder if formatting service exists

const screenStyles = {
  homeContainer: {
    ...core.flex1,
    padding: theme.spacing.md,
  },
  homeHeader: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    marginBottom: theme.spacing.lg,
  },
  headerIcon: {
    fontSize: 28,
    color: theme.colors.text,
  },
  homeTitle: {
    ...core.h1,
    flex: 1,
    textAlign: 'center' as 'center',
  },
  headerPlaceholder: {
    width: 28,
  },
  homeCardContainer: {
    ...core.flex1,
  },
  fab: {
    ...core.fab,
  },
  fabIcon: {
    ...core.fabIcon,
  },
  fabModalBackdrop: {
    ...core.modalBackdrop,
  },
  fabModalContainer: {
    ...core.modalContainer,
  },
  fabModalTitle: {
    ...core.h3,
    marginBottom: theme.spacing.lg,
    textAlign: 'center' as 'center',
  },
  fabModalButton: {
    marginTop: theme.spacing.sm,
  },
  loadingModalContainer: {
    ...core.flex1,
    ...core.center,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingModalText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.background,
    fontFamily: theme.font.family.regular,
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [fabModalVisible, setFabModalVisible] = useState(false);
  const initialMock = mock ? [{ ...mock, id: 'mock' }] : [];
  const [tickets, setTickets] = useState<Ticket[]>(initialMock);
  const { isLoading, ocrResult, ocrError, clearOcrState } = useOcr();
  const [gptLoading, setGptLoading] = useState(false);

  // Llama/gpt formatting now handled server-side via `/format` endpoint
  const formatWithGpt = async (text: string) => {
    try {
      const base = resolveBackendUrl(process.env.EXPO_PUBLIC_GPT_URL, 8080);
      const url = base.endsWith('/format') ? base : `${base}/format`;
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await resp.json();
      if (data && !data.error) {
        return data as any;
      }
      return null;
    } catch (err) {
      console.error('GPT fetch error', err);
      return null;
    }
  };

  const handleAddManually = () => {
    setFabModalVisible(false);
    Alert.alert('Próximamente', 'La función para agregar registros manualmente estará disponible pronto.');
  };

  const handleScanTicket = () => {
    setFabModalVisible(false);
    router.push('/capture');
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Eliminar ticket', '¿Seguro que deseas eliminar este ticket?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setTickets(prev => prev.filter(t => t.id !== id)) },
    ]);
  };

  useEffect(() => {
    const run = async () => {
      if (ocrResult) {
        const recognizedText = (ocrResult as any).text || '';
        setGptLoading(true);
        const formatted = await formatWithGpt(recognizedText);
        const newTicket: Ticket = formatted
          ? { ...formatted, id: Date.now().toString() }
          : {
              id: Date.now().toString(),
              supermarket: 'Nuevo Ticket',
              datetime: new Date().toLocaleString(),
              total: 0,
              items: [],
              text: recognizedText,
            };
        setTickets(prev => [newTicket, ...prev]);
        setGptLoading(false);
        clearOcrState();
      } else if (ocrError) {
        Alert.alert('Error', 'No se pudo procesar la foto. Inténtalo de nuevo.');
        clearOcrState();
      }
    };

    run();
  }, [ocrResult, ocrError]);

  return (
    <SafeAreaView style={core.safeArea}>
      <Menu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
      <View style={screenStyles.homeContainer}>
        {/* Header */}
        <View style={screenStyles.homeHeader}>
          <Pressable onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" style={screenStyles.headerIcon} />
          </Pressable>
          <Text style={screenStyles.homeTitle}>Dashboard</Text>
          <View style={screenStyles.headerPlaceholder} />
        </View>

        {/* Body Content */}
        <View style={screenStyles.homeCardContainer}>
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push({ pathname: '/ticket', params: { data: JSON.stringify(item) } })} onLongPress={() => confirmDelete(item.id)}>
                <Card style={[core.card, { marginBottom: theme.spacing.md }]}>
                  <Text style={core.text}>{item.supermarket}</Text>
                  <Text style={core.h4}>{item.datetime}</Text>
                  {typeof item.total === 'number' ? (
                    <Text style={core.h2}>${item.total.toFixed(2)}</Text>
                  ) : item.total ? (
                    <Text style={core.h2}>${item.total}</Text>
                  ) : (
                    <Text style={core.text}>{item.text?.substring(0, 80)}...</Text>
                  )}
                </Card>
              </Pressable>
            )}
          />
          
        </View>

        {/* FAB */}
        <Pressable style={screenStyles.fab} onPress={() => setFabModalVisible(true)}>
          <Ionicons name="add" style={screenStyles.fabIcon} />
        </Pressable>

        {/* FAB Modal */}
        <Modal
          transparent
          visible={fabModalVisible}
          animationType="fade"
          onRequestClose={() => setFabModalVisible(false)}
        >
          <Pressable
            style={screenStyles.fabModalBackdrop}
            onPressOut={() => setFabModalVisible(false)}
          >
            <View style={screenStyles.fabModalContainer}>
              <Text style={screenStyles.fabModalTitle}>Agregar Registro</Text>
              <Button
                title="Escanear Ticket"
                onPress={handleScanTicket}
                fullWidth
                style={screenStyles.fabModalButton}
                leftIcon={<Ionicons name="camera-outline" />}
              />
              <Button
                title="Agregar Manualmente"
                onPress={handleAddManually}
                fullWidth
                variant="secondary"
                style={screenStyles.fabModalButton}
                leftIcon={<Ionicons name="create-outline" />}
              />
            </View>
          </Pressable>
        </Modal>
      </View>

      {/* Loading Spinner Modal */}
      <Modal
        transparent
        visible={isLoading || gptLoading}
        animationType="fade"
      >
        <View style={screenStyles.loadingModalContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={screenStyles.loadingModalText}>{gptLoading ? 'Formateando ticket...' : 'Procesando imagen...'}</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}