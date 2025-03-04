import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface BreathingBubbleProps {
  isActive: boolean;
  currentStep: string;
  progress: number;
  size?: number;
}

const BreathingBubble = ({ isActive, currentStep, progress, size = 200 }: BreathingBubbleProps) => {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Déterminer l'action en cours
  const isInhale = currentStep.toLowerCase().includes('inspir') || 
                  currentStep.toLowerCase().includes('inhale') || 
                  currentStep.toLowerCase().includes('inhalation');
  
  const isExhale = currentStep.toLowerCase().includes('expir') || 
                  currentStep.toLowerCase().includes('exhale') || 
                  currentStep.toLowerCase().includes('exhalation');
  
  const isHold = currentStep.toLowerCase().includes('pause') || 
                currentStep.toLowerCase().includes('hold') || 
                currentStep.toLowerCase().includes('retention');

  useEffect(() => {
    if (isActive) {
      let toValue = 0.5; // Valeur par défaut pour maintien
      
      if (isInhale) {
        toValue = 1; // Expansion pour l'inspiration
      } else if (isExhale) {
        toValue = 0; // Contraction pour l'expiration
      }
      
      // Animation principale de la bulle
      Animated.timing(animatedValue, {
        toValue,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Courbe d'accélération douce
      }).start();
      
      // Animation de pulsation subtile pour la rétention
      if (isHold) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.sin),
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.sin),
            }),
          ])
        ).start();
      } else {
        // Réinitialiser l'animation de pulsation
        pulseAnim.setValue(1);
      }
    }
  }, [isActive, currentStep, isInhale, isExhale, isHold]);

  // Interpolations pour les animations
  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });
  
  const combinedScale = Animated.multiply(scale, pulseAnim);
  
  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 0.85, 1],
  });
  
  // Couleur basée sur l'étape
  let bubbleColor = theme.primary;
  if (isExhale) {
    bubbleColor = theme.secondary || '#4CAF50';
  } else if (isHold) {
    bubbleColor = theme.accent || '#FFC107';
  }

  // Calcul de la taille du cercle de progression
  const progressSize = size * 1.1; // Légèrement plus grand que la bulle
  const strokeWidth = size * 0.03; // Épaisseur proportionnelle
  const radius = (progressSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <View style={[styles.container, { width: progressSize, height: progressSize }]}>
      {/* Cercle de progression */}
      {isActive && (
        <Animated.View style={[styles.progressCircle, { width: progressSize, height: progressSize }]}>
          <View style={styles.progressContainer}>
            <View style={[
              styles.progressBackground, 
              { 
                width: progressSize, 
                height: progressSize, 
                borderRadius: progressSize / 2,
                borderWidth: strokeWidth,
                borderColor: theme.border
              }
            ]} />
            <Animated.View style={[
              styles.progressForeground,
              {
                width: progressSize,
                height: progressSize,
                borderRadius: progressSize / 2,
                borderWidth: strokeWidth,
                borderColor: bubbleColor,
                opacity: 0.8,
                // Utiliser strokeDasharray et strokeDashoffset pour l'animation de progression
                borderTopWidth: progress < 25 ? 0 : strokeWidth,
                borderRightWidth: progress < 50 ? 0 : strokeWidth,
                borderBottomWidth: progress < 75 ? 0 : strokeWidth,
                borderLeftWidth: progress < 100 ? 0 : strokeWidth,
              }
            ]} />
          </View>
        </Animated.View>
      )}
      
      {/* Bulle principale */}
      <Animated.View 
        style={[
          styles.bubble, 
          { 
            backgroundColor: bubbleColor,
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: combinedScale }],
            opacity: opacity
          }
        ]}
      >
        {/* Texte indicatif au centre de la bulle */}
        <Text style={styles.bubbleText}>
          {isInhale ? '↑' : isExhale ? '↓' : '⏸'}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  progressForeground: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bubbleText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  }
});

export default BreathingBubble; 