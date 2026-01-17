import { Platform } from "react-native";

import { getReminderScheduleIds, setReminderScheduleIds } from "./inventoryService";

let handlerConfigured = false;
let notificationsModule: typeof import("expo-notifications") | null = null;

async function getNotificationsModule() {
  if (Platform.OS === "web") return null;
  if (!notificationsModule) {
    const mod = await import("expo-notifications");
    notificationsModule = mod;
  }
  return notificationsModule;
}

export async function configureNotifications() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function ensureNotificationPermissions() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleDailyReminders(times: string[], body: string) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;
  const ok = await ensureNotificationPermissions();
  if (!ok) return null;

  const previousIds = await getReminderScheduleIds();
  if (previousIds.length > 0) {
    await Promise.all(
      previousIds.map((id) =>
        Notifications.cancelScheduledNotificationAsync(id)
      )
    );
  }

  const nextIds: string[] = [];
  for (const time of times) {
    const [hourStr, minuteStr] = time.split(":");
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      continue;
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️快沒了",
        body,
      },
      trigger: {
        type: "daily",
        hour,
        minute,
        channelId: "default",
      },
    });
    nextIds.push(id);
  }
  await setReminderScheduleIds(nextIds);
  return nextIds;
}

export async function sendLowStockNow(body: string) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;
  const ok = await ensureNotificationPermissions();
  if (!ok) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚠️快沒了",
      body,
    },
    trigger: null,
  });
  return true;
}
