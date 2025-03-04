import * as Haptics from 'expo-haptics';

/**
 * Custom hook for managing haptic feedback in the breathing exercises
 * @param enabled Whether haptic feedback is enabled
 * @returns Functions to trigger different types of haptic feedback
 */
export const useHaptics = (enabled: boolean) => {
  /**
   * Trigger a light impact haptic feedback
   */
  const lightImpact = () => {
    if (enabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  /**
   * Trigger a medium impact haptic feedback
   */
  const mediumImpact = () => {
    if (enabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  /**
   * Trigger a heavy impact haptic feedback
   */
  const heavyImpact = () => {
    if (enabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  /**
   * Trigger a success notification haptic feedback
   */
  const successNotification = () => {
    if (enabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  /**
   * Trigger a warning notification haptic feedback
   */
  const warningNotification = () => {
    if (enabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  /**
   * Trigger an error notification haptic feedback
   */
  const errorNotification = () => {
    if (enabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  /**
   * Trigger a selection haptic feedback
   */
  const selection = () => {
    if (enabled) {
      Haptics.selectionAsync();
    }
  };

  /**
   * Trigger a pattern of haptic feedback for inhale
   * Creates a gradual increase in intensity to guide the inhale
   */
  const inhalePattern = async () => {
    if (!enabled) return;
    
    try {
      // Motif progressif plus doux et plus long pour l'inspiration
      // Commence très doucement et s'intensifie graduellement
      const pattern = [0, 10, 20, 30, 40, 50, 60, 50, 40];
      const intensities = [
        Haptics.ImpactFeedbackStyle.Light,
        Haptics.ImpactFeedbackStyle.Light,
        Haptics.ImpactFeedbackStyle.Light,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Heavy,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Light
      ];
      
      // Créer une séquence progressive de vibrations avec intensité variable
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] > 0) {
          await Haptics.impactAsync(intensities[i-1] || Haptics.ImpactFeedbackStyle.Light);
          await new Promise(resolve => setTimeout(resolve, pattern[i]));
        }
      }
    } catch (error) {
      console.log('Erreur haptic inhale:', error);
    }
  };

  /**
   * Trigger a pattern of haptic feedback for exhale
   * Creates a gradual decrease in intensity to guide the exhale
   */
  const exhalePattern = async () => {
    if (!enabled) return;
    
    try {
      // Motif dégressif plus doux pour l'expiration
      // Commence fort et diminue progressivement
      const pattern = [0, 60, 50, 40, 30, 20, 10];
      const intensities = [
        Haptics.ImpactFeedbackStyle.Heavy,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Light,
        Haptics.ImpactFeedbackStyle.Light,
        Haptics.ImpactFeedbackStyle.Light
      ];
      
      // Créer une séquence dégressive de vibrations avec intensité variable
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] > 0) {
          await Haptics.impactAsync(intensities[i-1] || Haptics.ImpactFeedbackStyle.Light);
          await new Promise(resolve => setTimeout(resolve, pattern[i]));
        }
      }
    } catch (error) {
      console.log('Erreur haptic exhale:', error);
    }
  };

  /**
   * Trigger a pattern of haptic feedback for hold
   * Creates a subtle, steady rhythm to help maintain the hold
   */
  const holdPattern = async () => {
    if (!enabled) return;
    
    try {
      // Séquence de vibrations très subtiles et régulières pour la rétention
      // Crée un rythme doux et constant
      const pulseCount = 3;
      const pulseInterval = 400; // Intervalle entre les pulsations
      
      for (let i = 0; i < pulseCount; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await new Promise(resolve => setTimeout(resolve, pulseInterval));
      }
    } catch (error) {
      console.log('Erreur haptic hold:', error);
    }
  };

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    successNotification,
    warningNotification,
    errorNotification,
    selection,
    inhalePattern,
    exhalePattern,
    holdPattern,
  };
};

export default useHaptics;
