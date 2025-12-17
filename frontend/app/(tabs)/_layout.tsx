import { Tabs } from "expo-router";
import { CustomTabBar } from "../../src/components/navigation/CustomTabBar";

export default function TabsLayout() {
	return (
		<Tabs
			tabBar={(props) => <CustomTabBar {...props} />}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					href: "/(tabs)",
				}}
			/>
			<Tabs.Screen
				name="discounts"
				options={{
					href: "/(tabs)/discounts",
				}}
			/>
			<Tabs.Screen
				name="scan"
				options={{
					href: null, // Oculto, solo para estructura
				}}
			/>
			<Tabs.Screen
				name="tickets"
				options={{
					href: "/(tabs)/tickets",
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					href: "/(tabs)/profile",
				}}
			/>
		</Tabs>
	);
}
