import type { ExerciseKind, Goal } from '@/catalog/types';

import { formatKg, roundToStep, workingSets } from './strength';
import type { ExerciseHistoryEntry, LoggedSet } from './types';

export type SuggestionKind = 'inicio' | 'subir' | 'manter' | 'reduzir' | 'deload';

export interface Suggestion {
  kind: SuggestionKind;
  pesoKg: number | null;
  reps: number | null;
  duracaoSeg: number | null;
  titulo: string;
  mensagem: string;
  /** Resumo da última vez, ex.: "3×12 com 40 kg". */
  ultimaVez: string | null;
}

export interface ProgressionInput {
  history: ExerciseHistoryEntry[]; // mais recente primeiro
  repsMin: number;
  repsMax: number;
  series: number;
  passoKg: number;
  tipo: ExerciseKind;
  assistido?: boolean;
  duracaoAlvoSeg?: number | null;
  /** Cardio progride de minuto em minuto. */
  cardio?: boolean;
}

/** Faixa de repetições padrão por objetivo (quando a ficha não define). */
export const GOAL_REP_RANGE: Record<Goal, [number, number]> = {
  hipertrofia: [8, 12],
  emagrecimento: [12, 15],
  condicionamento: [15, 20],
};

export const GOAL_LABELS: Record<Goal, string> = {
  hipertrofia: 'Hipertrofia / definição',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento',
};

