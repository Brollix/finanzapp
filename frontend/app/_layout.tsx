import { useFonts } from 'expo-font';
import { SplashScreen, Stack, Redirect, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { styles } from '@/styles/index.styles';
import { theme } from '@/styles/theme';
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { OcrProvider } from '../context/OcrContext';

// Componente para proteger rutas
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';

  // Si el usuario no está autenticado y no está en una ruta de autenticación, redirigir al login.
  if (!user && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  // Si el usuario está autenticado y está en una ruta de autenticación (ej. login), redirigir a la app.
  if (user && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

// Componente para manejar la carga inicial
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-Regular': require('../src/assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Bold': require('../src/assets/fonts/SpaceGrotesk-Bold.ttf'),
  });
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{
          marginTop: 10,
          color: theme.colors.text,
          fontFamily: theme.font.family.regular,
          fontSize: 16,
        }}>
          Cargando...
        </Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <OcrProvider>
        <View style={styles.safeArea}>
          <AuthGuard>
            <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}>
            {/* Rutas públicas */}
            <Stack.Screen 
              name="(auth)/login" 
              options={{ 
                title: 'Iniciar sesión',
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                  fontFamily: theme.font.family.bold,
                },
              }} 
            />
            
            {/* Rutas protegidas */}
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthGuard>
      </View>
      </OcrProvider>
    </AuthProvider>
  );

}
