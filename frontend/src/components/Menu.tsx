import React, { useEffect, useRef } from "react";
import {
	Modal,
	View,
	Text,
	Animated,
	Dimensions,
	Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { useRouter } from "expo-router";
import { useAuth } from "../features/auth/context/AuthContext";
import { styles } from "../styles/index.styles";

export interface MenuItem {
	label: string;
	icon: keyof typeof MaterialIcons.glyphMap;
	onPress: () => void;
	isDestructive?: boolean;
}

export interface MenuProps {
	isVisible: boolean;
	onClose: () => void;
}

const { width } = Dimensions.get("window");

export default function Menu({ isVisible, onClose }: MenuProps) {
	const router = useRouter();
	const { signOut } = useAuth();
	const slideAnim = useRef(new Animated.Value(-width)).current;

	const handleSignOut = async () => {
		try {
			onClose(); // Close menu visually first
			await signOut();
			router.replace("/login");
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	useEffect(() => {
		Animated.timing(slideAnim, {
			toValue: isVisible ? 0 : -width,
			duration: 250,
			useNativeDriver: true,
		}).start();
	}, [isVisible, slideAnim]);

	const menuItems: MenuItem[] = [
		{
			label: "Inicio",
			icon: "home",
			onPress: () => {
				onClose();
				router.push("/home");
			},
		},
		{
			label: "Todos los Tickets",
			icon: "receipt-long",
			onPress: () => {
				onClose();
				router.push("/dashboard");
			},
		},
		{
			label: "Mi Perfil",
			icon: "person",
			onPress: () => {
				onClose();
				//router.push("/account");
			},
		},
		{
			label: "Cerrar Sesión",
			icon: "logout",
			onPress: handleSignOut,
			isDestructive: true,
		},
	];

	return (
		<Modal
			transparent
			visible={isVisible}
			animationType="none"
			onRequestClose={onClose}
		>
			<>
				<Pressable style={styles.menuBackdrop} onPress={onClose} />
				<Animated.View
					style={[
						styles.menuContent,
						{ width: width * 0.75, transform: [{ translateX: slideAnim }] },
					]}
				>
					{menuItems.map((item, index) => (
						<Pressable
							key={index}
							style={({ pressed }) => [
								styles.menuItem,
								pressed && styles.menuItemPressed,
							]}
							onPress={item.onPress}
						>
							<MaterialIcons
								name={item.icon}
								size={24}
								style={styles.menuItemIcon}
								color={
									item.isDestructive ? theme.colors.error : theme.colors.text
								}
							/>
							<Text
								style={[
									styles.menuItemText,
									item.isDestructive && styles.destructiveText,
								]}
							>
								{item.label}
							</Text>
						</Pressable>
					))}
				</Animated.View>
			</>
		</Modal>
	);
}
