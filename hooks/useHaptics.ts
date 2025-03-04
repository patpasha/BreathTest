import * as Haptics from 'expo-haptics';
import { Vibration, Platform } from 'react-native';

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
   * Fonction simple pour créer une vibration pour l'inspiration
   * @param duration Durée de l'inspiration en ms
   */
  const inhalePattern = (duration = 4000) => {
    if (!enabled) return;
    
    try {
      // Annuler toute vibration en cours
      Vibration.cancel();
      
      if (Platform.OS === 'ios') {
        // Sur iOS, utiliser des retours haptiques simples
        // Vibration initiale pour signaler le début
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Vibration au milieu de l'inspiration
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, duration / 2);
      } else {
        // Sur Android, utiliser un motif simple mais efficace
        // [délai initial, durée vibration, délai, durée vibration]
        Vibration.vibrate([0, 50, 300, 50]);
      }
    } catch (error) {
      console.log('Erreur haptic inhale:', error);
    }
  };

  /**
   * Fonction simple pour créer une vibration pour l'expiration
   * @param duration Durée de l'expiration en ms
   */
  const exhalePattern = (duration = 6000) => {
    if (!enabled) return;
    
    try {
      // Annuler toute vibration en cours
      Vibration.cancel();
      
      if (Platform.OS === 'ios') {
        // Sur iOS, utiliser des retours haptiques simples
        // Vibration initiale pour signaler le début
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Vibration au milieu de l'expiration
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, duration / 2);
      } else {
        // Sur Android, utiliser un motif simple mais efficace
        // [délai initial, durée vibration, délai, durée vibration]
        Vibration.vibrate([0, 100, 400, 50]);
      }
    } catch (error) {
      console.log('Erreur haptic exhale:', error);
    }
  };

  /**
   * Fonction simple pour créer une vibration pour la rétention
   * @param duration Durée de la rétention en ms
   */
  const holdPattern = (duration = 2000) => {
    if (!enabled) return;
    
    try {
      // Annuler toute vibration en cours
      Vibration.cancel();
      
      if (Platform.OS === 'ios') {
        // Sur iOS, utiliser un retour haptique simple
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid || Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Sur Android, utiliser un motif court et régulier
        // [délai initial, durée vibration]
        Vibration.vibrate([0, 30]);
      }
    } catch (error) {
      console.log('Erreur haptic hold:', error);
    }
  };

  /**
   * Annule toutes les vibrations en cours
   */
  const cancelVibration = () => {
    Vibration.cancel();
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
    cancelVibration
  };
};

export default useHaptics;
