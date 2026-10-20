import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { View } from 'react-native';

import { exercisesForMachine, getMachine, machineStep, MUSCLE_LABELS } from '@/catalog';
import { Stepper } from '@/components/inputs';
import { Button, Card, Empty, Icon, Row, Screen, Txt } from '@/components/ui';
import { formatKg } from '@/logic/strength';
import { saveMachineStep, useStepOverrides } from '@/state/userCatalog';
import { colors, radius } from '@/theme';

export default function MaquinaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const overrides = useStepOverrides();
  const machine = getMachine(id);
  if (!machine) {
    return (
      <Screen edges={['bottom']}>
        <Empty icon="help-circle-outline" title="Máquina não encontrada" text={`Código lido: ${id}`} />
      </Screen>
    );
  }
  const exs = exercisesForMachine(machine.id);
  const passo = machineStep(machine, overrides);
  const alterado = overrides[machine.id] != null && overrides[machine.id] !== machine.passoKg;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: machine.nome }} />
      {machine.foto ? (
        <Image source={machine.foto} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg }} contentFit="cover" />
      ) : (
        <View
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
          <Icon name="barbell" size={48} color={colors.faint} />
          <Txt variant="tiny">Foto da máquina ainda não cadastrada</Txt>
        </View>
      )}
      <View style={{ gap: 4 }}>
        <Txt color={colors.muted}>Área: {machine.area}</Txt>
        {machine.descricao ? <Txt>{machine.descricao}</Txt> : null}
      </View>
      {machine.passoKg > 0 || overrides[machine.id] != null ? (
        <Card>
          <Txt variant="h3">Passo de carga</Txt>
          <Txt variant="small" color={colors.muted}>
            De quanto em quanto o peso sobe nesta máquina (ex.: placas de 5 kg, ou 7 kg). Usado nos botões − / + e nas sugestões de carga.
          </Txt>
          <Stepper
            value={passo}
            onChange={(v) => v != null && v > 0 && saveMachineStep(db, machine.id, v === machine.passoKg ? null : v)}
            step={0.5}
            min={0.5}
            suffix="kg"
          />
          {alterado ? (
            <Button
              small
              variant="ghost"
              title={`Voltar ao padrão (${formatKg(machine.passoKg)} kg)`}
              onPress={() => saveMachineStep(db, machine.id, null)}
            />
          ) : null}
        </Card>
      ) : null}
      <Txt variant="h3">Exercícios nesta máquina ({exs.length})</Txt>
      {exs.map((e) => (
        <Card key={e.id} onPress={() => router.push(`/exercicio/${e.id}`)}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt bold>{e.nome}</Txt>
              <Txt variant="tiny">{e.primarios.map((m) => MUSCLE_LABELS[m]).join(', ') || 'Cardio'}</Txt>
            </View>
            {e.video ? <Icon name="play-circle-outline" color={colors.accent} /> : null}
            <Icon name="chevron-forward" color={colors.muted} size={18} />
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
