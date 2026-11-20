import { Image } from 'expo-image';
import { View } from 'react-native';

import { getExercise, getMachine } from '@/catalog';
import type { Exercise, RoutineDay } from '@/catalog/types';
import { colors, radius } from '@/theme';

import { Icon, Row, Txt } from './ui';

/** Onde fazer o exercício: área da academia e máquina (sem repetir quando a máquina tem o nome do exercício). */
export function localDe(ex: Exercise): { area: string | null; maquina: string | null; texto: string } {
  const m = getMachine(ex.maquinaIds[0]);
  if (!m) return { area: null, maquina: null, texto: '' };
  const maquina = m.nome !== ex.nome ? m.nome : null;
  return { area: m.area, maquina, texto: [m.area, maquina].filter(Boolean).join(' · ') };
}

/** Áreas da academia na ordem do treino, sem repetir áreas seguidas: ["Cardio", "Pernas", "Peito"]. */
export function roteiro(day: RoutineDay): string[] {
  const out: string[] = [];
  for (const r of day.exercicios) {
    const ex = getExercise(r.exercicioId);
    const area = ex ? getMachine(ex.maquinaIds[0])?.area : undefined;
    if (area && out.at(-1) !== area) out.push(area);
  }
  return out;
}

/** Linha "📍 Pernas · Leg press 45°". */
export function Local({ ex, extra }: { ex: Exercise; extra?: string }) {
  const { texto } = localDe(ex);
  const linha = [texto, extra].filter(Boolean).join(' · ');
  if (!linha) return null;
  return (
    <Row gap={4}>
      <Icon name="location-outline" size={13} color={colors.violet} />
      <Txt variant="tiny" numberOfLines={1} style={{ flexShrink: 1 }}>
        {linha}
      </Txt>
    </Row>
  );
}

/** Foto da máquina (ou ícone, enquanto o catálogo não tem foto). */
export function FotoMaquina({ ex, size = 48 }: { ex: Exercise; size?: number }) {
  const foto = getMachine(ex.maquinaIds[0])?.foto;
  const style = { width: size, height: size, borderRadius: radius.md, backgroundColor: colors.surface2 };
  return foto ? (
    <Image source={foto} style={style} />
  ) : (
    <View style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
      <Icon name="barbell-outline" size={size * 0.5} color={colors.faint} />
    </View>
  );
}
