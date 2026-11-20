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
export const TINTED_TOKENS = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-layer-3',
  '--dsw-specific-sidebar-fill',
  '--dsw-specific-sidebar-nav-item-hover',
  '--dsw-specific-sidebar-nav-item-active',
  '--dsw-specific-selector',
  '--dsw-alias-settings-card-fill',
  '--dsw-alias-border-l1',
  '--dsw-alias-brand-primary',
  '--dsw-alias-button-primary-hover',
  '--dsw-alias-label-primary-foreground',
  '--dsw-alias-state-business-primary',
] as const

interface PaletteModeSpec {
  readonly base: string
  readonly layer1: string
  readonly layer2: string
  readonly layer3: string
  readonly sidebar: string
  readonly sidebarHover: string
  readonly sidebarActive: string
  readonly selector: string
  readonly borderL1: string
  readonly brand: string
  readonly brandHover: string
  readonly brandForeground: string
  readonly business: string
}

function toTokenMap(spec: PaletteModeSpec): Record<string, string> {
  return {
    '--dsw-alias-bg-base': spec.base,
    '--dsw-alias-bg-layer-1': spec.layer1,
    '--dsw-alias-bg-layer-2': spec.layer2,
    '--dsw-alias-bg-layer-3': spec.layer3,
    '--dsw-specific-sidebar-fill': spec.sidebar,
    '--dsw-specific-sidebar-nav-item-hover': spec.sidebarHover,
    '--dsw-specific-sidebar-nav-item-active': spec.sidebarActive,
    '--dsw-specific-selector': spec.selector,
    '--dsw-alias-settings-card-fill': spec.layer2,
    '--dsw-alias-border-l1': spec.borderL1,
    '--dsw-alias-brand-primary': spec.brand,
    '--dsw-alias-button-primary-hover': spec.brandHover,
    '--dsw-alias-label-primary-foreground': spec.brandForeground,
    '--dsw-alias-state-business-primary': spec.business,
  }
}

function palette(
  id: string,
  label: PaletteLabelKey,
  scheme: 'light' | 'dark',
  light: PaletteModeSpec,
  dark: PaletteModeSpec,
): Palette {
  return { id, label, scheme, light: toTokenMap(light), dark: toTokenMap(dark) }
}

/** The palettes this product ships. */
export const PALETTES: readonly Palette[] = Object.freeze([
  // Peach: warm paper by day, deep terracotta charcoal at night.
  palette('peach', 'palette.peach', 'light', {
    base: '#fffaf7',
    layer1: '#fff5ef',
    layer2: '#fdede3',
    layer3: '#f8e2d4',
    sidebar: '#fcf2ec',
    sidebarHover: '#f8e7dc',
    sidebarActive: '#f3dace',
    selector: '#faeee7',
    borderL1: 'rgba(130, 56, 26, 0.08)',
    brand: '#c8502b',
    brandHover: '#af4321',
    brandForeground: '#ffffff',
    business: '#c8502b',
  }, {
    base: '#181210',
    layer1: '#211916',
    layer2: '#2a201c',
    layer3: '#342823',
    sidebar: '#1c1512',
    sidebarHover: '#271e1a',
    sidebarActive: '#332621',
    selector: '#281f1b',
    borderL1: 'rgba(255, 205, 184, 0.08)',
    brand: '#ff9d7e',
    brandHover: '#ffb299',
    brandForeground: '#240e06',
    business: '#ff9d7e',
  }),
  // Forest: botanical paper in light mode, muted pine slate in dark mode.
  palette('forest', 'palette.forest', 'light', {
    base: '#f8fbf8',
    layer1: '#f1f7f2',
    layer2: '#e6f0e8',
    layer3: '#dae8dd',
    sidebar: '#eff5f0',
    sidebarHover: '#e4eee6',
    sidebarActive: '#d8e6db',
    selector: '#eaf2ec',
    borderL1: 'rgba(28, 78, 46, 0.08)',
    brand: '#2d7a4d',
    brandHover: '#24663f',
    brandForeground: '#ffffff',
    business: '#2d7a4d',
  }, {
    base: '#101713',
    layer1: '#161f1a',
    layer2: '#1d2922',
    layer3: '#26352c',
    sidebar: '#131b16',
    sidebarHover: '#1b2620',
    sidebarActive: '#24332a',
    selector: '#1c2821',
    borderL1: 'rgba(176, 235, 198, 0.08)',
    brand: '#6fd098',
    brandHover: '#88dca9',
    brandForeground: '#081b10',
    business: '#6fd098',
  }),
  // Sea salt: coastal mist in light mode, deep slate abyss in dark mode.
  palette('sea', 'palette.sea', 'light', {
    base: '#f8fbfc',
    layer1: '#f0f6f8',
    layer2: '#e4eff3',
    layer3: '#d7e6ec',
    sidebar: '#eef5f7',
    sidebarHover: '#e2edf1',
    sidebarActive: '#d5e4ea',
    selector: '#e8f1f4',
    borderL1: 'rgba(22, 74, 92, 0.08)',
    brand: '#28748c',
    brandHover: '#1f5f74',
    brandForeground: '#ffffff',
    business: '#28748c',
  }, {
    base: '#0f1619',
    layer1: '#141e22',
    layer2: '#1b272c',
    layer3: '#24333a',
    sidebar: '#121a1e',
    sidebarHover: '#19252a',
    sidebarActive: '#223138',
    selector: '#1a262b',
    borderL1: 'rgba(172, 226, 242, 0.08)',
    brand: '#6bc4de',
    brandHover: '#86d1e7',
    brandForeground: '#07181e',
    business: '#6bc4de',
  }),
  // Dusk: soft lavender paper in light mode, twilight plum in dark mode.
  palette('dusk', 'palette.dusk', 'light', {
    base: '#fbf9fd',
    layer1: '#f5f1fa',
    layer2: '#ece5f6',
    layer3: '#e1d7f0',
    sidebar: '#f3eef9',
    sidebarHover: '#eae2f4',
    sidebarActive: '#dfd4ee',
    selector: '#efe9f7',
    borderL1: 'rgba(72, 42, 122, 0.08)',
    brand: '#684ca0',
    brandHover: '#573d89',
    brandForeground: '#ffffff',
    business: '#684ca0',
  }, {
    base: '#15121d',
    layer1: '#1c1827',
    layer2: '#241f32',
    layer3: '#2e2840',
    sidebar: '#181421',
    sidebarHover: '#221d2f',
    sidebarActive: '#2c263d',
    selector: '#231e30',
    borderL1: 'rgba(212, 194, 250, 0.08)',
    brand: '#b497ea',
    brandHover: '#c5aef0',
    brandForeground: '#150d24',
    business: '#b497ea',
  }),
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
  for (const token of TINTED_TOKENS) {
    const value = values[token]
    /* v8 ignore next -- every Palette is constructed through toTokenMap with all TINTED_TOKENS populated */
    if (value !== undefined && value !== '') out[token] = value
  }
  return out
}
