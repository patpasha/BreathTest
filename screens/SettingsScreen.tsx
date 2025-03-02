import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../theme/ThemeContext';
import TimeSelector from '../components/TimeSelector';
import { registerForPushNotificationsAsync, scheduleReminderNotification, cancelAllScheduledNotifications } from '../services/NotificationService';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'SettingsTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SettingsScreen = () => {
  const { settings, setSetting, resetSettings } = useSettings();
  const theme = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  // Référence pour suivre si c'est le premier rendu
  const isFirstRender = React.useRef(true);
  
  // Gestion des rappels - s'exécute uniquement lorsque les paramètres changent, pas au montage initial
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Si c'est le premier rendu, ne pas programmer de notification
        if (isFirstRender.current) {
          isFirstRender.current = false;
          return;
        }
        
        if (settings.reminderEnabled) {
          // Demande les permissions pour les notifications
          const permissionGranted = await registerForPushNotificationsAsync();
          
          if (permissionGranted) {
            // Programme le rappel quotidien
            await scheduleReminderNotification(settings.reminderTime);
          } else if (Platform.OS !== 'web') {
            // Affiche une alerte si les permissions sont refusées
            Alert.alert(
              "Notifications désactivées",
              "Veuillez activer les notifications dans les paramètres de votre appareil pour recevoir des rappels.",
              [{ text: "OK" }]
            );
            // Désactive les rappels si les permissions sont refusées
            setSetting('reminderEnabled', false);
          }
        } else {
          // Annule tous les rappels si la fonctionnalité est désactivée
          await cancelAllScheduledNotifications();
        }
      } catch (error) {
        console.error('Erreur lors de la configuration des notifications:', error);
      }
    };
    
    setupNotifications();
  }, [settings.reminderEnabled, settings.reminderTime]);
  
  // Gère le changement d'heure de rappel
  const handleTimeChange = (time: string) => {
    setSetting('reminderTime', time);
  };
  


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Préférences</Text>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Sons</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Activer les sons pendant les exercices</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => setSetting('soundEnabled', value)}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor={settings.soundEnabled ? theme.switchThumbOn : theme.switchThumbOff}
            />
          </View>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Vibrations</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Activer les retours haptiques</Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(value) => setSetting('hapticsEnabled', value)}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor={settings.hapticsEnabled ? theme.switchThumbOn : theme.switchThumbOff}
            />
          </View>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Mode sombre</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Utiliser un thème sombre</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => setSetting('darkMode', value)}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor={settings.darkMode ? theme.switchThumbOn : theme.switchThumbOff}
            />
          </View>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Rappels</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Activer les rappels quotidiens</Text>
            </View>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={(value) => setSetting('reminderEnabled', value)}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor={settings.reminderEnabled ? theme.switchThumbOn : theme.switchThumbOff}
            />
          </View>
          
          {settings.reminderEnabled && (
            <View style={styles.timePickerContainer}>
              <TimeSelector
                time={settings.reminderTime}
                onTimeChange={handleTimeChange}
                label="Heure de rappel quotidien"
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => navigation.navigate('ContactDeveloper')}
        >
          <Text style={styles.contactButtonText}>Contacter le Développeur</Text>
        </TouchableOpacity>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Réinitialiser</Text>
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: theme.error }]} 
            onPress={resetSettings}
          >
            <Text style={[styles.resetButtonText, { color: theme.textLight }]}>Réinitialiser les paramètres</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoSection, { borderLeftColor: theme.divider }]}>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Les paramètres sont automatiquement enregistrés et seront conservés lors de votre prochaine utilisation de l'application.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  timePickerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
  },
  contactButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    marginBottom: 20,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  resetButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SettingsScreen;
