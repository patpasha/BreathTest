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
 * Utilise l'API Web Audio pour générer des sons simples
 * 
 * @param enabled Indique si le son est activé
 * @returns Fonctions pour jouer différents types de sons
 */
const useSound = (enabled: boolean) => {
  // Référence à l'AudioContext
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // État pour suivre si les sons sont prêts
  const [soundsReady, setSoundsReady] = useState(false);

  // Initialiser l'audio
  useEffect(() => {
    if (!enabled) return;
    
    try {
      // Créer un AudioContext si supporté
      if (typeof AudioContext !== 'undefined') {
        audioContextRef.current = new AudioContext();
        console.log('AudioContext initialisé avec succès');
        setSoundsReady(true);
      } else {
        console.log('AudioContext non supporté sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'AudioContext:', error);
    }

    // Nettoyer l'AudioContext lors du démontage
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [enabled]);

  /**
   * Génère et joue un son avec les paramètres spécifiés
   * @param frequency Fréquence du son en Hz
   * @param duration Durée du son en secondes
   * @param type Type d'oscillateur (sine, square, sawtooth, triangle)
   * @param volume Volume du son (0-1)
   */
  const generateTone = (
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.5
  ) => {
    if (!enabled || !soundsReady || !audioContextRef.current) {
      console.log(`Son non joué: enabled=${enabled}, soundsReady=${soundsReady}`);
      return;
    }

    try {
      const audioContext = audioContextRef.current;
      
      // Créer un oscillateur
      const oscillator = audioContext.createOscillator();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // Créer un nœud de gain pour contrôler le volume
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
      
      // Connecter l'oscillateur au nœud de gain, puis à la destination
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Démarrer et arrêter l'oscillateur
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
      
      console.log(`Son généré: fréquence=${frequency}Hz, durée=${duration}s, type=${type}`);
    } catch (error) {
      console.error('Erreur lors de la génération du son:', error);
    }
  };

  /**
   * Joue un son d'inspiration (note montante)
   */
  const playInhale = () => {
    // Son d'inspiration: note montante (440Hz à 880Hz)
    if (audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.linearRampToValueAtTime(880, now + 2);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, now + 2);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.start(now);
      oscillator.stop(now + 2);
      
      console.log('Son d\'inspiration joué');
    }
  };

  /**
   * Joue un son d'expiration (note descendante)
   */
  const playExhale = () => {
    // Son d'expiration: note descendante (880Hz à 440Hz)
    if (audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.linearRampToValueAtTime(440, now + 2);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, now + 2);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.start(now);
      oscillator.stop(now + 2);
      
      console.log('Son d\'expiration joué');
    }
  };

  /**
   * Joue un son de rétention (note constante)
   */
  const playHold = () => {
    // Son de rétention: note constante (660Hz)
    generateTone(660, 1, 'sine', 0.3);
    console.log('Son de rétention joué');
  };

  /**
   * Joue un son de fin de session (arpège)
   */
  const playComplete = () => {
    // Son de fin: arpège de trois notes
    if (audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      
      // Première note
      setTimeout(() => generateTone(440, 0.2, 'sine', 0.5), 0);
      
      // Deuxième note
      setTimeout(() => generateTone(554, 0.2, 'sine', 0.5), 250);
      
      // Troisième note
      setTimeout(() => generateTone(659, 0.4, 'sine', 0.5), 500);
      
      console.log('Son de fin joué');
    }
  };

  return {
    playInhale,
    playExhale,
    playHold,
    playComplete,
    soundsReady
  };
};

export default useSound;
