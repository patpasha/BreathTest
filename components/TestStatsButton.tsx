import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useStats } from '../contexts/StatsContext';

// Fonction pour générer un ID unique
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Fonction pour générer une date aléatoire dans les 30 derniers jours
const generateRandomDate = (daysBack = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString();
};

// Liste des techniques de respiration
const techniques = [
  { id: 'physiological-sigh', name: 'Soupir Physiologique' },
  { id: '478', name: 'Respiration 4-7-8' },
  { id: 'coherente', name: 'Respiration Cohérente' },
  { id: 'diaphragmatique', name: 'Respiration Diaphragmatique' },
  { id: 'box', name: 'Respiration Carrée' },
  { id: 'cyclic-hyperventilation', name: 'Hyperventilation Cyclique' },
  { id: 'wim-hof', name: 'Méthode Wim Hof' },
  { id: 'alternee', name: 'Respiration Alternée' },
  { id: 'buteyko', name: 'Méthode Buteyko' },
  { id: 'ujjayi', name: 'Respiration Ujjayi' },
  { id: 'tummo', name: 'Respiration Tummo' },
];

// Fonction pour générer une session aléatoire
const generateRandomSession = () => {
  const technique = techniques[Math.floor(Math.random() * techniques.length)];
  const date = generateRandomDate();
  const duration = Math.floor(Math.random() * 600) + 60; // Entre 60 et 660 secondes
  
  return {
    id: generateId(),
    techniqueId: technique.id,
    techniqueName: technique.name,
    duration: duration,
    date: date,
    completed: Math.random() > 0.2, // 80% des sessions sont complétées
  };
};

// Fonction pour générer les statistiques quotidiennes
const generateDailyStats = (sessions: any[]) => {
  const dailyStats: Record<string, any> = {};
  
  sessions.forEach(session => {
    const dateStr = session.date.split('T')[0];
    
    if (!dailyStats[dateStr]) {
      dailyStats[dateStr] = {
        date: dateStr,
        totalDuration: 0,
        sessionsCount: 0,
        techniques: {}
      };
    }
    
    dailyStats[dateStr].totalDuration += session.duration;
    dailyStats[dateStr].sessionsCount += 1;
    
    if (!dailyStats[dateStr].techniques[session.techniqueId]) {
      dailyStats[dateStr].techniques[session.techniqueId] = 0;
    }
    
    dailyStats[dateStr].techniques[session.techniqueId] += 1;
  });
  
  return dailyStats;
};

// Fonction pour générer les techniques favorites
const generateFavoriteTechniques = (sessions: any[]) => {
  const favoriteTechniques: Record<string, number> = {};
  
  sessions.forEach(session => {
    if (!favoriteTechniques[session.techniqueId]) {
      favoriteTechniques[session.techniqueId] = 0;
    }
    
    favoriteTechniques[session.techniqueId] += 1;
  });
  
  return favoriteTechniques;
};

// Fonction principale pour générer et sauvegarder les statistiques
const generateAndSaveStats = async (numSessions = 50) => {
  try {
    // Générer des sessions aléatoires
    const sessions = Array(numSessions).fill(null).map(() => generateRandomSession());
    
    // Trier les sessions par date (de la plus récente à la plus ancienne)
    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Générer les statistiques quotidiennes
    const dailyStats = generateDailyStats(sessions);
    
    // Générer les techniques favorites
    const favoriteTechniques = generateFavoriteTechniques(sessions);
    
    // Calculer les statistiques globales
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((total, session) => total + session.duration, 0);
    const lastSessionDate = sessions[0].date;
    
    // Créer l'objet de statistiques
    const stats = {
      totalSessions,
      totalDuration,
      lastSessionDate,
      streak: Math.floor(Math.random() * 10) + 1, // Streak aléatoire entre 1 et 10
      maxStreak: Math.floor(Math.random() * 20) + 10, // Max streak aléatoire entre 10 et 30
      lastStreakMilestone: 7, // Dernier jalon atteint (3, 7, 14, 21, 30, 60, 90, 180, 365)
      streakMilestoneMessage: "Félicitations ! Vous avez pratiqué pendant 7 jours consécutifs !",
      sessions,
      dailyStats,
      favoriteTechniques,
    };
    
    // Sauvegarder les statistiques dans AsyncStorage
    await AsyncStorage.setItem('breathflow_stats', JSON.stringify(stats));
    
    console.log(`${numSessions} sessions générées et sauvegardées avec succès.`);
    console.log(`Total des sessions: ${totalSessions}`);
    console.log(`Durée totale: ${totalDuration} secondes`);
    console.log(`Dernière session: ${lastSessionDate}`);
    console.log(`Streak actuel: ${stats.streak} jours`);
    console.log(`Streak maximum: ${stats.maxStreak} jours`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la génération et de la sauvegarde des statistiques:', error);
    return false;
  }
};

// Composant bouton pour tester les statistiques
const TestStatsButton = () => {
  const theme = useTheme();
  const { loadStatsFromStorage } = useStats();
  
  const handlePress = async () => {
    try {
      // Générer et sauvegarder 50 sessions aléatoires
      const result = await generateAndSaveStats(50);
      
      if (result) {
        // Recharger les statistiques
        await loadStatsFromStorage();
        
        Alert.alert(
          "Test des statistiques",
          "50 sessions aléatoires ont été générées et sauvegardées avec succès. Les statistiques ont été rechargées.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Erreur",
          "Une erreur s'est produite lors de la génération des statistiques.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Erreur lors du test des statistiques:', error);
      
      Alert.alert(
        "Erreur",
        "Une erreur s'est produite lors du test des statistiques.",
        [{ text: "OK" }]
      );
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.primary }
      ]}
      onPress={handlePress}
    >
      <Text style={[styles.buttonText, { color: theme.textPrimary }]}>
        Générer des données de test
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TestStatsButton;
