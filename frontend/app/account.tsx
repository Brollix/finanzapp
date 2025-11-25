import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import { View, Text, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useAuth } from "../src/features/auth/context/AuthContext";
import { core } from "../src/styles/core.styles";
import { useRouter } from "expo-router";
import { theme } from "../src/styles/theme";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";

export default function Account() {
	const router = useRouter();
	const { user, signOut } = useAuth();
	const [loading, setLoading] = useState(true);
	const [username, setUsername] = useState("");
	const [website, setWebsite] = useState("");
	const [avatarUrl, setAvatarUrl] = useState("");

	useEffect(() => {
		if (user) {
			getProfile();
		}
	}, [user]);

	async function getProfile() {
		if (!user) return;

		try {
			setLoading(true);
			const { data, error, status } = await supabase
				.from("profiles")
				.select(`username, website, avatar_url`)
				.eq("id", user.id)
				.single();

			if (error && status !== 406) {
				throw error;
			}

			if (data) {
				setUsername(data.username || "");
				setWebsite(data.website || "");
				setAvatarUrl(data.avatar_url || "");
			}
		} catch (error: any) {
			Alert.alert("Error", "Error al cargar el perfil: " + error.message);
		} finally {
			setLoading(false);
		}
	}

	async function updateProfile() {
		if (!user) return;

		try {
			setLoading(true);
			const updates = {
				id: user.id,
				username,
				website,
				avatar_url: avatarUrl,
				updated_at: new Date(),
			};

			const { error } = await supabase.from("profiles").upsert(updates);

			if (error) {
				throw error;
			}
			Alert.alert("Éxito", "¡Perfil actualizado exitosamente!");
		} catch (error: any) {
			Alert.alert("Error", "Error al actualizar el perfil: " + error.message);
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<View style={[core.flex1, core.center]}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Input
				label="Email"
				value={user?.email || ""}
				disabled
				style={styles.verticallySpaced}
			/>
			<Input
				label="Username"
				value={username}
				onChangeText={setUsername}
				placeholder="Tu nombre de usuario"
				style={styles.verticallySpaced}
			/>
			<Input
				label="Sitio Web"
				value={website}
				onChangeText={setWebsite}
				placeholder="https://tu-sitio.com"
				style={styles.verticallySpaced}
			/>

			<Button
				title="Actualizar perfil"
				onPress={updateProfile}
				disabled={loading}
				fullWidth
				style={styles.verticallySpaced}
			/>

			<Button
				title="Cerrar sesión"
				onPress={async () => {
					try {
						setLoading(true);
						await signOut();
					} catch (error: any) {
						console.error("Error al cerrar sesión:", error);
						Alert.alert("Error", "No se pudo cerrar sesión: " + error.message);
					} finally {
						setLoading(false);
						// Navigate to login regardless of error to ensure user exits
						router.replace("/login");
					}
				}}
				disabled={loading}
				fullWidth
				variant="danger"
				style={styles.verticallySpaced}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		padding: theme.spacing.md,
	},
	verticallySpaced: {
		marginTop: theme.spacing.md,
	},
});
