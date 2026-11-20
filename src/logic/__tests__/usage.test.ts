import { frequentIds, machineUsage, rankByUsage, type Usage } from '../usage';

const usage: Usage = new Map([
  ['leg', { vezes: 5, ultima: '2026-11-10' }],
  ['ext', { vezes: 2, ultima: '2026-11-18' }],
  ['flex', { vezes: 2, ultima: '2026-11-01' }],
  ['uma', { vezes: 1, ultima: '2026-11-19' }],
]);

describe('uso', () => {
  it('frequentes: mais vezes primeiro, empate pelo mais recente; 1 vez não conta', () => {
    expect(frequentIds(usage)).toEqual(['leg', 'ext', 'flex']);
  });
  it('rankByUsage mantém a ordem original do resto', () => {
    expect(rankByUsage(['a', 'uma', 'flex', 'b', 'leg'], (x) => x, usage)).toEqual(['leg', 'flex', 'a', 'uma', 'b']);
  });
  it('máquinas somam os exercícios feitos nelas', () => {
    const m = machineUsage(usage, (id) => (id === 'leg' || id === 'uma' ? ['legpress'] : ['cadeira']));
    expect(m.get('legpress')).toEqual({ vezes: 6, ultima: '2026-11-19' });
    expect(m.get('cadeira')).toEqual({ vezes: 4, ultima: '2026-11-18' });
  });
});
