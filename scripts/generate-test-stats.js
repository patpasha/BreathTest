/**
 * Script pour générer des données de test pour les statistiques
 * 
 * Ce script génère des sessions aléatoires et les enregistre dans AsyncStorage
 * pour tester les fonctionnalités de statistiques de l'application.
 * 
 * Utilisation: node scripts/generate-test-stats.js [nombre_de_sessions]
 */

const fs = require('fs');
const path = require('path');

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
  { id: 'respiration-478', name: 'Respiration 4-7-8' },
  { id: 'respiration-coherente', name: 'Respiration Cohérente' },
  { id: 'respiration-diaphragmatique', name: 'Respiration Diaphragmatique' },
  { id: 'respiration-box', name: 'Respiration Carrée' },
  { id: 'cyclic-hyperventilation', name: 'Hyperventilation Cyclique' },
  { id: 'wim-hof', name: 'Méthode Wim Hof' },
  { id: 'respiration-alternee', name: 'Respiration Alternée' },
  { id: 'respiration-buteyko', name: 'Méthode Buteyko' },
  { id: 'respiration-ujjayi', name: 'Respiration Ujjayi' },
  { id: 'respiration-tummo', name: 'Respiration Tummo' }
];

// Fonction pour générer une session aléatoire
const generateRandomSession = () => {
  const technique = techniques[Math.floor(Math.random() * techniques.length)];
  const duration = Math.floor(Math.random() * 20) + 5; // 5 à 25 minutes
  const date = generateRandomDate();
  const completed = Math.random() > 0.1; // 90% des sessions sont complétées
  
  return {
    id: generateId(),
    techniqueId: technique.id,
    techniqueName: technique.name,
    duration: duration * 60, // Convertir en secondes
    date: date,
    completed: completed,
    rating: completed ? Math.floor(Math.random() * 5) + 1 : null // Note de 1 à 5
  };
};

// Fonction principale pour générer les données de test
const generateTestData = (numSessions = 50) => {
  // Générer les sessions
  const sessions = [];
  for (let i = 0; i < numSessions; i++) {
    sessions.push(generateRandomSession());
  }
  
  // Trier les sessions par date (plus récente en premier)
  sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Calculer les statistiques globales
  const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
  const completedSessions = sessions.filter(session => session.completed);
  const averageRating = completedSessions.length > 0 
    ? completedSessions.reduce((sum, session) => sum + (session.rating || 0), 0) / completedSessions.length 
    : 0;
  
  // Calculer les techniques les plus utilisées
  const techniqueCounts = {};
  sessions.forEach(session => {
    if (!techniqueCounts[session.techniqueId]) {
      techniqueCounts[session.techniqueId] = {
        id: session.techniqueId,
        name: session.techniqueName,
        count: 0,
        totalDuration: 0
      };
    }
    techniqueCounts[session.techniqueId].count++;
    techniqueCounts[session.techniqueId].totalDuration += session.duration;
  });
  
  const favoriteTechniques = Object.values(techniqueCounts)
    .sort((a, b) => b.count - a.count)
    .map(technique => ({
      ...technique,
      percentage: (technique.count / sessions.length) * 100
    }));
  
  // Créer l'objet de statistiques
  const stats = {
    sessions,
    totalSessions: sessions.length,
    totalDuration,
    completedSessions: completedSessions.length,
    averageRating,
    favoriteTechniques,
    lastUpdated: new Date().toISOString()
  };
  
  // Écrire les données dans un fichier JSON
  const outputPath = path.resolve(__dirname, 'test-stats.json');
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
  
  console.log(`${numSessions} sessions générées et enregistrées dans ${outputPath}`);
  console.log(`Durée totale: ${Math.round(totalDuration / 60)} minutes`);
  console.log(`Sessions complétées: ${completedSessions.length}/${sessions.length}`);
  console.log(`Note moyenne: ${averageRating.toFixed(1)}/5`);
  console.log(`Technique préférée: ${favoriteTechniques[0]?.name} (${Math.round(favoriteTechniques[0]?.percentage)}%)`);
};

// Récupérer le nombre de sessions depuis les arguments
const numSessions = parseInt(process.argv[2]) || 50;

// Exécuter la fonction principale
generateTestData(numSessions);
