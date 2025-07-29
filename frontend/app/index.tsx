import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../src/features/auth/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { theme } from '../src/styles/theme';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // No hacer nada mientras se carga el estado de autenticación.
    if (loading) {
      return;
    }

    // Una vez que la carga ha terminado, redirigir al usuario.
    if (user) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  // Muestra un indicador de carga mientras se determina la ruta.
  // Esto es lo que el usuario ve brevemente antes de ser redirigido.
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
