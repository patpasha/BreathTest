import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useTheme } from '../theme/ThemeContext';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const theme = useTheme();
  
  // Animation pour l'opacité
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Animation pour la taille
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Animation pour la rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Animation pour le pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulse = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  });
  
  // Animation pour l'inner circle
  const innerCircleAnim = useRef(new Animated.Value(0)).current;
  const innerCircleSpin = innerCircleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(innerCircleAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animation de pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Naviguer vers l'écran d'accueil après un délai (réduit à 1800ms)
    const timer = setTimeout(() => {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400, // Réduit de 500 à 400
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 500, // Réduit de 600 à 500
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' as keyof RootStackParamList }],
        });
      });
    }, 1800); // Réduit de 2800 à 1800

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim, rotateAnim, pulseAnim, innerCircleAnim]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: spin }
            ],
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: pulse }],
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.logoCircle, 
              { 
                backgroundColor: theme.primary,
                transform: [{ rotate: innerCircleSpin }],
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.shadowOpacity * 1.5,
                shadowRadius: theme.shadowRadius,
                shadowOffset: theme.shadowOffset,
                elevation: theme.elevation
              }
            ]}
          >
            <Text style={[styles.logoText, { color: theme.textLight }]}>BF</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
      
      <Animated.Text 
        style={[
          styles.appName, 
          { 
            color: theme.primary,
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 70,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 30,
    letterSpacing: 1.5,
  },
});

export default SplashScreen;
