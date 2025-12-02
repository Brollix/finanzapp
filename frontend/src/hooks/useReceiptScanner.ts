import { useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { receiptApi } from "../services/receiptApi";

export const useReceiptScanner = () => {
	const [permission, requestPermission] = useCameraPermissions();
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

					if (status === "400") {
						errorMessage =
							"La imagen no es clara o el formato no es válido. Por favor, intenta tomar una foto mejor iluminada.";
					} else if (status === "429") {
						errorMessage =
							"Has alcanzado el límite de escaneos por ahora. Por favor, intenta más tarde.";
					} else if (status === "500") {
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

			Alert.alert("Ups, algo salió mal", errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return {
		permission,
		requestPermission,
		loading,
		capturedImage,
		cameraRef,
		takePicture,
		retakePicture,
		processReceipt,
	};
};
