const fs = require('fs');
const path = require('path');

// Liste des fichiers à modifier
const screenFiles = [
  'RespirationAlterneeScreen.tsx',
  'RespirationBoxScreen.tsx',
  'RespirationButeykoScreen.tsx',
  'RespirationCoherenteScreen.tsx',
  'RespirationUjjayiScreen.tsx',
];

// Chemin vers le répertoire des écrans
const screensDir = path.join(__dirname, 'screens');

// Fonction pour appliquer les modifications à un fichier
function fixThemeInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Corriger le style fixedButtonContainer
    content = content.replace(
      /fixedButtonContainer: \{\s*position: 'absolute',\s*bottom: 0,\s*left: 0,\s*right: 0,\s*paddingHorizontal: 20,\s*paddingVertical: 15,\s*backgroundColor: theme\.background,\s*borderTopWidth: 1,\s*borderTopColor: theme\.border,\s*shadowColor: '#000',/g,
      "fixedButtonContainer: {\n    position: 'absolute',\n    bottom: 0,\n    left: 0,\n    right: 0,\n    paddingHorizontal: 20,\n    paddingVertical: 15,\n    shadowColor: '#000',"
    );
    
    // 2. Mettre à jour la référence au style dans le JSX
    content = content.replace(
      /<View style=\{styles\.fixedButtonContainer\}>/g,
      "<View style={[styles.fixedButtonContainer, { backgroundColor: theme.background, borderTopColor: theme.border, borderTopWidth: 1 }]}>"
    );
    
    // Écrire le contenu mis à jour dans le fichier
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Correction réussie pour ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la correction de ${path.basename(filePath)}:`, error);
    return false;
  }
}

// Appliquer les modifications à chaque fichier
let successCount = 0;
for (const file of screenFiles) {
  const filePath = path.join(screensDir, file);
  if (fs.existsSync(filePath)) {
    const success = fixThemeInFile(filePath);
    if (success) successCount++;
  } else {
    console.error(`Le fichier ${file} n'existe pas dans le répertoire des écrans.`);
  }
}

console.log(`Correction terminée. ${successCount}/${screenFiles.length} fichiers ont été mis à jour avec succès.`);
