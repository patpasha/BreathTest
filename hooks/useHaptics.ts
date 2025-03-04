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
   * Utilise l'API Vibration pour créer des motifs plus complexes
   * qui fonctionnent sur iOS et Android
   * @param pattern Le motif de vibration (alternance de temps d'attente et de vibration en ms)
   */
  const vibratePattern = (pattern: number[]) => {
    if (!enabled) return;
    
    try {
      // Annuler toute vibration en cours
      Vibration.cancel();
      
      // Appliquer le motif de vibration
      Vibration.vibrate(pattern);
    } catch (error) {
      console.log('Erreur de vibration:', error);
    }
  };

  /**
   * Trigger a pattern of haptic feedback for inhale
   * Creates a gradual increase in intensity to guide the inhale
   */
  const inhalePattern = () => {
    if (!enabled) return;
    
    try {
      // Motif d'inspiration: vibrations courtes qui s'intensifient
      // [attente, vibration, attente, vibration, ...]
      const pattern = Platform.OS === 'ios' 
        ? [0, 100, 100, 200, 100, 300] // iOS a des limitations sur les motifs
        : [0, 50, 50, 100, 50, 150, 50, 200]; // Android permet des motifs plus complexes
      
      vibratePattern(pattern);
      
      // Utiliser également Haptics pour un retour plus riche sur iOS
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('Erreur haptic inhale:', error);
    }
  };

  /**
   * Trigger a pattern of haptic feedback for exhale
   * Creates a gradual decrease in intensity to guide the exhale
   */
  const exhalePattern = () => {
    if (!enabled) return;
    
    try {
      // Motif d'expiration: vibrations longues qui diminuent
      // [attente, vibration, attente, vibration, ...]
      const pattern = Platform.OS === 'ios'
        ? [0, 400, 100, 300, 100, 200] // iOS a des limitations sur les motifs
        : [0, 400, 50, 300, 50, 200, 50, 100]; // Android permet des motifs plus complexes
      
      vibratePattern(pattern);
      
      // Utiliser également Haptics pour un retour plus riche sur iOS
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.log('Erreur haptic exhale:', error);
    }
  };

  /**
   * Trigger a pattern of haptic feedback for hold
   * Creates a subtle, steady rhythm to help maintain the hold
   */
  const holdPattern = () => {
    if (!enabled) return;
    
    try {
      // Motif de rétention: vibrations régulières et courtes
      // [attente, vibration, attente, vibration, ...]
      const pattern = Platform.OS === 'ios'
        ? [0, 50, 300, 50, 300, 50] // iOS a des limitations sur les motifs
        : [0, 50, 300, 50, 300, 50, 300, 50]; // Android permet des motifs plus complexes
      
      vibratePattern(pattern);
      
      // Utiliser également Haptics pour un retour plus riche sur iOS
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
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
