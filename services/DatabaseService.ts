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