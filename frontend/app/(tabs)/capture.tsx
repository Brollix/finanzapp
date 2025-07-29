import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { CameraView } from "expo-camera";
import { useRef, useState } from "react";
import type { CameraCapturedPicture } from "expo-camera";
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

import { Button } from "../../src/components/ui/Button";
import { styles } from "../../src/styles/index.styles";
import { useOcr } from "../../src/context/OcrContext";
import { theme } from "../../src/styles/theme";

export default function Capture() {
	const cameraRef = useRef<CameraView>(null);
	const router = useRouter();
	const { startOcr, setOcrSuccess, setOcrError } = useOcr();
	const [isFlashOn, setIsFlashOn] = useState(false);

	const handleCapture = async () => {
		if (cameraRef.current) {
			const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync();

			startOcr();
			router.back();

			try {
				// Comprimir la imagen
				const manipResult = await ImageManipulator.manipulateAsync(
					photo.uri,
					[{ resize: { width: 1080 } }], // Redimensiona a un ancho razonable
					{ compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
				);

				const formData = new FormData();
				const filename = manipResult.uri.split("/").pop();
				const type = 'image/jpeg';

				formData.append("file", { uri: manipResult.uri, name: filename!, type } as any);

				const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ocr`, {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const errorInfo = await response.text();
					throw new Error(`Error del servidor: ${response.status} ${errorInfo}`);
				}

				const responseData = await response.json();
				setOcrSuccess(responseData);
			} catch (error) {
				console.error("Error al enviar la foto:", error);
				setOcrError(error as Error);
			}
		}
	};

	return (
		<View style={{ flex: 1 }}>
			<CameraView 
				ref={cameraRef} 
				style={{ flex: 1 }} 
				facing="back" 
				enableTorch={isFlashOn}
			/>
			<View style={styles.captureOverlay}>
				<TouchableOpacity style={styles.flashButton} onPress={() => setIsFlashOn(!isFlashOn)}>
					<Ionicons name={isFlashOn ? "flash" : "flash-off"} size={28} color={isFlashOn ? theme.colors.warning : theme.colors.primary	} />
				</TouchableOpacity>
				<Button onPress={handleCapture} leftIcon={<Ionicons name="camera" />} />
			</View>
		</View>
	);
}
