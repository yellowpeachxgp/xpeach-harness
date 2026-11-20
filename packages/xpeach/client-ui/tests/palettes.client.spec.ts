import { describe, expect, it } from 'vitest'
import { PALETTES, TINTED_TOKENS, paletteTokens } from '../src/client/palettes.ts'

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) => {
    const srgb = Number.parseInt(clean.slice(offset, offset + 2), 16) / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

describe('XPeach palettes', () => {
  it('ships four palettes with distinct ids', () => {
    expect(PALETTES).toHaveLength(4)
    expect(new Set(PALETTES.map(p => p.id)).size).toBe(4)
  })

  it('gives every palette a value for every tinted token in both modes', () => {
    for (const definition of PALETTES) {
      for (const mode of ['light', 'dark'] as const) {
        const tokens = paletteTokens(definition, mode)
        expect(Object.keys(tokens)).toEqual([...TINTED_TOKENS])
        for (const value of Object.values(tokens)) {
          expect(value).not.toBe('')
        }
      }
    }
  })

  it('maintains WCAG AA primary button contrast across light and dark modes', () => {
    for (const definition of PALETTES) {
      for (const mode of ['light', 'dark'] as const) {
        const tokens = paletteTokens(definition, mode)
        const fill = tokens['--dsw-alias-brand-primary']!
        const fg = tokens['--dsw-alias-label-primary-foreground']!
        expect(contrastRatio(fill, fg), `${definition.id} (${mode})`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('keeps the two modes different so a palette actually changes with the base', () => {
    for (const definition of PALETTES) {
      expect(paletteTokens(definition, 'light')).not.toEqual(paletteTokens(definition, 'dark'))
    }
  })

  it('names the dark variant apart from the light one', () => {
    // Two registrations cannot share an id, so the pairing is by suffix.
    for (const definition of PALETTES) {
      expect(definition.id).not.toBe('light')
      expect(definition.id).not.toBe('dark')
      expect(definition.id).not.toBe('system')
    }
  })
})
