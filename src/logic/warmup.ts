import type { Exercise, MovementPattern } from '@/catalog/types';

import { roundToStep } from './strength';

export interface WarmupSet {
  pesoKg: number | null;
  reps: number;
}

const LOWER: MovementPattern[] = ['agachamento', 'dobradica-quadril', 'extensao-quadril'];
const UPPER: MovementPattern[] = ['empurrar-horizontal', 'empurrar-vertical', 'puxar-horizontal', 'puxar-vertical'];

/** Região do corpo de um exercício composto, ou null se não pede aquecimento próprio. */
function region(ex: Exercise): 'inferior' | 'superior' | null {
  if (ex.tipo !== 'carga' || ex.assistido) return null;
  if (LOWER.includes(ex.padrao)) return 'inferior';
  if (UPPER.includes(ex.padrao)) return 'superior';
  return null;
}

/**
 * Séries de aquecimento para um exercício com a carga de trabalho `pesoKg`:
 * 1×12 com ~50% e, a partir de 30 kg, mais 1×6 com ~75%.
 * Sem carga conhecida (primeira vez): 1×12 leve, a pessoa escolhe o peso.
 */
export function warmupSetsFor(pesoKg: number | null, passoKg: number): WarmupSet[] {
  if (pesoKg == null || pesoKg <= 0) return [{ pesoKg: null, reps: 12 }];
  const step = passoKg > 0 ? passoKg : 2.5;
  if (pesoKg < step * 2) return [];
  const sets: WarmupSet[] = [];
  const leve = roundToStep(pesoKg * 0.5, step);
  if (leve < pesoKg) sets.push({ pesoKg: leve, reps: 12 });
  if (pesoKg >= 30) {
    const medio = roundToStep(pesoKg * 0.75, step);
    if (medio < pesoKg && medio > leve) sets.push({ pesoKg: medio, reps: 6 });
  }
  return sets;
}

/**
 * Índices dos exercícios que recebem aquecimento: o primeiro composto com carga
 * de cada região (pernas/glúteos e tronco/braços). Os seguintes já pegam o corpo quente.
 */
export function warmupTargets(exercises: (Exercise | undefined)[]): number[] {
  const seen = new Set<string>();
  const out: number[] = [];
  exercises.forEach((ex, i) => {
    const r = ex ? region(ex) : null;
    if (!r || seen.has(r)) return;
    seen.add(r);
    out.push(i);
  });
  return out;
}
