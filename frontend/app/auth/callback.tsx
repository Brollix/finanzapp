import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../../src/lib/supabase";
import { theme } from "../../src/styles/theme";
import { core } from "../../src/styles/core.styles";

export default function AuthCallback() {
	const router = useRouter();

	useEffect(() => {
		const handleDeepLink = async (url: string | null) => {
			if (!url) return;

			try {
				// Supabase sends tokens in the hash fragment:
				// finanzapp://auth/callback#access_token=...&refresh_token=...&...

				let accessToken: string | null = null;
				let refreshToken: string | null = null;

				// 1. Try to extract from hash manually (most reliable for Supabase)
				const hashIndex = url.indexOf("#");
				if (hashIndex !== -1) {
					const hash = url.substring(hashIndex + 1);
					// Manual parsing to avoid URLSearchParams issues
					const pairs = hash.split("&");
					for (const pair of pairs) {
						const [key, value] = pair.split("=");
						if (key === "access_token") accessToken = value;
						if (key === "refresh_token") refreshToken = value;
					}
				}

				// 2. Fallback: Try expo-linking queryParams (in case it's sent as query params)
				if (!accessToken || !refreshToken) {
					const parsed = Linking.parse(url);
					if (parsed.queryParams) {
						if (parsed.queryParams.access_token) {
							accessToken = Array.isArray(parsed.queryParams.access_token)
								? parsed.queryParams.access_token[0]
								: parsed.queryParams.access_token;
						}
						if (parsed.queryParams.refresh_token) {
							refreshToken = Array.isArray(parsed.queryParams.refresh_token)
								? parsed.queryParams.refresh_token[0]
								: parsed.queryParams.refresh_token;
						}
					}
				}

				if (accessToken && refreshToken) {
					const { error } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					});

					if (error) throw error;

					// Redirect to home on success
					router.replace("/(tabs)");
				} else {
					// If no tokens found, go to login
					// console.warn("No tokens found in URL:", url);
					router.replace("/login");
				}
			} catch (error) {
				console.error("Error handling auth callback:", error);
				router.replace("/login");
			}
		};

		// Handle app launch from deep link
		Linking.getInitialURL().then(handleDeepLink);

		// Handle deep link while app is running
		const subscription = Linking.addEventListener("url", ({ url }) =>
			handleDeepLink(url)
		);

		return () => {
			subscription.remove();
		};
	}, []);

	return (
		<View
			style={[
				core.flex1,
				core.center,
				{ backgroundColor: theme.colors.background },
			]}
		>
			<ActivityIndicator size="large" color={theme.colors.primary} />
			<Text style={{ color: theme.colors.textSecondary, marginTop: 20 }}>
				Verificando...
			</Text>
		</View>
	);
}
