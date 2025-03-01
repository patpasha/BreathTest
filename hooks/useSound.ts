/**
 * Type pour les différents sons de respiration
 */
type SoundType = 'inhale' | 'exhale' | 'hold' | 'complete';

/**
 * Hook simplifié pour la gestion des sons dans les exercices de respiration
 * Cette version n'utilise pas expo-av pour réduire la taille de l'application
 * 
 * @param enabled Indique si le son est activé
 * @returns Fonctions pour jouer différents types de sons
 */
const useSound = (enabled: boolean) => {
  /**
   * Simule la lecture d'un son
   * @param type Le type de son à jouer
   */
  const playSound = (type: SoundType) => {
    if (!enabled) return;
    
    // Pour l'instant, on se contente de logger le type de son
    // Dans une future version, on pourra ajouter de vrais sons
    console.log(`Playing sound: ${type}`);
  };

  return {
    playInhale: () => playSound('inhale'),
    playExhale: () => playSound('exhale'),
    playHold: () => playSound('hold'),
    playComplete: () => playSound('complete'),
  };
};

export default useSound;
