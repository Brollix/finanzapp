import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../src/lib/supabase";
import {
	View,
	Text,
	Alert,
	StyleSheet,
	ScrollView,
	Pressable,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/features/auth/context/AuthContext";
import { useRouter } from "expo-router";
import { theme } from "../../src/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCard } from "../../src/components/ui/AnimatedCard";
import { ChangePasswordModal } from "../../src/components/modals/ChangePasswordModal";
import { ProfileHeader } from "../../src/components/account/ProfileHeader";

export default function ProfileScreen() {
	const router = useRouter();
	const { user, signOut } = useAuth();
	const [loading, setLoading] = useState(false);
	const [username, setUsername] = useState("");
	const [avatarUrl, setAvatarUrl] = useState("");

	// Password Change State
	const [showPasswordChange, setShowPasswordChange] = useState(false);

	const getProfile = useCallback(async () => {
		if (!user) return;

		try {
			const { data, error, status } = await supabase
				.from("profiles")
				.select(`username, avatar_url`)
				.eq("id", user.id)
				.single();

			if (error && status !== 406) {
				throw error;
			}

			if (data) {
				setUsername(data.username || "");
				setAvatarUrl(data.avatar_url || "");
			}
		} catch (error: any) {
			console.error("Error loading profile:", error.message);
		}
	}, [user]);

	useEffect(() => {
		if (user) {
			getProfile();
		}
	}, [user, getProfile]);

	const handleSignOut = async () => {
		try {
			setLoading(true);
			await signOut();
			router.replace("/login");
		} catch (error: any) {
			Alert.alert("Error", error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Mi Perfil</Text>
			</View>

			<ScrollView style={styles.content}>
				{/* Profile Card */}
				<ProfileHeader
					user={user}
					username={username}
					avatarUrl={avatarUrl}
					onProfileUpdate={(newUsername) => setUsername(newUsername)}
				/>

				{/* Security Section */}
				<Text style={styles.sectionHeader}>Seguridad</Text>
				<AnimatedCard style={styles.card}>
					<Pressable
						style={styles.menuItem}
						onPress={() => setShowPasswordChange(true)}
					>
						<View style={styles.menuItemLeft}>
							<View
								style={[
									styles.iconContainer,
									{ backgroundColor: theme.colors.primary },
								]}
							>
								<Ionicons
									name="lock-closed"
									size={20}
									color={theme.colors.onPrimary}
								/>
							</View>
							<Text style={styles.menuItemText}>Cambiar Contraseña</Text>
						</View>
						<Ionicons
							name="chevron-forward"
							size={20}
							color={theme.colors.textSecondary}
						/>
					</Pressable>
				</AnimatedCard>

				{/* Logout Section */}
				<AnimatedCard style={styles.card}>
					<Pressable
						style={[styles.menuItem, loading && styles.menuItemDisabled]}
						onPress={handleSignOut}
						disabled={loading}
					>
						<View style={styles.menuItemLeft}>
							<View
								style={[
									styles.iconContainer,
									{ backgroundColor: theme.colors.error },
								]}
							>
								{loading ? (
									<ActivityIndicator
										size="small"
										color={theme.colors.onError}
									/>
								) : (
									<Ionicons
										name="log-out"
										size={20}
										color={theme.colors.onError}
									/>
								)}
							</View>
							<Text style={styles.menuItemText}>Cerrar Sesión</Text>
						</View>
						{!loading && (
							<Ionicons
								name="chevron-forward"
								size={20}
								color={theme.colors.textSecondary}
							/>
						)}
					</Pressable>
				</AnimatedCard>

				{/* Password Change Modal */}
				<ChangePasswordModal
					visible={showPasswordChange}
					onClose={() => setShowPasswordChange(false)}
				/>

				<View style={{ height: theme.spacing.xl }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.md,
	},
	headerTitle: {
		fontSize: theme.font.size.h4,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	content: {
		flex: 1,
		padding: theme.spacing.md,
	},
	sectionHeader: {
		fontSize: theme.font.size.sm,
		fontFamily: theme.font.family.bold,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.sm,
		marginLeft: theme.spacing.xs,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	card: {
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
		marginBottom: theme.spacing.lg,
		overflow: "hidden",
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: theme.spacing.md,
	},
	menuItemLeft: {
		flexDirection: "row",
		alignItems: "center",
	},
	iconContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		marginRight: theme.spacing.md,
	},
	menuItemText: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.regular,
		color: theme.colors.text,
	},
	menuItemDisabled: {
		opacity: 0.6,
	},
});
