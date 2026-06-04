import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { palette } from '../tokens';

interface Props {
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Mughal pointed arch — silhouette of the arches seen in Shalimar Bagh,
 * Nishat Bagh, and Pari Mahal. Used as:
 *
 *   • Bottom-sheet handle (replaces the generic gray bar)
 *   • Modal frame
 *   • Photo gallery frame
 *   • The shape of our map pins
 */
export function MughalArch({
  width = 14,
  height = 8,
  color = palette.pashminaDk,
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 28 14" fill="none">
      <Path
        d="M2 14 L 2 8 Q 2 1, 14 1 Q 26 1, 26 8 L 26 14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Bottom-sheet handle in the shape of a Mughal arch silhouette.
 * 12px wide, 6px tall, centered. Pashmina cream on light, dal blue on dark.
 */
export function MughalArchHandle({
  color = palette.pashminaDk,
}: { color?: string }) {
  return (
    <Svg width={28} height={8} viewBox="0 0 28 8" fill="none">
      <Path
        d="M4 8 L 4 5 Q 4 1, 14 1 Q 24 1, 24 5 L 24 8"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}
