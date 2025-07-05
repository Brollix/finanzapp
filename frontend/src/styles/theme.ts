export const theme = {
  colors: {
    // Colores base
    primary:         "rgb(40, 200, 100)",   // Verde principal
    secondary:       "rgb(145, 40, 200)",   // Violeta triádico
    success:         "rgb(40, 200, 100)",   // Igual al primary, semántico
    warning:         "rgb(200, 140, 40)",   // Naranja triádico
    error:           "rgb(240, 39, 76)",    // Rojo fuerte
  
    // Superficies
    background:      "rgb(20, 20, 20)",
    surface:         "rgb(40, 40, 40)",
    surfaceVariant:  "rgb(50, 50, 50)",
  
    // Texto
    text:            "rgb(255, 255, 255)",
    textSecondary:   "rgba(255, 255, 255, 0.7)",
    onPrimary:       "rgb(0, 0, 0)",
    onSecondary:     "rgb(0, 0, 0)",
    onBackground:    "rgb(255, 255, 255)",
    onSurface:       "rgb(255, 255, 255)",
    onError:         "rgb(0, 0, 0)",
  
    // UI
    placeholder:     "rgba(255, 255, 255, 0.5)",
    inputBackground: "rgba(43, 43, 43, 0.5)",
    inputBorder:     "rgba(213, 213, 213, 0.5)",
    border:          "rgba(255, 255, 255, 0.12)",
  
    // Estados
    disabled:        "rgba(255, 255, 255, 0.38)",
    backdrop:        "rgba(0, 0, 0, 0.5)",
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
