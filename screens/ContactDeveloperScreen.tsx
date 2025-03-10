import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

const ContactDeveloperScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  const handleContact = () => {
    const subject = 'Contact';
    const email = 'jarvisherohq@gmail.com';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url);
  };

  const handleSuggestFeature = () => {
    const subject = 'Suggest a feature';
    const email = 'jarvisherohq@gmail.com';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url);
  };

  const handleReportBug = () => {
    const subject = 'Report a bug';
    const email = 'jarvisherohq@gmail.com';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      
      {/* En-tête avec dégradé */}
      <LinearGradient
        colors={[theme.primaryLight, theme.background]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Contacter le Développeur</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.contactButton, { backgroundColor: theme.primary }]}
          onPress={handleContact}
        >
          <Ionicons name="mail-outline" size={24} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Contacter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.contactButton, { backgroundColor: theme.secondary || '#4CAF50' }]}
          onPress={handleSuggestFeature}
        >
          <Ionicons name="bulb-outline" size={24} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Suggérer une fonctionnalité</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.contactButton, { backgroundColor: theme.error }]}
          onPress={handleReportBug}
        >
          <Ionicons name="bug-outline" size={24} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Signaler un bug</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    position: 'relative',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactDeveloperScreen;
