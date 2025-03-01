import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

// Définition des couleurs pour les thèmes clair et sombre
export const lightTheme = {
  // Couleurs de base
  background: '#f7f9fc',
  surface: '#ffffff',
  surfaceLight: '#ffffff', 
  primary: '#4263eb',
  primaryLight: '#edf2ff', 
  primaryDark: '#364fc7',
  secondary: '#38d9a9',
  secondaryLight: '#e6fcf5',
  secondaryDark: '#0ca678',
  accent: '#7950f2',
  accentLight: '#f3f0ff',
  error: '#fa5252',
  success: '#40c057',
  warning: '#fd7e14',
  info: '#15aabf',
  
  // Couleurs de texte
  textPrimary: '#212529',
  textSecondary: '#495057',
  textTertiary: '#868e96',
  textLight: '#ffffff',
  
  // Couleurs de bordure
  border: '#e9ecef',
  divider: '#f1f3f5',
  
  // Couleurs de fond spécifiques
  cardBackground: '#ffffff',
  buttonBackground: '#4263eb',
  circleBackground: '#edf2ff',
  switchTrackOff: '#ced4da',
  switchTrackOn: '#4263eb',
  switchThumbOff: '#ffffff',
  switchThumbOn: '#ffffff',
  
  // Ombres et élévation
  shadowColor: '#000000',
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
  
  // Rayons de bordure
  borderRadiusSmall: 8,
  borderRadiusMedium: 12,
  borderRadiusLarge: 16,
  borderRadiusXLarge: 24,
  borderRadiusRound: 9999,
  
  // Espacement
  spacingXSmall: 4,
  spacingSmall: 8,
  spacingMedium: 16,
  spacingLarge: 24,
  spacingXLarge: 32,
  spacingXXLarge: 48,
};

export const darkTheme = {
  // Couleurs de base
  background: '#121212',
  surface: '#1e1e1e',
  surfaceLight: '#2d3748', 
  primary: '#748ffc',
  primaryLight: '#1c2a4d', 
  primaryDark: '#5c7cfa',
  secondary: '#63e6be',
  secondaryLight: '#0b3a2e',
  secondaryDark: '#20c997',
  accent: '#9775fa',
  accentLight: '#2b1d5a',
  error: '#ff6b6b',
  success: '#51cf66',
  warning: '#ffa94d',
  info: '#22b8cf',
  
  // Couleurs de texte
  textPrimary: '#f8f9fa',
  textSecondary: '#dee2e6',
  textTertiary: '#adb5bd',
  textLight: '#ffffff',
  
  // Couleurs de bordure
  border: '#343a40',
  divider: '#212529',
  
  // Couleurs de fond spécifiques
  cardBackground: '#252525',
  buttonBackground: '#748ffc',
  circleBackground: '#1c2a4d',
  switchTrackOff: '#495057',
  switchTrackOn: '#748ffc',
  switchThumbOff: '#f8f9fa',
  switchThumbOn: '#ffffff',
  
  // Ombres et élévation
  shadowColor: '#000000',
  shadowOpacity: 0.3,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
  
  // Rayons de bordure
  borderRadiusSmall: 8,
  borderRadiusMedium: 12,
  borderRadiusLarge: 16,
  borderRadiusXLarge: 24,
  borderRadiusRound: 9999,
  
  // Espacement
  spacingXSmall: 4,
  spacingSmall: 8,
  spacingMedium: 16,
  spacingLarge: 24,
  spacingXLarge: 32,
  spacingXXLarge: 48,
};

// Type pour le thème
export type Theme = typeof lightTheme;

// Constantes pour l'animation
export const animationConfig = {
  duration: {
    short: 200,
    medium: 300,
    long: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
};

// Contexte pour le thème
const ThemeContext = createContext<Theme>(lightTheme);

// Provider pour le thème
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const systemColorScheme = useColorScheme();
  
  // Déterminer le thème à utiliser
  const theme = settings.darkMode ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook pour utiliser le thème
export const useTheme = () => useContext(ThemeContext);
