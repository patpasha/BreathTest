import React, { lazy, Suspense, useEffect, useCallback, useRef, useState, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
// Importer uniquement les icônes nécessaires
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, View, Text, StyleSheet, Platform, Dimensions, Easing, Animated, Image } from 'react-native';
import { useTheme, darkTheme } from './theme/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { StatsProvider } from './contexts/StatsContext';
import { ThemeProvider } from './theme/ThemeContext';
import { addNewBreathingTechniques, updateBreathingTechniqueCategories } from './services/DatabaseService';
import { initDatabase } from './services/DatabaseService';
import * as ExpoSplashScreen from 'expo-splash-screen';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// Maintenir le splashscreen visible pendant le chargement
ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  /* Le splashscreen est peut-être déjà caché */
});

// Précharger les ressources essentielles en parallèle
const preloadAssets = async () => {
  try {
    // Ne pas utiliser Image.prefetch pour les ressources locales
    // Cela évite le problème "No suitable URL request handler found for (null)"
    console.log('Préchargement des ressources terminé');
    return Promise.resolve();
  } catch (error) {
    console.warn('Erreur lors du préchargement des ressources:', error);
    return Promise.resolve();
  }
};

// Démarrer le préchargement immédiatement
preloadAssets();

// Import des écrans
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen';
import SettingsScreen from './screens/SettingsScreen';
import InformationScreen from './screens/InformationScreen';
import StatsScreen from './screens/StatsScreen';
import ContactDeveloperScreen from './screens/ContactDeveloperScreen';

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

// Interface pour le contexte global de l'application
interface AppContextType {
  showDevTools: boolean;
  setShowDevTools: (show: boolean) => void;
}

// Contexte global pour l'application
export const AppContext = createContext<AppContextType>({
  showDevTools: false,
  setShowDevTools: () => {},
});

