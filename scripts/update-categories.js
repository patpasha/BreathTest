const { openDatabaseSync } = require('expo-sqlite');

// Ouvrir la base de données
const db = openDatabaseSync('breathflow.db');

// Fonction pour mettre à jour les catégories d'une technique
async function updateTechniqueCategories(id, categories) {
  try {
    const categoriesJSON = JSON.stringify(categories);
    
    // Vérifier si la technique existe
    const result = await db.getFirstAsync(
      'SELECT * FROM breathing_techniques WHERE id = ?',
      [id]
    );
    
    if (result) {
      console.log(`Mise à jour des catégories pour la technique ${id}...`);
      
      // Mettre à jour les catégories
      await db.runAsync(
        'UPDATE breathing_techniques SET categories = ? WHERE id = ?',
        [categoriesJSON, id]
      );
      
      console.log(`Catégories de la technique ${id} mises à jour avec succès`);
    } else {
      console.log(`La technique ${id} n'existe pas dans la base de données`);
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour des catégories pour ${id}:`, error);
  }
}

// Fonction pour invalider le cache
function invalidateCache() {
  console.log('Invalidation du cache...');
  // Cette fonction est appelée dans DatabaseService.ts après les modifications de la base de données
  // Nous ne pouvons pas l'appeler directement ici, mais nous pouvons redémarrer l'application pour vider le cache
}

// Définir les mises à jour de catégories
const categoriesToUpdate = [
  { id: 'apnee', categories: ['performance', 'stress', 'health'] },
  { id: 'papillon', categories: ['stress', 'focus'] },
  { id: 'lion', categories: ['stress', 'energy'] },
  { id: '3-4-5', categories: ['stress', 'sleep'] },
  { id: 'pleine-conscience', categories: ['stress', 'focus'] },
  { id: 'levres-pincees', categories: ['health', 'stress'] }
];

// Fonction principale
async function main() {
  console.log('Début de la mise à jour des catégories...');
  
  try {
    // Mettre à jour chaque technique
    for (const technique of categoriesToUpdate) {
      await updateTechniqueCategories(technique.id, technique.categories);
    }
    
    console.log('Mise à jour des catégories terminée');
    console.log('Redémarrez l\'application pour voir les changements');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des catégories:', error);
  } finally {
    // Fermer la base de données
    db.closeSync();
  }
}

// Exécuter la fonction principale
main();
