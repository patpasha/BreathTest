import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

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
  const [prevStep, setPrevStep] = useState(currentStep);
  
  // Utilisation de useRef pour conserver les valeurs entre les rendus
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0.8)).current;
  
  // Référence pour la progression circulaire
  const progressRef = useRef({
    value: 0,
    animation: null as Animated.CompositeAnimation | null
  });
  const progressAnim = useRef(new Animated.Value(0)).current;
  
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
      
      // Réinitialiser la progression au changement d'étape
      if (progressRef.current.animation) {
        progressRef.current.animation.stop();
      }
      
      progressRef.current.value = 0;
      progressAnim.setValue(0);
      
      // Démarrer une nouvelle animation de progression
      if (isActive) {
        const duration = getStepDuration(currentStep);
        const animation = Animated.timing(progressAnim, {
          toValue: 1,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: false
        });
        
        progressRef.current.animation = animation;
        animation.start();
      }
    }
  }, [currentStep, prevStep, isActive]);

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
        Animated.timing(textOpacity, {
          toValue: 0.9,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
      
      // Arrêter l'animation de progression
      if (progressRef.current.animation) {
        progressRef.current.animation.stop();
      }
      
      return;
    }

    const stepType = getStepType(currentStep);
    const stepDuration = getStepDuration(currentStep);
    
    // Annuler les animations précédentes
    scaleValue.stopAnimation();
    opacityValue.stopAnimation();
    textOpacity.stopAnimation();
    
    if (stepType === 'inhale') {
      // Animation d'inspiration: expansion douce et progressive
      Animated.timing(scaleValue, {
        toValue: 1.5,
        duration: stepDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
      // Augmentation progressive de l'opacité
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: stepDuration * 0.5,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
      // Texte plus visible pendant l'inspiration
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: stepDuration * 0.3,
        useNativeDriver: true,
      }).start();
      
    } else if (stepType === 'exhale') {
      // Animation d'expiration: contraction douce et progressive
      Animated.timing(scaleValue, {
        toValue: 0.8,
        duration: stepDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
      // Diminution progressive de l'opacité
      Animated.timing(opacityValue, {
        toValue: 0.7,
        duration: stepDuration * 0.7,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
      // Texte légèrement moins visible pendant l'expiration
      Animated.timing(textOpacity, {
        toValue: 0.9,
        duration: stepDuration * 0.3,
        useNativeDriver: true,
      }).start();
      
    } else {
      // Animation de rétention: légère pulsation
      Animated.sequence([
        // Légère expansion
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: stepDuration * 0.3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        // Maintien avec légère contraction
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: stepDuration * 0.7,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ]).start();
      
      // Opacité stable pendant la rétention
      Animated.timing(opacityValue, {
        toValue: 0.9,
        duration: stepDuration * 0.3,
        useNativeDriver: true,
      }).start();
      
      // Texte bien visible pendant la rétention
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: stepDuration * 0.3,
        useNativeDriver: true,
      }).start();
    }
  }, [currentStep, isActive]);

  // Effet pour gérer la progression externe
  useEffect(() => {
    // Ne mettre à jour la progression que si elle est contrôlée de l'extérieur
    // et qu'il n'y a pas d'animation en cours
    if (!isActive || !progressRef.current.animation) {
      progressAnim.setValue(progress);
    }
  }, [progress, isActive]);

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
  
  // Calcul du strokeDashoffset basé sur la progression
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  
  // Obtenir le texte d'instruction basé sur le type d'étape
  const getInstructionText = () => {
    if (instruction) return instruction;
    
    const stepType = getStepType(currentStep);
    switch (stepType) {
      case 'inhale': return 'Inspirez profondément';
      case 'exhale': return 'Expirez lentement';
      case 'hold': return 'Retenez votre souffle';
      default: return '';
    }
  };
  
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
            opacity: 0.15,
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
            strokeWidth={5}
            stroke={currentColor}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
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
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            opacity: opacityValue.interpolate({
              inputRange: [0.7, 1],
              outputRange: [0.1, 0.25],
            }),
            transform: [{ scale: scaleValue }],
          }
        ]}
      />
      
      {/* Cercle principal avec instructions à l'intérieur */}
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
        
        {/* Instructions à l'intérieur de la bulle */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={[styles.stepName, { color: '#FFFFFF' }]}>
            {currentStep}
          </Text>
          <Text style={styles.instruction}>
            {getInstructionText()}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  progressRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'solid',
    zIndex: 0,
  },
  progressContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: '100%',
    height: '100%',
  },
  stepName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  }
});

export default BreathingBubble; 