import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Svg, { Circle, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';

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
  const blurValue = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0.8)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  
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
        }),
        Animated.timing(blurValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(rotateValue, {
          toValue: 0,
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
    blurValue.stopAnimation();
    textOpacity.stopAnimation();
    rotateValue.stopAnimation();
    
    if (stepType === 'inhale') {
      // Animation d'inspiration: expansion, augmentation de l'opacité
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 1.4, // Expansion plus importante
          duration: stepDuration * 0.9,
          easing: Easing.bezier(0.2, 0, 0.4, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: stepDuration * 0.7,
          easing: Easing.bezier(0.2, 0, 0.4, 1),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: stepDuration * 0.5,
          easing: Easing.bezier(0.2, 0, 0.4, 1),
          useNativeDriver: true,
        }),
        Animated.timing(blurValue, {
          toValue: 0,
          duration: stepDuration * 0.7,
          useNativeDriver: false,
        }),
        Animated.timing(rotateValue, {
          toValue: 5, // Légère rotation dans le sens horaire
          duration: stepDuration,
          easing: Easing.bezier(0.2, 0, 0.4, 1),
          useNativeDriver: true,
        })
      ]).start();
    } else if (stepType === 'exhale') {
      // Animation d'expiration: contraction, diminution de l'opacité
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.8, // Contraction plus importante
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
        Animated.timing(textOpacity, {
          toValue: 0.8,
          duration: stepDuration * 0.5,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(blurValue, {
          toValue: 2,
          duration: stepDuration * 0.8,
          useNativeDriver: false,
        }),
        Animated.timing(rotateValue, {
          toValue: -5, // Légère rotation dans le sens anti-horaire
          duration: stepDuration,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animation de rétention: légère pulsation
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.15, // Pulsation plus prononcée
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
        Animated.timing(textOpacity, {
          toValue: 0.9,
          duration: stepDuration * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(blurValue, {
          toValue: 1,
          duration: stepDuration * 0.5,
          useNativeDriver: false,
        }),
        // Petite oscillation pendant la rétention
        Animated.sequence([
          Animated.timing(rotateValue, {
            toValue: 2,
            duration: stepDuration * 0.3,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: -2,
            duration: stepDuration * 0.3,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: 0,
            duration: stepDuration * 0.4,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          })
        ])
      ]).start();
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
  
  // Couleur secondaire pour les gradients
  const getSecondaryColor = (primaryColor: string) => {
    // Créer une couleur plus claire ou plus foncée selon le type d'étape
    const stepType = getStepType(currentStep);
    if (stepType === 'inhale') {
      // Couleur plus claire pour l'inspiration
      return lightenColor(primaryColor, 30);
    } else if (stepType === 'exhale') {
      // Couleur plus foncée pour l'expiration
      return darkenColor(primaryColor, 20);
    } else {
      // Couleur légèrement différente pour la rétention
      return shiftHue(primaryColor, 15);
    }
  };
  
  // Fonction pour éclaircir une couleur
  const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return `#${(0x1000000 + (R < 255 ? R : 255) * 0x10000 + (G < 255 ? G : 255) * 0x100 + (B < 255 ? B : 255)).toString(16).slice(1)}`;
  };
  
  // Fonction pour assombrir une couleur
  const darkenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return `#${(0x1000000 + (R > 0 ? R : 0) * 0x10000 + (G > 0 ? G : 0) * 0x100 + (B > 0 ? B : 0)).toString(16).slice(1)}`;
  };
  
  // Fonction pour décaler la teinte d'une couleur
  const shiftHue = (color: string, degrees: number) => {
    // Conversion simplifiée, pour une implémentation complète il faudrait convertir en HSL
    const num = parseInt(color.replace('#', ''), 16);
    const R = (num >> 16);
    const G = (num >> 8 & 0x00FF);
    const B = (num & 0x0000FF);
    // Simple décalage des canaux pour simuler un changement de teinte
    return `#${(0x1000000 + ((R + degrees) % 255) * 0x10000 + ((G + degrees) % 255) * 0x100 + ((B + degrees) % 255)).toString(16).slice(1)}`;
  };
  
  // Calcul de la circonférence pour l'arc de progression
  const circleSize = size * 1.2;
  const radius = circleSize / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Création d'un composant Circle animé
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  // ID unique pour les gradients
  const radialGradientId = `radial-gradient-${currentColor.replace('#', '')}`;
  const linearGradientId = `linear-gradient-${currentColor.replace('#', '')}`;
  
  // Couleur secondaire pour les gradients
  const secondaryColor = getSecondaryColor(currentColor);
  
  // Effet de flou animé
  const blurRadius = blurValue.interpolate({
    inputRange: [0, 2],
    outputRange: [0, 8],
  });
  
  // Calcul du strokeDashoffset basé sur la progression
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  
  // Animation de rotation
  const rotate = rotateValue.interpolate({
    inputRange: [-5, 5],
    outputRange: ['-5deg', '5deg'],
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
            <RadialGradient id={radialGradientId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={secondaryColor} stopOpacity="1" />
              <Stop offset="70%" stopColor={currentColor} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={currentColor} stopOpacity="0.7" />
            </RadialGradient>
            <LinearGradient id={linearGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={secondaryColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={currentColor} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <AnimatedCircle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius - 2}
            strokeWidth={4}
            stroke={`url(#${linearGradientId})`}
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
            backgroundColor: 'transparent',
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 0.8,
            opacity: opacityValue.interpolate({
              inputRange: [0.6, 1],
              outputRange: [0.1, 0.4],
            }),
            transform: [
              { scale: scaleValue },
              { rotate }
            ],
          }
        ]}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Circle
            cx="50%"
            cy="50%"
            r="48%"
            fill={`url(#${radialGradientId})`}
          />
        </Svg>
      </Animated.View>
      
      {/* Cercle principal avec instructions à l'intérieur */}
      <Animated.View 
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: opacityValue,
            transform: [
              { scale: scaleValue },
              { rotate }
            ],
            backgroundColor: 'transparent',
          }
        ]}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 1}
            fill={`url(#${radialGradientId})`}
          />
        </Svg>
        
        {/* Instructions à l'intérieur de la bulle */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={[styles.stepName, { color: '#FFFFFF' }]}>
            {currentStep}
          </Text>
          {instruction ? (
            <Text style={styles.instruction}>
              {instruction}
            </Text>
          ) : null}
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
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
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  }
});

export default BreathingBubble; 