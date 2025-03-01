const fs = require('fs');
const path = require('path');

// Liste des techniques de respiration
const techniques = [
  {
    filename: 'RespirationAlterneeScreen.tsx',
    id: 'respiration-alternee',
    name: 'Respiration Alternée'
  },
  {
    filename: 'RespirationButeykoScreen.tsx',
    id: 'respiration-buteyko',
    name: 'Méthode Buteyko'
  },
  {
    filename: 'RespirationCoherenteScreen.tsx',
    id: 'respiration-coherente',
    name: 'Respiration Cohérente'
  },
  {
    filename: 'RespirationDiaphragmatiqueScreen.tsx',
    id: 'respiration-diaphragmatique',
    name: 'Respiration Diaphragmatique'
  },
  {
    filename: 'RespirationTummoScreen.tsx',
    id: 'respiration-tummo',
    name: 'Respiration Tummo'
  },
  {
    filename: 'RespirationUjjayiScreen.tsx',
    id: 'respiration-ujjayi',
    name: 'Respiration Ujjayi'
  },
  {
    filename: 'CyclicHyperventilationScreen.tsx',
    id: 'hyperventilation-cyclique',
    name: 'Hyperventilation Cyclique'
  },
  {
    filename: 'WimHofScreen.tsx',
    id: 'wim-hof',
    name: 'Méthode Wim Hof'
  }
];

// Chemin vers le dossier des écrans
const screensDir = path.join(__dirname, '..', 'screens');

// Fonction pour ajouter l'import de useStats
function addStatsImport(content) {
  // Vérifier si l'import existe déjà
  if (content.includes("import { useStats }")) {
    return content;
  }
  
  // Ajouter l'import après l'import de SettingsContext
  return content.replace(
    "import { useSettings } from '../contexts/SettingsContext';",
    "import { useSettings } from '../contexts/SettingsContext';\nimport { useStats } from '../contexts/StatsContext';"
  );
}

// Fonction pour ajouter l'utilisation de useStats
function addUseStats(content, componentName) {
  // Vérifier si useStats est déjà utilisé
  if (content.includes("const { addSession }")) {
    return content;
  }
  
  // Trouver la ligne avec useSettings
  const settingsRegex = new RegExp(`const ${componentName} = \\(\\) => {\\s+const { settings } = useSettings\\(\\);`);
  
  // Remplacer avec l'ajout de useStats
  return content.replace(
    settingsRegex,
    `const ${componentName} = () => {\n  const { settings } = useSettings();\n  const { addSession } = useStats();`
  );
}

// Fonction pour ajouter la variable sessionStartTime
function addSessionStartTime(content) {
  // Vérifier si sessionStartTime existe déjà
  if (content.includes("sessionStartTime")) {
    return content;
  }
  
  // Trouver la déclaration des états
  const stateRegex = /const \[timeRemaining, setTimeRemaining\] = useState\(duration\);/;
  
  // Ajouter sessionStartTime après timeRemaining
  return content.replace(
    stateRegex,
    `const [timeRemaining, setTimeRemaining] = useState(duration);\n  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);`
  );
}

// Fonction pour modifier handleStart
function modifyHandleStart(content) {
  // Vérifier si la modification existe déjà
  if (content.includes("setSessionStartTime(new Date())")) {
    return content;
  }
  
  // Trouver la fonction handleStart
  const startRegex = /const handleStart = \(\) => {[\s\S]*?};/;
  
  // Extraire la fonction
  const startMatch = content.match(startRegex);
  if (!startMatch) return content;
  
  // Ajouter setSessionStartTime à la fin de la fonction
  const updatedStart = startMatch[0].replace(
    /};$/,
    `  setSessionStartTime(new Date());\n  };`
  );
  
  return content.replace(startRegex, updatedStart);
}

