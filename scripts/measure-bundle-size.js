/**
 * Script pour mesurer la taille du bundle JavaScript
 * 
 * Ce script utilise expo-cli pour construire un bundle et mesurer sa taille.
 * Il affiche la taille du bundle pour Android et iOS.
 * 
 * Utilisation: node scripts/measure-bundle-size.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Fonction pour exécuter une commande et récupérer sa sortie
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', cwd: path.resolve(__dirname, '..') });
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
    return null;
  }
}

// Fonction pour formater la taille en Mo
function formatSize(sizeInBytes) {
  return (sizeInBytes / (1024 * 1024)).toFixed(2) + ' Mo';
}

// Fonction pour mesurer la taille du bundle
async function measureBundleSize() {
  try {
    console.log('=== MESURE DE LA TAILLE DU BUNDLE ===');
    
    // Créer un dossier temporaire pour les bundles
    const tempDir = path.join(os.tmpdir(), 'breathflow-bundle-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    
    console.log('Dossier temporaire créé:', tempDir);
    
    // Construire le bundle Android
    console.log('\n=== CONSTRUCTION DU BUNDLE ANDROID ===');
    runCommand(`npx expo export --platform android --output-dir ${tempDir}/android`);
    
    // Construire le bundle iOS
    console.log('\n=== CONSTRUCTION DU BUNDLE iOS ===');
    runCommand(`npx expo export --platform ios --output-dir ${tempDir}/ios`);
    
    // Mesurer la taille des bundles
    const androidBundlePath = path.join(tempDir, 'android', 'bundles', 'android-index.js');
    const iosBundlePath = path.join(tempDir, 'ios', 'bundles', 'ios-index.js');
    
    let androidSize = 0;
    let iosSize = 0;
    
    if (fs.existsSync(androidBundlePath)) {
      androidSize = fs.statSync(androidBundlePath).size;
      console.log(`\nTaille du bundle Android: ${formatSize(androidSize)}`);
    } else {
      console.error('Bundle Android non trouvé');
    }
    
    if (fs.existsSync(iosBundlePath)) {
      iosSize = fs.statSync(iosBundlePath).size;
      console.log(`Taille du bundle iOS: ${formatSize(iosSize)}`);
    } else {
      console.error('Bundle iOS non trouvé');
    }
    
    // Afficher un résumé
    console.log('\n=== RÉSUMÉ ===');
    console.log(`Bundle Android: ${formatSize(androidSize)}`);
    console.log(`Bundle iOS: ${formatSize(iosSize)}`);
    
    // Nettoyer le dossier temporaire
    console.log('\nNettoyage du dossier temporaire...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log('\n=== MESURE TERMINÉE ===');
    
  } catch (error) {
    console.error('Erreur lors de la mesure de la taille du bundle:', error);
  }
}

// Exécuter la fonction principale
measureBundleSize();
