import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Alert, ScrollView, ActivityIndicator, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSettings } from '../contexts/SettingsContext';
import DurationSelector from '../components/DurationSelector';
import { useStats } from '../contexts/StatsContext';
import useSound from '../hooks/useSound';
import useHaptics from '../hooks/useHaptics';
import { useTheme } from '../theme/ThemeContext';
import { BreathingScreenProps } from '../App';
import { getBreathingTechniqueById, BreathingTechnique, BreathingStep, getDefaultStepsForTechnique } from '../services/DatabaseService';
import BreathingBubble from '../components/BreathingBubble';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;

const GenericBreathingScreen = ({ route, navigation }: BreathingScreenProps) => {
  const { settings } = useSettings();
  const { addSession } = useStats();
  const { playInhale, playExhale, playHold, playComplete } = useSound(settings.soundEnabled);
  const { lightImpact, mediumImpact, successNotification, inhalePattern, exhalePattern, holdPattern } = useHaptics(settings.hapticsEnabled);
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
  const [stepProgress, setStepProgress] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;

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
        inhalePattern();
        break;
      case 'expiration':
      case 'exhale':
      case 'exhalation':
        playExhale();
        exhalePattern();
        break;
      case 'pause':
      case 'hold':
      case 'retention':
        playHold();
        holdPattern();
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
      
      // Jouer le retour haptique et sonore au début de chaque étape
      playFeedback(currentStepObj.name);
      
      // Déterminer la valeur cible pour l'animation
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
      
      // Animation plus fluide avec easeInOut et une durée légèrement plus longue
      Animated.timing(animatedValue, {
        toValue,
        duration: currentStepObj.duration * 0.95, // Légèrement plus court pour éviter les saccades entre les transitions
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Courbe d'accélération plus douce
      }).start();
      
      // Réinitialiser la progression et démarrer l'animation
      setStepProgress(0);
      progressAnimation.setValue(0);
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: currentStepObj.duration,
        useNativeDriver: false,
        easing: Easing.linear, // Progression linéaire pour le cercle de progression
      }).start();
      
      setCurrentAnimValue(toValue);

      // Mettre à jour la progression toutes les 16ms (environ 60fps) pour une animation plus fluide
      const progressInterval = setInterval(() => {
        setStepProgress(prev => {
          const newProgress = prev + (100 / (currentStepObj.duration / 16));
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 16);

      // Programmer le passage à l'étape suivante
      cycleTimerRef.current = setTimeout(() => {
        clearInterval(progressInterval);
        
        // Passer à l'étape suivante
        const nextStep = (currentStep + 1) % steps.length;
        setCurrentStep(nextStep);
        
        // Incrémenter le compteur de cycles si on revient à la première étape
        if (nextStep === 0) {
          setCurrentCycle(prev => prev + 1);
        }
      }, currentStepObj.duration);

      // Nettoyer les timers lors du démontage ou du changement d'étape
      return () => {
        clearInterval(progressInterval);
        if (cycleTimerRef.current) {
          clearTimeout(cycleTimerRef.current);
        }
      };
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

  // Interpolation pour l'opacité des instructions selon l'étape
  const inhaleOpacity = animatedValue.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.3, 1, 1],
  });

  const exhaleOpacity = animatedValue.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0.3],
  });

  const holdOpacity = animatedValue.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [0.3, 1, 1, 0.3],
  });

  // Fonction pour déterminer la couleur de l'étape actuelle
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
            {/* Utilisation du composant BreathingBubble pour une animation plus fluide */}
            <BreathingBubble 
              isActive={isActive}
              currentStep={currentStepObj?.name || ''}
              progress={stepProgress}
              size={CIRCLE_SIZE * 0.8}
            />
            
            {/* Instructions séparées de la bulle pour éviter la superposition */}
            <View style={styles.instructionContainer}>
              <Text style={[styles.stepName, { color: currentStepObj ? getStepColor(currentStepObj.name) : theme.primary }]}>
                {currentStepObj?.name || ''}
              </Text>
              <Text style={[styles.instruction, { color: theme.textSecondary }]}>{currentStepObj?.instruction || ''}</Text>
            </View>
          </View>

          {/* Bouton pour activer/désactiver le guide */}
          {isActive && (
            <TouchableOpacity 
              style={[styles.guideButton, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]} 
              onPress={() => setShowGuide(!showGuide)}
            >
              <Text style={{ color: theme.textSecondary }}>
                {showGuide ? "Masquer le guide" : "Afficher le guide"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Guide de la technique - affiché uniquement si showGuide est true */}
          {(!isActive || showGuide) && (
            <View style={styles.techniqueDescriptionContainer}>
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
          )}

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
    paddingHorizontal: 16, // Marge horizontale uniforme
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
    position: 'relative',
  },
  instructionContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    width: '100%',
    alignItems: 'center',
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
  guideButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 5,
    marginBottom: 15,
    borderWidth: 1,
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
    textAlign: 'justify',
  },
  durationSelectorContainer: {
    marginVertical: 15,
    width: '100%',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
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
  techniqueDescriptionContainer: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
});

export default GenericBreathingScreen;
