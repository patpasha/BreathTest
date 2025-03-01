/**
 * Script pour optimiser les images PNG de l'application
 * 
 * Ce script utilise sharp pour compresser les images PNG sans perte visible de qualité.
 * Il faut installer sharp via npm: npm install sharp --save-dev
 * 
 * Utilisation: node scripts/optimize-images.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Fonction pour trouver tous les fichiers PNG de manière récursive
async function findPngFiles(dir) {
  const files = await readdir(dir);
  const pngFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      // Ignorer node_modules et .git
      if (file !== 'node_modules' && file !== '.git') {
        const subDirFiles = await findPngFiles(filePath);
        pngFiles.push(...subDirFiles);
      }
    } else if (file.toLowerCase().endsWith('.png')) {
      pngFiles.push(filePath);
    }
  }

  return pngFiles;
}

// Fonction principale
async function optimizeImages() {
  try {
    console.log('Recherche des images PNG à optimiser...');
    
    // Vérifier si sharp est installé
    try {
      require.resolve('sharp');
    } catch (e) {
      console.error('Le module sharp n\'est pas installé. Veuillez l\'installer avec:');
      console.error('npm install sharp --save-dev');
      process.exit(1);
    }
    
    const sharp = require('sharp');
    
    // Trouver tous les fichiers PNG
    const pngFiles = await findPngFiles(path.resolve(__dirname, '..'));
    
    console.log(`${pngFiles.length} fichiers PNG trouvés.`);
    
    // Optimiser chaque image
    let totalSaved = 0;
    
    for (const file of pngFiles) {
      const originalSize = fs.statSync(file).size;
      
      // Créer un fichier temporaire
      const tempFile = `${file}.temp`;
      
      // Optimiser l'image
      await sharp(file)
        .png({ quality: 85, compressionLevel: 9 })
        .toFile(tempFile);
      
      const newSize = fs.statSync(tempFile).size;
      const saved = originalSize - newSize;
      totalSaved += saved;
      
      // Remplacer l'original par la version optimisée
      fs.unlinkSync(file);
      fs.renameSync(tempFile, file);
      
      console.log(`${file}: ${(saved / 1024).toFixed(2)} Ko économisés (${(saved / originalSize * 100).toFixed(2)}%)`);
    }
    
    console.log(`\nOptimisation terminée! Total économisé: ${(totalSaved / 1024 / 1024).toFixed(2)} Mo`);
    
  } catch (error) {
    console.error('Erreur lors de l\'optimisation des images:', error);
  }
}

// Exécuter la fonction principale
optimizeImages();
