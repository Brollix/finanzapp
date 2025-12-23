import * as Font from "expo-font";

export async function loadFonts() {
	await Font.loadAsync({
		"SpaceGrotesk-Regular": require("../assets/fonts/SpaceGrotesk-Regular.ttf"),
		"SpaceGrotesk-Bold": require("../assets/fonts/SpaceGrotesk-Bold.ttf"),
	});
}
