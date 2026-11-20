/** XPeach brand occupants: the identity mark and the xpeach wordmark. */
import type { JSX } from 'react'
import type {} from '@xpeach/xph-client-locale/client'
import type { PropsLocale } from '@xpeach/xph-client-ui-slots'
import type {} from './locales.ts'
import css from './xpeach.module.css'
import markPrimary from './assets/mark-primary.webp'
import markWhite from './assets/mark-white.webp'
import markBlack from './assets/mark-black.webp'
import markOutline from './assets/mark-outline.webp'

/**
 * The XPeach mark.
 *
 * The brand pack ships the same logo in light and dark treatments. Both are
 * rendered and the active theme decides which one paints, so the mark follows
 * a runtime theme switch without any component re-rendering or hard-coded
 * scheme list here.
 * @param props - host-supplied geometry and an optional explicit variant.
 * @returns the mark image.
 */
export function XPeachMark({ size, className, variant = 'auto' }: {
  size: number
  className?: string | undefined
  variant?: 'auto' | 'primary' | 'white' | 'black' | 'outline'
}): JSX.Element {
  if (variant !== 'auto') {
    const single = { primary: markPrimary, white: markWhite, black: markBlack, outline: markOutline }[variant]
    return <img src={single} width={size} height={size} alt="" aria-hidden="true" draggable={false}
      className={className} style={{ display: 'block', objectFit: 'contain', flex: 'none' }} />
  }
  return (
    <span className={className === undefined ? css.mark : `${css.mark} ${className}`} style={{ width: size, height: size }}>
      <img src={markPrimary} alt="" aria-hidden="true" draggable={false} className={css.markLight} />
      <img src={markWhite} alt="" aria-hidden="true" draggable={false} className={css.markDark} />
    </span>
  )
}

/**
 * The XPeach wordmark rendered in the brand row: the site's own "🍑Code"
 * display name in the harness brand face.
 * @param props - locale translator for the `xpeach.account` namespace.
 * @returns the wordmark.
 */
export function XPeachName({ t }: PropsLocale<'xpeach.account'>): JSX.Element {
  return (
    <span className={css.wordmark}>
      <span className={css.wordmarkPrimary}>{t('brand.name')}</span>
      <span className={css.wordmarkSub}>{t('brand.sub')}</span>
    </span>
  )
}

/**
 * Sidebar panel icon for the XPeach console.
 * @param props - sidebar icon size.
 * @returns mark element.
 */
export function XPeachPanelIcon({ size = 18 }: { readonly size?: number }): JSX.Element {
  return <XPeachMark size={size} />
}

/**
 * Decorative sidebar icon for the XPeach Skills panel.
 * @param props - sidebar icon size.
 * @returns SVG element.
 */
export function XPeachSkillsIcon({ size = 18 }: { readonly size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.25 4.25A1.75 1.75 0 0 1 5 2.5h5.25a1.5 1.5 0 0 1 1.5 1.5v10.25a.75.75 0 0 1-.75.75H5a1.75 1.75 0 0 1-1.75-1.75V4.25Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M6 6h3.5M6 8.75h2.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M14 5.5l.65 1.6 1.6.65-1.6.65L14 10l-.65-1.6-1.6-.65 1.6-.65L14 5.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * Decorative sidebar icon for the XPeach MCP panel.
 * @param props - sidebar icon size.
 * @returns SVG element.
 */
export function XPeachMcpIcon({ size = 18 }: { readonly size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.25" y="2.75" width="13.5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.35" />
      <rect x="2.25" y="10.25" width="13.5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="5.25" cy="5.25" r="0.9" fill="currentColor" />
      <circle cx="5.25" cy="12.75" r="0.9" fill="currentColor" />
      <path d="M8.5 5.25h4.25M8.5 12.75h4.25" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Decorative sidebar icon for the XPeach Prompt & Gateway Inspector panel.
 * @param props - sidebar icon size.
 * @returns SVG element.
 */
export function XPeachPromptIcon({ size = 18 }: { readonly size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.25" y="2.75" width="13.5" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.35" />
      <path d="M5.25 6.75L7.5 9l-2.25 2.25M9.25 11.25h3.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
