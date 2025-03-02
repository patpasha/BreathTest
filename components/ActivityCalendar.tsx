import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Modal, 
  ScrollView,
  FlatList
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SessionData } from '../contexts/StatsContext';
// Importer uniquement les icônes nécessaires
import Ionicons from '@expo/vector-icons/Ionicons';

// Type pour les données d'un jour
interface DayData {
  date: string;
  duration: number;
  sessions: SessionData[];
}

// Type pour les props du composant ActivityCalendar
interface ActivityCalendarProps {
  data: DayData[];
  onMonthChange?: (month: number, year: number) => void;
}

// Composant pour afficher un jour dans le calendrier d'activité
const ActivityDay = ({ 
  intensity, 
  date, 
  isToday,
  onPress 
}: { 
  intensity: number; 
  date: string; 
  isToday?: boolean;
  onPress: () => void 
}) => {
  const theme = useTheme();
  
  // Calculer la couleur en fonction de l'intensité (0-3)
  const getColor = () => {
    if (intensity === 0) return theme.border;
    if (intensity === 1) return theme.primaryLight;
    if (intensity === 2) return theme.primary;
    return theme.primaryDark;
  };
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.activityDay, 
        { 
          backgroundColor: getColor(),
          borderRadius: theme.borderRadiusSmall / 2,
          borderWidth: isToday ? 2 : 0,
          borderColor: isToday ? theme.accent : 'transparent',
        }
      ]}
    />
  );
};

