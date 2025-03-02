/**
 * Script pour effectuer un build local de l'application
 * 
 * Ce script exécute les étapes suivantes:
 * 1. Optimisation des images
 * 2. Suppression du code de développement
 * 3. Build local de l'application avec NODE_ENV=production
 * 
 * Utilisation: node scripts/build-local.js [android|ios]
 */

const { execSync } = require('child_process');
const path = require('path');

// Fonction pour exécuter une commande et afficher sa sortie
function runCommand(command) {
  console.log(`\n> ${command}\n`);
  try {
    execSync(command, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function buildLocal() {
  try {
    console.log('=== DÉBUT DU BUILD LOCAL ===');
    
    // Récupérer la plateforme cible (android ou ios)
    const args = process.argv.slice(2);
    const platform = args[0] || 'android'; // Par défaut: android
    
    if (!['android', 'ios'].includes(platform)) {
      console.error('Plateforme non valide. Utilisez "android" ou "ios".');
      process.exit(1);
    }
    
    console.log(`Plateforme cible: ${platform}`);
    
    // Étape 1: Optimisation des images
    console.log('\n=== ÉTAPE 1: OPTIMISATION DES IMAGES ===');
    if (!runCommand('node scripts/optimize-images.js')) {
      console.warn('Avertissement: L\'optimisation des images a échoué, mais le build continue...');
    }
    
    // Étape 2: Suppression du code de développement
    console.log('\n=== ÉTAPE 2: SUPPRESSION DU CODE DE DÉVELOPPEMENT ===');
    if (!runCommand('node scripts/remove-dev-code.js')) {
      console.warn('Avertissement: La suppression du code de développement a échoué, mais le build continue...');
    }
    
    // Étape 3: Build local de l'application
    console.log('\n=== ÉTAPE 3: BUILD LOCAL DE L\'APPLICATION ===');
    
    // Vérifier si les répertoires natifs existent déjà
    const fs = require('fs');
    const androidDir = path.resolve(__dirname, '..', 'android');
    const iosDir = path.resolve(__dirname, '..', 'ios');
    const needsPrebuild = (platform === 'android' && !fs.existsSync(androidDir)) || 
                         (platform === 'ios' && !fs.existsSync(iosDir));
    
    // Préparer le projet si nécessaire
    if (needsPrebuild) {
      console.log(`\nPréparation du projet pour ${platform}...`);
      if (!runCommand(`npx expo prebuild --platform ${platform} --clean`)) {
        console.error('Erreur: La préparation du projet a échoué.');
        process.exit(1);
      }
    }
    
    // Commande de build spécifique à la plateforme
    console.log(`\nCompilation pour ${platform}...`);
    let buildCommand;
    
    if (platform === 'android') {
      // Pour Android, utiliser expo run:android avec la configuration release
      buildCommand = 'NODE_ENV=production npx expo run:android --variant release';
    } else { // ios
      // Pour iOS, utiliser expo run:ios avec la configuration release
      buildCommand = 'NODE_ENV=production npx expo run:ios --configuration Release';
    }
    
    if (!runCommand(buildCommand)) {
      console.error('Erreur: Le build local de l\'application a échoué.');
      process.exit(1);
    }
    
    // Afficher le chemin du build
    if (platform === 'android') {
      console.log('\nBuild Android terminé avec succès!');
      console.log('L\'application a été installée sur l\'appareil/émulateur Android connecté.');
      console.log('Le fichier APK se trouve dans: android/app/build/outputs/apk/release/app-release.apk');
    } else { // ios
      console.log('\nBuild iOS terminé avec succès!');
      console.log('L\'application a été installée sur le simulateur iOS.');
    }
    
    console.log('\n=== BUILD LOCAL TERMINÉ AVEC SUCCÈS ===');
    
  } catch (error) {
    console.error('Erreur lors du build local:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
buildLocal();
