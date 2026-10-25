/** Floating XPeach quota pill in the shell overlay: live token state at a glance. */
import type {} from '@xpeach/xph-client-ui-layout/client'
import type {} from '@xpeach/xph-client-locale/client'
import type {} from '@xpeach/xph-client-ui-renderer/client'
import { type JSX, useEffect, useRef, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@xpeach/xph-client-ui-slots'
import type { XPeachTokenLogEntry, XPeachTokenUsage } from '@xpeach/xph-account/types'
import type { XPeachOps } from './ops.ts'
import { XPeachMark } from './brand.tsx'
import { footerBridge } from './FooterAction.tsx'
import { quotaUsd, rel, sparkBars, todaySpend, useTime, SITE } from './fmt.ts'
import css from './xpeach.module.css'

/** Composed pill props: overlay runtime, locale, injected ops. */
export type XPeachStatusPillProps =
  PropsRuntime<'shell.overlay'> & PropsLocale<'xpeach.account'> & InjectFace<XPeachOps>

type PillState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; usage: XPeachTokenUsage; logs: readonly XPeachTokenLogEntry[] }
  | { readonly status: 'error'; message: string }

/**
 * The overlay pill: a compact quota readout pinned at the frame corner.
 * Craft details: the number pulses when billed quota actually moves; an
 * unbound pill breathes to call for attention; the card carries today's
 * spend, a per-call sparkline, relative times and a masked key preview.
 * @param props - locale and injected ops.
 * @returns the pill (nothing while the first read is in flight).
 */
