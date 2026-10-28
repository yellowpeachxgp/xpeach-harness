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
