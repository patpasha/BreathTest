import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

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
  const animatedValue = new Animated.Value(0);
  const scaleValue = new Animated.Value(1);
  const pulseValue = new Animated.Value(0);

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

  // Animation de pulsation continue
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseValue.setValue(0);
    }
  }, [isActive]);

  // Animation basée sur l'étape actuelle
  useEffect(() => {
    if (isActive) {
      const name = currentStep.toLowerCase();
      
      if (name.includes('inspiration') || name.includes('inhale') || name.includes('inhalation')) {
        // Animation d'expansion pour l'inspiration
        Animated.timing(scaleValue, {
          toValue: 1.3,
          duration: 1000,
          easing: Easing.bezier(0.2, 0, 0.4, 1),
          useNativeDriver: true,
        }).start();
      } else if (name.includes('expiration') || name.includes('exhale') || name.includes('exhalation')) {
        // Animation de contraction pour l'expiration
        Animated.timing(scaleValue, {
          toValue: 0.85,
          duration: 1000,
          easing: Easing.bezier(0.6, 0, 0.8, 1),
          useNativeDriver: true,
        }).start();
      } else {
        // Animation de maintien pour les pauses
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 300,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
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
    animatedValue.setValue(progress);
  }, [progress]);

  // Effet de lueur
  const glowOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  // Échelle combinée (animation d'étape + pulsation)
  const combinedScale = Animated.add(
    scaleValue,
    pulseValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.05],
    })
  );

  // Couleur actuelle de l'étape
  const currentColor = getStepColor(currentStep);

  return (
    <View style={[styles.container, { width: size * 1.5, height: size * 1.5 }]}>
      {/* Effet de lueur */}
      <Animated.View 
        style={[
          styles.glow,
          {
            backgroundColor: currentColor,
            opacity: glowOpacity,
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: size * 0.9,
            transform: [{ scale: combinedScale }],
          }
        ]}
      />
      
      {/* Cercle principal */}
      <Animated.View 
        style={[
          styles.bubble,
          {
            backgroundColor: currentColor,
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: combinedScale }],
          }
        ]}
      />
      
      {/* Cercle de progression */}
      <View style={[
        styles.progressCircle,
        {
          width: size * 1.3,
          height: size * 1.3,
          borderRadius: size * 0.65,
          borderColor: currentColor,
        }
      ]}>
        <Animated.View 
          style={[
            styles.progressArc,
            {
              width: size * 1.3,
              height: size * 1.3,
              borderRadius: size * 0.65,
              borderColor: currentColor,
              transform: [
                { 
                  rotate: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }) 
                }
              ],
            }
          ]}
        />
      </View>
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
  },
  glow: {
    position: 'absolute',
    zIndex: 1,
  },
  progressCircle: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'transparent',
    zIndex: 0,
  },
  progressArc: {
    position: 'absolute',
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});

export default BreathingBubble; 