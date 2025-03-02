/**
 * Script pour vérifier et réparer la technique "physiological-sigh" dans la base de données
 */
const fs = require('fs');
const path = require('path');
const { openDatabase } = require('expo-sqlite');

// Ouvrir la base de données
const db = openDatabase('breathflow.db');

// Données correctes pour la technique physiological-sigh
const correctData = {
  id: "physiological-sigh",
  title: "Soupir Physiologique",
  description: "Double inspiration suivie d'une longue expiration pour réduire rapidement le stress et l'anxiété.",
  duration: "2-5 minutes",
  route: "GenericBreathingScreen",
  categories: ["stress"],
  defaultDurationMinutes: 3,
  steps: [
    { 
      name: "Première inspiration", 
      duration: 1500, 
      instruction: "Inspirez profondément par le nez" 
    },
    { 
      name: "Seconde inspiration", 
      duration: 1000, 
      instruction: "Inspirez encore un peu plus pour remplir complètement vos poumons" 
    },
    { 
      name: "Expiration", 
      duration: 4000, 
      instruction: "Expirez lentement et complètement par la bouche" 
    },
    { 
      name: "Pause", 
      duration: 2000, 
      instruction: "Attendez quelques secondes avant le prochain cycle" 
    }
  ],
  longDescription: [
    "Le soupir physiologique est un mécanisme naturel que notre corps utilise pour réinitialiser la respiration et réduire le stress.",
    "Cette technique, popularisée par le neuroscientifique Andrew Huberman, est extrêmement efficace pour une réduction rapide de l'anxiété.",
    "1. Prenez une première inspiration profonde par le nez.",
    "2. Sans expirer, prenez une seconde inspiration courte pour remplir complètement vos poumons.",
    "3. Expirez lentement et complètement par la bouche.",
    "4. Répétez ce cycle 1 à 5 fois pour un effet immédiat sur votre état émotionnel."
  ]
};

/**
 * Vérifie et répare la technique physiological-sigh dans la base de données
 */
function fixPhysiologicalSigh() {
  return new Promise((resolve, reject) => {
    // Vérifier si la technique existe
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM breathing_techniques WHERE id = ?',
        ['physiological-sigh'],
        (_, result) => {
          if (result.rows.length === 0) {
            console.log('La technique physiological-sigh n\'existe pas, création...');
            insertTechnique(tx, resolve, reject);
          } else {
            console.log('La technique physiological-sigh existe, mise à jour...');
            updateTechnique(tx, resolve, reject);
          }
        },
        (_, error) => {
          console.error('Erreur lors de la vérification de la technique:', error);
          reject(error);
        }
      );
    });
  });
}

/**
 * Insère la technique physiological-sigh dans la base de données
 */
function insertTechnique(tx, resolve, reject) {
  tx.executeSql(
    `INSERT INTO breathing_techniques (id, title, description, duration, route, categories, steps, defaultDurationMinutes, longDescription) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      correctData.id,
      correctData.title,
      correctData.description,
      correctData.duration,
      correctData.route,
      JSON.stringify(correctData.categories),
      JSON.stringify(correctData.steps),
      correctData.defaultDurationMinutes,
      JSON.stringify(correctData.longDescription)
    ],
    (_, result) => {
      console.log('Technique physiological-sigh insérée avec succès');
      resolve(result);
    },
    (_, error) => {
      console.error('Erreur lors de l\'insertion de la technique:', error);
      reject(error);
    }
  );
}

/**
 * Met à jour la technique physiological-sigh dans la base de données
 */
function updateTechnique(tx, resolve, reject) {
  tx.executeSql(
    `UPDATE breathing_techniques 
     SET title = ?, description = ?, duration = ?, route = ?, categories = ?, 
         steps = ?, defaultDurationMinutes = ?, longDescription = ?
     WHERE id = ?`,
    [
      correctData.title,
      correctData.description,
      correctData.duration,
      correctData.route,
      JSON.stringify(correctData.categories),
      JSON.stringify(correctData.steps),
      correctData.defaultDurationMinutes,
      JSON.stringify(correctData.longDescription),
      correctData.id
    ],
    (_, result) => {
      console.log('Technique physiological-sigh mise à jour avec succès');
      resolve(result);
    },
    (_, error) => {
      console.error('Erreur lors de la mise à jour de la technique:', error);
      reject(error);
    }
  );
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('Démarrage de la réparation de la technique physiological-sigh...');
    await fixPhysiologicalSigh();
    console.log('Réparation terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de la réparation:', error);
  }
}

// Exécuter la fonction principale
main();
