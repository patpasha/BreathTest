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
function updateScreenFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Remplacer la structure du ScrollView et du bouton
    content = content.replace(
      /<SafeAreaView style=\{\[styles\.container, \{ backgroundColor: theme\.background \}\]\}>\s*<ScrollView\s*contentContainerStyle=\{styles\.scrollContainer\}\s*showsVerticalScrollIndicator=\{false\}\s*>/g,
      '<SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>\n      <View style={styles.mainContainer}>\n        <ScrollView \n          contentContainerStyle={styles.scrollContainer}\n          showsVerticalScrollIndicator={false}\n        >'
    );
    
    // 2. Remplacer la fermeture du ScrollView
    content = content.replace(
      /<\/ScrollView>\s*<\/SafeAreaView>/g,
      '</ScrollView>\n        \n        {/* Bouton fixe en bas de l\'écran */}\n        <View style={styles.fixedButtonContainer}>\n          {!isActive ? (\n            <TouchableOpacity \n              style={[styles.startButton, { backgroundColor: theme.primary }]} \n              onPress={handleStart}\n            >\n              <Text style={styles.buttonText}>Commencer</Text>\n            </TouchableOpacity>\n          ) : (\n            <TouchableOpacity \n              style={[styles.stopButton, { backgroundColor: theme.error }]} \n              onPress={handleStop}\n            >\n              <Text style={styles.buttonText}>Arrêter</Text>\n            </TouchableOpacity>\n          )}\n        </View>\n      </View>\n    </SafeAreaView>'
    );
    
    // 3. Remplacer le conteneur du bouton existant
    content = content.replace(
      /<View style=\{styles\.buttonContainer\}>\s*\{!isActive \? \(\s*<TouchableOpacity\s*style=\{\[styles\.startButton, \{ backgroundColor: theme\.primary \}\]\}\s*onPress=\{handleStart\}\s*>\s*<Text style=\{styles\.buttonText\}>Commencer<\/Text>\s*<\/TouchableOpacity>\s*\) : \(\s*<TouchableOpacity\s*style=\{\[styles\.stopButton, \{ backgroundColor: theme\.error \}\]\}\s*onPress=\{handleStop\}\s*>\s*<Text style=\{styles\.buttonText\}>Arrêter<\/Text>\s*<\/TouchableOpacity>\s*\)\}\s*<\/View>/g,
      ''
    );
    
    // 4. Mettre à jour les styles
    content = content.replace(
      /const styles = StyleSheet\.create\(\{\s*container: \{\s*flex: 1,\s*\},\s*scrollContainer: \{\s*flexGrow: 1,\s*paddingBottom: \d+,\s*\},/g,
      'const styles = StyleSheet.create({\n  container: {\n    flex: 1,\n  },\n  mainContainer: {\n    flex: 1,\n    position: \'relative\',\n  },\n  scrollContainer: {\n    flexGrow: 1,\n    paddingBottom: 80, // Espace pour le bouton fixe\n  },'
    );
    
    // 5. Remplacer le style du conteneur de bouton
    content = content.replace(
      /buttonContainer: \{\s*paddingHorizontal: \d+,\s*marginBottom: \d+,\s*\},/g,
      'fixedButtonContainer: {\n    position: \'absolute\',\n    bottom: 0,\n    left: 0,\n    right: 0,\n    paddingHorizontal: 20,\n    paddingVertical: 15,\n    backgroundColor: theme.background,\n    borderTopWidth: 1,\n    borderTopColor: theme.border,\n    shadowColor: \'#000\',\n    shadowOffset: { width: 0, height: -2 },\n    shadowOpacity: 0.1,\n    shadowRadius: 3,\n    elevation: 5,\n  },'
    );
    
    // Écrire le contenu mis à jour dans le fichier
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Mise à jour réussie pour ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de ${path.basename(filePath)}:`, error);
  }
}

// Appliquer les modifications à tous les fichiers
screenFiles.forEach(file => {
  const filePath = path.join(screensDir, file);
  updateScreenFile(filePath);
});

console.log('Mise à jour terminée pour tous les écrans.');
