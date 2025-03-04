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
   * Crée une séquence de vibrations progressives pour l'inspiration
   * @param duration Durée totale de l'inspiration en ms (par défaut 4000ms)
   */
  const inhalePattern = (duration = 4000) => {
    if (!enabled) return;
    
    try {
      // Annuler toute vibration en cours
      Vibration.cancel();
      
      // Pour l'inspiration, on commence doucement et on augmente progressivement
      // On divise la durée en plusieurs segments pour créer une sensation de progression
      
      if (Platform.OS === 'ios') {
        // iOS a des limitations sur les motifs complexes, on utilise donc un motif plus simple
        // mais on ajoute des retours haptiques pour enrichir l'expérience
        
        // Vibration initiale douce
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Programmer des vibrations supplémentaires à intervalles réguliers
        const interval = duration / 4;
        
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, interval);
        
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, interval * 2);
        
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, interval * 3);
        
      } else {
        // Android permet des motifs plus complexes
        // Format: [délai, durée, délai, durée, ...]
        // On crée un motif qui s'intensifie progressivement
        
        const segmentCount = 5;
        const segmentDuration = duration / segmentCount;
        const pattern = [];
        
        // Délai initial
        pattern.push(0);
        
        // Créer des vibrations de plus en plus longues
        for (let i = 0; i < segmentCount; i++) {
          // Durée de vibration qui augmente progressivement
          const vibrationDuration = 20 + (i * 15);
          pattern.push(vibrationDuration);
          
          // Délai entre les vibrations qui diminue progressivement
          if (i < segmentCount - 1) {
            const delay = segmentDuration - vibrationDuration;
            pattern.push(delay);
          }
        }
        
        Vibration.vibrate(pattern);
      }
    } catch (error) {
      console.log('Erreur haptic inhale:', error);
    }
  };

  /**
   * Crée une séquence de vibrations dégressives pour l'expiration
   * @param duration Durée totale de l'expiration en ms (par défaut 6000ms)
   */
  const exhalePattern = (duration = 6000) => {
    if (!enabled) return;
    
    try {
      // Annuler toute vibration en cours
      Vibration.cancel();
      
      // Pour l'expiration, on commence fort et on diminue progressivement
      
      if (Platform.OS === 'ios') {
        // iOS a des limitations sur les motifs complexes
        // On utilise des retours haptiques à intervalles réguliers
        
        // Vibration initiale forte
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Programmer des vibrations supplémentaires à intervalles réguliers
        const interval = duration / 4;
        
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, interval);
        
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, interval * 2);
        
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, interval * 3);
        
      } else {
        // Android permet des motifs plus complexes
        // Format: [délai, durée, délai, durée, ...]
        // On crée un motif qui diminue progressivement
        
        const segmentCount = 5;
        const segmentDuration = duration / segmentCount;
        const pattern = [];
        
        // Délai initial
        pattern.push(0);
        
        // Créer des vibrations de plus en plus courtes
        for (let i = 0; i < segmentCount; i++) {
          // Durée de vibration qui diminue progressivement
          const vibrationDuration = 80 - (i * 15);
          pattern.push(Math.max(vibrationDuration, 10)); // Minimum 10ms
          
          // Délai entre les vibrations qui augmente progressivement
          if (i < segmentCount - 1) {
            const delay = segmentDuration - vibrationDuration;
            pattern.push(delay);
          }
        }
        
        Vibration.vibrate(pattern);
      }
    } catch (error) {
      console.log('Erreur haptic exhale:', error);
    }
  };

  /**
   * Crée une séquence de vibrations régulières pour la rétention
   * @param duration Durée totale de la rétention en ms (par défaut 2000ms)
   */
  const holdPattern = (duration = 2000) => {
    if (!enabled) return;
    
    try {
      // Annuler toute vibration en cours
      Vibration.cancel();
      
      // Pour la rétention, on crée un rythme régulier et subtil
      
      if (Platform.OS === 'ios') {
        // iOS a des limitations sur les motifs complexes
        // On utilise des retours haptiques à intervalles réguliers
        
        // Vibration initiale moyenne
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Nombre de pulsations basé sur la durée
        const pulseCount = Math.max(Math.floor(duration / 500), 1);
        const interval = duration / (pulseCount + 1);
        
        // Programmer des vibrations supplémentaires à intervalles réguliers
        for (let i = 1; i <= pulseCount; i++) {
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }, interval * i);
        }
        
      } else {
        // Android permet des motifs plus complexes
        // Format: [délai, durée, délai, durée, ...]
        // On crée un motif régulier pour la rétention
        
        const pulseCount = Math.max(Math.floor(duration / 500), 1);
        const interval = duration / (pulseCount + 1);
        const pattern = [];
        
        // Délai initial
        pattern.push(0);
        
        // Créer des vibrations régulières
        for (let i = 0; i < pulseCount; i++) {
          // Durée de vibration constante
          pattern.push(30);
          
          // Délai entre les vibrations constant
          if (i < pulseCount - 1) {
            pattern.push(interval - 30);
          }
        }
        
        Vibration.vibrate(pattern);
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
