import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Alert, ScrollView, ActivityIndicator, Easing, StatusBar } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.5;

const GenericBreathingScreen = ({ route, navigation }: BreathingScreenProps) => {
  const { settings } = useSettings();
  const { addSession } = useStats();
  const { playInhale, playExhale, playHold, playComplete, soundsReady } = useSound(settings.soundEnabled);
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

  // Fonction pour déterminer le type d'étape
  const getStepType = (stepName: string): 'inhale' | 'exhale' | 'hold' => {
    if (!stepName) return 'hold'; // Valeur par défaut si le nom est vide
    
    const name = stepName.toLowerCase();
    if (name.includes('inspiration') || name.includes('inhale') || name.includes('inhalation')) {
      return 'inhale';
    } else if (name.includes('expiration') || name.includes('exhale') || name.includes('exhalation')) {
      return 'exhale';
    } else {
      return 'hold';
    }
  };

  // Ajouter un log pour vérifier l'état des sons
  useEffect(() => {
    console.log(`État des sons: activé=${settings.soundEnabled}, prêts=${soundsReady}`);
  }, [settings.soundEnabled, soundsReady]);

  const playFeedback = (stepName: string) => {
    if (!settings.hapticsEnabled && !settings.soundEnabled) {
      console.log('Retour haptique et sonore désactivés');
      return;
    }
    
    const stepType = getStepType(stepName);
    console.log(`Lecture du feedback pour l'étape: ${stepName} (type: ${stepType})`);
    
    // Obtenir la durée de l'étape actuelle
    const currentStepObj = technique?.steps?.[currentStep];
    const stepDuration = currentStepObj?.duration || 0;
    
    // Retour haptique
    if (settings.hapticsEnabled) {
      console.log('Lecture du retour haptique');
      switch (stepType) {
        case 'inhale':
          inhalePattern(stepDuration);
          break;
        case 'exhale':
          exhalePattern(stepDuration);
          break;
        case 'hold':
          holdPattern(stepDuration);
          break;
      }
    }
    
    // Retour sonore - désactivé pour éviter les erreurs
    if (settings.soundEnabled && false) { // Désactivé intentionnellement
      console.log('Lecture du retour sonore');
      switch (stepType) {
        case 'inhale':
          playInhale();
          break;
        case 'exhale':
          playExhale();
          break;
        case 'hold':
          playHold();
          break;
      }
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
      
      // Vérifier si l'étape actuelle existe
      if (!currentStepObj) {
        console.error('Étape actuelle non définie:', currentStep);
        return;
      }
      
      // Jouer le retour haptique et sonore au début de chaque étape
      playFeedback(currentStepObj.name);
      
      // Déterminer le type d'étape pour des animations adaptées
      const stepType = getStepType(currentStepObj.name);
      console.log(`Étape actuelle: ${currentStepObj.name} (${stepType}), durée: ${currentStepObj.duration}ms`);
      
      // Déterminer la valeur cible pour l'animation
      let toValue;
      if (stepType === 'inhale') {
        toValue = 1; // Expansion pour l'inspiration
      } else if (stepType === 'exhale') {
        toValue = 0; // Contraction pour l'expiration
      } else {
        // Pour les phases de rétention, maintenir la position actuelle
        // pour éviter de confondre l'utilisateur
        toValue = currentAnimValue;
        
        // Si nous venons de commencer la session, définir une valeur par défaut
        // basée sur l'étape précédente
        if (currentAnimValue === 0 || currentStep === 0) {
          const prevStep = currentStep > 0 ? steps[currentStep - 1] : steps[steps.length - 1];
          const prevStepType = getStepType(prevStep.name);
          
          if (prevStepType === 'inhale') {
            // Après une inspiration, maintenir légèrement gonflé
            toValue = 0.9;
          } else if (prevStepType === 'exhale') {
            // Après une expiration, maintenir légèrement contracté
            toValue = 0.2;
          } else {
            // Valeur neutre par défaut
            toValue = 0.5;
          }
        }
      }
      
      // Mettre à jour la valeur d'animation actuelle pour référence future
      setCurrentAnimValue(toValue);
      
      // Animation plus fluide avec une courbe d'accélération adaptée au type d'étape
      let easingFunction;
      if (stepType === 'inhale') {
        // Courbe d'accélération pour l'inspiration: démarrage lent, accélération, puis ralentissement
        easingFunction = Easing.bezier(0.2, 0.0, 0.4, 1.0);
      } else if (stepType === 'exhale') {
        // Courbe d'accélération pour l'expiration: démarrage rapide puis ralentissement progressif
        easingFunction = Easing.bezier(0.4, 0.0, 0.6, 1.0);
      } else {
        // Pour la rétention, pas d'animation de taille
        // Nous allons simplement maintenir la valeur actuelle
        
        // Passer directement à la gestion de la progression sans animer la taille
        setStepProgress(0);
        progressAnimation.setValue(0);
        
        // Utiliser une animation plus précise pour la progression
        Animated.timing(progressAnimation, {
          toValue: 1,
          duration: currentStepObj.duration,
          useNativeDriver: false,
          easing: Easing.linear,
        }).start();
        
        // Utiliser requestAnimationFrame pour une animation plus fluide
        let startTime = Date.now();
        let animationFrameId: number;
        
        const updateProgress = () => {
          const elapsedTime = Date.now() - startTime;
          const progress = Math.min(100, (elapsedTime / currentStepObj.duration) * 100);
          
          setStepProgress(progress);
          
          if (progress < 100 && isActive) {
            animationFrameId = requestAnimationFrame(updateProgress);
          }
        };
        
        // Démarrer l'animation
        animationFrameId = requestAnimationFrame(updateProgress);
        
        // Programmer le passage à l'étape suivante
        cycleTimerRef.current = setTimeout(() => {
          // Annuler l'animation frame si elle est toujours en cours
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          
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
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          if (cycleTimerRef.current) {
            clearTimeout(cycleTimerRef.current);
          }
        };
      }
      
      // Animation adaptée au type de respiration (seulement pour inhale et exhale)
      Animated.timing(animatedValue, {
        toValue,
        duration: currentStepObj.duration * 0.95, // Légèrement plus court pour éviter les saccades
        useNativeDriver: true,
        easing: easingFunction,
      }).start();
      
      // Utiliser requestAnimationFrame pour une animation plus fluide de la progression
      let startTime = Date.now();
      let animationFrameId: number;
      
      const updateProgress = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(100, (elapsedTime / currentStepObj.duration) * 100);
        
        setStepProgress(progress);
        
        if (progress < 100 && isActive) {
          animationFrameId = requestAnimationFrame(updateProgress);
        }
      };
      
      // Démarrer l'animation de progression
      animationFrameId = requestAnimationFrame(updateProgress);
      
      // Programmer le passage à l'étape suivante
      cycleTimerRef.current = setTimeout(() => {
        // Annuler l'animation frame si elle est toujours en cours
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        
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
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
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

  // Ajouter un composant pour afficher les étapes de la technique
  const TechniqueSteps = ({ steps, currentStep }: { steps: BreathingStep[], currentStep: number }) => {
    const theme = useTheme();
    
    return (
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const stepType = getStepType(step.name);
          let stepColor;
          let stepIcon;
          
          switch (stepType) {
            case 'inhale':
              stepColor = theme.primary;
              stepIcon = 'arrow-down-outline';
              break;
            case 'exhale':
              stepColor = theme.secondary || '#4CAF50';
              stepIcon = 'arrow-up-outline';
              break;
            default:
              stepColor = theme.accent || '#FFC107';
              stepIcon = 'pause-outline';
          }
          
          return (
            <View 
              key={index} 
              style={[
                styles.stepIndicator,
                {
                  backgroundColor: isActive ? stepColor : theme.surfaceLight,
                  borderColor: stepColor,
                  borderWidth: isActive ? 0 : 1,
                }
              ]}
            >
              <Text 
                style={[
                  styles.stepNumber, 
                  { 
                    color: isActive ? '#FFFFFF' : stepColor,
                    fontWeight: isActive ? 'bold' : 'normal',
                  }
                ]}
              >
                {index + 1}
              </Text>
            </View>
          );
        })}
      </View>
    );
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
            Chargement de la technique...
          </Text>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={[theme.primaryLight, theme.background]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.timerText, { color: theme.textPrimary }]}>{formatTime(timeRemaining)}</Text>
              <View style={[styles.cyclesBadge, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.cyclesText, { color: theme.primary }]}>Cycle {currentCycle}</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Indicateur d'étapes */}
            {isActive && technique?.steps && (
              <TechniqueSteps 
                steps={technique.steps} 
                currentStep={currentStep} 
              />
            )}
            
            {/* Conteneur pour la bulle de respiration avec plus d'espace */}
            <View style={styles.breathingSection}>
              <View style={styles.circleContainer}>
                <BreathingBubble 
                  isActive={isActive}
                  currentStep={technique?.steps?.[currentStep]?.name || ''}
                  progress={stepProgress}
                  size={CIRCLE_SIZE * 0.9}
                  instruction={technique?.steps?.[currentStep]?.instruction || ''}
                />
              </View>
            </View>

            {/* Section pour le bouton de guide avec plus d'espace */}
            {isActive && (
              <View style={styles.guideSection}>
                <TouchableOpacity 
                  style={[
                    styles.guideButton, 
                    { 
                      backgroundColor: showGuide ? theme.primaryLight : 'transparent',
                      borderColor: theme.border
                    }
                  ]} 
                  onPress={() => setShowGuide(!showGuide)}
                >
                  <Text style={{ 
                    color: showGuide ? theme.primary : theme.textSecondary,
                    fontWeight: showGuide ? '600' : '400'
                  }}>
                    {showGuide ? "Masquer le guide" : "Afficher le guide"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Guide de la technique - affiché uniquement si showGuide est true */}
            {(!isActive || showGuide) && (
              <View style={[
                styles.techniqueDescriptionContainer, 
                { 
                  backgroundColor: theme.cardBackground,
                  shadowColor: theme.shadowColor,
                  shadowOpacity: 0.1,
                  shadowRadius: 15,
                  shadowOffset: { width: 0, height: 5 },
                  elevation: 5,
                }
              ]}>
                <Text style={[styles.instructionTitle, { color: theme.textPrimary }]}>{technique.title}</Text>
                <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                  {technique.description}
                </Text>
                
                {technique.longDescription && technique.longDescription.map((paragraph: string, index: number) => {
                  // Détection des titres, des étapes numérotées et des avertissements
                  const isTitle = paragraph.includes('Comment pratiquer :') || 
                                 paragraph.includes('Effets :') || 
                                 paragraph.includes('Idéal pour :');
                  const isNumberedStep = /^\d+\./.test(paragraph);
                  const isWarning = paragraph.includes('⚠️ ATTENTION');
                  
                  return (
                    <Text 
                      key={index} 
                      style={[
                        styles.instructionText, 
                        { 
                          color: isWarning ? theme.error : 
                                 isTitle ? theme.primary : 
                                 theme.textSecondary,
                          fontWeight: isWarning || isTitle ? 'bold' : 
                                     isNumberedStep ? '500' : 'normal',
                          marginTop: isTitle ? 15 : 5,
                          marginBottom: isTitle ? 10 : 5,
                          textAlign: 'left',
                          paddingLeft: isNumberedStep ? 10 : 0,
                        }
                      ]}
                    >
                      {paragraph}
                    </Text>
                  );
                })}
                
                {/* Afficher les étapes de la technique */}
                {!isActive && technique.steps && technique.steps.length > 0 && (
                  <View style={styles.stepsPreviewContainer}>
                    <Text style={[styles.stepsPreviewTitle, { color: theme.primary }]}>
                      Étapes de la technique
                    </Text>
                    
                    {technique.steps.map((step, index) => {
                      const stepType = getStepType(step.name);
                      let stepColor;
                      let stepIcon;
                      
                      switch (stepType) {
                        case 'inhale':
                          stepColor = theme.primary;
                          stepIcon = 'arrow-down-outline';
                          break;
                        case 'exhale':
                          stepColor = theme.secondary || '#4CAF50';
                          stepIcon = 'arrow-up-outline';
                          break;
                        default:
                          stepColor = theme.accent || '#FFC107';
                          stepIcon = 'pause-outline';
                      }
                      
                      // Calculer la durée en secondes
                      const durationInSeconds = step.duration / 1000;
                      
                      return (
                        <View 
                          key={index} 
                          style={[
                            styles.stepPreviewItem,
                            { borderLeftColor: stepColor }
                          ]}
                        >
                          <View style={styles.stepPreviewHeader}>
                            <View style={styles.stepPreviewIconContainer}>
                              <Ionicons name={stepIcon as any} size={16} color={stepColor} />
                            </View>
                            <Text style={[styles.stepPreviewName, { color: theme.textPrimary }]}>
                              {step.name}
                            </Text>
                            <Text style={[styles.stepPreviewDuration, { color: theme.textTertiary }]}>
                              {durationInSeconds}s
                            </Text>
                          </View>
                          
                          {step.instruction && (
                            <Text style={[styles.stepPreviewInstruction, { color: theme.textSecondary }]}>
                              {step.instruction}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Sélecteur de durée - affiché uniquement si la session n'est pas active */}
            {!isActive && (
              <View style={styles.durationSelectorContainer}>
                <Text style={[styles.durationTitle, { color: theme.textPrimary }]}>
                  Durée de la session
                </Text>
                <DurationSelector 
                  duration={sessionDurationMinutes} 
                  onDurationChange={handleDurationChange}
                  minDuration={1}
                  maxDuration={30}
                  step={1}
                />
              </View>
            )}
            
            {/* Espace en bas pour éviter que le contenu ne soit caché par le bouton fixe */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
          
          {/* Bouton fixe en bas de l'écran */}
          <View style={[
            styles.fixedButtonContainer, 
            { 
              backgroundColor: theme.background,
              shadowColor: theme.shadowColor,
              shadowOpacity: 0.1,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: -5 },
              elevation: 10,
            }
          ]}>
            {!isActive ? (
              <TouchableOpacity 
                style={[
                  styles.startButton, 
                  { 
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: 5,
                  }
                ]} 
                onPress={handleStart}
              >
                <Text style={styles.buttonText}>Commencer</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.stopButton, 
                  { 
                    backgroundColor: theme.error,
                    shadowColor: theme.error,
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: 5,
                  }
                ]} 
                onPress={handleStop}
              >
                <Text style={styles.buttonText}>Arrêter</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
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
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 15,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerText: {
    fontSize: 52,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cyclesBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cyclesText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Augmenter l'espace pour le bouton fixe
  },
  breathingSection: {
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 10,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  guideSection: {
    marginBottom: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  guideButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'left',
  },
  durationSelectorContainer: {
    marginVertical: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  durationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  techniqueDescriptionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  stepNumber: {
    fontSize: 14,
  },
  stepsPreviewContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  stepsPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepPreviewItem: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 3,
  },
  stepPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepPreviewIconContainer: {
    marginRight: 8,
  },
  stepPreviewName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  stepPreviewDuration: {
    fontSize: 14,
  },
  stepPreviewInstruction: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingLeft: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 25, // Ajouter du padding en bas pour les appareils avec une barre de navigation
  },
  bottomSpacer: {
    height: 80, // Espace pour éviter que le contenu ne soit caché par le bouton fixe
  },
});

export default GenericBreathingScreen;
