import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { exercisesForMachine, getMachine, MUSCLE_LABELS } from '@/catalog';
import { Card, Empty, Icon, Row, Screen, Txt } from '@/components/ui';
import { colors, radius } from '@/theme';

export default function MaquinaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const machine = getMachine(id);
  if (!machine) {
    return (
      <Screen edges={['bottom']}>
        <Empty icon="help-circle-outline" title="Máquina não encontrada" text={`Código lido: ${id}`} />
      </Screen>
    );
  }
  const exs = exercisesForMachine(machine.id);

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
