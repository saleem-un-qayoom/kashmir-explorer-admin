import React from 'react';
import Svg, { Path, Ellipse, Line } from 'react-native-svg';
import { palette } from '../tokens';

interface Props {
  size?: number;
  color?: string;
}

/**
 * Shikara — the iconic flat-bottomed wooden boat used as taxi-and-home on
 * Dal Lake. Used as the pull-to-refresh animation: the boat slides into
 * view, paddles once, then disappears.
 */
export function Shikara({ size = 60, color = palette.dalBlue }: Props) {
  return (
    <Svg
      width={size}
      height={size * 0.5}
      viewBox="0 0 80 40"
      fill="none"
    >
      {/* hull */}
      <Path
        d="M4 28 Q 8 20, 16 20 L 64 20 Q 72 20, 76 28 L 70 32 L 10 32 Z"
        fill={color}
        opacity={0.92}
      />
      <Path
        d="M16 20 Q 18 14, 26 14 L 54 14 Q 62 14, 64 20"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
        opacity={0.6}
      />
      {/* canopy */}
      <Path
        d="M28 14 Q 28 6, 40 6 Q 52 6, 52 14"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
      />
      <Line x1={40} y1={6} x2={40} y2={14} stroke={color} strokeWidth={1} opacity={0.5} />
      {/* paddle */}
      <Line
        x1={60}
        y1={10}
        x2={78}
        y2={2}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Ellipse
        cx={78}
        cy={2}
        rx={3}
        ry={1.5}
        fill={color}
        transform="rotate(-20 78 2)"
      />
      {/* ripple */}
      <Path
        d="M2 36 Q 20 38, 40 36 T 78 36"
        stroke={color}
        strokeWidth={0.8}
        opacity={0.35}
        fill="none"
      />
    </Svg>
  );
}
