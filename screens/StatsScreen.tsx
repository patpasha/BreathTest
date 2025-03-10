import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../App';
import { useTheme } from '../theme/ThemeContext';
import { useStats } from '../contexts/StatsContext';
import ActivityCalendar from '../components/ActivityCalendar';

type StatsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'StatsTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    // Animation simple en utilisant setTimeout
    let progress = 0;
    const animationStep = 0.05;
    const animationDuration = 20; // ms par étape
    
    const animate = () => {
      progress += animationStep;
      setAnimationProgress(progress);
      
      if (progress < 1) {
        setTimeout(animate, animationDuration);
      }
    };
    
    animate();
    
    return () => {
      // Nettoyer l'animation si le composant est démonté
      progress = 1;
    };
  }, [data]);
  
  return (
    <View style={styles.barGraph}>
      {data.map((item, index) => {
        // Calculer la largeur animée de la barre (en pourcentage)
        const widthPercentage = (item.value / item.maxValue) * 100 * animationProgress;
        
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
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    // Animation simple en utilisant setTimeout
    let progress = 0;
    const animationStep = 0.05;
    const animationDuration = 20; // ms par étape
    
    const animate = () => {
      progress += animationStep;
      setAnimationProgress(progress);
      
      if (progress < 1) {
        setTimeout(animate, animationDuration);
      }
    };
    
    animate();
    
    return () => {
      // Nettoyer l'animation si le composant est démonté
      progress = 1;
    };
  }, []);
  
  // Calculer la largeur animée de la barre (en pourcentage)
  const widthPercentage = (technique.count / maxCount) * 100 * animationProgress;
  
  return (
    <View style={styles.techniqueItem}>
      <View style={styles.techniqueHeader}>
        <View style={styles.techniqueNameContainer}>
          <View 
            style={[
              styles.techniqueColorDot, 
              { backgroundColor: color }
            ]} 
          />
          <Text style={[styles.techniqueName, { color: theme.textPrimary }]}>
            {technique.name}
          </Text>
        </View>
        <Text style={[styles.techniqueCount, { color: theme.textSecondary }]}>
          {technique.count} ({Math.round(technique.percentage)}%)
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
    </View>
  );
};

const StatsScreen = () => {
  const theme = useTheme();
  const { stats, getWeeklyStats, getTechniqueDistribution, loadStatsFromStorage, resetStats } = useStats();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [refreshing, setRefreshing] = useState(false);
  
  // Charger les statistiques à chaque fois que l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        setRefreshing(true);
        try {
          await loadStatsFromStorage();
          console.log('Statistiques chargées automatiquement au focus de l\'écran');
        } catch (error) {
          console.error('Erreur lors du chargement automatique des statistiques:', error);
        } finally {
          setRefreshing(false);
        }
      };
      
      loadStats();
      
      return () => {
        // Nettoyage si nécessaire
      };
    }, [loadStatsFromStorage])
  );
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadStatsFromStorage();
      console.log('Statistiques rafraîchies');
      console.log('Sessions enregistrées:', stats.sessions.length);
      console.log('Détail des sessions:', JSON.stringify(stats.sessions));
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des statistiques:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadStatsFromStorage, stats.sessions]);
  
  // Formater la durée en heures et minutes
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  // Déterminer le nombre de jours à afficher en fonction de la période sélectionnée
  const getPeriodData = () => {
    console.log('getPeriodData appelé avec période:', selectedPeriod);
    let result;
    switch (selectedPeriod) {
      case 'week':
        console.log('Récupération des données pour la semaine');
        result = getWeeklyStats(1); // 7 derniers jours
        break;
      case 'month':
        console.log('Récupération des données pour le mois');
        result = getWeeklyStats(5); // ~30 derniers jours (4 semaines complètes + quelques jours)
        break;
      case 'year':
        console.log('Récupération des données pour l\'année');
        result = getWeeklyStats(53); // ~365 derniers jours (52 semaines complètes + quelques jours)
        break;
      default:
        console.log('Période non reconnue, utilisation de la semaine par défaut');
        result = getWeeklyStats(1);
    }
    console.log('Résultat getPeriodData:', result.length, 'jours, dont', 
                result.filter(d => d.duration > 0).length, 'avec activité');
    return result;
  };
  
  // Générer les données pour le graphique
  const [periodData, setPeriodData] = useState<{ date: string; duration: number }[]>([]);
  
  // Initialiser les données au chargement et les mettre à jour quand les stats changent
  useEffect(() => {
    console.log('StatsScreen: Initialisation/mise à jour des données suite à changement de stats ou de période');
    if (stats) {
      const data = getPeriodData();
      console.log('periodData mis à jour:', data.length, 'jours, dont', data.filter(d => d.duration > 0).length, 'avec activité');
      console.log('Détail des données de période:', JSON.stringify(data.filter(d => d.duration > 0)));
      setPeriodData(data);
    }
  }, [stats, selectedPeriod]); // Dépend de stats ET selectedPeriod pour garantir la mise à jour
  
  // Mettre à jour les données du graphique lorsque les données de période changent
  useEffect(() => {
    console.log(`StatsScreen: Mise à jour des graphiques avec ${periodData.length} jours`);
    if (periodData.length > 0) {
      try {
        const data = getBarData();
        console.log(`StatsScreen: ${data.length} barres générées pour le graphique`);
        setBarData(data);
      } catch (error) {
        console.error('Erreur lors de la génération des données du graphique:', error);
        // En cas d'erreur, on réinitialise les données du graphique
        setBarData([]);
      }
    } else {
      console.log('StatsScreen: Aucune donnée disponible pour les graphiques');
      setBarData([]);
    }
  }, [periodData]); // Dépend uniquement de periodData
  
  // Formater les données pour l'affichage dans le graphique
  const getBarData = () => {
    // Définir une valeur minimale pour maxValue (10 minutes = 600 secondes)
    const MIN_MAX_VALUE = 600;
    
    if (selectedPeriod === 'week') {
      // Afficher les 7 derniers jours avec le nom du jour
      // Assurons-nous d'avoir des données pour les 7 derniers jours
      if (periodData.length < 7) {
        console.log('Pas assez de données pour la semaine');
        return [];
      }
      
      const weekData = periodData.slice(-7).map(day => {
        // Formater le jour de la semaine
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        
        return {
          label: dayName,
          value: day.duration,
          maxValue: 0, // Sera calculé après
          date: day.date, // Conserver la date pour le débogage
        };
      });
      
      console.log('Données de la semaine:', JSON.stringify(weekData));
      
      // Calculer la valeur maximale
      const maxValue = Math.max(...weekData.map(d => d.value), MIN_MAX_VALUE);
      return weekData.map(day => ({ ...day, maxValue }));
      
    } else if (selectedPeriod === 'month') {
      // Regrouper par semaine pour le mois
      const weeklyData = [];
      
      // Assurons-nous d'avoir des données pour les 28 derniers jours
      if (periodData.length < 28) {
        console.log('Pas assez de données pour le mois');
        return [];
      }
      
      // Utiliser les 4 dernières semaines
      const monthData = periodData.slice(-28); // 4 semaines = 28 jours
      const numWeeks = 4;
      const daysPerWeek = 7;
      
      for (let i = 0; i < numWeeks; i++) {
        const weekStart = i * daysPerWeek;
        const weekEnd = weekStart + daysPerWeek;
        const weekSlice = monthData.slice(weekStart, weekEnd);
        const totalDuration = weekSlice.reduce((sum, day) => sum + day.duration, 0);
        
        // Trouver la date de début de la semaine pour l'affichage
        const weekStartDate = weekSlice[0]?.date ? new Date(weekSlice[0].date) : new Date();
        const weekLabel = `S${i+1}`;
        
        weeklyData.push({
          label: weekLabel,
          value: totalDuration,
          maxValue: 0, // Sera calculé après
          startDate: weekSlice[0]?.date, // Pour le débogage
        });
      }
      
      console.log('Données du mois:', JSON.stringify(weeklyData));
      
      // Calculer la valeur maximale
      const maxValue = Math.max(...weeklyData.map(w => w.value), MIN_MAX_VALUE);
      return weeklyData.map(week => ({ ...week, maxValue }));
      
    } else { // année
      // Regrouper par mois pour l'année
      const monthlyData = [];
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      
      // Assurons-nous d'avoir des données pour l'année
      if (periodData.length < 30) {
        console.log('Pas assez de données pour l\'année');
        return [];
      }
      
      // Créer un objet pour stocker les données par mois
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
      
      console.log('Totaux par mois:', JSON.stringify(monthTotals));
      
      // Convertir en tableau pour l'affichage
      for (let i = 0; i < 12; i++) {
        monthlyData.push({
          label: monthNames[i],
          value: monthTotals[i] || 0,
          maxValue: 0, // Sera calculé après
          monthIndex: i, // Pour le débogage
        });
      }
      
      // Calculer la valeur maximale
      const maxValue = Math.max(...monthlyData.map(m => m.value), MIN_MAX_VALUE);
      return monthlyData.map(month => ({ ...month, maxValue }));
    }
  };
  
  // Générer les données pour les graphiques
  const [barData, setBarData] = useState<{ label: string; value: number; maxValue: number }[]>([]);
  const weeklyData = periodData; // Pour le calendrier d'activité
  
  // Générer les données pour le graphique de distribution des techniques
  const techniqueDistribution = getTechniqueDistribution();
  
  // Couleurs pour le graphique circulaire
  const pieColors = [
    theme.primary,
    theme.secondary,
    theme.accent,
    theme.info,
    theme.warning,
  ];
  
  // Fonction pour réinitialiser les statistiques
  const handleResetStats = async () => {
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
              console.log('Statistiques réinitialisées avec succès');
              Alert.alert("Succès", "Vos statistiques ont été réinitialisées.");
            } catch (error) {
              console.error('Erreur lors de la réinitialisation des statistiques:', error);
              Alert.alert("Erreur", "Une erreur est survenue lors de la réinitialisation des statistiques.");
            }
          } 
        }
      ]
    );
  };
  
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
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: theme.error }]}
            onPress={handleResetStats}
          >
            <Text style={styles.resetButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
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
            Techniques
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
            <Text style={[styles.graphTitle, { color: theme.textPrimary }]}>Techniques les plus pratiquées</Text>
            
            <View style={styles.techniquesList}>
              {techniqueDistribution.length > 0 ? (
                techniqueDistribution.slice(0, 5).map((technique, index) => {
                  // Trouver la valeur maximale pour dimensionner les barres
                  const maxCount = Math.max(...techniqueDistribution.map(t => t.count));
                  
                  return (
                    <TechniqueItem 
                      key={index}
                      technique={technique}
                      color={pieColors[index % pieColors.length]}
                      index={index}
                      maxCount={maxCount}
                    />
                  );
                })
              ) : (
                <Text style={[styles.emptyMessage, { color: theme.textTertiary }]}>
                  Aucune technique pratiquée pour le moment
                </Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Calendrier d'activité */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Calendrier
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Visualisez votre pratique quotidienne
          </Text>
          
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
            <ActivityCalendar 
              data={periodData.map(day => {
                // Récupérer les sessions pour ce jour
                const daySessions = stats.sessions.filter(session => {
                  try {
                    const sessionDate = new Date(session.date);
                    const dayDate = new Date(day.date);
                    return sessionDate.getFullYear() === dayDate.getFullYear() &&
                          sessionDate.getMonth() === dayDate.getMonth() &&
                          sessionDate.getDate() === dayDate.getDate();
                  } catch (error) {
                    console.error(`Erreur lors du filtrage des sessions pour ${day.date}:`, error);
                    return false;
                  }
                });
                
                // Vérifier si la durée est cohérente avec les sessions
                let totalSessionsDuration = 0;
                if (daySessions.length > 0) {
                  totalSessionsDuration = daySessions.reduce((sum, session) => sum + session.duration, 0);
                  
                  // Si la durée des sessions est différente de la durée du jour, utiliser la plus grande
                  if (totalSessionsDuration > day.duration) {
                    console.log(`Correction de la durée pour ${day.date}: ${day.duration}s -> ${totalSessionsDuration}s`);
                  }
                }
                
                return {
                  date: day.date,
                  duration: Math.max(day.duration, totalSessionsDuration),
                  sessions: daySessions
                };
              })}
              onMonthChange={(month, year) => {
                console.log(`Changement de mois: ${month + 1}/${year}`);
                // Ici on pourrait charger des données spécifiques pour ce mois
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    padding: 15,
    marginBottom: 15,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  periodButtonText: {
    fontSize: 14,
  },
  graphCard: {
    padding: 20,
    marginBottom: 20,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  graphSubtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  barGraph: {
    marginTop: 10,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barLabelContainer: {
    width: 40,
  },
  barLabel: {
    fontSize: 12,
  },
  barBackground: {
    height: 10,
    flex: 1,
    marginHorizontal: 10,
  },
  barFill: {
    height: '100%',
  },
  barValue: {
    width: 50,
    fontSize: 12,
    textAlign: 'right',
  },
  techniquesList: {
    marginTop: 15,
  },
  techniqueItem: {
    marginBottom: 16,
  },
  techniqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  techniqueNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  techniqueColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  techniqueName: {
    fontSize: 15,
    fontWeight: '500',
  },
  techniqueCount: {
    fontSize: 14,
  },
  techniqueBarContainer: {
    marginTop: 2,
  },
  techniqueBarBackground: {
    height: 8,
    width: '100%',
  },
  techniqueBarFill: {
    height: '100%',
  },
  emptyMessage: {
    marginTop: 15,
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    height: 20,
  },
});

export default StatsScreen;
