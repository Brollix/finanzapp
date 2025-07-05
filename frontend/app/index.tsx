import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { theme } from "@/styles/theme";

export default function Index() {
	const router = useRouter();

	useEffect(() => {
		const checkSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (session?.user) router.replace("/(tabs)/home");
			else router.replace("src/(auth)/login");
		};
		checkSession();
	}, []);

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: theme.colors.background,
			}}
		>
			

			<ActivityIndicator size="large" color={theme.colors.primary} />
		</View>
	);
}
