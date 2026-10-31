/**
 * Floating notification banner stack rendered in `shell.overlay`.
 *
 * Displays beautified task completion, tool approval, user choice/question,
 * plan review, and error notifications with status-coded accents and a
 * one-click session jump button.
 * @module
 */

import { useEffect, useState, type JSX } from 'react'
import type { PropsLocale } from '@xpeach/xph-client-ui-slots'
import {
  dismissNotificationBanner,
  getActiveNotificationBanners,
  openNotificationSession,
  subscribeNotificationBanners,
  type XPeachTaskNotificationItem,
  type XPeachTaskNotificationKind,
} from './notifications.ts'
import type { XPeachOps } from './ops.ts'
import styles from './xpeach.module.css'

/** Props injected into {@link XPeachNotificationOverlay} from `shell.overlay`. */
export type XPeachNotificationOverlayProps = XPeachOps & PropsLocale<'xpeach.account'>

function NotificationKindGlyph({ kind }: { readonly kind: XPeachTaskNotificationKind }): JSX.Element {
  if (kind === 'completed') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.2 8.1L7.1 10L10.9 6.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (kind === 'approval') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2.1L13.2 4.3V7.8C13.2 11.1 10.98 13.45 8 14.3C5.02 13.45 2.8 11.1 2.8 7.8V4.3L8 2.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 5.6V8.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="10.8" r="0.8" fill="currentColor" />
      </svg>
    )
  }
  if (kind === 'error') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.9V8.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.8" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 4.4C3 3.52 3.72 2.8 4.6 2.8H11.4C12.28 2.8 13 3.52 13 4.4V9.4C13 10.28 12.28 11 11.4 11H6.8L4.1 13.1V11H4.6C3.72 11 3 10.28 3 9.4V4.4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="6.2" cy="6.9" r="0.75" fill="currentColor" />
      <circle cx="8" cy="6.9" r="0.75" fill="currentColor" />
      <circle cx="9.8" cy="6.9" r="0.75" fill="currentColor" />
    </svg>
  )
}

/**
 * Renders the floating notification stack for background session completions
 * and action-required prompts.
 *
 * @param props - Injected `xpeach.account` locale and operations.
 * @returns Floating notification stack element, or `null` when idle.
 */
export function XPeachNotificationOverlay(props: XPeachNotificationOverlayProps): JSX.Element | null {
  const { t } = props
  const [items, setItems] = useState<readonly XPeachTaskNotificationItem[]>(() =>
    getActiveNotificationBanners(),
  )

  useEffect(() => {
    setItems(getActiveNotificationBanners())
    return subscribeNotificationBanners(() => {
      setItems(getActiveNotificationBanners())
    })
  }, [])

  if (items.length === 0) return null

  return (
    <aside className={styles.notifyStack} role="region" aria-live="polite">
      {items.map(item => (
        <div
          key={item.id}
          className={styles.notifyCard}
          data-kind={item.kind}
          data-urgent={item.urgent ? 'true' : 'false'}
        >
          <div className={styles.notifyHeader}>
            <span className={styles.notifyKindBadge} data-kind={item.kind}>
              <NotificationKindGlyph kind={item.kind} />
              <span>{item.badge}</span>
            </span>
            <span className={styles.notifySubtitle} title={item.subtitle}>
              {item.subtitle}
            </span>
            <button
              type="button"
              className={styles.notifyCloseBtn}
              aria-label={t('notify.action.dismiss')}
              onClick={() => dismissNotificationBanner(item.id)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className={styles.notifyBodyWrap}>
            <div className={styles.notifyTitle}>{item.title}</div>
            <p className={styles.notifyBody}>{item.body}</p>
          </div>

          <div className={styles.notifyFooter}>
            {item.sessionId ? (
              <button
                type="button"
                className={styles.notifyPrimaryBtn}
                data-kind={item.kind}
                onClick={() => openNotificationSession(item)}
              >
                <span>{item.actionLabel}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
            <button
              type="button"
              className={styles.notifySecondaryBtn}
              onClick={() => dismissNotificationBanner(item.id)}
            >
              {t('notify.action.dismiss')}
            </button>
          </div>
        </div>
      ))}
    </aside>
  )
}
