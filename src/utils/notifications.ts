import { Platform } from 'react-native';

type TimeoutHandle = ReturnType<typeof setTimeout>;

const webNotificationTimers = new Map<string, TimeoutHandle>();

export const notificationsSupported =
  Platform.OS !== 'web' ||
  (typeof window !== 'undefined' && 'Notification' in window);

function getNotifications() {
  return require('expo-notifications') as typeof import('expo-notifications');
}

if (Platform.OS !== 'web') {
  const Notifications = getNotifications();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (Platform.OS === 'web') {
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  const Notifications = getNotifications();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyLogReminder(hour = 20, minute = 0): Promise<void> {
  if (!notificationsSupported) return;
  if (Platform.OS === 'web') {
    const existing = webNotificationTimers.get('daily-log');
    if (existing) clearTimeout(existing);

    const scheduleNext = () => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const next = new Date();
      next.setHours(hour, minute, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      const timer = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Protocol', { body: "Don't forget to log today's metrics." });
        }
        scheduleNext();
      }, next.getTime() - now.getTime());

      webNotificationTimers.set('daily-log', timer);
    };

    scheduleNext();
    return;
  }
  const Notifications = getNotifications();
  await Notifications.cancelScheduledNotificationAsync('daily-log').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-log',
    content: {
      title: 'Protocol',
      body: "Don't forget to log today's metrics.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleDoseReminder(
  protocolId: number,
  protocolName: string,
  doseDate: Date,
  reminderHoursBefore = 2
): Promise<void> {
  if (!notificationsSupported) return;
  if (Platform.OS === 'web') return;
  const Notifications = getNotifications();
  const id = `dose-${protocolId}-${doseDate.toISOString().split('T')[0]}`;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const triggerDate = new Date(doseDate);
  triggerDate.setHours(triggerDate.getHours() - reminderHoursBefore);

  if (triggerDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: 'Upcoming Dose',
      body: `${protocolName} due in ${reminderHoursBefore} hours.`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function scheduleMissedDoseAlert(
  protocolId: number,
  protocolName: string,
  doseDate: Date
): Promise<void> {
  if (!notificationsSupported) return;
  if (Platform.OS === 'web') return;
  const Notifications = getNotifications();
  const id = `missed-${protocolId}-${doseDate.toISOString().split('T')[0]}`;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const triggerDate = new Date(doseDate);
  triggerDate.setHours(21, 0, 0, 0);

  if (triggerDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: 'Missed Dose?',
      body: `Did you take your ${protocolName} today?`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  if (!notificationsSupported) return;
  if (Platform.OS === 'web') {
    webNotificationTimers.forEach((timer) => clearTimeout(timer));
    webNotificationTimers.clear();
    return;
  }
  const Notifications = getNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
}
