/**
 * Constância e faixas de volume.
 * Base: a aderência ao treino é o maior preditor de resultado em programas de força; e a
 * hipertrofia responde a ~10–20 séries semanais por músculo (iniciantes já evoluem com 6–10).
 */

/** Segunda-feira 00:00 (hora local) da semana da data. */
export function weekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export interface Consistency {
  /** Treinos (dias distintos) na semana atual. */
  nestaSemana: number;
  /** Treinos (dias distintos) na semana anterior, para revisar a meta. */
  semanaPassada: number;
  meta: number;
  /** Semanas seguidas, até a anterior, em que a meta foi batida (+ a atual, se já bateu). */
  semanasSeguidas: number;
}

/**
 * `datas`: início de cada treino concluído. A semana atual ainda em andamento não quebra a sequência.
 * A meta é limitada a 1–7 treinos por semana.
 */
export function consistency(datas: string[], metaSemanal: number, now: Date = new Date()): Consistency {
  const meta = Math.min(7, Math.max(1, Math.round(metaSemanal)));
  const diasPorSemana = new Map<number, Set<string>>();
  for (const iso of datas) {
    const d = new Date(iso);
    const ws = weekStart(d).getTime();
    const set = diasPorSemana.get(ws) ?? new Set<string>();
    set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    diasPorSemana.set(ws, set);
  }
  const atual = weekStart(now);
  const nestaSemana = diasPorSemana.get(atual.getTime())?.size ?? 0;
  const anterior = new Date(atual);
  anterior.setDate(anterior.getDate() - 7);
  const semanaPassada = diasPorSemana.get(anterior.getTime())?.size ?? 0;
  let semanasSeguidas = nestaSemana >= meta ? 1 : 0;
  const w = new Date(atual);
  for (;;) {
    w.setDate(w.getDate() - 7);
    if ((diasPorSemana.get(w.getTime())?.size ?? 0) >= meta) semanasSeguidas++;
    else break;
  }
  return { nestaSemana, semanaPassada, meta, semanasSeguidas };
}

export type VolumeZone = 'baixo' | 'iniciante' | 'ideal' | 'alto';

export function volumeZone(series: number): VolumeZone {
  if (series < 6) return 'baixo';
  if (series < 10) return 'iniciante';
  if (series <= 20) return 'ideal';
  return 'alto';
}

export const VOLUME_ZONE_LABEL: Record<VolumeZone, string> = {
  baixo: 'pouco',
  iniciante: 'bom para começar',
  ideal: 'faixa ideal',
  alto: 'muito alto',
};
