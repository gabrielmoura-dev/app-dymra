import { CORE_CARDIO_EXERCISES } from './exercises-core';
import { LOWER_EXERCISES } from './exercises-lower';
import { UPPER_EXERCISES } from './exercises-upper';
import { MACHINES } from './machines';
import { PROGRAMS } from './programs';
import type { Exercise, Machine, Muscle, Program } from './types';

/** Suba este número sempre que o catálogo mudar (aparece em Perfil). */
export const CATALOG_VERSION = '2026.10.19-exemplo';

export const EXERCISES: Exercise[] = [...LOWER_EXERCISES, ...UPPER_EXERCISES, ...CORE_CARDIO_EXERCISES];

const exerciseById = new Map(EXERCISES.map((e) => [e.id, e]));
const machineById = new Map(MACHINES.map((m) => [m.id, m]));
const programById = new Map(PROGRAMS.map((p) => [p.id, p]));

export { MACHINES, PROGRAMS };

export function getExercise(id: string): Exercise | undefined {
  return exerciseById.get(id);
}

export function getMachine(id: string): Machine | undefined {
  return machineById.get(id);
}

export function getProgram(id: string | null | undefined): Program | undefined {
  return id ? programById.get(id) : undefined;
}

export function exercisesForMachine(machineId: string): Exercise[] {
  return EXERCISES.filter((e) => e.maquinaIds.includes(machineId));
}

/** Passo de carga do exercício: o menor passo entre as máquinas onde ele é feito. */
export function loadStepFor(ex: Exercise): number {
  const steps = ex.maquinaIds
    .map((id) => machineById.get(id)?.passoKg ?? 0)
    .filter((s) => s > 0);
  return steps.length ? Math.min(...steps) : 2.5;
}

export const MUSCLE_LABELS: Record<Muscle, string> = {
  peitoral: 'Peitoral',
  'ombro-anterior': 'Ombro (frente)',
  'ombro-lateral': 'Ombro (lateral)',
  'ombro-posterior': 'Ombro (posterior)',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebraco: 'Antebraço',
  abdomen: 'Abdômen',
  obliquos: 'Oblíquos',
  dorsais: 'Dorsais',
  trapezio: 'Trapézio',
  lombar: 'Lombar',
  gluteos: 'Glúteos',
  'gluteo-medio': 'Glúteo médio',
  quadriceps: 'Quadríceps',
  posteriores: 'Posteriores da coxa',
  adutores: 'Adutores',
  panturrilha: 'Panturrilha',
};

export const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as Muscle[];

/** Valida referências cruzadas do catálogo. Usado nos testes. */
export function validateCatalog(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const e of EXERCISES) {
    if (ids.has(e.id)) errors.push(`Exercício duplicado: ${e.id}`);
    ids.add(e.id);
    for (const m of e.maquinaIds) if (!machineById.has(m)) errors.push(`${e.id}: máquina inexistente ${m}`);
    for (const a of e.alternativas ?? []) if (!exerciseById.has(a)) errors.push(`${e.id}: alternativa inexistente ${a}`);
    if (e.tecnica.execucao.length === 0) errors.push(`${e.id}: sem execução`);
  }
  for (const p of PROGRAMS) {
    for (const d of p.dias) {
      for (const r of d.exercicios) {
        if (!exerciseById.has(r.exercicioId)) errors.push(`${p.id}/${d.id}: exercício inexistente ${r.exercicioId}`);
        if (r.repsMin > r.repsMax) errors.push(`${p.id}/${d.id}/${r.exercicioId}: faixa de reps invertida`);
      }
    }
  }
  return errors;
}
