import type { Exercise, Muscle } from '@/catalog/types';

import { hoursBetween } from './dates';
import type { TimedSet } from './types';

/** Horas para um grupo muscular se recuperar totalmente de um treino forte. */
export const RECOVERY_HOURS: Record<Muscle, number> = {
  quadriceps: 72,
  gluteos: 72,
  posteriores: 72,
  dorsais: 72,
  peitoral: 72,
  lombar: 72,
  adutores: 60,
  'gluteo-medio': 48,
  trapezio: 48,
  'ombro-anterior': 48,
  'ombro-lateral': 48,
  'ombro-posterior': 48,
  biceps: 48,
  triceps: 48,
  antebraco: 36,
  abdomen: 36,
  obliquos: 36,
  panturrilha: 36,
};

/** Quantas séries "equivalentes" deixam o músculo totalmente fatigado. */
const SATURATION_SETS = 6;
const SECONDARY_WEIGHT = 0.5;

type Lookup = (id: string) => Exercise | undefined;

function muscleContributions(ex: Exercise): [Muscle, number][] {
  return [
    ...ex.primarios.map((m) => [m, 1] as [Muscle, number]),
    ...ex.secundarios.map((m) => [m, SECONDARY_WEIGHT] as [Muscle, number]),
  ];
}

/**
 * Recuperação de cada músculo de 0 (acabou de treinar pesado) a 1 (recuperado).
 * Cada série conta menos à medida que o tempo passa, até zerar no tempo de recuperação.
 */
export function muscleRecovery(sets: TimedSet[], lookup: Lookup, now: Date = new Date()): Record<Muscle, number> {
  const fatigue = {} as Record<Muscle, number>;
  for (const m of Object.keys(RECOVERY_HOURS) as Muscle[]) fatigue[m] = 0;
  for (const s of sets) {
    if (s.aquecimento) continue;
    const ex = lookup(s.exercicioId);
    if (!ex) continue;
    const h = hoursBetween(s.concluidaEm, now);
    if (h < 0) continue;
    for (const [m, w] of muscleContributions(ex)) {
      const decay = Math.max(0, 1 - h / RECOVERY_HOURS[m]);
      fatigue[m] += w * decay;
    }
  }
  const out = {} as Record<Muscle, number>;
  for (const m of Object.keys(fatigue) as Muscle[]) {
    out[m] = 1 - Math.min(1, fatigue[m] / SATURATION_SETS);
  }
  return out;
}

/** Séries por músculo (principal = 1, secundário = 0,5). */
export function weeklyVolume(sets: TimedSet[], lookup: Lookup): Record<Muscle, number> {
  const vol = {} as Record<Muscle, number>;
  for (const m of Object.keys(RECOVERY_HOURS) as Muscle[]) vol[m] = 0;
  for (const s of sets) {
    if (s.aquecimento) continue;
    const ex = lookup(s.exercicioId);
    if (!ex) continue;
    for (const [m, w] of muscleContributions(ex)) vol[m] += w;
  }
  return vol;
}

/** Músculos trabalhados (com intensidade 0..1) para desenhar no mapa de um treino. */
export function sessionMuscleIntensity(exerciseIds: { exercicioId: string; series: number }[], lookup: Lookup): Partial<Record<Muscle, number>> {
  const vol: Partial<Record<Muscle, number>> = {};
  for (const { exercicioId, series } of exerciseIds) {
    const ex = lookup(exercicioId);
    if (!ex) continue;
    for (const [m, w] of muscleContributions(ex)) vol[m] = (vol[m] ?? 0) + w * series;
  }
  const out: Partial<Record<Muscle, number>> = {};
  for (const [m, v] of Object.entries(vol) as [Muscle, number][]) out[m] = Math.min(1, v / SATURATION_SETS);
  return out;
}

export interface MuscleInsight {
  muscle: Muscle;
  tipo: 'recuperando' | 'pouco-treinado';
}

/**
 * Avisos para a tela inicial:
 * - músculos do treino de hoje que ainda estão se recuperando;
 * - músculos que a ficha trabalha mas que tiveram poucas séries na semana.
 */
export function muscleInsights(
  recovery: Record<Muscle, number>,
  volume: Record<Muscle, number>,
  todaysMuscles: Muscle[],
  programMuscles: Muscle[],
): MuscleInsight[] {
  const out: MuscleInsight[] = [];
  for (const m of todaysMuscles) {
    if (recovery[m] < 0.4) out.push({ muscle: m, tipo: 'recuperando' });
  }
  for (const m of programMuscles) {
    if (volume[m] < 3 && recovery[m] > 0.9 && !out.some((i) => i.muscle === m)) {
      out.push({ muscle: m, tipo: 'pouco-treinado' });
    }
  }
  return out;
}
