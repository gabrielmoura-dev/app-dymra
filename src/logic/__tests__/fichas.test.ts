import { EXERCISES, getExercise, loadStepFor } from '@/catalog';
import type { Exercise } from '@/catalog/types';
import { emptyProgram, generateProgram, nextDayId, type DiasPorSemana } from '@/logic/programGenerator';
import { warmupSetsFor, warmupTargets } from '@/logic/warmup';

describe('gerador de ficha', () => {
  const base = { nome: 'Rita', objetivo: 'hipertrofia' as const, duracaoMin: 45 as const, foco: 'equilibrado' as const };

  it.each([2, 3, 4, 5] as DiasPorSemana[])('%i dias geram %i treinos válidos', (dias) => {
    for (const foco of ['equilibrado', 'inferiores', 'superiores'] as const) {
      const p = generateProgram({ ...base, dias, foco }, EXERCISES, 'minha-x');
      expect(p.dias).toHaveLength(dias);
      for (const d of p.dias) {
        const musculacao = d.exercicios.filter((r) => getExercise(r.exercicioId)?.padrao !== 'cardio');
        expect(musculacao).toHaveLength(5);
        expect(new Set(d.exercicios.map((r) => r.exercicioId)).size).toBe(d.exercicios.length);
        for (const r of d.exercicios) expect(getExercise(r.exercicioId)).toBeDefined();
      }
    }
  });

  it('respeita o tempo e o objetivo', () => {
    const curto = generateProgram({ ...base, dias: 3, duracaoMin: 30 }, EXERCISES, 'x');
    expect(curto.dias[0].exercicios.filter((r) => getExercise(r.exercicioId)?.padrao !== 'cardio')).toHaveLength(4);
    const emag = generateProgram({ ...base, dias: 3, objetivo: 'emagrecimento' }, EXERCISES, 'x');
    const ultimo = emag.dias[0].exercicios.at(-1)!;
    expect(ultimo.exercicioId).toBe('esteira');
    expect(ultimo.duracaoSeg).toBe(15 * 60);
    expect(emag.dias[0].exercicios.find((r) => r.exercicioId === 'leg-press-45')?.repsMin).toBe(12);
  });

  it('prefere máquinas guiadas para iniciantes', () => {
    const p = generateProgram({ ...base, dias: 3 }, EXERCISES, 'x');
    expect(p.dias[0].exercicios.map((r) => r.exercicioId)).toContain('leg-press-45');
    expect(p.nome).toBe('Ficha de Rita');
  });

  it('funciona com catálogo pequeno (pula o que não existe e aquece no cardio que houver)', () => {
    const poucos = EXERCISES.filter((e) => ['leg-press-45', 'supino-maquina', 'esteira'].includes(e.id));
    const p = generateProgram({ ...base, dias: 2 }, poucos, 'x');
    expect(p.dias[0].exercicios.map((r) => r.exercicioId)).toEqual(['esteira', 'leg-press-45', 'supino-maquina']);
  });

  it('ficha vazia e ids de dia', () => {
    const p = emptyProgram('Gabriel', 'minha-1');
    expect(p.dias).toHaveLength(1);
    expect(nextDayId(p.dias)).toBe('B');
  });
});

describe('aquecimento', () => {
  it('50% x12 e, acima de 30 kg, 75% x6', () => {
    expect(warmupSetsFor(40, 5)).toEqual([
      { pesoKg: 20, reps: 12 },
      { pesoKg: 30, reps: 6 },
    ]);
    expect(warmupSetsFor(20, 5)).toEqual([{ pesoKg: 10, reps: 12 }]);
  });
  it('sem carga conhecida sugere série leve; carga muito baixa dispensa', () => {
    expect(warmupSetsFor(null, 5)).toEqual([{ pesoKg: null, reps: 12 }]);
    expect(warmupSetsFor(5, 5)).toEqual([]);
  });
  it('só o primeiro composto de cada região', () => {
    const ids = ['bicicleta', 'leg-press-45', 'agachamento-hack', 'cadeira-extensora', 'supino-maquina', 'puxada-frente'];
    const exs = ids.map((id) => getExercise(id) as Exercise);
    expect(warmupTargets(exs)).toEqual([1, 4]);
  });
  it('passo cadastrado no celular vale sobre o do catálogo', () => {
    const ex = getExercise('leg-press-45')!;
    expect(loadStepFor(ex)).toBe(5);
    expect(loadStepFor(ex, { 'leg-press-45': 10 })).toBe(10);
  });
});
