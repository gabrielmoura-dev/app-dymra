import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Program } from '@/catalog/types';
import { listDoneSessions } from '@/db/repo';
import type { DoneSession } from '@/logic/week';
import { defaultTrainingDays, planWeek, type PlannedDay } from '@/logic/weekPlan';
import { useRequiredProfile } from '@/state/profile';
import { colors, radius, spacing } from '@/theme';

import { Card, Icon, Txt } from './ui';

const LETRA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NOME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Rótulo curto do treino: "A", "B"… (ou a posição na ficha, se o id for longo). */
function rotulo(p: Program, diaId: string | null) {
  if (!diaId) return '';
  if (diaId.length <= 2) return diaId;
  const i = p.dias.findIndex((d) => d.id === diaId);
  return i >= 0 ? String.fromCharCode(65 + i) : '';
}

function Dia({ d, p }: { d: PlannedDay; p: Program }) {
  const r = rotulo(p, d.diaId);
  const circulo =
    d.status === 'feito'
      ? [styles.circ, { backgroundColor: colors.success, borderColor: colors.success }]
      : d.status === 'planejado'
        ? [styles.circ, { borderColor: colors.accent }, d.hoje && { backgroundColor: colors.accent }]
        : [styles.circ, { borderColor: 'transparent' }];
  const conteudo =
    d.status === 'feito' ? (
      <Icon name="checkmark" size={18} color={colors.accentText} />
    ) : d.status === 'planejado' ? (
      <Txt bold color={d.hoje ? colors.accentText : colors.accent}>
        {r}
      </Txt>
    ) : d.status === 'perdido' ? (
      <Txt color={colors.faint}>–</Txt>
    ) : (
      <View style={styles.ponto} />
    );
  return (
    <Pressable
      disabled={!d.diaId}
      accessibilityLabel={`${NOME[d.diaSemana]}: ${d.status}${r ? ` treino ${r}` : ''}`}
      onPress={() => d.diaId && router.push(`/rotina/${p.id}/${d.diaId}`)}
      style={styles.dia}>
      <Txt variant="tiny" bold color={d.hoje ? colors.text : colors.muted}>
        {LETRA[d.diaSemana]}
      </Txt>
      <View style={circulo}>{conteudo}</View>
      <Txt variant="tiny" color={d.status === 'feito' ? colors.success : colors.faint}>
        {d.status === 'feito' ? r : d.data.getDate()}
      </Txt>
    </Pressable>
  );
}

/** Faixa de segunda a domingo com o que foi feito e o que está previsto na semana. */
export function WeekStrip({ p }: { p: Program }) {
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const [sessoes, setSessoes] = useState<DoneSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listDoneSessions(db).then((s) => alive && setSessoes(s));
      return () => {
        alive = false;
      };
    }, [db]),
  );

  // Dias do lembrete; sem lembrete, dias sugeridos pela meta semanal.
  const diasTreino = profile.lembreteTreinoDias.length > 0 ? profile.lembreteTreinoDias : defaultTrainingDays(profile.metaSemanal ?? p.dias.length);
  const semana = planWeek(p, sessoes, diasTreino);
  const hoje = semana.find((d) => d.hoje);
  const proximo = semana.find((d) => d.status === 'planejado');
  const nomeDe = (id: string | null) => p.dias.find((d) => d.id === id)?.nome ?? '';
  const feitos = semana.filter((d) => d.status === 'feito').length;

  const frase =
    hoje?.status === 'feito'
      ? 'Treino de hoje feito ✓'
      : hoje?.status === 'planejado'
        ? `Hoje: ${nomeDe(hoje.diaId)}`
        : proximo
          ? `Próximo: ${nomeDe(proximo.diaId)} na ${NOME[proximo.diaSemana]}`
          : 'Semana encerrada';

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt variant="h3">{frase}</Txt>
        <Txt variant="tiny">
          {feitos} {feitos === 1 ? 'feito' : 'feitos'} na semana
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {semana.map((d) => (
          <Dia key={d.data.toISOString()} d={d} p={p} />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  dia: { alignItems: 'center', gap: 4, minWidth: 40, paddingVertical: 2, borderRadius: radius.md },
  circ: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ponto: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
});
