import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

// Définition des couleurs pour les thèmes clair et sombre
export const lightTheme = {
  // Couleurs de base
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceLight: '#ffffff', 
  primary: '#3a86ff',
  secondary: '#4361ee',
  accent: '#4895ef',
  error: '#e63946',
  
  // Couleurs de texte
  textPrimary: '#212529',
  textSecondary: '#495057',
  textTertiary: '#6c757d',
  textLight: '#ffffff',
  
  // Couleurs de bordure
  border: '#dee2e6',
  divider: '#e9ecef',
  
  // Couleurs de fond spécifiques
  cardBackground: '#ffffff',
  buttonBackground: '#3a86ff',
  circleBackground: '#e7f0ff',
  switchTrackOff: '#767577',
  switchTrackOn: '#3a86ff',
  switchThumbOff: '#f4f3f4',
  switchThumbOn: '#ffffff',
};

export const darkTheme = {
  // Couleurs de base
  background: '#121212',
  surface: '#1e1e1e',
  surfaceLight: '#2c3e50', 
  primary: '#4361ee',
  secondary: '#3a86ff',
  accent: '#4895ef',
  error: '#e63946',
  
  // Couleurs de texte
  textPrimary: '#e9ecef',
  textSecondary: '#ced4da',
  textTertiary: '#adb5bd',
  textLight: '#ffffff',
  
  // Couleurs de bordure
  border: '#343a40',
  divider: '#212529',
  
  // Couleurs de fond spécifiques
  cardBackground: '#1e1e1e',
  buttonBackground: '#4361ee',
  circleBackground: '#2c3e50',
  switchTrackOff: '#555555',
  switchTrackOn: '#4361ee',
  switchThumbOff: '#adb5bd',
  switchThumbOn: '#ffffff',
};

// Type pour le thème
export type Theme = typeof lightTheme;

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
