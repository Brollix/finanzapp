import { useState, useRef, useEffect } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import {
	useMediaLibraryPermissions,
	launchImageLibraryAsync,
	MediaTypeOptions,
} from "expo-image-picker";
import { receiptApi, ProcessingProgress } from "../services/receiptApi";

export const useReceiptScanner = () => {
	const [permission, requestPermission] = useCameraPermissions();
	const [mediaPermission, requestMediaPermission] =
		useMediaLibraryPermissions();
	const [loading, setLoading] = useState(false);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [progress, setProgress] = useState<ProcessingProgress | null>(null);
	const cameraRef = useRef<CameraView>(null);
	const router = useRouter();
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

	// Cleanup polling on unmount
	useEffect(() => {
		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
		};
	}, []);

	const processReceipt = async () => {
		if (!capturedImage) return;

		let receiptData: any = null;
		let jobId: string | undefined;

		try {
			setLoading(true);
			setProgress({
				status: "extracting_text",
				progress: 0,
				message: "Iniciando procesamiento...",
			});

			// Start processing
			const response = await receiptApi.processReceipt(capturedImage);
			receiptData = response.data;
			jobId = response.jobId;

			// If we have a jobId, start polling for progress
			if (jobId) {
				let pollCount = 0;
				const MAX_POLLS = 120; // Max 60 seconds (120 * 500ms)
				
				// Start polling immediately
				pollingIntervalRef.current = setInterval(async () => {
					pollCount++;
					
					// Safety: stop polling after max attempts
					if (pollCount > MAX_POLLS) {
						if (pollingIntervalRef.current) {
							clearInterval(pollingIntervalRef.current);
							pollingIntervalRef.current = null;
						}
						setLoading(false);
						Alert.alert(
							"Tiempo agotado",
							"El procesamiento está tomando más tiempo del esperado. Por favor, intenta nuevamente."
						);
						return;
					}
					
					try {
						const progressData = await receiptApi.getProcessingStatus(jobId!);
						setProgress(progressData);

						// If completed or error, stop polling
						if (
							progressData.status === "completed" ||
							progressData.status === "error"
						) {
							if (pollingIntervalRef.current) {
								clearInterval(pollingIntervalRef.current);
								pollingIntervalRef.current = null;
							}

							setLoading(false);

							if (progressData.status === "completed") {
								// If receiptId is available, fetch full receipt
								if (progressData.receiptId) {
									try {
										const fullReceipt = await receiptApi.getUserReceipts();
										const receipt = fullReceipt.find(r => r.id === progressData.receiptId);
										if (receipt) {
											router.push({
												pathname: "/receipt-confirmation",
												params: { receipt: JSON.stringify(receipt) },
											});
											return;
										}
									} catch (error) {
										console.error("Error fetching receipt:", error);
									}
								}
								
								// Fallback to original receiptData
								if (receiptData) {
									router.push({
										pathname: "/receipt-confirmation",
										params: { receipt: JSON.stringify(receiptData) },
									});
								}
							} else {
								// Handle error
								Alert.alert(
									"Error",
									progressData.error || "Error procesando el ticket"
								);
							}
						}
					} catch (error) {
						console.error("Error polling progress:", error);
						// Continue polling even if one request fails, but log consecutive failures
						if (pollCount % 10 === 0) {
							console.warn(`Failed to poll progress ${pollCount} times`);
						}
					}
				}, 500); // Poll every 500ms
			} else {
				// No jobId, use old flow (immediate response)
				setProgress({
					status: "completed",
					progress: 100,
					message: "Completado",
				});
				setLoading(false);
				if (receiptData) {
					router.push({
						pathname: "/receipt-confirmation",
						params: { receipt: JSON.stringify(receiptData) },
					});
				}
			}
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

			setProgress({
				status: "error",
				progress: 0,
				message: "Error",
				error: errorMessage,
			});
			Alert.alert("Ups, algo salió mal", errorMessage);
		} finally {
			// Don't set loading to false here if we're polling
			// It will be set to false when polling completes
			if (!pollingIntervalRef.current) {
				setLoading(false);
			}
		}
	};

	return {
		permission,
		requestPermission,
		mediaPermission,
		requestMediaPermission,
		loading,
		capturedImage,
		progress,
		cameraRef,
		takePicture,
		pickImageFromGallery,
		retakePicture,
		processReceipt,
	};
};
