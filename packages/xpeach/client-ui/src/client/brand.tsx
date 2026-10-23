/** XPeach brand occupants: the identity mark and the xpeach wordmark. */
import css from './xpeach.module.css'
import markPrimary from './assets/mark-primary.webp'
import markWhite from './assets/mark-white.webp'
import markBlack from './assets/mark-black.webp'
import markOutline from './assets/mark-outline.webp'

/**
 * The XPeach mark: the identity logo from the brand pack, not a drawn glyph.
 * The white variant is for dark surfaces, the black one for monochrome contexts.
 * @param props - host-supplied geometry and which variant to paint.
 * @returns the mark image.
 */
export function XPeachMark({ size, className, variant = 'primary' }: {
  size: number
  className?: string | undefined
  variant?: 'primary' | 'white' | 'black' | 'outline'
}): JSX.Element {
  const source = { primary: markPrimary, white: markWhite, black: markBlack, outline: markOutline }[variant]
  return (
    <img
      src={source}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ display: 'block', objectFit: 'contain', flex: 'none' }}
      {...(className === undefined ? {} : { className })}
    />
  )
}

/**
 * The XPeach wordmark rendered in the brand row: the site's own "🍑Code"
 * display name in the harness brand face.
 * @returns the wordmark.
 */
export function XPeachName(): JSX.Element {
  return (
    <span className={css.wordmark}>
      <span className={css.wordmarkPrimary}>XPEACH</span>
      <span className={css.wordmarkSub}>Harness</span>
    </span>
  )
}
