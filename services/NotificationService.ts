import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure les notifications pour qu'elles s'affichent lorsque l'application est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Initialise les notifications au démarrage de l'application
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

// Identifiant unique pour les notifications de rappel
const REMINDER_NOTIFICATION_ID = 'breath-reminder';

// Enum pour les types de triggers
enum SchedulableTriggerInputTypes {
  WEEKLY = 'weekly'
}

export async function registerForPushNotificationsAsync() {
  try {
    // Demande les permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permission for notifications not granted!');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function scheduleReminderNotification(time: string = '20:00', days: number[] = [0, 1, 2, 3, 4, 5, 6]) {
  try {
    // Annule tous les rappels précédents
    await cancelAllScheduledNotifications();
    
    // Si aucun jour n'est sélectionné, ne pas programmer de notifications
    if (days.length === 0) {
      console.log('Aucun jour sélectionné pour les rappels, pas de notification programmée');
      return false;
    }
    
    // Extraire les heures et minutes du format "HH:MM"
    const [hours, minutes] = time.split(':').map(Number);
    
    // Programmer une notification récurrente pour chaque jour sélectionné
    for (const day of days) {
      const identifier = `${REMINDER_NOTIFICATION_ID}-${day}`;
      
      // Note: Weekdays are specified with a number from 1 through 7, with 1 indicating Sunday
      // Convertir notre format (0 = dimanche) au format d'Expo (1 = dimanche)
      const weekday = day === 0 ? 1 : day + 1;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rappel de respiration",
          body: "C'est l'heure de votre exercice de respiration quotidien",
          sound: true,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          weekday: weekday,
          type: SchedulableTriggerInputTypes.WEEKLY
        },
        identifier: identifier,
      });
    }
    
    console.log(`Notifications récurrentes programmées pour ${time} les jours: ${days.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la programmation de la notification:', error);
    return false;
  }
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Identifiant unique pour les notifications de test
const TEST_NOTIFICATION_ID = 'test-notification';

// Fonction pour envoyer une notification de test immédiate
export async function sendTestNotification() {
  try {
    const permissionGranted = await registerForPushNotificationsAsync();
    
    if (!permissionGranted) {
      console.log('Impossible d\'envoyer une notification de test: permissions non accordées');
      return false;
    }
    
    // Vérifier si une notification de test existe déjà
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const hasExistingTest = existingNotifications.some(
      notification => notification.identifier === TEST_NOTIFICATION_ID
    );
    
    // Si une notification de test existe déjà, l'annuler
    if (hasExistingTest) {
      await Notifications.cancelScheduledNotificationAsync(TEST_NOTIFICATION_ID);
    }
    
    // Envoie une notification immédiate avec un identifiant unique
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test de notification",
        body: "Ceci est une notification de test pour vérifier que les notifications fonctionnent correctement.",
        sound: true,
      },
      trigger: null, // null = notification immédiate
      identifier: TEST_NOTIFICATION_ID,
    });
    
    console.log('Notification de test envoyée');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de test:', error);
    return false;
  }
}
