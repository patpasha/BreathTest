import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const theme = useTheme();

  // Données pour les cartes de techniques de respiration
  const breathingTechniques = [
    {
      id: 'physiological-sigh',
      title: 'Soupir Physiologique',
      description: 'Double inspiration suivie d\'une longue expiration pour réduire rapidement le stress et l\'anxiété.',
      duration: '2-5 minutes',
      route: 'PhysiologicalSigh'
    },
    {
      id: 'cyclic-hyperventilation',
      title: 'Hyperventilation Cyclique',
      description: 'Respirations rapides suivies de rétention du souffle pour augmenter l\'énergie et la concentration.',
      duration: '10-15 minutes',
      route: 'CyclicHyperventilation'
    },
    {
      id: 'wim-hof',
      title: 'Méthode Wim Hof',
      description: 'Respirations profondes suivies de rétention du souffle pour renforcer le système immunitaire et la résistance au stress.',
      duration: '15-20 minutes',
      route: 'WimHof'
    },
    {
      id: '4-7-8',
      title: 'Respiration 4-7-8',
      description: 'Inspirez 4s, retenez 7s, expirez 8s. Réduit l\'anxiété et favorise le sommeil.',
      duration: '5-10 minutes',
      route: 'Respiration478'
    },
    {
      id: 'coherente',
      title: 'Respiration Cohérente',
      description: 'Inspirez 5s, expirez 5s. Synchronise la variabilité de la fréquence cardiaque et réduit le stress.',
      duration: '5-10 minutes',
      route: 'RespirationCoherente'
    },
    {
      id: 'diaphragmatique',
      title: 'Respiration Diaphragmatique',
      description: 'Respirez profondément par le diaphragme. Améliore l\'oxygénation et réduit l\'anxiété.',
      duration: '5-15 minutes',
      route: 'RespirationDiaphragmatique'
    },
    {
      id: 'alternee',
      title: 'Respiration Alternée',
      description: 'Alternez la respiration entre les narines. Équilibre le système nerveux et améliore la concentration.',
      duration: '5-10 minutes',
      route: 'RespirationAlternee'
    },
    {
      id: 'buteyko',
      title: 'Méthode Buteyko',
      description: 'Réduisez la respiration pour normaliser le CO2. Bénéfique pour l\'asthme et l\'hyperventilation.',
      duration: '10-15 minutes',
      route: 'RespirationButeyko'
    },
    {
      id: 'ujjayi',
      title: 'Respiration Ujjayi',
      description: 'Respirez par le nez avec une légère constriction de la gorge. Calme l\'esprit et améliore la concentration.',
      duration: '5-15 minutes',
      route: 'RespirationUjjayi'
    },
    {
      id: 'box',
      title: 'Respiration Box',
      description: 'Inspirez 4s, retenez 4s, expirez 4s, retenez 4s. Excellente pour la gestion du stress et la concentration.',
      duration: '5-10 minutes',
      route: 'RespirationBox'
    },
    {
      id: 'tummo',
      title: 'Respiration Tummo',
      description: 'Technique tibétaine de chaleur intérieure. Renforce le système immunitaire et la thermorégulation.',
      duration: '15-30 minutes',
      route: 'RespirationTummo'
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>BreathFlow</Text>
        <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
          Techniques de respiration basées sur des méthodes scientifiquement reconnues
        </Text>

        <View style={styles.cardContainer}>
          {breathingTechniques.map((technique) => (
            <TouchableOpacity
              key={technique.id}
              style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.textPrimary }]}
              onPress={() => navigation.navigate(technique.route as keyof RootStackParamList)}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.primary }]}>{technique.title}</Text>
                <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                  {technique.description}
                </Text>
                <Text style={[styles.cardDuration, { color: theme.textTertiary }]}>Durée: {technique.duration}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.infoButton, { backgroundColor: theme.secondary }]}
            onPress={() => navigation.navigate('Info')}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Informations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={[styles.buttonText, { color: theme.textLight }]}>Paramètres</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  cardContainer: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 10,
    marginBottom: 15,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDuration: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  infoButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
