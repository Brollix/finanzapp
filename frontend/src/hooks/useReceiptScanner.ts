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
	const pollingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
				clearTimeout(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, []);

	const processReceipt = async () => {
		if (!capturedImage) return;
		
		// Prevent multiple simultaneous processing
		if (loading) {
			console.warn("[ReceiptScanner] Already processing, ignoring request");
			return;
		}
		
		// Clean up any existing polling
		if (pollingIntervalRef.current) {
			clearTimeout(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}

		let receiptData: any = null;
		let jobId: string | undefined;

		try {
			setLoading(true);
			setProgress({
				status: "extracting_text",
				progress: 0,
				message: "Iniciando procesamiento...",
			});

			console.log("[ReceiptScanner] Starting receipt processing...");
			console.log("[ReceiptScanner] Image URI:", capturedImage);
			
			// Start processing
			const response = await receiptApi.processReceipt(capturedImage);
			console.log("[ReceiptScanner] Response received:", JSON.stringify(response, null, 2));
			
			receiptData = response.data;
			jobId = response.jobId;
			console.log("[ReceiptScanner] JobId:", jobId);

			// If we have a jobId, start polling for progress
			// BUT: if we already have receiptData, the processing is likely complete
			// Check status once before starting polling
			if (jobId) {
				let pollCount = 0;
				let consecutiveErrors = 0;
				const MAX_POLLS = 60; // Max 60 seconds (60 * 1000ms)
				const MAX_CONSECUTIVE_ERRORS = 3; // Stop after 3 consecutive errors

				// Check initial status before starting polling
				try {
					const initialProgress = await receiptApi.getProcessingStatus(jobId);
					console.log("[ReceiptScanner] Initial progress check:", initialProgress);
					
					// If already completed, skip polling
					if (initialProgress.status === "completed" || initialProgress.status === "error") {
						console.log("[ReceiptScanner] Processing already finished, skipping polling");
						setProgress(initialProgress);
						setLoading(false);
						
						if (initialProgress.status === "completed" && initialProgress.receiptId) {
							// Navigate to confirmation with receiptId
							try {
								const fullReceipt = await receiptApi.getUserReceipts();
								const receipt = fullReceipt.find((r) => r.id === initialProgress.receiptId);
								if (receipt) {
									await router.push({
										pathname: "/receipt-confirmation",
										params: { receipt: JSON.stringify(receipt) },
									});
									setCapturedImage(null);
									return;
								}
							} catch (error) {
								console.error("[ReceiptScanner] Error fetching receipt:", error);
							}
						}
						
						// Fallback to receiptData if available
						if (receiptData) {
							await router.push({
								pathname: "/receipt-confirmation",
								params: { receipt: JSON.stringify(receiptData) },
							});
							setCapturedImage(null);
							return;
						}
						
						if (initialProgress.status === "error") {
							showAlert(
								"Error",
								initialProgress.error || "Error procesando el ticket",
								undefined,
								"error"
							);
						}
						return;
					}
				} catch (error) {
					console.warn("[ReceiptScanner] Initial status check failed, starting polling anyway:", error);
				}

				// Start polling with exponential backoff using recursive setTimeout
				let pollInterval = 2000; // Start with 2 seconds to avoid rate limiting
				let isPollingActive = true;
				
				const poll = async () => {
					if (!isPollingActive) return;
					
					pollCount++;

					// Safety: stop polling after max attempts
					if (pollCount > MAX_POLLS) {
						isPollingActive = false;
						if (pollingIntervalRef.current) {
							clearTimeout(pollingIntervalRef.current);
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
						console.log("[ReceiptScanner] Progress update:", progressData);
						
						// Reset error counter and interval on success
						consecutiveErrors = 0;
						pollInterval = 2000; // Reset to 2 seconds on success
						
						setProgress(progressData);

						// If completed or error, stop polling
						if (
							progressData.status === "completed" ||
							progressData.status === "error"
						) {
							console.log("[ReceiptScanner] Processing finished with status:", progressData.status);
							
							isPollingActive = false;
							if (pollingIntervalRef.current) {
								clearTimeout(pollingIntervalRef.current);
								pollingIntervalRef.current = null;
							}

							setLoading(false);

							if (progressData.status === "completed") {
								console.log("[ReceiptScanner] Receipt completed successfully");
								console.log("[ReceiptScanner] receiptId from progress:", progressData.receiptId);
								console.log("[ReceiptScanner] receiptData available:", !!receiptData);
								
								// If receiptId is available, fetch full receipt
								if (progressData.receiptId) {
									try {
										console.log("[ReceiptScanner] Fetching full receipt data...");
										const fullReceipt = await receiptApi.getUserReceipts();
										console.log("[ReceiptScanner] Got receipts count:", fullReceipt.length);
										
										const receipt = fullReceipt.find(
											(r) => r.id === progressData.receiptId
										);
										console.log("[ReceiptScanner] Found receipt:", !!receipt);
										
										if (receipt) {
											console.log("[ReceiptScanner] Navigating to receipt-confirmation with receipt ID:", receipt.id);
											console.log("[ReceiptScanner] Receipt object:", JSON.stringify(receipt, null, 2).substring(0, 300));
											
											try {
												await router.push({
													pathname: "/receipt-confirmation",
													params: { receipt: JSON.stringify(receipt) },
												});
												console.log("[ReceiptScanner] Navigation completed successfully");
												
												// Clear captured image after successful navigation
												console.log("[ReceiptScanner] Clearing captured image");
												setCapturedImage(null);
											} catch (navError) {
												console.error("[ReceiptScanner] Navigation error:", navError);
											}
											return;
										} else {
											console.warn("[ReceiptScanner] Receipt not found in fetched receipts, using fallback");
										}
									} catch (error) {
										console.error("[ReceiptScanner] Error fetching full receipt:", error);
										// Error fetching receipt, fallback to original receiptData
									}
								}

								// Fallback to original receiptData
								console.log("[ReceiptScanner] Using fallback receiptData");
								if (receiptData) {
									console.log("[ReceiptScanner] Navigating to receipt-confirmation with receiptData");
									console.log("[ReceiptScanner] ReceiptData object:", JSON.stringify(receiptData, null, 2).substring(0, 300));
									
									try {
										await router.push({
											pathname: "/receipt-confirmation",
											params: { receipt: JSON.stringify(receiptData) },
										});
										console.log("[ReceiptScanner] Navigation completed successfully (fallback)");
										
										// Clear captured image after successful navigation
										console.log("[ReceiptScanner] Clearing captured image (fallback)");
										setCapturedImage(null);
									} catch (navError) {
										console.error("[ReceiptScanner] Navigation error (fallback):", navError);
									}
								} else {
									console.error("[ReceiptScanner] No receiptData available for fallback!");
								}
							} else {
								// Handle error
								console.error("[ReceiptScanner] Processing failed with error:", progressData.error);
								showAlert(
									"Error",
									progressData.error || "Error procesando el ticket",
									undefined,
									"error"
								);
							}
						}
					} catch (error) {
						consecutiveErrors++;
						console.warn("[ReceiptScanner] Polling error (will retry):", error);
						
						// Stop polling if rate limited (429) - immediate stop
						const errorMessage = error instanceof Error ? error.message : String(error);
						if (errorMessage.includes("429") || errorMessage.includes("Too many requests")) {
							console.log("[ReceiptScanner] Rate limited (429), stopping polling immediately");
							isPollingActive = false;
							if (pollingIntervalRef.current) {
								clearTimeout(pollingIntervalRef.current);
								pollingIntervalRef.current = null;
							}
							setLoading(false);
							
							// If we have receiptData, use it (processing might be complete)
							if (receiptData) {
								showAlert(
									"Límite de solicitudes",
									"Se alcanzó el límite de solicitudes. El ticket puede haberse procesado correctamente.",
									undefined,
									"warning"
								);
								await router.push({
									pathname: "/receipt-confirmation",
									params: { receipt: JSON.stringify(receiptData) },
								});
								setCapturedImage(null);
							} else {
								showAlert(
									"Límite de solicitudes",
									"Se alcanzó el límite de solicitudes. Por favor, espera unos momentos e intenta nuevamente.",
									undefined,
									"warning"
								);
							}
							return;
						}
						
						// Stop polling if job not found (404)
						if (errorMessage.includes("404") || errorMessage.includes("Job not found")) {
							console.log("[ReceiptScanner] Job not found, stopping polling");
							isPollingActive = false;
							if (pollingIntervalRef.current) {
								clearTimeout(pollingIntervalRef.current);
								pollingIntervalRef.current = null;
							}
							setLoading(false);
							
							// If we have receiptData, use it
							if (receiptData) {
								await router.push({
									pathname: "/receipt-confirmation",
									params: { receipt: JSON.stringify(receiptData) },
								});
								setCapturedImage(null);
							} else {
								showAlert(
									"Error",
									"No se pudo obtener el estado del procesamiento. El ticket puede haberse procesado correctamente.",
									undefined,
									"warning"
								);
							}
							return;
						}
						
						// Stop after too many consecutive errors
						if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
							console.error("[ReceiptScanner] Too many consecutive errors, stopping polling");
							isPollingActive = false;
							if (pollingIntervalRef.current) {
								clearTimeout(pollingIntervalRef.current);
								pollingIntervalRef.current = null;
							}
							setLoading(false);
							showAlert(
								"Error de conexión",
								"No se pudo obtener el estado del procesamiento. Por favor, verifica tu conexión.",
								undefined,
								"error"
							);
							return;
						}
						
						// Exponential backoff: increase interval on errors
						pollInterval = Math.min(pollInterval * 2, 5000); // Max 5 seconds
					}
					
					// Schedule next poll if still active
					if (isPollingActive) {
						pollingIntervalRef.current = setTimeout(poll, pollInterval);
					}
				};
				
				// Start first poll
				pollingIntervalRef.current = setTimeout(poll, pollInterval);
			} else {
				// No jobId, use old flow (immediate response)
				console.log("[ReceiptScanner] No jobId, using immediate response flow");
				console.log("[ReceiptScanner] receiptData:", receiptData);
				
				setProgress({
					status: "completed",
					progress: 100,
					message: "Completado",
				});
				setLoading(false);
				
				if (receiptData) {
					console.log("[ReceiptScanner] Navigating to receipt-confirmation (no polling)");
					console.log("[ReceiptScanner] ReceiptData object:", JSON.stringify(receiptData, null, 2).substring(0, 300));
					
					try {
						await router.push({
							pathname: "/receipt-confirmation",
							params: { receipt: JSON.stringify(receiptData) },
						});
						console.log("[ReceiptScanner] Navigation completed successfully (no polling)");
						
						// Clear captured image after successful navigation
						console.log("[ReceiptScanner] Clearing captured image (no polling)");
						setCapturedImage(null);
					} catch (navError) {
						console.error("[ReceiptScanner] Navigation error (no polling):", navError);
					}
				} else {
					console.error("[ReceiptScanner] No receiptData available!");
				}
			}
		} catch (error) {
			// Log completo del error para debugging
			console.error("[ReceiptScanner] Error processing receipt:", error);
			console.error("[ReceiptScanner] Error type:", typeof error);
			console.error("[ReceiptScanner] Error stringified:", JSON.stringify(error, null, 2));
			
			// Si es un Error, loggear stack trace
			if (error instanceof Error) {
				console.error("[ReceiptScanner] Error message:", error.message);
				console.error("[ReceiptScanner] Error stack:", error.stack);
			}
			
			// Usar el servicio centralizado de errores
			const parsedError = parseReceiptError(error);
			console.log("[ReceiptScanner] Parsed error:", parsedError);

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
