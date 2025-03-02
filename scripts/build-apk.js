/**
 * Script pour générer un APK Android sans nécessiter d'appareil connecté
 * 
 * Ce script exécute les étapes suivantes:
 * 1. Optimisation des images
 * 2. Suppression du code de développement
 * 3. Préparation du projet pour Android
 * 4. Génération de l'APK avec Gradle
 * 
 * Utilisation: node scripts/build-apk.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
async function buildApk() {
  try {
    console.log('=== DÉBUT DE LA GÉNÉRATION DE L\'APK ===');
    
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
    
    // Étape 3: Préparation du projet pour Android
    console.log('\n=== ÉTAPE 3: PRÉPARATION DU PROJET POUR ANDROID ===');
    
    // Vérifier si le répertoire android existe déjà
    const androidDir = path.resolve(__dirname, '..', 'android');
    const needsPrebuild = !fs.existsSync(androidDir);
    
    if (needsPrebuild) {
      console.log('\nPréparation du projet pour Android...');
      if (!runCommand('npx expo prebuild --platform android --clean')) {
        console.error('Erreur: La préparation du projet a échoué.');
        process.exit(1);
      }
    } else {
      console.log('Le répertoire Android existe déjà, on passe à l\'étape suivante.');
    }
    
    // Étape 4: Génération de l'APK avec Gradle
    console.log('\n=== ÉTAPE 4: GÉNÉRATION DE L\'APK ===');
    
    // Vérifier que le répertoire android existe
    if (!fs.existsSync(androidDir)) {
      console.error('Erreur: Le répertoire Android n\'existe pas.');
      process.exit(1);
    }
    
    // Exécuter la commande gradlew assembleRelease
    console.log('\nGénération de l\'APK...');
    const gradleCommand = process.platform === 'win32' 
      ? 'cd android && .\\gradlew.bat assembleRelease'
      : 'cd android && ./gradlew assembleRelease';
    
    if (!runCommand(gradleCommand)) {
      console.error('Erreur: La génération de l\'APK a échoué.');
      process.exit(1);
    }
    
    // Vérifier que l'APK a été généré
    const apkPath = path.resolve(androidDir, 'app/build/outputs/apk/release/app-release.apk');
    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      console.log('\nGénération de l\'APK terminée avec succès!');
      console.log(`L'APK se trouve dans: ${apkPath}`);
      console.log(`Taille de l'APK: ${fileSizeInMB.toFixed(2)} Mo`);
      
      // Copier l'APK dans le répertoire racine pour un accès plus facile
      const destPath = path.resolve(__dirname, '..', 'BreathFlow.apk');
      fs.copyFileSync(apkPath, destPath);
      console.log(`Une copie de l'APK a été placée dans: ${destPath}`);
    } else {
      console.error('Erreur: L\'APK n\'a pas été généré correctement.');
      process.exit(1);
    }
    
    console.log('\n=== GÉNÉRATION DE L\'APK TERMINÉE AVEC SUCCÈS ===');
    
  } catch (error) {
    console.error('Erreur lors de la génération de l\'APK:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
buildApk();
