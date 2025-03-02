/**
 * Script pour supprimer le code spécifique au développement
 * 
 * Ce script parcourt tous les fichiers .js, .jsx, .ts et .tsx du projet
 * et supprime:
 * 1. Les blocs 
 * 2. Les blocs entre les commentaires 
 * 
 * Utilisation: node scripts/remove-dev-code.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Fonction pour trouver tous les fichiers JS/TS de manière récursive
async function findJsFiles(dir) {
  const files = await readdir(dir);
  const jsFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      // Ignorer node_modules, .git, .expo, build, dist
      if (!['node_modules', '.git', '.expo', 'build', 'dist'].includes(file)) {
        const subDirFiles = await findJsFiles(filePath);
        jsFiles.push(...subDirFiles);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        jsFiles.push(filePath);
      }
    }
  }

  return jsFiles;
}

// Fonction pour supprimer les blocs 
function removeDevBlocks(content) {
  // Regex pour trouver les blocs 
  // Cette regex est simplifiée et peut ne pas fonctionner pour tous les cas
  const ifDevRegex = /if\s*\(\s*__DEV__\s*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  return content.replace(ifDevRegex, '');
}

// Fonction pour supprimer les blocs entre 
function removeDevCommentBlocks(content) {
  // Regex pour trouver les blocs entre 
  const devCommentRegex = /\/\/\s*__DEV__\s*START[\s\S]*?\/\/\s*__DEV__\s*END/g;
  return content.replace(devCommentRegex, '');
}

// Fonction principale
async function removeDevCode() {
  try {
    console.log('Recherche des fichiers JS/TS...');
    
    // Trouver tous les fichiers JS/TS
    const jsFiles = await findJsFiles(path.resolve(__dirname, '..'));
    
    console.log(`${jsFiles.length} fichiers JS/TS trouvés.`);
    
    let modifiedCount = 0;
    
    for (const file of jsFiles) {
      try {
        // Lire le contenu du fichier
        const content = await readFile(file, 'utf8');
        
        // Supprimer les blocs de développement
        const contentWithoutDevBlocks = removeDevBlocks(content);
        const finalContent = removeDevCommentBlocks(contentWithoutDevBlocks);
        
        // Si le contenu a été modifié, écrire le nouveau contenu
        if (content !== finalContent) {
          await writeFile(file, finalContent, 'utf8');
          console.log(`${file}: Code de développement supprimé`);
          modifiedCount++;
        }
      } catch (error) {
        console.error(`Erreur lors du traitement de ${file}: ${error.message}`);
      }
    }
    
    console.log(`\nTraitement terminé!`);
    console.log(`- Fichiers modifiés: ${modifiedCount}`);
    
  } catch (error) {
    console.error('Erreur lors de la suppression du code de développement:', error);
  }
}

// Exécuter la fonction principale
removeDevCode();
