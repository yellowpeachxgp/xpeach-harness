/** Interactive font pack selector row in General Settings for switching bundled UI and code fonts. */
import { type JSX, useEffect, useState } from 'react'
import { Button, Input } from '@xpeach/xph-client-ui-primitives'
import type { PropsLocale } from '@xpeach/xph-client-ui-slots'
import css from './xpeach.module.css'

/** Font roles supported by the theme service. */
export type XPeachFontRole = 'text' | 'code' | 'terminal'

/** Snapshot of active font-family overrides by role. */
export interface XPeachFontFamiliesSnapshot {
  readonly text: string
  readonly code: string
  readonly terminal: string
}

/** One selectable interface/text font preset in the bundled font pack. */
export interface XPeachUiFontPreset {
  readonly id: 'system' | 'pingfang' | 'yahei' | 'inter' | 'jakarta' | 'montserrat' | 'lora' | 'jetbrainsUi'
  readonly specimen: string
  readonly stack: string
  readonly previewStack: string
  readonly leadFamily: string
  readonly bundled: boolean
}

/** One selectable code/terminal monospace font preset in the bundled font pack. */
export interface XPeachCodeFontPreset {
  readonly id: 'system' | 'jetbrains' | 'fira' | 'sfCascadia'
  readonly specimen: string
  readonly stack: string
  readonly previewStack: string
  readonly leadFamily: string
  readonly bundled: boolean
}

/** Curated interface and text font presets backed by the bundled WOFF2 font pack. */
export const UI_FONT_PRESETS: readonly XPeachUiFontPreset[] = Object.freeze([
  {
    id: 'system',
    specimen: 'Aa 永',
    stack: '',
    previewStack: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    leadFamily: '',
    bundled: false,
  },
  {
    id: 'pingfang',
    specimen: '苹方 Aa',
    stack: '"PingFang SC", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    previewStack: '"PingFang SC", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    leadFamily: '"PingFang SC"',
    bundled: true,
  },
  {
    id: 'yahei',
    specimen: '雅黑 Aa',
    stack: '"Microsoft YaHei", "Segoe UI", "PingFang SC", sans-serif',
    previewStack: '"Microsoft YaHei", "Segoe UI", "PingFang SC", sans-serif',
    leadFamily: '"Microsoft YaHei"',
    bundled: true,
  },
  {
    id: 'inter',
    specimen: 'Aa 永',
    stack: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    previewStack: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    leadFamily: '"Inter"',
    bundled: true,
  },
  {
    id: 'jakarta',
    specimen: 'Aa 永',
    stack: '"Plus Jakarta Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    previewStack: '"Plus Jakarta Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    leadFamily: '"Plus Jakarta Sans"',
    bundled: true,
  },
  {
    id: 'montserrat',
    specimen: 'Aa 永',
    stack: '"Montserrat", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    previewStack: '"Montserrat", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    leadFamily: '"Montserrat"',
    bundled: true,
  },
  {
    id: 'lora',
    specimen: 'Aa 永',
    stack: '"Lora", "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif',
    previewStack: '"Lora", "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif',
    leadFamily: '"Lora"',
    bundled: true,
  },
  {
    id: 'jetbrainsUi',
    specimen: 'Aa 01',
    stack: '"JetBrains Mono", "PingFang SC", "Microsoft YaHei", monospace',
    previewStack: '"JetBrains Mono", "PingFang SC", "Microsoft YaHei", monospace',
    leadFamily: '"JetBrains Mono"',
    bundled: true,
  },
])

