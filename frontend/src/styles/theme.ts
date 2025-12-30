export const theme = {
	colors: {
		// Colores base
		primary: "rgb(40, 255, 100)",
		secondary: "rgb(145, 40, 255)",
		success: "rgb(40, 200, 100)",
		warning: "rgb(200, 140, 40)",
		error: "rgb(240, 39, 76)",
		info: "rgb(59, 130, 246)",

		// Superficies
		surface: "rgb(32, 172, 86)",
		background: "rgb(19, 19, 19)",
		backgroundVariant: "rgba(39, 39, 39, 1)",

		// Texto
		text: "rgb(255, 255, 255)",
		textSecondary: "rgba(255, 255, 255, 0.7)",
		textTertiary: "rgba(255, 40, 255, 0.7)",
		onPrimary: "rgb(0, 0, 0)",
		onSecondary: "rgb(0, 0, 0)",
		onBackground: "rgb(255, 255, 255)",
		onSurface: "rgb(0, 0, 0)",
		onError: "rgb(0, 0, 0)",

		// UI
		placeholder: "rgba(255, 255, 255, 0.5)",
		inputBackground: "rgba(0, 0, 0, 5)",
		inputBorder: "rgba(40, 200, 100, 1)",
		border: "rgba(40, 200, 100, 0.7)",

		// Estados
		disabled: "rgba(255, 255, 255, 0.38)",
		backdrop: "rgba(0, 0, 0, 0.5)",
		backdropDark: "rgba(0, 0, 0, 0.85)",

		// Medallas/Trofeos
		gold: "#FFD700",
		silver: "#C0C0C0",
		bronze: "#CD7F32",

		// Sombras
		shadow: "#000",
	},

	font: {
		family: {
			regular: "SpaceGrotesk-Regular",
			bold: "SpaceGrotesk-Bold",
		},
		size: {
			xs: 12,
			sm: 14,
			md: 16,
			lg: 18,
			xl: 20,
			h1: 48,
			h2: 36,
			h3: 30,
			h4: 24,
			h6: 18,
		},
		weight: {
			regular: "400" as const,
			bold: "700" as const,
		},
	},
	spacing: {
		xs: 4,
		sm: 8,
		md: 16,
		lg: 24,
		xl: 32,
	},
	borderRadius: {
		sm: 4,
		md: 8,
		lg: 12,
		xl: 16,
		full: 9999,
	},
};
