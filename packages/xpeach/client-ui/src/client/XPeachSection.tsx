/** XPeach settings section: key binding, token usage, site models, call log. */
import { useEffect, useRef, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@xpeach/xph-client-ui-slots'
import type { XPeachModel } from '@xpeach/xph-account/types'
import type { XPeachOps } from './ops.ts'
import { XPeachMark } from './brand.tsx'
import { footerBridge } from './FooterAction.tsx'
import { quotaUsd, rel, useTime, SITE } from './fmt.ts'
import css from './xpeach.module.css'


/** Composed XPeach section props: runtime slot props, locale, injected ops. */
export type XPeachSectionProps =
  PropsRuntime<'settings.section'> & PropsLocale<'xpeach.account'> & InjectFace<XPeachOps>

type Bound = 'unknown' | 'bound' | 'unbound'
type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready', data: NonNullable<import('./ops.ts').XPeachData['usage']>, logs: import('./ops.ts').XPeachData['logs'] }
  | { readonly status: 'error', message: string }

/** The settings section bound component; all data arrives through props. */
export function XPeachSection({ t, load, models, modelMatch, keyState, bind, unbind, subscribeCredentialChange, sessionBound, sessionUser, sessionLogin, bindSession, unbindSession, keySlots, keySlotAdd, keySlotSwitch, keySlotRemove }: XPeachSectionProps): JSX.Element {
  const [bound, setBound] = useState<Bound>('unknown')
  const [keyMask, setKeyMask] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sessBound, setSessBound] = useState<'unknown' | 'bound' | 'unbound'>('unknown')
  const [sessAs, setSessAs] = useState<string | null>(null)
  const [sessCookie, setSessCookie] = useState('')
  const [sessBusy, setSessBusy] = useState(false)
  const [sessError, setSessError] = useState<string | null>(null)
  const [sessMsg, setSessMsg] = useState<string | null>(null)
  const [slots, setSlots] = useState<readonly { name: string, prefix: string, active: boolean }[]>([])
  const [slotName, setSlotName] = useState('')
  const [slotKey, setSlotKey] = useState('')
  const [slotBusy, setSlotBusy] = useState(false)
  const [slotMsg, setSlotMsg] = useState<string | null>(null)
  const [key, setKey] = useState('')
  const [bindBusy, setBindBusy] = useState(false)
  const [bindError, setBindError] = useState<string | null>(null)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [modelList, setModelList] = useState<readonly XPeachModel[] | { error: string }>([])
  const [match, setMatch] = useState<readonly { id: string, available: boolean }[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const refresh = (): void => {
    setState({ status: 'loading' })
    void load().then(result => {
      if (result.usage === undefined) {
        setState({ status: 'error', message: result.error ?? 'unavailable' })
        return
      }
      setState({ status: 'ready', data: result.usage, logs: result.logs ?? [] })
    })
    void models().then(setModelList)
    void modelMatch().then(m => { if (Array.isArray(m)) setMatch(m) })
  }
  useEffect(() => {
    let live = true
    void keyState().then(v => {
      if (!live) return
      setBound(v.bound ? 'bound' : 'unbound')
      setKeyMask(v.preview ?? null)
      if (v.bound) refresh()
    })
    void sessionBound().then(v => {
      if (!live) return
      const isBound = 'bound' in v && v.bound
      setSessBound(isBound ? 'bound' : 'unbound')
      if (isBound) void sessionUser().then(u => { if (live && u.as !== undefined) setSessAs(u.as) })
    })
    void keySlots().then(v => { if (live) setSlots(v) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // A credential change elsewhere (pill bind, shell write) re-reads the gate.
  useEffect(() => subscribeCredentialChange(() => {
    void keyState().then(v => { setBound(v.bound ? 'bound' : 'unbound'); setKeyMask(v.preview ?? null); if (v.bound) refresh(); else setModelList([]) })
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
  const reloadSlots = (): void => { void keySlots().then(setSlots) }
  const doSlotAdd = async (): Promise<void> => {
    setSlotBusy(true); setSlotMsg(null)
    const err = await keySlotAdd(slotName, slotKey)
    setSlotBusy(false)
    if (err !== null) { setSlotMsg(err); return }
    setSlotName(''); setSlotKey('')
    reloadSlots()
    void keyState().then(v => { setBound(v.bound ? 'bound' : 'unbound'); setKeyMask(v.preview ?? null); if (v.bound) refresh() })
  }
  const doSlotSwitch = async (i: number): Promise<void> => {
    setSlotMsg(null)
    const err = await keySlotSwitch(i)
    if (err !== null) { setSlotMsg(err); return }
    reloadSlots()
    void keyState().then(v => { setKeyMask(v.preview ?? null); if (v.bound) refresh() })
  }
  const doSlotRemove = async (i: number): Promise<void> => {
    setSlotMsg(null)
    const err = await keySlotRemove(i)
    if (err !== null) { setSlotMsg(err); return }
    reloadSlots()
    void keyState().then(v => { setBound(v.bound ? 'bound' : 'unbound'); setKeyMask(v.preview ?? null) })
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
      void keyState().then(v => { setBound(v.bound ? 'bound' : 'unbound'); setKeyMask(v.preview ?? null) })
    } else if (r.mintErr !== undefined) setSessMsg(t('session.mintFail') + ': ' + r.mintErr)
    void sessionUser().then(u => { if (u.as !== undefined) setSessAs(u.as) })
  }

  const doSessionBind = async (): Promise<void> => {
    setSessBusy(true); setSessError(null)
    const r = await bindSession(sessCookie)
    setSessBusy(false)
    if (r.error !== undefined && r.error !== null && r.error !== '') { setSessError(r.error); return }
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
        <span className={css.badge}>🍑Code</span>
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
                onChange={e => { setKey(e.target.value) }}
                onKeyDown={e => { if (e.key === 'Enter' && !bindBusy) void doBind() }}
              />
              <button type="button" className={css.bindButton} disabled={bindBusy || !key.trim().match(/^(?:xpk|sk)-/u) !== null} onClick={() => { void doBind() }}>
                {bindBusy ? t('bind.working') : t('bind.submit')}
              </button>
            </div>
            {bindError !== null && <p className={css.bindError}>{bindError}</p>}
          </>
        )}
        {bound === 'bound' && (
          <div className={css.bindRow}>
            <span className={css.bindOk}>● {t('bind.bound')}</span>
            {keyMask !== null && <code className={css.keyMask}>{keyMask}</code>}
            <button type="button" className={css.bindGhost} onClick={() => {
              void navigator.clipboard.writeText('https://fast.xpeach.codes/v1')
              setCopied(true); setTimeout(() => { setCopied(false) }, 1500)
            }}>{copied ? t('bind.copied') : t('bind.copyApi')}</button>
            <button type="button" className={css.bindGhost} onClick={() => { void doUnbind() }}>{t('bind.unbind')}</button>
          </div>
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
          <input className={css.bindInput} style={{ maxWidth: '140px' }} placeholder={t('slots.namePh')} value={slotName} onChange={e => { setSlotName(e.target.value) }} />
          <input className={css.bindInput} type="password" placeholder={t('slots.keyPh')} value={slotKey} onChange={e => { setSlotKey(e.target.value) }} />
          <button type="button" className={css.bindGhost} disabled={slotBusy || !slotKey.trim().match(/^(?:xpk|sk)-/u) !== null} onClick={() => { void doSlotAdd() }}>
            {slotBusy ? t('bind.working') : t('slots.add')}
          </button>
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
                onChange={e => { setSessCookie(e.target.value) }}
                onKeyDown={e => { if (e.key === 'Enter' && !sessBusy) void doSessionBind() }}
              />
              <button type="button" className={css.bindButton} disabled={sessBusy || sessCookie.trim().length < 16}
                onClick={() => { void doSessionBind() }}>
                {sessBusy ? t('bind.working') : t('session.submit')}
              </button>
              <button type="button" className={css.bindGhost} disabled={sessBusy} onClick={() => { void doSessionLogin() }}>
                {t('session.browserLogin')}
              </button>
            </div>
            {sessError !== null && <p className={css.bindError}>{sessError}</p>}
            {sessMsg !== null && <p className={css.bindHint}>{sessMsg}</p>}
          </>
        )}
        {sessBound === 'bound' && (
          <div className={css.bindRow}>
            <span className={css.bindOk}>● {t('session.bound')}{sessAs !== null && <span className={css.adminDim}> @{sessAs}</span>}</span>
            <button type="button" className={css.bindGhost} onClick={() => { void doSessionUnbind() }}>{t('session.unbind')}</button>
          </div>
        )}
      </div>

      {bound === 'bound' && state.status === 'loading' && <p>{t('status.loading')}</p>}
      {bound === 'bound' && state.status === 'error' && <p>{t('status.error')}: {state.message}</p>}
      {bound === 'bound' && state.status === 'ready' && (
        <>
          <dl className={css.usageGrid}>
            <div className={css.usageCell}><dt>{t('usage.name')}</dt><dd>{state.data.name}</dd></div>
            <div className={css.usageCell}><dt>{t('usage.granted')}</dt><dd>{state.data.unlimited_quota ? t('usage.unlimited') : quotaUsd(state.data.total_granted)}</dd></div>
            <div className={css.usageCell}><dt>{t('usage.used')}</dt><dd>{quotaUsd(state.data.total_used)}</dd></div>
            <div className={css.usageCell}><dt>{t('usage.available')}</dt><dd>{state.data.unlimited_quota ? t('usage.unlimited') : quotaUsd(state.data.total_available)}</dd></div>
          </dl>

          <div>
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
            {Array.isArray(modelList) && modelList.length === 0 && <p>{t('models.empty')}</p>}
            {Array.isArray(modelList) && modelList.length > 0 && (
              <div className={css.modelChips}>
                {modelList.map(m => <span key={m.id} className={css.modelChip}>{m.id}</span>)}
              </div>
            )}
            {Array.isArray(modelList) && modelList.length > 0 && (
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
