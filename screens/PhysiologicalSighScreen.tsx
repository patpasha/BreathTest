import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useSettings } from '../contexts/SettingsContext';
import useSound from '../hooks/useSound';
import useHaptics from '../hooks/useHaptics';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;

const PhysiologicalSighScreen = () => {
  const { settings } = useSettings();
  const { playInhale, playExhale } = useSound(settings.soundEnabled);
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

  useEffect(() => {
    setDuration(settings.sessionDuration * 60);
    if (!isActive) {
      setTimeRemaining(settings.sessionDuration * 60);
    }
  }, [settings.sessionDuration, isActive]);

  const steps = [
    { name: 'Première inspiration', duration: 1500, instruction: 'Inspirez profondément par le nez' },
    { name: 'Deuxième inspiration', duration: 1000, instruction: 'Inspirez encore un peu plus' },
    { name: 'Expiration', duration: 3000, instruction: 'Expirez lentement par la bouche' },
    { name: 'Pause', duration: 1000, instruction: 'Attendez avant le prochain cycle' },
  ];

  const playFeedback = (stepName: string) => {
    switch (stepName) {
      case 'Première inspiration':
      case 'Deuxième inspiration':
        playInhale();
        mediumImpact();
        break;
      case 'Expiration':
        playExhale();
        lightImpact();
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
      
      Animated.timing(animatedValue, {
        toValue: currentStep < 2 ? 1 : 0, 
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
    successNotification();
    Alert.alert(
      "Session terminée",
      `Vous avez complété ${currentCycle} cycles de soupirs physiologiques.`,
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
                stroke={theme.primary}
                strokeWidth="2"
                fill={theme.surfaceLight}
              />
            </Svg>
            <View style={styles.circleContent}>
              <Text style={[styles.stepName, { color: theme.primary }]}>{steps[currentStep].name}</Text>
              <Text style={[styles.instruction, { color: theme.textSecondary }]}>{steps[currentStep].instruction}</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>Soupir Physiologique</Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            1. Prenez une inspiration profonde par le nez.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            2. Suivie immédiatement d'une deuxième inspiration plus courte pour remplir complètement vos poumons.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            3. Expirez lentement et complètement par la bouche.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            4. Répétez ce cycle plusieurs fois pour réduire rapidement le stress.
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
    alignItems: 'center',
    paddingHorizontal: 20,
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
    height: height * 0.3, 
    marginVertical: 10,
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
    width: CIRCLE_SIZE * 0.75,
  },
  stepName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  instructionContainer: {
    width: '100%',
    marginBottom: 15,
    marginTop: 10,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
    marginTop: 5,
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

export default PhysiologicalSighScreen;
