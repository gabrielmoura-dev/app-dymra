/** Tipos de domínio usados pela lógica pura (sem dependência do banco ou do React Native). */

export type Effort = 1 | 2 | 3; // 1 = fácil, 2 = ok, 3 = difícil

export interface LoggedSet {
  pesoKg: number | null;
  reps: number | null;
  duracaoSeg?: number | null;
  esforco: Effort | null;
  aquecimento: boolean;
}

/** Um treino passado de um exercício, só com as séries concluídas. */
export interface ExerciseHistoryEntry {
  sessionId: number;
  data: string;
  sets: LoggedSet[];
}

/** Série concluída com o momento em que foi feita (para recuperação e volume). */
export interface TimedSet {
  exercicioId: string;
  concluidaEm: string;
  aquecimento: boolean;
}