/** Curated developer code and terminal monospace font presets. */
export const CODE_FONT_PRESETS: readonly XPeachCodeFontPreset[] = Object.freeze([
  {
    id: 'system',
    specimen: '{} 01',
    stack: '',
    previewStack: '"SF Mono", "JetBrains Mono", "Fira Code", Consolas, monospace',
    leadFamily: '',
    bundled: false,
  },
  {
    id: 'jetbrains',
    specimen: '=> 01',
    stack: '"JetBrains Mono", "SF Mono", "PingFang SC", "Microsoft YaHei", monospace',
    previewStack: '"JetBrains Mono", "SF Mono", "PingFang SC", "Microsoft YaHei", monospace',
    leadFamily: '"JetBrains Mono"',
    bundled: true,
  },
  {
    id: 'fira',
    specimen: '!= 01',
    stack: '"Fira Code", "JetBrains Mono", "PingFang SC", "Microsoft YaHei", monospace',
    previewStack: '"Fira Code", "JetBrains Mono", "PingFang SC", "Microsoft YaHei", monospace',
    leadFamily: '"Fira Code"',
    bundled: true,
  },
  {
    id: 'sfCascadia',
    specimen: '</> 0',
    stack: '"SF Mono", "Cascadia Code", Consolas, "PingFang SC", "Microsoft YaHei", monospace',
    previewStack: '"SF Mono", "Cascadia Code", Consolas, "PingFang SC", "Microsoft YaHei", monospace',
    leadFamily: '"SF Mono"',
    bundled: false,
  },
])

/** Props injected into {@link FontPackRow}. */
export interface FontPackRowProps {
  /** Read the current normalized font-family lists by role. */
  readonly getFontFamilies: () => XPeachFontFamiliesSnapshot
  /** Update one role's font-family list via the theme service. */
  readonly setFontFamily: (role: XPeachFontRole, value: string) => void
  /** Subscribe to theme snapshot changes; returns an unsubscribe disposer. */
  readonly subscribeThemeChange?: ((listener: () => void) => () => void) | undefined
  /** Localized translator for `xpeach.account`. */
  readonly t: PropsLocale<'xpeach.account'>['t']
}

/**
 * Determine whether a preset matches the currently persisted font-family stack.
 * @param currentStack - Normalized font-family string from the theme service.
 * @param preset - Candidate preset definition.
 * @returns `true` when the preset is active.
 */
export function isFontPresetActive(
  currentStack: string,
  preset: { readonly stack: string; readonly leadFamily: string },
): boolean {
  const trimmed = currentStack.trim()
  if (preset.stack === '') return trimmed === ''
  if (trimmed === preset.stack) return true
  const firstSegment = trimmed.split(',')[0]?.trim() ?? ''
  return preset.leadFamily !== '' && firstSegment.toLowerCase() === preset.leadFamily.toLowerCase()
}

/**
 * Render the interactive Font Pack selector in General Settings:
 * 6 visual UI font cards, 4 code/terminal monospace pills, live specimen preview,
 * and a custom font stack input.
 * @param props - Theme font reader/writer, subscription hook, and locale translator.
 * @returns The Font Pack settings section element.
 */
