import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { getExercise, getMachine, getProgram, MUSCLE_LABELS } from '@/catalog';
import { MuscleMap } from '@/components/MuscleMap';
import { Button, Card, Empty, Icon, Row, Screen, Txt } from '@/components/ui';
import { getActiveSessionId } from '@/db/repo';
import { sessionMuscleIntensity } from '@/logic/recovery';
import { startRoutineSession } from '@/state/planning';
import { useRequiredProfile } from '@/state/profile';
import { colors } from '@/theme';

export default function RotinaDia() {
  const { programa, dia } = useLocalSearchParams<{ programa: string; dia: string }>();
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const [busy, setBusy] = useState(false);
  const p = getProgram(programa);
  const d = p?.dias.find((x) => x.id === dia);

  if (!p || !d) return <Screen edges={['bottom']}><Empty icon="help" title="Treino não encontrado" /></Screen>;

  const iniciar = async () => {
    setBusy(true);
    try {
      if (await getActiveSessionId(db)) {
        Alert.alert('Já existe um treino aberto', 'Termine ou descarte o treino atual antes de começar outro.', [
          { text: 'Ir para o treino', onPress: () => router.push('/sessao') },
        ]);
        return;
      }
      await startRoutineSession(db, { programaId: p.id, day: d, nome: d.nome, pesoCorporalKg: profile.pesoKg });
      router.push('/sessao');
    } finally {
      setBusy(false);
    }
  };

  const intensity = sessionMuscleIntensity(
    d.exercicios.map((r) => ({ exercicioId: r.exercicioId, series: r.series })),
    getExercise,
  );

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: `${d.nome} · ${p.nome}` }} />
      <View style={{ gap: 2 }}>
        <Txt variant="h2">{d.nome}</Txt>
        <Txt color={colors.muted}>{d.foco}</Txt>
      </View>
      <MuscleMap values={intensity} mode="intensidade" height={200} />
      <Button title="Começar este treino" icon="play" onPress={iniciar} loading={busy} />
      {d.exercicios.map((r, i) => {
        const ex = getExercise(r.exercicioId);
        if (!ex) return null;
        return (
          <Card key={`${r.exercicioId}-${i}`} onPress={() => router.push(`/exercicio/${ex.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt bold color={colors.accent} style={{ width: 22 }}>
                {i + 1}
              </Txt>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt bold>{ex.nome}</Txt>
                <Txt variant="tiny">
                  {r.duracaoSeg
                    ? `${r.series}× ${r.duracaoSeg >= 120 ? `${Math.round(r.duracaoSeg / 60)} min` : `${r.duracaoSeg} s`}`
                    : `${r.series}× ${r.repsMin === r.repsMax ? r.repsMin : `${r.repsMin}–${r.repsMax}`} reps`}
                  {` · descanso ${r.descansoSeg}s · ${getMachine(ex.maquinaIds[0])?.nome}`}
                </Txt>
                <Txt variant="tiny" color={colors.muted}>
                  {ex.primarios.map((m) => MUSCLE_LABELS[m]).join(', ')}
                </Txt>
                {r.observacao ? <Txt variant="tiny" color={colors.violet}>{r.observacao}</Txt> : null}
              </View>
              <Icon name="chevron-forward" color={colors.muted} size={18} />
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
