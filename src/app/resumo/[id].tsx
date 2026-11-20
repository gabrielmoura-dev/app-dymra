import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { getExercise } from '@/catalog';
import { MuscleMap } from '@/components/MuscleMap';
import { Button, Card, Icon, Row, Screen, Stat, Txt } from '@/components/ui';
import { getExerciseHistory, getSessionDetail, listCompletedSessions, type SessionDetail, type SetRow } from '@/db/repo';
import { consistency } from '@/logic/consistency';
import { formatDuration } from '@/logic/dates';
import { sessionMuscleIntensity } from '@/logic/recovery';
import { detectRecords, formatKg, RECORD_LABELS, type RecordKind } from '@/logic/strength';
import { compareExercise, motivationalMessage, sessionStats, type ExerciseComparison } from '@/logic/summary';
import type { LoggedSet } from '@/logic/types';
import { useProfile } from '@/state/profile';
import { useProgram } from '@/state/userCatalog';
import { colors, spacing } from '@/theme';

const toLogged = (s: SetRow): LoggedSet => ({
  pesoKg: s.peso_kg,
  reps: s.reps,
  duracaoSeg: s.duracao_seg,
  esforco: s.esforco,
  aquecimento: s.aquecimento === 1,
});

interface ExtraInfo {
  records: { exercicioId: string; kinds: RecordKind[] }[];
  comparisons: ExerciseComparison[];
}

