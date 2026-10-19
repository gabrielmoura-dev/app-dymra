import type { Program, RoutineDay } from '@/catalog/types';

import { totalVolume, workingSets } from './strength';
import type { LoggedSet } from './types';

/** Próximo dia da ficha: o seguinte ao último feito; se nunca treinou, o primeiro. */
export function nextRoutineDay(program: Program, lastDayId: string | null, lastProgramId: string | null): RoutineDay {
  if (!lastDayId || lastProgramId !== program.id) return program.dias[0];
  const idx = program.dias.findIndex((d) => d.id === lastDayId);
  if (idx < 0) return program.dias[0];
  return program.dias[(idx + 1) % program.dias.length];
}

export interface SessionStats {
  volumeKg: number;
  series: number;
  reps: number;
  exercicios: number;
}

export function sessionStats(exercises: { sets: LoggedSet[] }[]): SessionStats {
  let volumeKg = 0;
  let series = 0;
  let reps = 0;
  let exercicios = 0;
  for (const e of exercises) {
    const work = e.sets.filter((s) => !s.aquecimento);
    if (work.length === 0) continue;
    exercicios += 1;
    series += work.length;
    reps += workingSets(work).reduce((a, s) => a + (s.reps ?? 0), 0);
    volumeKg += totalVolume(work);
  }
  return { volumeKg, series, reps, exercicios };
}

export interface ExerciseComparison {
  exercicioId: string;
  deltaVolumeKg: number;
  deltaPesoKg: number;
  deltaReps: number;
}

/** Compara cada exercício com a última vez que ele foi feito. */
export function compareExercise(exercicioId: string, current: LoggedSet[], previous: LoggedSet[] | null): ExerciseComparison | null {
  if (!previous || previous.length === 0) return null;
  const cur = workingSets(current);
  const prev = workingSets(previous);
  if (cur.length === 0 || prev.length === 0) return null;
  const maxW = (s: LoggedSet[]) => Math.max(...s.map((x) => x.pesoKg ?? 0));
  const sumR = (s: LoggedSet[]) => s.reduce((a, x) => a + (x.reps ?? 0), 0);
  return {
    exercicioId,
    deltaVolumeKg: totalVolume(cur) - totalVolume(prev),
    deltaPesoKg: maxW(cur) - maxW(prev),
    deltaReps: sumR(cur) - sumR(prev),
  };
}

const MESSAGES_PR = [
  'Recorde novo! Seu corpo está respondendo ao treino. 🔥',
  'Você ficou mais forte que da última vez. Isso é progresso de verdade!',
  'Recorde pessoal! Guarda esse dia na memória. 💪',
];
const MESSAGES_UP = [
  'Mais volume que da última vez. Consistência vence!',
  'Você superou o seu último treino. Bora manter o ritmo!',
  'Evoluindo treino a treino. Continua assim!',
];
const MESSAGES_DEFAULT = [
  'Treino feito! O mais difícil é aparecer, e você apareceu.',
  'Mais um treino na conta. Cada série soma.',
  'Missão cumprida! Agora é hidratar e descansar.',
  'Feito! Disciplina de hoje é resultado de amanhã.',
];

export function motivationalMessage(seed: number, hasRecord: boolean, improved: boolean): string {
  const list = hasRecord ? MESSAGES_PR : improved ? MESSAGES_UP : MESSAGES_DEFAULT;
  return list[Math.abs(seed) % list.length];
}

/** Quantas sessões desde a última segunda-feira. */
export function sessionsThisWeek(dates: string[], now: Date = new Date()): number {
  const start = new Date(now);
  const day = (start.getDay() + 6) % 7; // segunda = 0
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return dates.filter((d) => new Date(d) >= start).length;
}
