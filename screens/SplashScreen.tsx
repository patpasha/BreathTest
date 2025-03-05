import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useTheme } from '../theme/ThemeContext';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const theme = useTheme();
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  // Initialiser les animations et démarrer le timer
  useEffect(() => {
    // Démarrer les animations d'entrée
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
    
    // Ajouter un délai pour que l'animation soit visible
    const timer = setTimeout(() => {
      startExitAnimation();
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  // Animation de sortie
  const startExitAnimation = () => {
    Animated.parallel([
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 800,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      })
    ]).start(() => {
      navigation.replace('MainTabs');
    });
  };
  
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

  // Animation de rotation pour l'anneau
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);
  
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.background,
          opacity: exitAnim
        }
      ]}
    >
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: exitAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              })}
            ]
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
        
        {/* Logo au lieu du cercle avec la lettre B */}
        <View style={styles.logoWrapper}>
          <Image 
            source={require('../assets/splash-icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
      
      <Animated.Text 
        style={[
          styles.title, 
          { 
            color: theme.textPrimary,
            opacity: opacityAnim,
            transform: [
              { translateY: opacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })},
              { translateY: exitAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })}
            ]
          }
        ]}
      >
        BreathFlow
      </Animated.Text>
    </Animated.View>
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

export default SplashScreen;