export default function Resumo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [extra, setExtra] = useState<ExtraInfo>({ records: [], comparisons: [] });
  const [datas, setDatas] = useState<string[]>([]);
  const { profile } = useProfile();
  const programa = useProgram(profile?.programaId);
  const semana = consistency(datas, profile?.metaSemanal ?? programa?.dias.length ?? 3);

  useEffect(() => {
    (async () => {
      const sid = Number(id);
      const d = await getSessionDetail(db, sid);
      listCompletedSessions(db, 200).then((l) => setDatas(l.map((x) => x.iniciado_em)));
      setDetail(d);
      if (!d) return;
      const records: ExtraInfo['records'] = [];
      const comparisons: ExerciseComparison[] = [];
      const historicos = await Promise.all(
        d.exercises.map(({ item }) => getExerciseHistory(db, item.exercicio_id, 20, sid)),
      );
      d.exercises.forEach(({ item, sets }, i) => {
        const ex = getExercise(item.exercicio_id);
        const prev = historicos[i].filter((h) => h.data < d.session.iniciado_em);
        const cur = sets.map(toLogged);
        const kinds = detectRecords(cur, prev, { assistido: ex?.assistido, porTempo: ex?.tipo === 'tempo' });
        if (kinds.length) records.push({ exercicioId: item.exercicio_id, kinds });
        const c = compareExercise(item.exercicio_id, cur, prev[0]?.sets ?? null);
        if (c) comparisons.push(c);
      });
      setExtra({ records, comparisons });
    })();
  }, [db, id]);

  if (!detail) return <Screen>{null}</Screen>;

  const stats = sessionStats(detail.exercises.map((e) => ({ sets: e.sets.map(toLogged) })));
  const improved = extra.comparisons.some((c) => c.deltaVolumeKg > 0);
  const melhoras = extra.comparisons.filter((c) => c.deltaPesoKg > 0 || c.deltaReps > 0);
  const msg = motivationalMessage(detail.session.id, extra.records.length > 0, improved);
  const intensity = sessionMuscleIntensity(
    detail.exercises.map((e) => ({
      exercicioId: e.item.exercicio_id,
      series: e.sets.filter((s) => s.aquecimento === 0).length,
    })),
    getExercise,
  );

  return (
    <Screen edges={['bottom']}>
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md }}>
        <Icon name={extra.records.length ? 'trophy' : 'checkmark-done-circle'} size={56} color={colors.accent} />
        <Txt variant="h2" center>
          {detail.session.nome} concluído!
        </Txt>
        <Txt center color={colors.muted}>
          {msg}
        </Txt>
      </View>

      <Card>
        <Row gap={spacing.lg}>
          <Stat label="duração" value={formatDuration(detail.session.duracao_seg ?? 0)} />
          <Stat
            label={detail.session.kcal_fonte === 'relogio' ? 'kcal (relógio)' : 'kcal (estimativa)'}
            value={String(Math.round(detail.session.kcal ?? 0))}
            color={colors.warning}
          />
        </Row>
        <Row gap={spacing.lg} style={{ marginTop: spacing.sm }}>
          <Stat label="volume levantado" value={formatKg(Math.round(stats.volumeKg))} unit="kg" color={colors.accent} />
          <Stat label="séries" value={String(stats.series)} />
          <Stat label="repetições" value={String(stats.reps)} />
        </Row>
        {detail.session.fc_media ? (
          <Row gap={spacing.lg} style={{ marginTop: spacing.sm }}>
            <Stat label="FC média" value={String(Math.round(detail.session.fc_media))} unit="bpm" color={colors.danger} />
            <Stat label="FC máxima" value={String(Math.round(detail.session.fc_max ?? 0))} unit="bpm" />
          </Row>
        ) : null}
      </Card>

      {datas.length > 0 ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="h3">Meta da semana</Txt>
            <Txt variant="h3" color={semana.nestaSemana >= semana.meta ? colors.accent : colors.text}>
              {Math.min(semana.nestaSemana, 99)}/{semana.meta}
            </Txt>
          </Row>
          <Txt variant="small" color={colors.muted}>
            {semana.nestaSemana >= semana.meta
              ? `Meta batida! ${semana.semanasSeguidas} ${semana.semanasSeguidas === 1 ? 'semana seguida' : 'semanas seguidas'}.`
              : `Faltam ${semana.meta - semana.nestaSemana} ${semana.meta - semana.nestaSemana === 1 ? 'treino' : 'treinos'} para bater a meta.`}
          </Txt>
        </Card>
      ) : null}

      {extra.records.length > 0 ? (
        <Card tone="accent">
          <Row>
            <Icon name="trophy" color={colors.accent} size={18} />
            <Txt variant="h3">Recordes de hoje</Txt>
          </Row>
          {extra.records.map((r) => (
            <View key={r.exercicioId}>
              <Txt bold>{getExercise(r.exercicioId)?.nome}</Txt>
              <Txt variant="small" color={colors.muted}>
                {r.kinds.map((k) => RECORD_LABELS[k]).join(' · ')}
              </Txt>
            </View>
          ))}
        </Card>
      ) : null}

      {melhoras.length > 0 ? (
        <Card>
          <Txt variant="h3">Comparado com a última vez</Txt>
          {melhoras.map((c) => (
            <Row key={c.exercicioId} style={{ justifyContent: 'space-between' }}>
              <Txt variant="small" style={{ flex: 1 }}>
                {getExercise(c.exercicioId)?.nome}
              </Txt>
              <Txt variant="small" bold color={colors.success}>
                {c.deltaPesoKg > 0 ? `+${formatKg(c.deltaPesoKg)} kg ` : ''}
                {c.deltaReps > 0 ? `+${c.deltaReps} reps` : ''}
              </Txt>
            </Row>
          ))}
        </Card>
      ) : null}

      <Card>
        <Txt variant="h3">Músculos trabalhados</Txt>
        <MuscleMap values={intensity} mode="intensidade" height={220} />
      </Card>

      <Card>
        <Row>
          <Icon name="restaurant-outline" color={colors.accent} />
          <Txt variant="small" style={{ flex: 1 }}>
            Capriche na proteína nas próximas refeições e durma bem para ajudar na recuperação.
          </Txt>
        </Row>
      </Card>

      <Button title="Voltar ao início" icon="home" onPress={() => router.replace('/')} />
      <Button title="Ver detalhes do treino" variant="ghost" onPress={() => router.replace(`/historico/${detail.session.id}`)} />
    </Screen>
  );
}
