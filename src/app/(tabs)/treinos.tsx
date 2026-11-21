import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { getProgram, PROGRAMS } from '@/catalog';
import type { Program } from '@/catalog/types';
import { confirmAction } from '@/components/confirm';
import { WeekStrip } from '@/components/WeekStrip';
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
        <Txt variant="h3" style={{ flex: 1 }}>
          {p.nome}
        </Txt>
        {atual ? <Chip label="Sua ficha" active /> : <Chip label="Usar esta" onPress={onUsar} />}
      </Row>
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
              <Txt variant="tiny">
                {d.exercicios.length
                  ? `${d.exercicios.length} ${d.exercicios.length === 1 ? 'exercício' : 'exercícios'}`
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

/** Linha compacta de uma ficha que não é a atual. Toque para ver os treinos dela. */
function FichaLinha({ p, editavel, onUsar }: { p: Program; editavel: boolean; onUsar: () => void }) {
  const [aberta, setAberta] = useState(false);
  if (aberta) {
    return (
      <View style={{ gap: 6 }}>
        <FichaCard p={p} atual={false} editavel={editavel} onUsar={onUsar} />
        <Button small variant="ghost" icon="chevron-up" title="Recolher" onPress={() => setAberta(false)} />
      </View>
    );
  }
  return (
    <Card onPress={() => setAberta(true)} style={{ paddingVertical: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt bold numberOfLines={1}>
            {p.nome}
          </Txt>
          <Txt variant="tiny">
            {p.dias.length} {p.dias.length === 1 ? 'treino' : 'treinos'}
          </Txt>
        </View>
        <Chip label="Usar esta" onPress={onUsar} />
      </Row>
    </Card>
  );
}

export default function Treinos() {
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const { update } = useProfile();
  const minhas = useUserCatalog((s) => s.programs);
  const atual = getProgram(profile.programaId, minhas);
  // Sem ficha escolhida, as opções já aparecem abertas.
  const [mostrarOutras, setMostrarOutras] = useState(false);
  const abertas = mostrarOutras || !atual;

  const outrasMinhas = minhas.filter((p) => p.id !== atual?.id);
  const outrasProntas = PROGRAMS.filter((p) => p.id !== atual?.id);
  const totalOutras = outrasMinhas.length + outrasProntas.length;

  const escolher = async (p: Program) => {
    if (p.id === profile.programaId) return;
    const ok = await confirmAction({
      title: 'Trocar de ficha?',
      message: `Usar "${p.nome}" como sua ficha atual? Seu histórico continua salvo.`,
      confirmText: 'Usar esta',
    });
    if (ok) {
      await update({ programaId: p.id });
      setMostrarOutras(false);
    }
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

      {atual ? <WeekStrip p={atual} /> : null}

      {atual ? (
        <FichaCard p={atual} atual editavel={minhas.some((p) => p.id === atual.id)} onUsar={() => {}} />
      ) : (
        <Txt color={colors.muted}>Escolha uma ficha abaixo, gere uma com as máquinas da academia ou monte a sua do zero.</Txt>
      )}

      {atual ? (
        <Card onPress={() => setMostrarOutras((v) => !v)} style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt bold>Trocar ou criar ficha</Txt>
            <Row gap={6}>
              {totalOutras > 0 ? <Txt variant="tiny">{totalOutras} {totalOutras === 1 ? 'outra' : 'outras'}</Txt> : null}
              <Icon name={abertas ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={18} />
            </Row>
          </Row>
        </Card>
      ) : null}

      {abertas ? (
        <>
          <Row>
            <Button icon="sparkles" title="Gerar para mim" onPress={() => router.push('/gerar-ficha')} style={{ flex: 1 }} />
            <Button icon="construct-outline" variant="secondary" title="Montar do zero" onPress={montarDoZero} style={{ flex: 1 }} />
          </Row>
          {outrasMinhas.length > 0 ? <SectionTitle>Minhas fichas</SectionTitle> : null}
          {outrasMinhas.map((p) => (
            <FichaLinha key={p.id} p={p} editavel onUsar={() => escolher(p)} />
          ))}
          {outrasProntas.length > 0 ? <SectionTitle>Fichas prontas</SectionTitle> : null}
          {outrasProntas.map((p) => (
            <FichaLinha key={p.id} p={p} editavel={false} onUsar={() => escolher(p)} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
