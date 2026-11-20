import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { exercisesForMachine, getExercise, MACHINES, machineStep } from '@/catalog';
import { ExercisePicker, ExerciseRow } from '@/components/ExercisePicker';
import { Button, Card, Chip, Empty, Icon, Recolhivel, Row, Screen, Txt } from '@/components/ui';
import { formatKg } from '@/logic/strength';
import { machineUsage, MIN_VEZES, rankByUsage } from '@/logic/usage';
import { useExerciseUsage } from '@/state/usage';
import { useFavorites, useStepOverrides } from '@/state/userCatalog';
import { colors, radius } from '@/theme';

export default function Maquinas() {
  const [aba, setAba] = useState<'maquinas' | 'exercicios' | 'favoritos'>('maquinas');
  const favoritos = useFavorites();
  const overrides = useStepOverrides();
  const usage = useExerciseUsage();
  const porMaquina = machineUsage(usage, (id) => getExercise(id)?.maquinaIds ?? []);
  const [aberta, setAberta] = useState<string | null>(null);
  // Cada área é um card que se abre ao toque, na ordem do catálogo;
  // dentro dela, as máquinas mais usadas sobem.
  const areas = [...new Set(MACHINES.map((m) => m.area))].map((area) => {
    const maquinas = rankByUsage(MACHINES.filter((m) => m.area === area), (m) => m.id, porMaquina);
    const top = maquinas[0];
    const uso = top ? (porMaquina.get(top.id)?.vezes ?? 0) : 0;
    return { area, maquinas, maisUsada: uso >= MIN_VEZES ? top : null };
  });

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="h1">Academia</Txt>
        <Button small variant="secondary" icon="qr-code-outline" title="QR" onPress={() => router.push('/scanner')} />
      </Row>
      <Row>
        <Chip label="Máquinas" active={aba === 'maquinas'} onPress={() => setAba('maquinas')} />
        <Chip label="Exercícios" active={aba === 'exercicios'} onPress={() => setAba('exercicios')} />
        <Chip icon="star" label="Favoritos" active={aba === 'favoritos'} onPress={() => setAba('favoritos')} />
      </Row>

      {aba === 'exercicios' ? (
        <ExercisePicker onPick={(e) => router.push(`/exercicio/${e.id}`)} />
      ) : aba === 'favoritos' ? (
        favoritos.length === 0 ? (
          <Empty icon="star-outline" title="Nenhum favorito ainda" text="Toque na estrela de um exercício para guardá-lo aqui." />
        ) : (
          favoritos
            .map((id) => getExercise(id))
            .filter((e) => e != null)
            .map((e) => (
              <ExerciseRow key={e.id} e={e} vezes={usage.get(e.id)?.vezes ?? 0} onPick={() => router.push(`/exercicio/${e.id}`)} />
            ))
        )
      ) : (
        areas.map(({ area, maquinas, maisUsada }) => (
          <Recolhivel
            key={area}
            titulo={area}
            resumo={`${maquinas.length} ${maquinas.length === 1 ? 'máquina' : 'máquinas'}${maisUsada ? ` · mais usada: ${maisUsada.nome}` : ''}`}
            aberto={aberta === area}
            onToggle={() => setAberta(aberta === area ? null : area)}>
            {maquinas.map((m) => (
              <Card key={m.id} onPress={() => router.push(`/maquina/${m.id}`)} style={{ paddingVertical: 12, backgroundColor: colors.surface2 }}>
                <Row>
                  {m.foto ? (
                    <Image source={m.foto} style={{ width: 44, height: 44, borderRadius: radius.sm }} />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radius.sm,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Icon name="barbell-outline" color={colors.faint} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Row gap={6}>
                      <Txt bold style={{ flexShrink: 1 }}>{m.nome}</Txt>
                      {(porMaquina.get(m.id)?.vezes ?? 0) >= MIN_VEZES ? (
                        <Txt variant="tiny" color={colors.accent}>
                          {porMaquina.get(m.id)!.vezes}× usada
                        </Txt>
                      ) : null}
                    </Row>
                    <Txt variant="tiny">
                      {exercisesForMachine(m.id).length} {exercisesForMachine(m.id).length === 1 ? 'exercício' : 'exercícios'}
                      {machineStep(m, overrides) > 0 ? ` · sobe de ${formatKg(machineStep(m, overrides))} em ${formatKg(machineStep(m, overrides))} kg` : ''}
                    </Txt>
                  </View>
                  <Icon name="chevron-forward" color={colors.muted} size={18} />
                </Row>
              </Card>
            ))}
          </Recolhivel>
        ))
      )}
    </Screen>
  );
}
