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
    
    // Série de vibrations légères qui s'intensifient pour guider l'inspiration
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 300);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 600);
  };

  /**
   * Trigger a pattern of haptic feedback for exhale
   * Creates a gradual decrease in intensity to guide the exhale
   */
  const exhalePattern = async () => {
    if (!enabled) return;
    
    // Série de vibrations qui diminuent en intensité pour guider l'expiration
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 400);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 800);
  };

  /**
   * Trigger a pattern of haptic feedback for hold
   * Creates a steady rhythm to help maintain the hold
   */
  const holdPattern = async () => {
    if (!enabled) return;
    
    // Vibration unique pour indiquer le début de la rétention
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
