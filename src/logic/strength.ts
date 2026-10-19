import type { ExerciseHistoryEntry, LoggedSet } from './types';

/** 1RM estimado pela fórmula de Epley. */
export function estimate1RM(pesoKg: number, reps: number): number {
  if (pesoKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return pesoKg;
  return pesoKg * (1 + reps / 30);
}

export function workingSets(sets: LoggedSet[]): LoggedSet[] {
  return sets.filter((s) => !s.aquecimento && s.reps != null && s.reps > 0);
}

export function setVolume(s: LoggedSet): number {
  return (s.pesoKg ?? 0) * (s.reps ?? 0);
}

export function totalVolume(sets: LoggedSet[]): number {
  return workingSets(sets).reduce((acc, s) => acc + setVolume(s), 0);
}

export function bestE1RM(sets: LoggedSet[]): number {
  return workingSets(sets).reduce((best, s) => Math.max(best, estimate1RM(s.pesoKg ?? 0, s.reps ?? 0)), 0);
}

export function maxWeight(sets: LoggedSet[]): number {
  return workingSets(sets).reduce((best, s) => Math.max(best, s.pesoKg ?? 0), 0);
}

export function maxReps(sets: LoggedSet[]): number {
  return workingSets(sets).reduce((best, s) => Math.max(best, s.reps ?? 0), 0);
}

export function maxDuration(sets: LoggedSet[]): number {
  return sets.filter((s) => !s.aquecimento).reduce((best, s) => Math.max(best, s.duracaoSeg ?? 0), 0);
}

export interface PersonalBests {
  pesoMax: number;
  e1rm: number;
  volumeSessao: number;
  repsMax: number;
  duracaoMax: number;
}

export function personalBests(history: ExerciseHistoryEntry[]): PersonalBests {
  return history.reduce<PersonalBests>(
    (acc, h) => ({
      pesoMax: Math.max(acc.pesoMax, maxWeight(h.sets)),
      e1rm: Math.max(acc.e1rm, bestE1RM(h.sets)),
      volumeSessao: Math.max(acc.volumeSessao, totalVolume(h.sets)),
      repsMax: Math.max(acc.repsMax, maxReps(h.sets)),
      duracaoMax: Math.max(acc.duracaoMax, maxDuration(h.sets)),
    }),
    { pesoMax: 0, e1rm: 0, volumeSessao: 0, repsMax: 0, duracaoMax: 0 },
  );
}

export type RecordKind = 'peso' | 'e1rm' | 'volume' | 'reps' | 'tempo';

export const RECORD_LABELS: Record<RecordKind, string> = {
  peso: 'Maior carga',
  e1rm: 'Maior força estimada (1RM)',
  volume: 'Maior volume',
  reps: 'Mais repetições',
  tempo: 'Maior tempo',
};

/**
 * Recordes batidos na sessão atual comparando com o histórico anterior.
 * Na primeira vez que o exercício é feito não há recorde (não há com o que comparar).
 * Para exercícios assistidos, "maior carga" não é recorde (menos peso é melhor).
 */
export function detectRecords(
  current: LoggedSet[],
  previous: ExerciseHistoryEntry[],
  opts: { assistido?: boolean; porTempo?: boolean } = {},
): RecordKind[] {
  if (previous.length === 0) return [];
  const best = personalBests(previous);
  const out: RecordKind[] = [];
  if (opts.porTempo) {
    if (maxDuration(current) > best.duracaoMax && best.duracaoMax > 0) out.push('tempo');
    return out;
  }
  const hasLoad = maxWeight(current) > 0;
  if (hasLoad && !opts.assistido) {
    if (maxWeight(current) > best.pesoMax) out.push('peso');
    if (bestE1RM(current) > best.e1rm + 0.01) out.push('e1rm');
    if (totalVolume(current) > best.volumeSessao) out.push('volume');
  } else if (!hasLoad) {
    if (maxReps(current) > best.repsMax) out.push('reps');
  }
  return out;
}

export function roundToStep(value: number, step: number): number {
  if (step <= 0) return Math.round(value * 2) / 2;
  return Math.max(step, Math.round(value / step) * step);
}

export function formatKg(v: number | null | undefined): string {
  if (v == null) return '–';
  return Number.isInteger(v) ? `${v}` : v.toFixed(1).replace('.', ',');
}
