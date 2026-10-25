/** XPeach quota-notice chain entry: relay failures get a branded card with a top-up link. */
import type {} from '@xpeach/xph-client-ui-chat/client'
import type {} from '@xpeach/xph-client-locale/client'
import type {} from '@xpeach/xph-client-ui-renderer/client'
import { type JSX, useEffect } from 'react'
import type { PropsLocale, PropsRuntime } from '@xpeach/xph-client-ui-slots'
import type { QuotaNoticeOwnerProps } from '@xpeach/xph-client-ui-chat/client'
import { XPeachMark } from './brand.tsx'
import css from './xpeach.module.css'

/** The relay console's top-up page. */
const TOPUP = 'https://xpeach.codes/console/topup'

/** Composed notice props: chain runtime + matched owner + locale. */
export type XPeachQuotaNoticeProps =
  PropsRuntime<'shell.quota-notice'> & PropsLocale<'xpeach.account'> & { readonly matched: QuotaNoticeOwnerProps }

/**
 * The peach quota card: the owner's localized message, a top-up deep link
 * into the relay console, and a dismiss control. Holds the notice open while
 * mounted so a follow-up failure cannot silently swap it.
 * @param props - matched owner props and locale.
 * @returns the notice card.
 */
export function XPeachQuotaNotice({ matched, t }: XPeachQuotaNoticeProps): JSX.Element {
  useEffect(() => matched.keepOpen(), [matched])
  return (
    <div className={css.notice}>
      <XPeachMark size={18} />
      <div className={css.noticeBody}>
        <p className={css.noticeText}>{matched.message}</p>
        <p className={css.noticeHint}>{t('notice.hint')}</p>
      </div>
      <a className={css.noticeAction} href={TOPUP} target="_blank" rel="noreferrer">{t('notice.topup')}</a>
      <button type="button" className={css.iconButton} onClick={matched.dismiss} title={t('notice.dismiss')}>×</button>
    </div>
  )
}
