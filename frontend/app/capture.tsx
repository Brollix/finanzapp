import {
	View,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	StyleSheet,
	Text,
	Image,
	Animated,
	Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState, useEffect } from "react";
import type { CameraCapturedPicture } from "expo-camera";

import { Ionicons } from "@expo/vector-icons";

import { Button } from "../src/components/ui/Button";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { receiptApi } from "../src/services/receiptApi";
import { authService } from "../src/features/auth/services/authService";

const LOADING_MESSAGES = [
	"Analizando tu ticket con Inteligencia Artificial...",
	"FinanzApp está procesando tu gasto con AWS Bedrock...",
	"Extrayendo fecha, total y comercios...",
	"Esto puede tardar unos segundos. ¡Ya casi está!",
];

export default function Capture() {
	const cameraRef = useRef<CameraView>(null);
	const router = useRouter();
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [permission, requestPermission] = useCameraPermissions();
	const [isFlashOn, setIsFlashOn] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
	const fadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (loading) {
			// Start message rotation
			interval = setInterval(() => {
				setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
			}, 2500);

			// Fade in animation
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 500,
				useNativeDriver: true,
				easing: Easing.out(Easing.ease),
			}).start();
		} else {
			setLoadingMessageIndex(0);
			fadeAnim.setValue(0);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [loading]);

	if (!permission) {
		// Camera permissions are still loading
		return <View style={core.flex1} />;
	}

	if (!permission.granted) {
		// Camera permissions are not granted yet
		return (
			<View
				style={[
					core.flex1,
					core.center,
					{
						padding: theme.spacing.xl,
						backgroundColor: theme.colors.background,
					},
				]}
			>
				<View
					style={{
						width: 120,
						height: 120,
						borderRadius: 60,
						backgroundColor: theme.colors.surface,
						justifyContent: "center",
						alignItems: "center",
						marginBottom: theme.spacing.xl,
					}}
				>
					<Ionicons name="camera" size={60} color={theme.colors.primary} />
				</View>

				<Text
					style={[
						core.h2,
						{ marginBottom: theme.spacing.md, textAlign: "center" },
					]}
				>
					Acceso a la Cámara
				</Text>

				<Text
					style={[
						core.text,
						{
							textAlign: "center",
							marginBottom: theme.spacing.xl,
							color: theme.colors.textSecondary,
						},
					]}
				>
					Necesitamos acceso a tu cámara para que puedas escanear tus tickets y
					registrar gastos automáticamente.
				</Text>

				<Button
					onPress={requestPermission}
					title="Permitir Acceso"
					style={core.buttonFullWidth}
				/>
			</View>
		);
	}

	const handleCapture = async () => {
		if (cameraRef.current && !loading) {
			try {
				const photo: CameraCapturedPicture =
					await cameraRef.current.takePictureAsync({
						quality: 0.5, // Reduced quality for faster upload/processing
						base64: false,
						exif: false,
					});

				setCapturedImage(photo.uri);
				setIsFlashOn(false);
			} catch (error) {
				console.error("Error al capturar foto:", error);
				Alert.alert("Error", "No se pudo capturar la foto");
			}
		}
	};

	const handleRetake = () => {
		setCapturedImage(null);
	};

	const handleConfirm = async () => {
		if (!capturedImage) return;

		try {
			setLoading(true);
			// Get current user ID
			const user = await authService.getCurrentUser();
			if (!user) {
				Alert.alert("Error", "Usuario no autenticado");
				setLoading(false);
				return;
			}

			// Process receipt with backend
			try {
				console.log("📸 Iniciando procesamiento del ticket...");
				console.log("Usuario ID:", user.id);
				console.log("Imagen URI:", capturedImage);

				const receiptData = await receiptApi.processReceipt(
					capturedImage,
					user.id
				);

				console.log("✅ Ticket procesado exitosamente");

				// Success - navigate to confirmation screen
				router.push({
					pathname: "/receipt-confirmation",
					params: { receipt: JSON.stringify(receiptData) },
				});
			} catch (error) {
				console.error("❌ Error al procesar el ticket:", error);

				// Extract more detailed error information
				let errorMessage = "No se pudo procesar el ticket. Inténtalo de nuevo.";
				let errorDetails = "";

				if (error instanceof Error) {
					errorDetails = error.message;
					console.error("Error message:", error.message);

					// Parse backend error response if available
					if (error.message.includes("Receipt API error")) {
						// Extract status code and error text
						const statusMatch = error.message.match(/error (\d+):/);
						const status = statusMatch ? statusMatch[1] : "unknown";

						if (status === "400") {
							errorMessage =
								"La imagen no es clara o el formato no es válido. Por favor, intenta tomar una foto mejor iluminada.";
						} else if (status === "429") {
							errorMessage =
								"Has alcanzado el límite de escaneos por ahora. Por favor, intenta más tarde.";
						} else if (status === "500") {
							// Try to extract specific error type
							if (error.message.includes("Textract")) {
								errorMessage =
									"No pudimos leer el texto del ticket. Asegúrate de que esté bien iluminado y enfocado.";
							} else if (error.message.includes("Bedrock")) {
								errorMessage =
									"La IA tuvo problemas para entender el ticket. Intenta tomar la foto desde otro ángulo.";
							} else {
								errorMessage =
									"Ocurrió un problema en nuestros servidores. Estamos trabajando en ello.";
							}
						} else if (
							status === "unknown" ||
							error.message.includes("fetch") ||
							error.message.includes("Network request failed")
						) {
							errorMessage =
								"No se pudo conectar al servidor. Verifica tu conexión a internet.";
						}
					}
				}

				Alert.alert("Ups, algo salió mal", errorMessage, [
					{ text: "Entendido" },
				]);
			} finally {
				setLoading(false);
			}
		} catch (error) {
			console.error("❌ Error general:", error);
			Alert.alert(
				"Error Inesperado",
				"Ocurrió un error inesperado. Por favor, intenta nuevamente."
			);
			setLoading(false);
		}
	};

	return (
		<View style={core.flex1}>
			{capturedImage ? (
				<View style={[core.flex1, { backgroundColor: "#000" }]}>
					<Image
						source={{ uri: capturedImage }}
						style={core.flex1}
						onError={(e) =>
							console.error("Error loading image:", e.nativeEvent.error)
						}
					/>
					{loading ? (
						<Animated.View
							style={[styles.loadingOverlay, { opacity: fadeAnim }]}
						>
							<View style={styles.loadingContent}>
								<ActivityIndicator size="large" color={theme.colors.primary} />
								<Text style={styles.loadingTitle}>Procesando Ticket</Text>
								<Text style={styles.loadingMessage}>
									{LOADING_MESSAGES[loadingMessageIndex]}
								</Text>
								<View style={styles.loadingDots}>
									<Ionicons
										name="cloud-upload-outline"
										size={24}
										color={theme.colors.textSecondary}
									/>
									<Text style={{ color: theme.colors.textSecondary }}>
										{" "}
										• • •{" "}
									</Text>
									<Ionicons
										name="receipt-outline"
										size={24}
										color={theme.colors.textSecondary}
									/>
								</View>
							</View>
						</Animated.View>
					) : (
						<View style={styles.captureOverlay}>
							<Button
								onPress={handleRetake}
								title="Reintentar"
								variant="outline"
								style={{ flex: 1, marginRight: theme.spacing.sm }}
							/>
							<Button
								onPress={handleConfirm}
								title="Usar foto"
								style={{ flex: 1, marginLeft: theme.spacing.sm }}
							/>
						</View>
					)}
				</View>
			) : (
				<>
					<CameraView
						ref={cameraRef}
						style={styles.camera}
						facing="back"
						enableTorch={isFlashOn}
					/>
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
				</>
			)}
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
		backgroundColor: "rgba(0,0,0,0.85)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
	},
	loadingContent: {
		alignItems: "center",
		padding: theme.spacing.xl,
		width: "80%",
	},
	loadingTitle: {
		color: theme.colors.primary,
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.sm,
	},
	loadingMessage: {
		color: theme.colors.text,
		fontSize: theme.font.size.md,
		textAlign: "center",
		marginBottom: theme.spacing.xl,
		lineHeight: 24,
	},
	loadingDots: {
		flexDirection: "row",
		alignItems: "center",
		opacity: 0.7,
	},
	permissionContainer: {
		justifyContent: "center",
		alignItems: "center",
		padding: theme.spacing.xl,
		backgroundColor: theme.colors.background,
	},
	permissionText: {
		textAlign: "center",
		marginBottom: theme.spacing.lg,
		color: theme.colors.text,
		fontSize: theme.font.size.md,
	},
});
