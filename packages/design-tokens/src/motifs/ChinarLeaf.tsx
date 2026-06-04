import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { palette } from '../tokens';

interface Props {
  size?: number;
  color?: string;
  fill?: string;
}

/**
 * Chinar leaf — the broad-leaved plane tree (Platanus orientalis) that turns
 * Kashmir crimson in October. Five-pointed; the symbol on the J&K coat-of-arms.
 *
 * Used as:
 *   • Bullet markers in lists
 *   • The 12-month strip on destination detail cards
 *   • Autumn loading animation (leaves falling)
 */
export function ChinarLeaf({
  size = 18,
  color = palette.chinarRed,
  fill = 'none',
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill === 'none' ? 'none' : color}
    >
      <Path
        d="M12 22 L12 14 L 6 9 L 8 6 L 10 8 L 12 4 L 14 8 L 16 6 L 18 9 L 14 14 L 20 13 L 18 17 L 14 16 L 12 14 L 10 16 L 6 17 L 4 13 L 10 14 Z"
        stroke={color}
        strokeWidth={1.1}
        strokeLinejoin="round"
        fill={fill === 'none' ? 'none' : fill}
      />
    </Svg>
  );
}
