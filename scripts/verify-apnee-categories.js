// Script pour vérifier les catégories de la technique d'apnée

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Chemin vers le fichier de base de données SQLite
// Note: Ce chemin peut varier selon l'environnement
const dbPath = path.resolve(process.env.HOME, 'Library/Developer/CoreSimulator/Devices');

function findDatabaseFile(startPath) {
  if (!fs.existsSync(startPath)) {
    console.log("Le répertoire de départ n'existe pas:", startPath);
    return null;
  }

  let result = null;
  const files = fs.readdirSync(startPath);
  
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);
    
    if (stat.isDirectory()) {
      const found = findDatabaseFile(filename);
      if (found) {
        result = found;
        break;
      }
    } else if (filename.endsWith('breathflow.db')) {
      result = filename;
      break;
    }
  }
  
  return result;
}

// Trouver le fichier de base de données
const dbFile = findDatabaseFile(dbPath);

if (!dbFile) {
  console.error("Impossible de trouver le fichier de base de données breathflow.db");
  process.exit(1);
}

console.log("Fichier de base de données trouvé:", dbFile);

// Ouvrir la base de données
const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Erreur lors de l'ouverture de la base de données:", err.message);
    process.exit(1);
  }
  console.log("Connexion à la base de données établie");
});

// Vérifier les catégories de la technique d'apnée
db.get("SELECT * FROM breathing_techniques WHERE id = 'apnee'", (err, row) => {
  if (err) {
    console.error("Erreur lors de la requête:", err.message);
  } else if (!row) {
    console.log("La technique d'apnée n'existe pas dans la base de données");
  } else {
    console.log("Technique d'apnée trouvée:");
    console.log("ID:", row.id);
    console.log("Titre:", row.title);
    console.log("Description:", row.description);
    
    try {
      const categories = JSON.parse(row.categories);
      console.log("Catégories:", categories);
    } catch (e) {
      console.log("Catégories (format brut):", row.categories);
    }
  }
  
  // Fermer la base de données
  db.close((err) => {
    if (err) {
      console.error("Erreur lors de la fermeture de la base de données:", err.message);
    } else {
      console.log("Connexion à la base de données fermée");
    }
  });
});
