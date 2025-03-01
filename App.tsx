import React, { lazy, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

// Importations immédiates pour les écrans principaux
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen';
import SettingsScreen from './screens/SettingsScreen';
import InformationScreen from './screens/InformationScreen';
import StatsScreen from './screens/StatsScreen';
import { SettingsProvider } from './contexts/SettingsContext';
import { StatsProvider } from './contexts/StatsContext';
import { ThemeProvider, useTheme, darkTheme } from './theme/ThemeContext';

// Chargement paresseux (lazy loading) pour les écrans de respiration
const PhysiologicalSighScreen = lazy(() => import('./screens/PhysiologicalSighScreen'));
const CyclicHyperventilationScreen = lazy(() => import('./screens/CyclicHyperventilationScreen'));
const WimHofScreen = lazy(() => import('./screens/WimHofScreen'));
const Respiration478Screen = lazy(() => import('./screens/Respiration478Screen'));
const RespirationCoherenteScreen = lazy(() => import('./screens/RespirationCoherenteScreen'));
const RespirationDiaphragmatiqueScreen = lazy(() => import('./screens/RespirationDiaphragmatiqueScreen'));
const RespirationAlterneeScreen = lazy(() => import('./screens/RespirationAlterneeScreen'));
const RespirationButeykoScreen = lazy(() => import('./screens/RespirationButeykoScreen'));
const RespirationUjjayiScreen = lazy(() => import('./screens/RespirationUjjayiScreen'));
const RespirationBoxScreen = lazy(() => import('./screens/RespirationBoxScreen'));
const RespirationTummoScreen = lazy(() => import('./screens/RespirationTummoScreen'));

// Types pour les navigateurs
export type MainTabParamList = {
  HomeTab: undefined;
  StatsTab: undefined;
  SettingsTab: undefined;
};

// Type pour les props des écrans de respiration
export type BreathingScreenProps = {
  route: any;
  navigation: any;
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

// Composant de chargement pour les écrans en lazy loading
const LoadingScreen = () => {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
};

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
          name="Info" 
          component={InformationScreen} 
          options={{ title: 'Informations' }} 
        />
        
        {/* Écrans de respiration avec lazy loading */}
        <Stack.Screen 
          name="PhysiologicalSigh" 
          options={{ title: 'Soupir Physiologique' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <PhysiologicalSighScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="CyclicHyperventilation" 
          options={{ title: 'Hyperventilation Cyclique' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <CyclicHyperventilationScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="WimHof" 
          options={{ title: 'Méthode Wim Hof' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <WimHofScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="Respiration478" 
          options={{ title: 'Respiration 4-7-8' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <Respiration478Screen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="RespirationCoherente" 
          options={{ title: 'Respiration Cohérente' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <RespirationCoherenteScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="RespirationDiaphragmatique" 
          options={{ title: 'Respiration Diaphragmatique' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <RespirationDiaphragmatiqueScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="RespirationAlternee" 
          options={{ title: 'Respiration Alternée' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <RespirationAlterneeScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="RespirationButeyko" 
          options={{ title: 'Méthode Buteyko' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <RespirationButeykoScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="RespirationUjjayi" 
          options={{ title: 'Respiration Ujjayi' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <RespirationUjjayiScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="RespirationBox" 
          options={{ title: 'Respiration Box' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <RespirationBoxScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen 
          name="RespirationTummo" 
          options={{ title: 'Respiration Tummo' }} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <RespirationTummoScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
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
