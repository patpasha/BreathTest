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