export function XPeachStatusPill(
  { t, loadUsage, load, bind, keyState, subscribeCredentialChange }: XPeachStatusPillProps,
): JSX.Element | null {
  const [state, setState] = useState<PillState>({ status: 'loading' })
  const [keyMask, setKeyMask] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [logsLoaded, setLogsLoaded] = useState(false)
  const [bindKey, setBindKey] = useState('')
  const [bindBusy, setBindBusy] = useState(false)
  const [bindError, setBindError] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const root = useRef<HTMLDivElement | null>(null)
  const lastUsed = useRef<number | undefined>(undefined)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const refresh = (): void => {
    void loadUsage().then((result) => {
      if (result.usage === undefined) {
        lastUsed.current = undefined
        setKeyMask(null)
        setState({ status: 'error', message: result.error ?? t('status.unavailable') })
        return
      }
      // 巧思:额度真的动了才闪——静默刷新不打扰
      const prev = lastUsed.current
      lastUsed.current = result.usage.total_used
      if (prev !== undefined && result.usage.total_used > prev) {
        setFlash(true)
        clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => { setFlash(false) }, 1400)
      }
      const usage = result.usage
      setState(prevState => ({ status: 'ready', usage, logs: prevState.status === 'ready' ? prevState.logs : [] }))
    })
    void keyState().then((s) => { setKeyMask(s.bound ? (s.preview ?? null) : null) })
  }
  useEffect(() => () => { clearTimeout(flashTimer.current) }, [])
  useEffect(refresh, [loadUsage])
  // Any credential write (bind/unbind/out-of-band) re-reads the usage view.
  useEffect(() => subscribeCredentialChange(refresh), [subscribeCredentialChange, loadUsage])
  // The readout stays truthful on a 60s tick — usage moves while sessions run.
  useEffect(() => {
    const id = setInterval(refresh, 60_000)
    return () => { clearInterval(id) }
  }, [loadUsage])
  // The log tail is a heavy read — fetch it only when the card opens, once.
  useEffect(() => {
    if (!open || logsLoaded) return
    setLogsLoaded(true)
    void load().then((result) => {
      setState(prev => prev.status === 'ready' && result.logs !== undefined
        ? { status: 'ready', usage: prev.usage, logs: result.logs }
        : prev)
    })
  }, [open, logsLoaded, load])
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent): void => {
      if (root.current !== null && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('mousedown', onDown) }
  }, [open])

  const doBind = async (): Promise<void> => {
    setBindBusy(true); setBindError(null)
    const error = await bind(bindKey)
    setBindBusy(false)
    if (error !== null) { setBindError(error); return }
    setBindKey('')
    refresh()
  }
  if (state.status === 'loading') return null
  const usage = state.status === 'ready' ? state.usage : undefined
  // Remaining quota under 20% of the grant → alarm styling (unlimited never alarms).
  const lowQuota = usage !== undefined && !usage.unlimited_quota
    && usage.total_granted > 0
    && usage.total_available < usage.total_granted * 0.2
  const pillText = state.status === 'error'
    ? '—'
    : state.usage.unlimited_quota ? '∞' : quotaUsd(state.usage.total_available)
  const tone = state.status === 'error' ? 'err' : lowQuota ? 'low' : 'ok'
  const toneClass = tone === 'err' ? css.statusPillErr : tone === 'low' ? css.statusPillLow : css.statusPillOk
  const pillClass = `${css.statusPill} ${toneClass}${flash ? ` ${css.statusPillFlash}` : ''}`
  const dotToneClass = tone === 'err' ? css.statusDotErr : tone === 'low' ? css.statusDotLow : css.statusDotOk
  const bars = state.status === 'ready' ? sparkBars(state.logs) : []
  return (
    <div ref={root} className={css.pillRoot}>
      <button type="button" className={pillClass} onClick={() => { setOpen(v => !v) }} title={t('pill.title')}>
        <span className={`${css.statusDot} ${dotToneClass}`} aria-hidden="true" />
        <span className={css.statusPillName}>{state.status === 'ready' ? state.usage.name : t('pill.unbound')}</span>
        <span className={css.statusPillQuota}>{state.status === 'error' ? '·' : pillText}</span>
        {state.status === 'ready' && state.logs.length > 0 && (
          <span className={css.statusPillToday}>{todaySpend(state.logs)}{t('pill.perDay')}</span>
        )}
      </button>
      {open && state.status === 'error' && (
        <div className={css.pillCard}>
          <header className={css.pillCardHead}>
            <XPeachMark size={18} />
            <strong>{t('pill.title')}</strong>
          </header>
          <p className={css.bindHint}>{t('bind.hint')} <a href={SITE.token} target="_blank" rel="noreferrer">{t('bind.getKey')}</a></p>
          <div className={css.bindRow}>
            <input
              className={css.bindInput}
              type="password"
              placeholder={t('bind.placeholder')}
              value={bindKey}
              onChange={(e) => { setBindKey(e.target.value) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !bindBusy) { void doBind() } }}
            />
            <button type="button" className={css.bindButton} disabled={bindBusy || bindKey.trim() === ''}
              onClick={() => { void doBind() }}>{bindBusy ? t('bind.working') : t('bind.submit')}</button>
          </div>
          {bindError !== null && <p className={css.bindError}>{bindError}</p>}
        </div>
      )}
      {open && state.status === 'ready' && (
        <div className={css.pillCard}>
          <header className={css.pillCardHead}>
            <XPeachMark size={18} />
            <strong>{t('pill.title')}</strong>
            <button type="button" className={css.iconButton} onClick={refresh} title={t('pill.refresh')} aria-label={t('pill.refreshAria')}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89M13.5 1.5v3h-3"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          </header>
          {keyMask !== null && <p className={css.maskLine}>{keyMask}</p>}
          <dl className={css.pillGrid}>
            <div><dt>{t('usage.name')}</dt><dd>{state.usage.name}</dd></div>
            <div>
              <dt>{t('usage.granted')}</dt>
              <dd>{state.usage.unlimited_quota ? t('usage.unlimited') : quotaUsd(state.usage.total_granted)}</dd>
            </div>
            <div><dt>{t('usage.used')}</dt><dd>{quotaUsd(state.usage.total_used)}</dd></div>
            <div><dt>{t('usage.today')}</dt><dd>{state.logs.length > 0 ? todaySpend(state.logs) : '—'}</dd></div>
            <div>
              <dt>{t('usage.available')}</dt>
              <dd>{state.usage.unlimited_quota ? t('usage.unlimited') : quotaUsd(state.usage.total_available)}</dd>
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
            {state.logs.slice(0, 4).map(entry => (
              <li key={entry.id}>
                <span className={css.logModel}>{entry.model_name}</span>
                <span className={css.logMeta}>
                  {rel(entry.created_at, t('time.justNow'), n => t('time.minAgo', { n }))}
                  {' · '}{entry.prompt_tokens}+{entry.completion_tokens}{' · '}{useTime(entry.use_time)}
                </span>
              </li>
            ))}
            {state.logs.length === 0 && <li>{t('logs.empty')}</li>}
          </ul>
          {lowQuota && <p className={css.lowWarn}>{t('pill.low')}</p>}
          <nav className={css.pillLinks}>
            <a href={SITE.console} target="_blank" rel="noreferrer">{t('pill.openSite')}</a>
            <a href={SITE.token} target="_blank" rel="noreferrer">{t('pill.tokens')}</a>
            <a href={SITE.topup} target="_blank" rel="noreferrer">{t('pill.topup')}</a>
          </nav>
          <button type="button" className={css.consoleLink} onClick={() => { setOpen(false); footerBridge.openConsole() }}>
            {t('pill.openConsole')}
          </button>
        </div>
      )}
    </div>
  )
}
