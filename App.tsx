import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import PhysiologicalSighScreen from './screens/PhysiologicalSighScreen';
import CyclicHyperventilationScreen from './screens/CyclicHyperventilationScreen';
import WimHofScreen from './screens/WimHofScreen';
import SettingsScreen from './screens/SettingsScreen';
import InformationScreen from './screens/InformationScreen';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider, useTheme, darkTheme } from './theme/ThemeContext';

// Nouvelles importations pour les techniques de respiration supplémentaires
import Respiration478Screen from './screens/Respiration478Screen';
import RespirationCoherenteScreen from './screens/RespirationCoherenteScreen';
import RespirationDiaphragmatiqueScreen from './screens/RespirationDiaphragmatiqueScreen';
import RespirationAlterneeScreen from './screens/RespirationAlterneeScreen';
import RespirationButeykoScreen from './screens/RespirationButeykoScreen';
import RespirationUjjayiScreen from './screens/RespirationUjjayiScreen';
import RespirationBoxScreen from './screens/RespirationBoxScreen';
import RespirationTummoScreen from './screens/RespirationTummoScreen';

export type RootStackParamList = {
  Home: undefined;
  PhysiologicalSigh: undefined;
  CyclicHyperventilation: undefined;
  WimHof: undefined;
  Settings: undefined;
  Info: undefined;
  // Nouvelles routes pour les techniques supplémentaires
  Respiration478: undefined;
  RespirationCoherente: undefined;
  RespirationDiaphragmatique: undefined;
  RespirationAlternee: undefined;
  RespirationButeyko: undefined;
  RespirationUjjayi: undefined;
  RespirationBox: undefined;
  RespirationTummo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Composant pour le navigateur avec accès au thème
const AppNavigator = () => {
  const theme = useTheme();
  
  return (
    <NavigationContainer>
      <StatusBar style={theme === darkTheme ? "light" : "dark"} />
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: theme.textLight,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Accueil' }} 
        />
        <Stack.Screen 
          name="PhysiologicalSigh" 
          component={PhysiologicalSighScreen} 
          options={{ title: 'Soupir Physiologique' }} 
        />
        <Stack.Screen 
          name="CyclicHyperventilation" 
          component={CyclicHyperventilationScreen} 
          options={{ title: 'Hyperventilation Cyclique' }} 
        />
        <Stack.Screen 
          name="WimHof" 
          component={WimHofScreen} 
          options={{ title: 'Méthode Wim Hof' }} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Paramètres' }} 
        />
        <Stack.Screen 
          name="Info" 
          component={InformationScreen} 
          options={{ title: 'Informations' }} 
        />
        
        {/* Nouvelles techniques de respiration */}
        <Stack.Screen 
          name="Respiration478" 
          component={Respiration478Screen} 
          options={{ title: 'Respiration 4-7-8' }} 
        />
        <Stack.Screen 
          name="RespirationCoherente" 
          component={RespirationCoherenteScreen} 
          options={{ title: 'Respiration Cohérente' }} 
        />
        <Stack.Screen 
          name="RespirationDiaphragmatique" 
          component={RespirationDiaphragmatiqueScreen} 
          options={{ title: 'Respiration Diaphragmatique' }} 
        />
        <Stack.Screen 
          name="RespirationAlternee" 
          component={RespirationAlterneeScreen} 
          options={{ title: 'Respiration Alternée' }} 
        />
        <Stack.Screen 
          name="RespirationButeyko" 
          component={RespirationButeykoScreen} 
          options={{ title: 'Méthode Buteyko' }} 
        />
        <Stack.Screen 
          name="RespirationUjjayi" 
          component={RespirationUjjayiScreen} 
          options={{ title: 'Respiration Ujjayi' }} 
        />
        <Stack.Screen 
          name="RespirationBox" 
          component={RespirationBoxScreen} 
          options={{ title: 'Respiration Box' }} 
        />
        <Stack.Screen 
          name="RespirationTummo" 
          component={RespirationTummoScreen} 
          options={{ title: 'Respiration Tummo' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
