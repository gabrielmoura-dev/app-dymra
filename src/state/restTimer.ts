import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

import { cancelNotification, scheduleRestEnd } from '@/services/notifications';

interface RestTimerState {
  endsAt: number | null;
  total: number;
  notificationId: string | null;
  proximo: string;
  start: (seconds: number, proximo: string) => Promise<void>;
  add: (seconds: number) => Promise<void>;
  stop: () => Promise<void>;
  /** Chamado quando o contador chega a zero com o app aberto. */
  finish: () => Promise<void>;
}

export const useRestTimer = create<RestTimerState>((set, get) => ({
  endsAt: null,
  total: 0,
  notificationId: null,
  proximo: '',
  start: async (seconds, proximo) => {
    await cancelNotification(get().notificationId);
    set({ endsAt: Date.now() + seconds * 1000, total: seconds, proximo, notificationId: null });
    const id = await scheduleRestEnd(seconds, proximo);
    // Se o timer foi parado enquanto agendava, cancela.
    if (get().endsAt == null) await cancelNotification(id);
    else set({ notificationId: id });
  },
  add: async (seconds) => {
    const { endsAt, total, proximo, notificationId } = get();
    if (endsAt == null) return;
    const novoFim = Math.max(Date.now() + 1000, endsAt + seconds * 1000);
    await cancelNotification(notificationId);
    set({ endsAt: novoFim, total: Math.max(1, total + seconds), notificationId: null });
    const id = await scheduleRestEnd((novoFim - Date.now()) / 1000, proximo);
    set({ notificationId: id });
  },
  stop: async () => {
    await cancelNotification(get().notificationId);
    set({ endsAt: null, notificationId: null });
  },
  finish: async () => {
    // A notificação agendada também dispara; aqui só vibra se o app estiver aberto.
    set({ endsAt: null, notificationId: null });
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // sem vibração disponível
    }
  },
}));
