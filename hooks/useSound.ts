import { Audio } from 'expo-av';
import { useRef, useEffect } from 'react';
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

  // Chemins des fichiers audio
  const soundPaths = {
    inhale: `${FileSystem.documentDirectory}sounds/inhale.mp3`,
    exhale: `${FileSystem.documentDirectory}sounds/exhale.mp3`,
    hold: `${FileSystem.documentDirectory}sounds/hold.mp3`,
    complete: `${FileSystem.documentDirectory}sounds/complete.mp3`
  };

  // URLs des sons à télécharger (à remplacer par vos propres URLs)
  const soundUrls = {
    inhale: 'https://soundbible.com/mp3/Breathing-SoundBible.com-517261338.mp3',
    exhale: 'https://soundbible.com/mp3/Exhale-SoundBible.com-800973395.mp3',
    hold: 'https://soundbible.com/mp3/Slow%20Breathing-SoundBible.com-731740047.mp3',
    complete: 'https://soundbible.com/mp3/service-bell_daniel_simion.mp3'
  };

  // Télécharger et préparer les sons
  useEffect(() => {
    if (!enabled) return;

    const downloadAndLoadSounds = async () => {
      try {
        // Créer le dossier sounds s'il n'existe pas
        const soundsDir = `${FileSystem.documentDirectory}sounds`;
        const dirInfo = await FileSystem.getInfoAsync(soundsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(soundsDir, { intermediates: true });
        }

        // Télécharger et charger chaque son
        for (const type of ['inhale', 'exhale', 'hold', 'complete'] as SoundType[]) {
          const filePath = soundPaths[type];
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          // Télécharger le fichier s'il n'existe pas
          if (!fileInfo.exists) {
            console.log(`Téléchargement du son: ${type}`);
            await FileSystem.downloadAsync(soundUrls[type], filePath);
          }

          // Charger le son
          const { sound } = await Audio.Sound.createAsync(
            { uri: filePath },
            { shouldPlay: false, volume: type === 'hold' ? 0.5 : 0.8 }
          );
          soundsRef.current[type] = sound;
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sons:', error);
      }
    };

    downloadAndLoadSounds();

    // Nettoyer les sons lors du démontage
    return () => {
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
    if (!enabled || !soundsRef.current[type]) return;

    try {
      // Arrêter le son s'il est déjà en cours de lecture
      const status = await soundsRef.current[type]?.getStatusAsync();
      if (status && status.isLoaded) {
        if (status.isPlaying) {
          await soundsRef.current[type]?.stopAsync();
        }
        await soundsRef.current[type]?.setPositionAsync(0);
        await soundsRef.current[type]?.playAsync();
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
  };
};

export default useSound;
