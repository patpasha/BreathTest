/**
 * Script pour effectuer un build optimisé de l'application
 * 
 * Ce script exécute les étapes suivantes:
 * 1. Optimisation des images
 * 2. Suppression du code de développement
 * 3. Build de l'application avec NODE_ENV=production
 * 
 * Utilisation: node scripts/build-optimized.js [android|ios]
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
async function buildOptimized() {
  try {
    console.log('=== DÉBUT DU BUILD OPTIMISÉ ===');
    
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
    
    // Étape 3: Build de l'application
    console.log('\n=== ÉTAPE 3: BUILD DE L\'APPLICATION ===');
    const buildCommand = `NODE_ENV=production npx eas build -p ${platform} --non-interactive`;
    
    // Vérifier si eas-cli est installé
    try {
      execSync('npx eas --version', { stdio: 'ignore' });
    } catch (error) {
      console.log('Installation de eas-cli...');
      if (!runCommand('npm install -g eas-cli')) {
        console.error('Erreur: L\'installation de eas-cli a échoué.');
        process.exit(1);
      }
    }
    
    // Vérifier si l'utilisateur est connecté à EAS
    try {
      execSync('npx eas whoami', { stdio: 'ignore' });
    } catch (error) {
      console.log('\nVous devez vous connecter à EAS avant de continuer:');
      console.log('Exécutez la commande: npx eas login');
      console.log('Puis réessayez ce script une fois connecté.\n');
      process.exit(1);
    }
    
    // Vérifier si eas.json existe
    const fs = require('fs');
    const easConfigPath = path.resolve(__dirname, '..', 'eas.json');
    if (!fs.existsSync(easConfigPath)) {
      console.log('Création du fichier eas.json...');
      const easConfig = {
        "cli": {
          "version": ">= 5.9.1"
        },
        "build": {
          "development": {
            "developmentClient": true,
            "distribution": "internal"
          },
          "preview": {
            "distribution": "internal"
          },
          "production": {
            "autoIncrement": true
          }
        },
        "submit": {
          "production": {}
        }
      };
      fs.writeFileSync(easConfigPath, JSON.stringify(easConfig, null, 2));
      console.log('Fichier eas.json créé avec succès.');
    }
    
    // Exécuter le build
    console.log(`Lancement du build EAS pour ${platform}...`);
    if (!runCommand(buildCommand)) {
      console.error('Erreur: Le build de l\'application a échoué.');
      process.exit(1);
    }
    
    console.log('\n=== BUILD OPTIMISÉ TERMINÉ AVEC SUCCÈS ===');
    
  } catch (error) {
    console.error('Erreur lors du build optimisé:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
buildOptimized();
