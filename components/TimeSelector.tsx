import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';

interface TimeSelectorProps {
  time: string; // Format: 'HH:MM'
  onTimeChange: (time: string) => void;
  label?: string;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ time, onTimeChange, label = 'Heure de rappel' }) => {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  
  // Convertit la chaîne de temps 'HH:MM' en objet Date
  const getTimeAsDate = () => {
    const date = new Date();
    if (time && time.includes(':')) {
      const [hours, minutes] = time.split(':').map(Number);
      date.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
      // Valeur par défaut : 20:00 (8:00 PM)
      date.setHours(20, 0, 0, 0);
    }
    return date;
  };
  
  // Convertit l'objet Date en chaîne 'HH:MM'
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Formate l'heure pour l'affichage
  const getDisplayTime = () => {
    try {
      const date = getTimeAsDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Erreur lors du formatage de l\'heure:', error);
      return '20:00'; // Valeur par défaut
    }
  };
  
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      onTimeChange(formatTime(selectedDate));
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
      
      <TouchableOpacity
        style={[styles.timeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.timeText, { color: theme.textPrimary }]}>
          {getDisplayTime()}
        </Text>
      </TouchableOpacity>
      
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <DateTimePicker
                value={getTimeAsDate()}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={styles.picker}
              />
              
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowPicker(false)}
              >
                <Text style={[styles.doneButtonText, { color: theme.textLight }]}>Terminé</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={getTimeAsDate()}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  timeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  picker: {
    height: 200,
  },
  doneButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TimeSelector;
