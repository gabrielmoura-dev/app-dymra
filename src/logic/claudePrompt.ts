import type { Goal, Muscle, Sex } from '@/catalog/types';

import { formatDateShort } from './dates';
import { GOAL_LABELS } from './progression';
import { formatKg } from './strength';

export interface ClaudePromptInput {
  nome: string;
  objetivo: Goal;
  sexo: Sex;
  alturaCm: number;
  pesos: { data: string; pesoKg: number }[];
  medidas?: { data: string; cinturaCm: number | null; quadrilCm: number | null } | null;
  volumeSemanal: Partial<Record<Muscle, number>>;
  muscleLabels: Record<Muscle, string>;
  treinos30dias: number;
  pose: 'frente' | 'lado' | 'costas';
  temFotoAnterior: boolean;
}

/**
 * Texto que vai junto com a foto para o app do Claude.
 * É enviado manualmente pela pessoa usando o próprio plano dela.
 */
export function buildClaudePrompt(i: ClaudePromptInput): string {
  const linhas: string[] = [];
  linhas.push(
    `Oi, Claude! Sou ${i.nome}, iniciante na musculação. Estou te mandando uma foto de progresso (${i.pose}). Analise com cuidado e gentileza, por favor.`,
  );
  linhas.push('');
  linhas.push('Meus dados:');
  linhas.push(`- Objetivo: ${GOAL_LABELS[i.objetivo]}`);
  linhas.push(`- Sexo: ${i.sexo}; altura: ${Math.round(i.alturaCm)} cm`);
  if (i.pesos.length > 0) {
    const ult = i.pesos[i.pesos.length - 1];
    const prim = i.pesos[0];
    const diff = ult.pesoKg - prim.pesoKg;
    linhas.push(
      `- Peso atual: ${formatKg(ult.pesoKg)} kg` +
        (i.pesos.length > 1
          ? ` (desde ${formatDateShort(prim.data)}: ${diff >= 0 ? '+' : ''}${formatKg(Math.round(diff * 10) / 10)} kg)`
          : ''),
    );
  }
  if (i.medidas && (i.medidas.cinturaCm || i.medidas.quadrilCm)) {
    const parts = [];
    if (i.medidas.cinturaCm) parts.push(`cintura ${formatKg(i.medidas.cinturaCm)} cm`);
    if (i.medidas.quadrilCm) parts.push(`quadril ${formatKg(i.medidas.quadrilCm)} cm`);
    linhas.push(`- Medidas recentes: ${parts.join(', ')}`);
  }
  linhas.push(`- Treinos nos últimos 30 dias: ${i.treinos30dias}`);

  const vol = (Object.entries(i.volumeSemanal) as [Muscle, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (vol.length > 0) {
    linhas.push(
      `- Séries por músculo nos últimos 7 dias: ${vol.map(([m, v]) => `${i.muscleLabels[m]} ${formatKg(Math.round(v * 2) / 2)}`).join(', ')}`,
    );
  }
  linhas.push('');
  linhas.push('O que eu gostaria:');
  linhas.push('1. O que você observa de pontos fortes e de pontos a desenvolver, pensando no meu objetivo.');
  linhas.push('2. Se notar algo de postura (ombros, quadril, coluna), o que observar e quais exercícios ajudam.');
  linhas.push('3. Quais grupos musculares eu deveria priorizar nas próximas semanas, considerando meu volume atual.');
  if (i.temFotoAnterior) linhas.push('4. Se eu mandar também a foto anterior, compare as duas.');
  linhas.push('');
  linhas.push(
    'Lembre que fotos têm limites (luz, ângulo, roupa). Não faça diagnósticos médicos; se algo merecer atenção, sugira procurar um profissional.',
  );
  return linhas.join('\n');
}
