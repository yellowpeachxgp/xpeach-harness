/** Sidebar settings launcher, split: left opens Settings, right shows the
 * site balance. Hovering the balance opens a fixed-position card with the
 * account summary, a 7-day token sparkline, and a top-up entry. */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@xpeach/xph-client-ui-slots'
import { HoverCard } from '@xpeach/xph-client-ui-primitives'
import type {} from '@xpeach/xph-client-ui-settings/client'
import type { XPeachOps, XPeachSelfLogRow, XPeachUserSelfRow } from './ops.ts'
import { openXPeachLoginModal } from './XPeachOnboarding.tsx'
import { quotaUsd, SITE } from './fmt.ts'
import css from './xpeach.module.css'

type Props = PropsRuntime<'settings.launcher'> & PropsLocale<'xpeach.account'> & InjectFace<{
  userSelf: XPeachOps['userSelf']
  userLogs: XPeachOps['userLogs']
  unbind?: XPeachOps['unbind']
  ssoLogout?: XPeachOps['ssoLogout']
  subscribeCredentialChange?: XPeachOps['subscribeCredentialChange']
}>

const GearIcon = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M13.1 9.2c.1-.4.1-.8 0-1.2l1.2-.9-1.2-2-1.4.5c-.3-.2-.7-.4-1.1-.5L10.3 3.6H7.7l-.3 1.5c-.4.1-.8.3-1.1.5l-1.4-.5-1.2 2 1.2.9c-.1.4-.1.8 0 1.2l-1.2.9 1.2 2 1.4-.5c.3.2.7.4 1.1.5l.3 1.5h2.6l.3-1.5c.4-.1.8-.3 1.1-.5l1.4.5 1.2-2-1.2-.9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
)

/** Daily token totals for the last N days, oldest → newest. */
function dailyBars(logs: readonly XPeachSelfLogRow[], days: number): number[] {
  const buckets = Array.from({ length: days }, () => 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const index = new Map<string, number>()
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - i))
    index.set(d.toDateString(), i)
  }
  for (const row of logs) {
    const slot = index.get(new Date(row.created_at * 1000).toDateString())
    if (slot !== undefined) buckets[slot] = (buckets[slot] ?? 0) + row.prompt_tokens + row.completion_tokens
  }
  return buckets
}

/**
 * Render the sidebar settings launcher and site-balance hover card.
 * @param props - launcher runtime props, locale translator, and injected account ops.
 * @returns the launcher row element.
 */
