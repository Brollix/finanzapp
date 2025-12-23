import { useState, useRef, useEffect } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useAlert } from "@/context/AlertContext";
import {
	useMediaLibraryPermissions,
	launchImageLibraryAsync,
	MediaTypeOptions,
} from "expo-image-picker";
import { receiptApi, ProcessingProgress } from "../services/receiptApi";
import { parseReceiptError } from "../services/errorService";

export const useReceiptScanner = () => {
	const { showAlert } = useAlert();
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
			showAlert("Error", "No se pudo seleccionar la imagen de la galería", undefined, "error");
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
						showAlert(
							"Tiempo agotado",
							"El procesamiento está tomando más tiempo del esperado. Por favor, intenta nuevamente.",
							undefined,
							"warning"
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
										const receipt = fullReceipt.find(
											(r) => r.id === progressData.receiptId
										);
										if (receipt) {
											router.push({
												pathname: "/receipt-confirmation",
												params: { receipt: JSON.stringify(receipt) },
											});
											return;
										}
									} catch (error) {
										// Error fetching receipt, fallback to original receiptData
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
								showAlert(
									"Error",
									progressData.error || "Error procesando el ticket",
									undefined,
									"error"
								);
							}
						}
					} catch (error) {
						// Continue polling even if one request fails
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
			// Usar el servicio centralizado de errores
			const parsedError = parseReceiptError(error);

			setProgress({
				status: "error",
				progress: 0,
				message: "Error",
				error: parsedError.message,
			});
			showAlert(parsedError.title, parsedError.message, undefined, parsedError.type);
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
