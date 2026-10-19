export const colors = {
  bg: '#0B0B10',
  surface: '#15151D',
  surface2: '#1F1F2A',
  border: '#2A2A38',
  text: '#F4F4F7',
  muted: '#9C9CAD',
  faint: '#5E5E70',
  accent: '#B8FF3C',
  accentText: '#0B0B10',
  accentSoft: 'rgba(184, 255, 60, 0.14)',
  violet: '#8B6CFF',
  violetSoft: 'rgba(139, 108, 255, 0.16)',
  success: '#3DDC97',
  warning: '#FFB020',
  danger: '#FF5A65',
  dangerSoft: 'rgba(255, 90, 101, 0.14)',
  water: '#3FB6FF',
  waterSoft: 'rgba(63, 182, 255, 0.15)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const font = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  small: 14,
  tiny: 12,
} as const;

/** Cor do mapa muscular: 0 = recém treinado (vermelho), 1 = recuperado (verde). */
export function recoveryColor(recovered: number): string {
  const r = Math.max(0, Math.min(1, recovered));
  if (r >= 0.999) return '#2C2C3A';
  const stops: [number, [number, number, number]][] = [
    [0, [255, 77, 90]],
    [0.5, [255, 176, 32]],
    [1, [61, 220, 151]],
  ];
  let i = 0;
  while (i < stops.length - 2 && r > stops[i + 1][0]) i++;
  const [p0, c0] = stops[i];
  const [p1, c1] = stops[i + 1];
  const t = (r - p0) / (p1 - p0);
  const mix = c0.map((v, k) => Math.round(v + (c1[k] - v) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}