export function XPeachSettingsLauncher({
  wide, settingsShortcut, openSettings, userSelf, userLogs, unbind, ssoLogout, subscribeCredentialChange, t,
}: Props): JSX.Element {
  const [me, setMe] = useState<XPeachUserSelfRow | undefined>(undefined)
  const [logs, setLogs] = useState<readonly XPeachSelfLogRow[]>([])
  const loaded = useRef(false)

  useEffect(() => {
    let alive = true
    const reload = (): void => {
      void userSelf().then((r) => {
        if (!alive) return
        if ('error' in r) {
          setMe(undefined)
          setLogs([])
        } else {
          setMe(r)
        }
      })
    }
    reload()
    const off = subscribeCredentialChange?.(() => {
      loaded.current = false
      reload()
    })
    return () => {
      alive = false
      off?.()
    }
  }, [userSelf, subscribeCredentialChange])

  const ensureLogs = (): void => {
    if (loaded.current) return
    loaded.current = true
    void userLogs(0, 100).then((r) => { if (!('error' in r)) setLogs(r.items) })
  }
  useEffect(() => { ensureLogs() }, [])

  const bars = useMemo(() => dailyBars(logs, 7), [logs])
  const maxBar = Math.max(...bars, 1)
  const quota = me?.quota ?? 0
  const used = me?.used_quota ?? 0
  const weekTokens = bars.reduce((sum, value) => sum + value, 0)
  const todayTokens = useMemo(() => {
    const today = new Date().toDateString()
    return logs
      .filter(row => new Date(row.created_at * 1000).toDateString() === today)
      .reduce((sum, row) => sum + row.prompt_tokens + row.completion_tokens, 0)
  }, [logs])
  const dayLabels = useMemo(() => {
    const keys = ['weekday.0', 'weekday.1', 'weekday.2', 'weekday.3', 'weekday.4', 'weekday.5', 'weekday.6'] as const
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      const wk = keys[date.getDay()] ?? 'weekday.0'
      return { label: t(wk), today: index === 6 }
    })
  }, [t])
  const fmtTokens = (value: number): string => value >= 1e8
    ? t('unit.yi', { n: (value / 1e8).toFixed(2) })
    : value >= 1e4 ? t('unit.wan', { n: (value / 1e4).toFixed(1) }) : String(value)

  return (
    <div className={css.launchRow}>
      <button type="button" className={css.launchSettings} onClick={openSettings}
        aria-label={t('launch.settings')} aria-haspopup="dialog">
        <span className={css.launchGear}><GearIcon /></span>
        {wide && <span className={css.launchLabel}>{t('launch.settings')}</span>}
        {wide && settingsShortcut !== undefined && (
          <span className={css.launchKeys} aria-label={settingsShortcut.aria}>
            {settingsShortcut.keys.map(key => <kbd key={key} className={css.launchKey}>{key}</kbd>)}
          </span>
        )}
      </button>
      <HoverCard
        openDelayMs={150}
        anchor={(
          <button type="button" className={css.launchBalance}
            onMouseEnter={ensureLogs} onFocus={ensureLogs}
            onClick={() => { window.open(SITE.topup, '_blank', 'noopener') }}
            aria-label={t('launch.balance')}>
            <span>{me === undefined ? '—' : quotaUsd(quota)}</span>
          </button>
        )}
        content={(
          <div className={css.launchPopBody}>
            <div className={css.launchPopHead}>
              <span className={css.launchPopName}>{me?.display_name ?? me?.username ?? t('profile.guest')}</span>
              {me?.group !== undefined && <span className={css.profileGroup}>{me.group}</span>}
            </div>
            <dl className={css.launchPopStats}>
              <div><dt>{t('profile.left')}</dt><dd>{quotaUsd(quota)}</dd></div>
              <div><dt>{t('profile.spent')}</dt><dd>{quotaUsd(used)}</dd></div>
            </dl>
            <div className={css.launchPopTokens}>
              <span>{t('launch.today')} <b>{fmtTokens(todayTokens)}</b> {t('launch.tokensUnit')}</span>
              <span>{t('launch.week')} <b>{fmtTokens(weekTokens)}</b> {t('launch.tokensUnit')}</span>
            </div>
            <div className={css.launchPopBars}>
              {bars.map((v, i) => (
                <span
                  key={i}
                  data-empty={v === 0}
                  style={{ height: `${Math.max(3, (v / maxBar) * 30)}px` }}
                  title={t('unit.tok', { n: v.toLocaleString() })}
                />
              ))}
            </div>
            <div className={css.launchPopDays} aria-hidden="true">
              {dayLabels.map((day, index) => (
                <span key={index} data-today={day.today}>{day.label}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className={css.launchTopup} style={{ flex: 1 }}
                onClick={() => { window.open(SITE.topup, '_blank', 'noopener') }}>{t('launch.topup')}</button>
              {me !== undefined ? (
                <button
                  type="button"
                  className={css.launchTopup}
                  style={{ flex: 1 }}
                  onClick={() => {
                    const task = ssoLogout !== undefined
                      ? ssoLogout(false)
                      : unbind !== undefined
                        ? unbind()
                        : Promise.resolve()
                    void task.finally(() => {
                      setMe(undefined)
                      setLogs([])
                    })
                  }}
                >
                  {t('launch.signOut')}
                </button>
              ) : (
                <button
                  type="button"
                  className={css.launchTopup}
                  style={{ flex: 1 }}
                  onClick={() => { openXPeachLoginModal(true) }}
                >
                  {t('launch.signIn')}
                </button>
              )}
            </div>
          </div>
        )}
      />
    </div>
  )
}
