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

  // Chemins des fichiers audio
  const soundPaths = {
    inhale: `${FileSystem.documentDirectory}sounds/inhale.mp3`,
    exhale: `${FileSystem.documentDirectory}sounds/exhale.mp3`,
    hold: `${FileSystem.documentDirectory}sounds/hold.mp3`,
    complete: `${FileSystem.documentDirectory}sounds/complete.mp3`
  };

  // URLs des sons à télécharger (hébergés sur GitHub pour une meilleure compatibilité iOS)
  const soundUrls = {
    inhale: 'https://github.com/patpasha/breathing-sounds/raw/main/inhale.mp3',
    exhale: 'https://github.com/patpasha/breathing-sounds/raw/main/exhale.mp3',
    hold: 'https://github.com/patpasha/breathing-sounds/raw/main/hold.mp3',
    complete: 'https://github.com/patpasha/breathing-sounds/raw/main/complete.mp3'
  };

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

  // Télécharger et préparer les sons
  useEffect(() => {
    let isMounted = true;
    setSoundsReady(false);

    const downloadAndLoadSounds = async () => {
      if (!enabled) return;
      
      try {
        console.log('Début du chargement des sons...');
        
        // Créer le dossier sounds s'il n'existe pas
        const soundsDir = `${FileSystem.documentDirectory}sounds`;
        const dirInfo = await FileSystem.getInfoAsync(soundsDir);
        if (!dirInfo.exists) {
          console.log('Création du dossier sounds...');
          await FileSystem.makeDirectoryAsync(soundsDir, { intermediates: true });
        }

        // Télécharger et charger chaque son
        for (const type of ['inhale', 'exhale', 'hold', 'complete'] as SoundType[]) {
          if (!isMounted) return;
          
          const filePath = soundPaths[type];
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          // Forcer le téléchargement pour mettre à jour les sons
          try {
            console.log(`Téléchargement du son: ${type} depuis ${soundUrls[type]}`);
            // Supprimer le fichier existant s'il existe
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(filePath, { idempotent: true });
            }
            // Télécharger le nouveau fichier
            await FileSystem.downloadAsync(soundUrls[type], filePath);
            console.log(`Son ${type} téléchargé avec succès à ${filePath}`);
          } catch (downloadError) {
            console.error(`Erreur lors du téléchargement du son ${type}:`, downloadError);
            continue; // Passer au son suivant en cas d'erreur
          }

          // Charger le son
          try {
            console.log(`Chargement du son: ${type} depuis ${filePath}`);
            const { sound } = await Audio.Sound.createAsync(
              { uri: filePath },
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

    downloadAndLoadSounds();

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
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: soundPaths[type] },
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
