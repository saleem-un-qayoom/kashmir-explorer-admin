/**
 * Kashmir Explorer · Seasonal theme overlays
 * --------------------------------------------------------------------
 * The single most distinguishing UI feature: the home banner and
 * accent intensity rotate with the season.
 *
 *   Tulip Spring   · Mar 15 – May 15 · crimson → almond → emerald
 *   Trek Summer    · May 16 – Sep 15 · dal blue dominant
 *   Chinar Autumn  · Sep 16 – Nov 15 · red → amber → mustard
 *   Snow Winter    · Nov 16 – Mar 14 · dal deep → snow mist → white
 */

import { palette } from './tokens';

export type SeasonId = 'tulip' | 'trek' | 'chinar' | 'snow';

export interface Season {
  id: SeasonId;
  name: string;
  range: string;
  /** Three-stop gradient — first/middle/end. */
  gradient: [string, string, string];
  accent: string;
  motif: 'tulip' | 'mountain' | 'chinar' | 'snow';
}

export const seasons: Record<SeasonId, Season> = {
  tulip:  {
    id: 'tulip',
    name: 'Tulip Spring',
    range: 'MAR 15 – MAY 15',
    gradient: [palette.tulip, palette.almond, palette.mughalEmerald],
    accent: palette.tulip,
    motif: 'tulip',
  },
  trek:   {
    id: 'trek',
    name: 'Trek Summer',
    range: 'MAY 16 – SEP 15',
    gradient: [palette.dalBlue, '#4A8FB5', palette.mughalEmerald],
    accent: palette.dalBlue,
    motif: 'mountain',
  },
  chinar: {
    id: 'chinar',
    name: 'Chinar Autumn',
    range: 'SEP 16 – NOV 15',
    gradient: [palette.chinarRed, palette.chinarAmber, palette.pheranMustard],
    accent: palette.chinarAmber,
    motif: 'chinar',
  },
  snow:   {
    id: 'snow',
    name: 'Snow Winter',
    range: 'NOV 16 – MAR 14',
    gradient: [palette.dalDeep, palette.snowMist, '#FFFFFF'],
    accent: palette.dalDeep,
    motif: 'snow',
  },
};

/**
 * Pick the active season from a Date. Defaults to today.
 * Edge case: snow wraps year boundary — Nov 16 to Mar 14.
 */
export function currentSeason(d: Date = new Date()): Season {
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();

  // Spring: Mar 15 – May 15
  if ((month === 3 && day >= 15) || month === 4 || (month === 5 && day <= 15)) {
    return seasons.tulip;
  }
  // Summer: May 16 – Sep 15
  if ((month === 5 && day >= 16) || (month >= 6 && month <= 8) || (month === 9 && day <= 15)) {
    return seasons.trek;
  }
  // Autumn: Sep 16 – Nov 15
  if ((month === 9 && day >= 16) || month === 10 || (month === 11 && day <= 15)) {
    return seasons.chinar;
  }
  // Winter: everything else (wraps year)
  return seasons.snow;
}
