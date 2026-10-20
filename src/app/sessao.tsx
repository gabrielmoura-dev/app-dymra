import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { getExercise } from '@/catalog';
import { confirmAction, notify } from '@/components/confirm';
import { RestTimerBar } from '@/components/RestTimerBar';
import { SessionExerciseCard } from '@/components/SessionExerciseCard';
import { Button, Empty, Row, Screen, Txt } from '@/components/ui';
import {
  addSet,
  deleteSession,
  finishSession,
  getActiveSessionId,
  getExerciseNote,
  getSessionDetail,
  removeSet,
  removeSessionExercise,
  setCompleted,
  setExerciseNote,
  updateSet,
  type SessionDetail,
  type SetRow,
} from '@/db/repo';
import { sessionMet, estimateKcal } from '@/logic/calories';
import { formatClock } from '@/logic/dates';
import type { Suggestion } from '@/logic/progression';
import type { Effort } from '@/logic/types';
import { readWorkoutStats, writeWorkout } from '@/services/health';
import { suggestionFor } from '@/state/planning';
import { useRequiredProfile } from '@/state/profile';
import { useRestTimer } from '@/state/restTimer';
import { colors, spacing } from '@/theme';

function Elapsed({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Txt bold color={colors.accent} style={{ fontVariant: ['tabular-nums'], paddingRight: 16 }}>
      {formatClock((now - new Date(since).getTime()) / 1000)}
    </Txt>
  );
}

/** Mantém a tela ligada durante o treino (ignora falhas, ex.: navegador sem suporte). */
function useScreenAwake() {
  useEffect(() => {
    const tag = 'dymra-treino';
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      try {
        Promise.resolve(deactivateKeepAwake(tag)).catch(() => {});
      } catch {
        // já estava desativado
      }
    };
  }, []);
}

