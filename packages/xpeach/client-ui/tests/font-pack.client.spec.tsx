// @vitest-environment jsdom
/** Unit tests for the XPeach bundled Font Pack selector and preset matching. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CODE_FONT_PRESETS,
  FontPackRow,
  isFontPresetActive,
  UI_FONT_PRESETS,
  type FontPackRowProps,
  type XPeachFontFamiliesSnapshot,
  type XPeachFontRole,
} from '../src/client/FontPackRow.tsx'
import { zh } from '../src/client/locales.ts'

const translate: FontPackRowProps['t'] = (key, params) => {
  let raw = (zh as Readonly<Record<string, string>>)[key] ?? key
  if (params !== undefined) {
    for (const [k, v] of Object.entries(params)) {
      raw = raw.replace(`{${k}}`, String(v))
    }
  }
  return raw
}

describe('XPeach bundled Font Pack selector', () => {
  afterEach(() => {
    cleanup()
  })

  it('matches active UI and code font presets by exact stack or leading family', () => {
    expect(isFontPresetActive('', UI_FONT_PRESETS[0]!)).toBe(true)
    expect(isFontPresetActive('"PingFang SC", sans-serif', UI_FONT_PRESETS[1]!)).toBe(true)
    expect(isFontPresetActive('"Microsoft YaHei", sans-serif', UI_FONT_PRESETS[2]!)).toBe(true)
    expect(isFontPresetActive('"Inter", sans-serif', UI_FONT_PRESETS[3]!)).toBe(true)
    expect(isFontPresetActive('"Plus Jakarta Sans", sans-serif', UI_FONT_PRESETS[4]!)).toBe(true)
    expect(isFontPresetActive('"Montserrat", sans-serif', UI_FONT_PRESETS[5]!)).toBe(true)
    expect(isFontPresetActive('"Lora", serif', UI_FONT_PRESETS[6]!)).toBe(true)
    expect(isFontPresetActive('"JetBrains Mono", monospace', CODE_FONT_PRESETS[1]!)).toBe(true)
    expect(isFontPresetActive('"Fira Code", monospace', CODE_FONT_PRESETS[2]!)).toBe(true)
  })

  it('switches UI font presets, code/terminal font presets, and custom font stacks', () => {
    let state: XPeachFontFamiliesSnapshot = { text: '', code: '', terminal: '' }
    const setFontFamily = vi.fn((role: XPeachFontRole, value: string) => {
      state = { ...state, [role]: value }
    })

    render(
      <FontPackRow
        getFontFamilies={() => state}
        setFontFamily={setFontFamily}
        t={translate}
      />,
    )

    // System default starts active
    const pingfangCard = document.querySelector<HTMLButtonElement>('[data-font-preset="pingfang"]')
    expect(pingfangCard).not.toBeNull()
    fireEvent.click(pingfangCard!)
    expect(setFontFamily).toHaveBeenCalledWith('text', UI_FONT_PRESETS[1]!.stack)
    expect(pingfangCard?.getAttribute('aria-pressed')).toBe('true')

    const yaheiCard = document.querySelector<HTMLButtonElement>('[data-font-preset="yahei"]')
    expect(yaheiCard).not.toBeNull()
    fireEvent.click(yaheiCard!)
    expect(setFontFamily).toHaveBeenCalledWith('text', UI_FONT_PRESETS[2]!.stack)
    expect(yaheiCard?.getAttribute('aria-pressed')).toBe('true')

    const interCard = document.querySelector<HTMLButtonElement>('[data-font-preset="inter"]')
    expect(interCard).not.toBeNull()
    expect(interCard?.getAttribute('aria-pressed')).toBe('false')

    // Click Inter preset
    fireEvent.click(interCard!)
    expect(setFontFamily).toHaveBeenCalledWith('text', UI_FONT_PRESETS[3]!.stack)
    expect(interCard?.getAttribute('aria-pressed')).toBe('true')

    // Click Fira Code preset (sets both code and terminal roles)
    const firaBtn = document.querySelector<HTMLButtonElement>('[data-code-font-preset="fira"]')
    expect(firaBtn).not.toBeNull()
    fireEvent.click(firaBtn!)
    expect(setFontFamily).toHaveBeenCalledWith('code', CODE_FONT_PRESETS[2]!.stack)
    expect(setFontFamily).toHaveBeenCalledWith('terminal', CODE_FONT_PRESETS[2]!.stack)
    expect(firaBtn?.getAttribute('aria-pressed')).toBe('true')

    // Enter a custom font stack and click Apply
    const customInput = screen.getByRole<HTMLInputElement>('textbox', { name: zh['fontPack.customLabel'] })
    fireEvent.change(customInput, { target: { value: '"LXGW WenKai", "PingFang SC", sans-serif' } })
    fireEvent.click(screen.getByRole('button', { name: zh['fontPack.customApply'] }))
    expect(setFontFamily).toHaveBeenCalledWith('text', '"LXGW WenKai", "PingFang SC", sans-serif')

    // Click Reset to restore default
    fireEvent.click(screen.getByRole('button', { name: zh['fontPack.customReset'] }))
    expect(setFontFamily).toHaveBeenCalledWith('text', '')
    expect(setFontFamily).toHaveBeenCalledWith('code', '')
    expect(setFontFamily).toHaveBeenCalledWith('terminal', '')
  })
})
