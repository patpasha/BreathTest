import React from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../theme/ThemeContext';

const SettingsScreen = () => {
  const { settings, setSetting, resetSettings } = useSettings();
  const theme = useTheme();

  const sessionDurations = [3, 5, 10, 15, 20];

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
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Durée de session</Text>
          <View style={styles.durationContainer}>
            {sessionDurations.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  settings.sessionDuration === duration && { backgroundColor: theme.primary },
                ]}
                onPress={() => setSetting('sessionDuration', duration)}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    { color: theme.textSecondary },
                    settings.sessionDuration === duration && { color: theme.textLight },
                  ]}
                >
                  {duration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  durationButton: {
    width: '18%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
