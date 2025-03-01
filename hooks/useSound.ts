import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

type SoundType = 'inhale' | 'exhale' | 'hold' | 'complete';

/**
 * Custom hook for managing sounds in the breathing exercises
 * @param enabled Whether sound is enabled
 * @returns Functions to play different types of sounds
 */
const useSound = (enabled: boolean) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  /**
   * Play a sound for a specific breathing action
   * @param type The type of sound to play
   */
  const playSound = async (type: SoundType) => {
    if (!enabled) return;

    try {
      // For now, we'll just log the sound type
      // This is a temporary solution until proper sound files are added
      console.log(`Playing sound: ${type}`);
      
      // In a production app, we would use real sound files
      // The code below is commented out to avoid errors
      /*
      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Create a sound from a file
      const { sound: newSound } = await Audio.Sound.createAsync(
        require(`../assets/sounds/${type}.mp3`),
        { shouldPlay: true, volume: 0.5 }
      );
      
      setSound(newSound);
      
      // Automatically unload after playing
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          newSound.unloadAsync();
        }
      });
      */
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  return {
    playInhale: () => playSound('inhale'),
    playExhale: () => playSound('exhale'),
    playHold: () => playSound('hold'),
    playComplete: () => playSound('complete'),
  };
};

export default useSound;
