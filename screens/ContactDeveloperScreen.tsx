import React from 'react';
import { View, Text, Button, StyleSheet, Alert, Linking } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const ContactDeveloperScreen = () => {
  const theme = useTheme();

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
    <View style={styles.container}>
      <Text style={styles.title}>Contacter le Développeur</Text>
      <Button title="Contacter" onPress={handleContact} />
      <Button title="Suggérer une fonctionnalité" onPress={handleSuggestFeature} />
      <Button title="Signaler un bug" onPress={handleReportBug} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default ContactDeveloperScreen;
