// Script pour mettre à jour les techniques de respiration dans la base de données

import { addNewBreathingTechniques, updateBreathingTechniqueCategories, initDatabase } from '../services/DatabaseService';

async function updateBreathingTechniques() {
  try {
    console.log('Initialisation de la base de données...');
    await initDatabase();
    
    console.log('Ajout des nouvelles techniques de respiration...');
    await addNewBreathingTechniques();
    
    console.log('Mise à jour des catégories...');
    await updateBreathingTechniqueCategories();
    
    console.log('Mise à jour terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des techniques de respiration:', error);
    process.exit(1);
  }
}

// Exécuter la fonction
updateBreathingTechniques();
