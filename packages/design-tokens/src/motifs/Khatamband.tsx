import React from 'react';
import Svg, {
  Defs,
  Pattern,
  Rect,
  G,
  Polygon,
  Line,
} from 'react-native-svg';
import { palette } from '../tokens';

interface Props {
  /** Tile color. Default: walnut. */
  color?: string;
  /** 0–1. Light mode: 0.05. Dark mode: 0.08. */
  opacity?: number;
  /** Tile size in px. */
  size?: number;
  /** Outer width/height — defaults to fill parent. */
  width?: number | string;
  height?: number | string;
}

/**
 * Khatamband — interlocking geometric wood inlay used in Kashmiri ceilings
 * (the famous Hazratbal khatamband ceiling, also seen in Mughal pavilions).
 *
 * Renders as a tiling SVG pattern. Apply absolutely-positioned over a card
 * or screen background as a subtle texture.
 */
export function Khatamband({
  color = palette.pashminaDk,
  opacity = 0.05,
  size = 26,
  width = '100%',
  height = '100%',
}: Props) {
  const id = React.useId();
  const patternId = `kh-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const half = size / 2;
  const quarter = size / 4;
  const threeQuarter = size * 0.75;

  return (
    <Svg
      width={width as number}
      height={height as number}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <Pattern
          id={patternId}
          x={0}
          y={0}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <G stroke={color} strokeWidth={0.5} fill="none" opacity={opacity * 20}>
            <Polygon
              points={`${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}`}
            />
            <Polygon
              points={`${half},${quarter} ${threeQuarter},${half} ${half},${threeQuarter} ${quarter},${half}`}
            />
            <Line x1={0} y1={half} x2={size} y2={half} />
            <Line x1={half} y1={0} x2={half} y2={size} />
          </G>
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${patternId})`} opacity={opacity} />
    </Svg>
  );
}
