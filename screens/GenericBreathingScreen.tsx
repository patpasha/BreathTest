import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Alert, ScrollView, ActivityIndicator, Easing, StatusBar, Platform } from 'react-native';
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

  // Ajout d'un état pour l'animation de transition
  const [isStarting, setIsStarting] = useState(false);
  const startTransitionAnim = useRef(new Animated.Value(0)).current;

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
    
    // Détection plus précise pour l'inspiration
    if (
      name.includes('inspiration') || 
      name.includes('inhale') || 
      name.includes('inhalation') || 
      name.includes('inspir') ||
      name.startsWith('première') ||  // Pour le soupir physiologique
      name.startsWith('seconde') ||   // Pour le soupir physiologique
      name.includes('respirations profondes') ||
      name.includes('respirations rapides')
    ) {
      return 'inhale';
    } 
    // Détection plus précise pour l'expiration
    else if (
      name.includes('expiration') || 
      name.includes('exhale') || 
      name.includes('exhalation') || 
      name.includes('expir') ||
      name.includes('souffl')
    ) {
      return 'exhale';
    } 
    // Détection plus précise pour la rétention
    else if (
      name.includes('hold') || 
      name.includes('retention') || 
      name.includes('rétention') || 
      name.includes('pause') || 
      name.includes('attente') ||
      name.includes('repos')
    ) {
      return 'hold';
    }
    // Cas spécial pour la répétition dans la méthode Wim Hof
    else if (name.includes('repeat')) {
      return 'hold';
    }
    // Par défaut, considérer comme une rétention
    else {
      console.log(`Type d'étape non reconnu: "${stepName}", considéré comme 'hold'`);
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
            // Ne pas appeler handleComplete ici, car cela provoque une erreur
            // "Cannot update a component while rendering a different component"
            // À la place, on retourne 0 et on gère la fin de la session dans un autre useEffect
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  // Effet séparé pour gérer la fin de la session
  useEffect(() => {
    if (isActive && timeRemaining === 0) {
      // La session est terminée, appeler handleComplete
      handleComplete();
    }
  }, [isActive, timeRemaining]); // Dépendances explicites

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
      
      // Durée de l'étape actuelle en millisecondes
      const stepDuration = currentStepObj.duration;
      
      // Configurer le timer pour passer à l'étape suivante
      cycleTimerRef.current = setTimeout(() => {
        // Passer à l'étape suivante ou revenir à la première étape si on est à la dernière
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setCurrentStep(0);
          setCurrentCycle(prev => prev + 1);
        }
      }, stepDuration);
    }
    
    // Nettoyer le timer lors du démontage ou du changement d'étape
    return () => {
      if (cycleTimerRef.current) {
        clearTimeout(cycleTimerRef.current);
      }
    };
  }, [isActive, currentStep, technique]); // Dépendances explicites, sans handleComplete

  const handleStart = () => {
    // Démarrer l'animation de transition
    setIsStarting(true);
    
    // Animation de transition fluide - durée augmentée
    Animated.timing(startTransitionAnim, {
      toValue: 1,
      duration: 1500, // Augmenté de 800ms à 1500ms
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(({ finished }) => {
      if (finished) {
        // Démarrer la session une fois l'animation terminée
        startSession();
        
        // Réinitialiser l'animation pour la prochaine fois
        setTimeout(() => {
          setIsStarting(false);
          startTransitionAnim.setValue(0);
        }, 100);
      }
    });
    
    // Vibration légère pour indiquer le début de la transition
    if (settings.hapticsEnabled) {
      lightImpact();
    }
  };
  
  // Fonction pour démarrer la session après le compte à rebours
  const startSession = () => {
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
    
    // Vibration moyenne pour indiquer le début de la session
    if (settings.hapticsEnabled) {
      mediumImpact();
    }
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
          
          // Calculer la durée en secondes pour l'affichage
          const durationInSeconds = Math.round(step.duration / 1000);
          
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
                {durationInSeconds}s
              </Text>
              
              {isActive && (
                <View style={styles.activeStepIndicator}>
                  <Ionicons name={stepIcon as any} size={12} color="#FFFFFF" />
                </View>
              )}
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
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['left', 'right', 'bottom']} // Ne pas appliquer la safe area en haut
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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

          {/* Sélecteur de durée - affiché uniquement si la session n'est pas active */}
          {!isActive && (
            <View style={styles.durationSelectorWrapper}>
              <View style={[
                styles.durationSelectorCard, 
                { 
                  backgroundColor: theme.surfaceLight,
                  borderColor: theme.border,
                }
              ]}>
                <TouchableOpacity 
                  style={[styles.durationButton, { opacity: sessionDurationMinutes <= 1 ? 0.3 : 1 }]}
                  onPress={() => {
                    if (sessionDurationMinutes > 1) {
                      handleDurationChange(sessionDurationMinutes - 1);
                    }
                  }}
                  disabled={sessionDurationMinutes <= 1}
                >
                  <Ionicons name="remove" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
                
                <View style={styles.durationDisplay}>
                  <Text style={[styles.durationValue, { color: theme.primary }]}>
                    {sessionDurationMinutes}
                  </Text>
                  <Text style={[styles.durationUnit, { color: theme.textSecondary }]}>
                    min
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.durationButton, { opacity: sessionDurationMinutes >= 30 ? 0.3 : 1 }]}
                  onPress={() => {
                    if (sessionDurationMinutes < 30) {
                      handleDurationChange(sessionDurationMinutes + 1);
                    }
                  }}
                  disabled={sessionDurationMinutes >= 30}
                >
                  <Ionicons name="add" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.durationLabel, { color: theme.textTertiary }]}>
                Durée de la session
              </Text>
            </View>
          )}

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
              <View style={[
                styles.circleContainer,
                { 
                  backgroundColor: 'transparent',
                  marginVertical: 15,
                }
              ]}>
                <BreathingBubble 
                  isActive={isActive}
                  currentStep={technique?.steps?.[currentStep]?.name || ''}
                  progress={stepProgress}
                  size={CIRCLE_SIZE * 0.85} // Légèrement réduit pour éviter les débordements
                  instruction={technique?.steps?.[currentStep]?.instruction || ''}
                  stepDuration={technique?.steps?.[currentStep]?.duration}
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
            
            {/* Espace en bas pour éviter que le contenu ne soit caché par le bouton fixe */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
          
          {/* Animation de transition au démarrage */}
          {isStarting && (
            <Animated.View 
              style={[
                styles.startTransitionOverlay,
                {
                  opacity: startTransitionAnim.interpolate({
                    inputRange: [0, 0.3, 0.8, 1],  // Ajusté pour une transition plus lente
                    outputRange: [0, 0.8, 0.8, 0], // Opacité plus élevée et maintenue plus longtemps
                  }),
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.startTransitionCircle,
                  {
                    backgroundColor: theme.primary,
                    transform: [
                      { 
                        scale: startTransitionAnim.interpolate({
                          inputRange: [0, 0.3, 0.8, 1],  // Ajusté pour une transition plus lente
                          outputRange: [0.3, 1.5, 1.8, 2], // Expansion plus progressive
                        }) 
                      }
                    ],
                  }
                ]}
              />
              
              <Animated.Text 
                style={[
                  styles.startTransitionText,
                  {
                    opacity: startTransitionAnim.interpolate({
                      inputRange: [0, 0.2, 0.7, 0.9],  // Ajusté pour une transition plus lente
                      outputRange: [0, 1, 1, 0],       // Texte visible plus longtemps
                    }),
                    transform: [
                      { 
                        scale: startTransitionAnim.interpolate({
                          inputRange: [0, 0.2, 0.7, 0.9],  // Ajusté pour une transition plus lente
                          outputRange: [0.5, 1.2, 1.2, 0.8],
                        }) 
                      }
                    ],
                  }
                ]}
              >
                Préparez-vous...
              </Animated.Text>
            </Animated.View>
          )}
          
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
                    backgroundColor: isStarting ? theme.primaryLight : theme.primary,
                    shadowColor: theme.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: 5,
                  }
                ]} 
                onPress={handleStart}
                disabled={isStarting}
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
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0, // Espace pour la barre de statut
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 5,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 10,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cyclesBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6, // Légèrement réduit
    borderRadius: 20,
  },
  cyclesText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Espace pour le bouton fixe
  },
  breathingSection: {
    marginTop: 15,
    marginBottom: 25,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: CIRCLE_SIZE * 1.2,
    height: CIRCLE_SIZE * 1.2,
    borderRadius: (CIRCLE_SIZE * 1.2) / 2,
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
  durationSelectorWrapper: {
    alignItems: 'center',
    marginVertical: 15,
  },
  durationSelectorCard: {
    flexDirection: 'row',
    borderRadius: 30,
    height: 50,
    width: 160,
    overflow: 'hidden',
    borderWidth: 0,
    justifyContent: 'space-between',
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  durationValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  durationUnit: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
    marginTop: 2,
  },
  durationButton: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
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
  activeStepIndicator: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startTransitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Légère teinte de fond pour améliorer la visibilité
  },
  startTransitionCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.3,
  },
  startTransitionText: {
    position: 'absolute',
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default GenericBreathingScreen;
