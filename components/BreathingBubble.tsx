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
    
    // Détection plus précise pour l'inspiration
    if (
      name.includes('inspiration') || 
      name.includes('inhale') || 
      name.includes('inhalation') || 
      name.includes('inspir') ||
      name.startsWith('première') ||  // Pour le soupir physiologique
      name.startsWith('seconde') ||   // Pour le soupir physiologique
      name.includes('respirations profondes') ||
      name.includes('respirations rapides')
    ) {
      return 'inhale';
    } 
    // Détection plus précise pour l'expiration
    else if (
      name.includes('expiration') || 
      name.includes('exhale') || 
      name.includes('exhalation') || 
      name.includes('expir') ||
      name.includes('souffl')
    ) {
      return 'exhale';
    } 
    // Détection plus précise pour la rétention
    else if (
      name.includes('hold') || 
      name.includes('retention') || 
      name.includes('rétention') || 
      name.includes('pause') || 
      name.includes('attente') ||
      name.includes('repos')
    ) {
      return 'hold';
    }
    // Cas spécial pour la répétition dans la méthode Wim Hof
    else if (name.includes('repeat')) {
      return 'hold';
    }
    // Par défaut, considérer comme une rétention
    else {
      console.log(`Type d'étape non reconnu: "${stepName}", considéré comme 'hold'`);
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
    // Si une instruction spécifique est fournie, l'utiliser
    if (instruction) return instruction;
    
    // Sinon, utiliser des instructions par défaut basées sur le type d'étape
    switch (stepType) {
      case 'inhale':
        return 'Inspirez profondément';
      case 'exhale':
        return 'Expirez lentement';
      case 'hold':
        // Adapter l'instruction en fonction de l'étape précédente
        if (previousStepType === 'inhale') {
          return 'Retenez (poumons pleins)';
        } else if (previousStepType === 'exhale') {
          return 'Retenez (poumons vides)';
        } else {
          return 'Retenez votre souffle';
        }
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
    
    // Mettre à jour le type d'étape précédent pour les transitions
    setPreviousStepType(stepType);
    
    // Animation de vague pour l'inspiration et l'expiration
    if (stepType === 'inhale' || stepType === 'exhale') {
      Animated.loop(
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: stepType === 'inhale' ? 4000 * 0.8 : 6000 * 0.6, // Durées par défaut
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Arrêter l'animation de vague pour la rétention
      waveAnimation.setValue(0);
    }
    
    // Animations spécifiques pour chaque type d'étape
    switch (stepType) {
      case 'inhale':
        // Animation d'inspiration: expansion progressive avec accélération au début et décélération à la fin
        Animated.timing(scaleValue, {
          toValue: 1.3,  // Réduit pour éviter les débordements
          duration: 4000, // Durée par défaut
          easing: Easing.bezier(0.2, 0.0, 0.4, 1.0), // Courbe d'accélération plus naturelle
          useNativeDriver: true,
        }).start();
        
        // Augmentation de l'opacité avec une courbe naturelle
        Animated.timing(opacityValue, {
          toValue: 0.95,
          duration: 4000 * 0.6, // Légèrement plus rapide pour donner une sensation de plénitude
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }).start();
        break;
        
      case 'exhale':
        // Animation d'expiration: contraction progressive avec une courbe naturelle
        Animated.timing(scaleValue, {
          toValue: 0.7,  // Augmenté pour éviter une contraction excessive
          duration: 6000, // Durée par défaut
          easing: Easing.bezier(0.4, 0.0, 0.6, 1.0), // Courbe adaptée pour l'expiration (plus lente à la fin)
          useNativeDriver: true,
        }).start();
        
        // Diminution de l'opacité avec une courbe naturelle
        Animated.timing(opacityValue, {
          toValue: 0.8,
          duration: 6000 * 0.8, // Plus lente pour accompagner l'expiration complète
          easing: Easing.bezier(0.4, 0.0, 0.6, 1),
          useNativeDriver: true,
        }).start();
        break;
        
      case 'hold':
        // Pour la rétention du souffle, maintenir la bulle immobile
        // Déterminer la taille de la bulle en fonction de l'étape précédente
        let holdScale = 1.0; // Valeur par défaut
        
        if (previousStepType === 'inhale') {
          // Après une inspiration, maintenir légèrement gonflé
          holdScale = 1.15;
        } else if (previousStepType === 'exhale') {
          // Après une expiration, maintenir légèrement contracté
          holdScale = 0.85;
        }
        
        // Légère animation de pulsation pour indiquer que la phase est active
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: holdScale,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: holdScale * 0.97,
            duration: 2000 / 2,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: holdScale,
            duration: 2000 / 2,
            useNativeDriver: true,
          })
        ]).start();
        
        // Légère pulsation de l'opacité pour indiquer que la phase est active
        Animated.sequence([
          Animated.timing(opacityValue, {
            toValue: 0.92,
            duration: 2000 * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0.85,
            duration: 2000 * 0.4,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0.92,
            duration: 2000 * 0.3,
            useNativeDriver: true,
          })
        ]).start();
        break;
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
        duration: 4000 - 400, // Durée par défaut
        useNativeDriver: true,
      }),
      // Diminution progressive pour préparer à la prochaine instruction
      Animated.timing(instructionOpacity, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
    
  }, [currentStep, isActive, theme, previousStepType]);

  // Calcul pour l'anneau de progression
  const stepType = getStepType(currentStep);
  const currentColor = getStepColor(stepType);
  const circleSize = size * 1.2; // Réduit pour éviter les débordements
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
  
  // Animation de vague pour l'inspiration et l'expiration
  const waveTransform = waveAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, stepType === 'inhale' ? -15 : 15], // Réduit pour éviter les débordements
  });
  
  // Obtenir l'icône directionnelle en fonction du type d'étape
  const getDirectionalIndicator = () => {
    const arrowSize = size * 0.12; // Réduit pour éviter les chevauchements
    const arrowColor = 'rgba(255, 255, 255, 0.7)';
    
    if (stepType === 'inhale') {
      // Flèches vers l'intérieur pour l'inspiration
      return (
        <Animated.View 
          style={[
            styles.directionalIndicator,
            {
              opacity: instructionOpacity,
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
            r={radius - 6}
            strokeWidth={4}
            stroke={`${currentColor}33`}
            fill="transparent"
          />
          
          {/* Anneau de progression */}
          <AnimatedCircle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius - 6}
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
      
      {/* Effet de vague pour l'inspiration et l'expiration - uniquement si actif */}
      {(stepType === 'inhale' || stepType === 'exhale') && isActive && (
        <Animated.View 
          style={[
            styles.waveContainer,
            {
              transform: [{ translateY: waveTransform }],
              opacity: opacityValue.interpolate({
                inputRange: [0.8, 1],
                outputRange: [0.1, 0.25], // Réduit pour être moins visible
                extrapolate: 'clamp'
              })
            }
          ]}
        >
          <Svg width={size * 1.2} height={size * 0.25} viewBox={`0 0 ${size * 1.2} ${size * 0.25}`}>
            <Path
              d={`M0,${size * 0.125} 
                 C${size * 0.3},${size * 0.05} 
                 ${size * 0.6},${size * 0.2} 
                 ${size * 0.9},${size * 0.125} 
                 C${size * 1.2},${size * 0.05} 
                 ${size * 1.2},${size * 0.125} 
                 ${size * 1.2},${size * 0.125} 
                 L${size * 1.2},${size * 0.25} 
                 L0,${size * 0.25} Z`}
              fill={currentColor}
              opacity={0.2} // Réduit pour être moins visible
            />
          </Svg>
        </Animated.View>
      )}
      
      {/* Cercle principal */}
      <Animated.View 
        style={[
          styles.bubble,
          {
            width: size * 0.9, // Réduit pour éviter le chevauchement avec l'anneau de progression
            height: size * 0.9, // Réduit pour éviter le chevauchement avec l'anneau de progression
            borderRadius: (size * 0.9) / 2,
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
    width: '90%', // Réduit pour éviter les débordements de texte
    height: '90%', // Réduit pour éviter les débordements de texte
  },
  instruction: {
    fontSize: 14, // Réduit pour éviter les débordements
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 5, // Réduit pour éviter les chevauchements
  },
  directionalIndicator: {
    position: 'absolute',
    bottom: '20%', // Ajusté pour éviter les chevauchements
  },
  waveContainer: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // Assure que le conteneur ne déborde pas
    height: '100%', // Assure que le conteneur ne déborde pas
    overflow: 'hidden', // Empêche les débordements
  }
});

export default BreathingBubble; 