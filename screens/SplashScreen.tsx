import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useTheme } from '../theme/ThemeContext';
import { initDatabase } from '../services/DatabaseService';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const theme = useTheme();
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Initialiser la base de données
  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('Initialisation de la base de données depuis SplashScreen...');
        await initDatabase();
        console.log('Base de données initialisée avec succès depuis SplashScreen');
        setDbInitialized(true);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
        setDbError('Erreur lors de l\'initialisation de la base de données');
      }
    };

    initDb();
    
    // Démarrer les animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ]).start();
  }, []);

  useEffect(() => {
    if (dbInitialized) {
      // Ajouter un délai pour que l'animation soit visible
      const timer = setTimeout(() => {
        navigation.replace('MainTabs');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [dbInitialized, navigation]);
  
  // Calcul pour l'anneau de progression
  const circleSize = 200;
  const radius = circleSize / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Création d'un composant Circle animé
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  
  // Calcul du strokeDashoffset basé sur la progression
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
        <View style={styles.progressContainer}>
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
        </View>
        
        {/* Cercle principal */}
        <View 
          style={[
            styles.bubble,
            {
              backgroundColor: theme.primary,
              width: circleSize * 0.7,
              height: circleSize * 0.7,
              borderRadius: circleSize * 0.35,
            }
          ]}
        >
          <Text style={styles.breathText}>B</Text>
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
      
      {dbError && <Text style={[styles.errorText, { color: theme.error }]}>{dbError}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  breathText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorText: {
    marginTop: 10,
  },
});

export default SplashScreen;
