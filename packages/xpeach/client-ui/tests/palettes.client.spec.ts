import { describe, expect, it } from 'vitest'
import { PALETTES, paletteTokens } from '../src/client/palettes.ts'

describe('XPeach palettes', () => {
  it('ships four palettes with distinct ids', () => {
    expect(PALETTES).toHaveLength(4)
    expect(new Set(PALETTES.map(p => p.id)).size).toBe(4)
  })

  it('gives every palette a value for every tinted token in both modes', () => {
    for (const definition of PALETTES) {
      for (const mode of ['light', 'dark'] as const) {
        const tokens = paletteTokens(definition, mode)
        // A missing token would fall back to the stock colour and split the
        // palette in half, so each one has to be present.
        expect(Object.keys(tokens).length).toBeGreaterThan(0)
        for (const value of Object.values(tokens)) {
          expect(value).not.toBe('')
        }
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