export default function Sessao() {
  useScreenAwake();
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const startRest = useRestTimer((s) => s.start);
  const stopRest = useRestTimer((s) => s.stop);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [suggestions, setSuggestions] = useState<Record<number, Suggestion | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const reload = useCallback(async () => {
    const id = await getActiveSessionId(db);
    setSessionId(id);
    if (!id) {
      setDetail(null);
      setLoaded(true);
      return;
    }
    const d = await getSessionDetail(db, id);
    setDetail(d);
    setLoaded(true);
    if (d) {
      const sug: Record<number, Suggestion | null> = {};
      const nts: Record<string, string> = {};
      for (const { item, sets } of d.exercises) {
        sug[item.id] = await suggestionFor(
          db,
          {
            exercicioId: item.exercicio_id,
            series: sets.filter((s) => s.aquecimento === 0).length,
            repsMin: item.reps_min,
            repsMax: item.reps_max,
            descansoSeg: item.descanso_seg,
            duracaoSeg: item.duracao_seg ?? undefined,
          },
          id,
        );
        nts[item.exercicio_id] = await getExerciseNote(db, item.exercicio_id);
      }
      setSuggestions(sug);
      setNotes(nts);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Atualização otimista das séries (sem recarregar tudo a cada toque).
  const patchSetLocal = (setId: number, patch: Partial<SetRow>) =>
    setDetail((d) =>
      d
        ? {
            ...d,
            exercises: d.exercises.map((e) => ({
              ...e,
              sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
            })),
          }
        : d,
    );

  const onUpdateSet = async (
    setId: number,
    patch: { pesoKg?: number | null; reps?: number | null; duracaoSeg?: number | null; esforco?: Effort | null },
  ) => {
    const local: Partial<SetRow> = {};
    if ('pesoKg' in patch) local.peso_kg = patch.pesoKg ?? null;
    if ('reps' in patch) local.reps = patch.reps ?? null;
    if ('duracaoSeg' in patch) local.duracao_seg = patch.duracaoSeg ?? null;
    if ('esforco' in patch) local.esforco = patch.esforco ?? null;
    patchSetLocal(setId, local);
    await updateSet(db, setId, patch);

    // Peso/reps/tempo novos descem para as próximas séries ainda não feitas que tinham o mesmo valor
    // (aquecimento só passa para aquecimento, série de trabalho só para série de trabalho).
    const group = detail?.exercises.find((e) => e.sets.some((s) => s.id === setId));
    if (!group) return;
    const idx = group.sets.findIndex((s) => s.id === setId);
    const old = group.sets[idx];
    const fields: [keyof typeof patch, keyof SetRow][] = [
      ['pesoKg', 'peso_kg'],
      ['reps', 'reps'],
      ['duracaoSeg', 'duracao_seg'],
    ];
    for (const next of group.sets.slice(idx + 1)) {
      if (next.concluida === 1 || next.aquecimento !== old.aquecimento) continue;
      const nextPatch: typeof patch = {};
      const nextLocal: Partial<SetRow> = {};
      for (const [pk, col] of fields) {
        if (pk in patch && next[col] === old[col]) {
          (nextPatch as Record<string, unknown>)[pk] = patch[pk];
          (nextLocal as Record<string, unknown>)[col] = patch[pk] ?? null;
        }
      }
      if (Object.keys(nextPatch).length === 0) continue;
      patchSetLocal(next.id, nextLocal);
      await updateSet(db, next.id, nextPatch);
    }
  };

  const nextLabel = (seId: number, setId: number): string => {
    if (!detail) return '';
    const idx = detail.exercises.findIndex((e) => e.item.id === seId);
    const cur = detail.exercises[idx];
    const remaining = cur.sets.filter((s) => s.concluida === 0 && s.id !== setId).length;
    if (remaining > 0) return `${getExercise(cur.item.exercicio_id)?.nome ?? ''} (mais ${remaining})`;
    const next = detail.exercises.slice(idx + 1).find((e) => e.sets.some((s) => s.concluida === 0));
    return next ? (getExercise(next.item.exercicio_id)?.nome ?? '') : 'finalizar o treino';
  };

  const onToggleSet = async (seId: number, descanso: number, set: SetRow, done: boolean) => {
    patchSetLocal(set.id, { concluida: done ? 1 : 0, concluida_em: done ? new Date().toISOString() : null });
    await setCompleted(db, set.id, done);
    if (done) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const pausa = descanso || profile.descansoPadraoSeg;
      // Depois do aquecimento basta uma pausa curta.
      startRest(set.aquecimento === 1 ? Math.min(pausa, 60) : pausa, nextLabel(seId, set.id));
    }
  };

  const finalizar = async () => {
    if (!detail || !sessionId) return;
    const feitas = detail.exercises.flatMap((e) => e.sets).filter((s) => s.concluida === 1).length;
    if (feitas === 0) {
      const descartarAgora = await confirmAction({
        title: 'Nenhuma série marcada',
        message: 'Marque ao menos uma série com o ✓ ou descarte o treino.',
        confirmText: 'Descartar treino',
        cancelText: 'Voltar',
        destructive: true,
      });
      if (descartarAgora) await descartar();
      return;
    }
    const ok = await confirmAction({
      title: 'Finalizar treino?',
      message: 'Séries não marcadas não serão salvas.',
      confirmText: 'Finalizar',
      cancelText: 'Continuar treinando',
    });
    if (!ok) return;
    setFinalizando(true);
    try {
      await stopRest();
      const inicio = detail.session.iniciado_em;
      const fim = new Date().toISOString();
      const duracaoSeg = Math.round((Date.now() - new Date(inicio).getTime()) / 1000);
      let kcal: number | null = null;
      let fonte: 'relogio' | 'estimativa' | null = null;
      let fcMedia: number | null = null;
      let fcMax: number | null = null;
      if (profile.healthConnect) {
        const w = await readWorkoutStats(inicio, fim);
        if (w.kcal) {
          kcal = w.kcal;
          fonte = 'relogio';
        }
        fcMedia = w.fcMedia;
        fcMax = w.fcMax;
      }
      if (kcal == null) {
        const met = sessionMet(
          detail.exercises.map((e) => ({
            met: getExercise(e.item.exercicio_id)?.met ?? 3.5,
            series: e.sets.filter((s) => s.concluida === 1).length,
          })),
        );
        kcal = estimateKcal(met, detail.session.peso_corporal_kg ?? profile.pesoKg, duracaoSeg);
        fonte = 'estimativa';
      }
      await finishSession(db, sessionId, { duracaoSeg, kcal, kcalFonte: fonte, fcMedia, fcMax });
      if (profile.healthConnect) writeWorkout(inicio, fim, `Dymra · ${detail.session.nome}`);
      router.replace(`/resumo/${sessionId}`);
    } catch (e) {
      setFinalizando(false);
      notify('Erro ao finalizar', String(e));
    }
  };

  async function descartar() {
    if (!sessionId) return;
    await stopRest();
    await deleteSession(db, sessionId);
    router.replace('/');
  }

  const confirmarDescarte = async () => {
    const ok = await confirmAction({
      title: 'Descartar treino?',
      message: 'Tudo o que foi marcado neste treino será apagado.',
      confirmText: 'Descartar',
      destructive: true,
    });
    if (ok) await descartar();
  };

  if (!loaded) return <Screen>{null}</Screen>;

  if (!detail || !sessionId) {
    return (
      <Screen edges={[]}>
        <Empty icon="barbell-outline" title="Nenhum treino aberto" text="Comece um treino pela tela Hoje ou por uma ficha." />
        <Button title="Voltar" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const total = detail.exercises.reduce((a, e) => a + e.sets.length, 0);
  const feitas = detail.exercises.reduce((a, e) => a + e.sets.filter((s) => s.concluida === 1).length, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: detail.session.nome,
          headerRight: () => <Elapsed since={detail.session.iniciado_em} />,
        }}
      />
      <RestTimerBar />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Txt variant="small" color={colors.muted}>
          {feitas} de {total} séries feitas · toque no ✓ ao terminar cada série
        </Txt>
        {detail.exercises.map(({ item, sets }) => (
          <SessionExerciseCard
            key={item.id}
            item={item}
            sets={sets}
            suggestion={suggestions[item.id] ?? null}
            note={notes[item.exercicio_id] ?? ''}
            onUpdateSet={onUpdateSet}
            onToggleSet={(s, done) => onToggleSet(item.id, item.descanso_seg, s, done)}
            onAddSet={async () => {
              await addSet(db, item.id);
              reload();
            }}
            onRemoveSet={async (id) => {
              await removeSet(db, id);
              reload();
            }}
            onRemoveExercise={async () => {
              await removeSessionExercise(db, item.id);
              reload();
            }}
            onSaveNote={async (nota) => {
              await setExerciseNote(db, item.exercicio_id, nota);
              setNotes((n) => ({ ...n, [item.exercicio_id]: nota }));
            }}
          />
        ))}
        <Button
          variant="secondary"
          icon="add-circle-outline"
          title="Adicionar exercício"
          onPress={() => router.push({ pathname: '/adicionar', params: { sessionId: String(sessionId) } })}
        />
        <Row>
          <Button variant="ghost" title="Descartar" onPress={confirmarDescarte} style={{ flex: 1 }} />
          <Button title="Finalizar treino" icon="flag" onPress={finalizar} loading={finalizando} style={{ flex: 2 }} />
        </Row>
        <View />
      </ScrollView>
    </SafeAreaView>
  );
}
