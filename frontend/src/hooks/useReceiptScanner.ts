import { useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import {
	useMediaLibraryPermissions,
	launchImageLibraryAsync,
	MediaTypeOptions,
} from "expo-image-picker";
import { receiptApi } from "../services/receiptApi";

export const useReceiptScanner = () => {
	const [permission, requestPermission] = useCameraPermissions();
	const [mediaPermission, requestMediaPermission] =
		useMediaLibraryPermissions();
	const [loading, setLoading] = useState(false);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const cameraRef = useRef<CameraView>(null);
	const router = useRouter();

	const takePicture = async () => {
		if (cameraRef.current && !loading) {
			try {
				const photo = await cameraRef.current.takePictureAsync({
					quality: 0.5,
					base64: false,
					exif: false,
				});
				if (photo) {
					setCapturedImage(photo.uri);
				}
			} catch (error) {
				console.error("Error capturing photo:", error);
				Alert.alert("Error", "No se pudo capturar la foto");
			}
		}
	};

	const retakePicture = () => {
		setCapturedImage(null);
	};

	const pickImageFromGallery = async () => {
		if (loading) return;

		try {
			// Request permission if not granted
			if (!mediaPermission?.granted) {
				const permissionResult = await requestMediaPermission();
				if (!permissionResult.granted) {
					Alert.alert(
						"Permisos necesarios",
						"Necesitamos acceso a tu galería para seleccionar imágenes de tickets."
					);
					return;
				}
			}

			// Launch image picker
			const result = await launchImageLibraryAsync({
				mediaTypes: MediaTypeOptions.Images,
				quality: 0.5,
				allowsEditing: false,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				setCapturedImage(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error picking image from gallery:", error);
			Alert.alert("Error", "No se pudo seleccionar la imagen de la galería");
		}
	};

	const processReceipt = async () => {
		if (!capturedImage) return;

		try {
			setLoading(true);
			const receiptData = await receiptApi.processReceipt(capturedImage);

			router.push({
				pathname: "/receipt-confirmation",
				params: { receipt: JSON.stringify(receiptData) },
			});
		} catch (error) {
			console.error("Error processing receipt:", error);
			let errorMessage = "No se pudo procesar el ticket. Inténtalo de nuevo.";

			if (error instanceof Error) {
				console.error("Error message:", error.message);

				if (error.message.includes("Receipt API error")) {
					const statusMatch = error.message.match(/error (\d+):/);
					const status = statusMatch ? statusMatch[1] : "unknown";

					// Extract errorType from error message (format: "errorType: textract_error")
					const errorTypeMatch = error.message.match(/errorType: (\w+)/);
					const errorType = errorTypeMatch ? errorTypeMatch[1] : null;

					if (status === "400") {
						errorMessage =
							"La imagen no es clara o el formato no es válido. Por favor, intenta tomar una foto mejor iluminada.";
					} else if (status === "429") {
						errorMessage =
							"Has alcanzado el límite de escaneos por ahora. Por favor, intenta más tarde.";
					} else if (status === "500") {
						// Prioritize errorType detection over text matching
						if (errorType === "textract_error") {
							errorMessage =
								"No pudimos leer el texto del ticket. Asegúrate de que esté bien iluminado y enfocado.";
						} else if (errorType === "bedrock_error") {
							errorMessage =
								"La IA tuvo problemas para entender el ticket. Intenta tomar la foto desde otro ángulo.";
						} else if (errorType === "database_error") {
							errorMessage =
								"No se pudo guardar el ticket. Por favor, intenta de nuevo en unos momentos.";
						} else if (errorType === "unknown_error") {
							errorMessage =
								"Ocurrió un problema inesperado. Estamos trabajando en ello.";
						} else {
							// Fallback to text matching for backward compatibility
							if (
								error.message.includes("Textract") ||
								error.message.includes("textract")
							) {
								errorMessage =
									"No pudimos leer el texto del ticket. Asegúrate de que esté bien iluminado y enfocado.";
							} else if (
								error.message.includes("Bedrock") ||
								error.message.includes("bedrock")
							) {
								errorMessage =
									"La IA tuvo problemas para entender el ticket. Intenta tomar la foto desde otro ángulo.";
							} else {
								errorMessage =
									"Ocurrió un problema en nuestros servidores. Estamos trabajando en ello.";
							}
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

			Alert.alert("Ups, algo salió mal", errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return {
		permission,
		requestPermission,
		mediaPermission,
		requestMediaPermission,
		loading,
		capturedImage,
		cameraRef,
		takePicture,
		pickImageFromGallery,
		retakePicture,
		processReceipt,
	};
};
