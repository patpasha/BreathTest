import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useStats } from '../contexts/StatsContext';
import ActivityCalendar from '../components/ActivityCalendar';

// Composant pour afficher une statistique
const StatCard = ({ title, value, subtitle, color, icon }: { title: string; value: string; subtitle?: string; color: string; icon?: string }) => {
  const theme = useTheme();
  
  return (
    <View 
      style={[
        styles.statCard, 
        { 
          backgroundColor: theme.surface,
          borderRadius: theme.borderRadiusMedium,
          shadowColor: theme.shadowColor,
          shadowOpacity: theme.shadowOpacity,
          shadowRadius: theme.shadowRadius / 2,
          shadowOffset: { width: 0, height: 3 },
          elevation: theme.elevation / 2,
          borderLeftWidth: 4,
          borderLeftColor: color,
        }
      ]}
    >
      <View style={styles.statContent}>
        <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {subtitle && <Text style={[styles.statSubtitle, { color: theme.textTertiary }]}>{subtitle}</Text>}
      </View>
    </View>
  );
};

// Composant pour afficher une barre dans le graphique
const BarGraph = ({ data }: { data: { label: string; value: number; maxValue: number }[] }) => {
  const theme = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyGraphContainer}>
        <Text style={[styles.emptyGraphText, { color: theme.textSecondary }]}>
          Aucune donnée disponible pour cette période
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.barGraph}>
      {data.map((item, index) => {
        // Calculer la largeur de la barre (en pourcentage)
        const widthPercentage = item.maxValue > 0 ? (item.value / item.maxValue) * 100 : 0;
        
        return (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barLabelContainer}>
              <Text style={[styles.barLabel, { color: theme.textTertiary }]}>{item.label}</Text>
            </View>
            <View 
              style={[
                styles.barBackground, 
                { 
                  backgroundColor: theme.border,
                  borderRadius: theme.borderRadiusRound,
                }
              ]}
            >
              <View 
                style={[
                  styles.barFill, 
                  { 
                    width: `${widthPercentage}%`,
                    backgroundColor: theme.primary,
                    borderRadius: theme.borderRadiusRound,
                  }
                ]}
              />
            </View>
            <Text style={[styles.barValue, { color: theme.textSecondary }]}>
              {Math.round(item.value / 60)} min
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Composant pour afficher une technique dans la liste
const TechniqueItem = ({ 
  technique, 
  color, 
  index,
  maxCount
}: { 
  technique: { name: string; count: number; percentage: number }; 
  color: string;
  index: number;
  maxCount: number;
}) => {
  const theme = useTheme();
  
  // Calculer la largeur de la barre (en pourcentage)
  const widthPercentage = maxCount > 0 ? (technique.count / maxCount) * 100 : 0;
  
  return (
    <View style={styles.techniqueItem}>
      <View style={styles.techniqueNameContainer}>
        <Text style={[styles.techniqueName, { color: theme.textPrimary }]}>
          {technique.name}
        </Text>
      </View>
      <View style={styles.techniqueBarContainer}>
        <View 
          style={[
            styles.techniqueBarBackground, 
            { 
              backgroundColor: theme.border,
              borderRadius: theme.borderRadiusRound,
            }
          ]}
        >
          <View 
            style={[
              styles.techniqueBarFill, 
              { 
                width: `${widthPercentage}%`,
                backgroundColor: color,
                borderRadius: theme.borderRadiusRound,
              }
            ]}
          />
        </View>
      </View>
      <View style={styles.techniqueStatsContainer}>
        <Text style={[styles.techniqueCount, { color: theme.textSecondary }]}>
          {technique.count}
        </Text>
        <Text style={[styles.techniquePercentage, { color: theme.textTertiary }]}>
          {Math.round(technique.percentage)}%
        </Text>
      </View>
    </View>
  );
};

// Composant principal
const StatsScreen = () => {
  const theme = useTheme();
  const { stats, getWeeklyStats, getTechniqueDistribution, loadStatsFromStorage, resetStats, syncDailyStats } = useStats();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Charger les statistiques à chaque fois que l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        setIsLoading(true);
        try {
          await loadStatsFromStorage();
          await syncDailyStats();
          console.log('Statistiques chargées et synchronisées au focus de l\'écran');
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadStats();
    }, [loadStatsFromStorage, syncDailyStats])
  );
  
  // Fonction pour rafraîchir manuellement les statistiques
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadStatsFromStorage();
      await syncDailyStats();
      console.log('Statistiques rafraîchies manuellement');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des statistiques:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadStatsFromStorage, syncDailyStats]);
  
  // Formater la durée en heures et minutes
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);
  
  // Obtenir les données pour la période sélectionnée
  const periodData = useMemo(() => {
    if (!stats) return [];
    
    let numWeeks;
    switch (selectedPeriod) {
      case 'week': numWeeks = 1; break;
      case 'month': numWeeks = 5; break;
      case 'year': numWeeks = 53; break;
      default: numWeeks = 1;
    }
    
    return getWeeklyStats(numWeeks);
  }, [stats, selectedPeriod, getWeeklyStats]);
  
  // Formater les données pour l'affichage dans le graphique
  const barData = useMemo(() => {
    if (!periodData || periodData.length === 0) return [];
    
    // Définir une valeur minimale pour maxValue (10 minutes = 600 secondes)
    const MIN_MAX_VALUE = 600;
    
    if (selectedPeriod === 'week') {
      // Afficher les 7 derniers jours avec le nom du jour
      if (periodData.length < 7) return [];
      
      const weekData = periodData.slice(-7).map(day => {
        // Formater le jour de la semaine
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        
        return {
          label: dayName,
          value: day.duration,
          maxValue: 0, // Sera calculé après
          date: day.date,
        };
      });
      
      // Calculer la valeur maximale
      const maxValue = Math.max(...weekData.map(d => d.value), MIN_MAX_VALUE);
      return weekData.map(day => ({ ...day, maxValue }));
      
    } else if (selectedPeriod === 'month') {
      // Regrouper par semaine pour le mois
      if (periodData.length < 28) return [];
      
      const monthData = periodData.slice(-28); // 4 semaines = 28 jours
      const weeklyData = [];
      
      for (let i = 0; i < 4; i++) {
        const weekStart = i * 7;
        const weekSlice = monthData.slice(weekStart, weekStart + 7);
        const totalDuration = weekSlice.reduce((sum, day) => sum + day.duration, 0);
        
        weeklyData.push({
          label: `S${i+1}`,
          value: totalDuration,
          maxValue: 0,
        });
      }
      
      // Calculer la valeur maximale
      const maxValue = Math.max(...weeklyData.map(w => w.value), MIN_MAX_VALUE);
      return weeklyData.map(week => ({ ...week, maxValue }));
      
    } else { // année
      // Regrouper par mois pour l'année
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthTotals: { [key: number]: number } = {};
      
      // Parcourir les données et les regrouper par mois
      periodData.forEach(day => {
        if (day.date && day.duration > 0) {
          const date = new Date(day.date);
          const monthKey = date.getMonth();
          if (!monthTotals[monthKey]) {
            monthTotals[monthKey] = 0;
          }
          monthTotals[monthKey] += day.duration;
        }
      });
      
      // Convertir en tableau pour l'affichage
      const monthlyData = monthNames.map((name, i) => ({
        label: name,
        value: monthTotals[i] || 0,
        maxValue: 0,
      }));
      
      // Calculer la valeur maximale
      const maxValue = Math.max(...monthlyData.map(m => m.value), MIN_MAX_VALUE);
      return monthlyData.map(month => ({ ...month, maxValue }));
    }
  }, [periodData, selectedPeriod]);
  
  // Obtenir la distribution des techniques
  const techniqueDistribution = useMemo(() => {
    return getTechniqueDistribution();
  }, [getTechniqueDistribution, stats]);
  
  // Préparer les données pour le calendrier d'activité
  const calendarData = useMemo(() => {
    return periodData.map(day => {
      // Trouver les sessions pour cette date
      const daySessions = stats.sessions.filter(session => {
        try {
          const sessionDate = new Date(session.date).toISOString().split('T')[0];
          return sessionDate === day.date;
        } catch (error) {
          return false;
        }
      });
      
      return {
        date: day.date,
        duration: day.duration,
        sessions: daySessions
      };
    });
  }, [periodData, stats.sessions]);
  
  // Fonction pour réinitialiser les statistiques
  const handleResetStats = useCallback(() => {
    Alert.alert(
      "Réinitialiser les statistiques",
      "Êtes-vous sûr de vouloir supprimer toutes vos statistiques ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Réinitialiser", 
          style: "destructive",
          onPress: async () => {
            try {
              await resetStats();
              Alert.alert("Succès", "Vos statistiques ont été réinitialisées.");
            } catch (error) {
              Alert.alert("Erreur", "Une erreur est survenue lors de la réinitialisation des statistiques.");
            }
          } 
        }
      ]
    );
  }, [resetStats]);
  
  // Afficher un indicateur de chargement si les données sont en cours de chargement
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
            Chargement des statistiques...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Statistiques</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: theme.primary }]}
              onPress={onRefresh}
            >
              <Text style={styles.buttonText}>Rafraîchir</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: theme.error }]}
              onPress={handleResetStats}
            >
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Section des statistiques principales */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Aperçu de votre pratique
          </Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Temps total" 
              value={formatDuration(stats.totalDuration)} 
              color={theme.primary}
            />
            <StatCard 
              title="Sessions" 
              value={stats.totalSessions.toString()} 
              color={theme.secondary}
            />
            <StatCard 
              title="Série actuelle" 
              value={`${stats.streak} jours`} 
              color={theme.accent}
            />
            <StatCard 
              title="Dernière session" 
              value={stats.lastSessionDate ? new Date(stats.lastSessionDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Aucune'} 
              color={theme.info}
            />
          </View>
        </View>
        
        {/* Section du graphique d'activité */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Activité
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Suivez votre temps de pratique au fil du temps
          </Text>
          
          {/* Sélecteur de période */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && { backgroundColor: theme.primaryLight },
                { borderRadius: theme.borderRadiusRound }
              ]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text 
                style={[
                  styles.periodButtonText, 
                  { color: theme.primary },
                  selectedPeriod === 'week' && { fontWeight: '700' }
                ]}
              >
                Semaine
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && { backgroundColor: theme.primaryLight },
                { borderRadius: theme.borderRadiusRound }
              ]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text 
                style={[
                  styles.periodButtonText, 
                  { color: theme.primary },
                  selectedPeriod === 'month' && { fontWeight: '700' }
                ]}
              >
                Mois
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'year' && { backgroundColor: theme.primaryLight },
                { borderRadius: theme.borderRadiusRound }
              ]}
              onPress={() => setSelectedPeriod('year')}
            >
              <Text 
                style={[
                  styles.periodButtonText, 
                  { color: theme.primary },
                  selectedPeriod === 'year' && { fontWeight: '700' }
                ]}
              >
                Année
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Graphique d'activité */}
          <View 
            style={[
              styles.graphCard, 
              { 
                backgroundColor: theme.surface,
                borderRadius: theme.borderRadiusMedium,
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: theme.shadowRadius / 2,
                shadowOffset: { width: 0, height: 3 },
                elevation: theme.elevation / 2,
              }
            ]}
          >
            <Text style={[styles.graphTitle, { color: theme.textPrimary }]}>
              {selectedPeriod === 'week' ? 'Activité de la semaine' : 
               selectedPeriod === 'month' ? 'Activité du mois' : 'Activité de l\'année'}
            </Text>
            <BarGraph data={barData} />
          </View>
        </View>
        
        {/* Section des techniques les plus pratiquées */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Techniques les plus pratiquées
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Découvrez vos techniques de respiration préférées
          </Text>
          
          {/* Liste des techniques */}
          <View 
            style={[
              styles.graphCard, 
              { 
                backgroundColor: theme.surface,
                borderRadius: theme.borderRadiusMedium,
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: theme.shadowRadius / 2,
                shadowOffset: { width: 0, height: 3 },
                elevation: theme.elevation / 2,
              }
            ]}
          >
            {techniqueDistribution.length > 0 ? (
              <View style={styles.techniqueList}>
                {techniqueDistribution.map((technique, index) => (
                  <TechniqueItem 
                    key={index}
                    technique={technique}
                    color={[theme.primary, theme.secondary, theme.accent, theme.info, theme.warning][index % 5]}
                    index={index}
                    maxCount={Math.max(...techniqueDistribution.map(t => t.count))}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyTechniquesContainer}>
                <Text style={[styles.emptyTechniquesText, { color: theme.textSecondary }]}>
                  Aucune technique pratiquée pour le moment
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Section du calendrier d'activité */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Calendrier d'activité
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Visualisez votre régularité au fil du temps
          </Text>
          
          {/* Calendrier d'activité */}
          <View 
            style={[
              styles.calendarCard, 
              { 
                backgroundColor: theme.surface,
                borderRadius: theme.borderRadiusMedium,
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: theme.shadowRadius / 2,
                shadowOffset: { width: 0, height: 3 },
                elevation: theme.elevation / 2,
              }
            ]}
          >
            <ActivityCalendar 
              data={calendarData}
              onMonthChange={(month, year) => {
                console.log(`Changement de mois: ${month + 1}/${year}`);
              }}
            />
          </View>
        </View>
        
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  periodButtonText: {
    fontSize: 14,
  },
  graphCard: {
    padding: 16,
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  barGraph: {
    marginTop: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabelContainer: {
    width: 40,
    marginRight: 8,
  },
  barLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  barBackground: {
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  barValue: {
    width: 50,
    fontSize: 12,
    textAlign: 'right',
    marginLeft: 8,
  },
  techniqueList: {
    marginTop: 8,
  },
  techniqueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  techniqueNameContainer: {
    width: 120,
    marginRight: 8,
  },
  techniqueName: {
    fontSize: 14,
  },
  techniqueBarContainer: {
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
  techniqueBarBackground: {
    width: '100%',
    height: '100%',
  },
  techniqueBarFill: {
    height: '100%',
  },
  techniqueStatsContainer: {
    width: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  techniqueCount: {
    fontSize: 12,
  },
  techniquePercentage: {
    fontSize: 12,
  },
  calendarCard: {
    padding: 16,
  },
  footer: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyGraphContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGraphText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyTechniquesContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTechniquesText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default StatsScreen;
