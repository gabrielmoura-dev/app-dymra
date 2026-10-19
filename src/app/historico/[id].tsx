import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { getExercise } from '@/catalog';
import { Button, Card, Empty, Row, Screen, Stat, Txt } from '@/components/ui';
import { deleteSession, getSessionDetail, type SessionDetail } from '@/db/repo';
import { formatDateLong, formatDuration } from '@/logic/dates';
import { describeSets } from '@/logic/progression';
import { formatKg } from '@/logic/strength';
import { sessionStats } from '@/logic/summary';
import { colors, spacing } from '@/theme';

const EFFORT = ['', 'fácil', 'ok', 'difícil'];

export default function HistoricoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [detail, setDetail] = useState<SessionDetail | null | undefined>(undefined);

  useEffect(() => {
    getSessionDetail(db, Number(id)).then(setDetail);
  }, [db, id]);

  if (detail === undefined) return <Screen edges={['bottom']}>{null}</Screen>;
  if (!detail) return <Screen edges={['bottom']}><Empty icon="help" title="Treino não encontrado" /></Screen>;

  const toLogged = detail.exercises.map((e) => ({
    sets: e.sets.map((s) => ({ pesoKg: s.peso_kg, reps: s.reps, duracaoSeg: s.duracao_seg, esforco: s.esforco, aquecimento: s.aquecimento === 1 })),
  }));
  const stats = sessionStats(toLogged);

  const apagar = () =>
    Alert.alert('Apagar treino?', 'Este treino sai do histórico e dos recordes. Não dá para desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(db, detail.session.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: detail.session.nome }} />
      <Txt color={colors.muted}>{formatDateLong(detail.session.iniciado_em)}</Txt>
      <Card>
        <Row gap={spacing.lg}>
          <Stat label="duração" value={formatDuration(detail.session.duracao_seg ?? 0)} />
          <Stat label="kcal" value={String(Math.round(detail.session.kcal ?? 0))} color={colors.warning} />
          <Stat label="volume" value={formatKg(Math.round(stats.volumeKg))} unit="kg" color={colors.accent} />
        </Row>
      </Card>
      {detail.exercises.map(({ item, sets }, i) => {
        const ex = getExercise(item.exercicio_id);
        return (
          <Card key={item.id} onPress={() => router.push(`/exercicio/${item.exercicio_id}`)}>
            <Txt bold>{ex?.nome ?? item.exercicio_id}</Txt>
            {item.substituto_de ? (
              <Txt variant="tiny" color={colors.violet}>
                No lugar de {getExercise(item.substituto_de)?.nome}
              </Txt>
            ) : null}
            <Txt variant="small" color={colors.muted}>
              {describeSets(toLogged[i].sets, ex?.tipo)}
            </Txt>
            <View style={{ gap: 2 }}>
              {sets.map((s, k) => (
                <Txt key={s.id} variant="tiny">
                  Série {k + 1}:{' '}
                  {ex?.tipo === 'tempo'
                    ? `${s.duracao_seg ?? 0} s`
                    : `${s.peso_kg ? `${formatKg(s.peso_kg)} kg × ` : ''}${s.reps ?? 0}`}
                  {s.esforco ? ` · ${EFFORT[s.esforco]}` : ''}
                </Txt>
              ))}
            </View>
          </Card>
        );
      })}
      <Button title="Apagar este treino" variant="ghost" icon="trash-outline" onPress={apagar} />
    </Screen>
  );
}
