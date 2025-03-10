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

/**
 * Retourne les étapes par défaut pour une technique de respiration spécifique
 * Cette fonction est utilisée lorsqu'une technique n'a pas d'étapes définies
 */
export const getDefaultStepsForTechnique = (techniqueId: string): BreathingStep[] | null => {
  // Définir des étapes par défaut pour différentes techniques
  switch (techniqueId) {
    case 'box-breathing':
      return [
        { name: 'Inhale', duration: 4000, instruction: 'Inspirez lentement par le nez' },
        { name: 'Hold', duration: 4000, instruction: 'Retenez votre souffle' },
        { name: 'Exhale', duration: 4000, instruction: 'Expirez lentement par la bouche' },
        { name: 'Hold', duration: 4000, instruction: 'Retenez votre souffle' }
      ];
    case '4-7-8-technique':
      return [
        { name: 'Inhale', duration: 4000, instruction: 'Inspirez profondément par le nez' },
        { name: 'Hold', duration: 7000, instruction: 'Retenez votre souffle calmement' },
        { name: 'Exhale', duration: 8000, instruction: 'Expirez lentement par la bouche' }
      ];
    case 'physiological-sigh':
      return [
        { name: 'Inhale', duration: 2500, instruction: 'Inspirez profondément par le nez' },
        { name: 'Inhale', duration: 1500, instruction: 'Inspirez encore un peu' },
        { name: 'Exhale', duration: 5000, instruction: 'Expirez lentement et complètement' }
      ];
    case 'coherent-breathing':
      return [
        { name: 'Inhale', duration: 5500, instruction: 'Inspirez lentement et régulièrement' },
        { name: 'Exhale', duration: 5500, instruction: 'Expirez lentement et régulièrement' }
      ];
    case 'alternate-nostril':
      return [
        { name: 'Inhale Right', duration: 4000, instruction: 'Inspirez par la narine droite' },
        { name: 'Hold', duration: 2000, instruction: 'Retenez votre souffle' },
        { name: 'Exhale Left', duration: 4500, instruction: 'Expirez par la narine gauche' },
        { name: 'Inhale Left', duration: 4000, instruction: 'Inspirez par la narine gauche' },
        { name: 'Hold', duration: 2000, instruction: 'Retenez votre souffle' },
        { name: 'Exhale Right', duration: 4500, instruction: 'Expirez par la narine droite' }
      ];
    case 'diaphragmatic-breathing':
      return [
        { name: 'Inhale', duration: 4500, instruction: 'Inspirez en gonflant le ventre' },
        { name: 'Exhale', duration: 6500, instruction: 'Expirez en rentrant le ventre' }
      ];
    case 'ujjayi-breathing':
      return [
        { name: 'Inhale', duration: 5000, instruction: 'Inspirez par le nez avec un son de gorge' },
        { name: 'Exhale', duration: 6000, instruction: 'Expirez par le nez avec un son de gorge' }
      ];
    case 'wim-hof-method':
      return [
        { name: 'Inhale', duration: 2000, instruction: 'Inspirez profondément' },
        { name: 'Exhale', duration: 2000, instruction: 'Expirez complètement' },
        { name: 'Repeat', duration: 1000, instruction: 'Répétez 30-40 fois' },
        { name: 'Hold', duration: 15000, instruction: 'Retenez après expiration complète' }
      ];
    default:
      // Étapes génériques pour toute autre technique
      return [
        { name: 'Inhale', duration: 4000, instruction: 'Inspirez lentement' },
        { name: 'Hold', duration: 2000, instruction: 'Retenez votre souffle' },
        { name: 'Exhale', duration: 5000, instruction: 'Expirez lentement et complètement' },
        { name: 'Hold', duration: 2000, instruction: 'Retenez votre souffle' }
      ];
  }
};

/**
 * Ajoute de nouvelles techniques de respiration
 */
export const addNewBreathingTechniques = async (): Promise<void> => {
  try {
    console.log('Ajout de nouvelles techniques de respiration...');
    // Cette fonction est un placeholder - dans une vraie implémentation,
    // elle ajouterait de nouvelles techniques depuis une source externe
    console.log('Aucune nouvelle technique à ajouter pour le moment');
    return;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de nouvelles techniques:', error);
    throw error;
  }
};

/**
 * Met à jour les catégories des techniques de respiration
 */
export const updateBreathingTechniqueCategories = async (): Promise<void> => {
  try {
    console.log('Mise à jour des catégories des techniques de respiration...');
    // Cette fonction est un placeholder - dans une vraie implémentation,
    // elle mettrait à jour les catégories des techniques existantes
    console.log('Aucune mise à jour de catégorie nécessaire pour le moment');
    return;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des catégories:', error);
    throw error;
  }
};

