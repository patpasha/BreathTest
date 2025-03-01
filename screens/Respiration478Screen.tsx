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



const Respiration478Screen = () => {
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
    setDuration(sessionDurationMinutes * 60);
    if (!isActive) {
      setTimeRemaining(sessionDurationMinutes * 60);
    }
  }, [sessionDurationMinutes, isActive]);
  
  const handleDurationChange = (newDuration: number) => {
    setSessionDurationMinutes(newDuration);
  };

  // Les étapes de la respiration 4-7-8
  const steps = [
    { name: 'Inspiration', duration: 4000, instruction: 'Inspirez lentement par le nez' },
    { name: 'Rétention', duration: 7000, instruction: 'Retenez votre souffle' },
    { name: 'Expiration', duration: 8000, instruction: 'Expirez lentement par la bouche' },
    { name: 'Pause', duration: 1000, instruction: 'Préparez-vous pour le prochain cycle' },
  ];

  const playFeedback = (stepName: string) => {
    switch (stepName) {
      case 'Inspiration':
        playInhale();
        mediumImpact();
        break;
      case 'Rétention':
        playHold();
        lightImpact();
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
        toValue: currentStep === 0 ? 1 : currentStep === 1 ? 0.8 : 0, 
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
    setSessionStartTime(new Date());
  };

  const handleStop = async () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    
    // Enregistrer la session interrompue dans les statistiques
    if (sessionStartTime) {
      const sessionDuration = Math.floor((duration - timeRemaining));
      console.log('Session 4-7-8 interrompue après', sessionDuration, 'secondes'); // Debug
      
      // N'enregistrer que si la session a duré au moins 10 secondes
      if (sessionDuration >= 10) {
        try {
          await addSession({
            techniqueId: 'respiration-478',
            techniqueName: 'Respiration 4-7-8',
            duration: sessionDuration,
            date: new Date().toISOString(),
            completed: false
          });
          console.log('Session 4-7-8 interrompue enregistrée avec succès'); // Debug
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement de la session interrompue:', error);
        }
      }
    }
  };

  const handleComplete = async () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    
    playComplete();
    successNotification();
    
    // Enregistrer la session dans les statistiques
    if (sessionStartTime) {
      const sessionDuration = Math.floor((duration - timeRemaining));
      console.log('Session 4-7-8 complétée après', sessionDuration, 'secondes'); // Debug
      
      try {
        await addSession({
          techniqueId: 'respiration-478',
          techniqueName: 'Respiration 4-7-8',
          duration: sessionDuration,
          date: new Date().toISOString(),
          completed: true
        });
        console.log('Session 4-7-8 complète enregistrée avec succès'); // Debug
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la session complète:', error);
      }
    }
    
    Alert.alert(
      "Session terminée",
      `Vous avez complété ${currentCycle} cycles de la respiration 4-7-8.`,
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
            <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>Respiration 4-7-8</Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              1. Inspirez lentement par le nez pendant 4 secondes.
            </Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              2. Retenez votre souffle pendant 7 secondes.
            </Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              3. Expirez lentement par la bouche pendant 8 secondes.
            </Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              4. Répétez ce cycle pour réduire l'anxiété et favoriser le sommeil.
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
        <View style={[styles.fixedButtonContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
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
  durationSelectorContainer: {
    marginVertical: 15,
    width: '100%',
    paddingHorizontal: 20,
  },
});

export default Respiration478Screen;