// Composant pour afficher le détail d'une session
const SessionItem = ({ session }: { session: SessionData }) => {
  const theme = useTheme();
  
  // Formater la durée (de secondes à minutes)
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  return (
    <View style={[styles.sessionItem, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.sessionHeader}>
        <Text style={[styles.sessionTitle, { color: theme.textPrimary }]}>
          {session.techniqueName}
        </Text>
        <Text style={[styles.sessionDuration, { color: theme.textSecondary }]}>
          {formatDuration(session.duration)}
        </Text>
      </View>
      <View style={styles.sessionDetails}>
        <Text style={[styles.sessionTime, { color: theme.textTertiary }]}>
          {new Date(session.date).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
        <Text style={[
          styles.sessionStatus, 
          { color: session.completed ? theme.success : theme.warning }
        ]}>
          {session.completed ? 'Complétée' : 'Interrompue'}
        </Text>
      </View>
    </View>
  );
};

// Composant principal du calendrier d'activité
const ActivityCalendar = ({ data, onMonthChange }: ActivityCalendarProps) => {
  const theme = useTheme();
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Formater la durée pour l'affichage
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} minutes`;
  };
  
  // Vérifier si une date est aujourd'hui
  const isToday = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    return date.getTime() === today.getTime();
  };
  
  // Naviguer au mois précédent
  const goToPreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    }
  };
  
  // Naviguer au mois suivant
  const goToNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    }
  };
  
  // Obtenir le nom du mois actuel
  const getCurrentMonthName = () => {
    return new Date(currentYear, currentMonth, 1).toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  // Filtrer les données pour n'afficher que le mois actuel
  const filteredData = data.filter(day => {
    const date = new Date(day.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  // Organiser les jours par semaine
  const organizeByWeek = () => {
    const weeks: DayData[][] = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Trouver le premier jour de la semaine (lundi = 1, dimanche = 0)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Ajuster pour commencer par lundi
    
    let currentWeek: DayData[] = [];
    
    // Ajouter les jours vides avant le premier jour du mois
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: '',
        duration: 0,
        sessions: []
      });
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = filteredData.find(d => {
        const date = new Date(d.date);
        return date.getDate() === day;
      }) || {
        date: dateStr,
        duration: 0,
        sessions: []
      };
      
      currentWeek.push(dayData);
      
      // Si c'est dimanche ou le dernier jour du mois, commencer une nouvelle semaine
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    // Ajouter les jours vides après le dernier jour du mois
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          duration: 0,
          sessions: []
        });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };
  
  const weeks = organizeByWeek();
  
  return (
    <View style={styles.container}>
      {/* En-tête avec navigation entre les mois */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>
          {getCurrentMonthName()}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* En-têtes des jours de la semaine */}
      <View style={styles.weekDays}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
          <Text 
            key={index} 
            style={[
              styles.weekDay, 
              { color: theme.textTertiary }
            ]}
          >
            {day}
          </Text>
        ))}
      </View>
      
      {/* Grille du calendrier */}
      <View style={styles.calendarGrid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => {
              // Calculer l'intensité en fonction de la durée
              let intensity = 0;
              if (day.date && day.duration > 0) intensity = 1;
              if (day.date && day.duration >= 600) intensity = 2; // 10 minutes
              if (day.date && day.duration >= 1800) intensity = 3; // 30 minutes
              
              return day.date ? (
                <ActivityDay 
                  key={dayIndex} 
                  intensity={intensity} 
                  date={day.date}
                  isToday={isToday(day.date)}
                  onPress={() => {
                    setSelectedDay(day);
                    setModalVisible(true);
                  }} 
                />
              ) : (
                <View key={dayIndex} style={styles.emptyDay} />
              );
            })}
          </View>
        ))}
      </View>
      
      {/* Légende d'intensité */}
      <View style={styles.intensityLegend}>
        <Text style={[styles.legendText, { color: theme.textTertiary }]}>Moins</Text>
        <View style={styles.legendItems}>
          <View 
            style={[
              styles.legendItem, 
              { 
                backgroundColor: theme.border,
                borderRadius: theme.borderRadiusSmall / 2,
              }
            ]} 
          />
          <View 
            style={[
              styles.legendItem, 
              { 
                backgroundColor: theme.primaryLight,
                borderRadius: theme.borderRadiusSmall / 2,
              }
            ]} 
          />
          <View 
            style={[
              styles.legendItem, 
              { 
                backgroundColor: theme.primary,
                borderRadius: theme.borderRadiusSmall / 2,
              }
            ]} 
          />
          <View 
            style={[
              styles.legendItem, 
              { 
                backgroundColor: theme.primaryDark,
                borderRadius: theme.borderRadiusSmall / 2,
              }
            ]} 
          />
        </View>
        <Text style={[styles.legendText, { color: theme.textTertiary }]}>Plus</Text>
      </View>
      
      {/* Modal de détail du jour */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            {selectedDay && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    {new Date(selectedDay.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalSummary}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.textTertiary }]}>
                      Durée totale
                    </Text>
                    <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                      {selectedDay.duration > 0 
                        ? formatDuration(selectedDay.duration) 
                        : 'Aucune activité'}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.textTertiary }]}>
                      Sessions
                    </Text>
                    <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                      {selectedDay.sessions.length}
                    </Text>
                  </View>
                </View>
                
                {selectedDay.sessions.length > 0 ? (
                  <FlatList
                    data={selectedDay.sessions}
                    renderItem={({ item }) => <SessionItem session={item} />}
                    keyExtractor={(item) => item.id}
                    style={styles.sessionsList}
                  />
                ) : (
                  <View style={styles.noSessions}>
                    <Text style={[styles.noSessionsText, { color: theme.textTertiary }]}>
                      Aucune session pour cette journée
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navButton: {
    padding: 5,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  weekDay: {
    width: (Dimensions.get('window').width - 60) / 7,
    textAlign: 'center',
    fontSize: 12,
  },
  calendarGrid: {
    width: '100%',
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 2,
  },
  activityDay: {
    width: (Dimensions.get('window').width - 60) / 7 - 2,
    height: (Dimensions.get('window').width - 60) / 7 - 2,
    margin: 1,
  },
  emptyDay: {
    width: (Dimensions.get('window').width - 60) / 7 - 2,
    height: (Dimensions.get('window').width - 60) / 7 - 2,
    margin: 1,
  },
  intensityLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  legendText: {
    fontSize: 12,
    marginHorizontal: 5,
  },
  legendItems: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    width: 12,
    height: 12,
    marginHorizontal: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  modalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionsList: {
    maxHeight: 400,
  },
  sessionItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  sessionDuration: {
    fontSize: 14,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionTime: {
    fontSize: 12,
  },
  sessionStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  noSessions: {
    padding: 20,
    alignItems: 'center',
  },
  noSessionsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default ActivityCalendar;
