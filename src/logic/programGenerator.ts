import type { Exercise, Goal, MovementPattern, Program, RoutineDay, RoutineExercise } from '@/catalog/types';

import { GOAL_REP_RANGE } from './progression';

export type DiasPorSemana = 2 | 3 | 4 | 5;
export type DuracaoTreino = 30 | 45 | 60;
export type FocoTreino = 'equilibrado' | 'inferiores' | 'superiores';

export interface GeneratorInput {
  nome: string;
  objetivo: Goal;
  dias: DiasPorSemana;
  duracaoMin: DuracaoTreino;
  foco: FocoTreino;
}

export const FOCO_LABELS: Record<FocoTreino, string> = {
  equilibrado: 'Corpo todo por igual',
  inferiores: 'Mais pernas e glúteos',
  superiores: 'Mais tronco e braços',
};

/** Cada vaga do treino é um tipo de movimento; o exercício é escolhido no catálogo atual. */
type Slot = MovementPattern;

interface Template {
  foco: string;
  slots: Slot[];
}

const T = {
  pernasQuad: {
    foco: 'Quadríceps e glúteos',
    slots: ['agachamento', 'extensao-joelho', 'extensao-quadril', 'abducao-quadril', 'panturrilha', 'flexao-joelho', 'core-flexao'],
  },
  pernasPost: {
    foco: 'Posteriores e glúteos',
    slots: ['dobradica-quadril', 'flexao-joelho', 'extensao-quadril', 'aducao-quadril', 'agachamento', 'core-estabilidade', 'panturrilha'],
  },
  gluteos: {
    foco: 'Glúteos e core',
    slots: ['extensao-quadril', 'abducao-quadril', 'dobradica-quadril', 'extensao-quadril', 'agachamento', 'core-estabilidade', 'core-flexao'],
  },
  superiores: {
    foco: 'Peito, costas, ombros e braços',
    slots: ['empurrar-horizontal', 'puxar-vertical', 'puxar-horizontal', 'empurrar-vertical', 'elevacao-lateral', 'flexao-cotovelo', 'extensao-cotovelo'],
  },
  superioresB: {
    foco: 'Costas, peito, ombros e braços',
    slots: ['puxar-horizontal', 'empurrar-horizontal', 'puxar-vertical', 'crucifixo', 'posterior-ombro', 'extensao-cotovelo', 'flexao-cotovelo'],
  },
  empurrar: {
    foco: 'Peito, ombros e tríceps',
    slots: ['empurrar-horizontal', 'empurrar-vertical', 'crucifixo', 'elevacao-lateral', 'extensao-cotovelo', 'empurrar-horizontal', 'core-flexao'],
  },
  puxar: {
    foco: 'Costas, posterior de ombro e bíceps',
    slots: ['puxar-vertical', 'puxar-horizontal', 'posterior-ombro', 'flexao-cotovelo', 'puxar-horizontal', 'core-estabilidade', 'flexao-cotovelo'],
  },
  corpoA: {
    foco: 'Corpo inteiro',
    slots: ['agachamento', 'empurrar-horizontal', 'puxar-vertical', 'flexao-joelho', 'empurrar-vertical', 'core-estabilidade', 'abducao-quadril'],
  },
  corpoB: {
    foco: 'Corpo inteiro',
    slots: ['extensao-quadril', 'puxar-horizontal', 'crucifixo', 'dobradica-quadril', 'elevacao-lateral', 'core-flexao', 'extensao-joelho'],
  },
  corpoC: {
    foco: 'Corpo inteiro',
    slots: ['dobradica-quadril', 'empurrar-vertical', 'puxar-horizontal', 'extensao-joelho', 'crucifixo', 'abducao-quadril', 'core-flexao'],
  },
} satisfies Record<string, Template>;

const PLANOS: Record<DiasPorSemana, Record<FocoTreino, Template[]>> = {
  2: {
    equilibrado: [T.corpoA, T.corpoB],
    inferiores: [T.pernasQuad, T.superiores],
    superiores: [T.corpoA, T.corpoB],
  },
  3: {
    equilibrado: [T.corpoA, T.corpoB, T.corpoC],
    inferiores: [T.pernasQuad, T.superiores, T.pernasPost],
    superiores: [T.empurrar, T.pernasQuad, T.puxar],
  },
  4: {
    equilibrado: [T.superiores, T.pernasQuad, T.superioresB, T.pernasPost],
    inferiores: [T.pernasQuad, T.superiores, T.pernasPost, T.gluteos],
    superiores: [T.empurrar, T.pernasQuad, T.puxar, T.superiores],
  },
  5: {
    equilibrado: [T.empurrar, T.pernasQuad, T.puxar, T.pernasPost, T.superiores],
    inferiores: [T.pernasQuad, T.superiores, T.pernasPost, T.superioresB, T.gluteos],
    superiores: [T.empurrar, T.pernasQuad, T.puxar, T.superiores, T.pernasPost],
  },
};

