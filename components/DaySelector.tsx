import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface DaySelectorProps {
  selectedDays: number[]; // Tableau des jours sélectionnés (0 = dimanche, 1 = lundi, etc.)
  onDaysChange: (days: number[]) => void;
  label?: string;
}

const DaySelector: React.FC<DaySelectorProps> = ({ 
  selectedDays, 
  onDaysChange, 
  label = 'Jours de rappel' 
}) => {
  const theme = useTheme();
  
  // Noms des jours de la semaine (commençant par lundi)
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  // Valeurs correspondantes (0 = dimanche, 1 = lundi, etc. selon la norme JavaScript)
  const dayValues = [1, 2, 3, 4, 5, 6, 0];
  
  const toggleDay = (dayValue: number) => {
    if (selectedDays.includes(dayValue)) {
      // Retirer le jour s'il est déjà sélectionné
      onDaysChange(selectedDays.filter(day => day !== dayValue));
    } else {
      // Ajouter le jour s'il n'est pas sélectionné
      onDaysChange([...selectedDays, dayValue].sort((a, b) => a - b));
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
      
      <View style={styles.daysContainer}>
        {dayNames.map((day, index) => {
          const dayValue = dayValues[index];
          const isSelected = selectedDays.includes(dayValue);
          
          return (
            <TouchableOpacity
              key={dayValue}
              style={[
                styles.dayButton,
                { 
                  backgroundColor: isSelected ? theme.primary : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border
                }
              ]}
              onPress={() => toggleDay(dayValue)}
            >
              <Text 
                style={[
                  styles.dayText, 
                  { color: isSelected ? theme.textLight : theme.textPrimary }
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DaySelector; 