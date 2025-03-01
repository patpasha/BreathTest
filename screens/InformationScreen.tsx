import React from 'react';
import { StyleSheet, View, Text, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const InformationScreen = () => {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>À propos des techniques de respiration</Text>
        
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Sources scientifiques</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            BreathFlow propose des techniques de respiration basées sur des recherches scientifiques et des pratiques traditionnelles éprouvées. Parmi nos sources principales :
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.primary }]}>Dr. Andrew Huberman</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Le Dr. Andrew Huberman est un neuroscientifique et professeur à l'Université de Stanford. 
            Ses recherches se concentrent sur le système visuel, les états cérébraux et la façon dont 
            nous pouvons utiliser des outils tels que la respiration pour modifier notre état physiologique 
            et psychologique.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Ses techniques de respiration sont basées sur des recherches scientifiques et visent à 
            activer des voies neurales spécifiques pour réduire le stress, améliorer la concentration 
            et optimiser les performances cognitives.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Wim Hof</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Wim Hof, également connu sous le nom de "The Iceman", est célèbre pour sa capacité à résister 
            à des températures extrêmement froides. Il a développé la méthode Wim Hof, qui combine des 
            techniques de respiration, l'exposition au froid et la méditation.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Sa méthode de respiration est connue pour renforcer le système immunitaire, réduire l'inflammation, 
            améliorer l'énergie et augmenter la résistance au stress. Des études scientifiques ont validé 
            certains des effets physiologiques de sa méthode.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Soupir Physiologique</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Le soupir physiologique est une technique de respiration qui consiste en une double inspiration 
            suivie d'une longue expiration. Cette technique active le système nerveux parasympathique, 
            responsable de la relaxation et de la récupération.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Réduit rapidement le stress et l'anxiété
            {'\n'}- Diminue la fréquence cardiaque
            {'\n'}- Améliore la clarté mentale
            {'\n'}- Peut être pratiqué n'importe où, n'importe quand
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Hyperventilation Cyclique</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            L'hyperventilation cyclique implique des séries de respirations rapides suivies de périodes 
            de rétention du souffle. Cette technique augmente temporairement les niveaux d'oxygène dans 
            le sang et peut modifier l'état mental.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Augmente l'énergie et la vigilance
            {'\n'}- Améliore la concentration
            {'\n'}- Peut réduire l'inflammation
            {'\n'}- Renforce la résistance mentale
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Méthode Wim Hof</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            La méthode Wim Hof consiste en 30-40 respirations profondes et rapides, suivies d'une 
            rétention du souffle aussi longue que possible, puis d'une inspiration profonde retenue 
            pendant 15 secondes. Ce cycle est généralement répété 3-4 fois.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Renforce le système immunitaire
            {'\n'}- Augmente les niveaux d'énergie
            {'\n'}- Améliore la résistance au stress
            {'\n'}- Réduit l'inflammation
            {'\n'}- Améliore la concentration et la clarté mentale
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Précautions</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Ces techniques de respiration sont généralement sûres pour la plupart des personnes en bonne santé, 
            mais elles peuvent provoquer des étourdissements ou une sensation de tête légère. Ne pratiquez pas 
            ces techniques en conduisant ou en nageant.
          </Text>
          <Text style={[styles.warning, { color: theme.error }]}>
            Consultez un professionnel de la santé avant de pratiquer ces techniques si vous souffrez 
            d'hypertension, de problèmes cardiaques, d'épilepsie, si vous êtes enceinte ou si vous avez 
            d'autres problèmes de santé.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Ressources</Text>
          <Text 
            style={[styles.link, { color: theme.accent }]} 
            onPress={() => Linking.openURL('https://hubermanlab.com/')}
          >
            Site web du Dr. Andrew Huberman
          </Text>
          <Text 
            style={[styles.link, { color: theme.accent }]} 
            onPress={() => Linking.openURL('https://www.wimhofmethod.com/')}
          >
            Site web de Wim Hof
          </Text>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
  },
  warning: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  link: {
    fontSize: 16,
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
});

export default InformationScreen;
