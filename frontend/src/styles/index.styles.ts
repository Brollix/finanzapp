import { StyleSheet } from "react-native";
import { theme } from "./theme";
import { core } from "./core.styles";

export const styles = StyleSheet.create({
	...core,
	// --- Component Aliases ---
	// These styles are now aliased to `core.styles.ts`

	// Button aliases
	uiButton: core.button,
	uiButtonPrimary: core.buttonPrimary,
	uiButtonSecondary: core.buttonSecondary,
	uiButtonOutline: core.buttonOutline,
	uiButtonDanger: core.buttonDanger,
	uiButtonFullWidth: core.buttonFullWidth,
	uiButtonDisabled: core.buttonDisabled,
	uiButtonText: core.buttonText,
	uiButtonPrimaryText: core.buttonPrimaryText,
	uiButtonSecondaryText: core.buttonSecondaryText,
	uiButtonOutlineText: core.buttonOutlineText,
	uiButtonDangerText: core.buttonDangerText,
	uiButtonIconLeft: core.buttonIconLeft,
	uiButtonIconRight: core.buttonIconRight,

	// Card aliases
	card: core.card,
	cardElevated: core.cardElevated,
	cardOutlined: core.cardOutlined,
	cardFilled: core.cardFilled,

	// Input aliases
	uiInputContainer: core.inputContainer,
	uiInputLabel: core.inputLabel,
	uiInputBox: core.inputBox,
	uiInputErrorContainer: core.inputErrorContainer,
	uiInputDisabledContainer: core.inputDisabledContainer,
	uiInput: core.input,
	uiInputDisabled: core.inputDisabled,
	uiInputIcon: core.inputIcon,
	uiInputErrorText: core.inputErrorText,

	// --- Screen Specific ---

	// Home Screen
	homeContainer: {
		flex: 1,
	},
	homeHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.lg,
		paddingBottom: theme.spacing.md,
	},
	homeTitle: {
		fontSize: theme.font.size.h4,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	homeCardContainer: {
		paddingHorizontal: theme.spacing.lg,
	},
	headerPlaceholder: {
		width: 32,
	},
	headerIcon: {
		fontSize: 32,
		color: theme.colors.text,
	},

	// FAB (Floating Action Button)
	fab: {
		position: "absolute",
		bottom: 30,
		alignSelf: "center",
		backgroundColor: theme.colors.primary,
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	fabIcon: {
		fontSize: 48,
		color: theme.colors.surface,
	},
	fabModalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		justifyContent: "flex-end",
		alignItems: "center",
	},
	fabModalContainer: {
		backgroundColor: theme.colors.surface,
		width: "95%",
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
		marginBottom: 100, // Above FAB
		alignItems: "center",
	},

	// Centered Modal
	centeredModalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	centeredModalContent: {
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 20,
		maxWidth: "90%",
	},
	fabModalTitle: {
		fontSize: theme.font.size.h6,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
		marginBottom: theme.spacing.lg,
	},
	fabModalButton: {
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		marginTop: theme.spacing.sm,
	},

	// Account Screen
	accountContainer: {
		flex: 1,
		padding: theme.spacing.lg,
	},
	logo: {
		width: 150,
		height: 150,
		resizeMode: "contain",
		alignSelf: "center",
		marginBottom: theme.spacing.lg,
	},

	// Capture Screen
	captureOverlay: {
		position: "absolute",
		bottom: 50,
		width: "100%",
		alignItems: "center",
	},
	flashButton: {
		marginBottom: 20,
		backgroundColor: "rgba(0,0,0,0.4)",
		padding: 15,
		borderRadius: 50,
	},

	// Auth Screens
	authHeader: {
		alignItems: "center",
		marginBottom: theme.spacing.lg,
	},
	authTitle: {
		fontSize: theme.font.size.h1,
		fontFamily: theme.font.family.bold,
		color: theme.colors.primary,
		marginBottom: theme.spacing.sm,
	},
	formContainer: {
		width: "90%",
		maxWidth: 400,
	},
	// El estilo 'input' es muy similar a 'uiInputBox' + 'uiInput', se puede refactorizar en el componente.
	// El estilo 'button' es muy similar a 'uiButton' + 'uiButtonPrimary', se puede refactorizar en el componente.
	// El estilo 'buttonText' es muy similar a 'uiButtonText' + 'uiButtonPrimaryText', se puede refactorizar en el componente.
	// El estilo 'buttonDisabled' es muy similar a 'uiButtonDisabled', se puede refactorizar en el componente.
	// El estilo 'subtitle' se puede construir con 'text' y 'h2' de core.
	inputFocused: {
		borderColor: theme.colors.primary,
		borderWidth: 2,
	},
});
