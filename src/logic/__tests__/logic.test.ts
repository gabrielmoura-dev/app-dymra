import { EXERCISES, getExercise, PROGRAMS, validateCatalog } from '@/catalog';

import { findAlternatives } from '../alternatives';
import { estimateKcal, sessionMet, suggestedWaterGoal } from '../calories';
import { buildClaudePrompt } from '../claudePrompt';
import { suggestNext } from '../progression';
import { muscleInsights, muscleRecovery, weeklyVolume } from '../recovery';
import { detectRecords, estimate1RM, roundToStep } from '../strength';
import { compareExercise, nextRoutineDay, sessionStats } from '../summary';
import type { ExerciseHistoryEntry, LoggedSet } from '../types';

const set = (pesoKg: number | null, reps: number | null, esforco: 1 | 2 | 3 | null = 2): LoggedSet => ({
  pesoKg,
  reps,
  esforco,
  aquecimento: false,
});
const entry = (id: number, sets: LoggedSet[]): ExerciseHistoryEntry => ({
  sessionId: id,
  data: new Date(2026, 9, id).toISOString(),
  sets,
});

describe('catálogo', () => {
  it('não tem referências quebradas', () => {
    expect(validateCatalog()).toEqual([]);
  });
});

describe('progressão', () => {
  const base = { repsMin: 10, repsMax: 12, series: 3, passoKg: 5, tipo: 'carga' as const };

  it('primeira vez pede para escolher a carga', () => {
    const s = suggestNext({ ...base, history: [] });
    expect(s.kind).toBe('inicio');
    expect(s.pesoKg).toBeNull();
  });

  it('sobe a carga quando bate o topo da faixa em todas as séries', () => {
    const s = suggestNext({ ...base, history: [entry(1, [set(40, 12), set(40, 12), set(40, 12)])] });
    expect(s.kind).toBe('subir');
    expect(s.pesoKg).toBe(45);
    expect(s.reps).toBe(10);
  });

  it('sobe dois passos quando tudo foi fácil', () => {
    const s = suggestNext({ ...base, history: [entry(1, [set(40, 12, 1), set(40, 12, 1), set(40, 12, 1)])] });
    expect(s.pesoKg).toBe(50);
  });

  it('não sobe se alguma série foi difícil', () => {
    const s = suggestNext({ ...base, history: [entry(1, [set(40, 12), set(40, 12), set(40, 12, 3)])] });
    expect(s.kind).toBe('manter');
    expect(s.pesoKg).toBe(40);
  });

  it('mantém e pede +1 repetição no meio da faixa', () => {
    const s = suggestNext({ ...base, history: [entry(1, [set(40, 10), set(40, 10), set(40, 9)])] });
    expect(s.kind).toBe('manter');
    expect(s.reps).toBe(11);
  });

  it('reduz após duas sessões abaixo do mínimo', () => {
    const s = suggestNext({
      ...base,
      history: [entry(2, [set(40, 8), set(40, 7), set(40, 7)]), entry(1, [set(40, 8), set(40, 8), set(40, 7)])],
    });
    expect(s.kind).toBe('reduzir');
    expect(s.pesoKg).toBe(35);
  });

  it('sugere deload após três sessões estagnadas', () => {
    const same = [set(50, 10), set(50, 10), set(50, 10)];
    const s = suggestNext({ ...base, history: [entry(3, same), entry(2, same), entry(1, same)] });
    expect(s.kind).toBe('deload');
    expect(s.pesoKg).toBe(45);
  });

  it('em exercício assistido, progredir é reduzir a assistência', () => {
    const s = suggestNext({
      ...base,
      assistido: true,
      history: [entry(1, [set(30, 12), set(30, 12), set(30, 12)])],
    });
    expect(s.pesoKg).toBe(25);
  });

  it('exercício por tempo aumenta 10 s quando completa tudo', () => {
    const t = (d: number): LoggedSet => ({ pesoKg: null, reps: null, duracaoSeg: d, esforco: 2, aquecimento: false });
    const s = suggestNext({ ...base, tipo: 'tempo', duracaoAlvoSeg: 30, history: [entry(1, [t(30), t(30), t(30)])] });
    expect(s.duracaoSeg).toBe(40);
  });
});

describe('alternativas', () => {
  it('leg press ocupado sugere agachamentos guiados primeiro', () => {
    const alts = findAlternatives(getExercise('leg-press-45')!, EXERCISES, 'leg-press-45');
    expect(alts[0].exercise.id).toBe('agachamento-hack');
    expect(alts.map((a) => a.exercise.id)).toContain('agachamento-smith');
    expect(alts.every((a) => a.machineId !== 'leg-press-45')).toBe(true);
  });

  it('exercício em várias máquinas sugere a outra máquina antes', () => {
    const alts = findAlternatives(getExercise('triceps-corda')!, EXERCISES, 'crossover');
    expect(alts[0].exercise.id).toBe('triceps-corda');
    expect(alts[0].machineId).toBe('puxador');
  });

  it('nunca mistura cardio com musculação', () => {
    const alts = findAlternatives(getExercise('esteira')!, EXERCISES, 'esteira');
    expect(alts.every((a) => a.exercise.padrao === 'cardio')).toBe(true);
    const alts2 = findAlternatives(getExercise('cadeira-extensora')!, EXERCISES, 'cadeira-extensora');
    expect(alts2.some((a) => a.exercise.padrao === 'cardio')).toBe(false);
  });

  it('todo exercício com máquina tem ao menos uma alternativa', () => {
    for (const ex of EXERCISES) {
      expect(findAlternatives(ex, EXERCISES, ex.maquinaIds[0]).length).toBeGreaterThan(0);
    }
  });
});

