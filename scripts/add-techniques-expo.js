// Script pour ajouter les nouvelles techniques de respiration à la base de données
// Ce script doit être exécuté dans l'environnement Expo, pas directement avec Node.js

import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

// Ouvrir la base de données
const db = SQLite.openDatabase('breathflow.db');

// Fonction pour vérifier si une technique existe déjà
function techniqueExists(id) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id FROM breathing_techniques WHERE id = ?',
        [id],
        (_, result) => {
          resolve(result.rows.length > 0);
        },
        (_, error) => {
          console.error(`Erreur lors de la vérification de la technique ${id}:`, error);
          reject(error);
          return false;
        }
      );
    });
  });
}

// Fonction pour ajouter une technique
async function addTechnique(technique) {
  try {
    const exists = await techniqueExists(technique.id);
    
    if (!exists) {
      console.log(`Ajout de la technique ${technique.id}...`);
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
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
            ],
            (_, result) => {
              console.log(`Technique ${technique.id} ajoutée avec succès`);
              resolve(result);
            },
            (_, error) => {
              console.error(`Erreur lors de l'ajout de la technique ${technique.id}:`, error);
              reject(error);
              return false;
            }
          );
        });
      });
    } else {
      console.log(`La technique ${technique.id} existe déjà, aucune action nécessaire`);
      return Promise.resolve();
    }
  } catch (error) {
    console.error(`Erreur lors de l'ajout de la technique ${technique.id}:`, error);
    return Promise.reject(error);
  }
}

// Définir les étapes pour chaque technique
const papillonSteps = [
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
];

const lionSteps = [
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
];

const technique345Steps = [
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
];

const pleineConscienceSteps = [
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
];

const levresPinceesSteps = [
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
];

// Définir les nouvelles techniques
const newTechniques = [
  {
    id: "papillon",
    title: "Respiration Papillon",
    description: "Technique douce alternant respirations courtes et longues, idéale pour l'anxiété légère.",
    duration: "5-10 minutes",
    route: "GenericBreathingScreen",
    categories: ["stress", "focus"],
    defaultDurationMinutes: 5,
    steps: papillonSteps,
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
    steps: lionSteps,
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
    steps: technique345Steps,
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
    steps: pleineConscienceSteps,
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
    steps: levresPinceesSteps,
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

// Fonction principale
export async function addNewBreathingTechniques() {
  try {
    console.log('Démarrage de l\'ajout des nouvelles techniques de respiration...');
    
    // Ajouter chaque technique
    for (const technique of newTechniques) {
      await addTechnique(technique);
    }
    
    console.log('Toutes les nouvelles techniques ont été ajoutées avec succès !');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout des nouvelles techniques:', error);
    return false;
  }
}

// Exporter la fonction pour qu'elle puisse être utilisée dans l'application
export default {
  addNewBreathingTechniques
};
