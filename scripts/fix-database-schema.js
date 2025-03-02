/**
 * Script pour corriger le schéma de la base de données
 * 
 * Ce script vérifie si la colonne 'steps' existe dans la table 'breathing_techniques'
 * et l'ajoute si elle n'existe pas.
 */
const SQLite = require('expo-sqlite');
const FileSystem = require('expo-file-system');
const path = require('path');

async function fixDatabaseSchema() {
  try {
    console.log('Vérification et correction du schéma de la base de données...');
    
    // Ouvrir la base de données
    const db = SQLite.openDatabase('breathflow.db');
    
    // Vérifier les colonnes manquantes
    db.transaction(tx => {
      tx.executeSql(
        "PRAGMA table_info(breathing_techniques)",
        [],
        (_, result) => {
          const columns = result.rows._array;
          
          // Vérifier chaque colonne nécessaire
          checkAndAddColumn(tx, columns, 'steps', 'TEXT');
          checkAndAddColumn(tx, columns, 'defaultDurationMinutes', 'INTEGER DEFAULT 5');
          checkAndAddColumn(tx, columns, 'longDescription', 'TEXT');
          
          // Mettre à jour les données existantes après avoir ajouté toutes les colonnes
          updateExistingData(db);
        },
        (_, error) => {
          console.error("Erreur lors de la vérification du schéma:", error);
        }
      );
    });
  } catch (error) {
    console.error('Erreur lors de la correction du schéma de la base de données:', error);
  }
}

function checkAndAddColumn(tx, columns, columnName, columnType) {
  const columnExists = columns.some(col => col.name === columnName);
  
  if (!columnExists) {
    console.log(`La colonne '${columnName}' n'existe pas, ajout en cours...`);
    
    // Ajouter la colonne
    tx.executeSql(
      `ALTER TABLE breathing_techniques ADD COLUMN ${columnName} ${columnType}`,
      [],
      (_, alterResult) => {
        console.log(`Colonne '${columnName}' ajoutée avec succès`);
      },
      (_, error) => {
        console.error(`Erreur lors de l'ajout de la colonne '${columnName}':`, error);
      }
    );
  } else {
    console.log(`La colonne '${columnName}' existe déjà`);
  }
}

function updateExistingData(db) {
  try {
    // Charger les données depuis le fichier JSON
    const techniques = require('../assets/data/breathing_techniques.json');
    
    // Mettre à jour chaque technique
    db.transaction(tx => {
      techniques.forEach(technique => {
        // Préparer les données à mettre à jour
        const updates = [];
        const params = [];
        
        // Vérifier et ajouter chaque colonne si elle existe dans les données
        if (technique.steps) {
          updates.push("steps = ?");
          params.push(JSON.stringify(technique.steps));
        }
        
        if (technique.defaultDurationMinutes !== undefined) {
          updates.push("defaultDurationMinutes = ?");
          params.push(technique.defaultDurationMinutes);
        }
        
        if (technique.longDescription) {
          updates.push("longDescription = ?");
          params.push(JSON.stringify(technique.longDescription));
        }
        
        // Ajouter l'ID pour la clause WHERE
        params.push(technique.id);
        
        // Exécuter la requête de mise à jour si des colonnes doivent être mises à jour
        if (updates.length > 0) {
          const updateQuery = `UPDATE breathing_techniques SET ${updates.join(", ")} WHERE id = ?`;
          
          tx.executeSql(
            updateQuery,
            params,
            (_, updateResult) => {
              console.log(`Technique ${technique.id} mise à jour avec succès`);
            },
            (_, error) => {
              console.error(`Erreur lors de la mise à jour de la technique ${technique.id}:`, error);
            }
          );
        }
      });
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données existantes:', error);
  }
}

// Exécuter la fonction principale
fixDatabaseSchema();
