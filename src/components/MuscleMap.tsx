import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import type { Muscle } from '@/catalog/types';
import { colors, recoveryColor } from '@/theme';

/**
 * Mapa do corpo (frente e costas).
 * - mode "recuperacao": valor 0 (cansado, vermelho) a 1 (recuperado, cinza/verde).
 * - mode "intensidade": valor 0..1 do quanto o músculo foi trabalhado (verde-limão).
 */
export function MuscleMap({
  values,
  mode,
  height = 260,
}: {
  values: Partial<Record<Muscle, number>>;
  mode: 'recuperacao' | 'intensidade';
  height?: number;
}) {
  const fill = (m: Muscle): string => {
    const v = values[m];
    if (mode === 'recuperacao') return recoveryColor(v ?? 1);
    if (!v || v <= 0) return colors.surface2;
    return colors.accent;
  };
  const opacity = (m: Muscle): number => {
    if (mode === 'recuperacao') return 1;
    const v = values[m] ?? 0;
    return v <= 0 ? 1 : 0.35 + 0.65 * Math.min(1, v);
  };
  const p = (m: Muscle) => ({ fill: fill(m), fillOpacity: opacity(m) });
  const neutral = { fill: '#262633' };

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="100%" height={height} viewBox="0 0 400 330">
        {/* ---------- FRENTE ---------- */}
        <G>
          <Circle cx={100} cy={30} r={18} {...neutral} />
          <Rect x={92} y={46} width={16} height={12} {...neutral} />
          <Polygon points="86,58 100,54 114,58 112,64 88,64" {...p('trapezio')} />
          <Ellipse cx={66} cy={74} rx={13} ry={12} {...p('ombro-anterior')} />
          <Ellipse cx={134} cy={74} rx={13} ry={12} {...p('ombro-anterior')} />
          <Ellipse cx={56} cy={80} rx={6} ry={11} {...p('ombro-lateral')} />
          <Ellipse cx={144} cy={80} rx={6} ry={11} {...p('ombro-lateral')} />
          <Rect x={74} y={66} width={25} height={27} rx={9} {...p('peitoral')} />
          <Rect x={101} y={66} width={25} height={27} rx={9} {...p('peitoral')} />
          <Ellipse cx={56} cy={106} rx={8} ry={16} {...p('biceps')} />
          <Ellipse cx={144} cy={106} rx={8} ry={16} {...p('biceps')} />
          <Ellipse cx={50} cy={142} rx={7} ry={18} {...p('antebraco')} />
          <Ellipse cx={150} cy={142} rx={7} ry={18} {...p('antebraco')} />
          <Circle cx={47} cy={167} r={6} {...neutral} />
          <Circle cx={153} cy={167} r={6} {...neutral} />
          <Rect x={87} y={96} width={26} height={52} rx={8} {...p('abdomen')} />
          <Rect x={76} y={97} width={9} height={45} rx={4} {...p('obliquos')} />
          <Rect x={115} y={97} width={9} height={45} rx={4} {...p('obliquos')} />
          <Polygon points="80,150 120,150 112,172 88,172" {...neutral} />
          <Ellipse cx={84} cy={210} rx={14} ry={38} {...p('quadriceps')} />
          <Ellipse cx={116} cy={210} rx={14} ry={38} {...p('quadriceps')} />
          <Ellipse cx={95.5} cy={192} rx={4.5} ry={20} {...p('adutores')} />
          <Ellipse cx={104.5} cy={192} rx={4.5} ry={20} {...p('adutores')} />
          <Circle cx={84} cy={252} r={7} {...neutral} />
          <Circle cx={116} cy={252} r={7} {...neutral} />
          <Ellipse cx={84} cy={284} rx={9} ry={26} {...p('panturrilha')} />
          <Ellipse cx={116} cy={284} rx={9} ry={26} {...p('panturrilha')} />
          <Ellipse cx={82} cy={316} rx={9} ry={5} {...neutral} />
          <Ellipse cx={118} cy={316} rx={9} ry={5} {...neutral} />
          <SvgText x={100} y={328} fill={colors.muted} fontSize={11} textAnchor="middle">
            Frente
          </SvgText>
        </G>

        {/* ---------- COSTAS ---------- */}
        <G transform="translate(200, 0)">
          <Circle cx={100} cy={30} r={18} {...neutral} />
          <Rect x={92} y={46} width={16} height={12} {...neutral} />
          <Polygon points="82,60 100,52 118,60 110,94 100,102 90,94" {...p('trapezio')} />
          <Ellipse cx={66} cy={74} rx={13} ry={12} {...p('ombro-posterior')} />
          <Ellipse cx={134} cy={74} rx={13} ry={12} {...p('ombro-posterior')} />
          <Ellipse cx={56} cy={80} rx={6} ry={11} {...p('ombro-lateral')} />
          <Ellipse cx={144} cy={80} rx={6} ry={11} {...p('ombro-lateral')} />
          <Polygon points="76,82 89,94 92,132 80,126 73,102" {...p('dorsais')} />
          <Polygon points="124,82 111,94 108,132 120,126 127,102" {...p('dorsais')} />
          <Ellipse cx={56} cy={106} rx={8} ry={16} {...p('triceps')} />
          <Ellipse cx={144} cy={106} rx={8} ry={16} {...p('triceps')} />
          <Ellipse cx={50} cy={142} rx={7} ry={18} {...p('antebraco')} />
          <Ellipse cx={150} cy={142} rx={7} ry={18} {...p('antebraco')} />
          <Circle cx={47} cy={167} r={6} {...neutral} />
          <Circle cx={153} cy={167} r={6} {...neutral} />
          <Rect x={90} y={112} width={20} height={36} rx={6} {...p('lombar')} />
          <Ellipse cx={79} cy={154} rx={8} ry={8} {...p('gluteo-medio')} />
          <Ellipse cx={121} cy={154} rx={8} ry={8} {...p('gluteo-medio')} />
          <Ellipse cx={89} cy={168} rx={13} ry={14} {...p('gluteos')} />
          <Ellipse cx={111} cy={168} rx={13} ry={14} {...p('gluteos')} />
          <Ellipse cx={84} cy={218} rx={13} ry={32} {...p('posteriores')} />
          <Ellipse cx={116} cy={218} rx={13} ry={32} {...p('posteriores')} />
          <Ellipse cx={96} cy={205} rx={4} ry={16} {...p('adutores')} />
          <Ellipse cx={104} cy={205} rx={4} ry={16} {...p('adutores')} />
          <Circle cx={84} cy={254} r={6} {...neutral} />
          <Circle cx={116} cy={254} r={6} {...neutral} />
          <Ellipse cx={84} cy={282} rx={11} ry={26} {...p('panturrilha')} />
          <Ellipse cx={116} cy={282} rx={11} ry={26} {...p('panturrilha')} />
          <Ellipse cx={82} cy={316} rx={9} ry={5} {...neutral} />
          <Ellipse cx={118} cy={316} rx={9} ry={5} {...neutral} />
          <SvgText x={100} y={328} fill={colors.muted} fontSize={11} textAnchor="middle">
            Costas
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

export function RecoveryLegend() {
  const items = [
    { c: recoveryColor(0), t: 'Cansado' },
    { c: recoveryColor(0.5), t: 'Recuperando' },
    { c: recoveryColor(0.95), t: 'Quase pronto' },
    { c: recoveryColor(1), t: 'Pronto' },
  ];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
      {items.map((i) => (
        <View key={i.t} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i.c }} />
          <Text style={{ color: colors.muted, fontSize: 12 }}>{i.t}</Text>
        </View>
      ))}
    </View>
  );
}
