import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useSettings } from '../contexts/SettingsContext';
import useSound from '../hooks/useSound';
import useHaptics from '../hooks/useHaptics';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;

const RespirationAlterneeScreen = () => {
  const { settings } = useSettings();
  const { playInhale, playExhale, playHold, playComplete } = useSound(settings.soundEnabled);
  const { lightImpact, mediumImpact, successNotification } = useHaptics(settings.hapticsEnabled);
  const theme = useTheme();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [duration, setDuration] = useState(settings.sessionDuration * 60); 
  const [timeRemaining, setTimeRemaining] = useState(duration);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Nettoyer tous les timers lors du démontage du composant
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setDuration(settings.sessionDuration * 60);
    if (!isActive) {
      setTimeRemaining(settings.sessionDuration * 60);
    }
  }, [settings.sessionDuration, isActive]);

  // Les étapes de la respiration alternée par les narines (Nadi Shodhana)
  const steps = [
    { name: 'Préparation', duration: 3000, instruction: 'Fermez la narine droite avec le pouce droit' },
    { name: 'Inspiration Gauche', duration: 4000, instruction: 'Inspirez lentement par la narine gauche' },
    { name: 'Transition', duration: 2000, instruction: 'Fermez la narine gauche, ouvrez la narine droite' },
    { name: 'Expiration Droite', duration: 4000, instruction: 'Expirez lentement par la narine droite' },
    { name: 'Inspiration Droite', duration: 4000, instruction: 'Inspirez lentement par la narine droite' },
    { name: 'Transition', duration: 2000, instruction: 'Fermez la narine droite, ouvrez la narine gauche' },
    { name: 'Expiration Gauche', duration: 4000, instruction: 'Expirez lentement par la narine gauche' },
  ];

  const playFeedback = (stepName: string) => {
    switch (stepName) {
      case 'Inspiration Gauche':
      case 'Inspiration Droite':
        playInhale();
        mediumImpact();
        break;
      case 'Expiration Gauche':
      case 'Expiration Droite':
        playExhale();
        lightImpact();
        break;
      case 'Transition':
      case 'Préparation':
        playHold();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      const currentStepObj = steps[currentStep];
      playFeedback(currentStepObj.name);
      
      // Animation différente selon l'étape
      let toValue = 0;
      if (currentStepObj.name.includes('Inspiration')) {
        toValue = 1;
      } else if (currentStepObj.name.includes('Expiration')) {
        toValue = 0;
      } else {
        toValue = 0.5; // Pour les transitions
      }
      
      Animated.timing(animatedValue, {
        toValue,
        duration: currentStepObj.duration,
        useNativeDriver: true,
      }).start();

      cycleTimerRef.current = setTimeout(() => {
        const nextStep = (currentStep + 1) % steps.length;
        setCurrentStep(nextStep);
        
        if (nextStep === 0) {
          setCurrentCycle(prev => prev + 1);
        }
      }, currentStepObj.duration);
    } else if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
    }

    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [currentStep, isActive]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCurrentCycle(1);
    setTimeRemaining(duration);
  };

  const handleStop = () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
  };

  const handleComplete = () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    
    playComplete();
    successNotification();
    Alert.alert(
      "Session terminée",
      `Vous avez complété ${currentCycle} cycles de respiration alternée par les narines.`,
      [{ text: "OK" }]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  // Couleur différente selon la narine utilisée
  const getStepColor = () => {
    const currentStepObj = steps[currentStep];
    if (currentStepObj.name.includes('Gauche')) {
      return '#3498db'; // Bleu pour la narine gauche
    } else if (currentStepObj.name.includes('Droite')) {
      return '#e74c3c'; // Rouge pour la narine droite
    }
    return theme.primary; // Couleur par défaut pour les transitions
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mainContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: theme.textPrimary }]}>{formatTime(timeRemaining)}</Text>
          <Text style={[styles.cyclesText, { color: theme.textSecondary }]}>Cycle: {currentCycle}</Text>
        </View>

        <View style={styles.circleContainer}>
          <Animated.View style={[styles.circleWrapper, { transform: [{ scale }] }]}>
            <Svg height={CIRCLE_SIZE} width={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={CIRCLE_SIZE / 2 - 10}
                stroke={isActive ? getStepColor() : theme.primary}
                strokeWidth="2"
                fill={theme.surfaceLight}
              />
            </Svg>
            <View style={styles.circleContent}>
              <Text style={[styles.stepName, { color: isActive ? getStepColor() : theme.primary }]}>
                {steps[currentStep].name}
              </Text>
              <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                {steps[currentStep].instruction}
              </Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>
            Respiration Alternée par les Narines
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            Le Nadi Shodhana, ou respiration alternée par les narines, est une technique de pranayama qui équilibre les deux hémisphères du cerveau et le système nerveux.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            1. Asseyez-vous confortablement, le dos droit.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            2. Utilisez votre pouce droit pour fermer la narine droite.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            3. Inspirez lentement par la narine gauche.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            4. Fermez la narine gauche avec l'annulaire droit, ouvrez la narine droite.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            5. Expirez par la narine droite, puis inspirez par la même narine.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            6. Fermez la narine droite, ouvrez la gauche et expirez par la narine gauche.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            Bénéfices: Équilibre le système nerveux, réduit le stress et l'anxiété, améliore la concentration.
          </Text>
        </View>

        
      </ScrollView>
        
        {/* Bouton fixe en bas de l'écran */}
        <View style={[styles.fixedButtonContainer, { backgroundColor: theme.background, borderTopColor: theme.border, borderTopWidth: 1 }]}>
          {!isActive ? (
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: theme.primary }]} 
              onPress={handleStart}
            >
              <Text style={styles.buttonText}>Commencer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.stopButton, { backgroundColor: theme.error }]} 
              onPress={handleStop}
            >
              <Text style={styles.buttonText}>Arrêter</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Espace pour le bouton fixe
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  cyclesText: {
    fontSize: 18,
    marginTop: 5,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  stepName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  instructionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  startButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  stopButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RespirationAlterneeScreen;
