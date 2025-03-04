import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Svg, { Circle } from 'react-native-svg';

interface BreathingBubbleProps {
  isActive: boolean;
  currentStep: string;
  progress: number;
  size: number;
}

const BreathingBubble: React.FC<BreathingBubbleProps> = ({ 
  isActive, 
  currentStep, 
  progress, 
  size 
}) => {
  const theme = useTheme();
  
  // Utilisation de useRef pour conserver les valeurs entre les rendus
  const animatedValue = useRef(new Animated.Value(progress)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  // Déterminer la couleur en fonction de l'étape
  const getStepColor = (stepName: string) => {
    const name = stepName.toLowerCase();
    if (name.includes('inspiration') || name.includes('inhale') || name.includes('inhalation')) {
      return theme.primary;
    } else if (name.includes('expiration') || name.includes('exhale') || name.includes('exhalation')) {
      return theme.secondary || '#4CAF50';
    } else if (name.includes('pause') || name.includes('hold') || name.includes('retention')) {
      return theme.accent || '#FFC107';
    }
    return theme.primary;
  };

  // Animation basée sur l'étape actuelle
  useEffect(() => {
    if (isActive) {
      const name = currentStep.toLowerCase();
      
      if (name.includes('inspiration') || name.includes('inhale') || name.includes('inhalation')) {
        // Animation d'expansion pour l'inspiration
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } else if (name.includes('expiration') || name.includes('exhale') || name.includes('exhalation')) {
        // Animation de contraction pour l'expiration
        Animated.timing(scaleValue, {
          toValue: 0.9,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } else {
        // Animation de maintien pour les pauses
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: 300,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    } else {
      // État par défaut
      scaleValue.setValue(1);
    }
  }, [currentStep, isActive]);

  // Animation de progression
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start();
  }, [progress]);

  // Couleur actuelle de l'étape
  const currentColor = getStepColor(currentStep);
  
  // Calcul de la circonférence pour l'arc de progression
  const circleSize = size * 1.2;
  const radius = circleSize / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Création d'un composant Circle animé
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  
  return (
    <View style={[styles.container, { width: circleSize, height: circleSize }]}>
      {/* Cercle de progression */}
      <Animated.View 
        style={[
          styles.progressRing,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderColor: currentColor,
            opacity: 0.3,
          }
        ]}
      />
      
      {/* Arc de progression animé */}
      <View style={[
        styles.progressContainer,
        {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
        }
      ]}>
        <Svg width={circleSize} height={circleSize} style={styles.svg}>
          <AnimatedCircle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius - 2}
            strokeWidth={3}
            stroke={currentColor}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, 0],
            })}
            strokeLinecap="round"
            rotation="-90"
            origin={`${circleSize / 2}, ${circleSize / 2}`}
          />
        </Svg>
      </View>
      
      {/* Cercle principal */}
      <Animated.View 
        style={[
          styles.bubble,
          {
            backgroundColor: currentColor,
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: scaleValue }],
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bubble: {
    position: 'absolute',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'solid',
    zIndex: 0,
  },
  progressContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  svg: {
    position: 'absolute',
  }
});

export default BreathingBubble; 