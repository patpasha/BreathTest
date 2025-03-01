import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen';
import PhysiologicalSighScreen from './screens/PhysiologicalSighScreen';
import CyclicHyperventilationScreen from './screens/CyclicHyperventilationScreen';
import WimHofScreen from './screens/WimHofScreen';
import SettingsScreen from './screens/SettingsScreen';
import InformationScreen from './screens/InformationScreen';
import StatsScreen from './screens/StatsScreen';
import { SettingsProvider } from './contexts/SettingsContext';
import { StatsProvider } from './contexts/StatsContext';
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

// Types pour les navigateurs
export type MainTabParamList = {
  HomeTab: undefined;
  StatsTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  PhysiologicalSigh: undefined;
  CyclicHyperventilation: undefined;
  WimHof: undefined;
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
const Tab = createBottomTabNavigator<MainTabParamList>();

// Composant pour le navigateur à onglets
const MainTabNavigator = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const size = 24; // Taille fixe pour toutes les icônes
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StatsTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: theme.textLight,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          title: 'Accueil',
          headerTitle: 'BreathFlow',
          tabBarLabel: 'Accueil'
        }} 
      />
      <Tab.Screen 
        name="StatsTab" 
        component={StatsScreen} 
        options={{
          title: 'Statistiques',
          tabBarLabel: 'Stats'
        }} 
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen} 
        options={{
          title: 'Paramètres',
          tabBarLabel: 'Réglages'
        }} 
      />
    </Tab.Navigator>
  );
};

// Composant pour le navigateur principal avec accès au thème
const AppNavigator = () => {
  const theme = useTheme();
  
  return (
    <NavigationContainer>
      <StatusBar style={theme === darkTheme ? "light" : "dark"} />
      <Stack.Navigator 
        initialRouteName="Splash"
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
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
          options={{ headerShown: false }} 
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

// Composant principal
export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <StatsProvider>
            <AppNavigator />
          </StatsProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
