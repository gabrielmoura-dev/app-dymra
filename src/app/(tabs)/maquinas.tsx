import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { exercisesForMachine, MACHINES, machineStep } from '@/catalog';
import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, Card, Chip, Icon, Row, Screen, Txt } from '@/components/ui';
import { formatKg } from '@/logic/strength';
import { useStepOverrides } from '@/state/userCatalog';
import { colors, radius } from '@/theme';

export default function Maquinas() {
  const [aba, setAba] = useState<'maquinas' | 'exercicios'>('maquinas');
  const overrides = useStepOverrides();
  const areas = [...new Set(MACHINES.map((m) => m.area))];

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="h1">Academia</Txt>
        <Button small variant="secondary" icon="qr-code-outline" title="QR" onPress={() => router.push('/scanner')} />
      </Row>
      <Row>
        <Chip label="Máquinas" active={aba === 'maquinas'} onPress={() => setAba('maquinas')} />
        <Chip label="Exercícios" active={aba === 'exercicios'} onPress={() => setAba('exercicios')} />
      </Row>

      {aba === 'exercicios' ? (
        <ExercisePicker onPick={(e) => router.push(`/exercicio/${e.id}`)} />
      ) : (
        areas.map((area) => (
          <View key={area} style={{ gap: 8 }}>
            <Txt variant="label">{area}</Txt>
            {MACHINES.filter((m) => m.area === area).map((m) => (
              <Card key={m.id} onPress={() => router.push(`/maquina/${m.id}`)} style={{ paddingVertical: 12 }}>
                <Row>
                  {m.foto ? (
                    <Image source={m.foto} style={{ width: 44, height: 44, borderRadius: radius.sm }} />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radius.sm,
                        backgroundColor: colors.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Icon name="barbell-outline" color={colors.faint} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Txt bold>{m.nome}</Txt>
                    <Txt variant="tiny">
                      {exercisesForMachine(m.id).length} exercícios
                      {machineStep(m, overrides) > 0 ? ` · sobe de ${formatKg(machineStep(m, overrides))} em ${formatKg(machineStep(m, overrides))} kg` : ''}
                    </Txt>
                  </View>
                  <Icon name="chevron-forward" color={colors.muted} size={18} />
                </Row>
              </Card>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
