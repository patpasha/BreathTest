import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

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
  const [prevStep, setPrevStep] = useState(currentStep);
  
  // Utilisation de useRef pour conserver les valeurs entre les rendus
  const animatedValue = useRef(new Animated.Value(progress)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.8)).current;
  const blurValue = useRef(new Animated.Value(0)).current;
  
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

  // Déterminer le type d'étape
  const getStepType = (stepName: string) => {
    const name = stepName.toLowerCase();
    if (name.includes('inspiration') || name.includes('inhale') || name.includes('inhalation')) {
      return 'inhale';
    } else if (name.includes('expiration') || name.includes('exhale') || name.includes('exhalation')) {
      return 'exhale';
    } else {
      return 'hold';
    }
  };

  // Effet pour détecter les changements d'étape
  useEffect(() => {
    if (currentStep !== prevStep) {
      setPrevStep(currentStep);
    }
  }, [currentStep, prevStep]);

  // Animation basée sur l'étape actuelle
  useEffect(() => {
    if (!isActive) {
      // État par défaut quand inactif
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blurValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        })
      ]).start();
      return;
    }

    const stepType = getStepType(currentStep);
    const stepDuration = getStepDuration(currentStep);
    
    // Annuler les animations précédentes
    scaleValue.stopAnimation();
    opacityValue.stopAnimation();
    blurValue.stopAnimation();
    
    if (stepType === 'inhale') {
      // Animation d'inspiration: expansion, augmentation de l'opacité
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 1.3,
          duration: stepDuration * 0.9, // Légèrement plus rapide pour une meilleure perception
          easing: Easing.bezier(0.2, 0, 0.4, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: stepDuration * 0.7,
          easing: Easing.bezier(0.2, 0, 0.4, 1),
          useNativeDriver: true,
        }),
        Animated.timing(blurValue, {
          toValue: 0,
          duration: stepDuration * 0.7,
          useNativeDriver: false,
        })
      ]).start();
    } else if (stepType === 'exhale') {
      // Animation d'expiration: contraction, diminution de l'opacité
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.85,
          duration: stepDuration * 0.9,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.6,
          duration: stepDuration * 0.8,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(blurValue, {
          toValue: 2,
          duration: stepDuration * 0.8,
          useNativeDriver: false,
        })
      ]).start();
    } else {
      // Animation de rétention: légère pulsation
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: stepDuration * 0.3,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1.05,
            duration: stepDuration * 0.7,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          })
        ]),
        Animated.timing(opacityValue, {
          toValue: 0.9,
          duration: stepDuration * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(blurValue, {
          toValue: 1,
          duration: stepDuration * 0.5,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [currentStep, isActive]);

  // Estimer la durée de l'étape en fonction du nom
  const getStepDuration = (stepName: string): number => {
    // Recherche d'un nombre dans le nom de l'étape (ex: "Inspiration 4s")
    const durationMatch = stepName.match(/\d+\s*s/);
    if (durationMatch) {
      const numericValue = parseInt(durationMatch[0].replace(/\D/g, ''));
      return numericValue * 1000;
    }
    
    // Durées par défaut basées sur le type d'étape
    const stepType = getStepType(stepName);
    switch (stepType) {
      case 'inhale': return 4000;
      case 'exhale': return 6000;
      case 'hold': return 2000;
      default: return 4000;
    }
  };

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

  // ID unique pour le gradient
  const gradientId = `gradient-${currentColor.replace('#', '')}`;
  
  // Effet de flou animé
  const blurRadius = blurValue.interpolate({
    inputRange: [0, 2],
    outputRange: [0, 8],
  });
  
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
            opacity: 0.2,
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
          <Defs>
            <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={currentColor} stopOpacity="1" />
              <Stop offset="80%" stopColor={currentColor} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={currentColor} stopOpacity="0.6" />
            </RadialGradient>
          </Defs>
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
      
      {/* Effet de halo */}
      <Animated.View 
        style={[
          styles.halo,
          {
            backgroundColor: currentColor,
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            opacity: opacityValue.interpolate({
              inputRange: [0.6, 1],
              outputRange: [0.1, 0.3],
            }),
            transform: [{ scale: scaleValue }],
          }
        ]}
      />
      
      {/* Cercle principal */}
      <Animated.View 
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: opacityValue,
            transform: [{ scale: scaleValue }],
            backgroundColor: 'transparent',
          }
        ]}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 1}
            fill={`url(#${gradientId})`}
          />
        </Svg>
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
  bubble: {
    position: 'absolute',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  halo: {
    position: 'absolute',
    zIndex: 2,
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