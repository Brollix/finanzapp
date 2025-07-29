import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { Providers } from '../src/providers';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'SpaceGrotesk-Regular': require('../src/assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Bold': require('../src/assets/fonts/SpaceGrotesk-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Providers>
      <Stack>
        {/* La pantalla de índice (nuestro guardián) no necesita cabecera */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </Providers>
  );
}
