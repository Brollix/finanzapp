import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useCameraPermissions } from "expo-camera";

// Mantener el splash visible hasta que se carguen las fuentes
SplashScreen.preventAutoHideAsync().catch(() => {});

// Root navigator: simple Stack with no header (screens may override)
import { AuthProvider } from "../src/features/auth/context/AuthContext";
import { OcrProvider } from "../src/context/OcrContext";
import { ReceiptProvider } from "../src/context/ReceiptContext";
import { AlertProvider } from "../src/context/AlertContext";

import * as Linking from "expo-linking";

export default function RootLayout() {
	const url = Linking.createURL("/auth/callback");

	const [fontsLoaded] = useFonts({
		"SpaceGrotesk-Regular": require("../src/assets/fonts/SpaceGrotesk-Regular.ttf"),
		"SpaceGrotesk-Bold": require("../src/assets/fonts/SpaceGrotesk-Bold.ttf"),
	});

	const [permission, requestPermission] = useCameraPermissions();

	useEffect(() => {
		if (permission && !permission.granted && permission.canAskAgain) {
			requestPermission();
		}
	}, [permission]);

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return null; // Mantener pantalla de splash hasta cargar fuentes
	}
	return (
		<AuthProvider>
			<ReceiptProvider>
				<OcrProvider>
					<AlertProvider>
						<Stack screenOptions={{ headerShown: false }} />
					</AlertProvider>
				</OcrProvider>
			</ReceiptProvider>
		</AuthProvider>
	);
}