export function FontPackRow({
  getFontFamilies,
  setFontFamily,
  subscribeThemeChange,
  t,
}: FontPackRowProps): JSX.Element {
  const [families, setFamilies] = useState<XPeachFontFamiliesSnapshot>(() => getFontFamilies())
  const [customDraft, setCustomDraft] = useState<string>(() => getFontFamilies().text)

  useEffect(() => {
    const sync = (): void => {
      const next = getFontFamilies()
      setFamilies(next)
      setCustomDraft(next.text)
    }
    sync()
    if (subscribeThemeChange === undefined) return
    return subscribeThemeChange(sync)
  }, [getFontFamilies, subscribeThemeChange])

  const selectUiPreset = (stack: string): void => {
    setFontFamily('text', stack)
    setFamilies(prev => ({ ...prev, text: stack }))
    setCustomDraft(stack)
  }

  const selectCodePreset = (stack: string): void => {
    setFontFamily('code', stack)
    setFontFamily('terminal', stack)
    setFamilies(prev => ({ ...prev, code: stack, terminal: stack }))
  }

  const commitCustomTextFont = (): void => {
    const next = customDraft.trim()
    setFontFamily('text', next)
    setFamilies(prev => ({ ...prev, text: next }))
  }

  const activePreviewTextFont = families.text !== ''
    ? families.text
    : (UI_FONT_PRESETS[0]?.previewStack ?? 'sans-serif')
  const activePreviewCodeFont = families.code !== ''
    ? families.code
    : (CODE_FONT_PRESETS[0]?.previewStack ?? 'monospace')

  return (
    <div className={css.fontPackBlock} data-xpeach-font-pack>
      <div className={css.fontPackHead}>
        <div className={css.fontPackHeadText}>
          <span className={css.prefTitle}>{t('fontPack.title')}</span>
          <span className={css.prefDesc}>{t('fontPack.subtitle')}</span>
        </div>
        {(families.text !== '' || families.code !== '' || families.terminal !== '') && (
          <Button
            variant="outline"
            onClick={() => {
              selectUiPreset('')
              selectCodePreset('')
            }}
          >
            {t('fontPack.customReset')}
          </Button>
        )}
      </div>

      <div className={css.fontPackSectionLabel}>{t('fontPack.uiLabel')}</div>
      <div className={css.fontPackGrid} role="group" aria-label={t('fontPack.uiLabel')}>
        {UI_FONT_PRESETS.map((preset) => {
          const active = isFontPresetActive(families.text, preset)
          return (
            <button
              key={preset.id}
              type="button"
              data-font-preset={preset.id}
              aria-pressed={active}
              className={active ? css.fontPackCardOn : css.fontPackCard}
              onClick={() => { selectUiPreset(preset.stack) }}
            >
              <div className={css.fontPackCardTop}>
                <span
                  className={css.fontPackSpecimen}
                  style={{ fontFamily: preset.previewStack }}
                >
                  {preset.specimen}
                </span>
                <span className={preset.bundled ? css.fontPackBadgeBundled : css.fontPackBadgeSystem}>
                  {preset.bundled ? t('fontPack.badgeBundled') : t('fontPack.badgeSystem')}
                </span>
              </div>
              <span
                className={css.fontPackCardName}
                style={{ fontFamily: preset.previewStack }}
              >
                {t(`fontPack.preset.${preset.id}.name`)}
              </span>
              <span className={css.fontPackCardDesc}>
                {t(`fontPack.preset.${preset.id}.desc`)}
              </span>
            </button>
          )
        })}
      </div>

      <div className={css.fontPackSectionLabel}>{t('fontPack.codeLabel')}</div>
      <div className={css.fontPackCodeRow} role="group" aria-label={t('fontPack.codeLabel')}>
        {CODE_FONT_PRESETS.map((preset) => {
          const active = isFontPresetActive(families.code, preset)
          return (
            <button
              key={preset.id}
              type="button"
              data-code-font-preset={preset.id}
              aria-pressed={active}
              className={active ? css.fontPackCodePillOn : css.fontPackCodePill}
              style={{ fontFamily: preset.previewStack }}
              onClick={() => { selectCodePreset(preset.stack) }}
            >
              <span className={css.fontPackCodeGlyph}>{preset.specimen}</span>
              <span>{t(`fontPack.code.${preset.id}.name`)}</span>
              {preset.bundled && (
                <span className={css.fontPackBadgeBundled}>{t('fontPack.badgeBundled')}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className={css.fontPackPreviewBox}>
        <div className={css.fontPackPreviewLine} style={{ fontFamily: activePreviewTextFont }}>
          <span className={css.fontPackPreviewTag}>{t('fontPack.previewLabel')}</span>
          <span>{t('fontPack.previewText')}</span>
        </div>
        <code className={css.fontPackPreviewCode} style={{ fontFamily: activePreviewCodeFont }}>
          {t('fontPack.previewCode')}
        </code>
      </div>

      <div className={css.fontPackCustomRow}>
        <span className={css.fontPackCustomLabel}>{t('fontPack.customLabel')}</span>
        <div className={css.fontPackCustomInputWrap}>
          <Input
            className={css.fontPackCustomInput as string}
            value={customDraft}
            placeholder={t('fontPack.customPlaceholder')}
            aria-label={t('fontPack.customLabel')}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => { setCustomDraft(event.currentTarget.value) }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return
              if (event.key === 'Enter') commitCustomTextFont()
            }}
          />
          <Button variant="outline" onClick={commitCustomTextFont}>
            {t('fontPack.customApply')}
          </Button>
        </div>
      </div>
    </div>
  )
}
