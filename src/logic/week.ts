import type { Program, RoutineDay } from '@/catalog/types';

import { weekStart } from './consistency';
import { nextRoutineDay } from './summary';

/** Treino concluído, só com o que a visão da semana precisa. */
export interface DoneSession {
  programa_id: string | null;
  dia_id: string | null;
  iniciado_em: string;
}

export const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/**
 * Tempo estimado de um treino da ficha, em minutos (arredondado de 5 em 5).
 * Cada série leva ~40 s (ou a duração definida) mais o descanso, e cada exercício ~1 min de troca.
 */
export function estimateMinutes(day: RoutineDay): number {
  let seg = 0;
  for (const r of day.exercicios) {
    const trabalho = r.duracaoSeg ?? 40;
    seg += r.series * trabalho + Math.max(0, r.series - 1) * r.descansoSeg + 60;
  }
  if (seg === 0) return 0;
  return Math.max(5, Math.round(seg / 60 / 5) * 5);
}

export interface WeekOfProgram {
  /** Id do próximo treino da ficha (o seguinte ao último feito). */
  proximoId: string | null;
  /** Treinos da ficha feitos nesta semana: id do dia → data do último. */
  feitos: Map<string, string>;
  /** Dias distintos com treino concluído nesta semana (qualquer ficha). */
  nestaSemana: number;
  /** Quantos treinos já foram feitos com esta ficha. */
  totalFicha: number;
}

/** `sessions` em qualquer ordem. */
export function weekOfProgram(program: Program, sessions: DoneSession[], now: Date = new Date()): WeekOfProgram {
  const ordenadas = [...sessions].sort((a, b) => a.iniciado_em.localeCompare(b.iniciado_em));
  const ultima = ordenadas.at(-1) ?? null;
  const proximo = program.dias.length
    ? nextRoutineDay(program, ultima?.dia_id ?? null, ultima?.programa_id ?? null)
    : null;
  const inicio = weekStart(now).getTime();
  const feitos = new Map<string, string>();
  const dias = new Set<string>();
  let totalFicha = 0;
  for (const s of ordenadas) {
    if (s.programa_id === program.id) totalFicha += 1;
    const d = new Date(s.iniciado_em);
    if (d.getTime() < inicio) continue;
    dias.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    if (s.programa_id === program.id && s.dia_id) feitos.set(s.dia_id, s.iniciado_em);
  }
  return { proximoId: proximo?.id ?? null, feitos, nestaSemana: dias.size, totalFicha };
}
