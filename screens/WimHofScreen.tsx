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

const WimHofScreen = () => {
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
  const [isRecoveryBreath, setIsRecoveryBreath] = useState(false);
  const [holdTime, setHoldTime] = useState(0);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimeCounterRef = useRef<NodeJS.Timeout | null>(null);

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
      case 'Récupération':
        playInhale();
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
    if (isActive && !isHoldingBreath && !isRecoveryBreath) {
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
            
            if (newCount >= 30) {
              startBreathHold();
              return 0;
            }
            
            return newCount;
          });
        }
      }, currentStepObj.duration);
    } else if (cycleTimerRef.current && !isHoldingBreath && !isRecoveryBreath) {
      clearTimeout(cycleTimerRef.current);
    }

    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [currentStep, isActive, isHoldingBreath, isRecoveryBreath]);

  const startBreathHold = () => {
    setIsHoldingBreath(true);
    setHoldTime(0);
    playFeedback('Rétention');
    
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Start counting hold time
    holdTimeCounterRef.current = setInterval(() => {
      setHoldTime(prev => prev + 1);
    }, 1000);
  };

  const startRecoveryBreath = () => {
    if (holdTimeCounterRef.current) {
      clearInterval(holdTimeCounterRef.current);
    }
    
    setIsHoldingBreath(false);
    setIsRecoveryBreath(true);
    playFeedback('Récupération');
    
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    holdTimerRef.current = setTimeout(() => {
      setIsRecoveryBreath(false);
      setCurrentCycle(prev => prev + 1);
      setCurrentStep(0);
    }, 15000); // 15 seconds for recovery breath
  };

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCurrentCycle(1);
    setBreathCount(0);
    setTimeRemaining(duration);
    setIsHoldingBreath(false);
    setIsRecoveryBreath(false);
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
      console.log('Session Méthode Wim Hof interrompue après', sessionDuration, 'secondes'); // Debug
      
      // N'enregistrer que si la session a duré au moins 10 secondes
      if (sessionDuration >= 10) {
        try {
          await addSession({
            techniqueId: 'wim-hof',
            techniqueName: 'Méthode Wim Hof',
            duration: sessionDuration,
            date: new Date().toISOString(),
            completed: false
          });
          console.log('Session Méthode Wim Hof interrompue enregistrée avec succès'); // Debug
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
    setIsRecoveryBreath(false);
    animatedValue.setValue(0);
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    
    if (holdTimeCounterRef.current) {
      clearInterval(holdTimeCounterRef.current);
    }
    
    playComplete();
    successNotification();
    Alert.alert(
      "Session terminée",
      `Vous avez complété ${currentCycle} cycles de la méthode Wim Hof.`,
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
              {isHoldingBreath ? (
                <>
                  <Text style={[styles.stepName, { color: theme.primary }]}>Rétention</Text>
                  <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                    Retenez votre souffle aussi longtemps que possible
                  </Text>
                  <Text style={[styles.holdTime, { color: theme.primary }]}>{holdTime}s</Text>
                  <TouchableOpacity 
                    style={[styles.nextButton, { backgroundColor: theme.accent }]} 
                    onPress={startRecoveryBreath}
                  >
                    <Text style={styles.nextButtonText}>Respiration de récupération</Text>
                  </TouchableOpacity>
                </>
              ) : isRecoveryBreath ? (
                <>
                  <Text style={[styles.stepName, { color: theme.primary }]}>Récupération</Text>
                  <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                    Inspirez profondément et retenez pendant 15 secondes
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.stepName, { color: theme.primary }]}>{steps[currentStep].name}</Text>
                  <Text style={[styles.instruction, { color: theme.textSecondary }]}>{steps[currentStep].instruction}</Text>
                  <Text style={[styles.breathCount, { color: theme.textSecondary }]}>Respiration: {breathCount}/30</Text>
                </>
              )}
            </View>
          </Animated.View>
        </View>

        <View style={styles.warningContainer}>
          <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>Méthode Wim Hof</Text>
          <Text style={[styles.warningText, { color: theme.error }]}>
            ⚠️ Ne pratiquez pas cette technique si vous avez des problèmes cardiaques, respiratoires, ou si vous êtes enceinte.
          </Text>
          <Text style={[styles.warningText, { color: theme.error }]}>
            ⚠️ Ne pratiquez jamais cette technique dans l'eau ou en conduisant.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            1. Respirez profondément 30 fois (inspirations et expirations rapides).
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            2. Après la 30ème respiration, expirez complètement et retenez votre souffle aussi longtemps que possible.
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
    height: height * 0.35, 
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
    marginBottom: 8,
  },
  breathCount: {
    fontSize: 14,
    marginTop: 5,
  },
  holdTime: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 10,
  },
  nextButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 5,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginBottom: 10,
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
  durationSelectorContainer: {
    marginVertical: 15,
    width: '100%',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WimHofScreen;
