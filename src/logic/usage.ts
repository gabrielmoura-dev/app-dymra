/** Quantas vezes (treinos distintos) cada exercício foi feito, e quando foi a última. */
export interface UsageInfo {
  vezes: number;
  ultima: string;
}

export type Usage = Map<string, UsageInfo>;

/** A partir de quantas vezes um exercício ou máquina conta como "costuma usar". */
export const MIN_VEZES = 2;

function compare(a: UsageInfo, b: UsageInfo): number {
  if (b.vezes !== a.vezes) return b.vezes - a.vezes;
  return b.ultima.localeCompare(a.ultima);
}

/** Soma o uso dos exercícios em cada máquina onde eles são feitos. */
export function machineUsage(usage: Usage, machinesOf: (exercicioId: string) => string[]): Usage {
  const out: Usage = new Map();
  for (const [id, u] of usage) {
    for (const m of machinesOf(id)) {
      const cur = out.get(m);
      if (!cur) out.set(m, { ...u });
      else out.set(m, { vezes: cur.vezes + u.vezes, ultima: u.ultima > cur.ultima ? u.ultima : cur.ultima });
    }
  }
  return out;
}

/**
 * Põe no topo o que foi usado `MIN_VEZES` vezes ou mais (mais usado primeiro, depois o mais recente).
 * O resto mantém a ordem original.
 */
export function rankByUsage<T>(items: T[], idOf: (item: T) => string, usage: Usage, min = MIN_VEZES): T[] {
  const frequentes: T[] = [];
  const resto: T[] = [];
  for (const it of items) {
    const u = usage.get(idOf(it));
    if (u && u.vezes >= min) frequentes.push(it);
    else resto.push(it);
  }
  frequentes.sort((a, b) => compare(usage.get(idOf(a))!, usage.get(idOf(b))!));
  return [...frequentes, ...resto];
}

/** Ids dos exercícios que a pessoa costuma fazer, do mais usado para o menos usado. */
export function frequentIds(usage: Usage, min = MIN_VEZES): string[] {
  return [...usage.entries()]
    .filter(([, u]) => u.vezes >= min)
    .sort((a, b) => compare(a[1], b[1]))
    .map(([id]) => id);
}

/** Com quantos exercícios frequentes a lista de exercícios passa a mostrar só eles. */
export const MIN_PARA_ENXUGAR = 5;
