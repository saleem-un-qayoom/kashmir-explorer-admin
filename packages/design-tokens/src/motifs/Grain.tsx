import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  Filter,
  FeTurbulence,
  FeColorMatrix,
  Rect,
} from 'react-native-svg';

const absoluteFill = StyleSheet.absoluteFill;

interface Props {
  /** 0–1, default 0.025 (light), use 0.035 for dark mode. */
  opacity?: number;
  style?: ViewStyle;
}

/**
 * Grain overlay — the "secret sauce" from Section 3.3 of the design brief.
 * A 2% noise filter applied as a multiply-blend overlay on every screen.
 * Gives the app a "printed on Kashmiri paper" feel rather than digital flat.
 *
 * Place this absolutely positioned, pointerEvents="none", at the top of
 * each screen.
 */
export function Grain({ opacity = 0.025, style }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[absoluteFill, { opacity }, style]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Filter id="kgrain">
            <FeTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={2}
              stitchTiles="stitch"
            />
            <FeColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 1 0" />
          </Filter>
        </Defs>
        <Rect width="100%" height="100%" filter="url(#kgrain)" />
      </Svg>
    </View>
  );
}
