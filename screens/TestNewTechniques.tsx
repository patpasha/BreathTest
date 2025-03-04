import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { 
  addNewBreathingTechniques, 
  updateBreathingTechniqueCategories, 
  fixAllBreathingTechniques,
  fixLongDescriptions,
  checkJsonLongDescriptions,
  resetAndReimportAllTechniques
} from '../services/DatabaseService';

const TestNewTechniques = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAddNewTechniques = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      await addNewBreathingTechniques();
      
      setResult('Nouvelles techniques ajoutées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout des nouvelles techniques:', error);
      setResult(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategories = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      await updateBreathingTechniqueCategories();
      
      setResult('Catégories mises à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des catégories:', error);
      setResult(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixAllTechniques = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      await fixAllBreathingTechniques();
      
      setResult('Toutes les techniques ont été vérifiées et réparées');
    } catch (error) {
      console.error('Erreur lors de la réparation des techniques:', error);
      setResult(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixLongDescriptions = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      // Vérifier d'abord les descriptions longues dans le fichier JSON
      checkJsonLongDescriptions();
      
      // Réparer les descriptions longues manquantes
      await fixLongDescriptions();
      
      setResult('Les descriptions longues ont été vérifiées et réparées');
      
      // Afficher une alerte pour informer l'utilisateur
      Alert.alert(
        'Réparation terminée',
        'Les descriptions longues ont été vérifiées et réparées. Veuillez redémarrer l\'application pour voir les changements.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur lors de la réparation des descriptions longues:', error);
      setResult(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndReimport = async () => {
    try {
      // Demander confirmation à l'utilisateur
      Alert.alert(
        'Réinitialisation complète',
        'Attention : Cette action va supprimer et recréer toute la base de données. Toutes les techniques seront réimportées. Voulez-vous continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Réinitialiser', 
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                setResult(null);
                
                await resetAndReimportAllTechniques();
                
                setResult('Base de données réinitialisée et toutes les techniques réimportées avec succès');
                
                // Afficher une alerte pour informer l'utilisateur
                Alert.alert(
                  'Réinitialisation terminée',
                  'La base de données a été réinitialisée et toutes les techniques ont été réimportées. Veuillez redémarrer l\'application pour voir les changements.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('Erreur lors de la réinitialisation de la base de données:', error);
                setResult(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de la base de données:', error);
      setResult(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Test des nouvelles fonctionnalités</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleAddNewTechniques}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Ajouter nouvelles techniques</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.secondary }]}
            onPress={handleUpdateCategories}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Mettre à jour catégories</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.accent }]}
            onPress={handleFixAllTechniques}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Réparer toutes les techniques</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.success }]}
            onPress={handleFixLongDescriptions}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Réparer descriptions longues</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.error }]}
            onPress={handleResetAndReimport}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Réinitialiser base de données</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Traitement en cours...</Text>
          </View>
        )}
        
        {result && (
          <View style={[styles.resultContainer, { backgroundColor: theme.surfaceLight }]}>
            <Text style={[styles.resultText, { color: theme.textPrimary }]}>{result}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  resultContainer: {
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  resultText: {
    fontSize: 16,
  },
});

export default TestNewTechniques; 