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
 * Ajoute les nouvelles techniques de respiration à la base de données
 */
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
          "Pratiquée de manière sécuritaire et progressive, elle offre de nombreux bienfaits physiologiques et psychologiques.",
          "1. Commencez par vous détendre complètement pour réduire votre consommation d'oxygène.",
          "2. Prenez une inspiration profonde et naturelle, sans hyperventiler.",
          "3. Retenez votre souffle aussi longtemps que confortable, sans forcer.",
          "4. Expirez lentement et complètement, puis récupérez en respirant normalement.",
          "Cette pratique améliore la capacité pulmonaire, renforce le diaphragme, stimule le système immunitaire et développe la résistance au stress. Elle est utilisée par les plongeurs, les athlètes et dans certaines pratiques méditatives.",
          "ATTENTION : Ne pratiquez jamais l'apnée seul ou dans l'eau sans supervision. Arrêtez immédiatement si vous ressentez des étourdissements ou un inconfort."
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
          "La respiration papillon est une technique douce qui imite le battement d'ailes d'un papillon.",
          "Cette méthode alterne entre des respirations courtes et longues, créant un rythme apaisant qui calme naturellement l'esprit.",
          "1. Commencez par une inspiration courte suivie d'une expiration courte.",
          "2. Enchaînez avec une inspiration longue suivie d'une expiration longue.",
          "3. Répétez ce cycle en maintenant un rythme régulier et fluide.",
          "Cette technique est particulièrement efficace pour les enfants anxieux ou les personnes sensibles et peut être pratiquée discrètement dans n'importe quelle situation."
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
          "La respiration du lion (Simhasana en sanskrit) est une technique dynamique qui libère les tensions physiques et émotionnelles.",
          "Cette pratique stimule les muscles du visage et de la gorge, relâchant le stress accumulé.",
          "1. Asseyez-vous confortablement, les mains sur les genoux.",
          "2. Inspirez profondément par le nez.",
          "3. Ouvrez grand la bouche, tirez la langue vers le menton, écarquillez les yeux et expirez fortement avec un son 'haaa'.",
          "4. Détendez votre visage et respirez normalement avant de répéter.",
          "Cette technique aide à surmonter la timidité, renforce la confiance en soi et est particulièrement efficace pour libérer les émotions refoulées et la colère."
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
          "La technique 3-4-5 est une séquence progressive qui suit le rythme naturel de la respiration.",
          "L'augmentation graduelle des temps crée un ralentissement doux du système nerveux.",
          "1. Inspirez par le nez pendant 3 secondes.",
          "2. Retenez votre souffle pendant 4 secondes.",
          "3. Expirez lentement par la bouche pendant 5 secondes.",
          "Plus facile que le 4-7-8 pour les débutants, elle offre des bienfaits similaires.",
          "Cette technique est parfaite pour les moments de stress modéré ou comme préparation à des exercices plus avancés."
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
          "La respiration en pleine conscience combine les principes de la méditation avec une attention particulière portée au souffle.",
          "Cette approche s'est révélée efficace pour réduire le stress, l'anxiété et améliorer le bien-être général.",
          "1. Installez-vous confortablement et fermez les yeux.",
          "2. Observez simplement votre respiration sans chercher à la modifier.",
          "3. Portez attention aux sensations de l'air qui entre et sort de vos narines ou au mouvement de votre poitrine et de votre ventre.",
          "4. Si votre esprit s'égare, ramenez doucement l'attention à votre respiration sans jugement.",
          "Cette technique permet de développer une plus grande conscience du moment présent et de renforcer la capacité à gérer les pensées et les émotions."
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
          "La respiration à lèvres pincées est une technique thérapeutique qui a démontré son efficacité pour réduire l'essoufflement et améliorer la ventilation.",
          "Particulièrement bénéfique pour les personnes souffrant de problèmes respiratoires comme l'asthme ou la BPCO.",
          "1. Détendez vos épaules et votre cou.",
          "2. Inspirez lentement par le nez pendant 2 secondes.",
          "3. Pincez les lèvres comme si vous alliez siffler ou souffler sur une bougie.",
          "4. Expirez lentement à travers les lèvres pincées pendant 4 secondes, soit deux fois plus longtemps que l'inspiration.",
          "Cette technique aide à vider complètement les poumons, prévient l'affaissement des voies respiratoires et améliore l'échange gazeux."
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
