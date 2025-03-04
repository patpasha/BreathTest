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
    switch (type) {
      case 'inhale':
        console.log(`Playing sound: ${type}`);
        // Son doux et montant pour l'inspiration
        // Idéalement un son qui s'intensifie progressivement
        // Fréquence: 174Hz (note F3) - associée à la relaxation
        break;
      case 'exhale':
        console.log(`Playing sound: ${type}`);
        // Son descendant et apaisant pour l'expiration
        // Idéalement un son qui diminue progressivement
        // Fréquence: 396Hz (note G4) - associée à la libération de la peur
        break;
      case 'hold':
        console.log(`Playing sound: ${type}`);
        // Son stable et constant pour la rétention
        // Idéalement un son de fréquence moyenne et constante
        // Fréquence: 285Hz (note D4) - associée à l'équilibre
        break;
      case 'complete':
        console.log(`Playing sound: ${type}`);
        // Son de cloche ou carillon pour indiquer la fin de la session
        // Idéalement un son harmonieux et satisfaisant
        // Combinaison de fréquences 528Hz et 432Hz - associées à la guérison et l'harmonie
        break;
    }
  };

  /**
   * Joue un son d'inspiration
   * Dans une version complète, ce son serait synchronisé avec la durée de l'inspiration
   */
  const playInhale = () => playSound('inhale');

  /**
   * Joue un son d'expiration
   * Dans une version complète, ce son serait synchronisé avec la durée de l'expiration
   */
  const playExhale = () => playSound('exhale');

  /**
   * Joue un son de rétention
   * Dans une version complète, ce son serait synchronisé avec la durée de la rétention
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
