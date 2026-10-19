import type { Exercise, Muscle } from '@/catalog/types';

export interface Alternative {
  exercise: Exercise;
  /** Máquina onde fazer a alternativa. */
  machineId: string;
  score: number;
  motivo: string;
}

/** Espaços que nunca ficam "ocupados" (dá para fazer outro exercício ao lado). */
const ALWAYS_AVAILABLE = ['colchonete'];

function overlap(a: Muscle[], b: Muscle[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const inter = a.filter((m) => setB.has(m)).length;
  const union = new Set([...a, ...b]).size;
  return inter / union;
}

/**
 * Sugere o que fazer quando a máquina está ocupada.
 * Ordem: o mesmo exercício em outra máquina → alternativas escolhidas a dedo
 * → mesmo padrão de movimento → mesmos músculos.
 */
export function findAlternatives(
  original: Exercise,
  all: Exercise[],
  busyMachineId: string | null,
  limit = 6,
): Alternative[] {
  const busy = busyMachineId ?? original.maquinaIds[0] ?? null;
  const results: Alternative[] = [];

  // 1. Mesmo exercício, outra máquina.
  for (const m of original.maquinaIds) {
    if (m === busy) continue;
    results.push({ exercise: original, machineId: m, score: 1000, motivo: 'Mesmo exercício em outra máquina' });
  }

  const manual = original.alternativas ?? [];
  for (const cand of all) {
    if (cand.id === original.id) continue;
    if ((cand.padrao === 'cardio') !== (original.padrao === 'cardio')) continue;

    const manualIdx = manual.indexOf(cand.id);
    const samePattern = cand.padrao === original.padrao;
    const primary = overlap(cand.primarios, original.primarios);
    const broad = overlap([...cand.primarios, ...cand.secundarios], [...original.primarios, ...original.secundarios]);

    let score = 0;
    if (manualIdx >= 0) score += 40 - manualIdx * 2;
    if (samePattern) score += 35;
    score += primary * 30 + broad * 10;
    if (cand.tipo === original.tipo) score += 5;
    if (!!cand.unilateral !== !!original.unilateral) score -= 3;
    if (score < 18) continue;

    let motivo = 'Movimento parecido';
    if (samePattern && primary >= 0.5) motivo = 'Mesmo movimento e mesmos músculos';
    else if (samePattern) motivo = 'Mesmo tipo de movimento';
    else if (primary >= 0.5) motivo = 'Trabalha os mesmos músculos';

    const machine = cand.maquinaIds.find((m) => m !== busy || ALWAYS_AVAILABLE.includes(m));
    if (!machine) continue;
    results.push({ exercise: cand, machineId: machine, score, motivo });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
