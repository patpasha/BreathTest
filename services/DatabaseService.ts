import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';

// Cache en mémoire pour les techniques de respiration
let techniquesCache: BreathingTechnique[] | null = null;
let techniquesByCategoryCache: Record<string, BreathingTechnique[]> = {};

// Types pour les techniques de respiration

// Étape de respiration
export interface BreathingStep {
  name: string;
  duration: number; // en millisecondes
  instruction: string;
}

// Interface de base pour les techniques de respiration
export interface BreathingTechnique {
  id: string;
  title: string;
  description: string;
  duration: string;
  route: string;
  categories: string[];
  steps?: BreathingStep[];
  defaultDurationMinutes?: number;
  longDescription?: string[];
}

// Ouvrir la base de données
const db = openDatabaseSync('breathflow.db');

// Variable pour suivre si la base de données a déjà été initialisée
let dbInitialized = false;

/**
 * Initialise la base de données
 */
export const initDatabase = async (): Promise<void> => {
  // Si la base de données a déjà été initialisée, ne pas la réinitialiser
  if (dbInitialized) {
    console.log('Base de données déjà initialisée, ignoré');
    return;
  }
  
  try {
    // Créer la table des techniques de respiration avec toutes les colonnes nécessaires
    // Cette approche est plus rapide car elle évite de vérifier et d'ajouter des colonnes individuellement
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS breathing_techniques (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        duration TEXT NOT NULL,
        route TEXT NOT NULL,
        categories TEXT NOT NULL,
        steps TEXT,
        defaultDurationMinutes INTEGER DEFAULT 5,
        longDescription TEXT
      );
    `);
    
    console.log('Table breathing_techniques créée ou déjà existante avec toutes les colonnes nécessaires');
    
    // Vérifier si des données existent déjà
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM breathing_techniques');
    const count = result?.count || 0;
    
    if (count === 0) {
      console.log('Aucune technique trouvée, importation des données initiales...');
      await importInitialData();
    } else {
      console.log(`${count} techniques trouvées dans la base de données`);
      // Les vérifications et réparations sont désactivées pour accélérer le démarrage
    }
    
    // Marquer la base de données comme initialisée
    dbInitialized = true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
};

/**
 * Importe les données initiales depuis le fichier JSON
 */
const importInitialData = async (): Promise<void> => {
  try {
    // Charger les données directement depuis le fichier JSON
    const techniques: BreathingTechnique[] = require('../assets/data/breathing_techniques.json');
    
    // Insérer les données dans la base de données en utilisant une transaction
    await db.withTransactionAsync(async () => {
      for (const technique of techniques) {
        const result = await db.runAsync(
          `INSERT INTO breathing_techniques (id, title, description, duration, route, categories, steps, defaultDurationMinutes, longDescription) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            technique.id,
            technique.title,
            technique.description,
            technique.duration,
            technique.route,
            JSON.stringify(technique.categories),
            technique.steps ? JSON.stringify(technique.steps) : null,
            technique.defaultDurationMinutes || 5,
            technique.longDescription ? JSON.stringify(technique.longDescription) : null
          ]
        );
        console.log(`Technique ${technique.id} insérée, rowsAffected: ${result.changes}`);
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'importation des données initiales:', error);
    throw error;
  }
};

/**
 * Récupère toutes les techniques de respiration
 */
export const getAllBreathingTechniques = async (): Promise<BreathingTechnique[]> => {
  try {
    // Utiliser le cache si disponible
    if (techniquesCache !== null) {
      console.log('Utilisation du cache pour toutes les techniques');
      return techniquesCache;
    }

    console.log('Chargement de toutes les techniques depuis la base de données');
    const rows = await db.getAllAsync<any>('SELECT * FROM breathing_techniques');
    const techniques = rows.map((item: any) => ({
      ...item,
      categories: JSON.parse(item.categories),
      steps: item.steps ? JSON.parse(item.steps) : null,
      longDescription: item.longDescription ? JSON.parse(item.longDescription) : null
    }));
    
    // Mettre en cache les résultats
    techniquesCache = techniques;
    
    return techniques;
  } catch (error) {
    console.error('Erreur lors de la récupération des techniques:', error);
    throw error;
  }
};

/**
 * Récupère les techniques de respiration par catégorie
 */
