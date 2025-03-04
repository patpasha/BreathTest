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
      // Motif progressif pour l'inspiration - commence doucement et s'intensifie
      const pattern = [0, 20, 30, 40, 30, 20];
      
      // Créer une séquence progressive de vibrations douces
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] > 0) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      // Motif dégressif pour l'expiration - commence plus fort et diminue
      const pattern = [0, 40, 30, 20, 10];
      
      // Créer une séquence dégressive de vibrations
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] > 0) {
          if (i === 0) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          await new Promise(resolve => setTimeout(resolve, pattern[i]));
        }
      }
    } catch (error) {
      console.log('Erreur haptic exhale:', error);
    }
  };

  /**
   * Trigger a pattern of haptic feedback for hold
   * Creates a steady rhythm to help maintain the hold
   */
  const holdPattern = async () => {
    if (!enabled) return;
    
    try {
      // Vibration subtile et constante pour la rétention
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(resolve => setTimeout(resolve, 30));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
