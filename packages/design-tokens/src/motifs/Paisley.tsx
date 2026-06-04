import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../tokens';

interface PaisleyProps {
  size?: number;
  color?: string;
  stroke?: number;
}

/**
 * Paisley (boteh) — Kashmir's signature motif.
 * The curve started in Kashmir and reached Paisley, Scotland in the 1800s.
 * Used as section dividers, empty-state illustrations, and loading spinners.
 */
export function Paisley({
  size = 18,
  color = palette.kongSaffron,
  stroke = 1.2,
}: PaisleyProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2 C 7 4, 5 9, 5 13 C 5 17, 8 21, 12 21 C 17 21, 20 17, 20 12 C 20 9, 18 7, 15 7 C 13 7, 11.5 8.5, 11.5 10.5 C 11.5 12, 12.8 13, 14 13 C 14.8 13, 15.5 12.3, 15.5 11.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 14 C 9.5 12.5, 11 11.5, 12.5 11"
        stroke={color}
        strokeWidth={stroke * 0.7}
        strokeLinecap="round"
        opacity={0.55}
      />
    </Svg>
  );
}

/**
 * Rotating-paisley loading spinner. Replaces the generic circular spinner —
 * the paisley draws then rotates, 1.2s per revolution.
 *
 * Respect `prefers-reduced-motion`: if your accessibility layer detects it,
 * pass `reducedMotion` to skip the rotation.
 */
export function PaisleySpinner({
  size = 28,
  color = palette.kongSaffron,
  reducedMotion = false,
}: PaisleyProps & { reducedMotion?: boolean }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [rotation, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
      <Paisley size={size} color={color} stroke={1.4} />
    </Animated.View>
  );
}

/**
 * Static paisley used as a section divider. Centered, faded by default.
 */
export function PaisleyDivider({
  color = palette.kangriTerra,
  width: w = '60%',
}: { color?: string; width?: number | string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        alignSelf: 'center',
        width: w as number,
        opacity: 0.55,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: color, opacity: 0.4 }} />
      <Paisley size={14} color={color} stroke={1} />
      <View style={{ flex: 1, height: 1, backgroundColor: color, opacity: 0.4 }} />
    </View>
  );
}
