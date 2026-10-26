/** XPeach settings section: key binding, token usage, site models, call log. */
import { type JSX, useEffect, useRef, useState } from 'react'
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
  t, load, models, modelMatch, keyState, bind, unbind, subscribeCredentialChange,
  sessionBound, sessionUser, sessionLogin, bindSession, unbindSession,
  ssoDeviceStart, ssoDevicePoll,
  keySlots, keySlotAdd, keySlotSwitch, keySlotRemove,
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
  const [keyMask, setKeyMask] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sessBound, setSessBound] = useState<'unknown' | 'bound' | 'unbound'>('unknown')
  const [sessAs, setSessAs] = useState<string | null>(null)
  const [sessCookie, setSessCookie] = useState('')
  const [sessBusy, setSessBusy] = useState(false)
  const [sessError, setSessError] = useState<string | null>(null)
  const [sessMsg, setSessMsg] = useState<string | null>(null)
  const [slots, setSlots] = useState<readonly { name: string; prefix: string; active: boolean }[]>([])
  const [slotName, setSlotName] = useState('')
  const [slotKey, setSlotKey] = useState('')
  const [slotBusy, setSlotBusy] = useState(false)
  const [slotMsg, setSlotMsg] = useState<string | null>(null)
  const [key, setKey] = useState('')
  const [bindBusy, setBindBusy] = useState(false)
  const [bindError, setBindError] = useState<string | null>(null)
  const [ssoSession, setSsoSession] = useState<XPeachSsoDeviceStartResult | null>(null)
  const [ssoCodeCopied, setSsoCodeCopied] = useState(false)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [modelList, setModelList] = useState<readonly XPeachModel[] | { error: string }>([])
  const [match, setMatch] = useState<readonly { id: string; available: boolean }[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => { clearTimeout(copyTimer.current) }, [])

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
      setKeyMask(v.preview ?? null)
      if (v.bound) refresh()
    })
    void sessionBound().then((v) => {
      if (!live) return
      const isBound = 'bound' in v && v.bound
      setSessBound(isBound ? 'bound' : 'unbound')
      if (isBound) void sessionUser().then((u) => { if (live && u.as !== undefined) setSessAs(u.as) })
    })
    void keySlots().then((v) => { if (live) setSlots(v) })
    return () => { live = false }
  }, [])
  // A credential change elsewhere (pill bind, shell write) re-reads the gate.
  useEffect(() => subscribeCredentialChange(() => {
    void keyState().then((v) => { setBound(v.bound ? 'bound' : 'unbound'); setKeyMask(v.preview ?? null); if (v.bound) refresh(); else setModelList([]) })
  }), [subscribeCredentialChange])

  const doBind = async (): Promise<void> => {
    setBindBusy(true); setBindError(null)
    const error = await bind(key)
    setBindBusy(false)
    if (error !== null) { setBindError(error); return }
    setKey('')
    setBound('bound')
    refresh()
  }
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
          if (res.preview !== undefined) setKeyMask(res.preview)
          refresh()
        } else if (res.status === 'expired') {
          setBindError(res.message ?? t('sso.expired'))
          setSsoSession(null)
        } else if (res.status === 'denied') {
          setBindError(res.message ?? t('sso.denied'))
          setSsoSession(null)
        }
      })
    }, intervalMs)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [ssoSession, ssoDevicePoll, t])
  const reloadSlots = (): void => { void keySlots().then(setSlots) }
  const doSlotAdd = async (): Promise<void> => {
    setSlotBusy(true); setSlotMsg(null)
    const err = await keySlotAdd(slotName, slotKey)
    setSlotBusy(false)
    if (err !== null) { setSlotMsg(err); return }
    setSlotName(''); setSlotKey('')
    reloadSlots()
    void keyState().then((v) => { setBound(v.bound ? 'bound' : 'unbound'); setKeyMask(v.preview ?? null); if (v.bound) refresh() })
  }
  const doSlotSwitch = async (i: number): Promise<void> => {
    setSlotMsg(null)
    const err = await keySlotSwitch(i)
    if (err !== null) { setSlotMsg(err); return }
    reloadSlots()
    void keyState().then((v) => { setKeyMask(v.preview ?? null); if (v.bound) refresh() })
  }
  const doSlotRemove = async (i: number): Promise<void> => {
    setSlotMsg(null)
    const err = await keySlotRemove(i)
    if (err !== null) { setSlotMsg(err); return }
    reloadSlots()
    void keyState().then((v) => { setBound(v.bound ? 'bound' : 'unbound'); setKeyMask(v.preview ?? null) })
  }
  const doSessionLogin = async (): Promise<void> => {
    setSessBusy(true); setSessError(null)
    const r = await sessionLogin()
    setSessBusy(false)
    if (!r.bound) { setSessError(r.error ?? 'login failed'); return }
    setSessBound('bound')
    if (r.as !== undefined) setSessAs(r.as)
    if (r.minted === true) {
      setSessMsg(t('session.mintOk'))
      setBound('bound')
      void keyState().then((v) => { setBound(v.bound ? 'bound' : 'unbound'); setKeyMask(v.preview ?? null) })
    } else if (r.mintErr !== undefined) setSessMsg(t('session.mintFail') + ': ' + r.mintErr)
    void sessionUser().then((u) => { if (u.as !== undefined) setSessAs(u.as) })
  }

  const doSessionBind = async (): Promise<void> => {
    setSessBusy(true); setSessError(null)
    const r = await bindSession(sessCookie)
    setSessBusy(false)
    if (r.error !== undefined && r.error !== '') { setSessError(r.error); return }
    setSessCookie('')
    setSessBound('bound')
    if (r.as !== undefined) setSessAs(r.as)
  }
  const doSessionUnbind = async (): Promise<void> => {
    await unbindSession()
    setSessBound('unbound')
  }
  const doUnbind = async (): Promise<void> => {
    await unbind()
    setBound('unbound')
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

      {/* 凭据绑定卡 —— 半登录核心 */}
      <div className={css.bindCard}>
        <p className={css.groupTitle}>{t('bind.title')}</p>
        {bound === 'unknown' && <p>{t('status.loading')}</p>}
        {bound === 'unbound' && (
          <>
            <p className={css.bindHint}>{t('bind.hint')} <a href={SITE.token} target="_blank" rel="noreferrer">{t('bind.getKey')}</a></p>
            <div className={css.bindRow}>
              <input
                ref={inputRef}
                className={css.bindInput}
                type="password"
                placeholder={t('bind.placeholder')}
                value={key}
                onChange={(e) => { setKey(e.target.value) }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !bindBusy) void doBind() }}
              />
              <Button variant="primary" className={css.bindButton} disabled={bindBusy || key.trim() === ''} onClick={() => { void doBind() }}>
                {bindBusy ? t('bind.working') : t('bind.submit')}
              </Button>
              {ssoDeviceStart !== undefined && ssoSession === null && (
                <Button variant="outline" className={css.bindGhost} disabled={bindBusy} onClick={() => { void doSsoDevice() }}>
                  {t('sso.loginBtn')}
                </Button>
              )}
            </div>
            {ssoSession !== null && (
              <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))' }}>
                <p className={css.bindHint} style={{ margin: '0 0 6px' }}>{t('sso.waitingTitle')} · {t('sso.userCodeLabel')}</p>
                <div className={css.bindRow}>
                  <code className={css.keyMask} style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em' }}>
                    {ssoSession.userCode}
                  </code>
                  <Button
                    variant="outline"
                    className={css.bindGhost}
                    onClick={() => {
                      void navigator.clipboard.writeText(ssoSession.userCode)
                      setSsoCodeCopied(true)
                      setTimeout(() => { setSsoCodeCopied(false) }, 1500)
                    }}
                  >
                    {ssoCodeCopied ? t('bind.copied') : t('sso.copyCode')}
                  </Button>
                  <a href={ssoSession.verificationUriComplete} target="_blank" rel="noreferrer" className={css.bindGhost} style={{ textDecoration: 'none' }}>
                    {t('sso.openBrowserAgain')}
                  </a>
                  <Button variant="outline" className={css.bindGhost} onClick={() => { setSsoSession(null) }}>
                    {t('sso.cancel')}
                  </Button>
                </div>
                <p className={css.bindHint} style={{ margin: '6px 0 0' }}>{t('sso.pollingHint')}</p>
              </div>
            )}
            {bindError !== null && <p className={css.bindError}>{bindError}</p>}
          </>
        )}
        {bound === 'bound' && (
          <>
            <div className={css.bindRow}>
              <span className={css.bindOk}>● {t('bind.bound')}</span>
              {keyMask !== null && <code className={css.keyMask}>{keyMask}</code>}
              <button type="button" className={css.bindGhost} onClick={() => {
                void navigator.clipboard.writeText(SITE.apiBase)
                setCopied(true)
                clearTimeout(copyTimer.current)
                copyTimer.current = setTimeout(() => { setCopied(false) }, 1500)
              }}>{copied ? t('bind.copied') : t('bind.copyApi')}</button>
              <Button variant="outline" className={css.bindGhost} onClick={() => { void doUnbind() }}>{t('bind.unbind')}</Button>
            </div>
            {bindError !== null && <p className={css.bindError}>{bindError}</p>}
          </>
        )}
      </div>

      {/* 多槽切换 —— 多枚 PAT 本地轮换 */}
      <div className={css.bindCard}>
        <p className={css.groupTitle}>{t('slots.title')}</p>
        <ul className={css.slotList}>
          {slots.map((sl, i) => (
            <li key={sl.prefix} className={css.slotRow}>
              <span className={sl.active ? css.slotOn : css.slotDot}>{sl.active ? '●' : '○'}</span>
              <span className={css.slotName}>{sl.name}</span>
              <code className={css.keyMask}>{sl.prefix}</code>
              {sl.active ? <span className={css.groupNow}>{t('slots.current')}</span> : (
                <button type="button" className={css.rowAct} onClick={() => { void doSlotSwitch(i) }}>{t('slots.use')}</button>
              )}
              <button type="button" className={css.rowAct} onClick={() => { void doSlotRemove(i) }}>{t('slots.del')}</button>
            </li>
          ))}
          {slots.length === 0 && <li className={css.slotRow}><span className={css.adminDim}>{t('slots.empty')}</span></li>}
        </ul>
        <div className={css.bindRow}>
          <input className={css.bindInput} style={{ maxWidth: '140px' }} placeholder={t('slots.namePh')} value={slotName} onChange={(e) => { setSlotName(e.target.value) }} />
          <input className={css.bindInput} type="password" placeholder={t('slots.keyPh')} value={slotKey} onChange={(e) => { setSlotKey(e.target.value) }} />
          <Button variant="outline" className={css.bindGhost} disabled={slotBusy || (slotKey.trim().match(/^(?:xpk|sk)-/u) === null)} onClick={() => { void doSlotAdd() }}>
            {slotBusy ? t('bind.working') : t('slots.add')}
          </Button>
        </div>
        {slotMsg !== null && <p className={css.bindHint}>{slotMsg}</p>}
      </div>

      {/* 站点会话卡 —— 写操作(建令牌/充值/资料)需要 site session cookie */}
      <div className={css.bindCard}>
        <p className={css.groupTitle}>{t('session.title')}</p>
        {sessBound === 'unbound' && (
          <>
            <p className={css.bindHint}>{t('session.hint')}</p>
            <div className={css.bindRow}>
              <input
                className={css.bindInput}
                type="password"
                placeholder={t('session.placeholder')}
                value={sessCookie}
                onChange={(e) => { setSessCookie(e.target.value) }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !sessBusy) void doSessionBind() }}
              />
              <button type="button" className={css.bindButton} disabled={sessBusy || sessCookie.trim().length < 16}
                onClick={() => { void doSessionBind() }}>
                {sessBusy ? t('bind.working') : t('session.submit')}
              </button>
              <Button variant="outline" className={css.bindGhost} disabled={sessBusy} onClick={() => { void doSessionLogin() }}>
                {t('session.browserLogin')}
              </Button>
            </div>
            {sessError !== null && <p className={css.bindError}>{sessError}</p>}
            {sessMsg !== null && <p className={css.bindHint}>{sessMsg}</p>}
          </>
        )}
        {sessBound === 'bound' && (
          <div className={css.bindRow}>
            <span className={css.bindOk}>● {t('session.bound')}{sessAs !== null && <span className={css.adminDim}> @{sessAs}</span>}</span>
            <Button variant="outline" className={css.bindGhost} onClick={() => { void doSessionUnbind() }}>{t('session.unbind')}</Button>
          </div>
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
            <a href={SITE.token} target="_blank" rel="noreferrer">{t('pill.tokens')}</a>
            <a href={SITE.topup} target="_blank" rel="noreferrer">{t('pill.topup')}</a>
          </nav>
        </>
      )}
    </section>
  )
}
