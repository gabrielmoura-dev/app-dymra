/* eslint-disable import/namespace -- AndroidImportance é um enum reexportado que o plugin não enxerga */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_REST = 'descanso';
const CHANNEL_REMINDERS = 'lembretes';
const WATER_HOURS = [9, 11, 13, 15, 17, 19];

let configured = false;

export async function configureNotifications() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_REST, {
      name: 'Fim do descanso',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#B8FF3C',
    });
    await Notifications.setNotificationChannelAsync(CHANNEL_REMINDERS, {
      name: 'Lembretes de treino e água',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    await configureNotifications();
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.status === 'granted';
  } catch {
    return false;
  }
}

/** Agenda o aviso de fim de descanso (funciona com a tela bloqueada). */
export async function scheduleRestEnd(seconds: number, proximo: string): Promise<string | null> {
  try {
    if (!(await ensureNotificationPermission())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Descanso acabou 💪',
        body: `Bora para a próxima série: ${proximo}`,
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_REST } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_REST } : {}),
      },
    });
  } catch {
    return null;
  }
}

export async function cancelNotification(id: string | null) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // já disparou ou não existe
  }
}

async function cancelByPrefix(prefix: string) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all.filter((n) => n.identifier.startsWith(prefix)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Reagenda os lembretes conforme o perfil.
 * dias: 0 = domingo ... 6 = sábado (como Date.getDay()).
 */
export async function syncReminders(opts: { agua: boolean; treinoDias: number[]; treinoHora: number }): Promise<boolean> {
  try {
    if ((opts.agua || opts.treinoDias.length > 0) && !(await ensureNotificationPermission())) return false;
    await cancelByPrefix('agua-');
    await cancelByPrefix('treino-');
    const channel = Platform.OS === 'android' ? { channelId: CHANNEL_REMINDERS } : {};
    if (opts.agua) {
      for (const hour of WATER_HOURS) {
        await Notifications.scheduleNotificationAsync({
          identifier: `agua-${hour}`,
          content: { title: 'Hora da água 💧', body: 'Um copo agora ajuda a bater a meta do dia.', ...channel },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, ...channel },
        });
      }
    }
    for (const d of opts.treinoDias) {
      await Notifications.scheduleNotificationAsync({
        identifier: `treino-${d}`,
        content: { title: 'Dia de treino no Dymra 🏋️', body: 'Seu treino de hoje está te esperando.', ...channel },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: d + 1, // Expo: 1 = domingo
          hour: opts.treinoHora,
          minute: 0,
          ...channel,
        },
      });
    }
    return true;
  } catch {
    return false;
  }
}
