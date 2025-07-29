import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { styles } from '../../src/styles/index.styles';
import { theme } from '../../src/styles/theme';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Por favor ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email, password });
      router.replace('/');
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      alert(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <Input
        label="Correo electrónico"
        placeholder="tucorreo@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Input
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Cargando...' : 'Iniciar sesión'}
        onPress={handleLogin}
        disabled={loading}
        fullWidth
        style={{ ...styles.button, marginTop: theme.spacing.md }}
      />
    </View>
  );
}

export default function LoginScreen() {
  const handleForgotPassword = () => {
    alert('Función de recuperación de contraseña');
  };

  const handleRegister = () => {
    alert('Función de registro');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.centeredContent}>
        <View style={styles.authHeader}>
          <Text style={styles.authTitle}>Finanzapp</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar.</Text>
        </View>

        <LoginForm />

        <View>
          <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: theme.spacing.lg }}>
            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRegister} style={{ marginTop: theme.spacing.sm }}>
            <Text style={styles.linkText}>¿No tienes una cuenta?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
