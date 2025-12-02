import { StyleSheet } from "react-native";
import { theme } from "./theme";

// Design-system primitives: use these in all components.
export const core = StyleSheet.create({
	// Layout helpers
	flex1: { flex: 1 },
	row: { flexDirection: "row" },
	column: { flexDirection: "column" },
	center: { justifyContent: "center", alignItems: "center" },
	safeArea: { flex: 1, backgroundColor: theme.colors.background },
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		paddingHorizontal: theme.spacing.md,
	},
	centeredContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: theme.spacing.md,
	},
	verticallySpaced: { marginBottom: theme.spacing.md, width: "100%" },

	// Spacing utilities
	pSm: { padding: theme.spacing.sm },
	pMd: { padding: theme.spacing.md },
	pLg: { padding: theme.spacing.lg },
	mSm: { margin: theme.spacing.sm },
	mMd: { margin: theme.spacing.md },
	mLg: { margin: theme.spacing.lg },

	// Typography
	text: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.regular,
		color: theme.colors.text,
	},
	h1: {
		fontSize: theme.font.size.h1,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	h2: {
		fontSize: theme.font.size.h2,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	h3: {
		fontSize: theme.font.size.h3,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	h4: {
		fontSize: theme.font.size.h4,
		fontFamily: theme.font.family.bold,
		color: theme.colors.text,
	},
	destructiveText: { color: theme.colors.error },
	errorText: {
		color: theme.colors.error,
		fontSize: theme.font.size.sm,
		textAlign: "center",
		marginBottom: theme.spacing.md,
	},
	linkText: {
		color: theme.colors.secondary,
		fontSize: theme.font.size.md,
		textAlign: "center",
	},

	// Card
	card: {
		backgroundColor: theme.colors.backgroundVariant,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
		marginVertical: theme.spacing.sm,
		elevation: 1,
		shadowColor: theme.colors.background,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	cardElevated: {
		elevation: 3,
		shadowColor: theme.colors.background,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	cardOutlined: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		elevation: 0,
	},
	cardFilled: {
		backgroundColor: theme.colors.surface,
		elevation: 0,
	},

	cardText: {
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.bold,
		color: theme.colors.onSurface,
	},

	// Button base
	button: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: theme.borderRadius.md,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
	},
	buttonPrimary: {
		backgroundColor: theme.colors.primary,
	},
	buttonSecondary: {
		backgroundColor: theme.colors.secondary,
	},
	buttonOutline: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: theme.colors.primary,
	},
	buttonDanger: { backgroundColor: theme.colors.error },
	buttonFullWidth: { width: "100%" },
	buttonDisabled: { opacity: 0.6 },

	// Button text
	buttonText: {
		fontSize: 16,
		fontFamily: theme.font.family.bold,
		textAlign: "center",
	},
	buttonPrimaryText: { color: theme.colors.onPrimary },
	buttonSecondaryText: { color: theme.colors.onSecondary },
	buttonOutlineText: { color: theme.colors.primary },
	buttonDangerText: { color: theme.colors.onError },

	// Button icons
	buttonIconLeft: {
		position: "absolute",
		left: 16,
		height: "100%",
		justifyContent: "center",
	},
	buttonIconRight: {
		position: "absolute",
		right: 16,
		height: "100%",
		justifyContent: "center",
	},

	// Input
	inputContainer: {
		marginBottom: theme.spacing.md,
		width: "100%",
	},
	inputLabel: {
		marginBottom: theme.spacing.xs,
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.regular,
		color: theme.colors.text,
	},
	inputBox: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.inputBackground,
		borderRadius: theme.borderRadius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		paddingHorizontal: theme.spacing.md,
		height: 48,
	},
	inputErrorContainer: {
		borderColor: theme.colors.error,
	},
	inputDisabledContainer: {
		backgroundColor: theme.colors.backgroundVariant,
	},
	input: {
		flex: 1,
		height: "100%",
		color: theme.colors.text,
		fontSize: theme.font.size.md,
		fontFamily: theme.font.family.regular,
	},
	inputDisabled: {
		color: theme.colors.disabled,
	},
	inputIcon: {
		marginRight: theme.spacing.sm,
	},
	inputErrorText: {
		marginTop: theme.spacing.xs,
		color: theme.colors.error,
		fontSize: theme.font.size.sm,
	},

	// Menu
	menuBackdrop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		zIndex: 1,
	},
	menuContent: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		backgroundColor: theme.colors.backgroundVariant,
		paddingTop: 60, // For status bar
		zIndex: 2,
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: { width: 2, height: 0 },
		shadowOpacity: 0.2,
		shadowRadius: 5,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 20,
	},
	menuItemPressed: {
		backgroundColor: theme.colors.backgroundVariant,
	},
	menuItemIcon: {
		marginRight: theme.spacing.md,
		color: theme.colors.text,
	},
	menuItemText: {
		color: theme.colors.text,
		fontSize: theme.font.size.lg,
		fontFamily: theme.font.family.regular,
		marginLeft: theme.spacing.md,
	},

	// FAB - Floating Action Button
	fab: {
		position: "absolute",
		bottom: theme.spacing.lg,
		right: theme.spacing.lg,
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: theme.colors.primary,
		justifyContent: "center",
		alignItems: "center",
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	fabIcon: {
		fontSize: 30,
		color: theme.colors.text,
	},

	// Modal
	modalBackdrop: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	modalContainer: {
		backgroundColor: theme.colors.background,
		padding: theme.spacing.lg,
		borderTopLeftRadius: theme.borderRadius.lg,
		borderTopRightRadius: theme.borderRadius.lg,
		alignItems: "center",
	},
});
