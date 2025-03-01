/**
 * Script pour mettre à jour les écrans de respiration avec les props de navigation
 * 
 * Ce script ajoute l'import de BreathingScreenProps et met à jour la signature
 * des composants pour accepter les props de navigation.
 * 
 * Utilisation: node scripts/update-breathing-screens.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Liste des écrans de respiration à mettre à jour
const BREATHING_SCREENS = [
  'CyclicHyperventilationScreen.tsx',
  'WimHofScreen.tsx',
  'RespirationCoherenteScreen.tsx',
  'RespirationDiaphragmatiqueScreen.tsx',
  'RespirationAlterneeScreen.tsx',
  'RespirationButeykoScreen.tsx',
  'RespirationUjjayiScreen.tsx',
  'RespirationBoxScreen.tsx',
  'RespirationTummoScreen.tsx'
];

// Fonction pour mettre à jour un écran de respiration
async function updateBreathingScreen(filePath) {
  try {
    // Lire le contenu du fichier
    const content = await readFile(filePath, 'utf8');
    
    // Vérifier si le fichier a déjà été mis à jour
    if (content.includes('import { BreathingScreenProps } from')) {
      console.log(`Le fichier ${path.basename(filePath)} est déjà à jour.`);
      return;
    }
    
    // Ajouter l'import de BreathingScreenProps
    let updatedContent = content.replace(
      /import { useTheme } from ['"]\.\.\/theme\/ThemeContext['"];/,
      `import { useTheme } from '../theme/ThemeContext';\nimport { BreathingScreenProps } from '../App';`
    );
    
    // Mettre à jour la signature du composant
    const componentName = path.basename(filePath, '.tsx');
    const regex = new RegExp(`const ${componentName} = \\(\\) => {`);
    updatedContent = updatedContent.replace(
      regex,
      `const ${componentName} = ({ route, navigation }: BreathingScreenProps) => {`
    );
    
    // Écrire le contenu mis à jour
    await writeFile(filePath, updatedContent, 'utf8');
    
    console.log(`✅ Fichier ${path.basename(filePath)} mis à jour avec succès.`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${path.basename(filePath)}:`, error.message);
  }
}

// Fonction principale
async function main() {
  try {
    console.log('Mise à jour des écrans de respiration...\n');
    
    const screensDir = path.resolve(__dirname, '../screens');
    
    // Mettre à jour chaque écran de respiration
    for (const screenFile of BREATHING_SCREENS) {
      const filePath = path.join(screensDir, screenFile);
      
      if (fs.existsSync(filePath)) {
        await updateBreathingScreen(filePath);
      } else {
        console.warn(`⚠️ Le fichier ${screenFile} n'existe pas.`);
      }
    }
    
    console.log('\nMise à jour terminée!');
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des écrans de respiration:', error);
  }
}

// Exécuter la fonction principale
main();