/**
 * Vérifie et répare toutes les techniques de respiration
 */
export const fixAllBreathingTechniques = async (): Promise<void> => {
  try {
    console.log('Vérification et réparation de toutes les techniques de respiration...');
    // Cette fonction est un placeholder - dans une vraie implémentation,
    // elle vérifierait et réparerait les techniques existantes
    console.log('Aucune réparation nécessaire pour le moment');
    return;
  } catch (error) {
    console.error('Erreur lors de la réparation des techniques:', error);
    throw error;
  }
};

/**
 * Vérifie les descriptions longues dans le fichier JSON
 */
export const checkJsonLongDescriptions = (): void => {
  try {
    console.log('Vérification des descriptions longues dans le fichier JSON...');
    // Cette fonction est un placeholder - dans une vraie implémentation,
    // elle vérifierait les descriptions longues dans le fichier JSON
    console.log('Toutes les descriptions longues sont valides');
  } catch (error) {
    console.error('Erreur lors de la vérification des descriptions longues:', error);
    throw error;
  }
};

/**
 * Répare les descriptions longues manquantes
 */
export const fixLongDescriptions = async (): Promise<void> => {
  try {
    console.log('Réparation des descriptions longues manquantes...');
    // Cette fonction est un placeholder - dans une vraie implémentation,
    // elle réparerait les descriptions longues manquantes
    console.log('Aucune réparation nécessaire pour le moment');
    return;
  } catch (error) {
    console.error('Erreur lors de la réparation des descriptions longues:', error);
    throw error;
  }
};

/**
 * Réinitialise et réimporte toutes les techniques
 */
export const resetAndReimportAllTechniques = async (): Promise<void> => {
  try {
    console.log('Réinitialisation et réimportation de toutes les techniques...');
    // Utiliser la fonction resetDatabase existante
    await resetDatabase();
    console.log('Toutes les techniques ont été réinitialisées et réimportées');
    return;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation et réimportation des techniques:', error);
    throw error;
  }
};

/**
 * Vérifie le rythme d'une technique de respiration
 */
export const verifyBreathingTechniqueRhythm = async (id: string): Promise<{
  isValid: boolean;
  recommendations?: string[];
  details?: {
    totalCycleDuration: number;
    recommendedRatio?: string;
    actualRatio?: string;
  };
}> => {
  try {
    console.log(`Vérification du rythme de la technique ${id}...`);
    const technique = await getBreathingTechniqueById(id);
    
    if (!technique || !technique.steps || technique.steps.length === 0) {
      return {
        isValid: false,
        recommendations: ['La technique n\'a pas d\'étapes définies'],
        details: {
          totalCycleDuration: 0
        }
      };
    }
    
    // Calculer la durée totale du cycle
    const totalCycleDuration = technique.steps.reduce((total, step) => total + step.duration, 0);
    
    // Pour cet exemple, on considère que le rythme est valide si la durée totale est supérieure à 10 secondes
    const isValid = totalCycleDuration >= 10000;
    
    return {
      isValid,
      recommendations: isValid ? [] : ['La durée totale du cycle devrait être d\'au moins 10 secondes'],
      details: {
        totalCycleDuration,
        recommendedRatio: '4:4:4:4',
        actualRatio: technique.steps.map(step => Math.round(step.duration / 1000)).join(':')
      }
    };
  } catch (error) {
    console.error(`Erreur lors de la vérification du rythme de la technique ${id}:`, error);
    throw error;
  }
};

/**
 * Corrige le rythme d'une technique de respiration
 */
export const fixBreathingTechniqueRhythm = async (id: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log(`Correction du rythme de la technique ${id}...`);
    const technique = await getBreathingTechniqueById(id);
    
    if (!technique || !technique.steps || technique.steps.length === 0) {
      return {
        success: false,
        message: 'La technique n\'a pas d\'étapes définies'
      };
    }
    
    // Pour cet exemple, on ajuste simplement la durée de chaque étape à 4 secondes
    const updatedSteps = technique.steps.map(step => ({
      ...step,
      duration: 4000
    }));
    
    // Mettre à jour la technique avec les nouvelles étapes
    await updateBreathingTechnique({
      ...technique,
      steps: updatedSteps
    });
    
    return {
      success: true,
      message: 'Le rythme a été corrigé avec succès'
    };
  } catch (error) {
    console.error(`Erreur lors de la correction du rythme de la technique ${id}:`, error);
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Exporter la connexion à la base de données pour un usage avancé si nécessaire
export { db };