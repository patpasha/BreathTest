// Script pour ajouter les nouvelles techniques de respiration à la base de données

// Utiliser la syntaxe d'importation compatible avec TypeScript
import { addNewBreathingTechniques } from '../services/DatabaseService';

// Configurer Babel pour permettre l'importation de modules ES
require('@babel/register')({"extensions": [".js", ".ts"]});

// Fonction principale
async function main() {
  try {
    console.log('Démarrage de l\'ajout des nouvelles techniques de respiration...');
    
    // Ajouter les nouvelles techniques
    await addNewBreathingTechniques();
    
    console.log('Toutes les nouvelles techniques ont été ajoutées avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'ajout des nouvelles techniques:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();
