import { useState, useRef, useEffect } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useAlert } from "@/context/AlertContext";
import {
	useMediaLibraryPermissions,
	launchImageLibraryAsync,
	MediaTypeOptions,
} from "expo-image-picker";
import { receiptApi } from "../services/receiptApi";
import { backgroundProcessingService } from "../services/backgroundProcessing.service";
import { parseReceiptError } from "../services/errorService";

export const useReceiptScanner = () => {
	const { showAlert } = useAlert();
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
				showAlert("Error", "No se pudo capturar la foto", undefined, "error");
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
					showAlert(
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
			showAlert(
				"Error",
				"No se pudo seleccionar la imagen de la galería",
				undefined,
				"error"
			);
		}
	};

	const processReceipt = async () => {
		if (!capturedImage) return;

		// Prevent multiple simultaneous processing
		if (loading) {
			console.warn("[ReceiptScanner] Already processing, ignoring request");
			return;
		}

		try {
			// Show loading briefly just to initiate
			setLoading(true);
			console.log("[ReceiptScanner] Starting background processing...");

			// Start background processing
			await backgroundProcessingService.startProcessing(
				capturedImage,
				async (receiptId) => {
					console.log(
						"[ReceiptScanner] Callback triggered for receipt:",
						receiptId
					);
					try {
						// Fetch receipt data to navigate
						const fullReceipt = await receiptApi.getUserReceipts();
						const receipt = fullReceipt.find((r) => r.id === receiptId);

						if (receipt) {
							router.push({
								pathname: "/receipt-confirmation",
								params: { receipt: JSON.stringify(receipt) },
							});
						} else {
							showAlert(
								"Error",
								"No se pudo encontrar el ticket procesado",
								undefined,
								"error"
							);
						}
					} catch (error) {
						console.error(
							"[ReceiptScanner] Error navigating to receipt:",
							error
						);
						showAlert(
							"Error",
							"No se pudo abrir el ticket",
							undefined,
							"error"
						);
					}
				}
			);

			// Immediately reset state to allow user to continue using the app
			setLoading(false);
			setCapturedImage(null);

			// Navigate to home screen so user can continue using the app
			router.push("/(tabs)");

			// Optional: Show a toast/alert that processing started (handled by service notification)
			// showAlert("Procesando", "Te avisaremos cuando el ticket esté listo", undefined, "success");
		} catch (error) {
			console.error("[ReceiptScanner] Error starting processing:", error);
			setLoading(false);
			const parsedError = parseReceiptError(error);
			showAlert(
				parsedError.title,
				parsedError.message,
				undefined,
				parsedError.type
			);
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
