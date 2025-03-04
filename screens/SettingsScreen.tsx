import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../theme/ThemeContext';
import TimeSelector from '../components/TimeSelector';
import DaySelector from '../components/DaySelector';
import { registerForPushNotificationsAsync, scheduleReminderNotification, cancelAllScheduledNotifications } from '../services/NotificationService';
import Ionicons from '@expo/vector-icons/Ionicons';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'SettingsTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SettingsScreen = () => {
  const { settings, setSetting, resetSettings } = useSettings();
  const theme = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  // État local pour suivre les modifications non enregistrées (uniquement pour les rappels)
  const [localReminderSettings, setLocalReminderSettings] = useState({
    reminderEnabled: settings.reminderEnabled,
    reminderTime: settings.reminderTime,
    reminderDays: [...settings.reminderDays]
  });
  const [hasReminderChanges, setHasReminderChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Référence pour suivre si c'est le premier rendu
  const isFirstRender = useRef(true);
  
  // Référence pour suivre si une notification est en cours de programmation
  const isSchedulingNotification = useRef(false);
  
  // Référence pour suivre les derniers paramètres de notification
  const lastNotificationSettings = useRef({
    enabled: settings.reminderEnabled,
    time: settings.reminderTime,
    days: [...settings.reminderDays]
  });

  // Mettre à jour les paramètres locaux de rappel lorsque les paramètres globaux changent
  useEffect(() => {
    setLocalReminderSettings({
      reminderEnabled: settings.reminderEnabled,
      reminderTime: settings.reminderTime,
      reminderDays: [...settings.reminderDays]
    });
  }, [settings.reminderEnabled, settings.reminderTime, settings.reminderDays]);

  // Vérifier s'il y a des modifications non enregistrées pour les rappels
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const reminderSettingsChanged = 
      localReminderSettings.reminderEnabled !== settings.reminderEnabled ||
      localReminderSettings.reminderTime !== settings.reminderTime ||
      JSON.stringify(localReminderSettings.reminderDays) !== JSON.stringify(settings.reminderDays);
    
    setHasReminderChanges(reminderSettingsChanged);
  }, [localReminderSettings, settings]);
  
  // Gestion des rappels - s'exécute uniquement lorsque les paramètres changent, pas au montage initial
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Si c'est le premier rendu, ne pas programmer de notification
        if (isFirstRender.current) {
          isFirstRender.current = false;
          lastNotificationSettings.current = {
            enabled: settings.reminderEnabled,
            time: settings.reminderTime,
            days: [...settings.reminderDays]
          };
          return;
        }
        
        // Si une notification est déjà en cours de programmation, ne pas en programmer une autre
        if (isSchedulingNotification.current) {
          return;
        }
        
        // Vérifier si les paramètres ont réellement changé
        const settingsChanged = 
          lastNotificationSettings.current.enabled !== settings.reminderEnabled ||
          lastNotificationSettings.current.time !== settings.reminderTime ||
          JSON.stringify(lastNotificationSettings.current.days) !== JSON.stringify(settings.reminderDays);
        
        if (!settingsChanged) {
          return;
        }
        
        // Mettre à jour les derniers paramètres
        lastNotificationSettings.current = {
          enabled: settings.reminderEnabled,
          time: settings.reminderTime,
          days: [...settings.reminderDays]
        };
        
        isSchedulingNotification.current = true;
        
        if (settings.reminderEnabled) {
          // Demande les permissions pour les notifications
          const permissionGranted = await registerForPushNotificationsAsync();
          
          if (permissionGranted) {
            // Programme le rappel quotidien avec les jours sélectionnés
            await scheduleReminderNotification(settings.reminderTime, settings.reminderDays);
          } else if (Platform.OS !== 'web') {
            // Affiche une alerte si les permissions sont refusées
            Alert.alert(
              "Notifications désactivées",
              "Veuillez activer les notifications dans les paramètres de votre appareil pour recevoir des rappels.",
              [{ text: "OK" }]
            );
            // Désactive les rappels si les permissions sont refusées
            setLocalReminderSetting('reminderEnabled', false);
          }
        } else {
          // Annule tous les rappels si la fonctionnalité est désactivée
          await cancelAllScheduledNotifications();
        }
      } catch (error) {
        console.error('Erreur lors de la configuration des notifications:', error);
      } finally {
        isSchedulingNotification.current = false;
      }
    };
    
    setupNotifications();
  }, [settings.reminderEnabled, settings.reminderTime, settings.reminderDays]);
  
  // Fonction pour mettre à jour les paramètres locaux de rappel
  const setLocalReminderSetting = <K extends keyof typeof localReminderSettings>(key: K, value: typeof localReminderSettings[K]) => {
    setLocalReminderSettings(prev => ({ ...prev, [key]: value }));
  };

  // Fonction pour enregistrer les modifications des rappels
  const saveReminderSettings = async () => {
    setIsSaving(true);
    try {
      // Mettre à jour tous les paramètres de rappel
      setSetting('reminderEnabled', localReminderSettings.reminderEnabled);
      setSetting('reminderTime', localReminderSettings.reminderTime);
      setSetting('reminderDays', localReminderSettings.reminderDays);
      
      // Afficher une confirmation
      Alert.alert(
        "Paramètres de rappel enregistrés",
        "Vos paramètres de rappel ont été enregistrés avec succès.",
        [{ text: "OK" }]
      );
      
      setHasReminderChanges(false);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des paramètres de rappel:', error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de l'enregistrement des paramètres de rappel.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction pour annuler les modifications des rappels
  const cancelReminderChanges = () => {
    setLocalReminderSettings({
      reminderEnabled: settings.reminderEnabled,
      reminderTime: settings.reminderTime,
      reminderDays: [...settings.reminderDays]
    });
    setHasReminderChanges(false);
  };
  
  // Gère le changement d'heure de rappel
  const handleTimeChange = (time: string) => {
    setLocalReminderSetting('reminderTime', time);
  };
  
  // Gère le changement des jours de rappel
  const handleDaysChange = (days: number[]) => {
    setLocalReminderSetting('reminderDays', days);
  };
  
  // Fonction pour confirmer la réinitialisation des paramètres
  const confirmResetSettings = () => {
    Alert.alert(
      "Réinitialiser les paramètres",
      "Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Réinitialiser", 
          style: "destructive",
          onPress: () => {
            resetSettings();
            setHasReminderChanges(false);
          }
        }
      ]
    );
  };

  // Fonction pour gérer le retour avec confirmation si nécessaire
  const handleGoBack = () => {
    if (hasReminderChanges) {
      Alert.alert(
        "Modifications non enregistrées",
        "Vous avez des modifications de rappel non enregistrées. Voulez-vous les enregistrer avant de quitter ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Ignorer", onPress: () => navigation.goBack() },
          { text: "Enregistrer", onPress: async () => {
            await saveReminderSettings();
            navigation.goBack();
          }}
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleGoBack}
            >
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Préférences</Text>
            <View style={styles.headerSpacer} />
          </View>
          
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
              value={localReminderSettings.reminderEnabled}
              onValueChange={(value) => setLocalReminderSetting('reminderEnabled', value)}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor={localReminderSettings.reminderEnabled ? theme.switchThumbOn : theme.switchThumbOff}
            />
          </View>
          
          {localReminderSettings.reminderEnabled && (
            <View style={styles.timePickerContainer}>
              <TimeSelector
                time={localReminderSettings.reminderTime}
                onTimeChange={handleTimeChange}
                label="Heure de rappel"
              />
              
              <DaySelector
                selectedDays={localReminderSettings.reminderDays}
                onDaysChange={handleDaysChange}
                label="Jours de rappel"
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

        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: theme.warning }]}
          onPress={() => navigation.navigate('TestNewTechniques')}
        >
          <Text style={styles.contactButtonText}>Diagnostic des techniques</Text>
        </TouchableOpacity>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Réinitialiser</Text>
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: theme.error }]} 
            onPress={confirmResetSettings}
          >
            <Text style={[styles.resetButtonText, { color: theme.textLight }]}>Réinitialiser les paramètres</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoSection, { borderLeftColor: theme.divider }]}>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Les paramètres de sons, vibrations et mode sombre sont appliqués immédiatement. Pour les rappels, cliquez sur "Enregistrer" pour sauvegarder vos modifications.
          </Text>
        </View>
      </ScrollView>

      {/* Boutons d'action en bas de l'écran (uniquement pour les rappels) */}
      {hasReminderChanges && (
        <View style={[styles.actionButtonsContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: theme.border }]} 
            onPress={cancelReminderChanges}
            disabled={isSaving}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.primary }]} 
            onPress={saveReminderSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={theme.textLight} size="small" />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.textLight }]}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100, // Espace supplémentaire en bas pour la barre d'action
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerSpacer: {
    width: 24, // Même largeur que l'icône pour équilibrer
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
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
  timePickerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
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
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
  },
});

export default SettingsScreen;
