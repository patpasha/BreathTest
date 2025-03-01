import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

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

// Identifiant pour la notification quotidienne
const DAILY_REMINDER_ID = 'daily-reminder';

export async function scheduleReminderNotification(time: string = '20:00') {
  try {
    // Annule tous les rappels précédents
    await cancelAllScheduledNotifications();
    
    // Valeur par défaut si time est undefined ou mal formaté
    const timeToUse = time && time.includes(':') ? time : '20:00';
    
    // Extrait les heures et les minutes du format 'HH:MM'
    const [hours, minutes] = timeToUse.split(':').map(Number);
    
    // Utilise des valeurs par défaut si les valeurs extraites sont NaN
    const validHours = isNaN(hours) ? 20 : hours;
    const validMinutes = isNaN(minutes) ? 0 : minutes;
    
    // Vérifie si l'heure est déjà passée aujourd'hui
    const now = new Date();
    const today = new Date();
    today.setHours(validHours, validMinutes, 0, 0);
    
    // Définit la date pour demain si l'heure est déjà passée aujourd'hui
    let scheduledDate = new Date();
    if (today < now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    } else {
      scheduledDate.setDate(scheduledDate.getDate());
    }
    scheduledDate.setHours(validHours, validMinutes, 0, 0);
    
    // Programme une notification pour la prochaine occurrence (aujourd'hui ou demain)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Rappel de respiration",
        body: "N'oubliez pas votre session de respiration quotidienne !",
        sound: true,
      },
      trigger: {
        channelId: Platform.OS === 'android' ? 'breathflow-channel' : undefined,
        date: scheduledDate,
        type: SchedulableTriggerInputTypes.DATE
      },
      identifier: 'next-reminder',
    });
    
    // Programme également une notification avec date précise pour après-demain
    const dayAfterTomorrow = new Date(scheduledDate);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Rappel de respiration",
        body: "N'oubliez pas votre session de respiration quotidienne !",
        sound: true,
      },
      trigger: {
        channelId: Platform.OS === 'android' ? 'breathflow-channel' : undefined,
        date: dayAfterTomorrow,
        type: SchedulableTriggerInputTypes.DATE
      },
      identifier: 'day-after-tomorrow-reminder',
    });
    
    // Programme également une notification avec date précise pour dans 3 jours
    const threeDaysLater = new Date(scheduledDate);
    threeDaysLater.setDate(threeDaysLater.getDate() + 2);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Rappel de respiration",
        body: "N'oubliez pas votre session de respiration quotidienne !",
        sound: true,
      },
      trigger: {
        channelId: Platform.OS === 'android' ? 'breathflow-channel' : undefined,
        date: threeDaysLater,
        type: SchedulableTriggerInputTypes.DATE
      },
      identifier: 'three-days-later-reminder',
    });
    
    // Programme également une notification récurrente quotidienne (comme backup)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Rappel de respiration",
        body: "N'oubliez pas votre session de respiration quotidienne !",
        sound: true,
      },
      trigger: {
        channelId: Platform.OS === 'android' ? 'breathflow-channel' : undefined,
        hour: validHours,
        minute: validMinutes,
        type: SchedulableTriggerInputTypes.DAILY
      },
      identifier: DAILY_REMINDER_ID,
    });
    
    console.log(`Prochaine notification programmée pour: ${scheduledDate.toLocaleString()}`);
    console.log(`Notification quotidienne programmée pour ${validHours}:${validMinutes.toString().padStart(2, '0')} tous les jours`);
    
    // Affiche les notifications programmées pour débogage
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Nombre de notifications programmées: ${scheduledNotifications.length}`);
    scheduledNotifications.forEach((notification, index) => {
      console.log(`Notification ${index + 1}:`, notification.identifier, notification.trigger);
    });
  } catch (error) {
    console.error('Erreur lors de la programmation de la notification:', error);
  }
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Fonction pour envoyer une notification de test immédiate
export async function sendTestNotification() {
  try {
    const permissionGranted = await registerForPushNotificationsAsync();
    
    if (!permissionGranted) {
      console.log('Impossible d\'envoyer une notification de test: permissions non accordées');
      return false;
    }
    
    // Envoie une notification immédiate
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test de notification",
        body: "Ceci est une notification de test pour vérifier que les notifications fonctionnent correctement.",
        sound: true,
      },
      trigger: null, // null = notification immédiate
    });
    
    console.log('Notification de test envoyée');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de test:', error);
    return false;
  }
}
