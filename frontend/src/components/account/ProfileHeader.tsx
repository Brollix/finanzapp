import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { theme } from "../../styles/theme";
import { core } from "../../styles/core.styles";
import { supabase } from "../../lib/supabase";
import { User } from "../../features/auth/types";

interface ProfileHeaderProps {
	user: User | null;
	username: string;
	avatarUrl: string;
	onProfileUpdate: (newUsername: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
	user,
	username,
	avatarUrl,
	onProfileUpdate,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [newUsername, setNewUsername] = useState(username);
	const [loading, setLoading] = useState(false);

	// Sync local state when prop changes (e.g. initial load)
	React.useEffect(() => {
		setNewUsername(username);
	}, [username]);

	async function updateProfile() {
		if (!user) return;

		try {
			setLoading(true);
			const updates = {
				id: user.id,
				username: newUsername,
				updated_at: new Date(),
			};

			const { error } = await supabase.from("profiles").upsert(updates);

			if (error) throw error;

			onProfileUpdate(newUsername);
			setIsEditing(false);
			Alert.alert("Éxito", "Perfil actualizado");
		} catch (error: any) {
			Alert.alert("Error", error.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<View style={styles.profileSection}>
			<View style={styles.avatarContainer}>
				{avatarUrl ? (
					// TODO: Use Image component when avatar is implemented
					<View style={styles.avatarPlaceholder}>
						<Text style={styles.avatarInitials}>
							{username.slice(0, 2).toUpperCase()}
						</Text>
					</View>
				) : (
					<View style={styles.avatarPlaceholder}>
						<Ionicons name="person" size={40} color={theme.colors.text} />
					</View>
				)}
				<Pressable style={styles.editAvatarButton}>
					<Ionicons name="camera" size={16} color={theme.colors.background} />
				</Pressable>
			</View>

			{!isEditing ? (
				<View style={styles.userInfo}>
					<Text style={styles.username}>{username || "Sin nombre"}</Text>
					<Text style={styles.email}>{user?.email}</Text>
					<Pressable
						style={styles.editProfileButton}
						onPress={() => setIsEditing(true)}
					>
						<Text style={styles.editProfileText}>Editar Perfil</Text>
					</Pressable>
				</View>
			) : (
				<View style={styles.editForm}>
					<Input
						label="Nombre de usuario"
						value={newUsername}
						onChangeText={setNewUsername}
						placeholder="Tu nombre"
						containerStyle={styles.inputSpacing}
					/>
					<View style={styles.editActions}>
						<Button
							title="Cancelar"
							onPress={() => {
								setIsEditing(false);
								setNewUsername(username);
							}}
							variant="outline"
							style={core.flex1}
						/>
						<View style={{ width: theme.spacing.md }} />
						<Button
							title="Guardar"
							onPress={updateProfile}
							loading={loading}
							style={core.flex1}
						/>
					</View>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	profileSection: {
		alignItems: "center",
		marginBottom: theme.spacing.xl,
	},
	avatarContainer: {
		position: "relative",
		marginBottom: theme.spacing.md,
	},
	avatarPlaceholder: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: theme.colors.backgroundVariant,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: theme.colors.primary,
	},
	avatarInitials: {
		fontSize: theme.font.size.h2,
		fontFamily: theme.font.family.bold,
		color: theme.colors.primary,
	},
	editAvatarButton: {
		position: "absolute",
		bottom: 0,
		right: 0,
		backgroundColor: theme.colors.primary,
		padding: theme.spacing.sm,
		borderRadius: theme.borderRadius.xl,
		borderWidth: 2,
		borderColor: theme.colors.background,
	},
	userInfo: {
		alignItems: "center",
		width: "100%",
	},
	username: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.xs,
	},
	email: {
		fontSize: theme.font.size.md,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.md,
	},
	editProfileButton: {
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.sm,
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.full,
	},
	editProfileText: {
		color: theme.colors.primary,
		fontFamily: theme.font.family.bold,
		fontSize: theme.font.size.sm,
	},
	editForm: {
		width: "100%",
		marginTop: theme.spacing.md,
	},
	editActions: {
		flexDirection: "row",
		marginTop: theme.spacing.md,
	},
	inputSpacing: {
		marginBottom: theme.spacing.md,
	},
});
