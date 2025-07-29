import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { CameraView } from "expo-camera";
import { useRef, useState } from "react";
import type { CameraCapturedPicture } from "expo-camera";

import { Ionicons } from '@expo/vector-icons';

import { Button } from "../src/components/ui/Button";
import { core } from "../src/styles/core.styles";
import { useOcr } from "../src/context/OcrContext";
import { theme } from "../src/styles/theme";

const screenStyles = {
  camera: {
    ...core.flex1,
  },
  captureOverlay: {
    position: 'absolute' as 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row' as 'row',
    justifyContent: 'space-around' as 'space-around',
    alignItems: 'center' as 'center',
  },
  flashButton: {
    padding: theme.spacing.sm,
  },
};

export default function Capture() {
	const cameraRef = useRef<CameraView>(null);
	const router = useRouter();
	const { startOcr, setOcrSuccess, setOcrError } = useOcr();
	const [isFlashOn, setIsFlashOn] = useState(false);

	const handleCapture = async () => {
		if (cameraRef.current) {
			const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

			startOcr();
			router.back();

			try {
				// La cámara ya devolvió la imagen comprimida, continuar con el envío
				const formData = new FormData();
                const filename = photo.uri.split('/').pop();
                const type = 'image/jpeg';

                formData.append('file', { uri: photo.uri, name: filename!, type } as any);

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
		<View style={core.flex1}>
			<CameraView 
				ref={cameraRef} 
				style={screenStyles.camera} 
				facing="back" 
				enableTorch={isFlashOn}
			/>
			<View style={screenStyles.captureOverlay}>
				<TouchableOpacity style={screenStyles.flashButton} onPress={() => setIsFlashOn(!isFlashOn)}>
					<Ionicons name={isFlashOn ? "flash" : "flash-off"} size={28} color={isFlashOn ? theme.colors.warning : theme.colors.text	} />
				</TouchableOpacity>
				<Button onPress={handleCapture} leftIcon={<Ionicons name="camera" />} />
			</View>
		</View>
	);
}
