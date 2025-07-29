import { Stack } from 'expo-router';

// Root navigator: simple Stack with no header (screens may override)
import { AuthProvider } from '../src/features/auth/context/AuthContext';
import { OcrProvider } from '../src/context/OcrContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <OcrProvider>
      <Stack screenOptions={{ headerShown: false }} />
          </OcrProvider>
    </AuthProvider>
  );
}