describe('força e recordes', () => {
  it('1RM de Epley', () => {
    expect(estimate1RM(100, 1)).toBe(100);
    expect(estimate1RM(100, 10)).toBeCloseTo(133.33, 1);
  });

  it('arredonda ao passo da máquina', () => {
    expect(roundToStep(43, 5)).toBe(45);
    expect(roundToStep(1, 5)).toBe(5);
  });

  it('não marca recorde na primeira vez', () => {
    expect(detectRecords([set(40, 10)], [])).toEqual([]);
  });

  it('detecta recorde de carga', () => {
    const r = detectRecords([set(45, 10)], [entry(1, [set(40, 12)])]);
    expect(r).toContain('peso');
  });
});

describe('recuperação', () => {
  const now = new Date('2026-10-18T12:00:00Z');
  const sets = Array.from({ length: 6 }, () => ({
    exercicioId: 'leg-press-45',
    concluidaEm: '2026-10-18T11:00:00Z',
    aquecimento: false,
  }));

  it('músculo recém treinado aparece como fatigado', () => {
    const r = muscleRecovery(sets, getExercise, now);
    expect(r.quadriceps).toBeLessThan(0.1);
    expect(r.peitoral).toBe(1);
  });

  it('recupera depois do tempo de recuperação', () => {
    const r = muscleRecovery(sets, getExercise, new Date('2026-10-22T12:00:00Z'));
    expect(r.quadriceps).toBe(1);
  });

  it('volume semanal conta secundários pela metade', () => {
    const v = weeklyVolume(sets, getExercise);
    expect(v.quadriceps).toBe(6);
    expect(v.adutores).toBe(3);
  });

  it('avisa músculo pouco treinado', () => {
    const r = muscleRecovery([], getExercise, now);
    const v = weeklyVolume([], getExercise);
    const ins = muscleInsights(r, v, [], ['dorsais']);
    expect(ins).toEqual([{ muscle: 'dorsais', tipo: 'pouco-treinado' }]);
  });
});

describe('calorias e água', () => {
  it('MET × peso × horas', () => {
    expect(estimateKcal(5, 60, 3600)).toBe(300);
  });
  it('MET da sessão é ponderado e limitado', () => {
    expect(sessionMet([{ met: 3, series: 1 }, { met: 5, series: 3 }])).toBe(4.5);
    expect(sessionMet([])).toBe(3.5);
  });
  it('meta de água', () => {
    expect(suggestedWaterGoal(60)).toBe(2000);
  });
});

describe('resumo', () => {
  it('próximo dia da ficha gira em ordem', () => {
    const p = PROGRAMS[0];
    expect(nextRoutineDay(p, null, null).id).toBe('A');
    expect(nextRoutineDay(p, 'A', p.id).id).toBe('B');
    expect(nextRoutineDay(p, 'C', p.id).id).toBe('A');
    expect(nextRoutineDay(p, 'B', 'outra').id).toBe('A');
  });

  it('estatísticas ignoram aquecimento', () => {
    const s = sessionStats([{ sets: [set(40, 10), { ...set(20, 10), aquecimento: true }] }]);
    expect(s.volumeKg).toBe(400);
    expect(s.series).toBe(1);
  });

  it('compara com a última vez', () => {
    const c = compareExercise('x', [set(45, 10)], [set(40, 10)]);
    expect(c?.deltaPesoKg).toBe(5);
    expect(c?.deltaVolumeKg).toBe(50);
  });
});

describe('texto para o Claude', () => {
  it('inclui objetivo, peso e volume', () => {
    const txt = buildClaudePrompt({
      nome: 'Ana',
      objetivo: 'hipertrofia',
      sexo: 'feminino',
      alturaCm: 165,
      pesos: [
        { data: '2026-09-01T00:00:00Z', pesoKg: 62 },
        { data: '2026-10-01T00:00:00Z', pesoKg: 61 },
      ],
      volumeSemanal: { gluteos: 9, quadriceps: 6 },
      muscleLabels: { gluteos: 'Glúteos', quadriceps: 'Quadríceps' } as never,
      treinos30dias: 10,
      pose: 'frente',
      temFotoAnterior: false,
    });
    expect(txt).toContain('Hipertrofia');
    expect(txt).toContain('61 kg');
    expect(txt).toContain('-1 kg');
    expect(txt).toContain('Glúteos 9');
  });
});
