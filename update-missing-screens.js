const fs = require('fs');
const path = require('path');

// Liste des fichiers à modifier
const screenFiles = [
  'PhysiologicalSighScreen.tsx',
  'CyclicHyperventilationScreen.tsx',
  'WimHofScreen.tsx',
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
    
    // 2. Remplacer la fermeture du ScrollView et ajouter le bouton fixe
    content = content.replace(
      /<\/ScrollView>\s*<\/SafeAreaView>/g,
      '</ScrollView>\n        \n        {/* Bouton fixe en bas de l\'écran */}\n        <View style={[styles.fixedButtonContainer, { backgroundColor: theme.background, borderTopColor: theme.border, borderTopWidth: 1 }]}>\n          {!isActive ? (\n            <TouchableOpacity \n              style={[styles.startButton, { backgroundColor: theme.primary }]} \n              onPress={handleStart}\n            >\n              <Text style={styles.buttonText}>Commencer</Text>\n            </TouchableOpacity>\n          ) : (\n            <TouchableOpacity \n              style={[styles.stopButton, { backgroundColor: theme.error }]} \n              onPress={handleStop}\n            >\n              <Text style={styles.buttonText}>Arrêter</Text>\n            </TouchableOpacity>\n          )}\n        </View>\n      </View>\n    </SafeAreaView>'
    );
    
    // 3. Supprimer le conteneur de bouton existant
    content = content.replace(
      /<View style=\{styles\.buttonContainer\}>\s*\{!isActive \? \(\s*<TouchableOpacity\s*style=\{\[styles\.startButton, \{ backgroundColor: theme\.primary \}\]\}\s*onPress=\{handleStart\}\s*>\s*<Text style=\{styles\.buttonText\}>Commencer<\/Text>\s*<\/TouchableOpacity>\s*\) : \(\s*<TouchableOpacity\s*style=\{\[styles\.stopButton, \{ backgroundColor: theme\.error \}\]\}\s*onPress=\{handleStop\}\s*>\s*<Text style=\{styles\.buttonText\}>Arrêter<\/Text>\s*<\/TouchableOpacity>\s*\)\}\s*<\/View>/g,
      ''
    );
    
    // 4. Mettre à jour les styles
    content = content.replace(
      /const styles = StyleSheet\.create\(\{\s*container: \{\s*flex: 1,\s*\},\s*scrollContainer: \{\s*flexGrow: 1,/g,
      'const styles = StyleSheet.create({\n  container: {\n    flex: 1,\n  },\n  mainContainer: {\n    flex: 1,\n    position: \'relative\',\n  },\n  scrollContainer: {\n    flexGrow: 1,'
    );
    
    // 5. Modifier le paddingBottom dans scrollContainer
    content = content.replace(
      /scrollContainer: \{\s*flexGrow: 1,\s*alignItems: 'center',\s*paddingHorizontal: \d+,\s*paddingBottom: \d+,\s*\},/g,
      'scrollContainer: {\n    flexGrow: 1,\n    alignItems: \'center\',\n    paddingHorizontal: 20,\n    paddingBottom: 80, // Espace pour le bouton fixe\n  },'
    );
    
    // 6. Ajouter le style fixedButtonContainer
    content = content.replace(
      /buttonContainer: \{\s*marginTop: \d+,\s*paddingHorizontal: \d+,\s*width: ['"]100%['"]\s*\},/g,
      'fixedButtonContainer: {\n    position: \'absolute\',\n    bottom: 0,\n    left: 0,\n    right: 0,\n    paddingHorizontal: 20,\n    paddingVertical: 15,\n    shadowColor: \'#000\',\n    shadowOffset: { width: 0, height: -2 },\n    shadowOpacity: 0.1,\n    shadowRadius: 3,\n    elevation: 5,\n  },'
    );
    
    // Écrire le contenu mis à jour dans le fichier
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Mise à jour réussie pour ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de ${path.basename(filePath)}:`, error);
    return false;
  }
}

// Appliquer les modifications à chaque fichier
let successCount = 0;
for (const file of screenFiles) {
  const filePath = path.join(screensDir, file);
  if (fs.existsSync(filePath)) {
    const success = updateScreenFile(filePath);
    if (success) successCount++;
  } else {
    console.error(`Le fichier ${file} n'existe pas dans le répertoire des écrans.`);
  }
}

console.log(`Mise à jour terminée. ${successCount}/${screenFiles.length} fichiers ont été mis à jour avec succès.`);
