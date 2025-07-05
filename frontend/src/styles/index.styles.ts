import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const styles = StyleSheet.create({
  // --- General & Layout ---
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  verticallySpaced: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  destructiveText: {
    color: theme.colors.error,
  },

  // --- Typography (used globally) ---
  h2: {
    fontSize: theme.font.size.h2,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text,
  },
  h4: {
    fontSize: theme.font.size.h4,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text,
  },
  text: {
    fontSize: theme.font.size.md,
    fontFamily: theme.font.family.regular,
    color: theme.colors.text,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.font.size.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  linkText: {
    color: theme.colors.secondary,
    fontSize: theme.font.size.md,
    textAlign: 'center',
  },

  // --- Components ---

  // Button (uiButton)
  uiButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    flexDirection: 'row',
  },
  uiButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  uiButtonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  uiButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  uiButtonDanger: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  uiButtonFullWidth: {
    width: '100%',
  },
  uiButtonDisabled: {
    opacity: 0.6,
  },
  uiButtonText: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    textAlign: 'center',
  },
  uiButtonPrimaryText: {
    color: theme.colors.onPrimary,
  },
  uiButtonSecondaryText: {
    color: theme.colors.onSecondary,
  },
  uiButtonOutlineText: {
    color: theme.colors.primary,
  },
  uiButtonDangerText: {
    color: theme.colors.onError,
  },
  uiButtonIconLeft: {
    position: 'absolute',
    left: 16,
    height: '100%',
    justifyContent: 'center',
  },
  uiButtonIconRight: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },

  // Card (uiCard)
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardElevated: {
    elevation: 3,
    shadowColor: '#000',
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

  // Input (uiInput)
  uiInputContainer: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  uiInputLabel: {
    marginBottom: theme.spacing.xs,
    fontSize: theme.font.size.md,
    fontFamily: theme.font.family.regular,
    color: theme.colors.text,
  },
  uiInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  uiInputErrorContainer: {
    borderColor: theme.colors.error,
  },
  uiInputDisabledContainer: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  uiInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
    fontSize: theme.font.size.md,
    fontFamily: theme.font.family.regular,
  },
  uiInputDisabled: {
    color: theme.colors.disabled,
  },
  uiInputIcon: {
    marginRight: theme.spacing.sm,
  },
  uiInputErrorText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.error,
    fontSize: theme.font.size.sm,
  },

  // Menu
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  menuContent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.surface,
    paddingTop: 60, // For status bar
    zIndex: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemPressed: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  menuItemIcon: {
    marginRight: 20,
  },
  menuItemText: {
    fontSize: theme.font.size.md,
    fontFamily: theme.font.family.regular,
    color: theme.colors.text,
  },

  // --- Screen Specific ---

  // Home Screen
  homeContainer: {
    flex: 1,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  fabModalContainer: {
    backgroundColor: theme.colors.surface,
    width: '95%',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: 100, // Above FAB
    alignItems: 'center',
  },
  fabModalTitle: {
    fontSize: theme.font.size.h6,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  fabModalButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },

  // Capture Screen
  captureOverlay: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  flashButton: {
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 15,
    borderRadius: 50,
  },

  // Auth Screens
  authHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  authTitle: {
    fontSize: theme.font.size.h1,
    fontFamily: theme.font.family.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  formContainer: {
    width: '90%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.font.size.md,
    fontFamily: theme.font.family.regular,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.font.size.md,
    fontFamily: theme.font.family.bold,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
    elevation: 0,
  },
  subtitle: {
    fontSize: theme.font.size.lg,
    fontFamily: theme.font.family.regular,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md  ,
  },
});
