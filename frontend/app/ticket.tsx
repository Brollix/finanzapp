import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, SafeAreaView, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../src/components/ui/Card';
import { core } from '../src/styles/core.styles';
import { theme } from '../src/styles/theme';

export default function TicketScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();
  const ticket = data ? JSON.parse(data) : null;

  if (!ticket) {
    return (
      <SafeAreaView style={core.safeArea}>
        <Text style={core.text}>Sin datos de ticket.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={core.safeArea}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.primary} />
        </Pressable>
        <Text style={[core.h4, { marginLeft: theme.spacing.sm }]}>Detalle Ticket</Text>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={core.h4}>{ticket.supermarket}</Text>
        <Text style={core.text}>{ticket.datetime}</Text>
        {!!ticket.total && typeof ticket.total === 'number' ? (
        <Text style={[core.h4, { marginTop: theme.spacing.sm }]}>Total: ${ticket.total.toFixed(2)}</Text>
      ) : ticket.total ? (
        <Text style={[core.h4, { marginTop: theme.spacing.sm }]}>Total: ${ticket.total}</Text>
      ) : null}
      </View>

      {ticket.items && ticket.items.length > 0 ? (
        <FlatList
          data={ticket.items}
          keyExtractor={(item: any, index: number) => index.toString()}
          renderItem={({ item }: any) => (
            <Card style={[core.card, { marginHorizontal: theme.spacing.md, marginTop: theme.spacing.sm }]}>
              <Text style={core.cardText}>{item.description}</Text>
              <Text style={core.cardText}>Qty: {item.quantity}</Text>
              <Text style={core.cardText}>${item.price}</Text>
            </Card>
          )}
        />
      ) : (
        <Card style={[core.card, { margin: theme.spacing.md }]}>
          <Text style={core.text}>{ticket.text?.substring(0, 400) || 'Sin items'}</Text>
        </Card>
      )}
    </SafeAreaView>
  );
}
