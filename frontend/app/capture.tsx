import {
	View,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView } from "expo-camera";
import { useRef, useState } from "react";
import type { CameraCapturedPicture } from "expo-camera";

import { Ionicons } from "@expo/vector-icons";

import { Button } from "../src/components/ui/Button";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { receiptApi } from "../src/services/receiptApi";
import { authService } from "../src/features/auth/services/authService";

export default function Capture() {
	const cameraRef = useRef<CameraView>(null);
	const router = useRouter();
	const [isFlashOn, setIsFlashOn] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleCapture = async () => {
		if (cameraRef.current && !loading) {
			try {
				setLoading(true);
				const photo: CameraCapturedPicture =
					await cameraRef.current.takePictureAsync({
						quality: 0.6,
						skipProcessing: true,
					});

				// Get current user ID
				const user = await authService.getCurrentUser();
				if (!user) {
					Alert.alert("Error", "Usuario no autenticado");
					setLoading(false);
					return;
				}

				// Process receipt with backend
				try {
					await receiptApi.processReceipt(photo.uri, user.id);
					// Success - navigate back
					router.back();
				} catch (error) {
					console.error("Error al procesar el ticket:", error);
					Alert.alert(
						"Error",
						"No se pudo procesar el ticket. Inténtalo de nuevo."
					);
					setLoading(false);
				}
			} catch (error) {
				console.error("Error al capturar foto:", error);
				Alert.alert("Error", "No se pudo capturar la foto");
				setLoading(false);
			}
		}
	};

	return (
		<View style={core.flex1}>
			<CameraView
				ref={cameraRef}
				style={styles.camera}
				facing="back"
				enableTorch={isFlashOn}
			/>
			{loading && (
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
				</View>
			)}
			<View style={styles.captureOverlay}>
				<TouchableOpacity
					style={styles.flashButton}
					onPress={() => setIsFlashOn(!isFlashOn)}
					disabled={loading}
				>
					<Ionicons
						name={isFlashOn ? "flash" : "flash-off"}
						size={28}
						color={isFlashOn ? theme.colors.warning : theme.colors.text}
					/>
				</TouchableOpacity>
				<Button
					testID="capture-button"
					onPress={handleCapture}
					leftIcon={<Ionicons name="camera" />}
					disabled={loading}
					loading={loading}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	camera: {
		flex: 1,
	},
	captureOverlay: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.backdrop,
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
	},
	flashButton: {
		padding: theme.spacing.sm,
	},
	loadingOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.7)",
		justifyContent: "center",
		alignItems: "center",
	},
});
