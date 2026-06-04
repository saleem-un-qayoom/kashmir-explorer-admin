/**
 * Kashmir Explorer · Type system
 * --------------------------------------------------------------------
 * Fraunces (display, hero) · Inter (UI body) · Cormorant Garamond italic
 * (pull quotes, "uniqueness" callouts) · JetBrains Mono (altitudes, codes).
 * Multi-script support: Noto Nastaliq Urdu, Tiro Devanagari Hindi.
 *
 * On Expo we register these via expo-font in app/_layout.tsx — see the
 * `fontMap` export below.
 */

/* ──────────────────────────────────────────────────────────────────
 * FONT FAMILIES — string references used in StyleSheets.
 * ──────────────────────────────────────────────────────────────── */
export const fonts = {
  serif:     'Fraunces',          // display — Latin
  serifBold: 'Fraunces-Bold',
  sans:      'Inter',             // UI body — Latin
  sansBold:  'Inter-SemiBold',
  mono:      'JetBrainsMono',     // altitudes, codes, coords
  quote:     'CormorantGaramond-Italic', // "what's unique" callouts
  urdu:      'NotoNastaliqUrdu',
  hindi:     'TiroDevanagariHindi',
} as const;

export type FontFamily = (typeof fonts)[keyof typeof fonts];

/* ──────────────────────────────────────────────────────────────────
 * TYPE SCALE — every screen reads from this. Don't inline font sizes.
 * ──────────────────────────────────────────────────────────────── */
export const type = {
  'display-2xl': { fontFamily: fonts.serifBold, fontSize: 48, lineHeight: 56, letterSpacing: -1.9 },
  'display-xl':  { fontFamily: fonts.serifBold, fontSize: 36, lineHeight: 44, letterSpacing: -1.1 },
  'display-lg':  { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 36, letterSpacing: -0.6 },
  'heading-lg':  { fontFamily: fonts.sansBold,  fontSize: 22, lineHeight: 30, letterSpacing: -0.2 },
  'heading-md':  { fontFamily: fonts.sansBold,  fontSize: 18, lineHeight: 26, letterSpacing: 0 },
  'heading-sm':  { fontFamily: fonts.sansBold,  fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  'body-lg':     { fontFamily: fonts.sans,      fontSize: 16, lineHeight: 26, letterSpacing: 0 },
  'body-md':     { fontFamily: fonts.sans,      fontSize: 14, lineHeight: 22, letterSpacing: 0 },
  'body-sm':     { fontFamily: fonts.sans,      fontSize: 13, lineHeight: 20, letterSpacing: 0 },
  'caption':     { fontFamily: fonts.sans,      fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
  'mono':        { fontFamily: fonts.mono,      fontSize: 12, lineHeight: 18, letterSpacing: 0 },
  'quote':       { fontFamily: fonts.quote,     fontSize: 20, lineHeight: 32, letterSpacing: 0, fontStyle: 'italic' as const },
} as const;

export type TypeToken = keyof typeof type;

/* ──────────────────────────────────────────────────────────────────
 * FONT MAP — used by expo-font in apps/mobile/app/_layout.tsx.
 * Each entry maps the family name above to a require() of the .ttf.
 * Fonts are downloaded from Google Fonts and bundled in /assets/fonts.
 * ──────────────────────────────────────────────────────────────── */
export const fontMap = {
  // Fraunces — Variable + display weights
  'Fraunces':           'Fraunces-Regular.ttf',
  'Fraunces-Bold':      'Fraunces-Bold.ttf',
  // Inter
  'Inter':              'Inter-Regular.ttf',
  'Inter-SemiBold':     'Inter-SemiBold.ttf',
  // Mono
  'JetBrainsMono':      'JetBrainsMono-Regular.ttf',
  // Decorative italic
  'CormorantGaramond-Italic': 'CormorantGaramond-Italic.ttf',
  // Multi-script
  'NotoNastaliqUrdu':       'NotoNastaliqUrdu-Regular.ttf',
  'TiroDevanagariHindi':    'TiroDevanagariHindi-Regular.ttf',
} as const;
