import { Audio } from 'expo-av';
import { useRef, useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';

/**
 * Type pour les différents sons de respiration
 */
type SoundType = 'inhale' | 'exhale' | 'hold' | 'complete';

/**
 * Interface pour les sons préchargés
 */
interface SoundAssets {
  inhale: Audio.Sound | null;
  exhale: Audio.Sound | null;
  hold: Audio.Sound | null;
  complete: Audio.Sound | null;
}

/**
 * Hook pour la gestion des sons dans les exercices de respiration
 * Utilise expo-av pour jouer des sons réels
 * 
 * @param enabled Indique si le son est activé
 * @returns Fonctions pour jouer différents types de sons
 */
const useSound = (enabled: boolean) => {
  // Référence aux sons préchargés
  const soundsRef = useRef<SoundAssets>({
    inhale: null,
    exhale: null,
    hold: null,
    complete: null
  });
  
  // État pour suivre si les sons sont prêts
  const [soundsReady, setSoundsReady] = useState(false);

  // Initialiser l'audio
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Configurer l'audio pour l'application
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'audio:', error);
      }
    };

    initAudio();
  }, []);

  // Charger les sons depuis les ressources locales
  useEffect(() => {
    let isMounted = true;
    setSoundsReady(false);

    const loadSounds = async () => {
      if (!enabled) return;
      
      try {
        console.log('Début du chargement des sons locaux...');
        
        // Charger les sons depuis les ressources locales
        const soundResources = {
          inhale: require('../assets/sounds/inhale.mp3'),
          exhale: require('../assets/sounds/exhale.mp3'),
          hold: require('../assets/sounds/hold.mp3'),
          complete: require('../assets/sounds/complete.mp3')
        };
        
        // Charger chaque son
        for (const type of ['inhale', 'exhale', 'hold', 'complete'] as SoundType[]) {
          if (!isMounted) return;
          
          try {
            console.log(`Chargement du son local: ${type}`);
            const { sound } = await Audio.Sound.createAsync(
              soundResources[type],
              { shouldPlay: false, volume: type === 'hold' ? 0.5 : 0.8 }
            );
            
            if (!isMounted) {
              sound.unloadAsync();
              return;
            }
            
            soundsRef.current[type] = sound;
            console.log(`Son ${type} chargé avec succès`);
          } catch (loadError) {
            console.error(`Erreur lors du chargement du son ${type}:`, loadError);
          }
        }
        
        if (isMounted) {
          console.log('Tous les sons sont prêts');
          setSoundsReady(true);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sons:', error);
      }
    };

    loadSounds();

    // Nettoyer les sons lors du démontage
    return () => {
      isMounted = false;
      console.log('Nettoyage des sons...');
      Object.values(soundsRef.current).forEach(sound => {
        if (sound) {
          sound.unloadAsync();
        }
      });
    };
  }, [enabled]);

  /**
   * Joue un son spécifique
   * @param type Le type de son à jouer
   */
  const playSound = async (type: SoundType) => {
    if (!enabled || !soundsReady) {
      console.log(`Son ${type} non joué: enabled=${enabled}, soundsReady=${soundsReady}`);
      return;
    }
    
    const sound = soundsRef.current[type];
    if (!sound) {
      console.log(`Son ${type} non disponible`);
      return;
    }

    try {
      console.log(`Lecture du son: ${type}`);
      
      // Vérifier l'état du son
      const status = await sound.getStatusAsync();
      
      if (status.isLoaded) {
        // Arrêter le son s'il est déjà en cours de lecture
        if (status.isPlaying) {
          await sound.stopAsync();
        }
        
        // Réinitialiser la position et jouer
        await sound.setPositionAsync(0);
        await sound.playAsync();
        console.log(`Son ${type} joué avec succès`);
      } else {
        console.log(`Son ${type} non chargé, tentative de rechargement...`);
        // Tenter de recharger le son
        try {
          const soundResources = {
            inhale: require('../assets/sounds/inhale.mp3'),
            exhale: require('../assets/sounds/exhale.mp3'),
            hold: require('../assets/sounds/hold.mp3'),
            complete: require('../assets/sounds/complete.mp3')
          };
          
          const { sound: newSound } = await Audio.Sound.createAsync(
            soundResources[type],
            { shouldPlay: true, volume: type === 'hold' ? 0.5 : 0.8 }
          );
          soundsRef.current[type] = newSound;
        } catch (reloadError) {
          console.error(`Erreur lors du rechargement du son ${type}:`, reloadError);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture du son ${type}:`, error);
    }
  };

  /**
   * Joue un son d'inspiration
   */
  const playInhale = () => playSound('inhale');

  /**
   * Joue un son d'expiration
   */
  const playExhale = () => playSound('exhale');

  /**
   * Joue un son de rétention
   */
  const playHold = () => playSound('hold');

  /**
   * Joue un son de fin de session
   */
  const playComplete = () => playSound('complete');

  return {
    playInhale,
    playExhale,
    playHold,
    playComplete,
    soundsReady
  };
};

export default useSound;
