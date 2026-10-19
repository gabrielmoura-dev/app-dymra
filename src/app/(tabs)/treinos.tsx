import { router } from 'expo-router';
import { Alert, View } from 'react-native';

import { getExercise, PROGRAMS } from '@/catalog';
import { Card, Chip, Icon, Row, Screen, Txt } from '@/components/ui';
import { useProfile, useRequiredProfile } from '@/state/profile';
import { colors } from '@/theme';

export default function Treinos() {
  const profile = useRequiredProfile();
  const { update } = useProfile();

  const escolher = (id: string, nome: string) => {
    if (id === profile.programaId) return;
    Alert.alert('Trocar de ficha?', `Usar "${nome}" como sua ficha atual? Seu histórico continua salvo.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Usar esta', onPress: () => update({ programaId: id }) },
    ]);
  };

  return (
    <Screen>
      <Txt variant="h1">Fichas</Txt>
      <Txt color={colors.muted}>
        As fichas chegam pelas atualizações do app. Toque num treino para ver os exercícios e começar.
      </Txt>
      {PROGRAMS.map((p) => {
        const atual = p.id === profile.programaId;
        return (
          <Card key={p.id} tone={atual ? 'accent' : 'default'}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="h3">{p.nome}</Txt>
                <Txt variant="tiny">de {p.dono}</Txt>
              </View>
              {atual ? (
                <Chip label="Sua ficha" active />
              ) : (
                <Chip label="Usar esta" onPress={() => escolher(p.id, p.nome)} />
              )}
            </Row>
            <Txt variant="small" color={colors.muted}>
              {p.descricao}
            </Txt>
            {p.dias.map((d) => (
              <Card
                key={d.id}
                onPress={() => router.push(`/rotina/${p.id}/${d.id}`)}
                style={{ backgroundColor: colors.surface2, paddingVertical: 12 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Txt bold>
                      {d.nome} · {d.foco}
                    </Txt>
                    <Txt variant="tiny" numberOfLines={1}>
                      {d.exercicios.map((r) => getExercise(r.exercicioId)?.nome).join(' · ')}
                    </Txt>
                  </View>
                  <Icon name="chevron-forward" color={colors.muted} size={18} />
                </Row>
              </Card>
            ))}
          </Card>
        );
      })}
    </Screen>
  );
}
