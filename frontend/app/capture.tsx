import {
	View,
	TouchableOpacity,
	ActivityIndicator,
	StyleSheet,
	Text,
	Image,
	Animated,
	Easing,
} from "react-native";
import { CameraView } from "expo-camera";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../src/components/ui/Button";
import { core } from "../src/styles/core.styles";
import { theme } from "../src/styles/theme";
import { useReceiptScanner } from "../src/hooks/useReceiptScanner";

const LOADING_MESSAGES = [
	"Analizando tu ticket con Inteligencia Artificial...",
	"FinanzApp está procesando tu gasto con AWS Bedrock...",
	"Extrayendo fecha, total y comercios...",
	"Esto puede tardar unos segundos. ¡Ya casi está!",
];

export default function Capture() {
	const {
		permission,
		requestPermission,
		loading,
		capturedImage,
		progress,
		cameraRef,
		takePicture,
		pickImageFromGallery,
		retakePicture,
		processReceipt,
	} = useReceiptScanner();

	const [isFlashOn, setIsFlashOn] = useState(false);
	const fadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (loading && progress) {
			// Fade in animation when loading starts
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 500,
				useNativeDriver: true,
				easing: Easing.out(Easing.ease),
			}).start();
		} else {
			fadeAnim.setValue(0);
		}
	}, [loading, progress]);

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
									{progress?.message || "Procesando..."}
								</Text>
								{progress && (
									<View style={{ marginTop: theme.spacing.md, width: "100%" }}>
										<View
											style={{
												width: "100%",
												height: 6,
												backgroundColor: theme.colors.surface,
												borderRadius: 3,
												overflow: "hidden",
											}}
										>
											<Animated.View
												style={{
													height: "100%",
													width: `${progress.progress}%`,
													backgroundColor: theme.colors.primary,
													borderRadius: 3,
												}}
											/>
										</View>
										<Text
											style={{
												marginTop: theme.spacing.xs,
												fontSize: 12,
												color: theme.colors.textSecondary,
												textAlign: "center",
											}}
										>
											{progress.progress}%
										</Text>
									</View>
								)}
							</View>
						</Animated.View>
					) : (
						<View style={styles.captureOverlay}>
							<Button
								onPress={retakePicture}
								title="Reintentar"
								variant="outline"
								style={{ flex: 1, marginRight: theme.spacing.sm }}
							/>
							<Button
								onPress={processReceipt}
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
					<TouchableOpacity
						style={styles.flashButtonTop}
						onPress={() => setIsFlashOn(!isFlashOn)}
						disabled={loading}
					>
						<Ionicons
							name={isFlashOn ? "flash" : "flash-off"}
							size={24}
							color={isFlashOn ? theme.colors.warning : theme.colors.text}
						/>
					</TouchableOpacity>
					<View style={styles.captureOverlay}>
						<Button
							testID="capture-button"
							onPress={takePicture}
							title="Tomar Foto"
							leftIcon={<Ionicons name="camera" />}
							disabled={loading}
							loading={loading}
							style={styles.captureButton}
						/>
						<Button
							testID="gallery-button"
							onPress={pickImageFromGallery}
							title="Galería"
							leftIcon={<Ionicons name="image-outline" />}
							disabled={loading}
							variant="outline"
							style={styles.captureButton}
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
		padding: theme.spacing.md,
		paddingBottom: theme.spacing.lg,
		backgroundColor: theme.colors.backdrop,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: theme.spacing.sm,
	},
	captureButton: {
		flex: 1,
		minWidth: 0,
	},
	flashButtonTop: {
		position: "absolute",
		top: theme.spacing.xl,
		right: theme.spacing.lg,
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: theme.colors.backdrop,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
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
});
