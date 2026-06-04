import React from 'react';
import Svg, { G, Line } from 'react-native-svg';
import { palette } from '../tokens';

interface Props {
  size?: number;
  color?: string;
}

/**
 * Snow crystal — six-fold symmetry, the winter banner motif.
 * Drops on the home banner when Snow Winter season is active.
 */
export function SnowCrystal({
  size = 18,
  color = palette.snowMist,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {[0, 60, 120].map((a) => (
        <G key={a} transform={`rotate(${a} 12 12)`}>
          <Line x1={12} y1={3} x2={12} y2={21} stroke={color} strokeWidth={1} strokeLinecap="round" />
          <Line x1={9} y1={6} x2={12} y2={9} stroke={color} strokeWidth={1} strokeLinecap="round" />
          <Line x1={15} y1={6} x2={12} y2={9} stroke={color} strokeWidth={1} strokeLinecap="round" />
          <Line x1={9} y1={18} x2={12} y2={15} stroke={color} strokeWidth={1} strokeLinecap="round" />
          <Line x1={15} y1={18} x2={12} y2={15} stroke={color} strokeWidth={1} strokeLinecap="round" />
        </G>
      ))}
    </Svg>
  );
}
