import * as Haptics from 'expo-haptics';
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';

import { notify } from '@/components/confirm';
import { cancelNotification, scheduleRestEnd } from '@/services/notifications';

let avisouSemNotificacao = false;

const CHAVE = 'rest_timer_v1';

type Salvo = Pick<RestTimerState, 'endsAt' | 'total' | 'notificationId' | 'proximo'>;

/** Recupera o descanso em andamento se o app foi fechado e reaberto antes dele acabar. */
function carregar(): Salvo {
  const vazio: Salvo = { endsAt: null, total: 0, notificationId: null, proximo: '' };
  try {
    const raw = Storage.getItemSync(CHAVE);
    if (!raw) return vazio;
    const s = JSON.parse(raw) as Salvo;
    return typeof s.endsAt === 'number' && s.endsAt > Date.now() ? s : vazio;
  } catch {
    return vazio;
  }
}

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
  ...carregar(),
  start: async (seconds, proximo) => {
    await cancelNotification(get().notificationId);
    set({ endsAt: Date.now() + seconds * 1000, total: seconds, proximo, notificationId: null });
    const id = await scheduleRestEnd(seconds, proximo);
    if (id == null && !avisouSemNotificacao) {
      avisouSemNotificacao = true;
      notify(
        'Sem aviso fora do app',
        'As notificações estão desligadas. O descanso só avisa com o app aberto. Ative em Configurações do Android → Apps → Dymra → Notificações.',
      );
    }
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

// Guarda o descanso a cada mudança, para a barra voltar depois de fechar o app.
useRestTimer.subscribe((s) => {
  try {
    if (s.endsAt == null) Storage.removeItemSync(CHAVE);
    else Storage.setItemSync(CHAVE, JSON.stringify({ endsAt: s.endsAt, total: s.total, notificationId: s.notificationId, proximo: s.proximo }));
  } catch {
    // sem armazenamento: o descanso continua funcionando na memória
  }
});
