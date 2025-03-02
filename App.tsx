import React, { lazy, Suspense, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
// Importer uniquement les icônes nécessaires
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, View } from 'react-native';

// Importations immédiates pour les écrans principaux
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen';
import SettingsScreen from './screens/SettingsScreen';
import InformationScreen from './screens/InformationScreen';
import StatsScreen from './screens/StatsScreen';
import TestNewTechniquesScreen from './screens/TestNewTechniquesScreen';
import ContactDeveloperScreen from './screens/ContactDeveloperScreen';
import { SettingsProvider } from './contexts/SettingsContext';
import { StatsProvider } from './contexts/StatsContext';
import { ThemeProvider, useTheme, darkTheme } from './theme/ThemeContext';
import { addNewBreathingTechniques, updateBreathingTechniqueCategories } from './services/DatabaseService';
import { initDatabase } from './services/DatabaseService';

// Chargement paresseux (lazy loading) pour l'écran de respiration générique
const GenericBreathingScreen = lazy(() => import('./screens/GenericBreathingScreen'));

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
  // Écrans principaux
  Splash: undefined;
  MainTabs: undefined;
  Info: undefined;
  TestNewTechniques: undefined;
  ContactDeveloper: undefined;
  
  // Écran générique pour les techniques de respiration
  GenericBreathingScreen: { techniqueId: string; title?: string };
  
  // Toutes les techniques de respiration (migrées vers l'écran générique)
  PhysiologicalSigh: undefined;
  Respiration478: undefined;
  RespirationCoherente: undefined;
  RespirationDiaphragmatique: undefined;
  
  // Nouvelles techniques de respiration
  RespirationPapillon: undefined;
  RespirationLion: undefined;
  Respiration345: undefined;
  RespirationPleineConscience: undefined;
  RespirationLevresPincees: undefined;
  RespirationBox: undefined;
  CyclicHyperventilation: undefined;
  WimHof: undefined;
  RespirationAlternee: undefined;
  RespirationButeyko: undefined;
  RespirationUjjayi: undefined;
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
          // Utiliser des variables pour les noms d'icônes
          let iconName: string;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StatsTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
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
  
  // Fonction utilitaire pour créer des écrans de respiration générique
  const createGenericBreathingScreen = (techniqueId: string, title: string) => {
    return (props: any) => {
      const newProps = {
        ...props,
        route: { ...props.route, params: { techniqueId } }
      };
      return (
        <Suspense fallback={<LoadingScreen />}>
          <GenericBreathingScreen {...newProps} />
        </Suspense>
      );
    };
  };
  
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
        {/* Écrans principaux */}
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
        
        {/* Écran générique pour les techniques de respiration */}
        <Stack.Screen 
          name="GenericBreathingScreen" 
          options={({ route }) => ({ 
            title: route.params?.title || 'Technique de respiration',
            headerBackTitle: 'Retour'
          })} 
        >
          {props => (
            <Suspense fallback={<LoadingScreen />}>
              <GenericBreathingScreen {...props} />
            </Suspense>
          )}
        </Stack.Screen>
        
        {/* Toutes les techniques de respiration (migrées vers l'écran générique) */}
        <Stack.Screen 
          name="PhysiologicalSigh" 
          options={{ title: 'Soupir Physiologique' }}
          children={createGenericBreathingScreen('physiological-sigh', 'Soupir Physiologique')}
        />
        
        <Stack.Screen 
          name="Respiration478" 
          options={{ title: 'Respiration 4-7-8' }}
          children={createGenericBreathingScreen('4-7-8', 'Respiration 4-7-8')}
        />
        
        <Stack.Screen 
          name="RespirationCoherente" 
          options={{ title: 'Respiration Cohérente' }}
          children={createGenericBreathingScreen('coherente', 'Respiration Cohérente')}
        />
        
        <Stack.Screen 
          name="RespirationDiaphragmatique" 
          options={{ title: 'Respiration Diaphragmatique' }}
          children={createGenericBreathingScreen('diaphragmatique', 'Respiration Diaphragmatique')}
        />
        
        <Stack.Screen 
          name="RespirationBox" 
          options={{ title: 'Respiration Box' }}
          children={createGenericBreathingScreen('box', 'Respiration Box')}
        />
        
        <Stack.Screen 
          name="CyclicHyperventilation" 
          options={{ title: 'Hyperventilation Cyclique' }}
          children={createGenericBreathingScreen('cyclic-hyperventilation', 'Hyperventilation Cyclique')}
        />
        
        <Stack.Screen 
          name="WimHof" 
          options={{ title: 'Méthode Wim Hof' }}
          children={createGenericBreathingScreen('wim-hof', 'Méthode Wim Hof')}
        />
        
        <Stack.Screen 
          name="RespirationAlternee" 
          options={{ title: 'Respiration Alternée' }}
          children={createGenericBreathingScreen('alternee', 'Respiration Alternée')}
        />
        
        <Stack.Screen 
          name="RespirationButeyko" 
          options={{ title: 'Méthode Buteyko' }}
          children={createGenericBreathingScreen('buteyko', 'Méthode Buteyko')}
        />
        
        <Stack.Screen 
          name="RespirationUjjayi" 
          options={{ title: 'Respiration Ujjayi' }}
          children={createGenericBreathingScreen('ujjayi', 'Respiration Ujjayi')}
        />
        
        <Stack.Screen 
          name="RespirationTummo" 
          options={{ title: 'Respiration Tummo' }}
          children={createGenericBreathingScreen('tummo', 'Respiration Tummo')}
        />
        
        {/* Nouvelles techniques de respiration */}
        <Stack.Screen 
          name="RespirationPapillon" 
          options={{ title: 'Respiration Papillon' }}
          children={createGenericBreathingScreen('papillon', 'Respiration Papillon')}
        />
        
        <Stack.Screen 
          name="RespirationLion" 
          options={{ title: 'Respiration du Lion' }}
          children={createGenericBreathingScreen('lion', 'Respiration du Lion')}
        />
        
        <Stack.Screen 
          name="Respiration345" 
          options={{ title: 'Technique 3-4-5' }}
          children={createGenericBreathingScreen('3-4-5', 'Technique 3-4-5')}
        />
        
        <Stack.Screen 
          name="RespirationPleineConscience" 
          options={{ title: 'Respiration en Pleine Conscience' }}
          children={createGenericBreathingScreen('pleine-conscience', 'Respiration en Pleine Conscience')}
        />
        
        <Stack.Screen 
          name="RespirationLevresPincees" 
          options={{ title: 'Respiration à Lèvres Pincées' }}
          children={createGenericBreathingScreen('levres-pincees', 'Respiration à Lèvres Pincées')}
        />
        
        {/* Écran de test pour les nouvelles techniques */}
        <Stack.Screen 
          name="TestNewTechniques" 
          component={TestNewTechniquesScreen}
          options={{ title: 'Test des nouvelles techniques' }}
        />
        
        <Stack.Screen 
          name="ContactDeveloper" 
          component={ContactDeveloperScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Composant principal
export default function App() {
  // Ajouter les nouvelles techniques de respiration au démarrage de l'application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ajouter les nouvelles techniques de respiration à la base de données
        await addNewBreathingTechniques();
        console.log('Nouvelles techniques de respiration ajoutées avec succès');
        
        // Mettre à jour les catégories des techniques de respiration
        await updateBreathingTechniqueCategories();
        console.log('Catégories des techniques de respiration mises à jour avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
      }
    };

    initializeApp();
  }, []);

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
