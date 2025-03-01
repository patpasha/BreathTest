import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useSettings } from '../contexts/SettingsContext';
import DurationSelector from '../components/DurationSelector';
import { useStats } from '../contexts/StatsContext';
import useSound from '../hooks/useSound';
import useHaptics from '../hooks/useHaptics';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;
const BOX_SIZE = width * 0.4;

const RespirationBoxScreen = () => {
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
  const [currentAnimValue, setCurrentAnimValue] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null); 
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const boxPositionX = useRef(new Animated.Value(0)).current;
  const boxPositionY = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDuration(sessionDurationMinutes * 60);
    if (!isActive) {
      setTimeRemaining(sessionDurationMinutes * 60);
    }
  }, [sessionDurationMinutes, isActive]);
  
  const handleDurationChange = (newDuration: number) => {
    setSessionDurationMinutes(newDuration);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, []);
  


  // Les étapes de la respiration Box (Carré)
  const steps = [
    { name: 'Inspiration', duration: 4000, instruction: 'Inspirez lentement par le nez' },
    { name: 'Rétention Haute', duration: 4000, instruction: 'Retenez votre souffle, poumons pleins' },
    { name: 'Expiration', duration: 4000, instruction: 'Expirez lentement par la bouche' },
    { name: 'Rétention Basse', duration: 4000, instruction: 'Retenez votre souffle, poumons vides' },
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
      case 'Rétention Haute':
      case 'Rétention Basse':
        playHold();
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
      
      // Animation du cercle qui se dilate et se contracte
      let toValue;
      if (currentStep === 0) {
        toValue = 1; // Inspiration
      } else if (currentStep === 2) {
        toValue = 0; // Expiration
      } else {
        toValue = currentAnimValue; // Maintenir la valeur actuelle pendant les pauses
      }
      
      Animated.timing(animatedValue, {
        toValue,
        duration: currentStepObj.duration,
        useNativeDriver: true,
      }).start();
      
      // Mettre à jour la valeur actuelle de l'animation pour la prochaine étape
      setCurrentAnimValue(toValue);

      // Animation du point qui se déplace le long du carré
      let toX = 0;
      let toY = 0;

      switch (currentStep) {
        case 0: // Inspiration (bas → haut)
          toX = 0;
          toY = -1;
          break;
        case 1: // Rétention haute (gauche → droite)
          toX = 1;
          toY = -1;
          break;
        case 2: // Expiration (haut → bas)
          toX = 1;
          toY = 0;
          break;
        case 3: // Rétention basse (droite → gauche)
          toX = 0;
          toY = 0;
          break;
      }

      Animated.timing(boxPositionX, {
        toValue: toX,
        duration: currentStepObj.duration,
        useNativeDriver: true,
      }).start();

      Animated.timing(boxPositionY, {
        toValue: toY,
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
  }, [currentStep, isActive, currentAnimValue]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCurrentCycle(1);
    setTimeRemaining(duration);
    setCurrentAnimValue(0);
    boxPositionX.setValue(0);
    boxPositionY.setValue(0);
    setSessionStartTime(new Date());
  };

  const handleStop = async () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    setCurrentAnimValue(0);
    boxPositionX.setValue(0);
    boxPositionY.setValue(0);
    
    // Enregistrer la session interrompue dans les statistiques
    if (sessionStartTime) {
      const sessionDuration = Math.floor((duration - timeRemaining));
      console.log('Session Box interrompue après', sessionDuration, 'secondes'); // Debug
      
      // N'enregistrer que si la session a duré au moins 10 secondes
      if (sessionDuration >= 10) {
        try {
          await addSession({
            techniqueId: 'respiration-box',
            techniqueName: 'Respiration Box (Carré)',
            duration: sessionDuration,
            date: new Date().toISOString(),
            completed: false
          });
          console.log('Session Box interrompue enregistrée avec succès'); // Debug
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
    setCurrentAnimValue(0);
    boxPositionX.setValue(0);
    boxPositionY.setValue(0);
    
    playComplete();
    successNotification();
    
    // Enregistrer la session dans les statistiques
    if (sessionStartTime) {
      const sessionDuration = Math.floor((duration - timeRemaining));
      console.log('Session Box complétée après', sessionDuration, 'secondes'); // Debug
      
      const sessionData = {
        techniqueId: 'respiration-box',
        techniqueName: 'Respiration Box (Carré)',
        duration: sessionDuration,
        date: new Date().toISOString(),
        completed: true
      };
      
      console.log('Données de session à enregistrer:', JSON.stringify(sessionData));
      
      try {
        await addSession(sessionData);
        console.log('Session Box complète enregistrée avec succès'); // Debug
        
        // Vérifier que la session a bien été enregistrée
        setTimeout(() => {
          console.log('Vérification de l\'enregistrement de la session...');
        }, 500);
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la session complète:', error);
      }
    }
    
    Alert.alert(
      "Session terminée",
      `Vous avez complété ${currentCycle} cycles de respiration Box (Carré).`,
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

  const translateX = boxPositionX.interpolate({
    inputRange: [0, 1],
    outputRange: [-BOX_SIZE/2 + 10, BOX_SIZE/2 - 10],
  });

  const translateY = boxPositionY.interpolate({
    inputRange: [-1, 0],
    outputRange: [-BOX_SIZE/2 + 10, BOX_SIZE/2 - 10],
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
              
              {/* Carré de respiration */}
              <Rect
                x={(CIRCLE_SIZE - BOX_SIZE) / 2}
                y={(CIRCLE_SIZE - BOX_SIZE) / 2}
                width={BOX_SIZE}
                height={BOX_SIZE}
                stroke={theme.primary}
                strokeWidth="1"
                strokeDasharray="5,5"
                fill="none"
              />
            </Svg>
            
            {/* Point qui se déplace le long du carré */}
            <Animated.View 
              style={[
                styles.boxDot, 
                { 
                  backgroundColor: theme.primary,
                  transform: [
                    { translateX },
                    { translateY }
                  ] 
                }
              ]} 
            />
            
            <View style={styles.circleContent}>
              <Text style={[styles.stepName, { color: theme.primary }]}>{steps[currentStep].name}</Text>
              <Text style={[styles.instruction, { color: theme.textSecondary }]}>{steps[currentStep].instruction}</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>Respiration Box (Carré)</Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            La respiration Box, également connue sous le nom de respiration carrée, est une technique simple mais puissante qui aide à réguler le système nerveux et à calmer l'esprit.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            1. Inspirez lentement et profondément par le nez pendant 4 secondes.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            2. Retenez votre souffle pendant 4 secondes, poumons pleins.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            3. Expirez lentement par la bouche pendant 4 secondes.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            4. Retenez votre souffle pendant 4 secondes, poumons vides.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            5. Répétez ce cycle.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            Bénéfices: Réduit l'anxiété, favorise la concentration, équilibre le système nerveux, améliore la gestion du stress.
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
  boxDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 10,
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

export default RespirationBoxScreen;
