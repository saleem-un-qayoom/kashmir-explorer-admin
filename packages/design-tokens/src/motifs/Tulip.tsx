import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { palette } from '../tokens';

interface Props {
  size?: number;
  color?: string;
}

/**
 * Tulip — the spring banner motif.
 * The Indira Gandhi Memorial Tulip Garden in Srinagar is Asia's largest,
 * with 1.7M tulips blooming late March – mid April.
 */
export function Tulip({ size = 18, color = palette.tulip }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4 Q 7 7, 7 13 Q 7 15, 9 15 L 12 13 L 15 15 Q 17 15, 17 13 Q 17 7, 12 4 Z"
        fill={color}
      />
      <Path d="M12 13 L 12 22" stroke={palette.mughalEmerald} strokeWidth={1.2} />
      <Path
        d="M12 18 Q 8 17, 7 14"
        stroke={palette.mughalEmerald}
        strokeWidth={1.2}
        fill="none"
      />
    </Svg>
  );
}

/**
 * Saffron crocus stigma — Kashmir's most famous export.
 * Three red threads above a green stem. Used in cultural-context tiles.
 */
export function SaffronCrocus({
  size = 18,
  color = palette.kongSaffron,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 18 Q 9 14, 6 13"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M12 18 L 12 8"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M12 18 Q 15 14, 18 13"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M9 21 Q 12 19, 15 21"
        stroke={palette.mughalEmerald}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
