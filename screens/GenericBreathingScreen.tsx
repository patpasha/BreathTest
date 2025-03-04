import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useSettings } from '../contexts/SettingsContext';
import DurationSelector from '../components/DurationSelector';
import { useStats } from '../contexts/StatsContext';
import useSound from '../hooks/useSound';
import useHaptics from '../hooks/useHaptics';
import { useTheme } from '../theme/ThemeContext';
import { BreathingScreenProps } from '../App';
import { getBreathingTechniqueById, BreathingTechnique, BreathingStep, getDefaultStepsForTechnique } from '../services/DatabaseService';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;

const GenericBreathingScreen = ({ route, navigation }: BreathingScreenProps) => {
  const { settings } = useSettings();
  const { addSession } = useStats();
  const { playInhale, playExhale, playHold, playComplete } = useSound(settings.soundEnabled);
  const { lightImpact, mediumImpact, successNotification } = useHaptics(settings.hapticsEnabled);
  const theme = useTheme();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const defaultDuration = settings.sessionDuration || 5; // Valeur par défaut de 5 minutes
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(defaultDuration);
  const [duration, setDuration] = useState(defaultDuration * 60);
  const [timeRemaining, setTimeRemaining] = useState(defaultDuration * 60);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [currentAnimValue, setCurrentAnimValue] = useState(0);
  const [technique, setTechnique] = useState<BreathingTechnique | null>(null);
  const [loading, setLoading] = useState(true);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Récupérer l'ID de la technique depuis les paramètres de route
  const techniqueId = route.params?.techniqueId;

  // Charger les données de la technique
  useEffect(() => {
    const loadTechnique = async () => {
      try {
        if (!techniqueId) {
          console.error('Aucun ID de technique fourni');
          navigation.goBack();
          return;
        }

        const loadedTechnique = await getBreathingTechniqueById(techniqueId);
        if (!loadedTechnique) {
          console.error(`Technique ${techniqueId} non trouvée`);
          navigation.goBack();
          return;
        }

        // Débogage pour la technique problématique
        if (techniqueId === 'physiological-sigh') {
          console.log('Données de la technique physiological-sigh:', JSON.stringify(loadedTechnique, null, 2));
        }
        
        // Vérifier si la technique a des étapes configurées
        if (!loadedTechnique.steps || loadedTechnique.steps.length === 0) {
          console.error(`Technique ${techniqueId} n'a pas d'étapes configurées`);
          
          // Ajouter des étapes par défaut selon la technique
          const defaultSteps = getDefaultStepsForTechnique(techniqueId);
          
          if (defaultSteps) {
            loadedTechnique.steps = defaultSteps;
            console.log(`Étapes par défaut ajoutées pour ${techniqueId}`);
          } else {
            console.error(`Aucune étape par défaut disponible pour ${techniqueId}`);
            navigation.goBack();
            return;
          }
        }

        setTechnique(loadedTechnique as BreathingTechnique);
        
        // Mettre à jour le titre de l'écran
        navigation.setOptions({ title: loadedTechnique.title });
        
        // Définir la durée par défaut
        if (loadedTechnique.defaultDurationMinutes) {
          setSessionDurationMinutes(loadedTechnique.defaultDurationMinutes);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement de la technique:', error);
        navigation.goBack();
      }
    };

    loadTechnique();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [techniqueId, navigation]);

  useEffect(() => {
    // Mise à jour de la durée lorsque sessionDurationMinutes change
    // Vérification que sessionDurationMinutes est un nombre valide
    if (!isNaN(sessionDurationMinutes) && sessionDurationMinutes > 0) {
      const newDuration = sessionDurationMinutes * 60;
      setDuration(newDuration);
      if (!isActive) {
        setTimeRemaining(newDuration);
      }
    } else {
      // Si sessionDurationMinutes est invalide, utiliser la valeur par défaut
      const defaultSeconds = 5 * 60; // 5 minutes par défaut
      setDuration(defaultSeconds);
      if (!isActive) {
        setTimeRemaining(defaultSeconds);
      }
    }
  }, [sessionDurationMinutes, isActive]);
  
  const handleDurationChange = (newDuration: number) => {
    setSessionDurationMinutes(newDuration);
  };

  const playFeedback = (stepName: string) => {
    switch (stepName.toLowerCase()) {
      case 'inspiration':
      case 'inhale':
      case 'inhalation':
        playInhale();
        mediumImpact();
        break;
      case 'expiration':
      case 'exhale':
      case 'exhalation':
        playExhale();
        lightImpact();
        break;
      case 'pause':
      case 'hold':
      case 'retention':
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
    if (isActive && technique?.steps) {
      const steps = technique.steps;
      const currentStepObj = steps[currentStep];
      playFeedback(currentStepObj.name);
      
      let toValue;
      if (currentStepObj.name.toLowerCase().includes('inspiration') || 
          currentStepObj.name.toLowerCase().includes('inhale') || 
          currentStepObj.name.toLowerCase().includes('inhalation')) {
        toValue = 1; // Expansion pour l'inspiration
      } else if (currentStepObj.name.toLowerCase().includes('expiration') || 
                currentStepObj.name.toLowerCase().includes('exhale') || 
                currentStepObj.name.toLowerCase().includes('exhalation')) {
        toValue = 0; // Contraction pour l'expiration
      } else {
        toValue = currentAnimValue; // Maintien pour les pauses
      }
      
      Animated.timing(animatedValue, {
        toValue,
        duration: currentStepObj.duration,
        useNativeDriver: true,
      }).start();
      
      setCurrentAnimValue(toValue);

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
  }, [currentStep, isActive, currentAnimValue, technique]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCurrentCycle(1);
    // Vérification que duration est un nombre valide
    if (isNaN(duration) || duration <= 0) {
      // Si duration est invalide, utiliser 5 minutes par défaut
      const defaultDuration = 5 * 60;
      setTimeRemaining(defaultDuration);
    } else {
      setTimeRemaining(duration);
    }
    setCurrentAnimValue(0);
    setSessionStartTime(new Date());
  };

  const handleStop = async () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    
    // Enregistrer la session interrompue dans les statistiques
    if (sessionStartTime && technique) {
      const sessionDuration = Math.floor((duration - timeRemaining));
      console.log(`Session ${technique.title} interrompue après`, sessionDuration, 'secondes');
      
      // N'enregistrer que si la session a duré au moins 10 secondes
      if (sessionDuration >= 10) {
        try {
          await addSession({
            techniqueId: technique.id,
            techniqueName: technique.title,
            duration: sessionDuration,
            date: new Date().toISOString(),
            completed: false
          });
          console.log(`Session ${technique.title} interrompue enregistrée avec succès`);
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement de la session interrompue:', error);
        }
      }
    }
  };

  const handleComplete = async () => {
    if (!technique) return;
    
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    setCurrentAnimValue(0);
    
    playComplete();
    successNotification();
    
    // Enregistrer la session complétée dans les statistiques
    if (sessionStartTime) {
      const sessionDuration = Math.floor(duration);
      try {
        await addSession({
          techniqueId: technique.id,
          techniqueName: technique.title,
          duration: sessionDuration,
          date: new Date().toISOString(),
          completed: true
        });
        console.log(`Session ${technique.title} complétée enregistrée avec succès`);
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la session complétée:', error);
      }
    }
    
    Alert.alert(
      "Session terminée",
      `Vous avez complété ${currentCycle} cycles de ${technique.title}.`,
      [{ text: "OK" }]
    );
  };

  const formatTime = (seconds: number) => {
    // Vérification que seconds est un nombre valide
    if (isNaN(seconds) || seconds === undefined) {
      return '05:00'; // Valeur par défaut si seconds est invalide
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textPrimary, marginTop: 20 }}>Chargement de la technique...</Text>
      </View>
    );
  }

  if (!technique) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.error }}>Erreur: Impossible de charger la technique</Text>
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: theme.primary, marginTop: 20 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStepObj = technique.steps ? technique.steps[currentStep] : null;

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
                <Text style={[styles.stepName, { color: theme.primary }]}>{currentStepObj?.name || ''}</Text>
                <Text style={[styles.instruction, { color: theme.textSecondary }]}>{currentStepObj?.instruction || ''}</Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.instructionContainer}>
            <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>{technique.title}</Text>
            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
              {technique.description}
            </Text>
            
            {technique.longDescription && technique.longDescription.map((paragraph: string, index: number) => (
              <Text 
                key={index} 
                style={[
                  styles.instructionText, 
                  { 
                    color: paragraph.startsWith('⚠️ ATTENTION') ? theme.error : theme.textSecondary,
                    fontWeight: paragraph.startsWith('⚠️ ATTENTION') ? 'bold' : 'normal'
                  }
                ]}
              >
                {paragraph}
              </Text>
            ))}
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

export default GenericBreathingScreen;
