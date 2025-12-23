import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter, usePathname, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/styles/theme";
import { FabModal } from "@/components/modals/FabModal";

interface TabItem {
	name: string;
	route: string;
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
}

const tabs: TabItem[] = [
	{ name: "index", route: "/(tabs)", icon: "home-outline", label: "Inicio" },
	{
		name: "discounts",
		route: "/(tabs)/discounts",
		icon: "pricetag-outline",
		label: "Descuentos",
	},
	{ name: "scan", route: "/(tabs)/scan", icon: "add", label: "" }, // Placeholder
	{
		name: "tickets",
		route: "/(tabs)/tickets",
		icon: "receipt-outline",
		label: "Tickets",
	},
	{
		name: "profile",
		route: "/(tabs)/profile",
		icon: "person-outline",
		label: "Perfil",
	},
];

export const CustomTabBar: React.FC = () => {
	const router = useRouter();
	const pathname = usePathname();
	const segments = useSegments();
	const [fabModalVisible, setFabModalVisible] = useState(false);

	const isActive = (tabName: string) => {
		const currentSegment = segments[segments.length - 1];

		if (tabName === "index") {
			return (
				!currentSegment ||
				currentSegment === "index" ||
				pathname === "/(tabs)" ||
				pathname === "/(tabs)/" ||
				pathname === "/"
			);
		}

		return currentSegment === tabName;
	};

	const handleTabPress = (tab: TabItem) => {
		if (tab.name === "scan") {
			setFabModalVisible(true);
		} else {
			if (tab.route === "/(tabs)") {
				router.push("/(tabs)" as any);
			} else {
				router.push(tab.route as any);
			}
		}
	};

	const handleScan = () => {
		setFabModalVisible(false);
		router.push("/capture");
	};

	const handleManual = () => {
		setFabModalVisible(false);
		router.push("/manual-entry");
	};

	return (
		<>
			<View style={styles.tabBar}>
				{tabs.map((tab, index) => {
					const active = isActive(tab.name);
					const isCenterButton = tab.name === "scan";

					if (isCenterButton) {
						return (
							<Pressable
								key={tab.name}
								style={styles.centerButton}
								onPress={() => handleTabPress(tab)}
								android_ripple={{ color: theme.colors.primary + "20" }}
							>
								<View style={styles.centerButtonInner}>
									<Ionicons
										name="add"
										size={48}
										color={theme.colors.onPrimary}
									/>
								</View>
							</Pressable>
						);
					}

					return (
						<Pressable
							key={tab.name}
							style={styles.tabButton}
							onPress={() => handleTabPress(tab)}
							android_ripple={{ color: theme.colors.primary + "20" }}
						>
							<Ionicons
								name={
									active ? (tab.icon.replace("-outline", "") as any) : tab.icon
								}
								size={24}
								color={
									active ? theme.colors.primary : theme.colors.textSecondary
								}
							/>
							<Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
								{tab.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
			<FabModal
				visible={fabModalVisible}
				onClose={() => setFabModalVisible(false)}
				onScan={handleScan}
				onManual={handleManual}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	tabBar: {
		flexDirection: "row",
		height: 70,
		backgroundColor: theme.colors.background,
		borderTopWidth: 1,
		borderTopColor: theme.colors.backgroundVariant,
		paddingBottom: Platform.OS === "ios" ? 20 : 8,
		paddingTop: 8,
		paddingHorizontal: theme.spacing.sm,
		justifyContent: "space-around",
		alignItems: "center",
		elevation: 8,
		shadowColor: theme.colors.shadow,
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	tabButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.spacing.xs,
	},
	tabLabel: {
		fontSize: 11,
		fontFamily: theme.font.family.regular,
		color: theme.colors.textSecondary,
		marginTop: theme.spacing.xs,
	},
	tabLabelActive: {
		color: theme.colors.primary,
		fontFamily: theme.font.family.bold,
	},
	centerButton: {
		width: 70,
		height: 70,
		borderRadius: 35,
		justifyContent: "center",
		alignItems: "center",
		marginTop: -30,
		marginHorizontal: theme.spacing.xs,
	},
	centerButtonInner: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: theme.colors.primary,
		justifyContent: "center",
		alignItems: "center",
		elevation: 8,
		shadowColor: theme.colors.shadow,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},
});
