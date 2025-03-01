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

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    successNotification,
    warningNotification,
    errorNotification,
    selection,
  };
};

export default useHaptics;
