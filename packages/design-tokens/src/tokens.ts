/**
 * Kashmir Explorer · V2 design tokens
 * --------------------------------------------------------------------
 * "Paradise, with the receipts." A Kashmiri-native palette — saffron,
 * Dal Lake, pashmina wool, chinar leaves, sapphires, carpet dyes.
 * NOT the standard tourist-board green.
 *
 * Ported from design/project/kashmir-shared.jsx.
 */

// ────────────────────────────────────────────────────────────────────
// PRIMARY PALETTE
// Each color is named after a real Kashmiri reference, not a function.
// ────────────────────────────────────────────────────────────────────
export const palette = {
  // Saffron — Kashmir's most famous export. Kong = saffron in Kashmiri.
  kongSaffron: '#E8893A', // primary CTA, hero highlights
  kongDeep:    '#A65420', // pressed state, dark saffron accents

  // Dal Lake — at dusk and at midnight.
  dalBlue:     '#2A5266', // brand, headers, navigation
  dalDeep:     '#15303E', // dark backgrounds

  // Chinar leaf — the broad-leaved plane tree that turns Kashmir red in October.
  chinarRed:   '#B23A2E', // errors, critical advisories
  chinarAmber: '#D97444', // warnings, autumn banner

  // Pashmina — the wool that built Kashmir's textile economy.
  pashmina:    '#F5EBDC', // light base background — raw pashmina wool
  pashminaDk:  '#3D352A', // walnut wood text on cream

  // Secondary
  sapphire:    '#1F4788', // Kashmiri sapphire — premium / verified badges
  almond:      '#F4C6C0', // almond blossom — spring banner
  tulip:       '#C72D3D', // tulip festival
  mughalEmerald:'#2D6A4F', // cultural / spiritual / Mughal Gardens
  pheranMustard:'#C9A227', // gold thread embroidery highlight
  snowMist:    '#EDF2F5', // winter
  kangriTerra: '#8B4513', // walnut wood UI
} as const;

// ────────────────────────────────────────────────────────────────────
// FUNCTIONAL TOKENS (semantic, theme-aware)
// Two flavours: light (`bg.primary` = pashmina cream) and
// dark (`bg.primary` = dal-deep). Pick via `tokens('light')`.
// ────────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark';

export const lightTokens = {
  bg: {
    primary: palette.pashmina,    // pashmina cream
    surface: '#FFFFFF',
    raised:  '#FAF3E7',
  },
  text: {
    primary:   '#1A1612',
    secondary: '#5A4F42',
    tertiary:  '#8B7E6F',
    inverse:   palette.pashmina,
  },
  border: {
    subtle: '#E5D9C5',
    strong: '#C9B89C',
  },
  accent: {
    primary:  palette.kongSaffron,
    success:  palette.mughalEmerald,
    warning:  palette.chinarAmber,
    danger:   palette.chinarRed,
    info:     palette.dalBlue,
    premium:  palette.sapphire,
  },
  brand: {
    primary: palette.dalBlue,
    cta:     palette.kongSaffron,
  },
} as const;

export const darkTokens = {
  bg: {
    primary: '#0F1B22',  // deep lake night
    surface: '#172832',
    raised:  '#1E3340',
  },
  text: {
    primary:   palette.pashmina,
    secondary: '#A89B89',
    tertiary:  '#6A6253',
    inverse:   '#1A1612',
  },
  border: {
    subtle: '#2A3D48',
    strong: '#3D556B',
  },
  accent: {
    primary:  '#F0A05A',          // saffron brightened for dark mode
    success:  '#52B788',
    warning:  '#F4A261',
    danger:   '#E76F51',
    info:     '#4A8FB5',
    premium:  '#5B7FB5',
  },
  brand: {
    primary: palette.dalBlue,
    cta:     '#F0A05A',
  },
} as const;

export type Tokens = typeof lightTokens;

export function tokens(theme: Theme): Tokens {
  return theme === 'light' ? lightTokens : (darkTokens as unknown as Tokens);
}

// Short, ergonomic re-export for screen code that doesn't care about theming.
// Mirrors the `K` object in kashmir-shared.jsx so the prototype port reads 1:1.
export const K = {
  saffron:     palette.kongSaffron,
  saffronDeep: palette.kongDeep,
  dalBlue:     palette.dalBlue,
  dalDeep:     palette.dalDeep,
  chinarRed:   palette.chinarRed,
  chinarAmber: palette.chinarAmber,
  pashmina:    palette.pashmina,
  pashminaDk:  palette.pashminaDk,
  sapphire:    palette.sapphire,
  almond:      palette.almond,
  tulip:       palette.tulip,
  emerald:     palette.mughalEmerald,
  mustard:     palette.pheranMustard,
  snowMist:    palette.snowMist,
  terra:       palette.kangriTerra,
  bg:          palette.pashmina,
  surface:     '#FFFFFF',
  raised:      '#FAF3E7',
  text:        '#1A1612',
  text2:       '#5A4F42',
  text3:       '#8B7E6F',
  line:        '#E5D9C5',
  lineStrong:  '#C9B89C',
  // Aliases for compatibility with palette names used directly in screens
  kongSaffron:  palette.kongSaffron,
  kongDeep:     palette.kongDeep,
  kangriTerra:  palette.kangriTerra,
} as const;

// ────────────────────────────────────────────────────────────────────
// SPACING — 4pt grid, with Kashmiri-named convenience aliases.
// ────────────────────────────────────────────────────────────────────
export const space = {
  '0':   0,
  '0.5': 2,
  '1':   4,
  '1.5': 6,
  '2':   8,
  '3':   12,
  '4':   16,
  '5':   20,
  '6':   24,
  '7':   28,
  '8':   32,
  '10':  40,
  '12':  48,
  '16':  64,
  '20':  80,
  '24':  96,
} as const;

// ────────────────────────────────────────────────────────────────────
// RADIUS — slightly less round than Material. Hand-cut paper feel.
// ────────────────────────────────────────────────────────────────────
export const radius = {
  none:    0,
  xs:      2,
  sm:      4,
  md:      6,    // standard button
  lg:      8,    // cards
  xl:      12,
  '2xl':   16,
  '3xl':   24,
  full:    9999,
} as const;

// ────────────────────────────────────────────────────────────────────
// SHADOWS — warm, low-blur. Never the harsh cool Material shadow.
// ────────────────────────────────────────────────────────────────────
export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#3D352A', // pashminaDk (warm)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#3D352A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#3D352A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ────────────────────────────────────────────────────────────────────
// MOTION — `ease-kashmir` feels considered, not bouncy.
// ────────────────────────────────────────────────────────────────────
export const motion = {
  duration: {
    micro:    120,  // tap feedback
    standard: 280,  // sheet open, navigation
    hero:     600,  // splash, season change
    season:   800,  // banner dissolve
  },
  // Bezier values for Reanimated / Animated.timing.
  easing: {
    kashmir: [0.32, 0.72, 0, 1] as const,
  },
} as const;
