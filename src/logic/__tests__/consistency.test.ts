import { consistency, volumeZone, weekStart } from '../consistency';

const d = (s: string) => new Date(s + 'T12:00:00').toISOString();

describe('consistency', () => {
  const now = new Date('2026-11-19T12:00:00'); // quinta
  it('semana começa na segunda', () => {
    expect(weekStart(now).getDay()).toBe(1);
    expect(weekStart(new Date('2026-11-22T12:00:00')).getDate()).toBe(16); // domingo
  });
  it('conta dias distintos e sequência', () => {
    const datas = [d('2026-11-16'), d('2026-11-16'), d('2026-11-18'), d('2026-11-09'), d('2026-11-11'), d('2026-11-02'), d('2026-11-04')];
    const c = consistency(datas, 2, now);
    expect(c.nestaSemana).toBe(2);
    expect(c.semanasSeguidas).toBe(3);
  });
  it('semana atual incompleta não quebra a sequência', () => {
    const c = consistency([d('2026-11-09'), d('2026-11-11')], 2, now);
    expect(c).toEqual({ nestaSemana: 0, semanaPassada: 2, meta: 2, semanasSeguidas: 1 });
  });
  it('sem treinos = 0 e meta limitada', () => {
    expect(consistency([], 99, now).meta).toBe(7);
    expect(consistency([], 3, now).semanasSeguidas).toBe(0);
  });
});

describe('volumeZone', () => {
  it('faixas', () => {
    expect([3, 6, 9.5, 10, 20, 21].map(volumeZone)).toEqual(['baixo', 'iniciante', 'iniciante', 'ideal', 'ideal', 'alto']);
  });
});
