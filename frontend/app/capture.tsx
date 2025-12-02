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
		cameraRef,
		takePicture,
		retakePicture,
		processReceipt,
	} = useReceiptScanner();

	const [isFlashOn, setIsFlashOn] = useState(false);
	const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
	const fadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		let interval: any;
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
							onPress={takePicture}
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
});
