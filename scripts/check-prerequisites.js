/**
 * Script pour vérifier les prérequis nécessaires au développement et au build
 * 
 * Ce script vérifie la présence et la version des outils suivants:
 * - Node.js
 * - npm
 * - Java (pour Android)
 * - Xcode (pour iOS)
 * - Android SDK (pour Android)
 * 
 * Utilisation: node scripts/check-prerequisites.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Fonction pour exécuter une commande et récupérer sa sortie
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (error) {
    return null;
  }
}

// Fonction pour vérifier si un programme est installé
function isInstalled(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Fonction pour afficher un message de statut
function printStatus(name, installed, version = null, required = null, notes = null) {
  const status = installed 
    ? `${colors.green}✓ Installé${colors.reset}` 
    : `${colors.red}✗ Non installé${colors.reset}`;
  
  let versionStatus = '';
  if (version) {
    versionStatus = ` | Version: ${version}`;
    if (required && !satisfiesVersion(version, required)) {
      versionStatus += ` ${colors.red}(Requise: ${required})${colors.reset}`;
    }
  }
  
  let notesText = '';
  if (notes) {
    notesText = `\n   ${colors.cyan}Note: ${notes}${colors.reset}`;
  }
  
  console.log(`${name}: ${status}${versionStatus}${notesText}`);
}

// Fonction pour vérifier si une version satisfait une exigence minimale
function satisfiesVersion(version, required) {
  const vParts = version.split('.').map(Number);
  const rParts = required.split('.').map(Number);
  
  for (let i = 0; i < Math.max(vParts.length, rParts.length); i++) {
    const vPart = vParts[i] || 0;
    const rPart = rParts[i] || 0;
    if (vPart > rPart) return true;
    if (vPart < rPart) return false;
  }
  
  return true;
}

// Fonction principale
async function checkPrerequisites() {
  console.log(`\n${colors.magenta}=== VÉRIFICATION DES PRÉREQUIS ===\n${colors.reset}`);
  
  // Vérifier Node.js
  const nodeVersion = execCommand('node --version')?.replace('v', '');
  printStatus('Node.js', nodeVersion !== null, nodeVersion, '14.0.0');
  
  // Vérifier npm
  const npmVersion = execCommand('npm --version');
  printStatus('npm', npmVersion !== null, npmVersion, '6.0.0');
  
  // Vérifier Java
  const javaVersion = execCommand('java -version 2>&1 | head -n 1')?.match(/version "(.+?)"/)?.[1];
  printStatus('Java', javaVersion !== null, javaVersion, '11', 
    javaVersion === null ? 'Nécessaire pour le build Android. Installez Java en visitant https://www.java.com' : null);
  
  // Vérifier Android SDK
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  const androidSdkInstalled = androidHome && fs.existsSync(androidHome);
  printStatus('Android SDK', androidSdkInstalled, androidHome, null, 
    !androidSdkInstalled ? 'Nécessaire pour le build Android. Installez Android Studio: https://developer.android.com/studio' : null);
  
  // Vérifier Xcode (macOS uniquement)
  if (process.platform === 'darwin') {
    const xcodeVersion = execCommand('xcodebuild -version | head -n 1')?.match(/Xcode (.+)/)?.[1];
    printStatus('Xcode', xcodeVersion !== null, xcodeVersion, '12.0', 
      xcodeVersion === null ? 'Nécessaire pour le build iOS. Installez Xcode depuis l\'App Store' : null);
    
    // Vérifier les outils en ligne de commande Xcode
    const xcodeSelectVersion = isInstalled('xcode-select');
    printStatus('Xcode CLI Tools', xcodeSelectVersion, null, null, 
      !xcodeSelectVersion ? 'Installez avec: xcode-select --install' : null);
  }
  
  // Vérifier Expo CLI
  const expoCli = execCommand('npx expo --version');
  printStatus('Expo CLI', expoCli !== null, expoCli, '6.0.0');
  
  // Vérifier EAS CLI
  const easCli = execCommand('npx eas --version');
  printStatus('EAS CLI', easCli !== null, easCli, '5.0.0', 
    easCli === null ? 'Nécessaire pour les builds cloud. Installez avec: npm install -g eas-cli' : null);
  
  console.log(`\n${colors.magenta}=== RECOMMANDATIONS ===\n${colors.reset}`);
  
  // Recommandations basées sur les résultats
  if (javaVersion === null) {
    console.log(`${colors.yellow}→ Pour les builds Android:${colors.reset}`);
    console.log('  1. Installez Java depuis https://www.java.com');
    console.log('  2. Assurez-vous que JAVA_HOME est correctement configuré');
  }
  
  if (!androidSdkInstalled) {
    console.log(`${colors.yellow}→ Pour les builds Android:${colors.reset}`);
    console.log('  1. Installez Android Studio depuis https://developer.android.com/studio');
    console.log('  2. Installez les SDK Android via le SDK Manager d\'Android Studio');
    console.log('  3. Configurez ANDROID_HOME pour pointer vers votre installation du SDK');
  }
  
  if (process.platform === 'darwin' && execCommand('xcodebuild -version | head -n 1') === null) {
    console.log(`${colors.yellow}→ Pour les builds iOS:${colors.reset}`);
    console.log('  1. Installez Xcode depuis l\'App Store');
    console.log('  2. Ouvrez Xcode et acceptez les licences');
    console.log('  3. Installez les outils en ligne de commande avec: xcode-select --install');
  }
  
  if (easCli === null) {
    console.log(`${colors.yellow}→ Pour les builds cloud:${colors.reset}`);
    console.log('  1. Installez EAS CLI avec: npm install -g eas-cli');
    console.log('  2. Connectez-vous à votre compte Expo avec: npx eas login');
  }
  
  console.log(`\n${colors.magenta}=== RÉSUMÉ ===\n${colors.reset}`);
  
  // Résumé des builds possibles
  const canBuildAndroid = javaVersion !== null && androidSdkInstalled;
  const canBuildIos = process.platform === 'darwin' && execCommand('xcodebuild -version | head -n 1') !== null;
  const canBuildCloud = easCli !== null;
  
  console.log(`Build Android local: ${canBuildAndroid ? colors.green + 'Possible' + colors.reset : colors.red + 'Non disponible' + colors.reset}`);
  console.log(`Build iOS local: ${canBuildIos ? colors.green + 'Possible' + colors.reset : colors.red + 'Non disponible' + colors.reset}`);
  console.log(`Build Cloud (EAS): ${canBuildCloud ? colors.green + 'Possible' + colors.reset : colors.red + 'Non disponible' + colors.reset}`);
  
  console.log(`\n${colors.magenta}=== COMMANDES RECOMMANDÉES ===\n${colors.reset}`);
  
  if (canBuildAndroid) {
    console.log(`${colors.green}→ Pour générer un APK Android:${colors.reset}`);
    console.log('  npm run build:apk');
  }
  
  if (canBuildIos) {
    console.log(`${colors.green}→ Pour générer une archive iOS:${colors.reset}`);
    console.log('  npm run build:local:ios');
  }
  
  if (canBuildCloud) {
    console.log(`${colors.green}→ Pour un build cloud:${colors.reset}`);
    console.log('  npm run build:optimized:android');
    console.log('  npm run build:optimized:ios');
  }
  
  if (!canBuildAndroid && !canBuildIos && !canBuildCloud) {
    console.log(`${colors.yellow}→ Pour tester l'application sans build:${colors.reset}`);
    console.log('  npm run start:prod');
  }
}

// Exécuter la fonction principale
checkPrerequisites();
