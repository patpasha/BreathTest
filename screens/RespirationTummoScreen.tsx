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
import { BreathingScreenProps } from '../App';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;

const RespirationTummoScreen = ({ route, navigation }: BreathingScreenProps) => {
  const { settings } = useSettings();
  const { addSession } = useStats();
  const { playInhale, playExhale, playHold, playComplete } = useSound(settings.soundEnabled);
  const { lightImpact, mediumImpact, successNotification } = useHaptics(settings.hapticsEnabled);
  const theme = useTheme();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(5); // Durée par défaut en minutes
  const [duration, setDuration] = useState(sessionDurationMinutes * 60); 
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [holdTime, setHoldTime] = useState(0);
  
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

  // Les étapes de la respiration Tummo (technique traditionnelle tibétaine dont la méthode Wim Hof est dérivée)
  const steps = [
    // Phase 1: Respirations profondes et rapides (30 cycles)
    { name: 'Inspiration Profonde', duration: 1500, instruction: 'Inspirez profondément par le nez', phase: 'hyperventilation' },
    { name: 'Expiration Complète', duration: 1500, instruction: 'Expirez complètement par la bouche', phase: 'hyperventilation' },
    
    // Phase 2: Rétention du souffle après expiration
    { name: 'Rétention', duration: 90000, instruction: 'Expirez complètement et retenez votre souffle aussi longtemps que possible', phase: 'retention', isHold: true },
    
    // Phase 3: Inspiration de récupération
    { name: 'Inspiration de Récupération', duration: 15000, instruction: 'Inspirez profondément et retenez 15 secondes', phase: 'recuperation' },
    
    // Phase 4: Pause avant le prochain round
    { name: 'Pause', duration: 5000, instruction: 'Respirez normalement avant le prochain round', phase: 'pause' },
  ];

  const playFeedback = (stepName: string) => {
    switch (stepName) {
      case 'Inspiration Profonde':
      case 'Inspiration de Récupération':
        playInhale();
        mediumImpact();
        break;
      case 'Expiration Complète':
        playExhale();
        lightImpact();
        break;
      case 'Rétention':
        playHold();
        mediumImpact();
        break;
      case 'Pause':
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
        setHoldTime(0);
      }
      
      // Animation différente selon l'étape
      let toValue = 0;
      if (currentStepObj.name === 'Inspiration Profonde' || currentStepObj.name === 'Inspiration de Récupération') {
        toValue = 1; // Expansion maximale
      } else if (currentStepObj.name === 'Expiration Complète' || currentStepObj.name === 'Rétention') {
        toValue = 0; // Contraction maximale
      } else {
        toValue = 0.5; // Position neutre pour la pause
      }
      
      // Durée adaptative pour la phase d'hyperventilation
      let animationDuration = currentStepObj.duration;
      if (currentStepObj.phase === 'hyperventilation') {
        // Si nous sommes dans les 30 cycles d'hyperventilation
        if (currentCycle <= 30) {
          animationDuration = currentStepObj.duration;
        }
      }
      
      Animated.timing(animatedValue, {
        toValue,
        duration: animationDuration,
        useNativeDriver: true,
      }).start();

      // Logique pour passer à l'étape suivante
      cycleTimerRef.current = setTimeout(() => {
        // Gestion spéciale pour la phase d'hyperventilation (30 cycles)
        if (currentStepObj.phase === 'hyperventilation') {
          if (currentStep === 1) { // Fin d'un cycle d'hyperventilation
            if (currentCycle < 30) {
              // Continuer l'hyperventilation
              setCurrentCycle(prev => prev + 1);
              setCurrentStep(0); // Retour à l'inspiration
            } else {
              // Passer à la phase de rétention après 30 cycles
              setCurrentStep(2);
              setCurrentCycle(1); // Réinitialiser le compteur de cycles
            }
          } else {
            // Passer à l'expiration dans le cycle d'hyperventilation
            setCurrentStep(1);
          }
        } else if (currentStepObj.phase === 'pause') {
          // Fin d'un round complet, commencer un nouveau round
          if (currentRound < 3) { // Limiter à 3 rounds
            setCurrentRound(prev => prev + 1);
            setCurrentStep(0); // Retour à l'hyperventilation
          } else {
            // Fin de la session complète
            handleComplete();
          }
        } else {
          // Progression normale pour les autres phases
          setCurrentStep(currentStep + 1);
        }
      }, animationDuration);
    } else if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
    }

    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [currentStep, currentCycle, isActive]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCurrentCycle(1);
    setCurrentRound(1);
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
      console.log('Session Respiration Tummo interrompue après', sessionDuration, 'secondes'); // Debug
      
      // N'enregistrer que si la session a duré au moins 10 secondes
      if (sessionDuration >= 10) {
        try {
          await addSession({
            techniqueId: 'respiration-tummo',
            techniqueName: 'Respiration Tummo',
            duration: sessionDuration,
            date: new Date().toISOString(),
            completed: false
          });
          console.log('Session Respiration Tummo interrompue enregistrée avec succès'); // Debug
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement de la session interrompue:', error);
        }
      }
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    setCurrentStep(0);
    setCurrentCycle(1);
    setCurrentRound(1);
    animatedValue.setValue(0);
    setHoldTime(0);
    
    playComplete();
    successNotification();
    Alert.alert(
      "Session terminée",
      `Vous avez complété ${currentRound} rounds de respiration Tummo.`,
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

  // Couleur qui change en fonction de l'intensité (plus rouge pendant la rétention)
  const getCircleColor = () => {
    const currentStepObj = steps[currentStep];
    if (currentStepObj.phase === 'retention') {
      return '#e74c3c'; // Rouge pour la rétention
    } else if (currentStepObj.phase === 'hyperventilation') {
      return '#3498db'; // Bleu pour l'hyperventilation
    }
    return theme.primary; // Couleur par défaut
  };

  // Obtenir le texte de phase actuelle
  const getPhaseText = () => {
    const currentStepObj = steps[currentStep];
    switch (currentStepObj.phase) {
      case 'hyperventilation':
        return `Hyperventilation (${currentCycle}/30)`;
      case 'retention':
        return 'Rétention';
      case 'recuperation':
        return 'Récupération';
      case 'pause':
        return 'Pause';
      default:
        return '';
    }
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
            <Text style={[styles.roundText, { color: theme.textSecondary }]}>Round: {currentRound}/3</Text>
            <Text style={[styles.phaseText, { color: isActive ? getCircleColor() : theme.textSecondary }]}>
              {isActive ? getPhaseText() : 'Prêt à commencer'}
            </Text>
            {steps[currentStep].isHold && isActive && (
              <Text style={[styles.holdText, { color: '#e74c3c' }]}>
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
                  stroke={isActive ? getCircleColor() : theme.primary}
                  strokeWidth="2"
                  fill={theme.surfaceLight}
                />
              </Svg>
              <View style={styles.circleContent}>
                <Text style={[styles.stepName, { color: isActive ? getCircleColor() : theme.primary }]}>
                  {steps[currentStep].name}
                </Text>
                <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                  {steps[currentStep].instruction}
                </Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.instructionContainer}>
            <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>Respiration Tummo</Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              La respiration Tummo, inspirée des pratiques tibétaines et popularisée par Wim Hof, est une technique puissante qui combine hyperventilation contrôlée et rétention du souffle.
            </Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              Cette technique se pratique en 3 rounds, chacun composé de:
            </Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              1. 30 respirations profondes et rapides (hyperventilation contrôlée).
            </Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              2. Expiration complète suivie d'une rétention du souffle aussi longtemps que confortable.
            </Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              3. Inspiration profonde et rétention pendant 15 secondes.
            </Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              4. Pause avant de commencer le round suivant.
            </Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              Bénéfices: Augmente l'énergie, renforce le système immunitaire, améliore la résistance au froid, réduit l'inflammation.
            </Text>
            <Text style={[styles.warningText, { color: theme.error }]}>
              AVERTISSEMENT: Cette technique est avancée et peut provoquer des étourdissements. Ne pas pratiquer en conduisant, debout, dans l'eau ou si vous avez des problèmes cardiaques ou respiratoires. Consultez un médecin avant de commencer.
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
  roundText: {
    fontSize: 18,
    marginTop: 5,
  },
  phaseText: {
    fontSize: 20,
    fontWeight: 'bold',
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
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    lineHeight: 20,
    fontWeight: 'bold',
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

export default RespirationTummoScreen;
