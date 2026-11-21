import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { EXERCISES, getExercise, getMachine } from '@/catalog';
import { Card, Empty, Icon, Row, Screen, Txt } from '@/components/ui';
import { getSessionExercise, swapSessionExercise, type SessionExerciseRow } from '@/db/repo';
import { findAlternatives, type Alternative } from '@/logic/alternatives';
import { suggestionFor } from '@/state/planning';
import { colors } from '@/theme';

function Item({ a, onPress }: { a: Alternative; onPress: () => void }) {
  const maquina = getMachine(a.machineId)?.nome;
  return (
    <Card onPress={onPress}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="h3">{a.exercise.nome}</Txt>
          {maquina && maquina !== a.exercise.nome ? (
            <Txt variant="small" color={colors.muted}>
              {maquina}
            </Txt>
          ) : null}
        </View>
        <Icon name="swap-horizontal" color={colors.accent} />
      </Row>
    </Card>
  );
}

export default function Trocar() {
  const { seId } = useLocalSearchParams<{ seId: string }>();
  const db = useSQLiteContext();
  const [row, setRow] = useState<SessionExerciseRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSessionExercise(db, Number(seId)).then(setRow);
  }, [db, seId]);

  if (!row) return <Screen edges={[]}>{null}</Screen>;
  const current = getExercise(row.exercicio_id);
  const original = row.substituto_de ? getExercise(row.substituto_de) : null;
  if (!current) return <Screen edges={[]}><Empty icon="help" title="Exercício não encontrado" /></Screen>;

  const alts = findAlternatives(current, EXERCISES, current.maquinaIds[0]);

  const escolher = async (exercicioId: string) => {
    if (busy) return;
    setBusy(true);
    const s = await suggestionFor(db, {
      exercicioId,
      series: 1,
      repsMin: row.reps_min,
      repsMax: row.reps_max,
      descansoSeg: row.descanso_seg,
      duracaoSeg: row.duracao_seg ?? undefined,
    });
    await swapSessionExercise(db, row.id, exercicioId, s.pesoKg, s.reps);
    router.back();
  };

  return (
    <Screen edges={['bottom']}>
      <Txt color={colors.muted}>
        <Txt bold>{getMachine(current.maquinaIds[0])?.nome}</Txt> ocupada? Escolha outra:
      </Txt>
      {original ? (
        <Card tone="violet" onPress={() => escolher(original.id)}>
          <Row>
            <Icon name="arrow-undo" color={colors.violet} />
            <View style={{ flex: 1 }}>
              <Txt variant="h3">Voltar para {original.nome}</Txt>
            </View>
          </Row>
        </Card>
      ) : null}
      {alts.length === 0 ? (
        <Empty icon="sad-outline" title="Sem alternativas cadastradas" text="Espere a máquina liberar ou pule este exercício." />
      ) : (
        alts.map((a) => <Item key={`${a.exercise.id}-${a.machineId}`} a={a} onPress={() => escolher(a.exercise.id)} />)
      )}
    </Screen>
  );
}
