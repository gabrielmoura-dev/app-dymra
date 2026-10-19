/**
 * Extrai o ID e o segundo de início de um link do YouTube.
 * Aceita youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID e /embed/ID, com ?t=90 ou &t=1m30s.
 */
export function parseYouTubeLink(link: string): { youtubeId: string; inicio?: number } | null {
  const s = link.trim();
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
  ];
  let id: string | null = null;
  for (const p of patterns) {
    const m = s.match(p);
    if (m) {
      id = m[1];
      break;
    }
  }
  if (!id && /^[\w-]{11}$/.test(s)) id = s;
  if (!id) return null;
  const t = s.match(/[?&](?:t|start)=([\dhms]+)/);
  let inicio: number | undefined;
  if (t) {
    const v = t[1];
    if (/^\d+$/.test(v)) inicio = Number(v);
    else {
      const h = Number(v.match(/(\d+)h/)?.[1] ?? 0);
      const m = Number(v.match(/(\d+)m/)?.[1] ?? 0);
      const sec = Number(v.match(/(\d+)s/)?.[1] ?? 0);
      inicio = h * 3600 + m * 60 + sec;
    }
  }
  return inicio ? { youtubeId: id, inicio } : { youtubeId: id };
}
