import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface BreathingBubbleProps {
  isActive: boolean;
  currentStep: string;
  progress: number;
  size: number;
  instruction?: string;
}

const BreathingBubble: React.FC<BreathingBubbleProps> = ({ 
  isActive, 
  currentStep, 
  progress, 
  size,
  instruction = ''
}) => {
  const theme = useTheme();
  
  // Animations
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const instructionOpacity = useRef(new Animated.Value(1)).current;
  
  // Déterminer le type d'étape
  const getStepType = (stepName: string): 'inhale' | 'exhale' | 'hold' => {
    const name = stepName.toLowerCase();
    if (name.includes('inspiration') || name.includes('inhale') || name.includes('inhalation')) {
      return 'inhale';
    } else if (name.includes('expiration') || name.includes('exhale') || name.includes('exhalation')) {
      return 'exhale';
    } else {
      return 'hold';
    }
  };

  // Déterminer la couleur en fonction de l'étape
  const getStepColor = (stepType: 'inhale' | 'exhale' | 'hold') => {
    switch (stepType) {
      case 'inhale': return theme.primary;
      case 'exhale': return theme.secondary || '#4CAF50';
      case 'hold': return theme.accent || '#FFC107';
    }
  };

  // Obtenir le texte d'instruction basé sur le type d'étape
  const getInstructionText = (stepType: 'inhale' | 'exhale' | 'hold') => {
    if (instruction) return instruction;
    
    switch (stepType) {
      case 'inhale': return 'Inspirez';
      case 'exhale': return 'Expirez';
      case 'hold': return 'Retenez';
    }
  };

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
    }
  };

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
          toValue: 0.9,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(instructionOpacity, {
          toValue: 0.7,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
      
      return;
    }

    const stepType = getStepType(currentStep);
    const stepDuration = getStepDuration(currentStep);
    
    // Annuler les animations précédentes
    scaleValue.stopAnimation();
    opacityValue.stopAnimation();
    instructionOpacity.stopAnimation();
    
    // Animation de progression
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: stepDuration,
      easing: Easing.linear,
      useNativeDriver: false
    }).start();
    
    if (stepType === 'inhale') {
      // Animation d'inspiration: expansion douce
      Animated.timing(scaleValue, {
        toValue: 1.3,
        duration: stepDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
      // Augmentation de l'opacité
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: stepDuration * 0.5,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
    } else if (stepType === 'exhale') {
      // Animation d'expiration: contraction douce
      Animated.timing(scaleValue, {
        toValue: 0.85,
        duration: stepDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
      // Diminution de l'opacité
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: stepDuration * 0.7,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
    } else {
      // Animation de rétention: légère pulsation
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: stepDuration * 0.3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: stepDuration * 0.7,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ]).start();
      
      // Opacité stable pendant la rétention
      Animated.timing(opacityValue, {
        toValue: 0.95,
        duration: stepDuration * 0.3,
        useNativeDriver: true,
      }).start();
    }
    
    // Animation de l'instruction
    Animated.sequence([
      Animated.timing(instructionOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(instructionOpacity, {
        toValue: 0.9,
        duration: stepDuration - 600,
        useNativeDriver: true,
      }),
      Animated.timing(instructionOpacity, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
  }, [currentStep, isActive]);

  // Calcul pour l'anneau de progression
  const stepType = getStepType(currentStep);
  const currentColor = getStepColor(stepType);
  const circleSize = size * 1.2;
  const radius = circleSize / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Effet pour gérer la progression externe
  useEffect(() => {
    // Mise à jour directe de la progression
    if (isActive) {
      // Calculer le strokeDashoffset basé sur la progression
      const dashOffset = circumference * (1 - progress / 100);
      // Mettre à jour directement la valeur animée
      progressAnim.setValue(progress / 100);
    }
  }, [progress, isActive, circumference]);
  
  // Création d'un composant Circle animé
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  // ID unique pour le gradient
  const gradientId = `gradient-${currentColor.replace('#', '')}`;
  
  // Calcul du strokeDashoffset basé sur la progression
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  
  return (
    <View style={[styles.container, { width: circleSize, height: circleSize }]}>
      {/* Anneau de progression */}
      <View style={styles.progressContainer}>
        <Svg width={circleSize} height={circleSize} style={styles.svg}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={currentColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={`${currentColor}99`} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>
          
          {/* Anneau de fond */}
          <Circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius - 2}
            strokeWidth={4}
            stroke={`${currentColor}33`}
            fill="transparent"
          />
          
          {/* Anneau de progression */}
          <AnimatedCircle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius - 2}
            strokeWidth={4}
            stroke={`url(#${gradientId})`}
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
      <Animated.View 
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: currentColor,
            opacity: opacityValue,
            transform: [{ scale: scaleValue }],
          }
        ]}
      >
        {/* Instructions */}
        <Animated.View style={[styles.textContainer, { opacity: instructionOpacity }]}>
          <Text style={styles.instruction}>
            {getInstructionText(stepType)}
          </Text>
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  progressContainer: {
    position: 'absolute',
    zIndex: 1,
    width: '100%',
    height: '100%',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  instruction: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }
});

export default BreathingBubble; 