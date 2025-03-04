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
  resetAndReimportAllTechniques,
  getAllBreathingTechniques,
  verifyBreathingTechniqueRhythm,
  fixBreathingTechniqueRhythm
} from '../services/DatabaseService';

const TestNewTechniques = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rhythmResults, setRhythmResults] = useState<{
    techniqueId: string;
    techniqueName: string;
    isValid: boolean;
    recommendations?: string[];
    details?: {
      totalCycleDuration: number;
      recommendedRatio?: string;
      actualRatio?: string;
    };
  }[]>([]);
  const [correctionResults, setCorrectionResults] = useState<{
    techniqueId: string;
    techniqueName: string;
    success: boolean;
    message: string;
  }[]>([]);

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

  const handleVerifyAllRhythms = async () => {
    try {
      setIsLoading(true);
      const techniques = await getAllBreathingTechniques();
      const results = [];
      
      for (const technique of techniques) {
        const result = await verifyBreathingTechniqueRhythm(technique.id);
        results.push({
          techniqueId: technique.id,
          techniqueName: technique.title,
          ...result
        });
      }
      
      setRhythmResults(results);
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors de la vérification des rythmes:', error);
      setIsLoading(false);
    }
  };

  const handleFixAllRhythms = async () => {
    try {
      setIsLoading(true);
      const techniques = await getAllBreathingTechniques();
      const results = [];
      
      for (const technique of techniques) {
        // Vérifier d'abord si le rythme est valide
        const checkResult = await verifyBreathingTechniqueRhythm(technique.id);
        
        if (!checkResult.isValid) {
          // Si le rythme n'est pas valide, le corriger
          const fixResult = await fixBreathingTechniqueRhythm(technique.id);
          results.push({
            techniqueId: technique.id,
            techniqueName: technique.title,
            success: fixResult.success,
            message: fixResult.message
          });
        } else {
          // Si le rythme est déjà valide, l'indiquer
          results.push({
            techniqueId: technique.id,
            techniqueName: technique.title,
            success: true,
            message: 'Le rythme est déjà conforme aux recommandations.'
          });
        }
      }
      
      setCorrectionResults(results);
      setIsLoading(false);
      
      // Rafraîchir les résultats de vérification
      handleVerifyAllRhythms();
    } catch (error) {
      console.error('Erreur lors de la correction des rythmes:', error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Test des nouvelles fonctionnalités</Text>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Test des nouvelles techniques
          </Text>
          
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
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleVerifyAllRhythms}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Vérifier tous les rythmes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.secondary || '#4CAF50' }]}
              onPress={handleFixAllRhythms}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Corriger tous les rythmes</Text>
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
          
          {rhythmResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={[styles.resultsTitle, { color: theme.textPrimary }]}>
                Résultats de la vérification des rythmes
              </Text>
              
              {rhythmResults.map((result, index) => (
                <View 
                  key={result.techniqueId} 
                  style={[
                    styles.resultItem, 
                    { 
                      backgroundColor: result.isValid ? theme.success : theme.error,
                      marginBottom: index === rhythmResults.length - 1 ? 0 : 10
                    }
                  ]}
                >
                  <Text style={styles.resultTitle}>
                    {result.techniqueName} ({result.techniqueId})
                  </Text>
                  
                  <Text style={styles.resultStatus}>
                    {result.isValid ? '✅ Rythme valide' : '❌ Rythme non conforme'}
                  </Text>
                  
                  {result.details && (
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailText}>
                        Durée totale du cycle: {(result.details.totalCycleDuration / 1000).toFixed(1)}s
                      </Text>
                      
                      {result.details.recommendedRatio && (
                        <Text style={styles.detailText}>
                          Ratio recommandé: {result.details.recommendedRatio}
                        </Text>
                      )}
                      
                      {result.details.actualRatio && (
                        <Text style={styles.detailText}>
                          Ratio actuel: {result.details.actualRatio}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {result.recommendations && result.recommendations.length > 0 && (
                    <View style={styles.recommendationsContainer}>
                      <Text style={styles.recommendationsTitle}>Recommandations:</Text>
                      {result.recommendations.map((recommendation, recIndex) => (
                        <Text key={recIndex} style={styles.recommendationText}>
                          • {recommendation}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
          
          {correctionResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={[styles.resultsTitle, { color: theme.textPrimary }]}>
                Résultats de la correction des rythmes
              </Text>
              
              {correctionResults.map((result, index) => (
                <View 
                  key={`correction-${result.techniqueId}`} 
                  style={[
                    styles.resultItem, 
                    { 
                      backgroundColor: result.success ? theme.success : theme.error,
                      marginBottom: index === correctionResults.length - 1 ? 0 : 10
                    }
                  ]}
                >
                  <Text style={styles.resultTitle}>
                    {result.techniqueName} ({result.techniqueId})
                  </Text>
                  
                  <Text style={styles.resultStatus}>
                    {result.success ? '✅ Correction réussie' : '❌ Échec de la correction'}
                  </Text>
                  
                  <Text style={styles.resultMessage}>
                    {result.message}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultItem: {
    padding: 15,
    borderRadius: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  resultStatus: {
    fontSize: 14,
    color: 'white',
    marginBottom: 10,
  },
  detailsContainer: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 3,
  },
  recommendationsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 5,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 13,
    color: 'white',
    marginBottom: 3,
  },
  resultMessage: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
  },
});

export default TestNewTechniques; 