export const getBreathingTechniquesByCategory = async (category: string): Promise<BreathingTechnique[]> => {
  try {
    if (category === 'all') {
      // Si la catégorie est "all", retourner toutes les techniques
      return await getAllBreathingTechniques();
    }
    
    // Vérifier si la catégorie est déjà en cache
    if (techniquesByCategoryCache[category]) {
      console.log(`Utilisation du cache pour la catégorie ${category}`);
      return techniquesByCategoryCache[category];
    }
    
    console.log(`Chargement des techniques pour la catégorie ${category}`);
    
    // Utiliser le cache global si disponible
    if (techniquesCache !== null) {
      const filteredTechniques = techniquesCache.filter(
        (technique: BreathingTechnique) => technique.categories.includes(category)
      );
      
      // Mettre en cache les résultats filtrés
      techniquesByCategoryCache[category] = filteredTechniques;
      
      return filteredTechniques;
    }
    
    // Sinon, récupérer toutes les techniques et filtrer
    const rows = await db.getAllAsync<any>('SELECT * FROM breathing_techniques');
    const techniques = rows
      .map((item: any) => ({
        ...item,
        categories: JSON.parse(item.categories),
        steps: item.steps ? JSON.parse(item.steps) : null,
        longDescription: item.longDescription ? JSON.parse(item.longDescription) : null
      }));
      
    // Mettre en cache toutes les techniques
    techniquesCache = techniques;
    
    // Filtrer et mettre en cache les résultats filtrés
    const filteredTechniques = techniques.filter(
      (technique: BreathingTechnique) => technique.categories.includes(category)
    );
    
    techniquesByCategoryCache[category] = filteredTechniques;
    
    return filteredTechniques;
  } catch (error) {
    console.error('Erreur lors de la récupération des techniques par catégorie:', error);
    throw error;
  }
};

/**
 * Récupère une technique de respiration par son ID
 */
export const getBreathingTechniqueById = async (id: string): Promise<BreathingTechnique | null> => {
  try {
    // Vérifier d'abord dans le cache global
    if (techniquesCache !== null) {
      const cachedTechnique = techniquesCache.find(t => t.id === id);
      if (cachedTechnique) {
        console.log(`Technique ${id} trouvée dans le cache`);
        return cachedTechnique;
      }
    }
    
    console.log(`Chargement de la technique ${id} depuis la base de données`);
    const technique = await db.getFirstAsync<any>('SELECT * FROM breathing_techniques WHERE id = ?', [id]);
    
    if (!technique) {
      return null;
    }
    
    const parsedTechnique = {
      ...technique,
      categories: JSON.parse(technique.categories),
      steps: technique.steps ? JSON.parse(technique.steps) : null,
      longDescription: technique.longDescription ? JSON.parse(technique.longDescription) : null
    };
    
    return parsedTechnique;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la technique ${id}:`, error);
    throw error;
  }
};

/**
 * Met à jour une technique de respiration
 */
export const updateBreathingTechnique = async (technique: BreathingTechnique): Promise<void> => {
  try {
    const result = await db.runAsync(
      `UPDATE breathing_techniques 
       SET title = ?, description = ?, duration = ?, route = ?, categories = ?, steps = ?, defaultDurationMinutes = ?, longDescription = ? 
       WHERE id = ?`,
      [
        technique.title,
        technique.description,
        technique.duration,
        technique.route,
        JSON.stringify(technique.categories),
        technique.steps ? JSON.stringify(technique.steps) : null,
        technique.defaultDurationMinutes || 5,
        technique.longDescription ? JSON.stringify(technique.longDescription) : null,
        technique.id
      ]
    );
    
    if (result.changes === 0) {
      throw new Error(`Aucune technique trouvée avec l'ID ${technique.id}`);
    }
    
    // Invalider le cache après une mise à jour
    techniquesCache = null;
    techniquesByCategoryCache = {};
    console.log('Cache invalidé après mise à jour d\'une technique');
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la technique ${technique.id}:`, error);
    throw error;
  }
};

/**
 * Supprime la base de données (utile pour les tests ou la réinitialisation)
 */
export const resetDatabase = async (): Promise<void> => {
  try {
    await db.execAsync('DROP TABLE IF EXISTS breathing_techniques');
    console.log('Table breathing_techniques supprimée');
    
    // Réinitialiser le cache
    techniquesCache = null;
    techniquesByCategoryCache = {};
    console.log('Cache invalidé');
    
    // Réinitialiser la base de données
    await initDatabase();
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de la base de données:', error);
    throw error;
  }
};

/**
 * Fonction pour invalider le cache (utile lors des mises à jour ou des tests)
 */
export const invalidateCache = (): void => {
  techniquesCache = null;
  techniquesByCategoryCache = {};
  console.log('Cache invalidé manuellement');
};

// Exporter la connexion à la base de données pour un usage avancé si nécessaire
export { db };