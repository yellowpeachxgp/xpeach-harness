/**
 * XPeach colour palettes.
 *
 * The stock theme layer offers a light and a dark base and nothing between, so
 * every install looks the same. These palettes register beside those two: each
 * declares both modes (the theme contract requires a paired value), so switching
 * the base mode keeps the palette legible instead of falling back to stock.
 *
 * Only the surfaces a palette should tint are overridden — background layers,
 * borders and the accent — so text and status colours keep the stock contrast
 * decisions.
 */

/** Locale key for a palette display name. */
export type PaletteLabelKey = 'palette.peach' | 'palette.forest' | 'palette.sea' | 'palette.dusk'

/** One palette's paired values, keyed by alias token. */
export interface Palette {
  readonly id: string
  readonly label: PaletteLabelKey
  /** Which stock base the palette is tuned against when the user follows system. */
  readonly scheme: 'light' | 'dark'
  readonly light: Readonly<Record<string, string>>
  readonly dark: Readonly<Record<string, string>>
}

/** Surfaces every palette tints; everything else keeps the stock decision. */
const TINTED = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-border-l1',
  '--dsw-alias-brand-primary',
] as const

/**
 * Build one palette from its five tinted values per mode.
 * @param id - theme id.
 * @param label - locale key for the display name.
 * @param scheme - base mode this palette reads best against.
 * @param light - the five values for light mode, in {@link TINTED} order.
 * @param dark - the five values for dark mode, in {@link TINTED} order.
 * @returns the palette.
 */
function palette(id: string, label: PaletteLabelKey, scheme: 'light' | 'dark', light: readonly string[], dark: readonly string[]): Palette {
  const pair = (values: readonly string[]): Record<string, string> =>
    Object.fromEntries(TINTED.map((token, index) => [token, values[index] ?? values[0] ?? '']))
  return { id, label, scheme, light: pair(light), dark: pair(dark) }
}

/** The palettes this product ships. */
export const PALETTES: readonly Palette[] = Object.freeze([
  // The brand peach: warm paper by day, charcoal with a peach cast at night.
  palette('peach', 'palette.peach', 'light',
    ['#fffaf7', '#fff4ee', '#ffe8dc', '#f7d8c9', '#f17c52'],
    ['#1b1512', '#241b17', '#2e231d', '#4a3428', '#f17c52']),
  // Forest: a quiet green that reads as paper rather than as a terminal.
  palette('forest', 'palette.forest', 'light',
    ['#f8fbf8', '#f0f6f0', '#e3efe3', '#cfe3cf', '#3f8f5f'],
    ['#111814', '#161f19', '#1d2821', '#2e4034', '#5cb382']),
  // Sea salt: cool without going blue-on-blue.
  palette('sea', 'palette.sea', 'light',
    ['#f8fbfc', '#eff6f8', '#e2eef2', '#cde2e9', '#3f8fa8'],
    ['#0f171a', '#141e22', '#1a262b', '#294047', '#5aa8c0']),
  // Dusk: violet that stays readable, not neon.
  palette('dusk', 'palette.dusk', 'light',
    ['#fbf9fd', '#f5f0fa', '#ebe3f5', '#dbcdec', '#7c5fb0'],
    ['#171320', '#1d1828', '#252032', '#3a3050', '#a184d8']),
])

/**
 * Turn one palette into the token map a theme definition carries.
 *
 * A definition's `tokens` are single values applied over the base palette, so a
 * palette is registered once per mode: the light palette carries the light
 * values and the dark palette the dark ones, and the id names which is which.
 * @param definition - palette to convert.
 * @param mode - which of the palette's two value sets to use.
 * @returns alias tokens to values.
 */
export function paletteTokens(definition: Palette, mode: 'light' | 'dark'): Record<string, string> {
  const values = mode === 'light' ? definition.light : definition.dark
  const out: Record<string, string> = {}
  for (const token of TINTED) {
    const value = values[token]
    if (value !== undefined && value !== '') out[token] = value
  }
  return out
}
