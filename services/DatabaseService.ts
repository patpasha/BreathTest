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

/**
 * Initialise la base de données
 */
/**
 * Vérifie et met à jour le schéma de la base de données si nécessaire
 */
const checkAndUpdateSchema = async (): Promise<void> => {
  try {
    // Récupérer les informations sur les colonnes de la table
    const tableInfo = await db.getAllAsync('PRAGMA table_info(breathing_techniques)');
    
    // Vérifier si la colonne 'steps' existe
    const stepsColumnExists = tableInfo.some((col: any) => col.name === 'steps');
    if (!stepsColumnExists) {
      console.log("La colonne 'steps' n'existe pas, ajout en cours...");
      
      // Ajouter la colonne 'steps'
      await db.execAsync("ALTER TABLE breathing_techniques ADD COLUMN steps TEXT");
      console.log("Colonne 'steps' ajoutée avec succès");
    } else {
      console.log("La colonne 'steps' existe déjà");
    }
    
    // Vérifier si la colonne 'defaultDurationMinutes' existe
    const defaultDurationMinutesExists = tableInfo.some((col: any) => col.name === 'defaultDurationMinutes');
    if (!defaultDurationMinutesExists) {
      console.log("La colonne 'defaultDurationMinutes' n'existe pas, ajout en cours...");
      
      // Ajouter la colonne 'defaultDurationMinutes'
      await db.execAsync("ALTER TABLE breathing_techniques ADD COLUMN defaultDurationMinutes INTEGER DEFAULT 5");
      console.log("Colonne 'defaultDurationMinutes' ajoutée avec succès");
    } else {
      console.log("La colonne 'defaultDurationMinutes' existe déjà");
    }
    
    // Vérifier si la colonne 'longDescription' existe
    const longDescriptionExists = tableInfo.some((col: any) => col.name === 'longDescription');
    if (!longDescriptionExists) {
      console.log("La colonne 'longDescription' n'existe pas, ajout en cours...");
      
      // Ajouter la colonne 'longDescription'
      await db.execAsync("ALTER TABLE breathing_techniques ADD COLUMN longDescription TEXT");
      console.log("Colonne 'longDescription' ajoutée avec succès");
    } else {
      console.log("La colonne 'longDescription' existe déjà");
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du schéma:", error);
    throw error;
  }
};

export const initDatabase = async (): Promise<void> => {
  try {
    // Créer la table des techniques de respiration
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
    
    console.log('Table breathing_techniques créée ou déjà existante');
    
    // Vérifier et mettre à jour le schéma si nécessaire
    await checkAndUpdateSchema();
    
    // Vérifier si des données existent déjà
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM breathing_techniques');
    const count = result?.count || 0;
    
    if (count === 0) {
      console.log('Aucune technique trouvée, importation des données initiales...');
      await importInitialData();
    } else {
      console.log(`${count} techniques trouvées dans la base de données`);
      
      // Vérifier et réparer toutes les techniques de respiration
      await fixAllBreathingTechniques();
      
      // Vérifier et réparer les descriptions longues manquantes
      await fixLongDescriptions();
    }
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

/**
 * Vérifie et répare toutes les techniques de respiration
 */
export const fixAllBreathingTechniques = async (): Promise<void> => {
  try {
    console.log('Vérification et réparation de toutes les techniques de respiration...');
    
    // Récupérer toutes les techniques
    const techniques = await getAllBreathingTechniques();
    
    // Vérifier chaque technique
    for (const technique of techniques) {
      if (!technique.steps || technique.steps.length === 0) {
        // La technique n'a pas d'étapes, vérifier son ID pour ajouter les étapes appropriées
        const defaultSteps = getDefaultStepsForTechnique(technique.id);
        
        if (defaultSteps) {
          console.log(`La technique ${technique.id} n'a pas d'étapes, ajout des étapes par défaut...`);
          
          // Mettre à jour la technique avec les étapes par défaut
          const updatedTechnique = {
            ...technique,
            steps: defaultSteps,
            route: 'GenericBreathingScreen' // Mettre à jour la route pour utiliser l'écran générique
          };
          
          await updateBreathingTechnique(updatedTechnique);
          console.log(`Technique ${technique.id} mise à jour avec succès`);
        } else {
          console.log(`Aucune étape par défaut disponible pour la technique ${technique.id}`);
        }
      }
    }
    
    console.log('Vérification et réparation terminées');
  } catch (error) {
    console.error('Erreur lors de la réparation des techniques:', error);
    throw error;
  }
};

/**
 * Obtient les étapes par défaut pour une technique de respiration spécifique
 */
export const getDefaultStepsForTechnique = (techniqueId: string): BreathingStep[] | undefined => {
  // Définir les étapes par défaut pour chaque technique
  const defaultStepsMap: Record<string, BreathingStep[]> = {
    'apnee': [
      {
        name: "Préparation",
        duration: 5000,
        instruction: "Installez-vous confortablement et détendez-vous"
      },
      {
        name: "Inspiration profonde",
        duration: 4000,
        instruction: "Inspirez profondément par le nez en gonflant l'abdomen"
      },
      {
        name: "Rétention",
        duration: 15000,
        instruction: "Retenez votre souffle en restant détendu"
      },
      {
        name: "Expiration",
        duration: 8000,
        instruction: "Expirez lentement et complètement par la bouche"
      },
      {
        name: "Récupération",
        duration: 10000,
        instruction: "Respirez normalement avant de recommencer"
      }
    ],
    '4-7-8': [
      { 
        name: "Inspiration", 
        duration: 4000, 
        instruction: "Inspirez par le nez pendant 4 secondes" 
      },
      { 
        name: "Rétention", 
        duration: 7000, 
        instruction: "Retenez votre souffle pendant 7 secondes" 
      },
      { 
        name: "Expiration", 
        duration: 8000, 
        instruction: "Expirez lentement par la bouche pendant 8 secondes" 
      }
    ],
    'papillon': [
      {
        name: "Inspiration courte",
        duration: 2000,
        instruction: "Inspirez doucement par le nez pendant 2 secondes"
      },
      {
        name: "Expiration courte",
        duration: 2000,
        instruction: "Expirez doucement par la bouche pendant 2 secondes"
      },
      {
        name: "Inspiration longue",
        duration: 4000,
        instruction: "Inspirez profondément par le nez pendant 4 secondes"
      },
      {
        name: "Expiration longue",
        duration: 4000,
        instruction: "Expirez complètement par la bouche pendant 4 secondes"
      }
    ],
    'lion': [
      {
        name: "Préparation",
        duration: 3000,
        instruction: "Asseyez-vous confortablement, les mains sur les genoux"
      },
      {
        name: "Inspiration",
        duration: 3000,
        instruction: "Inspirez profondément par le nez"
      },
      {
        name: "Expiration",
        duration: 2000,
        instruction: "Ouvrez grand la bouche, tirez la langue, écarquillez les yeux et expirez fortement avec un son 'haaa'"
      },
      {
        name: "Relaxation",
        duration: 3000,
        instruction: "Détendez votre visage et respirez normalement"
      }
    ],
    '3-4-5': [
      {
        name: "Inspiration",
        duration: 3000,
        instruction: "Inspirez par le nez pendant 3 secondes"
      },
      {
        name: "Rétention",
        duration: 4000,
        instruction: "Retenez votre souffle pendant 4 secondes"
      },
      {
        name: "Expiration",
        duration: 5000,
        instruction: "Expirez lentement par la bouche pendant 5 secondes"
      }
    ],
    'pleine-conscience': [
      {
        name: "Préparation",
        duration: 5000,
        instruction: "Installez-vous confortablement et fermez les yeux"
      },
      {
        name: "Observation",
        duration: 10000,
        instruction: "Observez simplement votre respiration sans la modifier"
      },
      {
        name: "Attention",
        duration: 10000,
        instruction: "Portez attention aux sensations de l'air qui entre et sort"
      },
      {
        name: "Retour",
        duration: 5000,
        instruction: "Si votre esprit s'égare, ramenez doucement l'attention à votre respiration"
      }
    ],
    'levres-pincees': [
      {
        name: "Préparation",
        duration: 3000,
        instruction: "Détendez vos épaules et votre cou"
      },
      {
        name: "Inspiration",
        duration: 2000,
        instruction: "Inspirez lentement par le nez pendant 2 secondes"
      },
      {
        name: "Pincez les lèvres",
        duration: 1000,
        instruction: "Pincez les lèvres comme si vous alliez siffler ou souffler sur une bougie"
      },
      {
        name: "Expiration",
        duration: 4000,
        instruction: "Expirez lentement à travers les lèvres pincées pendant 4 secondes"
      }
    ],
    'box': [
      { 
        name: "Inspiration", 
        duration: 4000, 
        instruction: "Inspirez par le nez pendant 4 secondes" 
      },
      { 
        name: "Rétention haute", 
        duration: 4000, 
        instruction: "Retenez votre souffle pendant 4 secondes" 
      },
      { 
        name: "Expiration", 
        duration: 4000, 
        instruction: "Expirez par la bouche pendant 4 secondes" 
      },
      { 
        name: "Rétention basse", 
        duration: 4000, 
        instruction: "Gardez les poumons vides pendant 4 secondes" 
      }
    ],
    'coherente': [
      { 
        name: "Inspiration", 
        duration: 5500, 
        instruction: "Inspirez régulièrement par le nez" 
      },
      { 
        name: "Expiration", 
        duration: 5500, 
        instruction: "Expirez régulièrement par la bouche" 
      }
    ],
    'diaphragmatique': [
      { 
        name: "Préparation", 
        duration: 3000, 
        instruction: "Placez une main sur la poitrine et l'autre sur le ventre" 
      },
      { 
        name: "Inspiration", 
        duration: 4000, 
        instruction: "Inspirez lentement par le nez en gonflant le ventre (pas la poitrine)" 
      },
      { 
        name: "Expiration", 
        duration: 6000, 
        instruction: "Expirez lentement par la bouche en rentrant le ventre" 
      }
    ],
    'physiological-sigh': [
      { 
        name: "Première inspiration", 
        duration: 1500, 
        instruction: "Inspirez profondément par le nez" 
      },
      { 
        name: "Seconde inspiration", 
        duration: 1000, 
        instruction: "Inspirez encore un peu plus pour remplir complètement vos poumons" 
      },
      { 
        name: "Expiration", 
        duration: 4000, 
        instruction: "Expirez lentement et complètement par la bouche" 
      },
      { 
        name: "Pause", 
        duration: 2000, 
        instruction: "Attendez quelques secondes avant le prochain cycle" 
      }
    ],
    'cyclic-hyperventilation': [
      { 
        name: "Inspiration rapide", 
        duration: 1500, 
        instruction: "Inspirez rapidement et profondément par le nez" 
      },
      { 
        name: "Expiration rapide", 
        duration: 1500, 
        instruction: "Expirez rapidement par la bouche" 
      },
      { 
        name: "Répétition", 
        duration: 15000, 
        instruction: "Répétez ce cycle 20-30 fois" 
      },
      { 
        name: "Rétention", 
        duration: 15000, 
        instruction: "Après la dernière expiration, retenez votre souffle poumons vides" 
      },
      { 
        name: "Récupération", 
        duration: 15000, 
        instruction: "Inspirez profondément et retenez 15 secondes, puis respirez normalement" 
      }
    ],
    'wim-hof': [
      { 
        name: "Inspiration profonde", 
        duration: 2000, 
        instruction: "Inspirez profondément par le nez ou la bouche" 
      },
      { 
        name: "Expiration partielle", 
        duration: 1000, 
        instruction: "Expirez sans forcer (expiration passive)" 
      },
      { 
        name: "Répétition", 
        duration: 30000, 
        instruction: "Répétez ce cycle 30-40 fois" 
      },
      { 
        name: "Rétention", 
        duration: 60000, 
        instruction: "Après la dernière expiration, retenez votre souffle aussi longtemps que possible" 
      },
      { 
        name: "Récupération", 
        duration: 15000, 
        instruction: "Inspirez profondément et retenez 15 secondes, puis respirez normalement" 
      }
    ],
    'alternee': [
      { 
        name: "Préparation", 
        duration: 3000, 
        instruction: "Fermez la narine droite avec le pouce droit" 
      },
      { 
        name: "Inspiration gauche", 
        duration: 4000, 
        instruction: "Inspirez lentement par la narine gauche" 
      },
      { 
        name: "Transition", 
        duration: 1000, 
        instruction: "Fermez la narine gauche avec l'annulaire droit et ouvrez la narine droite" 
      },
      { 
        name: "Expiration droite", 
        duration: 4000, 
        instruction: "Expirez lentement par la narine droite" 
      },
      { 
        name: "Inspiration droite", 
        duration: 4000, 
        instruction: "Inspirez lentement par la narine droite" 
      },
      { 
        name: "Transition", 
        duration: 1000, 
        instruction: "Fermez la narine droite avec le pouce droit et ouvrez la narine gauche" 
      },
      { 
        name: "Expiration gauche", 
        duration: 4000, 
        instruction: "Expirez lentement par la narine gauche" 
      }
    ],
    'buteyko': [
      { 
        name: "Respiration normale", 
        duration: 30000, 
        instruction: "Respirez normalement pendant 30 secondes" 
      },
      { 
        name: "Réduction", 
        duration: 30000, 
        instruction: "Réduisez légèrement l'amplitude de votre respiration" 
      },
      { 
        name: "Pause contrôlée", 
        duration: 5000, 
        instruction: "Après une expiration normale, retenez votre souffle" 
      },
      { 
        name: "Reprise", 
        duration: 10000, 
        instruction: "Reprenez une respiration réduite, calme et contrôlée" 
      }
    ],
    'ujjayi': [
      { 
        name: "Préparation", 
        duration: 5000, 
        instruction: "Asseyez-vous confortablement, détendez votre gorge" 
      },
      { 
        name: "Inspiration", 
        duration: 5000, 
        instruction: "Inspirez lentement par le nez en créant une légère constriction dans la gorge" 
      },
      { 
        name: "Expiration", 
        duration: 5000, 
        instruction: "Expirez lentement par le nez en maintenant la constriction dans la gorge" 
      }
    ],
    'tummo': [
      { 
        name: "Visualisation", 
        duration: 60000, 
        instruction: "Visualisez une flamme à la base de votre colonne vertébrale" 
      },
      { 
        name: "Inspiration", 
        duration: 5000, 
        instruction: "Inspirez profondément par le nez en visualisant l'air qui alimente la flamme" 
      },
      { 
        name: "Rétention", 
        duration: 5000, 
        instruction: "Retenez votre souffle en contractant les muscles abdominaux" 
      },
      { 
        name: "Expiration", 
        duration: 5000, 
        instruction: "Expirez lentement en visualisant la chaleur qui se répand dans tout votre corps" 
      }
    ]
  };
  
  return defaultStepsMap[techniqueId];
};

/**
 * Met à jour les catégories des techniques de respiration
 */
export const updateBreathingTechniqueCategories = async (): Promise<void> => {
  try {
    console.log('Mise à jour des catégories des techniques de respiration...');
    
    // Définir les mises à jour de catégories
    const categoriesToUpdate = [
      { id: 'apnee', categories: ['performance', 'stress', 'health'] },
      { id: 'papillon', categories: ['stress', 'focus'] },
      { id: 'lion', categories: ['stress', 'energy'] },
      { id: '3-4-5', categories: ['stress', 'sleep'] },
      { id: 'pleine-conscience', categories: ['stress', 'focus'] },
      { id: 'levres-pincees', categories: ['health', 'stress'] }
    ];
    
    // Mettre à jour chaque technique
    for (const { id, categories } of categoriesToUpdate) {
      // Vérifier si la technique existe
      const technique = await getBreathingTechniqueById(id);
      
      if (technique) {
        console.log(`Mise à jour des catégories pour la technique ${id}...`);
        
        // Mettre à jour les catégories
        await db.runAsync(
          'UPDATE breathing_techniques SET categories = ? WHERE id = ?',
          [JSON.stringify(categories), id]
        );
        
        console.log(`Catégories de la technique ${id} mises à jour avec succès`);
      } else {
        console.log(`La technique ${id} n'existe pas dans la base de données`);
      }
    }
    
    // Invalider le cache après les mises à jour
    invalidateCache();
    console.log('Mise à jour des catégories terminée');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des catégories:', error);
    throw error;
  }
};

export const addNewBreathingTechniques = async (): Promise<void> => {
  try {
    console.log('Ajout des nouvelles techniques de respiration...');
    
    // Définir les nouvelles techniques
    const newTechniques: BreathingTechnique[] = [
      {
        id: "apnee",
        title: "Apnée Contrôlée",
        description: "Technique de rétention respiratoire pour améliorer la capacité pulmonaire et la résistance au stress.",
        duration: "3-5 minutes",
        route: "GenericBreathingScreen",
        categories: ["performance", "stress", "health"],
        defaultDurationMinutes: 5,
        steps: getDefaultStepsForTechnique('apnee'),
        longDescription: [
          "L'apnée contrôlée est une technique puissante qui consiste à retenir volontairement sa respiration pendant une durée déterminée.",
          "Comment pratiquer :",
          "1. Commencez par vous détendre complètement pour réduire votre consommation d'oxygène.",
          "2. Prenez une inspiration profonde et naturelle, sans hyperventiler.",
          "3. Retenez votre souffle aussi longtemps que confortable, sans forcer.",
          "4. Expirez lentement et complètement, puis récupérez en respirant normalement.",
          "5. Répétez ce cycle après une période de récupération suffisante.",
          "Effets : Amélioration de la capacité pulmonaire, renforcement du diaphragme, stimulation du système immunitaire, développement de la résistance au stress, augmentation de la concentration de CO2 bénéfique.",
          "Idéal pour : Améliorer les performances sportives, renforcer la résistance mentale, préparer à des situations stressantes, développer la conscience corporelle.",
          "⚠️ ATTENTION : Ne pratiquez jamais l'apnée seul ou dans l'eau sans supervision. Arrêtez immédiatement si vous ressentez des étourdissements ou un inconfort. Contre-indiqué pour les personnes souffrant de problèmes cardiaques, d'hypertension ou d'épilepsie."
        ]
      },
      {
        id: "papillon",
        title: "Respiration Papillon",
        description: "Technique douce alternant respirations courtes et longues, idéale pour l'anxiété légère.",
        duration: "5-10 minutes",
        route: "GenericBreathingScreen",
        categories: ["stress", "focus"],
        defaultDurationMinutes: 5,
        steps: getDefaultStepsForTechnique('papillon'),
        longDescription: [
          "La respiration papillon est une technique douce qui imite le battement d'ailes d'un papillon, créant un rythme apaisant qui calme naturellement l'esprit.",
          "Comment pratiquer :",
          "1. Commencez par une inspiration courte par le nez suivie d'une expiration courte par la bouche.",
          "2. Enchaînez avec une inspiration longue par le nez suivie d'une expiration longue par la bouche.",
          "3. Répétez ce cycle en maintenant un rythme régulier et fluide, comme le battement des ailes d'un papillon.",
          "4. Concentrez-vous sur la sensation de légèreté et de fluidité que ce rythme crée.",
          "Effets : Réduction de l'anxiété légère, apaisement du système nerveux, amélioration de la concentration, sensation de calme et de légèreté.",
          "Idéal pour : Les enfants anxieux, les personnes sensibles, les situations sociales stressantes, les moments de tension légère, ou comme technique discrète utilisable partout.",
          "Cette technique peut être pratiquée discrètement dans n'importe quelle situation et convient particulièrement aux personnes qui trouvent les techniques plus intenses trop stimulantes."
        ]
      },
      {
        id: "lion",
        title: "Respiration du Lion",
        description: "Technique dynamique pour libérer les tensions et renforcer la confiance en soi.",
        duration: "3-5 minutes",
        route: "GenericBreathingScreen",
        categories: ["stress", "energy"],
        defaultDurationMinutes: 3,
        steps: getDefaultStepsForTechnique('lion'),
        longDescription: [
          "La respiration du lion (Simhasana en sanskrit) est une technique dynamique issue du yoga qui libère les tensions physiques et émotionnelles accumulées.",
          "Comment pratiquer :",
          "1. Asseyez-vous confortablement, les mains sur les genoux ou en appui sur le sol devant vous.",
          "2. Inspirez profondément par le nez en gonflant la poitrine.",
          "3. Ouvrez grand la bouche, tirez la langue vers le menton le plus loin possible, écarquillez les yeux et expirez fortement avec un son 'haaa'.",
          "4. Détendez votre visage et respirez normalement pendant quelques secondes avant de répéter.",
          "Effets : Libération des tensions faciales et de la gorge, stimulation des muscles du visage, réduction du stress, augmentation de l'énergie, renforcement de la confiance en soi.",
          "Idéal pour : Surmonter la timidité, préparer une prise de parole en public, libérer les émotions refoulées comme la colère ou la frustration, réveiller l'énergie en cas de fatigue mentale.",
          "⚠️ ATTENTION : Pratiquez de préférence dans un environnement privé. Cette technique peut sembler intense pour les débutants, commencez doucement et augmentez progressivement l'intensité."
        ]
      },
      {
        id: "3-4-5",
        title: "Technique 3-4-5",
        description: "Séquence progressive qui suit le rythme naturel de la respiration pour un calme rapide.",
        duration: "3-10 minutes",
        route: "GenericBreathingScreen",
        categories: ["stress", "sleep"],
        defaultDurationMinutes: 5,
        steps: getDefaultStepsForTechnique('3-4-5'),
        longDescription: [
          "La technique 3-4-5 est une séquence progressive qui suit le rythme naturel de la respiration, créant un ralentissement doux du système nerveux.",
          "Comment pratiquer :",
          "1. Installez-vous confortablement, assis ou allongé.",
          "2. Inspirez par le nez pendant 3 secondes en comptant mentalement.",
          "3. Retenez votre souffle pendant 4 secondes.",
          "4. Expirez lentement par la bouche pendant 5 secondes.",
          "5. Répétez ce cycle pendant toute la durée de la session.",
          "Effets : Ralentissement du rythme cardiaque, activation du système nerveux parasympathique, réduction de l'anxiété, préparation au sommeil, amélioration de la concentration.",
          "Idéal pour : Les moments de stress modéré, avant de dormir, comme préparation à la méditation, ou comme alternative plus accessible à la technique 4-7-8 pour les débutants.",
          "Cette technique est particulièrement efficace pour les débutants car elle est facile à mémoriser et à pratiquer, tout en offrant des bienfaits similaires aux techniques plus avancées."
        ]
      },
      {
        id: "pleine-conscience",
        title: "Respiration en Pleine Conscience",
        description: "Technique méditative d'observation du souffle pour calmer l'esprit et développer la présence.",
        duration: "5-20 minutes",
        route: "GenericBreathingScreen",
        categories: ["stress", "focus"],
        defaultDurationMinutes: 10,
        steps: getDefaultStepsForTechnique('pleine-conscience'),
        longDescription: [
          "La respiration en pleine conscience combine les principes de la méditation avec une attention particulière portée au souffle, sans chercher à le modifier.",
          "Comment pratiquer :",
          "1. Installez-vous confortablement dans un endroit calme et fermez les yeux.",
          "2. Observez simplement votre respiration naturelle sans chercher à la modifier.",
          "3. Portez attention aux sensations de l'air qui entre et sort de vos narines, ou au mouvement de votre poitrine et de votre ventre.",
          "4. Si votre esprit s'égare vers des pensées, des émotions ou des sensations, reconnaissez-le sans jugement et ramenez doucement l'attention à votre respiration.",
          "5. Continuez cette observation attentive pendant toute la durée de la session.",
          "Effets : Réduction du stress et de l'anxiété, amélioration de la concentration, développement de la conscience du moment présent, meilleure gestion des pensées et des émotions.",
          "Idéal pour : Développer une pratique méditative, gérer le stress chronique, améliorer la concentration, cultiver la présence et la conscience de soi, préparer l'esprit à des tâches complexes.",
          "Cette technique est à la base de nombreuses pratiques méditatives et peut être approfondie avec le temps pour des bénéfices durables sur la santé mentale."
        ]
      },
      {
        id: "levres-pincees",
        title: "Respiration à Lèvres Pincées",
        description: "Technique thérapeutique pour améliorer la ventilation et réduire l'essoufflement.",
        duration: "5-15 minutes",
        route: "GenericBreathingScreen",
        categories: ["health", "stress"],
        defaultDurationMinutes: 5,
        steps: getDefaultStepsForTechnique('levres-pincees'),
        longDescription: [
          "La respiration à lèvres pincées est une technique thérapeutique qui a démontré son efficacité pour réduire l'essoufflement et améliorer la ventilation pulmonaire.",
          "Comment pratiquer :",
          "1. Détendez vos épaules et votre cou pour éviter toute tension musculaire.",
          "2. Inspirez lentement par le nez pendant 2 secondes, en gardant la bouche fermée.",
          "3. Pincez les lèvres comme si vous alliez siffler ou souffler doucement sur une bougie sans l'éteindre.",
          "4. Expirez lentement à travers les lèvres pincées pendant 4 secondes, soit deux fois plus longtemps que l'inspiration.",
          "5. Répétez ce cycle en maintenant un rythme régulier et contrôlé.",
          "Effets : Amélioration de l'échange gazeux, prévention de l'affaissement des voies respiratoires, réduction de l'essoufflement, meilleur contrôle respiratoire, diminution de la fréquence respiratoire.",
          "Idéal pour : Les personnes souffrant d'asthme, de BPCO (bronchopneumopathie chronique obstructive), d'emphysème, pendant l'effort physique, ou lors d'épisodes d'essoufflement.",
          "⚠️ ATTENTION : Si vous souffrez de problèmes respiratoires chroniques, consultez votre médecin pour intégrer cette technique à votre plan de traitement global."
        ]
      }
    ];
    
    // Vérifier l'existence de chaque technique et l'ajouter si elle n'existe pas
    for (const technique of newTechniques) {
      const existingTechnique = await getBreathingTechniqueById(technique.id);
      
      if (!existingTechnique) {
        console.log(`Ajout de la technique ${technique.id}...`);
        await db.runAsync(
          `INSERT INTO breathing_techniques (id, title, description, duration, route, categories, steps, defaultDurationMinutes, longDescription) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            technique.id,
            technique.title,
            technique.description,
            technique.duration,
            technique.route,
            JSON.stringify(technique.categories),
            JSON.stringify(technique.steps),
            technique.defaultDurationMinutes || 0,
            JSON.stringify(technique.longDescription)
          ]
        );
        console.log(`Technique ${technique.id} ajoutée avec succès`);
      } else {
        console.log(`La technique ${technique.id} existe déjà, aucune action nécessaire`);
      }
    }
    
    // Invalider le cache après l'ajout des nouvelles techniques
    invalidateCache();
    console.log('Ajout des nouvelles techniques terminé');
  } catch (error) {
    console.error('Erreur lors de l\'ajout des nouvelles techniques:', error);
    throw error;
  }
};

/**
 * Vérifie et répare la technique physiological-sigh
 */
export const fixPhysiologicalSighTechnique = async (): Promise<void> => {
  try {
    // Données correctes pour la technique physiological-sigh
    const correctData: BreathingTechnique = {
      id: "physiological-sigh",
      title: "Soupir Physiologique",
      description: "Double inspiration suivie d'une longue expiration pour réduire rapidement le stress et l'anxiété.",
      duration: "2-5 minutes",
      route: "GenericBreathingScreen",
      categories: ["stress"],
      defaultDurationMinutes: 3,
      steps: getDefaultStepsForTechnique('physiological-sigh'),
      longDescription: [
        "Le soupir physiologique est un mécanisme naturel que notre corps utilise pour réinitialiser la respiration et réduire le stress.",
        "Cette technique, popularisée par le neuroscientifique Andrew Huberman, est extrêmement efficace pour une réduction rapide de l'anxiété.",
        "1. Prenez une première inspiration profonde par le nez.",
        "2. Sans expirer, prenez une seconde inspiration courte pour remplir complètement vos poumons.",
        "3. Expirez lentement et complètement par la bouche.",
        "4. Répétez ce cycle 1 à 5 fois pour un effet immédiat sur votre état émotionnel."
      ]
    };

    // Vérifier si la technique existe
    const technique = await getBreathingTechniqueById('physiological-sigh');
    
    if (!technique) {
      console.log('La technique physiological-sigh n\'existe pas, création...');
      await db.runAsync(
        `INSERT INTO breathing_techniques (id, title, description, duration, route, categories, steps, defaultDurationMinutes, longDescription) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          correctData.id,
          correctData.title,
          correctData.description,
          correctData.duration,
          correctData.route,
          JSON.stringify(correctData.categories),
          JSON.stringify(correctData.steps),
          correctData.defaultDurationMinutes || 0,
          JSON.stringify(correctData.longDescription)
        ]
      );
      console.log('Technique physiological-sigh insérée avec succès');
    } else {
      // Vérifier si les étapes sont définies
      if (!technique.steps || technique.steps.length === 0) {
        console.log('La technique physiological-sigh existe mais n\'a pas d\'étapes, mise à jour...');
        await updateBreathingTechnique(correctData);
        console.log('Technique physiological-sigh mise à jour avec succès');
      } else {
        console.log('La technique physiological-sigh existe et a des étapes, aucune action nécessaire');
      }
    }
  } catch (error) {
    console.error('Erreur lors de la réparation de la technique physiological-sigh:', error);
    throw error;
  }
};

/**
 * Répare les descriptions longues manquantes pour toutes les techniques
 */
export const fixLongDescriptions = async (): Promise<void> => {
  try {
    console.log('Vérification et réparation des descriptions longues...');
    
    // Charger les données directement depuis le fichier JSON
    const techniquesFromJson: BreathingTechnique[] = require('../assets/data/breathing_techniques.json');
    
    // Créer un dictionnaire pour un accès rapide
    const techniquesDict: Record<string, BreathingTechnique> = {};
    techniquesFromJson.forEach(technique => {
      techniquesDict[technique.id] = technique;
    });
    
    // Récupérer toutes les techniques de la base de données
    const techniques = await getAllBreathingTechniques();
    
    // Vérifier chaque technique
    for (const technique of techniques) {
      // Vérifier si la description longue est manquante ou null
      if (!technique.longDescription || technique.longDescription === null) {
        console.log(`Réparation de la description longue pour la technique ${technique.id}...`);
        
        // Vérifier si la technique existe dans le fichier JSON
        if (techniquesDict[technique.id]?.longDescription) {
          // Mettre à jour la technique avec la description longue du fichier JSON
          await db.runAsync(
            `UPDATE breathing_techniques SET longDescription = ? WHERE id = ?`,
            [
              JSON.stringify(techniquesDict[technique.id].longDescription),
              technique.id
            ]
          );
          
          console.log(`Description longue de la technique ${technique.id} mise à jour avec succès depuis le fichier JSON`);
        } else {
          // Si la technique n'existe pas dans le fichier JSON, utiliser une description par défaut
          // basée sur la description courte
          const defaultLongDescription = [
            `${technique.title} est une technique de respiration efficace.`,
            `${technique.description}`,
            "Pratiquez cette technique régulièrement pour en ressentir les bienfaits."
          ];
          
          await db.runAsync(
            `UPDATE breathing_techniques SET longDescription = ? WHERE id = ?`,
            [
              JSON.stringify(defaultLongDescription),
              technique.id
            ]
          );
          
          console.log(`Description longue par défaut créée pour la technique ${technique.id}`);
        }
      } else {
        // Vérifier si la description longue est un tableau vide ou une chaîne vide
        if (Array.isArray(technique.longDescription) && technique.longDescription.length === 0) {
          console.log(`La description longue de la technique ${technique.id} est un tableau vide, réparation...`);
          
          if (techniquesDict[technique.id]?.longDescription) {
            await db.runAsync(
              `UPDATE breathing_techniques SET longDescription = ? WHERE id = ?`,
              [
                JSON.stringify(techniquesDict[technique.id].longDescription),
                technique.id
              ]
            );
            
            console.log(`Description longue de la technique ${technique.id} mise à jour avec succès`);
          }
        }
      }
    }
    
    // Vérifier si toutes les techniques du fichier JSON sont dans la base de données
    for (const jsonTechnique of techniquesFromJson) {
      const existingTechnique = techniques.find(t => t.id === jsonTechnique.id);
      
      if (!existingTechnique) {
        console.log(`La technique ${jsonTechnique.id} existe dans le fichier JSON mais pas dans la base de données, ajout...`);
        
        // Ajouter la technique à la base de données
        await db.runAsync(
          `INSERT INTO breathing_techniques (id, title, description, duration, route, categories, steps, defaultDurationMinutes, longDescription) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            jsonTechnique.id,
            jsonTechnique.title,
            jsonTechnique.description,
            jsonTechnique.duration,
            jsonTechnique.route || "GenericBreathingScreen",
            JSON.stringify(jsonTechnique.categories || []),
            JSON.stringify(jsonTechnique.steps || getDefaultStepsForTechnique(jsonTechnique.id) || []),
            jsonTechnique.defaultDurationMinutes || 5,
            JSON.stringify(jsonTechnique.longDescription || [])
          ]
        );
        
        console.log(`Technique ${jsonTechnique.id} ajoutée avec succès`);
      }
    }
    
    // Invalider le cache pour forcer le rechargement des données
    invalidateCache();
    
    console.log('Vérification et réparation des descriptions longues terminées');
  } catch (error) {
    console.error('Erreur lors de la réparation des descriptions longues:', error);
    throw error;
  }
};

/**
 * Vérifie si les descriptions longues sont présentes dans le fichier JSON
 */
export const checkJsonLongDescriptions = (): void => {
  try {
    console.log('Vérification des descriptions longues dans le fichier JSON...');
    
    // Charger les données directement depuis le fichier JSON
    const techniquesFromJson: BreathingTechnique[] = require('../assets/data/breathing_techniques.json');
    
    console.log(`Nombre total de techniques dans le fichier JSON: ${techniquesFromJson.length}`);
    
    // Vérifier chaque technique
    let techniquesWithLongDescription = 0;
    let techniquesWithoutLongDescription = 0;
    
    for (const technique of techniquesFromJson) {
      if (technique.longDescription && Array.isArray(technique.longDescription) && technique.longDescription.length > 0) {
        techniquesWithLongDescription++;
        console.log(`✅ La technique ${technique.id} (${technique.title}) a une description longue de ${technique.longDescription.length} paragraphes.`);
      } else {
        techniquesWithoutLongDescription++;
        console.warn(`⚠️ La technique ${technique.id} (${technique.title}) n'a pas de description longue!`);
      }
    }
    
    console.log(`Résumé: ${techniquesWithLongDescription} techniques avec description longue, ${techniquesWithoutLongDescription} sans description longue.`);
    
    // Vérifier les techniques dans la base de données
    getAllBreathingTechniques().then(techniques => {
      console.log(`Nombre total de techniques dans la base de données: ${techniques.length}`);
      
      // Créer un dictionnaire des techniques du JSON pour une recherche rapide
      const jsonTechniquesDict: Record<string, boolean> = {};
      techniquesFromJson.forEach(t => {
        jsonTechniquesDict[t.id] = true;
      });
      
      // Vérifier les techniques qui sont dans la base de données mais pas dans le JSON
      const techniquesNotInJson = techniques.filter(t => !jsonTechniquesDict[t.id]);
      
      if (techniquesNotInJson.length > 0) {
        console.warn(`⚠️ ${techniquesNotInJson.length} techniques sont dans la base de données mais pas dans le fichier JSON:`);
        techniquesNotInJson.forEach(t => {
          console.warn(`   - ${t.id} (${t.title})`);
        });
      } else {
        console.log('✅ Toutes les techniques de la base de données sont présentes dans le fichier JSON.');
      }
      
      // Vérifier les descriptions longues dans la base de données
      let dbTechniquesWithLongDescription = 0;
      let dbTechniquesWithoutLongDescription = 0;
      
      for (const technique of techniques) {
        if (technique.longDescription && Array.isArray(technique.longDescription) && technique.longDescription.length > 0) {
          dbTechniquesWithLongDescription++;
        } else {
          dbTechniquesWithoutLongDescription++;
          console.warn(`⚠️ La technique ${technique.id} (${technique.title}) n'a pas de description longue dans la base de données!`);
        }
      }
      
      console.log(`Résumé base de données: ${dbTechniquesWithLongDescription} techniques avec description longue, ${dbTechniquesWithoutLongDescription} sans description longue.`);
    }).catch(error => {
      console.error('Erreur lors de la récupération des techniques de la base de données:', error);
    });
    
  } catch (error) {
    console.error('Erreur lors de la vérification des descriptions longues:', error);
  }
};

/**
 * Réinitialise complètement la base de données et réimporte toutes les techniques
 */
export const resetAndReimportAllTechniques = async (): Promise<void> => {
  try {
    console.log('Réinitialisation complète de la base de données et réimportation des techniques...');
    
    // Supprimer la table des techniques de respiration
    await db.runAsync('DROP TABLE IF EXISTS breathing_techniques');
    console.log('Table breathing_techniques supprimée');
    
    // Recréer la table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS breathing_techniques (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        duration TEXT NOT NULL,
        route TEXT NOT NULL,
        categories TEXT NOT NULL
      )
    `);
    console.log('Table breathing_techniques recréée');
    
    // Ajouter les colonnes nécessaires
    try {
      await db.runAsync('ALTER TABLE breathing_techniques ADD COLUMN steps TEXT');
      console.log('Colonne steps ajoutée');
    } catch (e) {
      console.log('La colonne steps existe déjà');
    }
    
    try {
      await db.runAsync('ALTER TABLE breathing_techniques ADD COLUMN defaultDurationMinutes INTEGER');
      console.log('Colonne defaultDurationMinutes ajoutée');
    } catch (e) {
      console.log('La colonne defaultDurationMinutes existe déjà');
    }
    
    try {
      await db.runAsync('ALTER TABLE breathing_techniques ADD COLUMN longDescription TEXT');
      console.log('Colonne longDescription ajoutée');
    } catch (e) {
      console.log('La colonne longDescription existe déjà');
    }
    
    // Charger les données depuis le fichier JSON
    const techniquesFromJson: BreathingTechnique[] = require('../assets/data/breathing_techniques.json');
    console.log(`${techniquesFromJson.length} techniques chargées depuis le fichier JSON`);
    
    // Importer toutes les techniques du fichier JSON
    for (const technique of techniquesFromJson) {
      console.log(`Importation de la technique ${technique.id}...`);
      
      // S'assurer que les étapes sont définies
      const steps = technique.steps || getDefaultStepsForTechnique(technique.id) || [];
      
      // S'assurer que la route est définie
      const route = technique.route || "GenericBreathingScreen";
      
      // S'assurer que les catégories sont définies
      const categories = technique.categories || [];
      
      // S'assurer que la durée par défaut est définie
      const defaultDurationMinutes = technique.defaultDurationMinutes || 5;
      
      // Insérer la technique dans la base de données
      await db.runAsync(
        `INSERT INTO breathing_techniques (id, title, description, duration, route, categories, steps, defaultDurationMinutes, longDescription) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          technique.id,
          technique.title,
          technique.description,
          technique.duration,
          route,
          JSON.stringify(categories),
          JSON.stringify(steps),
          defaultDurationMinutes,
          JSON.stringify(technique.longDescription || [])
        ]
      );
      
      console.log(`Technique ${technique.id} importée avec succès`);
    }
    
    // Définir explicitement les techniques problématiques
    const problematicTechniques: BreathingTechnique[] = [
      {
        id: "apnee",
        title: "Apnée Contrôlée",
        description: "Technique de rétention respiratoire pour améliorer la capacité pulmonaire et la résistance au stress.",
        duration: "3-5 minutes",
        route: "GenericBreathingScreen",
        categories: ["performance", "stress", "health"],
        defaultDurationMinutes: 5,
        steps: getDefaultStepsForTechnique('apnee'),
        longDescription: [
          "L'apnée contrôlée est une technique puissante qui consiste à retenir volontairement sa respiration pendant une durée déterminée.",
          "Comment pratiquer :",
          "1. Commencez par vous détendre complètement pour réduire votre consommation d'oxygène.",
          "2. Prenez une inspiration profonde et naturelle, sans hyperventiler.",
          "3. Retenez votre souffle aussi longtemps que confortable, sans forcer.",
          "4. Expirez lentement et complètement, puis récupérez en respirant normalement.",
          "5. Répétez ce cycle après une période de récupération suffisante.",
          "Effets : Amélioration de la capacité pulmonaire, renforcement du diaphragme, stimulation du système immunitaire, développement de la résistance au stress, augmentation de la concentration de CO2 bénéfique.",
          "Idéal pour : Améliorer les performances sportives, renforcer la résistance mentale, préparer à des situations stressantes, développer la conscience corporelle.",
          "⚠️ ATTENTION : Ne pratiquez jamais l'apnée seul ou dans l'eau sans supervision. Arrêtez immédiatement si vous ressentez des étourdissements ou un inconfort. Contre-indiqué pour les personnes souffrant de problèmes cardiaques, d'hypertension ou d'épilepsie."
        ]
      },
      {
        id: "papillon",
        title: "Respiration Papillon",
        description: "Technique douce alternant respirations courtes et longues, idéale pour l'anxiété légère.",
        duration: "5-10 minutes",
        route: "GenericBreathingScreen",
        categories: ["stress", "focus"],
        defaultDurationMinutes: 5,
        steps: getDefaultStepsForTechnique('papillon'),
        longDescription: [
          "La respiration papillon est une technique douce qui imite le battement d'ailes d'un papillon, créant un rythme apaisant qui calme naturellement l'esprit.",
          "Comment pratiquer :",
          "1. Commencez par une inspiration courte par le nez suivie d'une expiration courte par la bouche.",
          "2. Enchaînez avec une inspiration longue par le nez suivie d'une expiration longue par la bouche.",
          "3. Répétez ce cycle en maintenant un rythme régulier et fluide, comme le battement des ailes d'un papillon.",
          "4. Concentrez-vous sur la sensation de légèreté et de fluidité que ce rythme crée.",
          "Effets : Réduction de l'anxiété légère, apaisement du système nerveux, amélioration de la concentration, sensation de calme et de légèreté.",
          "Idéal pour : Les enfants anxieux, les personnes sensibles, les situations sociales stressantes, les moments de tension légère, ou comme technique discrète utilisable partout.",
          "Cette technique peut être pratiquée discrètement dans n'importe quelle situation et convient particulièrement aux personnes qui trouvent les techniques plus intenses trop stimulantes."
        ]
      },
      {
        id: "lion",
        title: "Respiration du Lion",
        description: "Technique dynamique pour libérer les tensions et renforcer la confiance en soi.",
        duration: "3-5 minutes",
        route: "GenericBreathingScreen",
        categories: ["stress", "energy"],
        defaultDurationMinutes: 3,
        steps: getDefaultStepsForTechnique('lion'),
        longDescription: [
          "La respiration du lion (Simhasana en sanskrit) est une technique dynamique issue du yoga qui libère les tensions physiques et émotionnelles accumulées.",
          "Comment pratiquer :",
          "1. Asseyez-vous confortablement, les mains sur les genoux ou en appui sur le sol devant vous.",
          "2. Inspirez profondément par le nez en gonflant la poitrine.",
          "3. Ouvrez grand la bouche, tirez la langue vers le menton le plus loin possible, écarquillez les yeux et expirez fortement avec un son 'haaa'.",
          "4. Détendez votre visage et respirez normalement pendant quelques secondes avant de répéter.",
          "Effets : Libération des tensions faciales et de la gorge, stimulation des muscles du visage, réduction du stress, augmentation de l'énergie, renforcement de la confiance en soi.",
          "Idéal pour : Surmonter la timidité, préparer une prise de parole en public, libérer les émotions refoulées comme la colère ou la frustration, réveiller l'énergie en cas de fatigue mentale.",
          "⚠️ ATTENTION : Pratiquez de préférence dans un environnement privé. Cette technique peut sembler intense pour les débutants, commencez doucement et augmentez progressivement l'intensité."
        ]
      },
      {
        id: "3-4-5",
        title: "Technique 3-4-5",
        description: "Séquence progressive qui suit le rythme naturel de la respiration pour un calme rapide.",
        duration: "3-10 minutes",
        route: "GenericBreathingScreen",
        categories: ["stress", "sleep"],
        defaultDurationMinutes: 5,
        steps: getDefaultStepsForTechnique('3-4-5'),
        longDescription: [
          "La technique 3-4-5 est une séquence progressive qui suit le rythme naturel de la respiration, créant un ralentissement doux du système nerveux.",
          "Comment pratiquer :",
          "1. Installez-vous confortablement, assis ou allongé.",
          "2. Inspirez par le nez pendant 3 secondes en comptant mentalement.",
          "3. Retenez votre souffle pendant 4 secondes.",
          "4. Expirez lentement par la bouche pendant 5 secondes.",
          "5. Répétez ce cycle pendant toute la durée de la session.",
          "Effets : Ralentissement du rythme cardiaque, activation du système nerveux parasympathique, réduction de l'anxiété, préparation au sommeil, amélioration de la concentration.",
          "Idéal pour : Les moments de stress modéré, avant de dormir, comme préparation à la méditation, ou comme alternative plus accessible à la technique 4-7-8 pour les débutants.",
          "Cette technique est particulièrement efficace pour les débutants car elle est facile à mémoriser et à pratiquer, tout en offrant des bienfaits similaires aux techniques plus avancées."
        ]
      },
      {
        id: "pleine-conscience",
        title: "Respiration en Pleine Conscience",
        description: "Technique méditative d'observation du souffle pour calmer l'esprit et développer la présence.",
        duration: "5-20 minutes",
        route: "GenericBreathingScreen",
        categories: ["stress", "focus"],
        defaultDurationMinutes: 10,
        steps: getDefaultStepsForTechnique('pleine-conscience'),
        longDescription: [
          "La respiration en pleine conscience combine les principes de la méditation avec une attention particulière portée au souffle, sans chercher à le modifier.",
          "Comment pratiquer :",
          "1. Installez-vous confortablement dans un endroit calme et fermez les yeux.",
          "2. Observez simplement votre respiration naturelle sans chercher à la modifier.",
          "3. Portez attention aux sensations de l'air qui entre et sort de vos narines, ou au mouvement de votre poitrine et de votre ventre.",
          "4. Si votre esprit s'égare vers des pensées, des émotions ou des sensations, reconnaissez-le sans jugement et ramenez doucement l'attention à votre respiration.",
          "5. Continuez cette observation attentive pendant toute la durée de la session.",
          "Effets : Réduction du stress et de l'anxiété, amélioration de la concentration, développement de la conscience du moment présent, meilleure gestion des pensées et des émotions.",
          "Idéal pour : Développer une pratique méditative, gérer le stress chronique, améliorer la concentration, cultiver la présence et la conscience de soi, préparer l'esprit à des tâches complexes.",
          "Cette technique est à la base de nombreuses pratiques méditatives et peut être approfondie avec le temps pour des bénéfices durables sur la santé mentale."
        ]
      },
      {
        id: "levres-pincees",
        title: "Respiration à Lèvres Pincées",
        description: "Technique thérapeutique pour améliorer la ventilation et réduire l'essoufflement.",
        duration: "5-15 minutes",
        route: "GenericBreathingScreen",
        categories: ["health", "stress"],
        defaultDurationMinutes: 5,
        steps: getDefaultStepsForTechnique('levres-pincees'),
        longDescription: [
          "La respiration à lèvres pincées est une technique thérapeutique qui a démontré son efficacité pour réduire l'essoufflement et améliorer la ventilation pulmonaire.",
          "Comment pratiquer :",
          "1. Détendez vos épaules et votre cou pour éviter toute tension musculaire.",
          "2. Inspirez lentement par le nez pendant 2 secondes, en gardant la bouche fermée.",
          "3. Pincez les lèvres comme si vous alliez siffler ou souffler doucement sur une bougie sans l'éteindre.",
          "4. Expirez lentement à travers les lèvres pincées pendant 4 secondes, soit deux fois plus longtemps que l'inspiration.",
          "5. Répétez ce cycle en maintenant un rythme régulier et contrôlé.",
          "Effets : Amélioration de l'échange gazeux, prévention de l'affaissement des voies respiratoires, réduction de l'essoufflement, meilleur contrôle respiratoire, diminution de la fréquence respiratoire.",
          "Idéal pour : Les personnes souffrant d'asthme, de BPCO (bronchopneumopathie chronique obstructive), d'emphysème, pendant l'effort physique, ou lors d'épisodes d'essoufflement.",
          "⚠️ ATTENTION : Si vous souffrez de problèmes respiratoires chroniques, consultez votre médecin pour intégrer cette technique à votre plan de traitement global."
        ]
      }
    ];
    
    // Importer explicitement les techniques problématiques
    for (const technique of problematicTechniques) {
      console.log(`Importation explicite de la technique problématique ${technique.id}...`);
      
      // Vérifier si la technique existe déjà
      const existingTechnique = await getBreathingTechniqueById(technique.id);
      
      if (existingTechnique) {
        // Mettre à jour la technique existante
        console.log(`La technique ${technique.id} existe déjà, mise à jour...`);
        await db.runAsync(
          `UPDATE breathing_techniques SET 
           title = ?, 
           description = ?, 
           duration = ?, 
           route = ?, 
           categories = ?, 
           steps = ?, 
           defaultDurationMinutes = ?, 
           longDescription = ? 
           WHERE id = ?`,
          [
            technique.title,
            technique.description,
            technique.duration,
            technique.route,
            JSON.stringify(technique.categories),
            JSON.stringify(technique.steps),
            technique.defaultDurationMinutes || 5,
            JSON.stringify(technique.longDescription || []),
            technique.id
          ]
        );
      } else {
        // Insérer la nouvelle technique
        console.log(`La technique ${technique.id} n'existe pas, insertion...`);
        await db.runAsync(
          `INSERT INTO breathing_techniques (id, title, description, duration, route, categories, steps, defaultDurationMinutes, longDescription) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            technique.id,
            technique.title,
            technique.description,
            technique.duration,
            technique.route,
            JSON.stringify(technique.categories),
            JSON.stringify(technique.steps),
            technique.defaultDurationMinutes || 5,
            JSON.stringify(technique.longDescription || [])
          ]
        );
      }
      
      console.log(`Technique problématique ${technique.id} traitée avec succès`);
    }
    
    // Mettre à jour les catégories
    await updateBreathingTechniqueCategories();
    
    // Réparer les descriptions longues
    await fixLongDescriptions();
    
    // Invalider le cache
    invalidateCache();
    
    // Vérifier que toutes les techniques ont bien été importées
    const allTechniques = await getAllBreathingTechniques();
    console.log(`Nombre total de techniques après réinitialisation: ${allTechniques.length}`);
    
    // Vérifier spécifiquement les techniques problématiques
    for (const technique of problematicTechniques) {
      const importedTechnique = await getBreathingTechniqueById(technique.id);
      if (importedTechnique && importedTechnique.longDescription) {
        console.log(`✅ La technique ${technique.id} a été correctement importée avec sa description longue`);
      } else if (importedTechnique) {
        console.warn(`⚠️ La technique ${technique.id} a été importée mais sans description longue`);
      } else {
        console.error(`❌ La technique ${technique.id} n'a pas été importée correctement`);
      }
    }
    
    console.log('Réinitialisation et réimportation terminées avec succès');
  } catch (error) {
    console.error('Erreur lors de la réinitialisation et réimportation:', error);
    throw error;
  }
};

/**
 * Vérifie si les étapes de respiration d'une technique respectent bien le rythme recommandé
 * @param techniqueId L'ID de la technique à vérifier
 * @returns Un objet contenant le résultat de la vérification et des recommandations si nécessaire
 */
export const verifyBreathingTechniqueRhythm = async (techniqueId: string): Promise<{
  isValid: boolean;
  recommendations?: string[];
  details?: {
    totalCycleDuration: number;
    recommendedRatio?: string;
    actualRatio?: string;
  };
}> => {
  try {
    const technique = await getBreathingTechniqueById(techniqueId);
    
    if (!technique || !technique.steps || technique.steps.length === 0) {
      return {
        isValid: false,
        recommendations: ['La technique ne contient pas d\'étapes définies.']
      };
    }
    
    const steps = technique.steps;
    let totalCycleDuration = 0;
    let inhaleTime = 0;
    let exhaleTime = 0;
    let holdTime = 0;
    
    // Calculer la durée totale du cycle et les durées de chaque type d'étape
    steps.forEach(step => {
      totalCycleDuration += step.duration;
      
      const name = step.name.toLowerCase();
      if (name.includes('inspiration') || name.includes('inhale') || name.includes('inhalation')) {
        inhaleTime += step.duration;
      } else if (name.includes('expiration') || name.includes('exhale') || name.includes('exhalation')) {
        exhaleTime += step.duration;
      } else if (name.includes('pause') || name.includes('hold') || name.includes('retention')) {
        holdTime += step.duration;
      }
    });
    
    // Vérifier les ratios recommandés selon le type de technique
    const recommendations: string[] = [];
    let isValid = true;
    let recommendedRatio = '';
    let actualRatio = '';
    
    // Convertir les durées en secondes pour plus de lisibilité
    const inhaleSeconds = inhaleTime / 1000;
    const exhaleSeconds = exhaleTime / 1000;
    const holdSeconds = holdTime / 1000;
    
    // Définir le ratio actuel
    actualRatio = `${inhaleSeconds}:${holdSeconds}:${exhaleSeconds}`;
    
    // Vérifier selon le type de technique
    switch (techniqueId) {
      case 'coherente':
        // La respiration cohérente devrait avoir un ratio 1:1 (inspiration:expiration)
        recommendedRatio = '1:0:1';
        if (Math.abs(inhaleTime - exhaleTime) > 500) { // Tolérance de 500ms
          recommendations.push(`Pour la respiration cohérente, l'inspiration et l'expiration devraient avoir la même durée. Actuellement: ${inhaleSeconds}s vs ${exhaleSeconds}s.`);
          isValid = false;
        }
        break;
        
      case 'box':
        // La respiration box devrait avoir un ratio 1:1:1:1 (inspiration:rétention:expiration:rétention)
        recommendedRatio = '1:1:1:1';
        const boxSteps = steps.length;
        if (boxSteps !== 4) {
          recommendations.push(`La respiration box devrait avoir 4 étapes (inspiration, rétention, expiration, rétention). Actuellement: ${boxSteps} étapes.`);
          isValid = false;
        } else {
          const firstHold = steps[1].duration;
          const secondHold = steps[3].duration;
          if (Math.abs(inhaleTime - exhaleTime) > 500 || 
              Math.abs(inhaleTime - firstHold) > 500 || 
              Math.abs(exhaleTime - secondHold) > 500) {
            recommendations.push(`Pour la respiration box, toutes les étapes devraient avoir la même durée. Vérifiez les durées de chaque étape.`);
            isValid = false;
          }
        }
        break;
        
      case '4-7-8':
        // La respiration 4-7-8 devrait avoir un ratio 4:7:8
        recommendedRatio = '4:7:8';
        const ratio478 = [4, 7, 8];
        const actualRatio478 = [inhaleSeconds, holdSeconds, exhaleSeconds];
        
        // Normaliser les ratios pour comparaison
        const normalizedActual = actualRatio478.map(t => t / actualRatio478[0]);
        
        if (Math.abs(normalizedActual[1] - ratio478[1]/ratio478[0]) > 0.2 || 
            Math.abs(normalizedActual[2] - ratio478[2]/ratio478[0]) > 0.2) {
          recommendations.push(`Pour la respiration 4-7-8, le ratio devrait être 4:7:8. Actuellement: ${actualRatio478.join(':')}.`);
          isValid = false;
        }
        break;
        
      case 'diaphragmatique':
        // La respiration diaphragmatique devrait avoir une expiration plus longue que l'inspiration
        if (exhaleTime <= inhaleTime) {
          recommendations.push(`Pour la respiration diaphragmatique, l'expiration devrait être plus longue que l'inspiration. Actuellement: inspiration ${inhaleSeconds}s, expiration ${exhaleSeconds}s.`);
          isValid = false;
        }
        recommendedRatio = '1:0:1.5-2';
        break;
        
      default:
        // Pour les autres techniques, vérifier des principes généraux
        if (exhaleTime < inhaleTime) {
          recommendations.push(`En général, l'expiration devrait être au moins aussi longue que l'inspiration. Actuellement: inspiration ${inhaleSeconds}s, expiration ${exhaleSeconds}s.`);
          isValid = false;
        }
        
        // Vérifier si les durées sont trop courtes ou trop longues
        if (inhaleTime < 2000) {
          recommendations.push(`L'inspiration semble très courte (${inhaleSeconds}s). Pour la plupart des techniques, une inspiration d'au moins 2-3 secondes est recommandée.`);
          isValid = false;
        }
        
        if (exhaleTime < 2000) {
          recommendations.push(`L'expiration semble très courte (${exhaleSeconds}s). Pour la plupart des techniques, une expiration d'au moins 2-3 secondes est recommandée.`);
          isValid = false;
        }
        
        if (totalCycleDuration < 6000) {
          recommendations.push(`La durée totale du cycle (${totalCycleDuration/1000}s) semble très courte. Un cycle complet devrait généralement durer au moins 6-8 secondes.`);
          isValid = false;
        }
    }
    
    return {
      isValid,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      details: {
        totalCycleDuration,
        recommendedRatio: recommendedRatio || undefined,
        actualRatio
      }
    };
  } catch (error) {
    console.error(`Erreur lors de la vérification du rythme de la technique ${techniqueId}:`, error);
    return {
      isValid: false,
      recommendations: [`Une erreur est survenue lors de la vérification: ${error}`]
    };
  }
};

/**
 * Corrige automatiquement le rythme d'une technique de respiration pour qu'il respecte les recommandations
 * @param techniqueId L'ID de la technique à corriger
 * @returns Un objet contenant le résultat de la correction
 */
export const fixBreathingTechniqueRhythm = async (techniqueId: string): Promise<{
  success: boolean;
  message: string;
  originalSteps?: BreathingStep[];
  correctedSteps?: BreathingStep[];
}> => {
  try {
    const technique = await getBreathingTechniqueById(techniqueId);
    
    if (!technique || !technique.steps || technique.steps.length === 0) {
      return {
        success: false,
        message: 'La technique ne contient pas d\'étapes définies.'
      };
    }
    
    // Sauvegarder les étapes originales
    const originalSteps = [...technique.steps];
    let correctedSteps: BreathingStep[] = [...originalSteps];
    
    // Vérifier le rythme actuel
    const rhythmCheck = await verifyBreathingTechniqueRhythm(techniqueId);
    
    if (rhythmCheck.isValid) {
      return {
        success: true,
        message: 'Le rythme de cette technique est déjà conforme aux recommandations.',
        originalSteps,
        correctedSteps
      };
    }
    
    // Appliquer des corrections spécifiques selon le type de technique
    switch (techniqueId) {
      case 'coherente':
        // Corriger pour avoir un ratio 1:1 (inspiration:expiration)
        correctedSteps = correctCoherenteRhythm(originalSteps);
        break;
        
      case 'box':
        // Corriger pour avoir un ratio 1:1:1:1
        correctedSteps = correctBoxRhythm(originalSteps);
        break;
        
      case '4-7-8':
        // Corriger pour avoir un ratio 4:7:8
        correctedSteps = correct478Rhythm(originalSteps);
        break;
        
      case 'diaphragmatique':
        // Corriger pour avoir une expiration plus longue que l'inspiration
        correctedSteps = correctDiaphragmaticRhythm(originalSteps);
        break;
        
      default:
        // Appliquer des corrections générales
        correctedSteps = correctGeneralRhythm(originalSteps);
    }
    
    // Mettre à jour la technique avec les étapes corrigées
    technique.steps = correctedSteps;
    await updateBreathingTechnique(technique);
    
    // Invalider le cache
    invalidateCache();
    
    return {
      success: true,
      message: 'Le rythme de la technique a été corrigé avec succès.',
      originalSteps,
      correctedSteps
    };
  } catch (error) {
    console.error(`Erreur lors de la correction du rythme de la technique ${techniqueId}:`, error);
    return {
      success: false,
      message: `Une erreur est survenue lors de la correction: ${error}`
    };
  }
};

/**
 * Corrige le rythme de la respiration cohérente pour avoir un ratio 1:1
 */
const correctCoherenteRhythm = (steps: BreathingStep[]): BreathingStep[] => {
  const correctedSteps = [...steps];
  
  // Identifier les étapes d'inspiration et d'expiration
  const inhaleStep = correctedSteps.find(step => 
    step.name.toLowerCase().includes('inspiration') || 
    step.name.toLowerCase().includes('inhale')
  );
  
  const exhaleStep = correctedSteps.find(step => 
    step.name.toLowerCase().includes('expiration') || 
    step.name.toLowerCase().includes('exhale')
  );
  
  if (inhaleStep && exhaleStep) {
    // Calculer la durée moyenne
    const avgDuration = Math.round((inhaleStep.duration + exhaleStep.duration) / 2);
    
    // Définir la même durée pour les deux étapes
    inhaleStep.duration = avgDuration;
    exhaleStep.duration = avgDuration;
  }
  
  return correctedSteps;
};

/**
 * Corrige le rythme de la respiration box pour avoir un ratio 1:1:1:1
 */
const correctBoxRhythm = (steps: BreathingStep[]): BreathingStep[] => {
  // Si le nombre d'étapes n'est pas 4, restructurer complètement
  if (steps.length !== 4) {
    return [
      {
        name: "Inspiration",
        duration: 4000,
        instruction: "Inspirez lentement par le nez"
      },
      {
        name: "Rétention",
        duration: 4000,
        instruction: "Retenez votre souffle, poumons pleins"
      },
      {
        name: "Expiration",
        duration: 4000,
        instruction: "Expirez lentement par la bouche"
      },
      {
        name: "Pause",
        duration: 4000,
        instruction: "Retenez votre souffle, poumons vides"
      }
    ];
  }
  
  // Si le nombre d'étapes est correct, égaliser les durées
  const correctedSteps = [...steps];
  
  // Calculer la durée moyenne
  const totalDuration = correctedSteps.reduce((sum, step) => sum + step.duration, 0);
  const avgDuration = Math.round(totalDuration / 4);
  
  // Appliquer la même durée à toutes les étapes
  correctedSteps.forEach(step => {
    step.duration = avgDuration;
  });
  
  return correctedSteps;
};

/**
 * Corrige le rythme de la respiration 4-7-8 pour avoir le bon ratio
 */
const correct478Rhythm = (steps: BreathingStep[]): BreathingStep[] => {
  // Identifier les étapes
  const inhaleStep = steps.find(step => 
    step.name.toLowerCase().includes('inspiration') || 
    step.name.toLowerCase().includes('inhale')
  );
  
  const holdStep = steps.find(step => 
    step.name.toLowerCase().includes('rétention') || 
    step.name.toLowerCase().includes('hold')
  );
  
  const exhaleStep = steps.find(step => 
    step.name.toLowerCase().includes('expiration') || 
    step.name.toLowerCase().includes('exhale')
  );
  
  // Si toutes les étapes sont identifiées, appliquer le ratio 4:7:8
  if (inhaleStep && holdStep && exhaleStep) {
    // Définir la durée de base (1 unité = 500ms)
    const baseUnit = 500;
    
    inhaleStep.duration = 4 * baseUnit; // 2 secondes
    holdStep.duration = 7 * baseUnit;   // 3.5 secondes
    exhaleStep.duration = 8 * baseUnit; // 4 secondes
    
    return steps;
  }
  
  // Si les étapes ne sont pas correctement identifiées, créer de nouvelles étapes
  return [
    {
      name: "Inspiration",
      duration: 2000, // 4 unités de 500ms
      instruction: "Inspirez lentement par le nez"
    },
    {
      name: "Rétention",
      duration: 3500, // 7 unités de 500ms
      instruction: "Retenez votre souffle"
    },
    {
      name: "Expiration",
      duration: 4000, // 8 unités de 500ms
      instruction: "Expirez lentement par la bouche"
    }
  ];
};

/**
 * Corrige le rythme de la respiration diaphragmatique
 */
const correctDiaphragmaticRhythm = (steps: BreathingStep[]): BreathingStep[] => {
  // Identifier les étapes d'inspiration et d'expiration
  const inhaleStep = steps.find(step => 
    step.name.toLowerCase().includes('inspiration') || 
    step.name.toLowerCase().includes('inhale')
  );
  
  const exhaleStep = steps.find(step => 
    step.name.toLowerCase().includes('expiration') || 
    step.name.toLowerCase().includes('exhale')
  );
  
  if (inhaleStep && exhaleStep) {
    // S'assurer que l'expiration est plus longue que l'inspiration (ratio 1:1.5)
    if (exhaleStep.duration <= inhaleStep.duration) {
      exhaleStep.duration = Math.round(inhaleStep.duration * 1.5);
    }
    
    return steps;
  }
  
  // Si les étapes ne sont pas correctement identifiées, créer de nouvelles étapes
  return [
    {
      name: "Inspiration",
      duration: 4000,
      instruction: "Inspirez lentement par le nez en gonflant le ventre"
    },
    {
      name: "Pause",
      duration: 1000,
      instruction: "Pause brève"
    },
    {
      name: "Expiration",
      duration: 6000,
      instruction: "Expirez lentement par la bouche en rentrant le ventre"
    }
  ];
};

/**
 * Applique des corrections générales au rythme d'une technique de respiration
 */
const correctGeneralRhythm = (steps: BreathingStep[]): BreathingStep[] => {
  const correctedSteps = [...steps];
  
  // Identifier les étapes d'inspiration et d'expiration
  const inhaleSteps = correctedSteps.filter(step => 
    step.name.toLowerCase().includes('inspiration') || 
    step.name.toLowerCase().includes('inhale')
  );
  
  const exhaleSteps = correctedSteps.filter(step => 
    step.name.toLowerCase().includes('expiration') || 
    step.name.toLowerCase().includes('exhale')
  );
  
  // Appliquer des corrections générales
  
  // 1. S'assurer que les inspirations durent au moins 2 secondes
  inhaleSteps.forEach(step => {
    if (step.duration < 2000) {
      step.duration = 2000;
    }
  });
  
  // 2. S'assurer que les expirations durent au moins 2 secondes et sont au moins aussi longues que les inspirations
  if (inhaleSteps.length > 0 && exhaleSteps.length > 0) {
    const totalInhaleDuration = inhaleSteps.reduce((sum, step) => sum + step.duration, 0);
    const avgInhaleDuration = totalInhaleDuration / inhaleSteps.length;
    
    exhaleSteps.forEach(step => {
      if (step.duration < 2000 || step.duration < avgInhaleDuration) {
        step.duration = Math.max(2000, Math.round(avgInhaleDuration * 1.2));
      }
    });
  }
  
  return correctedSteps;
};