import type { Program } from '@/catalog/types';

import { weekStart } from './consistency';
import { weekOfProgram, type DoneSession } from './week';

export type DayStatus = 'feito' | 'planejado' | 'perdido' | 'livre';

export interface PlannedDay {
  data: Date;
  /** 0 = domingo … 6 = sábado. */
  diaSemana: number;
  hoje: boolean;
  status: DayStatus;
  /** Treino da ficha feito ou previsto para o dia. */
  diaId: string | null;
}

/** Dias de treino padrão (0 = dom) quando a pessoa não marcou dias no lembrete. */
export function defaultTrainingDays(vezes: number): number[] {
  const tabela: Record<number, number[]> = {
    1: [1],
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return tabela[Math.min(7, Math.max(1, Math.round(vezes)))];
}

function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Semana de segunda a domingo. Dias com treino concluído viram "feito"; os dias de treino
 * que ainda faltam recebem os próximos treinos da ficha em ordem (A, B, C…). Um dia de treino
 * que passou sem treino fica "perdido" e o treino dele escorrega para o próximo dia disponível.
 */
export function planWeek(
  program: Program,
  sessions: DoneSession[],
  diasTreino: number[],
  now: Date = new Date(),
): PlannedDay[] {
  const inicio = weekStart(now);
  const semana = weekOfProgram(program, sessions, now);
  const ids = program.dias.map((d) => d.id);
  let proximo = semana.proximoId ? ids.indexOf(semana.proximoId) : -1;

  const out: PlannedDay[] = [];
  for (let i = 0; i < 7; i++) {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    const hoje = mesmoDia(data, now);
    const passado = !hoje && data < now;
    const feitos = sessions.filter((s) => mesmoDia(new Date(s.iniciado_em), data));
    const diaSemana = data.getDay();
    if (feitos.length > 0) {
      const daFicha = [...feitos].reverse().find((s) => s.programa_id === program.id && s.dia_id);
      out.push({ data, diaSemana, hoje, status: 'feito', diaId: daFicha?.dia_id ?? null });
      continue;
    }
    if (!diasTreino.includes(diaSemana)) {
      out.push({ data, diaSemana, hoje, status: 'livre', diaId: null });
      continue;
    }
    if (passado) {
      out.push({ data, diaSemana, hoje, status: 'perdido', diaId: null });
      continue;
    }
    const diaId = proximo >= 0 ? ids[proximo] : null;
    if (proximo >= 0) proximo = (proximo + 1) % ids.length;
    out.push({ data, diaSemana, hoje, status: 'planejado', diaId });
  }
  return out;
}