/** Quantos exercícios de musculação cabem no tempo do treino. */
const EXERCICIOS_POR_DURACAO: Record<DuracaoTreino, number> = { 30: 4, 45: 5, 60: 6 };

const DESCANSO: Record<Goal, { composto: number; isolado: number }> = {
  hipertrofia: { composto: 120, isolado: 75 },
  emagrecimento: { composto: 75, isolado: 60 },
  condicionamento: { composto: 60, isolado: 45 },
};

const COMPOSTOS: MovementPattern[] = [
  'agachamento',
  'dobradica-quadril',
  'empurrar-horizontal',
  'empurrar-vertical',
  'puxar-horizontal',
  'puxar-vertical',
];

/** Equipamentos livres pedem mais técnica: para iniciantes, máquinas vêm primeiro. */
const LIVRES = new Set(['banco-halteres', 'smith']);

function score(ex: Exercise): number {
  let s = 0;
  if (!ex.maquinaIds.some((m) => LIVRES.has(m))) s += 2;
  if (ex.tipo === 'carga') s += 1;
  return s;
}

function pick(slot: Slot, exercises: Exercise[], used: Set<string>): Exercise | undefined {
  let best: Exercise | undefined;
  for (const ex of exercises) {
    if (ex.padrao !== slot || used.has(ex.id)) continue;
    if (!best || score(ex) > score(best)) best = ex;
  }
  return best;
}

function routineFor(ex: Exercise, objetivo: Goal): RoutineExercise {
  const [repsMin, repsMax] = GOAL_REP_RANGE[objetivo];
  const composto = COMPOSTOS.includes(ex.padrao);
  const descansoSeg = DESCANSO[objetivo][composto ? 'composto' : 'isolado'];
  if (ex.tipo === 'tempo') return { exercicioId: ex.id, series: 3, repsMin: 1, repsMax: 1, descansoSeg: 45, duracaoSeg: 30 };
  if (ex.padrao === 'core-flexao') return { exercicioId: ex.id, series: 3, repsMin: 12, repsMax: 15, descansoSeg: 45 };
  return { exercicioId: ex.id, series: 3, repsMin, repsMax, descansoSeg };
}

function cardio(exercises: Exercise[], id: string, minutos: number): RoutineExercise | null {
  const ex = exercises.find((e) => e.id === id && e.padrao === 'cardio') ?? exercises.find((e) => e.padrao === 'cardio');
  return ex ? { exercicioId: ex.id, series: 1, repsMin: 1, repsMax: 1, descansoSeg: 60, duracaoSeg: minutos * 60 } : null;
}

/**
 * Monta uma ficha para iniciantes a partir das respostas do cadastro.
 * Usa só exercícios que existem no catálogo atual (e das máquinas da academia).
 */
export function generateProgram(input: GeneratorInput, exercises: Exercise[], id: string): Program {
  const templates = PLANOS[input.dias][input.foco];
  const n = EXERCICIOS_POR_DURACAO[input.duracaoMin];
  const letras = 'ABCDE';

  const dias: RoutineDay[] = templates.map((t, i) => {
    const used = new Set<string>();
    const list: RoutineExercise[] = [];
    const aquecer = cardio(exercises, 'bicicleta', 5);
    if (aquecer) list.push(aquecer);
    let musculacao = 0;
    for (const slot of t.slots) {
      if (musculacao >= n) break;
      const ex = pick(slot, exercises, used);
      if (!ex) continue;
      used.add(ex.id);
      list.push(routineFor(ex, input.objetivo));
      musculacao += 1;
    }
    // Emagrecimento e condicionamento terminam com cardio, se houver tempo.
    if (input.objetivo !== 'hipertrofia' && input.duracaoMin >= 45) {
      const fim = cardio(exercises, 'esteira', input.objetivo === 'emagrecimento' ? 15 : 10);
      if (fim) list.push(fim);
    }
    return { id: letras[i], nome: `Treino ${letras[i]}`, foco: t.foco, exercicios: list };
  });

  return {
    id,
    nome: `Ficha de ${input.nome}`,
    dono: input.nome,
    descricao: `${input.dias}× por semana · ~${input.duracaoMin} min · ${FOCO_LABELS[input.foco].toLowerCase()}`,
    dias,
  };
}

/** Ficha vazia para montar do zero. */
export function emptyProgram(nome: string, id: string): Program {
  return {
    id,
    nome: `Ficha de ${nome}`,
    dono: nome,
    descricao: 'Montada por mim',
    dias: [{ id: 'A', nome: 'Treino A', foco: '', exercicios: [] }],
  };
}

/** Próximo id livre para um novo dia (A, B, C… depois D2, E2…). */
export function nextDayId(dias: RoutineDay[]): string {
  const letras = 'ABCDEFGHIJ';
  for (const l of letras) if (!dias.some((d) => d.id === l)) return l;
  return `D${dias.length + 1}`;
}
