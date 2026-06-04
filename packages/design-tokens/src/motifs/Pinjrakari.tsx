import React from 'react';
import Svg, { Defs, Pattern, Rect, Path } from 'react-native-svg';
import { palette } from '../tokens';

interface Props {
  color?: string;
  opacity?: number;
  height?: number;
  width?: number | string;
}

/**
 * Pinjrakari — the wooden jali (lattice) work of Kashmiri windows and
 * mosque screens. Light filters through it in patterns.
 *
 * Rendered as a horizontal strip. Place under sticky headers, inside
 * filter sheets, or as a divider between sections.
 */
export function PinjrakariStrip({
  color = palette.kangriTerra,
  opacity = 0.5,
  height = 12,
  width = '100%',
}: Props) {
  const id = React.useId();
  const patternId = `pj-${id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Svg
      width={width as number}
      height={height}
      viewBox={`0 0 200 ${height}`}
      preserveAspectRatio="none"
    >
      <Defs>
        <Pattern
          id={patternId}
          x={0}
          y={0}
          width={16}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <Path
            d={`M0 ${height / 2} L8 0 L16 ${height / 2} L8 ${height} Z M8 0 L8 ${height}`}
            fill="none"
            stroke={color}
            strokeWidth={0.6}
            opacity={opacity}
          />
        </Pattern>
      </Defs>
      <Rect width={200} height={height} fill={`url(#${patternId})`} />
    </Svg>
  );
}