function mostUsedWeight(sets: LoggedSet[]): number {
  const counts = new Map<number, number>();
  for (const s of sets) {
    const w = s.pesoKg ?? 0;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  let best = 0;
  let bestCount = -1;
  for (const [w, c] of counts) {
    if (c > bestCount || (c === bestCount && w > best)) {
      best = w;
      bestCount = c;
    }
  }
  return best;
}

/** 45 s, 5 min, 1 min 30 s */
export function formatSeconds(s: number): string {
  if (s < 120) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m} min ${r} s` : `${m} min`;
}

export function describeSets(sets: LoggedSet[], tipo: ExerciseKind = 'carga'): string | null {
  const work = sets.filter((s) => !s.aquecimento);
  if (work.length === 0) return null;
  if (tipo === 'tempo') {
    const secs = work.map((s) => s.duracaoSeg ?? 0);
    const allSame = secs.every((v) => v === secs[0]);
    return allSame ? `${work.length}× ${formatSeconds(secs[0])}` : secs.map(formatSeconds).join(', ');
  }
  const reps = work.map((s) => s.reps ?? 0);
  const w = mostUsedWeight(work);
  const sameReps = reps.every((r) => r === reps[0]);
  const repsTxt = sameReps ? `${work.length}×${reps[0]}` : reps.join(', ') + ' reps';
  return w > 0 ? `${repsTxt} com ${formatKg(w)} kg` : repsTxt;
}

interface EntryStats {
  peso: number;
  setsAtWeight: LoggedSet[];
  repsAtWeight: number;
}

function stats(entry: ExerciseHistoryEntry): EntryStats | null {
  const work = workingSets(entry.sets);
  if (work.length === 0) return null;
  const peso = mostUsedWeight(work);
  const setsAtWeight = work.filter((s) => (s.pesoKg ?? 0) === peso);
  return { peso, setsAtWeight, repsAtWeight: setsAtWeight.reduce((a, s) => a + (s.reps ?? 0), 0) };
}

/**
 * Progressão dupla para iniciantes:
 * 1. Bateu o topo da faixa em todas as séries sem achar difícil → sobe a carga.
 * 2. Ficou abaixo do mínimo duas vezes seguidas → reduz a carga.
 * 3. Três treinos com a mesma carga sem ganhar repetições → deload de ~10%.
 * 4. Caso contrário → mantém a carga e tenta +1 repetição.
 */
export function suggestNext(input: ProgressionInput): Suggestion {
  const { history, repsMin, repsMax, series, passoKg, tipo, assistido } = input;
  const ultimaVez = history[0] ? describeSets(history[0].sets, tipo) : null;

  if (tipo === 'tempo') {
    const alvo = input.duracaoAlvoSeg ?? 30;
    const last = history[0]?.sets.filter((s) => !s.aquecimento) ?? [];
    if (last.length > 0 && last.every((s) => (s.duracaoSeg ?? 0) >= alvo) && last.every((s) => s.esforco !== 3)) {
      const prox = (Math.max(...last.map((s) => s.duracaoSeg ?? 0)) || alvo) + (input.cardio ? 60 : 10);
      return {
        kind: 'subir',
        pesoKg: null,
        reps: null,
        duracaoSeg: prox,
        titulo: `Tente ${formatSeconds(prox)}`,
        mensagem: 'Você completou o tempo em todas as séries. Vamos aumentar um pouco.',
        ultimaVez,
      };
    }
    return {
      kind: history.length ? 'manter' : 'inicio',
      pesoKg: null,
      reps: null,
      duracaoSeg: alvo,
      titulo: input.cardio ? `${formatSeconds(alvo)} de cardio` : `${formatSeconds(alvo)} por série`,
      mensagem: input.cardio
        ? 'Ritmo moderado: dá para conversar com frases curtas. Ótimo aquecimento.'
        : history.length
          ? 'Mantenha o tempo e foque na postura.'
          : 'Segure com a postura perfeita. Se cansar antes, pare e descanse.',
      ultimaVez,
    };
  }

  if (history.length === 0 || !stats(history[0])) {
    return {
      kind: 'inicio',
      pesoKg: null,
      reps: repsMax,
      duracaoSeg: null,
      titulo: 'Primeira vez',
      mensagem:
        tipo === 'peso-corporal'
          ? `Faça até ${repsMax} repetições com boa técnica.`
          : `Escolha um peso em que você consiga ${repsMax} repetições com boa técnica, sentindo que ainda sobrariam 2 ou 3.`,
      ultimaVez,
    };
  }

  const last = stats(history[0])!;

  if (tipo === 'peso-corporal') {
    const best = Math.max(...last.setsAtWeight.map((s) => s.reps ?? 0));
    const hitAll = last.setsAtWeight.length >= series && last.setsAtWeight.every((s) => (s.reps ?? 0) >= repsMax);
    return {
      kind: hitAll ? 'subir' : 'manter',
      pesoKg: last.peso > 0 ? last.peso : null,
      reps: hitAll ? repsMax : Math.min(repsMax, best + 1),
      duracaoSeg: null,
      titulo: hitAll ? 'Hora de dificultar' : `Tente ${Math.min(repsMax, best + 1)} repetições`,
      mensagem: hitAll
        ? 'Você fez o máximo da faixa em todas as séries. Faça mais devagar (3 s na descida) ou segure um peso leve.'
        : 'Tente uma repetição a mais que da última vez, mantendo a técnica.',
      ultimaVez,
    };
  }

  const step = passoKg > 0 ? passoKg : 2.5;
  const up = (w: number, n = 1) => (assistido ? Math.max(0, w - step * n) : w + step * n);
  const down = (w: number) => (assistido ? w + step : Math.max(step, w - step));

  const hitAll =
    last.setsAtWeight.length >= series &&
    last.setsAtWeight.every((s) => (s.reps ?? 0) >= repsMax) &&
    last.setsAtWeight.every((s) => s.esforco !== 3);

  if (hitAll) {
    const allEasy = last.setsAtWeight.every((s) => s.esforco === 1);
    const novo = up(last.peso, allEasy ? 2 : 1);
    return {
      kind: 'subir',
      pesoKg: novo,
      reps: repsMin,
      duracaoSeg: null,
      titulo: `Suba para ${formatKg(novo)} kg`,
      mensagem: allEasy
        ? `Ficou fácil: você fez ${repsMax} repetições em todas as séries. Suba a carga e comece com ${repsMin} repetições.`
        : `Você bateu ${repsMax} repetições em todas as séries. Suba a carga e comece com ${repsMin} repetições.`,
      ultimaVez,
    };
  }

  const failing = (e: EntryStats) => e.setsAtWeight.some((s) => (s.reps ?? 0) < repsMin);
  const prev = history[1] ? stats(history[1]) : null;
  if (failing(last) && prev && prev.peso === last.peso && failing(prev)) {
    const novo = down(last.peso);
    return {
      kind: 'reduzir',
      pesoKg: novo,
      reps: repsMin,
      duracaoSeg: null,
      titulo: `Reduza para ${formatKg(novo)} kg`,
      mensagem: `Nas duas últimas vezes você ficou abaixo de ${repsMin} repetições. Reduza um pouco e foque na técnica.`,
      ultimaVez,
    };
  }

  const third = history[2] ? stats(history[2]) : null;
  if (
    prev &&
    third &&
    prev.peso === last.peso &&
    third.peso === last.peso &&
    last.repsAtWeight <= third.repsAtWeight &&
    !assistido
  ) {
    const novo = roundToStep(last.peso * 0.9, step);
    return {
      kind: 'deload',
      pesoKg: novo < last.peso ? novo : down(last.peso),
      reps: repsMax,
      duracaoSeg: null,
      titulo: 'Semana de recarga',
      mensagem:
        'Três treinos com a mesma carga sem ganhar repetições. Reduza cerca de 10% hoje, faça com calma e volte a progredir no próximo.',
      ultimaVez,
    };
  }

  const best = Math.max(...last.setsAtWeight.map((s) => s.reps ?? 0));
  const alvo = Math.min(repsMax, Math.max(repsMin, best + 1));
  return {
    kind: 'manter',
    pesoKg: last.peso,
    reps: alvo,
    duracaoSeg: null,
    titulo: `${formatKg(last.peso)} kg × ${alvo}`,
    mensagem: `Mantenha a carga e tente chegar a ${alvo} repetições. Quando fizer ${repsMax} em todas as séries, a carga sobe.`,
    ultimaVez,
  };
}
