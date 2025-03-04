import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getAllBreathingTechniques, updateBreathingTechniqueCategories } from '../services/DatabaseService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type BreathingTechnique = {
  id: string;
  title: string;
  description: string;
  categories: string[];
};

type TestNewTechniquesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TestNewTechniquesScreen() {
  const [techniques, setTechniques] = useState<BreathingTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<TestNewTechniquesScreenNavigationProp>();

  const loadTechniques = async () => {
    try {
      setLoading(true);
      const allTechniques = await getAllBreathingTechniques();
      
      // Filtrer pour n'afficher que les nouvelles techniques
      const newTechniqueIds = ['apnee', 'papillon', 'lion', '3-4-5', 'pleine-conscience', 'levres-pincees'];
      const filteredTechniques = allTechniques.filter(technique => 
        newTechniqueIds.includes(technique.id)
      );
      
      setTechniques(filteredTechniques);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des techniques:', err);
      setError('Impossible de charger les techniques de respiration');
      setLoading(false);
    }
  };

  const handleUpdateCategories = async () => {
    try {
      await updateBreathingTechniqueCategories();
      Alert.alert(
        'Mise à jour réussie',
        'Les catégories des techniques de respiration ont été mises à jour avec succès.',
        [{ text: 'OK', onPress: () => loadTechniques() }]
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour des catégories:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la mise à jour des catégories.'
      );
    }
  };

  useEffect(() => {
    loadTechniques();
  }, []);

  const handleTechniquePress = (techniqueId: string, title: string) => {
    navigation.navigate('GenericBreathingScreen', {
      techniqueId,
      title
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement des techniques...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Nouvelles Techniques de Respiration</Text>
      
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateCategories}>
        <Text style={styles.updateButtonText}>Mettre à jour les catégories</Text>
      </TouchableOpacity>
      
      {techniques.length === 0 ? (
        <Text style={styles.noTechniquesText}>
          Aucune nouvelle technique n'a été trouvée dans la base de données.
        </Text>
      ) : (
        techniques.map((technique) => (
          <TouchableOpacity
            key={technique.id}
            style={styles.techniqueCard}
            onPress={() => handleTechniquePress(technique.id, technique.title)}
          >
            <Text style={styles.techniqueTitle}>{technique.title}</Text>
            <Text style={styles.techniqueDescription}>{technique.description}</Text>
            <View style={styles.categoriesContainer}>
              {technique.categories.map((category, index) => (
                <View key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 15,
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
  noTechniquesText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    color: '#666',
  },
  techniqueCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  techniqueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  techniqueDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#e0f7fa',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#00838f',
  },
});
