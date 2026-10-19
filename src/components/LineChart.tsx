import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { formatDateShort } from '@/logic/dates';
import { formatKg } from '@/logic/strength';
import { colors } from '@/theme';

import { Txt } from './ui';

export interface ChartPoint {
  data: string;
  valor: number;
}

/** Gráfico de linha simples para evolução (carga, 1RM, peso corporal...). */
export function LineChart({
  points,
  unit,
  height = 180,
  color = colors.accent,
}: {
  points: ChartPoint[];
  unit: string;
  height?: number;
  color?: string;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (points.length === 0) {
    return (
      <Txt variant="small" color={colors.muted}>
        Ainda sem dados para o gráfico.
      </Txt>
    );
  }

  const padL = 36;
  const padR = 12;
  const padT = 14;
  const padB = 24;
  const values = points.map((p) => p.valor);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  min -= range * 0.1;
  max += range * 0.1;

  const w = Math.max(0, width - padL - padR);
  const h = height - padT - padB;
  const x = (i: number) => padL + (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w);
  const y = (v: number) => padT + h - ((v - min) / (max - min)) * h;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const ticks = [max, (max + min) / 2, min];

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {ticks.map((t, i) => (
            <Line key={i} x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke={colors.border} strokeDasharray="3,4" />
          ))}
          {ticks.map((t, i) => (
            <SvgText key={`l${i}`} x={padL - 6} y={y(t) + 4} fill={colors.muted} fontSize={10} textAnchor="end">
              {formatKg(Math.round(t * 10) / 10)}
            </SvgText>
          ))}
          <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <Circle key={i} cx={x(i)} cy={y(p.valor)} r={i === points.length - 1 ? 4.5 : 2.5} fill={color} />
          ))}
          <SvgText x={padL} y={height - 6} fill={colors.muted} fontSize={10}>
            {formatDateShort(points[0].data)}
          </SvgText>
          {points.length > 1 ? (
            <SvgText x={width - padR} y={height - 6} fill={colors.muted} fontSize={10} textAnchor="end">
              {formatDateShort(last.data)}
            </SvgText>
          ) : null}
        </Svg>
      ) : null}
      <View style={{ position: 'absolute', right: padR, top: 0 }}>
        <Txt variant="tiny" color={color} bold>
          {`${formatKg(Math.round(last.valor * 10) / 10)} ${unit}`}
        </Txt>
      </View>
    </View>
  );
}
