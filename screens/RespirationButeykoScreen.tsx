import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useSettings } from '../contexts/SettingsContext';
import DurationSelector from '../components/DurationSelector';
import { useStats } from '../contexts/StatsContext';
import useSound from '../hooks/useSound';
import useHaptics from '../hooks/useHaptics';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;

const RespirationButeykoScreen = () => {
  const { settings } = useSettings();
  const { addSession } = useStats();
  const { playInhale, playExhale, playHold, playComplete } = useSound(settings.soundEnabled);
  const { lightImpact, mediumImpact, successNotification } = useHaptics(settings.hapticsEnabled);
  const theme = useTheme();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(5); // Durée par défaut en minutes
  const [duration, setDuration] = useState(sessionDurationMinutes * 60); 
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [holdTime, setHoldTime] = useState(0); // Pour mesurer le temps de rétention
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDuration(sessionDurationMinutes * 60);
    if (!isActive) {
      setTimeRemaining(sessionDurationMinutes * 60);
    }
  }, [sessionDurationMinutes, isActive]);
  
  const handleDurationChange = (newDuration: number) => {
    setSessionDurationMinutes(newDuration);
  };

  // Les étapes de la méthode Buteyko
  const steps = [
    { name: 'Respiration Normale', duration: 10000, instruction: 'Respirez normalement, calmement' },
    { name: 'Expiration Douce', duration: 5000, instruction: 'Expirez doucement par le nez' },
    { name: 'Rétention', duration: 20000, instruction: 'Retenez votre souffle aussi longtemps que confortable', isHold: true },
    { name: 'Récupération', duration: 10000, instruction: 'Respirez calmement par le nez' },
  ];

  const playFeedback = (stepName: string) => {
    switch (stepName) {
      case 'Respiration Normale':
        playInhale();
        lightImpact();
        break;
      case 'Expiration Douce':
        playExhale();
        lightImpact();
        break;
      case 'Rétention':
        playHold();
        mediumImpact();
        break;
      case 'Récupération':
        playInhale();
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
      
      // Si c'est une étape de rétention, démarrer le compteur de rétention
      if (currentStepObj.isHold) {
        setHoldTime(0);
        holdTimerRef.current = setInterval(() => {
          setHoldTime(prev => prev + 1);
        }, 1000);
      } else if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
      
      // Animation différente selon l'étape
      let toValue = 0;
      if (currentStepObj.name === 'Respiration Normale') {
        toValue = 0.5; // Respiration normale
      } else if (currentStepObj.name === 'Expiration Douce') {
        toValue = 0; // Expiration
      } else if (currentStepObj.name === 'Rétention') {
        toValue = 0.2; // Rétention (légèrement gonflé)
      } else {
        toValue = 0.5; // Récupération
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
    } else {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    }

    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [currentStep, isActive]);

  // Nettoyer tous les timers lors du démontage du composant
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, []);

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCurrentCycle(1);
    setTimeRemaining(duration);
    setHoldTime(0);
    setSessionStartTime(new Date());
  };

  const handleStop = async () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    
    // Enregistrer la session interrompue dans les statistiques
    if (sessionStartTime) {
      const sessionDuration = Math.floor((duration - timeRemaining));
      console.log('Session Méthode Buteyko interrompue après', sessionDuration, 'secondes'); // Debug
      
      // N'enregistrer que si la session a duré au moins 10 secondes
      if (sessionDuration >= 10) {
        try {
          await addSession({
            techniqueId: 'respiration-buteyko',
            techniqueName: 'Méthode Buteyko',
            duration: sessionDuration,
            date: new Date().toISOString(),
            completed: false
          });
          console.log('Session Méthode Buteyko interrompue enregistrée avec succès'); // Debug
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement de la session interrompue:', error);
        }
      }
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    setHoldTime(0);
    
    playComplete();
    successNotification();
    Alert.alert(
      "Session terminée",
      `Vous avez complété ${currentCycle} cycles de la méthode Buteyko.`,
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
    outputRange: [1, 1.2],
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
          {steps[currentStep].isHold && isActive && (
            <Text style={[styles.holdText, { color: theme.primary }]}>
              Temps de rétention: {holdTime}s
            </Text>
          )}
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
              <Text style={[styles.stepName, { color: theme.primary }]}>
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
            Méthode Buteyko
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            La méthode Buteyko, développée par le Dr Konstantin Buteyko, vise à corriger la surrespiration chronique en réduisant le volume respiratoire.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            1. Commencez par respirer normalement pendant quelques minutes.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            2. Expirez doucement par le nez.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            3. Pincez votre nez et retenez votre souffle aussi longtemps que confortable.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            4. Lorsque vous ressentez le besoin de respirer, relâchez et respirez calmement par le nez.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            5. Après une période de récupération, répétez le cycle.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            Bénéfices: Aide à gérer l'asthme, améliore l'oxygénation des tissus, réduit l'hyperventilation.
          </Text>
          <Text style={[styles.warningText, { color: theme.error }]}>
            Note: Si vous avez des problèmes respiratoires, consultez un médecin avant de pratiquer cette technique.
          </Text>
        </View>

        {!isActive && (
          <View style={styles.durationSelectorContainer}>
            <DurationSelector
              duration={sessionDurationMinutes}
              onDurationChange={handleDurationChange}
              minDuration={1}
              maxDuration={60}
              step={1}
            />
          </View>
        )}
        
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
  durationSelectorContainer: {
    marginVertical: 15,
    width: '100%',
    paddingHorizontal: 20,
  },
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
  holdText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
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
  warningText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
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

export default RespirationButeykoScreen;
