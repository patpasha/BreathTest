import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../App';
import { useTheme } from '../theme/ThemeContext';

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

// Type pour les techniques de respiration
type BreathingTechnique = {
  id: string;
  title: string;
  description: string;
  duration: string;
  route: string;
  categories: string[]; // IDs des catégories auxquelles cette technique appartient
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const theme = useTheme();
  
  // État pour stocker la catégorie sélectionnée (null = toutes les catégories)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Définition des catégories
  const categories: Category[] = [
    { id: 'all', title: 'Toutes' },
    { id: 'stress', title: 'Stress & Anxiété' },
    { id: 'sleep', title: 'Sommeil' },
    { id: 'energy', title: 'Énergie' },
    { id: 'focus', title: 'Concentration' },
    { id: 'health', title: 'Santé' }
  ];

  // Données pour les cartes de techniques de respiration avec catégories
  const breathingTechniques: BreathingTechnique[] = [
    {
      id: 'physiological-sigh',
      title: 'Soupir Physiologique',
      description: 'Double inspiration suivie d\'une longue expiration pour réduire rapidement le stress et l\'anxiété.',
      duration: '2-5 minutes',
      route: 'PhysiologicalSigh',
      categories: ['stress']
    },
    {
      id: 'cyclic-hyperventilation',
      title: 'Hyperventilation Cyclique',
      description: 'Respirations rapides suivies de rétention du souffle courte pour augmenter l\'énergie et la concentration. Version simplifiée de la méthode Wim Hof.',
      duration: '10-15 minutes',
      route: 'CyclicHyperventilation',
      categories: ['energy', 'focus']
    },
    {
      id: 'wim-hof',
      title: 'Méthode Wim Hof',
      description: 'Version occidentale moderne de la respiration Tummo. Respirations profondes suivies de rétentions du souffle et d\'une phase de récupération pour renforcer le système immunitaire.',
      duration: '15-20 minutes',
      route: 'WimHof',
      categories: ['energy', 'health', 'stress']
    },
    {
      id: '4-7-8',
      title: 'Respiration 4-7-8',
      description: 'Inspirez 4s, retenez 7s, expirez 8s. Réduit l\'anxiété et favorise le sommeil.',
      duration: '5-10 minutes',
      route: 'Respiration478',
      categories: ['sleep', 'stress']
    },
    {
      id: 'coherente',
      title: 'Respiration Cohérente',
      description: 'Inspirez 5s, expirez 5s. Synchronise la variabilité de la fréquence cardiaque et réduit le stress.',
      duration: '5-10 minutes',
      route: 'RespirationCoherente',
      categories: ['stress', 'health']
    },
    {
      id: 'diaphragmatique',
      title: 'Respiration Diaphragmatique',
      description: 'Respirez profondément par le diaphragme. Améliore l\'oxygénation et réduit l\'anxiété.',
      duration: '5-15 minutes',
      route: 'RespirationDiaphragmatique',
      categories: ['stress', 'sleep', 'health']
    },
    {
      id: 'alternee',
      title: 'Respiration Alternée',
      description: 'Alternez la respiration entre les narines. Équilibre le système nerveux et améliore la concentration.',
      duration: '5-10 minutes',
      route: 'RespirationAlternee',
      categories: ['stress', 'focus']
    },
    {
      id: 'buteyko',
      title: 'Méthode Buteyko',
      description: 'Réduisez la respiration pour normaliser le CO2. Bénéfique pour l\'asthme et l\'hyperventilation.',
      duration: '10-15 minutes',
      route: 'RespirationButeyko',
      categories: ['health', 'sleep']
    },
    {
      id: 'ujjayi',
      title: 'Respiration Ujjayi',
      description: 'Respirez par le nez avec une légère constriction de la gorge. Calme l\'esprit et améliore la concentration.',
      duration: '5-15 minutes',
      route: 'RespirationUjjayi',
      categories: ['focus', 'stress']
    },
    {
      id: 'box',
      title: 'Respiration Box',
      description: 'Inspirez 4s, retenez 4s, expirez 4s, retenez 4s. Excellente pour la gestion du stress et la concentration.',
      duration: '5-10 minutes',
      route: 'RespirationBox',
      categories: ['stress', 'focus']
    },
    {
      id: 'tummo',
      title: 'Respiration Tummo',
      description: 'Technique tibétaine traditionnelle de chaleur intérieure. Version plus complète avec visualisation et techniques de concentration spécifiques.',
      duration: '15-30 minutes',
      route: 'RespirationTummo',
      categories: ['energy', 'health']
    }
  ];

  // Filtrer les techniques en fonction de la catégorie sélectionnée
  const filteredTechniques = selectedCategory && selectedCategory !== 'all'
    ? breathingTechniques.filter(technique => technique.categories.includes(selectedCategory))
    : breathingTechniques;

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

        {/* Sélecteur de catégories avec design amélioré */}
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

        <View style={styles.cardContainer}>
          {filteredTechniques.map((technique) => (
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
              onPress={() => navigation.navigate(technique.route as keyof RootStackParamList)}
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
                flex: 1
              }
            ]}
            onPress={() => navigation.navigate('Info')}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Informations</Text>
          </TouchableOpacity>
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
