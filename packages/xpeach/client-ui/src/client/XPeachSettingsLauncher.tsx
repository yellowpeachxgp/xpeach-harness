/** Sidebar settings launcher: left opens Settings, right toggles the unified
 * XPeach token & account status popover (quota breakdown, per-call sparkline,
 * recent calls, low-quota alert, console jump, top-up, and sign-in/sign-out)
 * across pointer, keyboard, and touch devices. */
import { type JSX, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { InjectFace, PropsLocale, PropsRuntime } from '@xpeach/xph-client-ui-slots'
import { MenuSurface, ShortcutKeys, useAnchoredPosition, useDismissOnOutsidePointer } from '@xpeach/xph-client-ui-primitives'
import type {} from '@xpeach/xph-client-ui-settings/client'
import type { XPeachTokenLogEntry, XPeachTokenUsage } from '@xpeach/xph-account/types'
import type { XPeachOps, XPeachUserSelfRow } from './ops.ts'
import { XPeachMark } from './brand.tsx'
import { openXPeachLoginModal } from './XPeachOnboarding.tsx'
import { quotaUsd, rel, SITE, sparkBars, todaySpend, useTime } from './fmt.ts'
import css from './xpeach.module.css'

const MEASURE_STYLE = { visibility: 'hidden' } as const

/** Props accepted by {@link XPeachSettingsLauncher}. */
export type XPeachSettingsLauncherProps = Pick<
  PropsRuntime<'settings.launcher'>,
  'wide' | 'settingsShortcut' | 'openSettings'
> & PropsLocale<'xpeach.account'> & InjectFace<{
  loadUsage: XPeachOps['loadUsage']
  load: XPeachOps['load']
  userSelf: XPeachOps['userSelf']
  unbind?: XPeachOps['unbind']
  ssoLogout?: XPeachOps['ssoLogout']
  openConsole?: XPeachOps['openConsole']
  subscribeCredentialChange?: XPeachOps['subscribeCredentialChange']
}>

const GearIcon = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.4" />
    <path d="M13.1 9.2c.1-.4.1-.8 0-1.2l1.2-.9-1.2-2-1.4.5c-.3-.2-.7-.4-1.1-.5L10.3 3.6H7.7l-.3 1.5c-.4.1-.8.3-1.1.5l-1.4-.5-1.2 2 1.2.9c-.1.4-.1.8 0 1.2l-1.2.9 1.2 2 1.4-.5c.3.2.7.4 1.1.5l.3 1.5h2.6l.3-1.5c.4-.1.8-.3 1.1-.5l1.4.5 1.2-2-1.2-.9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

/**
 * Render the sidebar settings launcher and unified XPeach quota status popover.
 * @param props - launcher runtime props, locale translator, and injected account ops.
 * @returns the launcher row element.
 */
export function XPeachSettingsLauncher({
  wide, settingsShortcut, openSettings, loadUsage, load, userSelf, unbind, ssoLogout, openConsole, subscribeCredentialChange, t,
}: XPeachSettingsLauncherProps): JSX.Element {
  const [usage, setUsage] = useState<XPeachTokenUsage | undefined>(undefined)
  const [me, setMe] = useState<XPeachUserSelfRow | undefined>(undefined)
  const [logs, setLogs] = useState<readonly XPeachTokenLogEntry[]>([])
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [flash, setFlash] = useState(false)
  const logsLoaded = useRef(false)
  const lastUsed = useRef<number | undefined>(undefined)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const balanceRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const pos = useAnchoredPosition({ open, anchorRef: balanceRef, panelRef, side: 'top', align: 'start', gap: 8, margin: 12 })
  useDismissOnOutsidePointer(balanceRef, open, () => { setOpen(false) }, panelRef)

  const refreshUsage = useCallback((): void => {
    void loadUsage().then((result) => {
      if (result.usage === undefined) {
        lastUsed.current = undefined
        setUsage(undefined)
      } else {
        const prev = lastUsed.current
        lastUsed.current = result.usage.total_used
        if (prev !== undefined && result.usage.total_used > prev) {
          setFlash(true)
          clearTimeout(flashTimer.current)
          flashTimer.current = setTimeout(() => { setFlash(false) }, 1400)
        }
        setUsage(result.usage)
      }
      setReady(true)
    })
    void userSelf().then((result) => {
      if ('error' in result) setMe(undefined)
      else setMe(result)
      setReady(true)
    })
  }, [loadUsage, userSelf])

  const loadLogs = useCallback((force = false): void => {
    if (logsLoaded.current && !force) return
    logsLoaded.current = true
    void load().then((result) => {
      if (result.logs !== undefined) setLogs(result.logs)
    })
  }, [load])

  const refreshAll = useCallback((): void => {
    refreshUsage()
    loadLogs(true)
  }, [refreshUsage, loadLogs])

  useEffect(() => () => { clearTimeout(flashTimer.current) }, [])

  useEffect(() => {
    refreshUsage()
    const off = subscribeCredentialChange?.(() => {
      logsLoaded.current = false
      setLogs([])
      refreshUsage()
    })
    return () => { off?.() }
  }, [refreshUsage, subscribeCredentialChange])

  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      refreshUsage()
    }, 60_000)
    return () => { clearInterval(id) }
  }, [refreshUsage])

  useEffect(() => {
    if (!open) return
    loadLogs()
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown) }
  }, [open, loadLogs])

  const bound = usage !== undefined || me !== undefined
  const granted = usage?.total_granted ?? (me !== undefined ? (me.quota ?? 0) + (me.used_quota ?? 0) : 0)
  const used = usage?.total_used ?? me?.used_quota ?? 0
  const available = usage?.total_available ?? me?.quota ?? 0
  const unlimited = usage?.unlimited_quota === true
  const lowQuota = bound && !unlimited && granted > 0 && available < granted * 0.2
  const tone = !ready ? 'ok' : !bound ? 'err' : lowQuota ? 'low' : 'ok'
  const dotToneClass = tone === 'err' ? css.statusDotErr : tone === 'low' ? css.statusDotLow : css.statusDotOk
  const pillText = !ready || !bound ? '—' : unlimited ? '∞' : quotaUsd(available)
  const bars = sparkBars(logs)
  const tokenName = usage?.name ?? me?.display_name ?? me?.username ?? t('profile.guest')
  const signOut = ssoLogout !== undefined ? () => ssoLogout(false) : unbind
  const balanceClassName = [
    css.launchBalance,
    tone === 'low' ? css.launchBalanceLow : '',
    tone === 'err' ? css.launchBalanceErr : '',
    flash ? css.launchBalanceFlash : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={css.launchRow}>
      <button type="button" className={css.launchSettings} onClick={openSettings}
        aria-label={t('launch.settings')} aria-haspopup="dialog">
        <span className={css.launchGear}><GearIcon /></span>
        {wide && <span className={css.launchLabel}>{t('launch.settings')}</span>}
        {wide && settingsShortcut !== undefined && (
          <ShortcutKeys keys={settingsShortcut.keys} className={css.launchKeys} />
        )}
      </button>
      {wide && (
        <button
          ref={balanceRef}
          type="button"
          className={balanceClassName}
          aria-label={t('pill.title')}
          title={t('pill.title')}
          aria-haspopup="dialog"
          aria-expanded={open}
          onMouseEnter={() => { loadLogs() }}
          onFocus={() => { loadLogs() }}
          onClick={() => { setOpen(v => !v) }}
        >
          <span className={`${css.statusDot} ${dotToneClass}`} aria-hidden="true" />
          <span>{pillText}</span>
        </button>
      )}
      {open && !bound && createPortal(
        <MenuSurface ref={panelRef} className={css.pillCard} role="dialog" aria-label={t('pill.title')} style={pos ?? MEASURE_STYLE}>
          <header className={css.pillCardHead}>
            <XPeachMark size={18} />
            <strong>{t('pill.title')}</strong>
          </header>
          <button
            type="button"
            className={css.bindButton}
            style={{ width: '100%' }}
            onClick={() => {
              setOpen(false)
              openXPeachLoginModal(true)
            }}
          >
            {t('sso.loginBtn')}
          </button>
        </MenuSurface>,
        document.body,
      )}
      {open && bound && createPortal(
        <MenuSurface ref={panelRef} className={css.pillCard} role="dialog" aria-label={t('pill.title')} style={pos ?? MEASURE_STYLE}>
          <header className={css.pillCardHead}>
            <XPeachMark size={18} />
            <strong>{t('pill.title')}</strong>
            {me?.group !== undefined && <span className={css.profileGroup}>{me.group}</span>}
            <button type="button" className={css.iconButton} onClick={refreshAll} title={t('pill.refresh')} aria-label={t('pill.refreshAria')}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89M13.5 1.5v3h-3"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          </header>
          <dl className={css.pillGrid}>
            <div><dt>{t('usage.name')}</dt><dd>{tokenName}</dd></div>
            <div>
              <dt>{t('usage.granted')}</dt>
              <dd>{unlimited ? t('usage.unlimited') : quotaUsd(granted)}</dd>
            </div>
            <div><dt>{t('usage.used')}</dt><dd>{quotaUsd(used)}</dd></div>
            <div><dt>{t('usage.today')}</dt><dd>{logs.length > 0 ? todaySpend(logs) : '—'}</dd></div>
            <div>
              <dt>{t('usage.available')}</dt>
              <dd>{unlimited ? t('usage.unlimited') : quotaUsd(available)}</dd>
            </div>
          </dl>
          {bars.length > 0 && (
            <svg className={css.spark} viewBox={`0 0 ${bars.length * 5} 26`} preserveAspectRatio="none" aria-hidden="true">
              {bars.map((h, i) => (
                <rect key={i} x={i * 5 + 0.5} y={26 - h * 24} width={4} height={h * 24} rx={1.2} />
              ))}
            </svg>
          )}
          <p className={css.pillSection}>{t('pill.recent')}</p>
          <ul className={css.pillLogs}>
            {logs.slice(0, 4).map(entry => (
              <li key={entry.id}>
                <span className={css.logModel}>{entry.model_name}</span>
                <span className={css.logMeta}>
                  {rel(entry.created_at, t('time.justNow'), n => t('time.minAgo', { n }))}
                  {' · '}{entry.prompt_tokens}+{entry.completion_tokens}{' · '}{useTime(entry.use_time)}
                </span>
              </li>
            ))}
            {logs.length === 0 && <li>{t('logs.empty')}</li>}
          </ul>
          {lowQuota && <p className={css.lowWarn}>{t('pill.low')}</p>}
          <nav className={css.pillLinks}>
            <a href={SITE.console} target="_blank" rel="noreferrer">{t('pill.openSite')}</a>
            <a href={SITE.topup} target="_blank" rel="noreferrer">{t('pill.topup')}</a>
            {signOut !== undefined && (
              <button
                type="button"
                className={css.pillSignOut}
                onClick={() => {
                  setOpen(false)
                  void signOut().finally(() => {
                    setUsage(undefined)
                    setMe(undefined)
                    setLogs([])
                  })
                }}
              >
                {t('launch.signOut')}
              </button>
            )}
          </nav>
          <button
            type="button"
            className={css.consoleLink}
            onClick={() => {
              setOpen(false)
              openConsole?.()
            }}
          >
            {t('pill.openConsole')}
          </button>
        </MenuSurface>,
        document.body,
      )}
    </div>
  )
}
