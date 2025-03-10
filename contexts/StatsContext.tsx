import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types pour les statistiques
export type SessionData = {
  id: string;
  techniqueId: string;
  techniqueName: string;
  duration: number; // en secondes
  date: string; // format ISO
  completed: boolean;
};

export type DailyStats = {
  date: string; // format YYYY-MM-DD
  totalDuration: number; // en secondes
  sessionsCount: number;
  techniques: { [techniqueId: string]: number }; // techniqueId: count
};

export type Stats = {
  totalSessions: number;
  totalDuration: number; // en secondes
  lastSessionDate: string | null;
  streak: number; // jours consécutifs
  maxStreak?: number; // record de jours consécutifs
  lastStreakMilestone?: number | null; // dernier jalon de streak atteint
  streakMilestoneMessage?: string | null; // message associé au dernier jalon
  sessions: SessionData[];
  dailyStats: { [date: string]: DailyStats }; // date: stats
  favoriteTechniques: { [techniqueId: string]: number }; // techniqueId: count
};

// État initial des statistiques
const initialStats: Stats = {
  totalSessions: 0,
  totalDuration: 0,
  lastSessionDate: null,
  streak: 0,
  maxStreak: 0,
  lastStreakMilestone: null,
  streakMilestoneMessage: null,
  sessions: [],
  dailyStats: {},
  favoriteTechniques: {},
};

