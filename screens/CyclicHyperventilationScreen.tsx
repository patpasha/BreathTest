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

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;

const CyclicHyperventilationScreen = () => {
  const { settings } = useSettings();
  const { addSession } = useStats();
  const { playInhale, playExhale, playHold, playComplete } = useSound(settings.soundEnabled);
  const { lightImpact, mediumImpact, successNotification } = useHaptics(settings.hapticsEnabled);
  const theme = useTheme();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [breathCount, setBreathCount] = useState(0);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(5); // Durée par défaut en minutes
  const [duration, setDuration] = useState(sessionDurationMinutes * 60); 
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isHoldingBreath, setIsHoldingBreath] = useState(false);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimeRef = useRef(15); 

  useEffect(() => {
    setDuration(sessionDurationMinutes * 60);
    if (!isActive) {
      setTimeRemaining(sessionDurationMinutes * 60);
    }
  }, [sessionDurationMinutes, isActive]);
  
  const handleDurationChange = (newDuration: number) => {
    setSessionDurationMinutes(newDuration);
  };

  const steps = [
    { name: 'Inspiration', duration: 1500, instruction: 'Inspirez profondément par le nez' },
    { name: 'Expiration', duration: 1500, instruction: 'Expirez complètement par la bouche' },
  ];

  const playFeedback = (stepName: string) => {
    switch (stepName) {
      case 'Inspiration':
        playInhale();
        mediumImpact();
        break;
      case 'Expiration':
        playExhale();
        lightImpact();
        break;
      case 'Rétention':
        playHold();
        successNotification();
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
    if (isActive && !isHoldingBreath) {
      const currentStepObj = steps[currentStep];
      playFeedback(currentStepObj.name);
      
      Animated.timing(animatedValue, {
        toValue: currentStep === 0 ? 1 : 0,
        duration: currentStepObj.duration,
        useNativeDriver: true,
      }).start();

      cycleTimerRef.current = setTimeout(() => {
        const nextStep = (currentStep + 1) % steps.length;
        setCurrentStep(nextStep);
        
        if (nextStep === 0) {
          setBreathCount(prev => {
            const newCount = prev + 1;
            
            if (newCount >= 25) {
              startBreathHold();
              return 0;
            }
            
            return newCount;
          });
        }
      }, currentStepObj.duration);
    } else if (cycleTimerRef.current && !isHoldingBreath) {
      clearTimeout(cycleTimerRef.current);
    }

    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [currentStep, isActive, isHoldingBreath]);

  const startBreathHold = () => {
    setIsHoldingBreath(true);
    playFeedback('Rétention');
    
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    holdTimerRef.current = setTimeout(() => {
      setIsHoldingBreath(false);
      setCurrentCycle(prev => prev + 1);
      setCurrentStep(0);
    }, holdTimeRef.current * 1000);
  };

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCurrentCycle(1);
    setBreathCount(0);
    setTimeRemaining(duration);
    setIsHoldingBreath(false);
    setSessionStartTime(new Date());
  };

  const handleStop = async () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    
    // Enregistrer la session interrompue dans les statistiques
    if (sessionStartTime) {
      const sessionDuration = Math.floor((duration - timeRemaining));
      console.log('Session Hyperventilation Cyclique interrompue après', sessionDuration, 'secondes'); // Debug
      
      // N'enregistrer que si la session a duré au moins 10 secondes
      if (sessionDuration >= 10) {
        try {
          await addSession({
            techniqueId: 'hyperventilation-cyclique',
            techniqueName: 'Hyperventilation Cyclique',
            duration: sessionDuration,
            date: new Date().toISOString(),
            completed: false
          });
          console.log('Session Hyperventilation Cyclique interrompue enregistrée avec succès'); // Debug
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement de la session interrompue:', error);
        }
      }
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    setCurrentStep(0);
    setIsHoldingBreath(false);
    animatedValue.setValue(0);
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    
    playComplete();
    successNotification();
    Alert.alert(
      "Session terminée",
      `Vous avez complété ${currentCycle} cycles d'hyperventilation cyclique.`,
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
              <Text style={[styles.stepName, { color: theme.primary }]}>
                {isHoldingBreath ? 'Rétention' : steps[currentStep].name}
              </Text>
              <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                {isHoldingBreath ? 'Retenez votre souffle aussi longtemps que possible' : steps[currentStep].instruction}
              </Text>
              {isHoldingBreath && (
                <Text style={[styles.holdTime, { color: theme.primary }]}>{holdTimeRef.current}s</Text>
              )}
              {!isHoldingBreath && (
                <Text style={[styles.breathCount, { color: theme.textSecondary }]}>Respiration: {breathCount}/25</Text>
              )}
            </View>
          </Animated.View>
        </View>

        <View style={styles.warningContainer}>
          <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>Hyperventilation Cyclique</Text>
          <Text style={[styles.warningText, { color: theme.error }]}>
            ⚠️ Ne pratiquez pas cette technique si vous avez des problèmes cardiaques, respiratoires, ou si vous êtes enceinte.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            1. Respirez profondément 25 fois (inspirations et expirations rapides).
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            2. Après la 25ème respiration, expirez complètement et retenez votre souffle aussi longtemps que possible.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            3. Inspirez profondément et retenez pendant 15 secondes.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            4. Répétez le cycle 3-4 fois.
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
  breathCount: {
    fontSize: 14,
    marginTop: 5,
  },
  holdTime: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  warningContainer: {
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
  warningText: {
    fontSize: 14,
    marginBottom: 15,
    fontWeight: 'bold',
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
  durationSelectorContainer: {
    marginVertical: 15,
    width: '100%',
  },
});

export default CyclicHyperventilationScreen;
