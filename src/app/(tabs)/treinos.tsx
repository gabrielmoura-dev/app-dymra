import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getExercise, getMachine, getProgram, PROGRAMS } from '@/catalog';
import type { Program, RoutineDay } from '@/catalog/types';
import { confirmAction, notify } from '@/components/confirm';
import { Button, Card, Chip, Icon, ProgressBar, Row, Screen, SectionTitle, Txt } from '@/components/ui';
import { getActiveSessionId, listDoneSessions } from '@/db/repo';
import { emptyProgram } from '@/logic/programGenerator';
import { DIAS_CURTOS, estimateMinutes, weekOfProgram, type DoneSession } from '@/logic/week';
import { startRoutineSession } from '@/state/planning';
import { useProfile, useRequiredProfile } from '@/state/profile';
import { newCustomProgramId, saveCustomProgram, useUserCatalog } from '@/state/userCatalog';
import { colors, radius, spacing } from '@/theme';

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

function Miniatura({ day }: { day: RoutineDay }) {
  const ex = day.exercicios.map((r) => getExercise(r.exercicioId)).find((e) => e != null);
  const foto = ex ? getMachine(ex.maquinaIds[0])?.foto : undefined;
  return foto ? (
    <Image source={foto} style={styles.thumb} />
  ) : (
    <View style={[styles.thumb, { alignItems: 'center', justifyContent: 'center' }]}>
      <Icon name="barbell-outline" size={28} color={colors.faint} />
    </View>
  );
}

/**
 * A ficha atual como lista de treinos: o próximo destacado, o que já foi feito na semana
 * e um botão para começar direto. No rodapé, o progresso da semana.
 */
function SeusTreinos({ p, editavel }: { p: Program; editavel: boolean }) {
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const [sessoes, setSessoes] = useState<DoneSession[]>([]);
  const [iniciando, setIniciando] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listDoneSessions(db).then((s) => alive && setSessoes(s));
      return () => {
        alive = false;
      };
    }, [db]),
  );

  const semana = weekOfProgram(p, sessoes);
  const meta = profile.metaSemanal ?? p.dias.length;

  const iniciar = async (d: RoutineDay) => {
    if (await getActiveSessionId(db)) {
      router.push('/sessao');
      return;
    }
    setIniciando(d.id);
    try {
      await startRoutineSession(db, {
        programaId: p.id,
        day: d,
        nome: d.nome,
        pesoCorporalKg: profile.pesoKg,
        aquecimento: profile.sugerirAquecimento,
      });
      router.push('/sessao');
    } catch (e) {
      notify('Não deu para iniciar', String(e));
    } finally {
      setIniciando(null);
    }
  };

  return (
    <View style={styles.ficha}>
      <View style={styles.fichaTopo}>
        <Txt variant="h3">{p.nome}</Txt>
        <Txt variant="tiny">{editavel ? 'Criada neste celular' : `de ${p.dono}`}</Txt>
      </View>
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        {p.dias.map((d) => {
          const proximo = semana.proximoId === d.id;
          const feito = semana.feitos.get(d.id);
          const min = estimateMinutes(d);
          return (
            <Pressable
              key={d.id}
              onPress={() => router.push(`/rotina/${p.id}/${d.id}`)}
              style={({ pressed }) => [styles.dia, proximo && styles.diaProximo, pressed && { opacity: 0.8 }]}>
              {proximo ? (
                <View style={styles.selo}>
                  <Txt variant="tiny" bold color={colors.accent}>
                    Próximo
                  </Txt>
                </View>
              ) : null}
              <Miniatura day={d} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="h3" numberOfLines={1}>
                  {d.nome}
                </Txt>
                {d.foco ? (
                  <Txt variant="small" color={colors.muted} numberOfLines={1}>
                    {d.foco}
                  </Txt>
                ) : null}
                <Txt variant="tiny">
                  {d.exercicios.length} {d.exercicios.length === 1 ? 'exercício' : 'exercícios'}
                  {min ? ` · ~${min} min` : ''}
                </Txt>
                {feito ? (
                  <Row gap={4}>
                    <Icon name="checkmark-circle" size={14} color={colors.success} />
                    <Txt variant="tiny" color={colors.success}>
                      Feito {DIAS_CURTOS[new Date(feito).getDay()]}
                    </Txt>
                  </Row>
                ) : null}
              </View>
              {d.exercicios.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Começar ${d.nome}`}
                  onPress={() => iniciar(d)}
                  disabled={iniciando != null}
                  style={({ pressed }) => [styles.play, !proximo && styles.playSecundario, pressed && { opacity: 0.75 }]}>
                  <Icon name="play" size={24} color={proximo ? colors.accentText : colors.accent} />
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
        {editavel ? (
          <Button small variant="secondary" icon="create-outline" title="Editar ficha" onPress={() => router.push(`/ficha/${p.id}`)} />
        ) : null}
      </View>
      <View style={styles.rodape}>
        <View style={{ flex: 1, gap: 6 }}>
          <ProgressBar value={Math.min(1, semana.nestaSemana / Math.max(1, meta))} />
          <Txt variant="tiny">
            {semana.nestaSemana} de {meta} treinos nesta semana
          </Txt>
        </View>
        <Txt variant="tiny" style={{ textAlign: 'right' }}>
          {semana.totalFicha} {semana.totalFicha === 1 ? 'treino' : 'treinos'}
          {'\n'}com esta ficha
        </Txt>
      </View>
    </View>
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
            {p.dias.length} {p.dias.length === 1 ? 'treino' : 'treinos'} · {editavel ? 'criada neste celular' : `de ${p.dono}`}
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

      {atual ? (
        <SeusTreinos p={atual} editavel={minhas.some((p) => p.id === atual.id)} />
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

const styles = StyleSheet.create({
  ficha: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  fichaTopo: { backgroundColor: colors.surface2, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 2 },
  dia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surface2,
  },
  diaProximo: { borderColor: colors.accent, marginTop: 8 },
  selo: {
    position: 'absolute',
    top: -11,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surface },
  play: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playSecundario: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.accent },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
