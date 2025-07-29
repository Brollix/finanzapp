import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../src/features/auth/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { theme } from '../src/styles/theme';
import { core } from '../src/styles/core.styles';

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
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [user, loading]);

  // Muestra un indicador de carga mientras se determina la ruta.
  // Esto es lo que el usuario ve brevemente antes de ser redirigido.
  return (
    <View style={[core.flex1, core.center, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
