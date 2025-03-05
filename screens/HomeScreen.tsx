import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../App';
import { useTheme } from '../theme/ThemeContext';
import { BreathingTechnique, getAllBreathingTechniques, getBreathingTechniquesByCategory, initDatabase } from '../services/DatabaseService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
  
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right', 'top']}>
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient
        colors={[theme.primaryLight, theme.background]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome!</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Retrouvez calme et sérénité grâce à des techniques de respiration éprouvées
          </Text>
        </View>
      </LinearGradient>

      {/* Indicateur de chargement (uniquement au chargement initial) */}
      {isLoading && !isInitialized && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Chargement des techniques...</Text>
        </View>
      )}

      {/* Contenu principal */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Sélecteur de catégories avec design amélioré */}
        {isInitialized && (
          <View style={styles.categorySection}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Catégories</Text>
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
                      borderRadius: 12,
                      backgroundColor: selectedCategory === category.id 
                        ? theme.primary 
                        : 'transparent',
                      borderWidth: 1,
                      borderColor: selectedCategory === category.id 
                        ? theme.primary 
                        : theme.border,
                    }
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text 
                    style={[
                      styles.categoryText, 
                      { 
                        color: selectedCategory === category.id ? theme.textLight : theme.textSecondary,
                        fontWeight: selectedCategory === category.id ? '600' : '400'
                      }
                    ]}
                  >
                    {category.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Techniques de respiration */}
        <View style={styles.techniquesSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {selectedCategory === 'all' ? 'Toutes les techniques' : 
              categories.find(c => c.id === selectedCategory)?.title || 'Techniques'}
          </Text>
          
          {isLoading && isInitialized && (
            <View style={styles.miniLoadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          )}
          
          <View style={styles.cardContainer}>
            {!isLoading && breathingTechniques.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  Aucune technique trouvée dans cette catégorie
                </Text>
              </View>
            )}
            
            {!isLoading && breathingTechniques.map((technique) => (
              <TouchableOpacity
                key={technique.id}
                style={[
                  styles.card, 
                  { 
                    backgroundColor: theme.cardBackground, 
                    borderRadius: 16,
                    shadowColor: theme.shadowColor,
                    shadowOpacity: 0.1,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: 5,
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
                <LinearGradient
                  colors={[theme.primaryLight, theme.cardBackground]}
                  style={styles.cardHeader}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{technique.title}</Text>
                </LinearGradient>
                
                <View style={styles.cardContent}>
                  <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                    {technique.description}
                  </Text>
                  
                  <View style={styles.cardFooter}>
                    <View style={[styles.durationBadge, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.cardDuration, { color: theme.primary }]}>
                        {technique.duration}
                      </Text>
                    </View>
                    
                    <View style={styles.categoryTags}>
                      {technique.categories.slice(0, 2).map((catId) => (
                        <View 
                          key={`${technique.id}-${catId}`} 
                          style={[
                            styles.categoryTag, 
                            { 
                              backgroundColor: theme.primaryLight,
                              borderRadius: 8
                            }
                          ]}
                        >
                          <Text style={[styles.categoryTagText, { color: theme.primary }]}>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 15,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginTop: 0,
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 15,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    letterSpacing: 0.2,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  miniLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 80,
  },
  categorySection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  techniquesSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  categoryScrollView: {
    marginBottom: 5,
  },
  categoryContainer: {
    paddingVertical: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  cardContainer: {
    marginTop: 5,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  cardContent: {
    padding: 20,
    paddingTop: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardDuration: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTags: {
    flexDirection: 'row',
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default HomeScreen;
