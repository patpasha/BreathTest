/**
 * Script pour analyser la taille des dépendances du projet
 * 
 * Ce script utilise la commande 'du' pour analyser la taille des dossiers
 * dans node_modules et identifier les dépendances les plus volumineuses.
 * 
 * Utilisation: node scripts/analyze-bundle.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Chemin vers le dossier node_modules
const nodeModulesPath = path.resolve(__dirname, '../node_modules');

// Vérifier si le dossier node_modules existe
if (!fs.existsSync(nodeModulesPath)) {
  console.error('Le dossier node_modules n\'existe pas. Exécutez d\'abord npm install.');
  process.exit(1);
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

// Analyser la taille des dépendances
function analyzeDependencies() {
  console.log('Analyse de la taille des dépendances...\n');
  
  try {
    // Obtenir la taille totale de node_modules
    const totalSizeCmd = `du -sk "${nodeModulesPath}" | cut -f1`;
    const totalSizeKb = parseInt(execSync(totalSizeCmd).toString().trim());
    
    console.log(`Taille totale de node_modules: ${formatSize(totalSizeKb * 1024)}\n`);
    
    // Obtenir la taille de chaque dépendance directe
    const depSizesCmd = `find "${nodeModulesPath}" -maxdepth 1 -type d | grep -v "^${nodeModulesPath}$" | xargs du -sk | sort -nr`;
    const depSizes = execSync(depSizesCmd).toString().trim().split('\n');
    
    // Analyser et afficher les résultats
    console.log('Top 20 des dépendances les plus volumineuses:');
    console.log('-------------------------------------------');
    
    const dependencies = depSizes
      .filter(line => line.trim() !== '')
      .map(line => {
        const [sizeKb, path] = line.trim().split(/\s+/);
        const name = path.split('/').pop();
        return { name, sizeKb: parseInt(sizeKb), sizeBytes: parseInt(sizeKb) * 1024 };
      })
      .slice(0, 20);
    
    // Calculer le pourcentage par rapport au total
    dependencies.forEach(dep => {
      const percentage = (dep.sizeBytes / (totalSizeKb * 1024) * 100).toFixed(2);
      console.log(`${dep.name}: ${formatSize(dep.sizeBytes)} (${percentage}% du total)`);
    });
    
    // Analyser le package.json pour identifier les dépendances non utilisées
    console.log('\nAnalyse des dépendances du package.json...');
    
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = require(packageJsonPath);
    
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    const depNames = Object.keys(allDeps);
    console.log(`Nombre total de dépendances déclarées: ${depNames.length}`);
    
    // Suggestions d'optimisation
    console.log('\nSuggestions d\'optimisation:');
    console.log('-------------------------');
    console.log('1. Envisagez d\'utiliser des alternatives plus légères pour les dépendances volumineuses');
    console.log('2. Utilisez des techniques de tree-shaking pour éliminer le code non utilisé');
    console.log('3. Vérifiez si certaines dépendances peuvent être déplacées en devDependencies');
    console.log('4. Utilisez des outils comme "import-cost" pour surveiller la taille des imports');
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse des dépendances:', error);
  }
}

// Exécuter l'analyse
analyzeDependencies();
