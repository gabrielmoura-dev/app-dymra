import type { Program } from '@/catalog/types';

import { defaultTrainingDays, planWeek } from '../weekPlan';

const dia = (id: string) => ({ id, nome: `Treino ${id}`, foco: '', exercicios: [] });
const program: Program = { id: 'p', nome: 'P', dono: 'Val', descricao: '', dias: [dia('A'), dia('B'), dia('C')] };

describe('planWeek', () => {
  // Quarta, 18/11/2026, meio-dia. Dias de treino: seg, qua, sex.
  const now = new Date(2026, 10, 18, 12);
  const treino = [1, 3, 5];

  it('marca feitos e distribui os próximos treinos pelos dias que faltam', () => {
    const semana = planWeek(program, [{ programa_id: 'p', dia_id: 'A', iniciado_em: new Date(2026, 10, 16, 8).toISOString() }], treino, now);
    expect(semana.map((d) => `${d.status}:${d.diaId ?? ''}`)).toEqual([
      'feito:A', // seg
      'livre:',
      'planejado:B', // qua (hoje)
      'livre:',
      'planejado:C', // sex
      'livre:',
      'livre:',
    ]);
    expect(semana[2].hoje).toBe(true);
  });

  it('dia de treino que passou sem treino escorrega o treino para frente', () => {
    const semana = planWeek(program, [], treino, now);
    expect(semana[0].status).toBe('perdido');
    expect(semana[2].diaId).toBe('A');
    expect(semana[4].diaId).toBe('B');
  });

  it('treino fora dos dias previstos também conta como feito', () => {
    const semana = planWeek(program, [{ programa_id: 'p', dia_id: 'A', iniciado_em: new Date(2026, 10, 17, 8).toISOString() }], treino, now);
    expect(semana[1].status).toBe('feito');
    expect(semana[2].diaId).toBe('B');
  });
});

describe('defaultTrainingDays', () => {
  it('espalha os treinos na semana', () => {
    expect(defaultTrainingDays(3)).toEqual([1, 3, 5]);
    expect(defaultTrainingDays(9)).toHaveLength(7);
  });
});