// Contexte pour les statistiques
type StatsContextType = {
  stats: Stats;
  addSession: (session: Omit<SessionData, 'id'>) => Promise<{ success: boolean; milestone?: number | null; milestoneMessage?: string | null }>;
  resetStats: () => Promise<void>;
  loadStatsFromStorage: () => Promise<boolean>;
  syncDailyStats: () => Promise<boolean>;
  getWeeklyStats: (numWeeks?: number) => { date: string; duration: number }[];
  getTechniqueDistribution: () => { name: string; count: number; percentage: number }[];
  getStreakInfo: () => { current: number; max: number; lastMilestone: number | null; nextMilestone: number | null };
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

// Provider pour les statistiques
export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<Stats>(initialStats);
  
  // Synchroniser les statistiques quotidiennes avec les sessions
  const syncDailyStats = useCallback(async () => {
    console.log('Synchronisation des statistiques quotidiennes avec les sessions...');
    
    // Créer un dictionnaire des sessions par date
    const sessionsByDate: { [date: string]: SessionData[] } = {};
    stats.sessions.forEach(session => {
      try {
        const sessionDate = new Date(session.date).toISOString().split('T')[0];
        if (!sessionsByDate[sessionDate]) {
          sessionsByDate[sessionDate] = [];
        }
        sessionsByDate[sessionDate].push(session);
      } catch (error) {
        console.error(`Erreur lors du traitement de la session ${session.id}:`, error);
      }
    });
    
    // Vérifier s'il y a des incohérences entre les sessions et dailyStats
    let statsUpdated = false;
    const updatedDailyStats = { ...stats.dailyStats };
    
    // Vérifier chaque date de session pour s'assurer qu'elle a une entrée dans dailyStats
    Object.keys(sessionsByDate).forEach(dateString => {
      if (sessionsByDate[dateString].length > 0) {
        // Si nous n'avons pas d'entrée dans dailyStats pour cette date ou si la durée est différente
        const sessionsForDate = sessionsByDate[dateString];
        const totalSessionsDuration = sessionsForDate.reduce((sum, session) => sum + session.duration, 0);
        
        const needsUpdate = !updatedDailyStats[dateString] || 
                           updatedDailyStats[dateString].totalDuration !== totalSessionsDuration ||
                           updatedDailyStats[dateString].sessionsCount !== sessionsForDate.length;
        
        if (needsUpdate) {
          console.log(`Mise à jour nécessaire pour ${dateString}: 
            - Sessions: ${sessionsForDate.length}
            - Durée totale des sessions: ${totalSessionsDuration}
            - Entrée existante dans dailyStats: ${updatedDailyStats[dateString] ? 'Oui' : 'Non'}
            - Durée dans dailyStats: ${updatedDailyStats[dateString]?.totalDuration || 0}
            - Nombre de sessions dans dailyStats: ${updatedDailyStats[dateString]?.sessionsCount || 0}`);
          
          // Créer ou mettre à jour l'entrée dans dailyStats
          updatedDailyStats[dateString] = {
            date: dateString,
            totalDuration: totalSessionsDuration,
            sessionsCount: sessionsForDate.length,
            techniques: {},
          };
          
          // Mettre à jour les techniques utilisées ce jour-là
          sessionsForDate.forEach(session => {
            if (!updatedDailyStats[dateString].techniques[session.techniqueId]) {
              updatedDailyStats[dateString].techniques[session.techniqueId] = 0;
            }
            updatedDailyStats[dateString].techniques[session.techniqueId] += 1;
          });
          
          statsUpdated = true;
        }
      }
    });
    
    // Si des mises à jour ont été effectuées, mettre à jour l'état et sauvegarder
    if (statsUpdated) {
      console.log('Mise à jour des statistiques quotidiennes suite à des incohérences détectées');
      
      const updatedStats = {
        ...stats,
        dailyStats: updatedDailyStats
      };
      
      // Mettre à jour l'état
      setStats(updatedStats);
      
      // Sauvegarder dans AsyncStorage
      try {
        await AsyncStorage.setItem('breathflow_stats', JSON.stringify(updatedStats));
        console.log('Statistiques mises à jour sauvegardées avec succès');
        return true;
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des statistiques mises à jour:', error);
        return false;
      }
    }
    
    return false;
  }, [stats]);
  
  // Améliorer la fonction loadStatsFromStorage pour synchroniser les données après le chargement
  const loadStatsFromStorage = async () => {
    try {
      const storedStats = await AsyncStorage.getItem('breathflow_stats');
      console.log('Chargement des statistiques depuis AsyncStorage:', storedStats ? 'Données trouvées' : 'Aucune donnée'); // Debug
      
      if (storedStats) {
        try {
          const parsedStats = JSON.parse(storedStats);
          console.log('Stats chargées:', parsedStats.totalSessions, 'sessions,', parsedStats.totalDuration, 'secondes'); // Debug
          
          // Vérifier si les sessions sont présentes
          if (parsedStats.sessions) {
            console.log('Sessions chargées:', parsedStats.sessions.length);
            if (parsedStats.sessions.length > 0) {
              console.log('Première session:', JSON.stringify(parsedStats.sessions[0]));
            }
          } else {
            console.warn('Aucune session trouvée dans les statistiques chargées');
            parsedStats.sessions = [];
          }
          
          // Vérifier si dailyStats est présent
          if (parsedStats.dailyStats) {
            console.log('DailyStats chargées:', Object.keys(parsedStats.dailyStats).length, 'jours');
          } else {
            console.warn('Aucune statistique quotidienne trouvée');
            parsedStats.dailyStats = {};
          }
          
          // Mettre à jour l'état avec les statistiques chargées
          setStats(parsedStats);
          
          // Planifier une synchronisation des données après le chargement
          setTimeout(() => {
            syncDailyStats();
          }, 100);
          
          return true;
        } catch (parseError) {
          console.error('Erreur lors du parsing des statistiques:', parseError);
          console.log('Contenu brut des statistiques:', storedStats);
          return false;
        }
      } else {
        console.log('Aucune statistique trouvée dans AsyncStorage');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      return false;
    }
  };
  
  // Charger les statistiques au démarrage
  useEffect(() => {
    loadStatsFromStorage();
  }, []);
  
  // Note: La sauvegarde automatique a été désactivée car elle pouvait causer des problèmes
  // La sauvegarde est maintenant effectuée directement dans la fonction addSession
  // pour garantir que les données sont bien enregistrées
  
  // Calculer le streak (jours consécutifs)
  const calculateStreak = (lastDate: string | null, dailyStats: { [date: string]: DailyStats }) => {
    if (!lastDate) return 0;
    
    try {
      // Obtenir la date actuelle et la normaliser à minuit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastSessionDate = new Date(lastDate);
      lastSessionDate.setHours(0, 0, 0, 0);
      
      // Si la dernière session date d'avant hier, le streak est rompu
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      console.log(`Calcul du streak - Aujourd'hui: ${today.toISOString()}, Dernière session: ${lastSessionDate.toISOString()}, Hier: ${yesterday.toISOString()}`);
      
      if (lastSessionDate < yesterday) {
        console.log('Streak rompu: la dernière session date d\'avant hier');
        return 0;
      }
      
      // Convertir les clés de dailyStats en dates pour faciliter la comparaison
      const dailyStatsKeys = Object.keys(dailyStats).sort();
      const dailyStatsDates = dailyStatsKeys.map(dateStr => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date;
      });
      
      // Calculer le streak
      let streak = 0;
      let currentDate = new Date(today);
      
      // Ajouter aujourd'hui au streak si une session a été effectuée aujourd'hui
      const todayString = today.toISOString().split('T')[0];
      const hasActivityToday = todayString in dailyStats || (
        lastSessionDate.getDate() === today.getDate() && 
        lastSessionDate.getMonth() === today.getMonth() && 
        lastSessionDate.getFullYear() === today.getFullYear()
      );
      
      if (hasActivityToday) {
        streak = 1;
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      // Vérifier les jours précédents
      while (true) {
        const dateString = currentDate.toISOString().split('T')[0];
        if (dateString in dailyStats) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // Vérifier si une session existe pour cette date
          const sessionOnDate = dailyStatsDates.some(date => 
            date.getDate() === currentDate.getDate() &&
            date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear()
          );
          
          if (sessionOnDate) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      
      console.log(`Streak calculé: ${streak} jours`);
      return streak;
    } catch (error) {
      console.error('Erreur lors du calcul du streak:', error);
      return 0;
    }
  };
  
  // Vérifier si l'utilisateur a atteint un nouveau jalon de streak
  const checkStreakMilestone = (currentStreak: number, previousStreak: number) => {
    // Définir les jalons importants
    const milestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];
    
    // Vérifier si un nouveau jalon a été atteint
    for (const milestone of milestones) {
      if (currentStreak >= milestone && previousStreak < milestone) {
        return milestone;
      }
    }
    
    return null;
  };
  
  // Obtenir un message de félicitation basé sur le jalon atteint
  const getStreakMilestoneMessage = (milestone: number) => {
    switch (milestone) {
      case 3:
        return "Félicitations ! Vous avez pratiqué 3 jours de suite. Continuez ainsi !";
      case 7:
        return "Bravo ! Une semaine complète de pratique quotidienne. Vous êtes sur la bonne voie !";
      case 14:
        return "Impressionnant ! 2 semaines de pratique consécutive. Vous commencez à former une habitude !";
      case 21:
        return "Félicitations ! 21 jours de pratique - vous avez formé une nouvelle habitude !";
      case 30:
        return "Un mois complet de pratique quotidienne ! Votre engagement est remarquable !";
      case 60:
        return "Deux mois de pratique quotidienne ! Votre dévouement est inspirant !";
      case 90:
        return "Trois mois consécutifs ! Vous êtes maintenant un pratiquant régulier !";
      case 180:
        return "Six mois de pratique quotidienne ! Vous êtes un véritable maître de la respiration !";
      case 365:
        return "UN AN DE PRATIQUE QUOTIDIENNE ! Vous avez atteint le niveau ultime de dévouement !";
      default:
        return `Félicitations pour votre série de ${milestone} jours !`;
    }
  };
  
  // Ajouter une session
  const addSession = async (sessionData: Omit<SessionData, 'id'>) => {
    console.log('Ajout d\'une nouvelle session:', sessionData); // Debug
    
    try {
      const sessionId = Date.now().toString();
      const newSession: SessionData = {
        ...sessionData,
        id: sessionId,
      };
      
      // Extraire la date (YYYY-MM-DD) de la date ISO
      const sessionDate = new Date(sessionData.date).toISOString().split('T')[0];
      console.log('Date de la session:', sessionDate);
      
      // Créer une copie des statistiques actuelles
      const updatedStats = { ...stats };
      
      // Mettre à jour les statistiques quotidiennes
      if (!updatedStats.dailyStats[sessionDate]) {
        console.log('Création d\'une nouvelle entrée pour la date:', sessionDate);
        updatedStats.dailyStats[sessionDate] = {
          date: sessionDate,
          totalDuration: 0,
          sessionsCount: 0,
          techniques: {},
        };
      }
      
      updatedStats.dailyStats[sessionDate].totalDuration += sessionData.duration;
      updatedStats.dailyStats[sessionDate].sessionsCount += 1;
      
      if (!updatedStats.dailyStats[sessionDate].techniques[sessionData.techniqueId]) {
        updatedStats.dailyStats[sessionDate].techniques[sessionData.techniqueId] = 0;
      }
      updatedStats.dailyStats[sessionDate].techniques[sessionData.techniqueId] += 1;
      
      // Mettre à jour les techniques favorites
      if (!updatedStats.favoriteTechniques[sessionData.techniqueId]) {
        updatedStats.favoriteTechniques[sessionData.techniqueId] = 0;
      }
      updatedStats.favoriteTechniques[sessionData.techniqueId] += 1;
      
      // Ajouter la session à la liste des sessions
      updatedStats.sessions.push(newSession);
      
      // Mettre à jour les statistiques globales
      updatedStats.totalSessions += 1;
      updatedStats.totalDuration += sessionData.duration;
      updatedStats.lastSessionDate = sessionData.date;
      
      // Calculer le nouveau streak
      const previousStreak = updatedStats.streak;
      const newStreak = calculateStreak(sessionData.date, updatedStats.dailyStats);
      updatedStats.streak = newStreak;
      
      // Vérifier si un jalon de streak a été atteint
      const milestone = checkStreakMilestone(newStreak, previousStreak);
      let milestoneMessage = null;
      if (milestone) {
        milestoneMessage = getStreakMilestoneMessage(milestone);
        console.log(`Nouveau jalon de streak atteint: ${milestone} jours - ${milestoneMessage}`);
        
        // Stocker le dernier jalon atteint et le message associé
        updatedStats.lastStreakMilestone = milestone;
        updatedStats.streakMilestoneMessage = milestoneMessage;
      }
      
      // Stocker le record de streak
      updatedStats.maxStreak = Math.max(newStreak, updatedStats.maxStreak || 0);
      
      console.log('Statistiques mises à jour:', JSON.stringify({
        totalSessions: updatedStats.totalSessions,
        totalDuration: updatedStats.totalDuration,
        streak: updatedStats.streak,
        maxStreak: updatedStats.maxStreak,
        dailyStatsCount: Object.keys(updatedStats.dailyStats).length,
        sessionsCount: updatedStats.sessions.length,
      }));
      
      // Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem('breathflow_stats', JSON.stringify(updatedStats));
      console.log('Statistiques sauvegardées avec succès'); // Debug
      
      // Mettre à jour l'état de manière sécurisée en utilisant une fonction
      // Cela évite les problèmes de mise à jour pendant le rendu
      setStats(currentStats => {
        // Vérifier si les statistiques ont changé pendant la sauvegarde
        if (currentStats.totalSessions !== stats.totalSessions) {
          console.log('Les statistiques ont changé pendant la sauvegarde, fusion des données');
          // Si les statistiques ont changé, fusionner les données
          return {
            ...currentStats,
            sessions: [...currentStats.sessions, newSession],
            totalSessions: currentStats.totalSessions + 1,
            totalDuration: currentStats.totalDuration + sessionData.duration,
            lastSessionDate: sessionData.date,
            dailyStats: {
              ...currentStats.dailyStats,
              [sessionDate]: updatedStats.dailyStats[sessionDate]
            },
            favoriteTechniques: {
              ...currentStats.favoriteTechniques,
              [sessionData.techniqueId]: (currentStats.favoriteTechniques[sessionData.techniqueId] || 0) + 1
            },
            streak: newStreak,
            lastStreakMilestone: milestone || currentStats.lastStreakMilestone,
            streakMilestoneMessage: milestoneMessage || currentStats.streakMilestoneMessage,
            maxStreak: Math.max(newStreak, currentStats.maxStreak || 0),
          };
        }
        // Sinon, utiliser les statistiques mises à jour
        return updatedStats;
      });
      
      // Retourner le message de jalon si un nouveau jalon a été atteint
      return { success: true, milestone, milestoneMessage };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la session:', error);
      return { success: false };
    }
  };
  
  // Réinitialiser les statistiques
  const resetStats = async () => {
    setStats(initialStats);
    try {
      await AsyncStorage.removeItem('breathflow_stats');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des statistiques:', error);
    }
  };
  
  // Obtenir les statistiques pour une période donnée
  const getWeeklyStats = (numWeeks = 4) => {
    console.log('getWeeklyStats appelé avec numWeeks =', numWeeks);
    
    // Créer un tableau pour stocker les résultats
    const result: { date: string; duration: number }[] = [];
    
    try {
      // Obtenir la date actuelle et la normaliser à minuit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculer la date de début pour la période
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (numWeeks * 7 - 1));
      
      // Créer un dictionnaire des sessions par date pour une recherche plus efficace
      const sessionsByDate: { [date: string]: SessionData[] } = {};
      stats.sessions.forEach(session => {
        try {
          const sessionDate = new Date(session.date).toISOString().split('T')[0];
          if (!sessionsByDate[sessionDate]) {
            sessionsByDate[sessionDate] = [];
          }
          sessionsByDate[sessionDate].push(session);
        } catch (error) {
          console.error(`Erreur lors du traitement de la session ${session.id}:`, error);
        }
      });
      
      // Utiliser une copie locale des dailyStats pour les calculs
      const localDailyStats = { ...stats.dailyStats };
      
      // Générer les dates de la période
      for (let i = 0; i < numWeeks * 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        // Formater la date au format YYYY-MM-DD
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Déterminer la durée pour cette date
        let duration = 0;
        
        // Vérifier d'abord dans dailyStats
        if (localDailyStats[dateString]) {
          duration = localDailyStats[dateString].totalDuration;
        } 
        // Si aucune durée n'est trouvée dans dailyStats, vérifier dans les sessions
        else if (sessionsByDate[dateString] && sessionsByDate[dateString].length > 0) {
          duration = sessionsByDate[dateString].reduce((sum, session) => sum + session.duration, 0);
        }
        
        result.push({
          date: dateString,
          duration: duration
        });
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la génération des statistiques hebdomadaires:', error);
      return [];
    }
  };
  
  // Obtenir la distribution des techniques
  const getTechniqueDistribution = () => {
    const totalCount = Object.values(stats.favoriteTechniques).reduce((sum, count) => sum + count, 0);
    
    if (totalCount === 0) return [];
    
    return Object.entries(stats.favoriteTechniques).map(([techniqueId, count]) => {
      // Trouver le nom de la technique à partir des sessions
      const techniqueName = stats.sessions.find(s => s.techniqueId === techniqueId)?.techniqueName || techniqueId;
      
      return {
        name: techniqueName,
        count,
        percentage: (count / totalCount) * 100,
      };
    }).sort((a, b) => b.count - a.count);
  };
  
  // Obtenir les informations de streak
  const getStreakInfo = () => {
    // Définir les jalons importants
    const milestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];
    
    // Trouver le prochain jalon à atteindre
    let nextMilestone = null;
    for (const milestone of milestones) {
      if (stats.streak < milestone) {
        nextMilestone = milestone;
        break;
      }
    }
    
    return {
      current: stats.streak,
      max: stats.maxStreak || stats.streak,
      lastMilestone: stats.lastStreakMilestone || null,
      nextMilestone,
    };
  };
  
  return (
    <StatsContext.Provider
      value={{
        stats,
        addSession,
        resetStats,
        loadStatsFromStorage,
        syncDailyStats,
        getWeeklyStats,
        getTechniqueDistribution,
        getStreakInfo,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

// Hook pour utiliser les statistiques
export const useStats = () => {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error("useStats doit être utilisé à l'intérieur d'un StatsProvider");
  }
  return context;
};
