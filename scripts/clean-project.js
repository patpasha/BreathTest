/**
 * Script pour nettoyer les fichiers temporaires et caches du projet
 * 
 * Ce script supprime les dossiers et fichiers temporaires comme node_modules,
 * .expo, et autres caches pour repartir sur une base propre.
 * 
 * Utilisation: node scripts/clean-project.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

// Chemin vers la racine du projet
const projectRoot = path.resolve(__dirname, '..');

// Dossiers et fichiers à nettoyer
const pathsToClean = [
  'node_modules',
  '.expo',
  '.expo-shared',
  'ios/Pods',
  'ios/build',
  'android/build',
  'android/app/build',
  'android/.gradle',
  'yarn-error.log',
  'npm-debug.log',
  'yarn-debug.log',
  'dist',
  'web-build',
  'coverage',
  'tmp'
];

// Fonction pour nettoyer le projet
async function cleanProject() {
  console.log('Nettoyage du projet BreathFlow...\n');
  
  let totalSizeFreed = 0;
  
  for (const relativePath of pathsToClean) {
    const fullPath = path.join(projectRoot, relativePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        // Calculer la taille avant suppression
        const sizeCmd = process.platform === 'win32'
          ? `powershell -command "(Get-ChildItem -Path '${fullPath}' -Recurse | Measure-Object -Property Length -Sum).Sum"`
          : `du -sb "${fullPath}" | cut -f1`;
        
        let sizeInBytes = 0;
        try {
          const sizeOutput = execSync(sizeCmd).toString().trim();
          sizeInBytes = parseInt(sizeOutput);
        } catch (e) {
          // En cas d'erreur lors du calcul de la taille, continuer sans afficher la taille
        }
        
        // Supprimer le dossier/fichier
        await rimraf(fullPath);
        
        totalSizeFreed += sizeInBytes;
        
        console.log(`✓ Supprimé: ${relativePath} ${sizeInBytes > 0 ? `(${formatSize(sizeInBytes)})` : ''}`);
      } catch (error) {
        console.error(`✗ Erreur lors de la suppression de ${relativePath}:`, error.message);
      }
    }
  }
  
  console.log(`\nNettoyage des caches de npm et yarn...`);
  
  try {
    execSync('npm cache clean --force', { stdio: 'ignore' });
    console.log('✓ Cache npm nettoyé');
  } catch (e) {
    console.log('✗ Erreur lors du nettoyage du cache npm');
  }
  
  try {
    execSync('yarn cache clean', { stdio: 'ignore' });
    console.log('✓ Cache yarn nettoyé');
  } catch (e) {
    console.log('✗ Erreur lors du nettoyage du cache yarn');
  }
  
  try {
    execSync('watchman watch-del-all', { stdio: 'ignore' });
    console.log('✓ Watchman réinitialisé');
  } catch (e) {
    // Watchman peut ne pas être installé, donc on ignore cette erreur
  }
  
  console.log(`\nNettoyage terminé! Espace libéré: ${formatSize(totalSizeFreed)}`);
  console.log('\nPour reconstruire le projet, exécutez:');
  console.log('npm install');
  console.log('# ou');
  console.log('yarn');
}

// Fonction pour formater la taille en Ko, Mo ou Go
function formatSize(sizeInBytes) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} o`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} Ko`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} Mo`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
  }
}

// Vérifier si rimraf est installé
try {
  require.resolve('rimraf');
} catch (e) {
  console.error('Le module rimraf n\'est pas installé. Installation en cours...');
  try {
    execSync('npm install rimraf --no-save', { stdio: 'inherit' });
  } catch (error) {
    console.error('Erreur lors de l\'installation de rimraf. Veuillez l\'installer manuellement:');
    console.error('npm install rimraf --save-dev');
    process.exit(1);
  }
}

// Exécuter la fonction principale
cleanProject().catch(error => {
  console.error('Erreur lors du nettoyage du projet:', error);
});
