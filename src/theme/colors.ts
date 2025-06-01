export const colors = {
  // Primary brand color
  primary: "#63c550",
  primary_dark: "#10B981",

  // Status colors
  success: "#63c550",
  warning: "#FFA500",
  error: "#FF4444",
  info: "#2196F3",

  // Text colors
  text: "#1A1A1A",
  textSecondary: "#757575",

  // Background colors
  background: "#FFFFFF",
  backgroundSecondary: "#F5F5F5",

  // Border colors
  border: "#E0E0E0",

  // Additional UI colors
  white: "#FFFFFF",
  black: "#000000",
  grey: "#9E9E9E",
  lightGrey: "#E0E0E0",
  transparent: "transparent",

  // New additions
  violet: "#8B5CF6", // Soft violet (Tailwind violet-500)
  violet_light: "#EDE9FE", // Light background-friendly violet
  beige: "#F5F5DC", // Classic beige
  beige_light: "#FAF9F6", // Off-white beige for subtle backgrounds
  green_soft: "#A7E69F", // A pastel version of primary for soft UI
  green_muted: "#D3F0CD", // Muted green background
};

export type Colors = typeof colors;
export default colors;
