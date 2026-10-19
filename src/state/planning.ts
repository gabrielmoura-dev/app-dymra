import type { SQLiteDatabase } from 'expo-sqlite';

import { getExercise, loadStepFor } from '@/catalog';
import type { Goal, RoutineDay, RoutineExercise } from '@/catalog/types';
import { getExerciseHistory, startSession, type PlannedExercise } from '@/db/repo';
import { GOAL_REP_RANGE, suggestNext, type Suggestion } from '@/logic/progression';

export async function suggestionFor(
  db: SQLiteDatabase,
  r: RoutineExercise,
  excludeSessionId?: number,
): Promise<Suggestion> {
  const ex = getExercise(r.exercicioId);
  const history = await getExerciseHistory(db, r.exercicioId, 5, excludeSessionId);
  return suggestNext({
    history,
    repsMin: r.repsMin,
    repsMax: r.repsMax,
    series: r.series,
    passoKg: ex ? loadStepFor(ex) : 2.5,
    tipo: ex?.tipo ?? 'carga',
    assistido: ex?.assistido,
    duracaoAlvoSeg: r.duracaoSeg ?? null,
    cardio: ex?.padrao === 'cardio',
  });
}

export async function planExercise(db: SQLiteDatabase, r: RoutineExercise): Promise<PlannedExercise> {
  const s = await suggestionFor(db, r);
  return {
    ...r,
    duracaoSeg: s.duracaoSeg ?? r.duracaoSeg,
    pesoSugeridoKg: s.pesoKg,
    repsSugeridas: s.reps,
  };
}

/** Exercício avulso adicionado no meio do treino. */
export function adHocRoutineExercise(exercicioId: string, objetivo: Goal, descansoSeg: number): RoutineExercise {
  const ex = getExercise(exercicioId);
  const [repsMin, repsMax] = GOAL_REP_RANGE[objetivo];
  if (ex?.tipo === 'tempo') {
    return { exercicioId, series: ex.padrao === 'cardio' ? 1 : 3, repsMin: 1, repsMax: 1, descansoSeg, duracaoSeg: ex.padrao === 'cardio' ? 600 : 30 };
  }
  return { exercicioId, series: 3, repsMin, repsMax, descansoSeg };
}

export async function startRoutineSession(
  db: SQLiteDatabase,
  opts: { programaId: string | null; day: RoutineDay | null; nome: string; pesoCorporalKg: number },
): Promise<number> {
  const planned: PlannedExercise[] = [];
  for (const r of opts.day?.exercicios ?? []) planned.push(await planExercise(db, r));
  return startSession(db, {
    programaId: opts.programaId,
    diaId: opts.day?.id ?? null,
    nome: opts.nome,
    pesoCorporalKg: opts.pesoCorporalKg,
    exercicios: planned,
  });
}
