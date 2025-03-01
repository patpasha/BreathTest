import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface DurationSelectorProps {
  duration: number; // durée en minutes
  onDurationChange: (duration: number) => void;
  minDuration?: number;
  maxDuration?: number;
  step?: number;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({
  duration,
  onDurationChange,
  minDuration = 1,
  maxDuration = 30,
  step = 1
}) => {
  const theme = useTheme();

  const handleDecrease = () => {
    if (duration > minDuration) {
      onDurationChange(duration - step);
    }
  };

  const handleIncrease = () => {
    if (duration < maxDuration) {
      onDurationChange(duration + step);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Durée de la session</Text>
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary, opacity: duration <= minDuration ? 0.5 : 1 }]}
          onPress={handleDecrease}
          disabled={duration <= minDuration}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        
        <View style={[styles.valueContainer, { backgroundColor: theme.surfaceLight }]}>
          <Text style={[styles.valueText, { color: theme.textPrimary }]}>{duration}</Text>
          <Text style={[styles.unitText, { color: theme.textSecondary }]}>min</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary, opacity: duration >= maxDuration ? 0.5 : 1 }]}
          onPress={handleIncrease}
          disabled={duration >= maxDuration}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    marginHorizontal: 15,
    minWidth: 80,
  },
  valueText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 5,
  },
  unitText: {
    fontSize: 16,
  },
});

export default DurationSelector;
