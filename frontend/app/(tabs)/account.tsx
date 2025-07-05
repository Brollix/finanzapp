import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "@/features/auth/context/AuthContext";
import { styles } from "@/styles/index.styles";
import { theme } from "@/styles/theme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function Account() {
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
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.accountContainer}>
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
        onPress={() => signOut()}
        disabled={loading}
        fullWidth
        variant="danger"
        style={styles.verticallySpaced}
      />
    </View>
  );
}
