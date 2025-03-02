/**
 * Script pour optimiser les images de l'application (PNG, JPEG, WebP)
 * 
 * Ce script utilise sharp pour compresser les images sans perte visible de qualité.
 * Il faut installer sharp via npm: npm install sharp --save-dev
 * 
 * Utilisation: node scripts/optimize-images.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Fonction pour trouver tous les fichiers d'image de manière récursive
async function findImageFiles(dir) {
  const files = await readdir(dir);
  const imageFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      // Ignorer node_modules, .git et .expo
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo') {
        const subDirFiles = await findImageFiles(filePath);
        imageFiles.push(...subDirFiles);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        imageFiles.push(filePath);
      }
    }
  }

  return imageFiles;
}

// Fonction principale
async function optimizeImages() {
  try {
    console.log('Recherche des images à optimiser...');
    
    // Vérifier si sharp est installé
    try {
      require.resolve('sharp');
    } catch (e) {
      console.error('Le module sharp n\'est pas installé. Veuillez l\'installer avec:');
      console.error('npm install sharp --save-dev');
      process.exit(1);
    }
    
    const sharp = require('sharp');
    
    // Trouver tous les fichiers d'images
    const imageFiles = await findImageFiles(path.resolve(__dirname, '..'));
    
    console.log(`${imageFiles.length} fichiers d'images trouvés.`);
    
    // Optimiser chaque image
    let totalSaved = 0;
    let optimizedCount = 0;
    let skippedCount = 0;
    
    for (const file of imageFiles) {
      try {
        const originalSize = fs.statSync(file).size;
        const ext = path.extname(file).toLowerCase();
        
        // Ignorer les petites images (moins de 10 Ko)
        if (originalSize < 10 * 1024) {
          console.log(`${file}: Ignoré (taille < 10 Ko)`);
          skippedCount++;
          continue;
        }
        
        // Créer un fichier temporaire
        const tempFile = `${file}.temp`;
        
        // Optimiser l'image selon son format
        const sharpInstance = sharp(file);
        
        if (ext === '.png') {
          await sharpInstance
            .png({ quality: 85, compressionLevel: 9, palette: true })
            .toFile(tempFile);
        } else if (ext === '.jpg' || ext === '.jpeg') {
          await sharpInstance
            .jpeg({ quality: 85, progressive: true })
            .toFile(tempFile);
        } else if (ext === '.webp') {
          await sharpInstance
            .webp({ quality: 85 })
            .toFile(tempFile);
        }
        
        const newSize = fs.statSync(tempFile).size;
        
        // Ne remplacer que si la nouvelle taille est plus petite
        if (newSize < originalSize) {
          const saved = originalSize - newSize;
          totalSaved += saved;
          
          // Remplacer l'original par la version optimisée
          fs.unlinkSync(file);
          fs.renameSync(tempFile, file);
          
          console.log(`${file}: ${(saved / 1024).toFixed(2)} Ko économisés (${(saved / originalSize * 100).toFixed(2)}%)`);
          optimizedCount++;
        } else {
          // Supprimer le fichier temporaire si pas d'amélioration
          fs.unlinkSync(tempFile);
          console.log(`${file}: Pas d'amélioration possible, fichier conservé`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`Erreur lors de l'optimisation de ${file}: ${error.message}`);
        console.log(`Fichier ${file} ignoré.`);
        skippedCount++;
      }
    }
    
    console.log(`\nOptimisation terminée!`);
    console.log(`- Images optimisées: ${optimizedCount}`);
    console.log(`- Images ignorées: ${skippedCount}`);
    console.log(`- Total économisé: ${(totalSaved / 1024 / 1024).toFixed(2)} Mo`);
    
  } catch (error) {
    console.error('Erreur lors de l\'optimisation des images:', error);
  }
}

// Exécuter la fonction principale
optimizeImages();
