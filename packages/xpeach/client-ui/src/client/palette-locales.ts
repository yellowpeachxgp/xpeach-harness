/** Copy for the palette row. */
export const zh = {
  'palette.title': '配色',
} satisfies Record<string, string>

/** Key union for the row. */
export type PaletteLocaleKey = keyof typeof zh

/** English copy, complete against the zh key set. */
export const en: Record<PaletteLocaleKey, string> = {
  'palette.title': 'Palette',
}
