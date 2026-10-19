import { formatClock, formatDuration } from '../dates';
import { describeSets, formatSeconds } from '../progression';
import { machineIdFromQr, qrContentFor } from '../qr';
import { parseYouTubeLink } from '../youtube';

describe('links do YouTube', () => {
  it('aceita os formatos comuns', () => {
    expect(parseYouTubeLink('https://youtu.be/dQw4w9WgXcQ')).toEqual({ youtubeId: 'dQw4w9WgXcQ' });
    expect(parseYouTubeLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42')).toEqual({ youtubeId: 'dQw4w9WgXcQ', inicio: 42 });
    expect(parseYouTubeLink('https://youtube.com/shorts/dQw4w9WgXcQ?si=abc')).toEqual({ youtubeId: 'dQw4w9WgXcQ' });
    expect(parseYouTubeLink('https://youtu.be/dQw4w9WgXcQ?t=1m30s')).toEqual({ youtubeId: 'dQw4w9WgXcQ', inicio: 90 });
  });
  it('recusa o que não é link do YouTube', () => {
    expect(parseYouTubeLink('https://example.com/video')).toBeNull();
  });
});

describe('QR das máquinas', () => {
  it('ida e volta', () => {
    expect(machineIdFromQr(qrContentFor('leg-press-45'))).toBe('leg-press-45');
    expect(machineIdFromQr('leg-press-45')).toBe('leg-press-45');
    expect(machineIdFromQr('dymra://maquina/nao-existe')).toBeNull();
  });
});

describe('formatação', () => {
  it('durações', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(304)).toBe('5 min');
    expect(formatDuration(3900)).toBe('1h05');
    expect(formatClock(75)).toBe('1:15');
    expect(formatSeconds(30)).toBe('30 s');
    expect(formatSeconds(300)).toBe('5 min');
  });
  it('descreve séries', () => {
    const s = (pesoKg: number, reps: number) => ({ pesoKg, reps, esforco: null, aquecimento: false });
    expect(describeSets([s(40, 12), s(40, 12), s(40, 12)])).toBe('3×12 com 40 kg');
    expect(describeSets([s(40, 12), s(40, 10)])).toBe('12, 10 reps com 40 kg');
  });
});
