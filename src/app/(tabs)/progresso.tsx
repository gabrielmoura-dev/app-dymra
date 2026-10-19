import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { getExercise, MUSCLE_LABELS } from '@/catalog';
import type { Muscle } from '@/catalog/types';
import { LineChart } from '@/components/LineChart';
import { MuscleMap, RecoveryLegend } from '@/components/MuscleMap';
import { Card, Chip, Empty, Icon, ProgressBar, Row, Screen, Stat, Txt } from '@/components/ui';
import {
  getCompletedSetsSince,
  getExerciseHistory,
  listBodyMeasures,
  listCompletedSessions,
  listTrainedExerciseIds,
  type BodyMeasure,
  type SessionListItem,
} from '@/db/repo';
import { daysAgo, formatDateLong, formatDuration } from '@/logic/dates';
import { muscleRecovery, weeklyVolume } from '@/logic/recovery';
import { formatKg, personalBests, type PersonalBests } from '@/logic/strength';
import { colors, spacing } from '@/theme';

type Aba = 'visao' | 'recordes' | 'historico';

export default function Progresso() {
  const db = useSQLiteContext();
  const [aba, setAba] = useState<Aba>('visao');
  const [recovery, setRecovery] = useState<Record<Muscle, number> | null>(null);
  const [volume, setVolume] = useState<Record<Muscle, number> | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [bests, setBests] = useState<{ id: string; pb: PersonalBests; vezes: number }[]>([]);
  const [measures, setMeasures] = useState<BodyMeasure[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const sets = await getCompletedSetsSince(db, daysAgo(7).toISOString());
        setRecovery(muscleRecovery(sets, getExercise));
        setVolume(weeklyVolume(sets, getExercise));
        setSessions(await listCompletedSessions(db, 100));
        setMeasures(await listBodyMeasures(db));
        const ids = await listTrainedExerciseIds(db);
        const out: { id: string; pb: PersonalBests; vezes: number }[] = [];
        for (const id of ids) {
          const h = await getExerciseHistory(db, id, 200);
          out.push({ id, pb: personalBests(h), vezes: h.length });
        }
        out.sort((a, b) => (getExercise(a.id)?.nome ?? '').localeCompare(getExercise(b.id)?.nome ?? ''));
        setBests(out);
      })();
    }, [db]),
  );

  const ult30 = sessions.filter((s) => new Date(s.iniciado_em) >= daysAgo(30));
  const volMax = volume ? Math.max(10, ...Object.values(volume)) : 10;
  const volSorted = volume
    ? (Object.entries(volume) as [Muscle, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    : [];
  const pesos = measures.filter((m) => m.pesoKg != null).map((m) => ({ data: m.data, valor: m.pesoKg as number }));

  return (
    <Screen>
      <Txt variant="h1">Progresso</Txt>
      <Row>
        <Chip label="Visão geral" active={aba === 'visao'} onPress={() => setAba('visao')} />
        <Chip label="Recordes" active={aba === 'recordes'} onPress={() => setAba('recordes')} />
        <Chip label="Histórico" active={aba === 'historico'} onPress={() => setAba('historico')} />
      </Row>

      {aba === 'visao' ? (
        <>
          <Card>
            <Row gap={spacing.lg}>
              <Stat label="treinos em 30 dias" value={String(ult30.length)} color={colors.accent} />
              <Stat
                label="tempo em 30 dias"
                value={formatDuration(ult30.reduce((a, s) => a + (s.duracao_seg ?? 0), 0))}
              />
              <Stat
                label="kcal em 30 dias"
                value={String(Math.round(ult30.reduce((a, s) => a + (s.kcal ?? 0), 0)))}
                color={colors.warning}
              />
            </Row>
          </Card>

          <Card>
            <Txt variant="h3">Recuperação muscular</Txt>
            <Txt variant="tiny">Baseado nas séries dos últimos dias. Músculos grandes levam ~72 h, pequenos ~48 h.</Txt>
            {recovery ? <MuscleMap values={recovery} mode="recuperacao" height={280} /> : null}
            <RecoveryLegend />
          </Card>

          <Card>
            <Txt variant="h3">Séries por músculo (7 dias)</Txt>
            <Txt variant="tiny">Exercício principal conta 1 série; músculo auxiliar conta 0,5. Para iniciantes, 6–12 por semana já dá ótimos resultados.</Txt>
            {volSorted.length === 0 ? (
              <Txt color={colors.muted}>Nenhuma série nos últimos 7 dias.</Txt>
            ) : (
              volSorted.map(([m, v]) => (
                <View key={m} style={{ gap: 4 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt variant="small">{MUSCLE_LABELS[m]}</Txt>
                    <Txt variant="small" bold>
                      {formatKg(v)}
                    </Txt>
                  </Row>
                  <ProgressBar value={v / volMax} color={v >= 6 ? colors.accent : colors.violet} />
                </View>
              ))
            )}
          </Card>

          <Card onPress={() => router.push('/corpo')}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="h3">Peso corporal</Txt>
              <Row gap={4}>
                <Txt variant="small" color={colors.accent}>
                  Corpo e fotos
                </Txt>
                <Icon name="chevron-forward" size={16} color={colors.accent} />
              </Row>
            </Row>
            <LineChart points={pesos} unit="kg" color={colors.violet} />
          </Card>
        </>
      ) : null}

      {aba === 'recordes' ? (
        bests.length === 0 ? (
          <Empty icon="trophy-outline" title="Nenhum recorde ainda" text="Termine seu primeiro treino para começar a acompanhar." />
        ) : (
          bests.map(({ id, pb, vezes }) => {
            const ex = getExercise(id);
            if (!ex) return null;
            return (
              <Card key={id} onPress={() => router.push(`/exercicio/${id}`)} style={{ paddingVertical: 12 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Txt bold>{ex.nome}</Txt>
                    <Txt variant="tiny">{vezes} treinos</Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {ex.tipo === 'tempo' ? (
                      <Txt bold color={colors.accent}>{pb.duracaoMax} s</Txt>
                    ) : ex.tipo === 'peso-corporal' ? (
                      <Txt bold color={colors.accent}>{pb.repsMax} reps</Txt>
                    ) : (
                      <>
                        <Txt bold color={colors.accent}>
                          {formatKg(pb.pesoMax)} kg
                        </Txt>
                        <Txt variant="tiny">1RM ~{formatKg(Math.round(pb.e1rm))} kg</Txt>
                      </>
                    )}
                  </View>
                </Row>
              </Card>
            );
          })
        )
      ) : null}

      {aba === 'historico' ? (
        sessions.length === 0 ? (
          <Empty icon="calendar-outline" title="Nenhum treino ainda" />
        ) : (
          sessions.map((s) => (
            <Card key={s.id} onPress={() => router.push(`/historico/${s.id}`)} style={{ paddingVertical: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt bold>{s.nome}</Txt>
                  <Txt variant="tiny">{formatDateLong(s.iniciado_em)}</Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt variant="small">{formatDuration(s.duracao_seg ?? 0)}</Txt>
                  <Txt variant="tiny">
                    {s.series} séries · {formatKg(Math.round(s.volume_kg))} kg
                  </Txt>
                </View>
              </Row>
            </Card>
          ))
        )
      ) : null}
    </Screen>
  );
}
