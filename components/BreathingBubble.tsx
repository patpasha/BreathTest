import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Svg, { Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';

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
  const [previousStepType, setPreviousStepType] = useState<'inhale' | 'exhale' | 'hold'>('hold');
  
  // Animations
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const instructionOpacity = useRef(new Animated.Value(1)).current;
  const waveAnimation = useRef(new Animated.Value(0)).current;
  
  // Déterminer le type d'étape
  const getStepType = (stepName: string): 'inhale' | 'exhale' | 'hold' => {
    if (!stepName) return 'hold'; // Valeur par défaut si le nom est vide
    
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
    // Annuler les animations précédentes pour éviter les conflits
    scaleValue.stopAnimation();
    opacityValue.stopAnimation();
    instructionOpacity.stopAnimation();
    waveAnimation.stopAnimation();
    
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
    
    console.log(`BreathingBubble: Animation pour ${stepType} (${currentStep}), durée: ${stepDuration}ms`);
    
    // Mettre à jour le type d'étape précédent pour les transitions
    setPreviousStepType(stepType);
    
    // Animation de vague pour l'inspiration et l'expiration
    if (stepType === 'inhale' || stepType === 'exhale') {
      Animated.loop(
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: stepType === 'inhale' ? stepDuration * 0.8 : stepDuration * 0.6,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Arrêter l'animation de vague pour la rétention
      waveAnimation.setValue(0);
    }
    
    if (stepType === 'inhale') {
      // Animation d'inspiration: expansion progressive avec accélération au début et décélération à la fin
      Animated.timing(scaleValue, {
        toValue: 1.3,  // Augmenté pour une animation plus visible
        duration: stepDuration,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Courbe d'accélération plus naturelle
        useNativeDriver: true,
      }).start();
      
      // Augmentation de l'opacité avec une courbe naturelle
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: stepDuration * 0.6, // Légèrement plus rapide pour donner une sensation de plénitude
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }).start();
      
    } else if (stepType === 'exhale') {
      // Animation d'expiration: contraction progressive avec une courbe naturelle
      Animated.timing(scaleValue, {
        toValue: 0.7,  // Diminué pour une animation plus visible
        duration: stepDuration,
        easing: Easing.bezier(0.4, 0.0, 0.6, 1), // Courbe adaptée pour l'expiration (plus lente à la fin)
        useNativeDriver: true,
      }).start();
      
      // Diminution de l'opacité avec une courbe naturelle
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: stepDuration * 0.8, // Plus lente pour accompagner l'expiration complète
        easing: Easing.bezier(0.4, 0.0, 0.6, 1),
        useNativeDriver: true,
      }).start();
      
    } else {
      // Pour la rétention du souffle, maintenir la bulle immobile
      // Pas d'animation de taille pour éviter de confondre l'utilisateur
      // pendant la phase de rétention
      
      // Légère pulsation de l'opacité pour indiquer que la phase est active
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 0.95,
          duration: stepDuration * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.9,
          duration: stepDuration * 0.4,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.95,
          duration: stepDuration * 0.3,
          useNativeDriver: true,
        })
      ]).start();
    }
    
    // Animation de l'instruction avec timing amélioré
    Animated.sequence([
      // Apparition rapide de l'instruction
      Animated.timing(instructionOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Maintien de la visibilité pendant la majorité de l'étape
      Animated.timing(instructionOpacity, {
        toValue: 0.95,
        duration: stepDuration - 400,
        useNativeDriver: true,
      }),
      // Diminution progressive pour préparer à la prochaine instruction
      Animated.timing(instructionOpacity, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
    
  }, [currentStep, isActive, theme]);

  // Calcul pour l'anneau de progression
  const stepType = getStepType(currentStep);
  const currentColor = getStepColor(stepType);
  const circleSize = size * 1.3;
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
  const AnimatedPath = Animated.createAnimatedComponent(Path);

  // ID unique pour le gradient
  const gradientId = `gradient-${currentColor.replace('#', '')}`;
  
  // Calcul du strokeDashoffset basé sur la progression
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  
  // Animation de vague pour l'inspiration et l'expiration
  const waveTransform = waveAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, stepType === 'inhale' ? -20 : 20],
  });
  
  // Obtenir l'icône directionnelle en fonction du type d'étape
  const getDirectionalIndicator = () => {
    const arrowSize = size * 0.15;
    const arrowColor = 'rgba(255, 255, 255, 0.7)';
    
    if (stepType === 'inhale') {
      // Flèches vers l'intérieur pour l'inspiration
      return (
        <Animated.View 
          style={[
            styles.directionalIndicator,
            {
              opacity: instructionOpacity,
              transform: [{ scale: scaleValue }]
            }
          ]}
        >
          <Svg width={arrowSize} height={arrowSize} viewBox="0 0 24 24">
            <Path 
              d="M20,12l-8,8l-8-8l1.4-1.4l5.6,5.6V4h2v12.2l5.6-5.6L20,12z" 
              fill={arrowColor}
            />
          </Svg>
        </Animated.View>
      );
    } else if (stepType === 'exhale') {
      // Flèches vers l'extérieur pour l'expiration
      return (
        <Animated.View 
          style={[
            styles.directionalIndicator,
            {
              opacity: instructionOpacity,
              transform: [{ scale: scaleValue }]
            }
          ]}
        >
          <Svg width={arrowSize} height={arrowSize} viewBox="0 0 24 24">
            <Path 
              d="M4,12l8-8l8,8l-1.4,1.4L13,7.8V20h-2V7.8l-5.6,5.6L4,12z" 
              fill={arrowColor}
            />
          </Svg>
        </Animated.View>
      );
    } else {
      // Cercle pour la rétention
      return (
        <Animated.View 
          style={[
            styles.directionalIndicator,
            {
              opacity: instructionOpacity,
              transform: [{ scale: scaleValue }]
            }
          ]}
        >
          <Svg width={arrowSize} height={arrowSize} viewBox="0 0 24 24">
            <Circle 
              cx="12" 
              cy="12" 
              r="8" 
              fill="none" 
              stroke={arrowColor} 
              strokeWidth="2"
            />
          </Svg>
        </Animated.View>
      );
    }
  };
  
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
            r={radius - 4}
            strokeWidth={4}
            stroke={`${currentColor}33`}
            fill="transparent"
          />
          
          {/* Anneau de progression */}
          <AnimatedCircle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius - 4}
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
      
      {/* Effet de vague pour l'inspiration et l'expiration */}
      {(stepType === 'inhale' || stepType === 'exhale') && isActive && (
        <Animated.View 
          style={[
            styles.waveContainer,
            {
              transform: [{ translateY: waveTransform }],
              opacity: opacityValue.interpolate({
                inputRange: [0.8, 1],
                outputRange: [0.2, 0.4],
                extrapolate: 'clamp'
              })
            }
          ]}
        >
          <Svg width={size * 1.5} height={size * 0.3} viewBox={`0 0 ${size * 1.5} ${size * 0.3}`}>
            <Path
              d={`M0,${size * 0.15} 
                 C${size * 0.375},${size * 0.05} 
                 ${size * 0.75},${size * 0.25} 
                 ${size * 1.125},${size * 0.15} 
                 C${size * 1.5},${size * 0.05} 
                 ${size * 1.5},${size * 0.15} 
                 ${size * 1.5},${size * 0.15} 
                 L${size * 1.5},${size * 0.3} 
                 L0,${size * 0.3} Z`}
              fill={currentColor}
              opacity={0.3}
            />
          </Svg>
        </Animated.View>
      )}
      
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
          
          {/* Indicateur directionnel */}
          {getDirectionalIndicator()}
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
    marginBottom: 10,
  },
  directionalIndicator: {
    position: 'absolute',
    bottom: '25%',
  },
  waveContainer: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default BreathingBubble; 