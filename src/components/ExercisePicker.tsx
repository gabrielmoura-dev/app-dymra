import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { EXERCISES, getExercise, getMachine, MUSCLE_LABELS } from '@/catalog';
import type { Exercise, Muscle } from '@/catalog/types';
import { frequentIds, MIN_VEZES, rankByUsage } from '@/logic/usage';
import { useExerciseUsage } from '@/state/usage';
import { colors } from '@/theme';

import { FavoriteStar } from './FavoriteStar';
import { TextField } from './inputs';
import { Card, Empty, Recolhivel, Row, Txt } from './ui';

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

const MAIS_USADOS = 'Seus mais usados';

/** Os mesmos grupos do antigo filtro (Pernas, Glúteos…), agora como cards que se abrem. */
const GRUPOS: { label: string; muscles: Muscle[] }[] = [...FILTERS, { label: 'Cardio', muscles: [] }];

/** Um exercício da lista: nome com a estrela de favorito no canto direito e, embaixo, os músculos. */
export function ExerciseRow({ e, vezes = 0, onPick, inset }: { e: Exercise; vezes?: number; onPick: () => void; inset?: boolean }) {
  return (
    <Card onPress={onPick} style={[{ paddingVertical: 12, gap: 2 }, inset && { backgroundColor: colors.surface2 }]}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Txt bold style={{ flex: 1 }}>
          {e.nome}
        </Txt>
        <FavoriteStar exercicioId={e.id} />
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="tiny" style={{ flex: 1 }}>
          {e.primarios.map((m) => MUSCLE_LABELS[m]).join(', ') || 'Cardio'}
        </Txt>
        {vezes >= MIN_VEZES ? (
          <Txt variant="tiny" color={colors.accent}>
            {vezes}×
          </Txt>
        ) : null}
      </Row>
    </Card>
  );
}

/**
 * Sem busca: um card com os mais usados (aberto) e um card recolhido por grupo muscular.
 * Com busca: lista direta dos resultados, mais usados primeiro.
 */
export function ExercisePicker({ onPick }: { onPick: (e: Exercise) => void }) {
  const [q, setQ] = useState('');
  const usage = useExerciseUsage();
  const frequentes = useMemo(
    () => frequentIds(usage).map(getExercise).filter((e): e is Exercise => e != null),
    [usage],
  );
  // Tudo começa fechado: a lista só aparece quando a pessoa toca num grupo.
  const [aberto, setAberto] = useState<string | null>(null);
  const toggle = (g: string) => setAberto(aberto === g ? null : g);

  const buscando = q.trim() !== '';
  const resultados = useMemo(
    () => (buscando ? rankByUsage(filterExercises(q, null), (e) => e.id, usage) : []),
    [buscando, q, usage],
  );
  const grupos = useMemo(
    () =>
      GRUPOS.map(({ label, muscles }) => ({
        g: label,
        lista: rankByUsage(filterExercises('', muscles), (e) => e.id, usage),
      })).filter(({ lista }) => lista.length > 0),
    [usage],
  );

  const vezes = (e: Exercise) => usage.get(e.id)?.vezes ?? 0;

  return (
    <View style={{ gap: 12 }}>
      <TextField value={q} onChangeText={setQ} placeholder="Buscar exercício, músculo ou máquina" />
      {buscando ? (
        <>
          {resultados.length === 0 ? <Empty icon="search" title="Nada encontrado" /> : null}
          {resultados.map((e) => (
            <ExerciseRow key={e.id} e={e} vezes={vezes(e)} onPick={() => onPick(e)} />
          ))}
        </>
      ) : (
        <>
          {frequentes.length > 0 ? (
            <Recolhivel
              titulo={MAIS_USADOS}
              icon="star"
              iconColor={colors.accent}
              resumo={`${frequentes.length} ${frequentes.length === 1 ? 'exercício' : 'exercícios'}`}
              aberto={aberto === MAIS_USADOS}
              onToggle={() => toggle(MAIS_USADOS)}>
              {frequentes.map((e) => (
                <ExerciseRow key={e.id} e={e} vezes={vezes(e)} onPick={() => onPick(e)} inset />
              ))}
            </Recolhivel>
          ) : null}
          {grupos.map(({ g, lista }) => (
            <Recolhivel
              key={g}
              titulo={g}
              resumo={`${lista.length} ${lista.length === 1 ? 'exercício' : 'exercícios'}`}
              aberto={aberto === g}
              onToggle={() => toggle(g)}>
              {lista.map((e) => (
                <ExerciseRow key={e.id} e={e} vezes={vezes(e)} onPick={() => onPick(e)} inset />
              ))}
            </Recolhivel>
          ))}
        </>
      )}
    </View>
  );
}
