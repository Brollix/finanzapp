import "@testing-library/jest-native/extend-expect";

// Mock expo-router
jest.mock("expo-router", () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
		dismissAll: jest.fn(),
	}),
	usePathname: () => "/",
	useSegments: () => [],
	useLocalSearchParams: () => ({}),
	useFocusEffect: jest.fn(),
}));

// Mock expo-camera
jest.mock("expo-camera", () => ({
	CameraView: "CameraView",
	useCameraPermissions: () => [
		{ granted: true },
		jest.fn(),
	],
}));

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
	useMediaLibraryPermissions: () => [
		{ granted: true },
		jest.fn(),
	],
	launchImageLibraryAsync: jest.fn(),
	MediaTypeOptions: {
		Images: "Images",
	},
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
	setItem: jest.fn(),
	getItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
}));

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
	const Reanimated = require("react-native-reanimated/mock");
	Reanimated.default.call = () => {};
	return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