// Fonction pour modifier handleStop
function modifyHandleStop(content, techniqueId, techniqueName) {
  // Vérifier si la modification existe déjà
  if (content.includes(`techniqueId: '${techniqueId}'`)) {
    return content;
  }
  
  // Trouver la fonction handleStop
  const stopRegex = /const handleStop = \(\) => {[\s\S]*?};/;
  
  // Extraire la fonction
  const stopMatch = content.match(stopRegex);
  if (!stopMatch) return content;
  
  // Créer la nouvelle fonction
  const newStop = `const handleStop = async () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    
    // Enregistrer la session interrompue dans les statistiques
    if (sessionStartTime) {
      const sessionDuration = Math.floor((duration - timeRemaining));
      console.log('Session ${techniqueName} interrompue après', sessionDuration, 'secondes'); // Debug
      
      // N'enregistrer que si la session a duré au moins 10 secondes
      if (sessionDuration >= 10) {
        try {
          await addSession({
            techniqueId: '${techniqueId}',
            techniqueName: '${techniqueName}',
            duration: sessionDuration,
            date: new Date().toISOString(),
            completed: false
          });
          console.log('Session ${techniqueName} interrompue enregistrée avec succès'); // Debug
        } catch (error) {
          console.error('Erreur lors de l\\'enregistrement de la session interrompue:', error);
        }
      }
    }
  };`;
  
  return content.replace(stopRegex, newStop);
}

// Fonction pour modifier handleComplete
function modifyHandleComplete(content, techniqueId, techniqueName) {
  // Vérifier si la modification existe déjà
  if (content.includes(`techniqueId: '${techniqueId}'`)) {
    return content;
  }
  
  // Trouver la fonction handleComplete
  const completeRegex = /const handleComplete = \(\) => {[\s\S]*?};/;
  
  // Extraire la fonction
  const completeMatch = content.match(completeRegex);
  if (!completeMatch) return content;
  
  // Extraire le contenu de la fonction
  const originalFunction = completeMatch[0];
  
  // Trouver l'appel à Alert.alert
  const alertRegex = /Alert\.alert\([\s\S]*?\);/;
  const alertMatch = originalFunction.match(alertRegex);
  
  if (!alertMatch) return content;
  
  // Créer la nouvelle fonction
  let newComplete = `const handleComplete = async () => {
    setIsActive(false);
    setCurrentStep(0);
    animatedValue.setValue(0);
    
    playComplete();
    successNotification();
    
    // Enregistrer la session dans les statistiques
    if (sessionStartTime) {
      const sessionDuration = Math.floor((duration - timeRemaining));
      console.log('Session ${techniqueName} complétée après', sessionDuration, 'secondes'); // Debug
      
      try {
        await addSession({
          techniqueId: '${techniqueId}',
          techniqueName: '${techniqueName}',
          duration: sessionDuration,
          date: new Date().toISOString(),
          completed: true
        });
        console.log('Session ${techniqueName} complète enregistrée avec succès'); // Debug
      } catch (error) {
        console.error('Erreur lors de l\\'enregistrement de la session complète:', error);
      }
    }
    
    ${alertMatch[0]}
  };`;
  
  return content.replace(completeRegex, newComplete);
}

// Traiter chaque technique
techniques.forEach(technique => {
  const filePath = path.join(screensDir, technique.filename);
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(filePath)) {
    console.log(`Le fichier ${technique.filename} n'existe pas.`);
    return;
  }
  
  // Lire le contenu du fichier
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extraire le nom du composant
  const componentNameMatch = content.match(/const (\w+) = \(\) => {/);
  if (!componentNameMatch) {
    console.log(`Impossible de trouver le nom du composant dans ${technique.filename}`);
    return;
  }
  const componentName = componentNameMatch[1];
  
  // Appliquer les modifications
  content = addStatsImport(content);
  content = addUseStats(content, componentName);
  content = addSessionStartTime(content);
  content = modifyHandleStart(content);
  content = modifyHandleStop(content, technique.id, technique.name);
  content = modifyHandleComplete(content, technique.id, technique.name);
  
  // Écrire le contenu modifié
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log(`Modifications appliquées à ${technique.filename}`);
});

console.log('Terminé !');
