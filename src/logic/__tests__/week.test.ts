import type { Program } from '@/catalog/types';

import { estimateMinutes, weekOfProgram } from '../week';

const dia = (id: string) => ({
  id,
  nome: `Treino ${id}`,
  foco: '',
  exercicios: [{ exercicioId: 'x', series: 3, repsMin: 8, repsMax: 12, descansoSeg: 90 }],
});
const program: Program = { id: 'p', nome: 'P', dono: 'Val', descricao: '', dias: [dia('A'), dia('B'), dia('C')] };

describe('estimateMinutes', () => {
  it('soma séries, descansos e troca de exercício', () => {
    // 3×40 s + 2×90 s + 60 s = 360 s = 6 min → 5
    expect(estimateMinutes(dia('A'))).toBe(5);
    expect(estimateMinutes({ ...dia('A'), exercicios: [] })).toBe(0);
  });
});

describe('weekOfProgram', () => {
  // Quarta, 18/11/2026; a semana começa na segunda, 16/11.
  const now = new Date(2026, 10, 18, 12);
  it('marca o que foi feito na semana e aponta o próximo', () => {
    const w = weekOfProgram(
      program,
      [
        { programa_id: 'p', dia_id: 'C', iniciado_em: new Date(2026, 10, 13, 8).toISOString() },
        { programa_id: 'p', dia_id: 'A', iniciado_em: new Date(2026, 10, 16, 8).toISOString() },
        { programa_id: 'outra', dia_id: 'A', iniciado_em: new Date(2026, 10, 17, 8).toISOString() },
      ],
      now,
    );
    expect([...w.feitos.keys()]).toEqual(['A']);
    expect(w.nestaSemana).toBe(2);
    expect(w.totalFicha).toBe(2);
    // O último treino foi de outra ficha: volta para o primeiro desta.
    expect(w.proximoId).toBe('A');
  });

  it('segue a ordem da ficha', () => {
    const w = weekOfProgram(program, [{ programa_id: 'p', dia_id: 'A', iniciado_em: new Date(2026, 10, 16).toISOString() }], now);
    expect(w.proximoId).toBe('B');
  });
});
