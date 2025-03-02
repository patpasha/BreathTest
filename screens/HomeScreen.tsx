import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../App';
import { useTheme } from '../theme/ThemeContext';
import { BreathingTechnique, getAllBreathingTechniques, getBreathingTechniquesByCategory, initDatabase } from '../services/DatabaseService';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Type pour les catégories
type Category = {
  id: string;
  title: string;
  icon?: string; // Pour une future implémentation avec des icônes
};

// Type pour les techniques de respiration est maintenant importé depuis DatabaseService

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const theme = useTheme();
  
  // État pour stocker la catégorie sélectionnée (null = toutes les catégories)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // État pour stocker les techniques de respiration chargées depuis la base de données
  const [breathingTechniques, setBreathingTechniques] = useState<BreathingTechnique[]>([]);
  
  // État pour stocker toutes les techniques (pour le filtrage côté client)
  const [allTechniques, setAllTechniques] = useState<BreathingTechnique[]>([]);
  
  // État pour indiquer si les données sont en cours de chargement
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // État pour indiquer si l'initialisation est terminée
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Définition des catégories
  const categories: Category[] = [
    { id: 'all', title: 'Toutes' },
    { id: 'stress', title: 'Stress & Anxiété' },
    { id: 'sleep', title: 'Sommeil' },
    { id: 'energy', title: 'Énergie' },
    { id: 'focus', title: 'Concentration' },
    { id: 'health', title: 'Santé' },
    { id: 'performance', title: 'Performance' }
  ];

  // Initialiser la base de données et charger les techniques de respiration
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Initialiser la base de données
        await initDatabase();
        
        // Charger toutes les techniques de respiration
        const techniques = await getAllBreathingTechniques();
        setBreathingTechniques(techniques);
        setAllTechniques(techniques); // Stocker toutes les techniques pour le filtrage côté client
        setIsInitialized(true);
      } catch (error) {
        console.error('Erreur lors du chargement des techniques de respiration:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Filtrer les techniques côté client lorsque la catégorie change
  useEffect(() => {
    // Ne pas traiter si l'initialisation n'est pas terminée
    if (!isInitialized) return;
    
    const filterTechniques = async () => {
      try {
        // Afficher l'indicateur de chargement uniquement pour les requêtes réseau
        const needsServerRequest = !allTechniques.length;
        if (needsServerRequest) setIsLoading(true);
        
        if (!selectedCategory || selectedCategory === 'all') {
          // Si aucune catégorie n'est sélectionnée, utiliser toutes les techniques
          if (allTechniques.length > 0) {
            // Utiliser les données en mémoire si disponibles
            setBreathingTechniques(allTechniques);
          } else {
            // Sinon, charger depuis la base de données
            const techniques = await getAllBreathingTechniques();
            setBreathingTechniques(techniques);
            setAllTechniques(techniques);
          }
        } else {
          // Filtrer côté client si possible
          if (allTechniques.length > 0) {
            // Filtrer les techniques en mémoire
            const filteredTechniques = allTechniques.filter(
              technique => technique.categories.includes(selectedCategory)
            );
            setBreathingTechniques(filteredTechniques);
          } else {
            // Sinon, charger depuis la base de données
            const techniques = await getBreathingTechniquesByCategory(selectedCategory);
            setBreathingTechniques(techniques);
          }
        }
      } catch (error) {
        console.error('Erreur lors du filtrage des techniques par catégorie:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    filterTechniques();
  }, [selectedCategory, isInitialized, allTechniques]);

  // Les techniques sont déjà filtrées dans l'état breathingTechniques

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Logo de l'application avec design moderne */}
        <View style={styles.logoContainer}>
          <View 
            style={[
              styles.logoCircle, 
              { 
                backgroundColor: theme.primary,
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: theme.shadowRadius,
                shadowOffset: theme.shadowOffset,
                elevation: theme.elevation
              }
            ]}
          >
            <View style={[styles.logoInnerCircle, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.logoText, { color: theme.primary }]}>BF</Text>
            </View>
          </View>
        </View>
        
        <Text style={[styles.title, { color: theme.textPrimary }]}>BreathFlow</Text>
        <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
          Techniques de respiration basées sur des méthodes scientifiquement reconnues
        </Text>
        
        {/* Indicateur de chargement (uniquement au chargement initial) */}
        {isLoading && !isInitialized && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Chargement des techniques...</Text>
          </View>
        )}

        {/* Sélecteur de catégories avec design amélioré */}
        {isInitialized && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoryScrollView}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  {
                  borderRadius: theme.borderRadiusRound,
                  borderColor: theme.primary,
                  backgroundColor: selectedCategory === category.id 
                    ? theme.primary 
                    : theme.primaryLight,
                  shadowColor: theme.shadowColor,
                  shadowOpacity: selectedCategory === category.id ? 0.3 : 0.1,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: selectedCategory === category.id ? 3 : 1,
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text 
                style={[
                  styles.categoryText, 
                  { 
                    color: selectedCategory === category.id ? theme.textLight : theme.primary,
                    fontWeight: selectedCategory === category.id ? '700' : '500'
                  }
                ]}
              >
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        )}

        <View style={styles.cardContainer}>
          {isLoading && isInitialized && (
            <View style={styles.miniLoadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          )}
          {!isLoading && breathingTechniques.map((technique) => (
            <TouchableOpacity
              key={technique.id}
              style={[
                styles.card, 
                { 
                  backgroundColor: theme.cardBackground, 
                  borderRadius: theme.borderRadiusMedium,
                  shadowColor: theme.shadowColor,
                  shadowOpacity: theme.shadowOpacity,
                  shadowRadius: theme.shadowRadius / 2,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: theme.elevation / 2,
                  borderWidth: 1,
                  borderColor: theme.border
                }
              ]}
              onPress={() => {
                if (technique.route === 'GenericBreathingScreen') {
                  navigation.navigate('GenericBreathingScreen', { techniqueId: technique.id, title: technique.title });
                } else {
                  // Pour les autres routes, utiliser directement le nom de la route
                  // @ts-ignore - Nous savons que ces routes existent dans notre application
                  navigation.navigate(technique.route);
                }
              }}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.primary }]}>{technique.title}</Text>
                <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                  {technique.description}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.cardDuration, { color: theme.textTertiary }]}>
                    <Text style={{ fontWeight: '600' }}>Durée:</Text> {technique.duration}
                  </Text>
                  <View style={styles.categoryTags}>
                    {technique.categories.slice(0, 2).map((catId) => (
                      <View 
                        key={`${technique.id}-${catId}`} 
                        style={[
                          styles.categoryTag, 
                          { 
                            backgroundColor: theme.primaryLight,
                            borderRadius: theme.borderRadiusRound
                          }
                        ]}
                      >
                        <Text style={[styles.categoryTagText, { color: theme.primary, fontWeight: '600' }]}>
                          {categories.find(cat => cat.id === catId)?.title.split(' ')[0]}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.infoButton, 
              { 
                backgroundColor: theme.secondary,
                borderRadius: theme.borderRadiusMedium,
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: theme.shadowRadius / 2,
                shadowOffset: { width: 0, height: 3 },
                elevation: theme.elevation / 2,
                flex: 1,
                marginRight: 8
              }
            ]}
            onPress={() => navigation.navigate('Info')}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Informations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.infoButton, 
              { 
                backgroundColor: theme.primary,
                borderRadius: theme.borderRadiusMedium,
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: theme.shadowRadius / 2,
                shadowOffset: { width: 0, height: 3 },
                elevation: theme.elevation / 2,
                flex: 1,
                marginLeft: 8
              }
            ]}
            onPress={() => navigation.navigate('TestNewTechniques')}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Nouvelles Techniques</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLoadingContainer: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInnerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 30,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  categoryScrollView: {
    marginBottom: 20,
  },
  categoryContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderWidth: 0,
  },
  categoryText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  cardContainer: {
    paddingHorizontal: 20,
  },
  card: {
    marginBottom: 18,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  cardDuration: {
    fontSize: 13,
  },
  categoryTags: {
    flexDirection: 'row',
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 6,
  },
  categoryTagText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
  },
  infoButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default HomeScreen;
