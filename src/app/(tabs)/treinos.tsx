import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { View } from 'react-native';

import { getExercise, PROGRAMS } from '@/catalog';
import type { Program } from '@/catalog/types';
import { confirmAction } from '@/components/confirm';
import { Button, Card, Chip, Icon, Row, Screen, SectionTitle, Txt } from '@/components/ui';
import { emptyProgram } from '@/logic/programGenerator';
import { useProfile, useRequiredProfile } from '@/state/profile';
import { newCustomProgramId, saveCustomProgram, useUserCatalog } from '@/state/userCatalog';
import { colors } from '@/theme';

function FichaCard({
  p,
  atual,
  editavel,
  onUsar,
}: {
  p: Program;
  atual: boolean;
  editavel: boolean;
  onUsar: () => void;
}) {
  return (
    <Card tone={atual ? 'accent' : 'default'}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="h3">{p.nome}</Txt>
          <Txt variant="tiny">{editavel ? 'Criada neste celular' : `de ${p.dono}`}</Txt>
        </View>
        {atual ? <Chip label="Sua ficha" active /> : <Chip label="Usar esta" onPress={onUsar} />}
      </Row>
      {p.descricao ? (
        <Txt variant="small" color={colors.muted}>
          {p.descricao}
        </Txt>
      ) : null}
      {p.dias.map((d) => (
        <Card
          key={d.id}
          onPress={() => router.push(`/rotina/${p.id}/${d.id}`)}
          style={{ backgroundColor: colors.surface2, paddingVertical: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Txt bold>
                {d.nome}
                {d.foco ? ` · ${d.foco}` : ''}
              </Txt>
              <Txt variant="tiny" numberOfLines={1}>
                {d.exercicios.length
                  ? d.exercicios.map((r) => getExercise(r.exercicioId)?.nome).filter(Boolean).join(' · ')
                  : 'Sem exercícios ainda'}
              </Txt>
            </View>
            <Icon name="chevron-forward" color={colors.muted} size={18} />
          </Row>
        </Card>
      ))}
      {editavel ? (
        <Button small variant="secondary" icon="create-outline" title="Editar ficha" onPress={() => router.push(`/ficha/${p.id}`)} />
      ) : null}
    </Card>
  );
}

export default function Treinos() {
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const { update } = useProfile();
  const minhas = useUserCatalog((s) => s.programs);

  const escolher = async (p: Program) => {
    if (p.id === profile.programaId) return;
    const ok = await confirmAction({
      title: 'Trocar de ficha?',
      message: `Usar "${p.nome}" como sua ficha atual? Seu histórico continua salvo.`,
      confirmText: 'Usar esta',
    });
    if (ok) await update({ programaId: p.id });
  };

  const montarDoZero = async () => {
    const p = emptyProgram(profile.nome, newCustomProgramId());
    await saveCustomProgram(db, p);
    if (!profile.programaId) await update({ programaId: p.id });
    router.push(`/ficha/${p.id}`);
  };

  return (
    <Screen>
      <Txt variant="h1">Fichas</Txt>

      <SectionTitle>Minhas fichas</SectionTitle>
      {minhas.length === 0 ? (
        <Txt color={colors.muted}>Gere uma ficha com as máquinas da academia ou monte a sua do zero.</Txt>
      ) : null}
      {minhas.map((p) => (
        <FichaCard key={p.id} p={p} atual={p.id === profile.programaId} editavel onUsar={() => escolher(p)} />
      ))}
      <Row>
        <Button icon="sparkles" title="Gerar para mim" onPress={() => router.push('/gerar-ficha')} style={{ flex: 1 }} />
        <Button icon="construct-outline" variant="secondary" title="Montar do zero" onPress={montarDoZero} style={{ flex: 1 }} />
      </Row>

      <SectionTitle>Fichas prontas</SectionTitle>
      <Txt variant="small" color={colors.muted}>
        Chegam pelas atualizações do app. Toque num treino para ver os exercícios e começar.
      </Txt>
      {PROGRAMS.map((p) => (
        <FichaCard key={p.id} p={p} atual={p.id === profile.programaId} editavel={false} onUsar={() => escolher(p)} />
      ))}
    </Screen>
  );
}
