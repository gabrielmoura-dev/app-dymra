/**
 * Estimativa de calorias pelo método MET:
 * kcal = MET × peso (kg) × horas.
 * Usada quando não há dados do relógio no Health Connect.
 */
export function estimateKcal(met: number, pesoKg: number, duracaoSeg: number): number {
  if (met <= 0 || pesoKg <= 0 || duracaoSeg <= 0) return 0;
  return met * pesoKg * (duracaoSeg / 3600);
}

/**
 * MET médio da sessão, ponderado pelo número de séries de cada exercício.
 * Fica entre 3 e 8 para evitar números irreais.
 */
export function sessionMet(items: { met: number; series: number }[]): number {
  const total = items.reduce((a, i) => a + i.series, 0);
  if (total === 0) return 3.5;
  const avg = items.reduce((a, i) => a + i.met * i.series, 0) / total;
  return Math.min(8, Math.max(3, avg));
}

/** Meta de água sugerida: 35 ml por kg de peso, arredondada a 250 ml. */
export function suggestedWaterGoal(pesoKg: number): number {
  const ml = pesoKg * 35;
  return Math.max(1500, Math.round(ml / 250) * 250);
}
