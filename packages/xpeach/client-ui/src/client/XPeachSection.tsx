/** XPeach settings section: SSO authentication, token usage, site models, call log. */
import { type JSX, useEffect, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@xpeach/xph-client-ui-slots'
import type { XPeachModel } from '@xpeach/xph-account/types'
import type { XPeachOps, XPeachSsoDeviceStartResult } from './ops.ts'
import { Button, Switch } from '@xpeach/xph-client-ui-primitives'
import { XPeachMark } from './brand.tsx'
import { footerBridge } from './FooterAction.tsx'
import { rel, useTime, SITE } from './fmt.ts'
import css from './xpeach.module.css'


/** Composed XPeach section props: runtime slot props, locale, injected ops. */
export type XPeachSectionProps =
  PropsRuntime<'settings.section'> & PropsLocale<'xpeach.account'> & InjectFace<XPeachOps>

type Bound = 'unknown' | 'bound' | 'unbound'
type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; data: NonNullable<import('./ops.ts').XPeachData['usage']>; logs: import('./ops.ts').XPeachData['logs'] }
  | { readonly status: 'error'; message: string }

/** The settings section bound component; all data arrives through props. */
export function XPeachSection({
  t, load, models, modelMatch, keyState, unbind, subscribeCredentialChange,
  sessionBound, sessionUser, unbindSession,
  ssoDeviceStart, ssoDevicePoll, ssoLogout,
  trackingState, setTracking, autoSyncModels, setAutoSyncModels, syncModels,
  protocolPreference, setProtocolPreference,
  families, setFamilies, recents,
}: XPeachSectionProps): JSX.Element {
  const [tracking, setTrackingOn] = useState<boolean | null>(null)
  const [autoSync, setAutoSync] = useState(true)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncCount, setSyncCount] = useState<number | null>(null)
  const [protocol, setProtocol] = useState<'compatible' | 'native' | 'auto'>('compatible')
  useEffect(() => { void trackingState().then(setTrackingOn) }, [trackingState])
  useEffect(() => {
    if (autoSyncModels !== undefined) void autoSyncModels().then(setAutoSync)
  }, [autoSyncModels])
  const [familyList, setFamilyList] = useState<{ all: readonly string[]; enabled: readonly string[] }>({ all: [], enabled: [] })
  const [recentModels, setRecentModels] = useState<readonly { provider: string; model: string }[]>([])
  useEffect(() => { void protocolPreference().then(setProtocol) }, [protocolPreference])
  useEffect(() => { void families().then(setFamilyList) }, [families])
  useEffect(() => { void recents().then(setRecentModels) }, [recents])
  const [bound, setBound] = useState<Bound>('unknown')
  const [sessAs, setSessAs] = useState<string | null>(null)
  const [bindBusy, setBindBusy] = useState(false)
  const [bindError, setBindError] = useState<string | null>(null)
  const [ssoSession, setSsoSession] = useState<XPeachSsoDeviceStartResult | null>(null)
  const [ssoCodeCopied, setSsoCodeCopied] = useState(false)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [modelList, setModelList] = useState<readonly XPeachModel[] | { error: string }>([])
  const [match, setMatch] = useState<readonly { id: string; available: boolean }[]>([])

  const refresh = (): void => {
    setState({ status: 'loading' })
    void load().then((result) => {
      if (result.usage === undefined) {
        setState({ status: 'error', message: result.error ?? t('status.unavailable') })
        return
      }
      setState({ status: 'ready', data: result.usage, logs: result.logs ?? [] })
    })
    void models().then(setModelList)
    void modelMatch().then((m) => { if (Array.isArray(m)) setMatch(m) })
    void recents().then(setRecentModels)
  }
  useEffect(() => {
    let live = true
    void keyState().then((v) => {
      if (!live) return
      setBound(v.bound ? 'bound' : 'unbound')
      if (v.bound) refresh()
    })
    void sessionBound().then((v) => {
      if (!live) return
      const isBound = 'bound' in v && v.bound
      if (isBound) void sessionUser().then((u) => { if (live && u.as !== undefined) setSessAs(u.as) })
    })
    return () => { live = false }
  }, [])
  // A credential change elsewhere (pill bind, shell write) re-reads the gate.
  useEffect(() => subscribeCredentialChange(() => {
    void keyState().then((v) => { setBound(v.bound ? 'bound' : 'unbound'); if (v.bound) refresh(); else setModelList([]) })
    void sessionBound().then((v) => {
      const isBound = 'bound' in v && v.bound
      if (isBound) void sessionUser().then((u) => { if (u.as !== undefined) setSessAs(u.as) })
      else setSessAs(null)
    })
  }), [subscribeCredentialChange])

  const doSsoDevice = async (): Promise<void> => {
    if (ssoDeviceStart === undefined) return
    setBindBusy(true); setBindError(null)
    const r = await ssoDeviceStart(true)
    setBindBusy(false)
    if ('error' in r) {
      setBindError(r.error)
      return
    }
    setSsoSession(r)
    if (!r.browserOpened && typeof window !== 'undefined') {
      window.open(r.verificationUriComplete, '_blank', 'noopener,noreferrer')
    }
  }
  useEffect(() => {
    if (ssoSession === null || ssoDevicePoll === undefined) return
    let active = true
    const intervalMs = Math.max(1500, (ssoSession.interval || 2) * 1000)
    const timer = setInterval(() => {
      void ssoDevicePoll(ssoSession.deviceCode).then((res) => {
        if (!active) return
        if ('error' in res) {
          setBindError(res.error)
          setSsoSession(null)
          return
        }
        if (res.status === 'approved') {
          setSsoSession(null)
          setBindError(null)
          setBound('bound')
          refresh()
        } else if (res.status === 'expired') {
          setBindError(res.message ?? t('sso.expired'))
          setSsoSession(null)
        } else if (res.status === 'denied') {
          setBindError(res.message ?? t('sso.denied'))
          setSsoSession(null)
        } else if (res.status === 'error') {
          setBindError(res.message ?? t('sso.failed'))
          setSsoSession(null)
        }
      })
    }, intervalMs)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [ssoSession, ssoDevicePoll, t])
  const doUnbind = async (): Promise<void> => {
    if (ssoLogout !== undefined) {
      await ssoLogout(false)
    } else {
      await unbind()
      await unbindSession()
    }
    setBound('unbound')
    setSessAs(null)
    setState({ status: 'loading' })
    setModelList([])
  }

  return (
    <section className={css.card}>
      <header className={css.cardHead}>
        <XPeachMark size={28} />
        <div className={css.cardHeadText}>
          <h3 className={css.cardTitle}>{t('section.title')}</h3>
          <p className={css.cardDesc}>{t('section.description')}</p>
        </div>
        <span className={css.badge}><XPeachMark size={12} />{t('brand.code')}</span>
      </header>

      <div className={css.bindCard}>
        <p className={css.groupTitle}>{t('bind.title')}</p>
        {bound === 'unknown' && <p>{t('status.loading')}</p>}
        {bound === 'unbound' && (
          <>
            {ssoDeviceStart !== undefined && ssoSession === null && (
              <div className={css.bindRow}>
                <Button variant="primary" className={css.bindButton} disabled={bindBusy} onClick={() => { void doSsoDevice() }}>
                  {bindBusy ? t('sso.starting') : t('sso.loginBtn')}
                </Button>
              </div>
            )}
            {ssoSession !== null && (
              <div className={css.ssoCodeCard}>
                <p className={css.ssoCodeHint}>{t('sso.waitingTitle')} · {t('sso.userCodeLabel')}</p>
                <div className={css.ssoCodeActions}>
                  <code className={css.ssoCodeValue}>
                    {ssoSession.userCode}
                  </code>
                  <Button
                    variant="outline"
                    className={css.bindGhost}
                    onClick={() => {
                      void navigator.clipboard.writeText(ssoSession.userCode)
                      setSsoCodeCopied(true)
                      setTimeout(() => { setSsoCodeCopied(false) }, 2000)
                    }}
                  >
                    {ssoCodeCopied ? t('sso.codeCopied') : t('sso.copyCode')}
                  </Button>
                  <a href={ssoSession.verificationUriComplete} target="_blank" rel="noreferrer" className={`${css.bindGhost} ${css.ssoLinkBtn}`}>
                    {t('sso.openBrowserAgain')}
                  </a>
                  <Button variant="outline" className={css.bindGhost} onClick={() => { setSsoSession(null) }}>
                    {t('sso.cancel')}
                  </Button>
                </div>
                <p className={css.ssoCodeHint}>{t('sso.pollingHint')}</p>
              </div>
            )}
            {bindError !== null && <p className={css.bindError}>{bindError}</p>}
          </>
        )}
        {bound === 'bound' && (
          <>
            <div className={css.bindRow}>
              <span className={css.bindOk}>● {t('bind.bound')}{sessAs !== null && <span className={css.adminDim}> @{sessAs}</span>}</span>
              <Button variant="outline" className={css.bindGhost} onClick={() => { void doUnbind() }}>{t('launch.signOut')}</Button>
            </div>
            {bindError !== null && <p className={css.bindError}>{bindError}</p>}
          </>
        )}
      </div>

      <div className={css.bindCard}>
        <p className={css.groupTitle}>{t('prefs.cardTitle')}</p>
        <div className={css.prefStack}>
          <div className={css.prefRow}>
            <div className={css.prefRowText}>
              <div className={css.prefTitle}>{t('prefs.xsession.title')}</div>
              <div className={css.prefDesc}>{t('prefs.xsession.desc')}</div>
            </div>
            <Switch
              checked={tracking !== false}
              label={t('prefs.xsession.title')}
              onChange={(next) => {
                setTrackingOn(next)
                void setTracking(next).then((err) => {
                  if (err !== null) setBindError(err)
                })
              }}
            />
          </div>

          <div className={css.prefRow}>
            <div className={css.prefRowText}>
              <div className={css.prefTitle}>{t('prefs.protocol.title')}</div>
              <div className={css.prefDesc}>{t('prefs.protocol.desc')}</div>
            </div>
            <div className={css.prefSegGroup} role="group" aria-label={t('prefs.protocol.title')}>
              {(['compatible', 'auto', 'native'] as const).map(choice => (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={protocol === choice}
                  className={protocol === choice ? css.prefSegBtnOn : css.prefSegBtn}
                  onClick={() => {
                    if (protocol === choice) return
                    setProtocol(choice)
                    void setProtocolPreference(choice).then((err) => {
                      if (err !== null) setBindError(err)
                      else if (bound === 'bound') refresh()
                    })
                  }}
                >
                  {t(`protocol.${choice}`)}
                </button>
              ))}
            </div>
          </div>

          <div className={css.prefRow}>
            <div className={css.prefRowText}>
              <div className={css.prefTitle}>{t('prefs.autosync.title')}</div>
              <div className={css.prefDesc}>{t('prefs.autosync.desc')}</div>
            </div>
            <div className={css.prefControlGroup}>
              <Button
                variant="outline"
                disabled={syncBusy}
                onClick={() => {
                  setSyncBusy(true)
                  setSyncCount(null)
                  void syncModels().then((res) => {
                    if (!('error' in res) && res.ok) {
                      setSyncCount(res.count)
                      if (bound === 'bound') refresh()
                    }
                  }).finally(() => { setSyncBusy(false) })
                }}
              >
                {syncBusy
                  ? t('prefs.autosync.syncing')
                  : syncCount !== null
                    ? t('prefs.autosync.synced', { n: syncCount })
                    : t('prefs.autosync.syncNow')}
              </Button>
              <Switch
                checked={autoSync}
                label={t('prefs.autosync.title')}
                onChange={(next) => {
                  setAutoSync(next)
                  if (setAutoSyncModels !== undefined) {
                    void setAutoSyncModels(next).then((err) => {
                      if (err !== null) setBindError(err)
                    })
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {familyList.all.length > 0 && (
        <>
          <p className={css.groupTitle}>{t('family.title')}</p>
          <div className={css.familyRow}>
            {familyList.all.map(name => (
              <label key={name} className={css.familyChip}>
                <input
                  type="checkbox"
                  checked={familyList.enabled.length === 0 || familyList.enabled.includes(name)}
                  onChange={(event) => {
                    const base = familyList.enabled.length === 0 ? familyList.all : familyList.enabled
                    const next = event.target.checked
                      ? [...base, name]
                      : base.filter(item => item !== name)
                    const settled = next.length === familyList.all.length ? [] : next
                    setFamilyList({ ...familyList, enabled: settled })
                    void setFamilies(settled).then((err) => {
                      if (err !== null) setBindError(err)
                      else if (bound === 'bound') refresh()
                    })
                  }}
                />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </>
      )}

      {bound === 'bound' && state.status === 'loading' && <p>{t('status.loading')}</p>}
      {bound === 'bound' && state.status === 'error' && <p>{t('status.error')}: {state.message}</p>}
      {bound === 'bound' && state.status === 'ready' && (
        <>


          <div>
            {recentModels.length > 0 && (
              <>
                <p className={css.groupTitle}>{t('models.recent')}</p>
                <div className={css.modelChips}>
                  {recentModels.map(item => (
                    <span key={`${item.provider}/${item.model}`} className={css.modelChip}>{item.model}</span>
                  ))}
                </div>
              </>
            )}

            <p className={css.groupTitle}>{t('models.title')}</p>
            {match.length > 0 && (
              <div className={css.modelMatchRow}>
                {match.map(m => (
                  <span key={m.id} className={m.available ? css.modelChipOk : css.modelChipBad}>
                    {m.available ? '✓' : '✗'} {m.id}
                  </span>
                ))}
              </div>
            )}
            {'error' in modelList && <p className={css.bindError}>{modelList.error}</p>}
            {!('error' in modelList) && modelList.length === 0 && <p>{t('models.empty')}</p>}
            {!('error' in modelList) && modelList.length > 0 && (
              <div className={css.modelChips}>
                {modelList.map(m => <span key={m.id} className={css.modelChip}>{m.id}</span>)}
              </div>
            )}
            {!('error' in modelList) && modelList.length > 0 && (
              <p className={css.bindHint}>{modelList.length} {t('models.count')}</p>
            )}
          </div>

          <div>
            <p className={css.groupTitle}>{t('logs.title')}</p>
            {(state.logs ?? []).length === 0
              ? <p>{t('logs.empty')}</p>
              : (
                <table className={css.logTable}>
                  <thead>
                    <tr><th>{t('logs.time.at')}</th><th>{t('logs.model')}</th><th>{t('logs.tokens')}</th><th>{t('logs.time')}</th></tr>
                  </thead>
                  <tbody>
                    {(state.logs ?? []).slice(0, 15).map(entry => (
                      <tr key={entry.id}>
                        <td>{rel(entry.created_at, t('time.justNow'), n => t('time.minAgo', { n }))}</td>
                        <td className={css.logModelCell}>{entry.model_name}</td>
                        <td>{entry.prompt_tokens}+{entry.completion_tokens}</td>
                        <td>{useTime(entry.use_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
          <nav className={css.siteLinks}>
            <button type="button" className={css.siteLinkBtn} onClick={() => { footerBridge.openConsole() }}>{t('pill.openConsole')}</button>
            <a href={SITE.console} target="_blank" rel="noreferrer">{t('pill.openSite')}</a>
            <a href={SITE.topup} target="_blank" rel="noreferrer">{t('pill.topup')}</a>
          </nav>
        </>
      )}
    </section>
  )
}
