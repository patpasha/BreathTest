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

        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Techniques de respiration</Text>

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
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Respiration 4-7-8</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Développée par le Dr. Andrew Weil, cette technique consiste à inspirer pendant 4 secondes, 
            retenir son souffle pendant 7 secondes, puis expirer pendant 8 secondes. Elle est parfois 
            appelée "respiration tranquillisante".
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Favorise l'endormissement
            {'\n'}- Réduit l'anxiété et le stress
            {'\n'}- Aide à gérer les envies compulsives
            {'\n'}- Améliore le contrôle émotionnel
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Respiration Cohérente</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            La respiration cohérente consiste à respirer à un rythme régulier de 5 secondes d'inspiration 
            et 5 secondes d'expiration, soit environ 6 respirations par minute. Ce rythme synchronise la 
            variabilité de la fréquence cardiaque et a des effets bénéfiques sur le système nerveux.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Réduit le stress et l'anxiété
            {'\n'}- Améliore la concentration
            {'\n'}- Régule la pression artérielle
            {'\n'}- Améliore la variabilité de la fréquence cardiaque
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Respiration Diaphragmatique</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Également connue sous le nom de respiration abdominale, cette technique implique de respirer 
            profondément en utilisant le diaphragme plutôt que les muscles de la poitrine. L'abdomen se 
            gonfle pendant l'inspiration et se contracte pendant l'expiration.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Réduit le stress
            {'\n'}- Abaisse la tension artérielle
            {'\n'}- Améliore la digestion
            {'\n'}- Renforce le diaphragme
            {'\n'}- Améliore l'oxygénation du sang
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Respiration Alternée</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Connue sous le nom de "Nadi Shodhana" en Sanskrit, cette technique yogique consiste à alterner 
            la respiration entre les narines gauche et droite. Elle équilibre les deux hémisphères du cerveau 
            et les systèmes nerveux sympathique et parasympathique.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Équilibre le système nerveux
            {'\n'}- Améliore la concentration et la clarté mentale
            {'\n'}- Réduit le stress et l'anxiété
            {'\n'}- Améliore la fonction pulmonaire
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Méthode Buteyko</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Développée par le médecin russe Konstantin Buteyko, cette méthode se concentre sur la réduction 
            du volume respiratoire et la respiration nasale. Elle vise à corriger la surrespiration chronique 
            (hyperventilation) qui peut contribuer à divers problèmes de santé.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Améliore les symptômes d'asthme
            {'\n'}- Réduit l'hypertension
            {'\n'}- Améliore la qualité du sommeil
            {'\n'}- Augmente l'énergie et l'endurance
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Respiration Ujjayi</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Connue sous le nom de "respiration océanique" en raison du son qu'elle produit, cette technique 
            yogique implique de contracter légèrement la glotte pendant la respiration, créant un son doux 
            et régulier. Elle est souvent pratiquée pendant les séances de yoga.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Calme le système nerveux
            {'\n'}- Améliore la concentration
            {'\n'}- Augmente l'oxygénation
            {'\n'}- Renforce le contrôle respiratoire
            {'\n'}- Aide à réguler la chaleur corporelle
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Respiration Box</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Également connue sous le nom de respiration carrée, cette technique implique de respirer selon 
            un schéma en quatre parties égales : inspiration, rétention, expiration, rétention, chacune 
            durant le même temps (généralement 4 secondes). Elle est utilisée par les Navy SEALs pour 
            rester calmes sous pression.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Réduit l'anxiété rapidement
            {'\n'}- Améliore la concentration
            {'\n'}- Aide à gérer le stress aigu
            {'\n'}- Favorise un sommeil réparateur
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Respiration Tummo</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Originaire du Tibet, cette technique avancée combine respiration profonde, visualisation et 
            contraction musculaire pour générer de la chaleur interne. Elle est pratiquée par les moines 
            tibétains pour résister au froid extrême et atteindre des états méditatifs profonds.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Avantages:
            {'\n'}- Augmente la température corporelle
            {'\n'}- Renforce le système immunitaire
            {'\n'}- Améliore la résistance au froid
            {'\n'}- Favorise des états de conscience altérés
            {'\n'}- Augmente l'énergie vitale
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
          <Text 
            style={[styles.link, { color: theme.accent }]} 
            onPress={() => Linking.openURL('https://www.drweil.com/')}
          >
            Site web du Dr. Andrew Weil
          </Text>
          <Text 
            style={[styles.link, { color: theme.accent }]} 
            onPress={() => Linking.openURL('https://www.buteyko.com/')}
          >
            Institut Buteyko
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
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
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