// Composant de chargement amélioré pour les écrans en lazy loading
const LoadingScreen = () => {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim]);
  
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: theme.background 
    }}>
      <Animated.View style={{
        transform: [{ scale: pulseAnim }],
        marginBottom: 20
      }}>
        <Image 
          source={require('./assets/splash-icon.png')} 
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={{ 
        color: theme.textPrimary, 
        fontSize: 18, 
        marginTop: 10,
        fontWeight: '500'
      }}>
        Chargement...
      </Text>
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
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          title: 'Accueil',
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
  const { showDevTools } = React.useContext(AppContext);
  
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
  
  // Configuration des animations de transition
  const fadeAnimation = {
    animation: 'fade',
    config: {
      duration: 250,
    }
  };
  
  const slideAnimation = {
    animation: 'slide_from_right',
    config: {
      duration: 300,
    }
  };
  
  // Configuration personnalisée pour les transitions entre écrans
  const customTransitionSpec = {
    open: {
      animation: 'timing',
      config: {
        duration: 350,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    },
  };
  
  // Animation de fondu enchaîné améliorée
  const enhancedFadeTransition = {
    cardStyleInterpolator: ({ current, next, layouts }: {
      current: { progress: any };
      next?: { progress: any };
      layouts: { screen: { width: number; height: number } };
    }) => {
      return {
        cardStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
          transform: [
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
            extrapolate: 'clamp',
          }),
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 600,
          easing: Easing.bezier(0.2, 0.65, 0.4, 0.9),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 450,
          easing: Easing.bezier(0.2, 0.65, 0.4, 0.9),
        },
      },
    },
  };
  
  // Animation de glissement horizontal améliorée
  const enhancedSlideTransition = {
    cardStyleInterpolator: ({ current, next, layouts }: {
      current: { progress: any };
      next?: { progress: any };
      layouts: { screen: { width: number; height: number } };
    }) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
                extrapolate: 'clamp',
              }),
            },
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
            extrapolate: 'clamp',
          }),
        },
      };
    },
    transitionSpec: customTransitionSpec,
  };
  
  // Activer les outils de développement après 5 taps rapides
  const handleDevToolsActivation = () => {
    // Utiliser le contexte global pour activer les outils de développement
    const { setShowDevTools } = React.useContext(AppContext);
    setShowDevTools(true);
  };
  
  return (
    <NavigationContainer>
      <StatusBar style={theme === darkTheme ? "light" : "dark"} />
      <Stack.Navigator 
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          contentStyle: {
            backgroundColor: theme.background,
          },
          ...enhancedSlideTransition,
        }}
      >
        {/* Écrans principaux */}
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
          options={{ 
            headerShown: false,
            ...enhancedFadeTransition,
          }} 
        />
        <Stack.Screen 
          name="Info" 
          component={InformationScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Écran générique pour les techniques de respiration */}
        <Stack.Screen 
          name="GenericBreathingScreen" 
          options={{ headerShown: false }} 
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
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('physiological-sigh', 'Soupir Physiologique')}
        />
        
        <Stack.Screen 
          name="Respiration478" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('4-7-8', 'Respiration 4-7-8')}
        />
        
        <Stack.Screen 
          name="RespirationCoherente" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('coherente', 'Respiration Cohérente')}
        />
        
        <Stack.Screen 
          name="RespirationDiaphragmatique" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('diaphragmatique', 'Respiration Diaphragmatique')}
        />
        
        <Stack.Screen 
          name="RespirationBox" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('box', 'Respiration Box')}
        />
        
        <Stack.Screen 
          name="CyclicHyperventilation" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('cyclic-hyperventilation', 'Hyperventilation Cyclique')}
        />
        
        <Stack.Screen 
          name="WimHof" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('wim-hof', 'Méthode Wim Hof')}
        />
        
        <Stack.Screen 
          name="RespirationAlternee" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('alternee', 'Respiration Alternée')}
        />
        
        <Stack.Screen 
          name="RespirationButeyko" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('buteyko', 'Méthode Buteyko')}
        />
        
        <Stack.Screen 
          name="RespirationUjjayi" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('ujjayi', 'Respiration Ujjayi')}
        />
        
        <Stack.Screen 
          name="RespirationTummo" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('tummo', 'Respiration Tummo')}
        />
        
        {/* Nouvelles techniques de respiration */}
        <Stack.Screen 
          name="RespirationPapillon" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('papillon', 'Respiration Papillon')}
        />
        
        <Stack.Screen 
          name="RespirationLion" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('lion', 'Respiration du Lion')}
        />
        
        <Stack.Screen 
          name="Respiration345" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('3-4-5', 'Technique 3-4-5')}
        />
        
        <Stack.Screen 
          name="RespirationPleineConscience" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('pleine-conscience', 'Respiration en Pleine Conscience')}
        />
        
        <Stack.Screen 
          name="RespirationLevresPincees" 
          options={{ headerShown: false }}
          children={createGenericBreathingScreen('levres-pincees', 'Respiration à Lèvres Pincées')}
        />
        
        <Stack.Screen 
          name="ContactDeveloper" 
          component={ContactDeveloperScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Composant de splashscreen personnalisé
const CustomSplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Calcul pour l'anneau de progression
  const circleSize = 200;
  const radius = circleSize / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animation de rotation
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  useEffect(() => {
    // Démarrer les animations d'entrée immédiatement
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300, // Réduit de 500ms à 300ms
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250, // Réduit de 400ms à 250ms
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000, // Réduit de 1500ms à 1000ms
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000, // Réduit de 3000ms à 2000ms
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    ]).start();
    
    // Réduire le délai d'affichage
    const timer = setTimeout(() => {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300, // Réduit de 500ms à 300ms
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300, // Réduit de 500ms à 300ms
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        })
      ]).start(() => {
        onFinish();
      });
    }, 1200); // Réduit de 2000ms à 1200ms
    
    // Garantir que onFinish est appelé même si l'animation échoue
    const safetyTimer = setTimeout(() => {
      onFinish();
    }, 3000); // Réduit de 5000ms à 3000ms
    
    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, []);
  
  // Création d'un composant Circle animé
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  
  // Calcul du strokeDashoffset basé sur la progression
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  
  return (
    <View style={[styles.splashContainer, { backgroundColor: theme.background }]}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Anneau de progression */}
        <Animated.View 
          style={[
            styles.progressContainer,
            {
              transform: [{ rotate: rotation }]
            }
          ]}
        >
          <Svg width={circleSize} height={circleSize} style={styles.svg}>
            <Defs>
              <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={theme.primary} stopOpacity="1" />
                <Stop offset="100%" stopColor={`${theme.primary}99`} stopOpacity="0.6" />
              </LinearGradient>
            </Defs>
            
            {/* Anneau de fond */}
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius - 2}
              strokeWidth={4}
              stroke={`${theme.primary}33`}
              fill="transparent"
            />
            
            {/* Anneau de progression */}
            <AnimatedCircle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius - 2}
              strokeWidth={4}
              stroke={`url(#gradient)`}
              fill="transparent"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${circleSize / 2}, ${circleSize / 2}`}
            />
          </Svg>
        </Animated.View>
        
        {/* Logo - Utiliser une approche plus sûre pour charger l'image */}
        <View style={styles.logoWrapper}>
          <Image 
            source={require('./assets/splash-icon.png')} 
            style={styles.logo}
            resizeMode="contain"
            // Désactiver le préchargement qui peut causer des problèmes
            defaultSource={require('./assets/splash-icon.png')}
          />
        </View>
      </Animated.View>
      
      <Animated.Text 
        style={[
          styles.title, 
          { 
            color: theme.textPrimary,
            opacity: opacityAnim,
            transform: [{ translateY: opacityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })}]
          }
        ]}
      >
        BreathFlow
      </Animated.Text>
    </View>
  );
};

// Composant principal
export default function App() {
  // Animation pour la transition globale
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDevTools, setShowDevTools] = useState(false);

  // Fonction pour masquer le splashscreen
  const onLayoutRootView = useCallback(async () => {
    try {
      // Masquer le splashscreen natif une fois que l'application est prête
      await ExpoSplashScreen.hideAsync();
    } catch (e) {
      console.warn('Erreur lors de la masquage du splashscreen:', e);
    }
  }, []);

  // Initialiser la base de données au démarrage de l'application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Marquer l'application comme prête immédiatement pour afficher le splash screen
        // Cela permet d'afficher l'interface utilisateur plus rapidement
        setIsAppReady(true);
        
        // Démarrer l'initialisation de la base de données en arrière-plan
        console.log('Initialisation de la base de données en arrière-plan...');
        
        // Initialiser la base de données en arrière-plan
        initDatabase()
          .then(() => {
            console.log('Base de données initialisée avec succès');
            
            // Marquer le chargement comme terminé
            setIsLoading(false);
            
            // Les opérations de maintenance sont désormais optionnelles et peuvent être
            // exécutées en arrière-plan après que l'application soit complètement chargée
            // Elles sont commentées car elles ne sont plus nécessaires pour la plupart des utilisateurs
            /*
            setTimeout(async () => {
              try {
                // Ajouter les nouvelles techniques de respiration à la base de données
                console.log('Ajout des nouvelles techniques de respiration en arrière-plan...');
                await addNewBreathingTechniques();
                console.log('Nouvelles techniques de respiration ajoutées avec succès');
                
                // Mettre à jour les catégories de techniques de respiration
                console.log('Mise à jour des catégories de techniques de respiration en arrière-plan...');
                await updateBreathingTechniqueCategories();
                console.log('Catégories de techniques de respiration mises à jour avec succès');
              } catch (error) {
                console.error('Erreur lors des opérations de maintenance:', error);
              }
            }, 1000);
            */
          })
          .catch((error) => {
            console.error('Erreur lors de l\'initialisation de la base de données:', error);
            setIsLoading(false);
          });
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        setIsLoading(false);
      }
    };

    // Lancer l'initialisation
    initializeApp();
  }, []);

  // Démarrer l'animation de fondu une fois que le splashscreen est terminé
  useEffect(() => {
    if (isSplashAnimationComplete && isAppReady) {
      // Afficher l'écran de chargement pendant un court instant
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }).start(() => {
          setIsLoading(false);
        });
      }, 300);
    }
  }, [isSplashAnimationComplete, isAppReady, fadeAnim]);

  // Gérer la fin de l'animation du splashscreen
  const handleSplashAnimationComplete = useCallback(() => {
    setIsSplashAnimationComplete(true);
  }, []);

  // Si l'application n'est pas prête ou l'animation du splashscreen n'est pas terminée, afficher le splashscreen personnalisé
  if (!isAppReady || !isSplashAnimationComplete) {
    return (
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <SettingsProvider>
          <ThemeProvider>
            <CustomSplashScreen onFinish={handleSplashAnimationComplete} />
          </ThemeProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    );
  }
  
  // Si l'application est en cours de chargement après le splashscreen, afficher l'écran de chargement
  if (isLoading) {
    return (
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <SettingsProvider>
          <ThemeProvider>
            <LoadingScreen />
          </ThemeProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    );
  }

  // Une fois que l'application est prête et que l'animation du splashscreen est terminée, afficher l'application
  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <AppContext.Provider value={{ showDevTools, setShowDevTools }}>
          <SettingsProvider>
            <ThemeProvider>
              <StatsProvider>
                <AppNavigator />
              </StatsProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AppContext.Provider>
      </Animated.View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  svg: {
    position: 'absolute',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
