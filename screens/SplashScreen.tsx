import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useTheme } from '../theme/ThemeContext';
import { initDatabase } from '../services/DatabaseService';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const theme = useTheme();
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Initialiser la base de données
  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('Initialisation de la base de données depuis SplashScreen...');
        await initDatabase();
        console.log('Base de données initialisée avec succès depuis SplashScreen');
        setDbInitialized(true);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
        setDbError('Erreur lors de l\'initialisation de la base de données');
      }
    };

    initDb();
  }, []);

  useEffect(() => {
    if (dbInitialized) {
      navigation.replace('MainTabs');
    }
  }, [dbInitialized, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>BreathFlow</Text>
      {dbError && <Text style={[styles.errorText, { color: theme.error }]}>{dbError}</Text>}
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorText: {
    marginTop: 10,
  },
});

export default SplashScreen;
