import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator, FlatList } from 'react-native';
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

// Interface pour le contexte global de l'application
interface AppContext {
  showDevTools: boolean;
  setShowDevTools: (show: boolean) => void;
}

// Contexte global pour l'application
export const AppContext = React.createContext<AppContext>({
  showDevTools: false,
  setShowDevTools: () => {},
});

const SettingsScreen = () => {
  const { settings, setSetting, resetSettings } = useSettings();
  const theme = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { showDevTools, setShowDevTools } = React.useContext(AppContext);

  // État local pour suivre les modifications non enregistrées (uniquement pour les rappels)
  const [localReminderSettings, setLocalReminderSettings] = useState({
    reminderEnabled: settings.reminderEnabled,
    reminderTimes: [...settings.reminderTimes],
    reminderDays: [...settings.reminderDays]
  });
  const [hasReminderChanges, setHasReminderChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // État pour le compteur de taps pour activer le mode développeur
  const [devTapCount, setDevTapCount] = useState(0);
  const devTapTimeout = useRef<NodeJS.Timeout | null>(null);

  // Référence pour suivre si c'est le premier rendu
  const isFirstRender = useRef(true);
  
  // Référence pour suivre si une notification est en cours de programmation
  const isSchedulingNotification = useRef(false);
  
  // Référence pour suivre les derniers paramètres de notification
  const lastNotificationSettings = useRef({
    enabled: settings.reminderEnabled,
    times: [...settings.reminderTimes],
    days: [...settings.reminderDays]
  });

  // Mettre à jour les paramètres locaux de rappel lorsque les paramètres globaux changent
  useEffect(() => {
    setLocalReminderSettings({
      reminderEnabled: settings.reminderEnabled,
      reminderTimes: [...settings.reminderTimes],
      reminderDays: [...settings.reminderDays]
    });
  }, [settings.reminderEnabled, settings.reminderTimes, settings.reminderDays]);

  // Vérifier s'il y a des modifications non enregistrées pour les rappels
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const reminderSettingsChanged = 
      localReminderSettings.reminderEnabled !== settings.reminderEnabled ||
      JSON.stringify(localReminderSettings.reminderTimes) !== JSON.stringify(settings.reminderTimes) ||
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
            times: [...settings.reminderTimes],
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
          JSON.stringify(lastNotificationSettings.current.times) !== JSON.stringify(settings.reminderTimes) ||
          JSON.stringify(lastNotificationSettings.current.days) !== JSON.stringify(settings.reminderDays);
        
        if (!settingsChanged) {
          return;
        }
        
        // Mettre à jour les derniers paramètres
        lastNotificationSettings.current = {
          enabled: settings.reminderEnabled,
          times: [...settings.reminderTimes],
          days: [...settings.reminderDays]
        };
        
        isSchedulingNotification.current = true;
        
        if (settings.reminderEnabled) {
          // Demande les permissions pour les notifications
          const permissionGranted = await registerForPushNotificationsAsync();
          
          if (permissionGranted) {
            // Programme le rappel quotidien avec les jours sélectionnés
            await scheduleReminderNotification(settings.reminderTimes, settings.reminderDays);
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
  }, [settings.reminderEnabled, settings.reminderTimes, settings.reminderDays]);
  
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
      setSetting('reminderTimes', localReminderSettings.reminderTimes);
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
      reminderTimes: [...settings.reminderTimes],
      reminderDays: [...settings.reminderDays]
    });
    setHasReminderChanges(false);
  };
  
  // Gère le changement d'heure de rappel
  const handleTimeChange = (index: number, time: string) => {
    const newTimes = [...localReminderSettings.reminderTimes];
    newTimes[index] = time;
    setLocalReminderSetting('reminderTimes', newTimes);
  };
  
  // Ajoute une nouvelle heure de rappel
  const addReminderTime = () => {
    // Ajouter une nouvelle heure par défaut (20:00)
    const newTimes = [...localReminderSettings.reminderTimes, '20:00'];
    setLocalReminderSetting('reminderTimes', newTimes);
  };
  
  // Supprime une heure de rappel
  const removeReminderTime = (index: number) => {
    // Ne pas supprimer la dernière heure
    if (localReminderSettings.reminderTimes.length <= 1) {
      Alert.alert(
        "Impossible de supprimer",
        "Vous devez avoir au moins une heure de rappel.",
        [{ text: "OK" }]
      );
      return;
    }
    
    const newTimes = [...localReminderSettings.reminderTimes];
    newTimes.splice(index, 1);
    setLocalReminderSetting('reminderTimes', newTimes);
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

  // Fonction pour gérer les taps sur le titre et activer le mode développeur
  const handleTitlePress = () => {
    // Incrémenter le compteur de taps
    setDevTapCount(prevCount => prevCount + 1);
    
    // Réinitialiser le compteur après 2 secondes d'inactivité
    if (devTapTimeout.current) {
      clearTimeout(devTapTimeout.current);
    }
    
    devTapTimeout.current = setTimeout(() => {
      // Si l'utilisateur a tapé 7 fois, activer le mode développeur
      if (devTapCount >= 6) {
        setShowDevTools(true);
        Alert.alert(
          'Mode développeur activé',
          'Vous avez activé le mode développeur.',
          [{ text: 'OK' }]
        );
      }
      setDevTapCount(0);
    }, 1500);
  };
  
  // Nettoyer le timeout lors du démontage du composant
  useEffect(() => {
    return () => {
      if (devTapTimeout.current) {
        clearTimeout(devTapTimeout.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleTitlePress}
          style={styles.titleContainer}
        >
          <Text style={[styles.title, { color: theme.textPrimary }]}>Paramètres</Text>
          {devTapCount > 0 && devTapCount < 7 && (
            <Text style={[styles.devHint, { color: theme.textTertiary }]}>
              {7 - devTapCount} taps pour le mode développeur
            </Text>
          )}
        </TouchableOpacity>
        
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleGoBack}
            >
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]} onPress={handleTitlePress}>Préférences</Text>
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
              <Text style={[styles.reminderSectionTitle, { color: theme.textPrimary }]}>Heures de rappel</Text>
              
              {localReminderSettings.reminderTimes.map((time, index) => (
                <View key={`time-${index}`} style={[styles.reminderCard, { backgroundColor: theme.cardBackground }]}>
                  <View style={styles.reminderCardHeader}>
                    <Text style={[styles.reminderCardTitle, { color: theme.textPrimary }]}>
                      Rappel {index + 1}
                    </Text>
                    <TouchableOpacity
                      style={[styles.reminderCardAction, { opacity: localReminderSettings.reminderTimes.length > 1 ? 1 : 0.5 }]}
                      onPress={() => removeReminderTime(index)}
                      disabled={localReminderSettings.reminderTimes.length <= 1}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={18} 
                        color={localReminderSettings.reminderTimes.length > 1 ? theme.error : theme.textTertiary} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <TimeSelector
                    time={time}
                    onTimeChange={(newTime) => handleTimeChange(index, newTime)}
                    label=""
                  />
                </View>
              ))}
              
              <TouchableOpacity
                style={[styles.addReminderButton, { borderColor: theme.primary, borderStyle: 'dashed' }]}
                onPress={addReminderTime}
              >
                <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                <Text style={[styles.addReminderText, { color: theme.primary }]}>Ajouter un rappel</Text>
              </TouchableOpacity>
              
              <View style={styles.reminderSeparator} />
              
              <DaySelector
                selectedDays={localReminderSettings.reminderDays}
                onDaysChange={handleDaysChange}
                label="Jours de rappel"
              />
              
              <View style={styles.reminderButtonsContainer}>
                {hasReminderChanges && (
                  <>
                    <TouchableOpacity
                      style={[styles.reminderButton, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                      onPress={cancelReminderChanges}
                      disabled={isSaving}
                    >
                      <Text style={[styles.reminderButtonText, { color: theme.textPrimary }]}>Annuler</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.reminderButton, { backgroundColor: theme.primary }]}
                      onPress={saveReminderSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={[styles.reminderButtonText, { color: 'white' }]}>Enregistrer</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('ContactDeveloper')}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>Contacter le développeur</Text>
        </TouchableOpacity>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>À propos</Text>
          <Text style={[styles.version, { color: theme.textSecondary }]}>Version 1.2.0</Text>
          <Text style={[styles.copyright, { color: theme.textTertiary }]}>© 2023 BreathFlow</Text>
        </View>

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
    paddingVertical: 10,
  },
  reminderSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  reminderCard: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  reminderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  reminderCardTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  reminderCardAction: {
    padding: 5,
  },
  addReminderButton: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addReminderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  reminderSeparator: {
    height: 1,
    marginVertical: 10,
  },
  reminderButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  reminderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  reminderButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
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
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  devHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
  },
});

export default SettingsScreen;
