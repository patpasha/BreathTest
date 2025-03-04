import { Audio } from 'expo-av';
import { useRef, useEffect, useState } from 'react';

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
 * Version désactivée pour éviter les erreurs
 * 
 * @param enabled Indique si le son est activé (ignoré dans cette version)
 * @returns Fonctions pour jouer différents types de sons (désactivées)
 */
const useSound = (enabled: boolean) => {
  // État pour suivre si les sons sont prêts (toujours false dans cette version)
  const [soundsReady, setSoundsReady] = useState(false);

  // Fonction de base qui ne fait rien
  const noOp = () => {
    // Ne fait rien
  };

  return {
    playInhale: noOp,
    playExhale: noOp,
    playHold: noOp,
    playComplete: noOp,
    soundsReady: false
  };
};

export default useSound;
