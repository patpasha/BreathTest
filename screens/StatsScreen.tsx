import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useStats } from '../contexts/StatsContext';

// Composant pour afficher une carte de statistique
const StatCard = ({ title, value, color }: { title: string; value: string; color: string }) => {
  const theme = useTheme();
  
  return (
    <View 
      style={[
        styles.statCard, 
        { 
          backgroundColor: theme.surface,
          borderRadius: 12,
          shadowColor: theme.shadowColor,
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          borderLeftWidth: 4,
          borderLeftColor: color,
        }
      ]}
    >
      <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
      <Text style={[styles.statValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
};

// Composant pour afficher une barre dans le graphique d'activité
const ActivityBar = ({ label, value, maxValue }: { label: string; value: number; maxValue: number }) => {
  const theme = useTheme();
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  
  return (
    <View style={styles.barContainer}>
      <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.barBackground, { backgroundColor: theme.border, borderRadius: 4 }]}>
        <View 
          style={[
            styles.barFill, 
            { 
              width: `${percentage}%`, 
              backgroundColor: theme.primary,
              borderRadius: 4
            }
          ]} 
        />
      </View>
      <Text style={[styles.barValue, { color: theme.textSecondary }]}>
        {Math.round(value / 60)} min
      </Text>
    </View>
  );
};

// Composant pour afficher une technique dans la liste
const TechniqueItem = ({ name, count, percentage, color }: { name: string; count: number; percentage: number; color: string }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.techniqueItem}>
      <View style={styles.techniqueInfo}>
        <Text style={[styles.techniqueName, { color: theme.textPrimary }]}>{name}</Text>
        <Text style={[styles.techniqueStats, { color: theme.textSecondary }]}>
          {count} sessions ({Math.round(percentage)}%)
        </Text>
      </View>
      <View 
        style={[
          styles.techniqueIndicator, 
          { 
            backgroundColor: color,
            opacity: 0.2 + (percentage / 100) * 0.8
          }
        ]} 
      />
    </View>
  );
};

// Écran principal des statistiques
const StatsScreen = () => {
  const theme = useTheme();
  const { 
    stats, 
    loadStatsFromStorage, 
    syncDailyStats, 
    getWeeklyStats, 
    getTechniqueDistribution,
    resetStats
  } = useStats();
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Charger les statistiques lorsque l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          await loadStatsFromStorage();
          await syncDailyStats();
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      };
      
      loadData();
    }, [loadStatsFromStorage, syncDailyStats])
  );
  
  // Fonction pour rafraîchir les données
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadStatsFromStorage();
      await syncDailyStats();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des statistiques:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadStatsFromStorage, syncDailyStats]);
  
  // Fonction pour réinitialiser les statistiques
  const handleReset = useCallback(() => {
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
              console.error('Erreur lors de la réinitialisation des statistiques:', error);
              Alert.alert("Erreur", "Une erreur est survenue lors de la réinitialisation des statistiques.");
            }
          }
        }
      ]
    );
  }, [resetStats]);
  
  // Formater la durée en heures et minutes
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  // Obtenir les données d'activité pour la semaine
  const getActivityData = () => {
    try {
      const weeklyData = getWeeklyStats(1); // Dernière semaine
      
      if (!weeklyData || weeklyData.length === 0) {
        return [];
      }
      
      // Prendre les 7 derniers jours
      const last7Days = weeklyData.slice(-7);
      
      // Formater les données pour l'affichage
      return last7Days.map(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        
        return {
          label: dayName,
          value: day.duration,
          date: day.date
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des données d\'activité:', error);
      return [];
    }
  };
  
  // Obtenir les techniques les plus pratiquées
  const getTopTechniques = () => {
    try {
      const techniques = getTechniqueDistribution();
      return techniques.slice(0, 5); // Prendre les 5 premières techniques
    } catch (error) {
      console.error('Erreur lors de la récupération des techniques:', error);
      return [];
    }
  };
  
  // Vérifier si des données sont disponibles
  const hasData = stats && stats.totalSessions > 0;
  
  // Préparer les données
  const activityData = hasData ? getActivityData() : [];
  const topTechniques = hasData ? getTopTechniques() : [];
  
  // Calculer la valeur maximale pour les barres d'activité
  const maxActivityValue = activityData.length > 0 
    ? Math.max(...activityData.map(d => d.value), 600) // Minimum 10 minutes
    : 600;
  
  // Couleurs pour les techniques
  const techniqueColors = [
    theme.primary,
    theme.secondary,
    theme.accent,
    theme.info,
    theme.warning
  ];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Statistiques</Text>
          
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: theme.error }]}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
        
        {hasData ? (
          <>
            {/* Aperçu */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Aperçu
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
                  value={stats.lastSessionDate 
                    ? new Date(stats.lastSessionDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) 
                    : 'Aucune'
                  } 
                  color={theme.info}
                />
              </View>
            </View>
            
            {/* Activité récente */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Activité récente
              </Text>
              
              {activityData.length > 0 ? (
                <View 
                  style={[
                    styles.card, 
                    { 
                      backgroundColor: theme.surface,
                      borderRadius: 12,
                      shadowColor: theme.shadowColor,
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2
                    }
                  ]}
                >
                  {activityData.map((day, index) => (
                    <ActivityBar 
                      key={index}
                      label={day.label}
                      value={day.value}
                      maxValue={maxActivityValue}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Aucune activité récente
                  </Text>
                </View>
              )}
            </View>
            
            {/* Techniques les plus pratiquées */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Techniques les plus pratiquées
              </Text>
              
              {topTechniques.length > 0 ? (
                <View 
                  style={[
                    styles.card, 
                    { 
                      backgroundColor: theme.surface,
                      borderRadius: 12,
                      shadowColor: theme.shadowColor,
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2
                    }
                  ]}
                >
                  {topTechniques.map((technique, index) => (
                    <TechniqueItem 
                      key={index}
                      name={technique.name}
                      count={technique.count}
                      percentage={technique.percentage}
                      color={techniqueColors[index % techniqueColors.length]}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Aucune technique pratiquée
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
              Aucune statistique disponible
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Pratiquez des techniques de respiration pour voir apparaître des statistiques.
            </Text>
          </View>
        )}
        
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  statTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    padding: 16,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 40,
    fontSize: 12,
    textAlign: 'center',
  },
  barBackground: {
    flex: 1,
    height: 8,
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
  },
  barValue: {
    width: 40,
    fontSize: 12,
    textAlign: 'right',
  },
  techniqueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  techniqueInfo: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  techniqueStats: {
    fontSize: 12,
  },
  techniqueIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
});

export default StatsScreen;
