import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the shape of our settings
interface Settings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  darkMode: boolean;
  reminderEnabled: boolean;
  reminderTimes: string[]; // Format: ['HH:MM', 'HH:MM', ...] pour plusieurs heures de rappel
  reminderDays: number[]; // Jours de la semaine (0 = dimanche, 1 = lundi, etc.)
  sessionDuration: number; // Durée de session en minutes
}

// Default settings
const defaultSettings: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  darkMode: false,
  reminderEnabled: false,
  reminderTimes: ['20:00'], // 8:00 PM par défaut
  reminderDays: [1, 2, 3, 4, 5], // Lundi à vendredi par défaut
  sessionDuration: 5, // 5 minutes par défaut
};

// Define the shape of our context
interface SettingsContextType {
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Storage key
const SETTINGS_STORAGE_KEY = 'huberman-breath-app-settings';

interface SettingsProviderProps {
  children: ReactNode;
}

// Provider component
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (storedSettings) {
          // Fusionner les paramètres stockés avec les valeurs par défaut pour gérer les nouvelles propriétés
          const parsedSettings = JSON.parse(storedSettings);
          
          // Conversion de l'ancien format (reminderTime) vers le nouveau format (reminderTimes)
          let reminderTimes = parsedSettings.reminderTimes;
          if (!reminderTimes && parsedSettings.reminderTime) {
            reminderTimes = [parsedSettings.reminderTime];
          }
          
          setSettings({
            ...defaultSettings,
            ...parsedSettings,
            // S'assurer que reminderDays existe, sinon utiliser la valeur par défaut
            reminderDays: parsedSettings.reminderDays || defaultSettings.reminderDays,
            // Utiliser le nouveau format reminderTimes
            reminderTimes: reminderTimes || defaultSettings.reminderTimes
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to storage whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      if (!isLoaded) return; // Don't save until initial load is complete
      
      try {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    saveSettings();
  }, [settings, isLoaded]);

  // Function to update a single setting
  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Function to reset all settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, setSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
