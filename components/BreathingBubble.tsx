import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Text, useColorScheme } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Svg, { Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeOffset, FeComposite, FeColorMatrix, FeMerge, FeMergeNode, FeBlend } from 'react-native-svg';

interface BreathingBubbleProps {
  isActive: boolean;
  currentStep: string;
  progress: number;
  size?: number;
}

const BreathingBubble = ({ isActive, currentStep, progress, size = 200 }: BreathingBubbleProps) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const animatedValue = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [currentAnimation, setCurrentAnimation] = useState<Animated.CompositeAnimation | null>(null);
  const [currentPulseAnimation, setCurrentPulseAnimation] = useState<Animated.CompositeAnimation | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  // Effet pour gérer les changements d'étape
  useEffect(() => {
    // Arrêter les animations en cours
    if (currentAnimation) {
      currentAnimation.stop();
    }
    if (currentPulseAnimation) {
      currentPulseAnimation.stop();
    }

    if (isActive) {
      let toValue = 0.5; // Valeur par défaut pour maintien
      
      if (isInhale) {
        toValue = 1; // Expansion pour l'inspiration
      } else if (isExhale) {
        toValue = 0; // Contraction pour l'expiration
      }
      
      // Animation principale de la bulle avec une durée adaptée à la progression
      const animation = Animated.timing(animatedValue, {
        toValue,
        duration: 1500, // Durée fixe pour une animation fluide
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Courbe d'accélération douce
      });
      
      setCurrentAnimation(animation);
      animation.start();
      
      // Animation de pulsation subtile pour la rétention
      if (isHold) {
        const pulseAnimation = Animated.loop(
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
        );
        
        setCurrentPulseAnimation(pulseAnimation);
        pulseAnimation.start();
      } else {
        // Réinitialiser l'animation de pulsation
        pulseAnim.setValue(1);
      }
    }

    // Nettoyage lors du démontage ou du changement d'étape
    return () => {
      if (currentAnimation) {
        currentAnimation.stop();
      }
      if (currentPulseAnimation) {
        currentPulseAnimation.stop();
      }
    };
  }, [isActive, currentStep, isInhale, isExhale, isHold]);

  // Effet pour animer la progression
  useEffect(() => {
    if (isActive) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100, // Animation rapide mais pas instantanée
        useNativeDriver: false,
        easing: Easing.linear,
      }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [progress, isActive]);

  // Interpolations pour les animations
  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.3], // Augmenter le contraste entre les états
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

  // Couleurs pour le cercle de progression avec meilleur contraste en mode sombre
  const progressBackgroundColor = isDarkMode ? '#2d3748' : theme.border;
  const progressColor = bubbleColor;
  
  // Identifiants pour les gradients et filtres
  const progressGradientId = `progressGradient-${bubbleColor.replace(/#/g, '')}`;
  const glowFilterId = `glowFilter-${bubbleColor.replace(/#/g, '')}`;
  
  // Assurer un bon contraste pour le texte
  const textColor = 'white';
  
  // Icône basée sur l'étape
  const stepIcon = isInhale ? '↑' : isExhale ? '↓' : '⏸';

  // Calcul de la taille du cercle de progression
  const progressSize = size * 1.1; // Légèrement plus grand que la bulle
  const strokeWidth = size * 0.04; // Épaisseur augmentée pour meilleure visibilité
  const radius = (progressSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animation du strokeDashoffset pour le cercle SVG
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: progressSize, height: progressSize }]}>
      {/* Cercle de progression avec SVG pour une animation plus fluide */}
      {isActive && (
        <View style={[styles.progressCircle, { width: progressSize, height: progressSize }]}>
          <Svg width={progressSize} height={progressSize}>
            <Defs>
              {/* Gradient pour le cercle de progression */}
              <LinearGradient id={progressGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={progressColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={progressColor} stopOpacity="0.7" />
              </LinearGradient>
              
              {/* Filtre pour l'effet de lueur (glow) */}
              <Filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
                <FeGaussianBlur stdDeviation="3" result="blur" />
                <FeColorMatrix
                  in="blur"
                  type="matrix"
                  values="0 0 0 0 0
                          0 0 0 0 0
                          0 0 0 0 0
                          0 0 0 1 0"
                  result="glow"
                />
                <FeBlend in="SourceGraphic" in2="glow" mode="normal" />
              </Filter>
            </Defs>
            
            {/* Cercle de fond avec effet de lueur en mode sombre */}
            <Circle
              cx={progressSize / 2}
              cy={progressSize / 2}
              r={radius}
              strokeWidth={strokeWidth}
              stroke={progressBackgroundColor}
              fill="transparent"
              opacity={isDarkMode ? 0.5 : 0.3}
            />
            
            {/* Cercle de progression animé avec effet de lueur */}
            <AnimatedCircle
              cx={progressSize / 2}
              cy={progressSize / 2}
              r={radius}
              strokeWidth={strokeWidth}
              stroke={`url(#${progressGradientId})`}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${progressSize / 2}, ${progressSize / 2}`}
              opacity={1}
              strokeOpacity={1}
              filter={isDarkMode ? `url(#${glowFilterId})` : undefined}
            />
          </Svg>
        </View>
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
        <View style={styles.bubbleIconContainer}>
          <Text style={[styles.bubbleText, { color: textColor }]}>
            {stepIcon}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

// Composant Circle animé
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bubbleIconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  bubbleText: {
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  }
});

export default BreathingBubble; 