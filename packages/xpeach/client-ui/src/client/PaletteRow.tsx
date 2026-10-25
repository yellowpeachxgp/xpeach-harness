/** The palette row: one swatch per XPeach palette, beside the stock modes. */
import type { JSX } from 'react'
import type { PaletteLabelKey } from './palettes.ts'
import { PALETTES } from './palettes.ts'
import css from './xpeach.module.css'

/** Locale keys the row reads. */
export type PaletteKey = 'palette.title' | PaletteLabelKey

/** Props the slot hands the row. */
export interface PaletteRowProps {
  /** Whether the active theme is one of ours, and which. */
  readonly active: () => string
  /** Switch to a palette, or back to a stock mode with 'light'/'dark'. */
  readonly setTheme: (id: string) => void
  readonly t: (key: PaletteKey) => string
}

/**
 * Render the palette row.
 * @param props - active theme reader, theme setter and locale seat.
 * @returns the row element.
 */
export function PaletteRow({ active, setTheme, t }: PaletteRowProps): JSX.Element {
  const current = active()
  const isDark = current === 'dark' || current.endsWith('-dark')
  return (
    <div className={css.group}>
      <div className={css.groupTitle}>{t('palette.title')}</div>
      <div className={css.paletteRow}>
        {PALETTES.map((definition) => {
          // The light variant carries the plain id and the dark one the suffix,
          // so either counts as "this palette is active".
          const isActive = current === definition.id || current === `${definition.id}-dark`
          return (
            <button
              key={definition.id}
              type="button"
              className={isActive ? `${css.paletteSwatch} ${css.paletteSwatchOn}` : css.paletteSwatch}
              aria-pressed={isActive}
              onClick={() => { setTheme(isDark ? `${definition.id}-dark` : definition.id) }}
            >
              <span className={css.paletteChip} style={{ background: definition.light['--dsw-alias-bg-base'], borderColor: definition.light['--dsw-alias-brand-primary'] }} />
              <span>{t(definition.label)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
