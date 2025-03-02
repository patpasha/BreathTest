/**
 * Script pour mettre à jour les techniques de respiration améliorées
 * 
 * Note: Ce script génère un fichier JSON avec les techniques améliorées
 * qui sera ensuite importé par l'application lors de son démarrage.
 */
const fs = require('fs');
const path = require('path');

/**
 * Crée un fichier JSON avec les techniques de respiration améliorées
 * qui sera utilisé comme source de données initiales pour l'application
 */
function createEnhancedTechniquesJson() {
  try {
    console.log('Création du fichier JSON avec les techniques améliorées...');
    
    // Lire le fichier JSON des techniques améliorées
    const enhancedDataPath = path.join(__dirname, '../assets/data/enhanced_breathing_techniques.json');
    const enhancedData = fs.readFileSync(enhancedDataPath, 'utf8');
    const enhancedTechniques = JSON.parse(enhancedData);
    
    // Lire le fichier JSON des techniques originales
    const originalDataPath = path.join(__dirname, '../assets/data/breathing_techniques.json');
    let originalTechniques = [];
    if (fs.existsSync(originalDataPath)) {
      const originalData = fs.readFileSync(originalDataPath, 'utf8');
      originalTechniques = JSON.parse(originalData);
    }
    
    // Fusionner les deux ensembles de techniques
    const mergedTechniques = [...originalTechniques];
    
    // Mettre à jour ou ajouter les techniques améliorées
    for (const enhancedTechnique of enhancedTechniques) {
      const index = mergedTechniques.findIndex(t => t.id === enhancedTechnique.id);
      if (index !== -1) {
        // Mettre à jour la technique existante
        mergedTechniques[index] = enhancedTechnique;
      } else {
        // Ajouter la nouvelle technique
        mergedTechniques.push(enhancedTechnique);
      }
    }
    
    // Écrire le fichier JSON fusionné
    fs.writeFileSync(originalDataPath, JSON.stringify(mergedTechniques, null, 2), 'utf8');
    
    console.log(`Fichier JSON mis à jour avec ${mergedTechniques.length} techniques`);
    return mergedTechniques;
  } catch (error) {
    console.error('Erreur lors de la création du fichier JSON:', error);
    throw error;
  }
}

/**
 * Crée un fichier README pour expliquer comment utiliser les nouvelles techniques
 */
function createReadme() {
  try {
    console.log('Création du fichier README...');
    
    const readmePath = path.join(__dirname, '../assets/data/README.md');
    const readmeContent = `# Techniques de respiration améliorées

Ce répertoire contient les données des techniques de respiration utilisées par l'application BreathFlow.

## Structure des données

Le fichier \`breathing_techniques.json\` contient toutes les techniques de respiration disponibles dans l'application.
Chaque technique est définie avec la structure suivante :

\`\`\`json
{
  "id": "technique-id",
  "title": "Nom de la technique",
  "description": "Description courte",
  "duration": "5-10 minutes",
  "route": "GenericBreathingScreen",
  "categories": ["stress", "sleep"],
  "steps": [
    { 
      "name": "Inspiration", 
      "duration": 4000, 
      "instruction": "Inspirez lentement" 
    },
    { 
      "name": "Expiration", 
      "duration": 6000, 
      "instruction": "Expirez lentement" 
    }
  ],
  "defaultDurationMinutes": 5,
  "longDescription": [
    "Premier paragraphe de description détaillée",
    "Deuxième paragraphe avec instructions"
  ]
}
\`\`\`

## Ajout d'une nouvelle technique

Pour ajouter une nouvelle technique de respiration :

1. Ajoutez une nouvelle entrée dans le fichier \`breathing_techniques.json\`
2. Assurez-vous que l'ID est unique
3. Définissez la propriété \`route\` comme \`GenericBreathingScreen\` pour utiliser l'écran générique
4. Définissez les étapes de respiration dans la propriété \`steps\`

L'application chargera automatiquement la nouvelle technique au démarrage.
`;
    
    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    console.log('Fichier README créé avec succès');
  } catch (error) {
    console.error('Erreur lors de la création du fichier README:', error);
    throw error;
  }
}

/**
 * Fonction principale
 */
function main() {
  try {
    // Créer le fichier JSON avec les techniques améliorées
    const techniques = createEnhancedTechniquesJson();
    
    // Créer le fichier README
    createReadme();
    
    console.log(`Mise à jour terminée avec succès. ${techniques.length} techniques de respiration disponibles.`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();
