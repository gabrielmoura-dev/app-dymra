import { Image } from 'expo-image';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { EXERCISES, getExercise, getMachine, MUSCLE_LABELS } from '@/catalog';
import type { Muscle } from '@/catalog/types';
import { LineChart } from '@/components/LineChart';
import { MuscleMap } from '@/components/MuscleMap';
import { TechniqueFull } from '@/components/TechniqueChecklist';
import { Card, Chip, Empty, Icon, Row, Screen, Stat, Txt } from '@/components/ui';
import { VideoPlayer } from '@/components/VideoPlayer';
import { getExerciseHistory, getExerciseNote } from '@/db/repo';
import { findAlternatives } from '@/logic/alternatives';
import { formatDateShort } from '@/logic/dates';
import { describeSets } from '@/logic/progression';
import { bestE1RM, formatKg, maxDuration, maxReps, maxWeight, personalBests } from '@/logic/strength';
import type { ExerciseHistoryEntry } from '@/logic/types';
import { colors, radius } from '@/theme';

type Metric = 'carga' | 'e1rm' | 'reps' | 'tempo';

export default function ExercicioDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const ex = getExercise(id);
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [note, setNote] = useState('');
  const [metric, setMetric] = useState<Metric>(ex?.tipo === 'tempo' ? 'tempo' : ex?.tipo === 'peso-corporal' ? 'reps' : 'carga');

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getExerciseHistory(db, id, 60).then(setHistory);
      getExerciseNote(db, id).then(setNote);
    }, [db, id]),
  );

  if (!ex) return <Screen edges={[]}><Empty icon="help" title="Exercício não encontrado" /></Screen>;

  const machine = getMachine(ex.maquinaIds[0]);
  const values: Partial<Record<Muscle, number>> = {};
  ex.secundarios.forEach((m) => (values[m] = 0.45));
  ex.primarios.forEach((m) => (values[m] = 1));
  const alts = findAlternatives(ex, EXERCISES, ex.maquinaIds[0], 4);
  const pb = personalBests(history);
  const chronological = [...history].reverse();
  const points = chronological
    .map((h) => ({
      data: h.data,
      valor:
        metric === 'carga'
          ? maxWeight(h.sets)
          : metric === 'e1rm'
            ? bestE1RM(h.sets)
            : metric === 'reps'
              ? maxReps(h.sets)
              : maxDuration(h.sets),
    }))
    .filter((p) => p.valor > 0);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: ex.nome }} />
      <VideoPlayer video={ex.video} />

      <Row style={{ alignItems: 'flex-start' }} gap={12}>
        {machine?.foto ? (
          <Image source={machine.foto} style={{ width: 88, height: 88, borderRadius: radius.md }} contentFit="cover" />
        ) : null}
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="label">Onde fazer</Txt>
          <Row wrap gap={6}>
            {ex.maquinaIds.map((m) => (
              <Chip key={m} icon="barbell-outline" label={getMachine(m)?.nome ?? m} onPress={() => router.push(`/maquina/${m}`)} />
            ))}
          </Row>
        </View>
      </Row>

      {note ? (
        <Card>
          <Txt variant="label">Sua nota</Txt>
          <Txt>📝 {note}</Txt>
        </Card>
      ) : null}

      <Card>
        <Txt variant="label">Músculos</Txt>
        <Txt>
          <Txt bold color={colors.accent}>
            {ex.primarios.map((m) => MUSCLE_LABELS[m]).join(', ') || 'Condicionamento'}
          </Txt>
          {ex.secundarios.length ? (
            <Txt color={colors.muted}> · ajuda: {ex.secundarios.map((m) => MUSCLE_LABELS[m]).join(', ')}</Txt>
          ) : null}
        </Txt>
        <MuscleMap values={values} mode="intensidade" height={200} />
      </Card>

      <Card>
        <Txt variant="h3">Como fazer certo</Txt>
        <TechniqueFull t={ex.tecnica} />
      </Card>

      <Card>
        <Txt variant="h3">Seu progresso</Txt>
        {history.length === 0 ? (
          <Txt color={colors.muted}>Você ainda não fez este exercício.</Txt>
        ) : (
          <>
            <Row gap={16}>
              {ex.tipo === 'tempo' ? (
                <Stat label="maior tempo" value={String(pb.duracaoMax)} unit="s" />
              ) : ex.tipo === 'peso-corporal' ? (
                <Stat label="mais repetições" value={String(pb.repsMax)} />
              ) : (
                <>
                  <Stat label={ex.assistido ? 'maior assistência' : 'maior carga'} value={formatKg(pb.pesoMax)} unit="kg" color={colors.accent} />
                  <Stat label="1RM estimado" value={formatKg(Math.round(pb.e1rm))} unit="kg" />
                  <Stat label="vezes feito" value={String(history.length)} />
                </>
              )}
            </Row>
            {ex.tipo === 'carga' ? (
              <Row gap={6}>
                <Chip label="Carga" active={metric === 'carga'} onPress={() => setMetric('carga')} />
                <Chip label="1RM estimado" active={metric === 'e1rm'} onPress={() => setMetric('e1rm')} />
                <Chip label="Repetições" active={metric === 'reps'} onPress={() => setMetric('reps')} />
              </Row>
            ) : null}
            <LineChart points={points} unit={metric === 'tempo' ? 's' : metric === 'reps' ? 'reps' : 'kg'} />
            {history.slice(0, 5).map((h) => (
              <Row key={h.sessionId} style={{ justifyContent: 'space-between' }}>
                <Txt variant="small" color={colors.muted}>
                  {formatDateShort(h.data)}
                </Txt>
                <Txt variant="small">{describeSets(h.sets, ex.tipo)}</Txt>
              </Row>
            ))}
          </>
        )}
      </Card>

      {alts.length > 0 ? (
        <Card>
          <Txt variant="h3">Se a máquina estiver ocupada</Txt>
          {alts.map((a) => (
            <Pressable
              key={`${a.exercise.id}-${a.machineId}`}
              disabled={a.exercise.id === ex.id}
              onPress={() => router.push(`/exercicio/${a.exercise.id}`)}>
              <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
                <View style={{ flex: 1 }}>
                  <Txt bold>
                    {a.exercise.id === ex.id ? `Mesmo exercício: ${getMachine(a.machineId)?.nome}` : a.exercise.nome}
                  </Txt>
                  <Txt variant="tiny">{a.motivo}</Txt>
                </View>
                {a.exercise.id !== ex.id ? <Icon name="chevron-forward" color={colors.muted} size={18} /> : null}
              </Row>
            </Pressable>
          ))}
          <Txt variant="tiny">Durante o treino, toque em “Máquina ocupada” para trocar.</Txt>
        </Card>
      ) : null}
    </Screen>
  );
}
