import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { EXERCISES, getExercise, getMachine, MUSCLE_LABELS } from '@/catalog';
import type { Exercise, Muscle } from '@/catalog/types';
import { frequentIds, MIN_PARA_ENXUGAR, rankByUsage } from '@/logic/usage';
import { useExerciseUsage } from '@/state/usage';
import { colors } from '@/theme';

import { TextField } from './inputs';
import { Button, Card, Chip, Empty, Icon, Row, Txt } from './ui';

const FILTERS: { label: string; muscles: Muscle[] }[] = [
  { label: 'Pernas', muscles: ['quadriceps', 'posteriores', 'adutores', 'panturrilha'] },
  { label: 'Glúteos', muscles: ['gluteos', 'gluteo-medio'] },
  { label: 'Peito', muscles: ['peitoral'] },
  { label: 'Costas', muscles: ['dorsais', 'trapezio', 'lombar'] },
  { label: 'Ombros', muscles: ['ombro-anterior', 'ombro-lateral', 'ombro-posterior'] },
  { label: 'Braços', muscles: ['biceps', 'triceps', 'antebraco'] },
  { label: 'Abdômen', muscles: ['abdomen', 'obliquos'] },
];

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Texto pesquisável de cada exercício (nome, músculos, máquinas), montado uma vez só. */
const SEARCH_INDEX = new Map(
  EXERCISES.map((e) => [
    e.id,
    normalize(
      [e.nome, ...e.primarios.map((m) => MUSCLE_LABELS[m]), ...e.maquinaIds.map((m) => getMachine(m)?.nome ?? '')].join(' '),
    ),
  ]),
);

export function filterExercises(query: string, filter: Muscle[] | null): Exercise[] {
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return EXERCISES.filter((e) => {
    if (filter && !e.primarios.some((m) => filter.includes(m)) && !(filter.length === 0 && e.padrao === 'cardio')) return false;
    const hay = SEARCH_INDEX.get(e.id) ?? '';
    return words.every((w) => hay.includes(w));
  });
}

export function ExercisePicker({ onPick }: { onPick: (e: Exercise) => void }) {
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<string | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const usage = useExerciseUsage();
  const frequentes = useMemo(
    () => frequentIds(usage).map(getExercise).filter((e): e is Exercise => e != null),
    [usage],
  );
  // Com histórico suficiente, a lista inicial mostra só o que a pessoa costuma fazer; o resto fica na busca.
  const enxuta = !verTodos && q.trim() === '' && filtro == null && frequentes.length >= MIN_PARA_ENXUGAR;
  const list = useMemo(() => {
    if (enxuta) return frequentes;
    const muscles = filtro === 'Cardio' ? [] : (FILTERS.find((f) => f.label === filtro)?.muscles ?? null);
    return rankByUsage(filterExercises(q, muscles), (e) => e.id, usage);
  }, [enxuta, frequentes, q, filtro, usage]);

  return (
    <View style={{ gap: 12 }}>
      <TextField value={q} onChangeText={setQ} placeholder="Buscar exercício, músculo ou máquina" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Chip label="Todos" active={filtro == null} onPress={() => setFiltro(null)} />
        {FILTERS.map((f) => (
          <Chip key={f.label} label={f.label} active={filtro === f.label} onPress={() => setFiltro(f.label)} />
        ))}
        <Chip label="Cardio" active={filtro === 'Cardio'} onPress={() => setFiltro('Cardio')} />
      </ScrollView>
      {enxuta ? <Txt variant="label">Seus mais usados</Txt> : null}
      {list.length === 0 ? <Empty icon="search" title="Nada encontrado" /> : null}
      {list.map((e) => (
        <Card key={e.id} onPress={() => onPick(e)} style={{ paddingVertical: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt bold>{e.nome}</Txt>
              <Txt variant="tiny">
                {e.primarios.map((m) => MUSCLE_LABELS[m]).join(', ') || 'Cardio'} · {getMachine(e.maquinaIds[0])?.nome}
              </Txt>
            </View>
            {(usage.get(e.id)?.vezes ?? 0) >= 2 ? (
              <Txt variant="tiny" color={colors.accent}>
                {usage.get(e.id)!.vezes}×
              </Txt>
            ) : null}
            <Icon name="chevron-forward" color={colors.muted} size={18} />
          </Row>
        </Card>
      ))}
      {enxuta ? (
        <Button
          small
          variant="ghost"
          icon="list"
          title={`Ver todos os ${EXERCISES.length} exercícios`}
          onPress={() => setVerTodos(true)}
        />
      ) : null}
    </View>
  );
}
