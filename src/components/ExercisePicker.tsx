import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { EXERCISES, getMachine, MUSCLE_LABELS } from '@/catalog';
import type { Exercise, Muscle } from '@/catalog/types';
import { colors } from '@/theme';

import { TextField } from './inputs';
import { Card, Chip, Empty, Icon, Row, Txt } from './ui';

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

export function filterExercises(query: string, filter: Muscle[] | null): Exercise[] {
  const q = normalize(query.trim());
  return EXERCISES.filter((e) => {
    if (filter && !e.primarios.some((m) => filter.includes(m)) && !(filter.length === 0 && e.padrao === 'cardio')) return false;
    if (!q) return true;
    const hay = normalize(
      [e.nome, ...e.primarios.map((m) => MUSCLE_LABELS[m]), ...e.maquinaIds.map((m) => getMachine(m)?.nome ?? '')].join(' '),
    );
    return q.split(/\s+/).every((w) => hay.includes(w));
  });
}

export function ExercisePicker({ onPick }: { onPick: (e: Exercise) => void }) {
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<string | null>(null);
  const list = useMemo(() => {
    const muscles = filtro === 'Cardio' ? [] : (FILTERS.find((f) => f.label === filtro)?.muscles ?? null);
    return filterExercises(q, muscles);
  }, [q, filtro]);

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
            <Icon name="chevron-forward" color={colors.muted} size={18} />
          </Row>
        </Card>
      ))}
    </View>
  );
}
