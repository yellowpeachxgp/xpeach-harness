/** First-run onboarding — a large, flat, step-by-step wizard: welcome, login,
 * pick conversation sources, pick extras, watch the import, done. */
import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@xpeach/xph-client-ui-slots'
import type { XPeachOps, XPeachOnboardingScan, XPeachSsoDeviceStartResult } from './ops.ts'
import { XPeachMark as XPeachMarkInline } from './brand.tsx'
import css from './xpeach.module.css'

type Props = PropsRuntime<'shell.overlay'> & PropsLocale<'xpeach.account'> & InjectFace<XPeachOps>

type Stage = 'check' | 'welcome' | 'login' | 'sources' | 'extras' | 'importing' | 'done' | 'closed'
type StepId = 'welcome' | 'login' | 'sources' | 'extras' | 'done'
type Status = 'pending' | 'running' | 'done' | 'error'

interface ProgressItem { readonly id: string; readonly label: string; status: Status }

const STEPS: readonly StepId[] = ['welcome', 'login', 'sources', 'extras', 'done']

type LoginModalListener = (autoStartSso: boolean) => void
const loginModalListeners = new Set<LoginModalListener>()

/**
 * Open the XPeach login modal overlay from any client UI surface.
 * @param autoStartSso - when true, immediately starts the SSO Device Flow.
 */
export function openXPeachLoginModal(autoStartSso = false): void {
  for (const listener of loginModalListeners) {
    listener(autoStartSso)
  }
}

/**
 * Whether the desktop shell demands a bound token before the workspace opens.
 * @returns true when the boot handshake published the gate flag.
 */
function authGateRequired(): boolean {
  return (globalThis as { __XPH_AUTH_GATE__?: boolean }).__XPH_AUTH_GATE__ === true
}

/** Per-source presentation metadata for local conversation stores. */
export const SOURCE_META: Record<string, { icon: string; key: string }> = {
  deepseek: { icon: '◆', key: 'onb.src.deepseek' },
  claude: { icon: '✳️', key: 'onb.src.claude' },
  codex: { icon: '⬡', key: 'onb.src.codex' },
  zcode: { icon: '⚡', key: 'onb.src.zcode' },
  chatgpt: { icon: '💬', key: 'onb.src.chatgpt' },
  gemini: { icon: '✦', key: 'onb.src.gemini' },
  antigravity: { icon: '🚀', key: 'onb.src.antigravity' },
}

/**
 * Render the first-run onboarding wizard overlay.
 * @param props - locale translator and injected XPeach operations.
 * @returns the modal element, or null when closed.
 */
export function XPeachOnboarding({
  t, ssoDeviceStart, ssoDevicePoll, subscribeCredentialChange, subscribeSessionExpired, subscribeModelSignInRequired,
  keyState, sessionBound, onboardingScan,
  importConversations, importAssets, onboardingDone, onboardingComplete,
}: Props): JSX.Element | null {
  const [stage, setStage] = useState<Stage>('check')
  const [standaloneLogin, setStandaloneLogin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ssoSession, setSsoSession] = useState<XPeachSsoDeviceStartResult | null>(null)
  const [ssoCodeCopied, setSsoCodeCopied] = useState(false)
  const [scan, setScan] = useState<XPeachOnboardingScan | undefined>(undefined)
  const [picked, setPicked] = useState<readonly string[]>([])
  const [assets, setAssets] = useState({ mcp: true, skills: true, prompts: true })
  const [progress, setProgress] = useState<readonly ProgressItem[]>([])
  const [summary, setSummary] = useState({ threads: 0, skills: 0, prompts: 0, mcp: 0 })

  useEffect(() => {
    const onOpenModal: LoginModalListener = (autoStartSso) => {
      setStandaloneLogin(true)
      setError(null)
      setStage('login')
      if (autoStartSso) {
        void doSsoDevice()
      }
    }
    loginModalListeners.add(onOpenModal)
    return () => {
      loginModalListeners.delete(onOpenModal)
    }
  })

  useEffect(() => {
    const offExpired = subscribeSessionExpired?.(() => {
      setStandaloneLogin(true)
      setSsoSession(null)
      setError(t('sso.sessionRevokedNotice'))
      setStage('login')
    })
    const offModelSignIn = subscribeModelSignInRequired?.(() => {
      setStandaloneLogin(true)
      setSsoSession(null)
      setError(t('sso.modelSignInRequiredNotice'))
      setStage('login')
    })
    return () => {
      offExpired?.()
      offModelSignIn?.()
    }
  }, [subscribeSessionExpired, subscribeModelSignInRequired, t])

  useEffect(() => {
    let live = true
    void Promise.all([
      onboardingDone().catch(() => ({ done: false })),
      keyState().catch(() => null),
      sessionBound().catch(() => null),
    ]).then(([done, k, s]) => {
      if (!live) return
      const alreadyBound = (k !== null && (k.bound || k.adminBound === true)) || (s !== null && 'bound' in s && s.bound)
      if (alreadyBound) {
        try { localStorage.setItem('xpeach.onboarding.done', '1') } catch (_err) { /* ignore storage quota */ }
        ;(globalThis as { __XPH_AUTH_GATE__?: boolean }).__XPH_AUTH_GATE__ = false
        if (!done.done) {
          void onboardingComplete()
        }
        setStage('closed')
        return
      }
      if (done.done) {
        setStandaloneLogin(true)
        setStage('login')
        return
      }
      try {
        localStorage.removeItem('xpeach.onboarding.done')
        localStorage.removeItem('xpeach.tab.data.v1')
        localStorage.removeItem('xpeach.tab.keyState.v1')
        localStorage.removeItem('xpeach.profile.cache.v1')
      } catch (_err) { /* ignore storage errors */ }
      void onboardingScan().then((r) => {
        if (!live) return
        if (!('error' in r)) {
          setScan(r)
          setPicked(r.sources.filter(source => source.found).map(source => source.id))
        }
        setStage('welcome')
      })
    })
    return () => { live = false }
  }, [onboardingDone, onboardingComplete, onboardingScan, keyState, sessionBound])

  useEffect(() => {
    const offCred = subscribeCredentialChange(() => {
      void Promise.all([keyState().catch(() => null), sessionBound().catch(() => null)]).then(([k, s]) => {
        const boundNow = (k !== null && (k.bound || k.adminBound === true)) || (s !== null && 'bound' in s && s.bound)
        if (!boundNow) {
          setStandaloneLogin(true)
          setSsoSession(null)
          setStage('login')
          return
        }
        try { localStorage.setItem('xpeach.onboarding.done', '1') } catch (_err) { /* ignore storage quota */ }
        ;(globalThis as { __XPH_AUTH_GATE__?: boolean }).__XPH_AUTH_GATE__ = false
        setSsoSession(null)
        setError(null)
        void onboardingComplete()
        setStage((prev) => {
          if (prev === 'welcome') return 'closed'
          if (prev === 'login') return standaloneLogin ? 'closed' : 'sources'
          return prev
        })
      })
    })
    return () => { offCred() }
  }, [subscribeCredentialChange, keyState, sessionBound, onboardingComplete, standaloneLogin])

  const sourceList = useMemo(() => scan?.sources.filter(source => source.found) ?? [], [scan])
  const hasAssets = (scan?.mcp.length ?? 0) + (scan?.skills.length ?? 0) + (scan?.prompts.length ?? 0) > 0

  useEffect(() => {
    if (stage !== 'login' || ssoSession === null || ssoDevicePoll === undefined) return
    let active = true
    let inFlight = false
    const intervalMs = Math.max(1500, (ssoSession.interval || 2) * 1000)
    const timer = setInterval(() => {
      if (inFlight) return
      inFlight = true
      void ssoDevicePoll(ssoSession.deviceCode).then((res) => {
        inFlight = false
        if (!active) return
        if ('error' in res) {
          setError(res.error)
          setSsoSession(null)
          return
        }
        if (res.status === 'approved') {
          setSsoSession(null)
          setError(null)
          try { localStorage.setItem('xpeach.onboarding.done', '1') } catch (_err) { /* ignore storage quota */ }
          ;(globalThis as { __XPH_AUTH_GATE__?: boolean }).__XPH_AUTH_GATE__ = false
          void onboardingComplete()
          setStage(standaloneLogin ? 'closed' : 'sources')
        } else if (res.status === 'expired') {
          setError(res.message ?? t('sso.expired'))
          setSsoSession(null)
        } else if (res.status === 'denied') {
          setError(res.message ?? t('sso.denied'))
          setSsoSession(null)
        } else if (res.status === 'error') {
          setError(res.message ?? t('sso.failed'))
          setSsoSession(null)
        }
      }).catch(() => {
        inFlight = false
      })
    }, intervalMs)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [stage, ssoSession, ssoDevicePoll, standaloneLogin, t])

  const goLoginOrSources = async (): Promise<void> => {
    const [k, s] = await Promise.all([keyState().catch(() => null), sessionBound().catch(() => null)])
    const bound = (k !== null && k.bound) || (s !== null && 'bound' in s && s.bound)
    setStage(bound ? 'sources' : 'login')
  }

  const finish = async (): Promise<void> => {
    setBusy(true)
    await onboardingComplete()
    setBusy(false)
    setStage('closed')
  }

  const doImport = async (): Promise<void> => {
    setStage('importing')
    setError(null)
    const items: { id: string; label: string; run: () => Promise<void> }[] = []
    for (const id of picked) {
      const meta = SOURCE_META[id]
      items.push({
        id: 'src-' + id,
        label: meta === undefined ? id : t(meta.key as never),
        run: async () => {
          const r = await importConversations([id])
          if ('error' in r) throw new Error(r.error)
          setSummary(prev => ({ ...prev, threads: prev.threads + r.reduce((sum, item) => sum + item.imported, 0) }))
        },
      })
    }
    if (assets.skills) items.push({
      id: 'skills', label: t('onboard.skills'),
      run: async () => {
        const r = await importAssets({ mcp: false, skills: true, prompts: false })
        if ('error' in r) throw new Error(r.error)
        setSummary(prev => ({ ...prev, skills: prev.skills + r.skills }))
      },
    })
    if (assets.prompts) items.push({
      id: 'prompts', label: t('onboard.prompts'),
      run: async () => {
        const r = await importAssets({ mcp: false, skills: false, prompts: true })
        if ('error' in r) throw new Error(r.error)
        setSummary(prev => ({ ...prev, prompts: prev.prompts + r.prompts }))
      },
    })
    if (assets.mcp) items.push({
      id: 'mcp', label: t('onboard.mcp'),
      run: async () => {
        const r = await importAssets({ mcp: true, skills: false, prompts: false })
        if ('error' in r) throw new Error(r.error)
        setSummary(prev => ({ ...prev, mcp: prev.mcp + r.mcp }))
      },
    })
    setProgress(items.map(item => ({ id: item.id, label: item.label, status: 'pending' })))
    for (const item of items) {
      setProgress(prev => prev.map(row => row.id === item.id ? { ...row, status: 'running' } : row))
      try {
        await item.run()
        setProgress(prev => prev.map(row => row.id === item.id ? { ...row, status: 'done' } : row))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
        setProgress(prev => prev.map(row => row.id === item.id ? { ...row, status: 'error' } : row))
      }
    }
    await onboardingComplete()
    setStage('done')
  }

  if (stage === 'check' || stage === 'closed') return null

  const stepIndex = stage === 'importing' ? STEPS.indexOf('extras') : STEPS.indexOf(stage)
  const rail = (
    <aside className={css.onbRail}>
      <div className={css.onbBrand}><XPeachMarkInline size={30} /><span>{t('brand.title')}</span></div>
      <ol className={css.onbSteps}>
        {STEPS.map((step, index) => (
          <li key={step} className={css.onbStep} data-on={index <= stepIndex}>
            <span className={css.onbStepDot}>{index < stepIndex ? '✓' : index + 1}</span>
            <span>{t(('onb.step.' + step) as never)}</span>
          </li>
        ))}
      </ol>
      {t('onb.privacy') !== '' && <p className={css.onbPrivacy}>{t('onb.privacy')}</p>}
    </aside>
  )

  return (
    <div className={css.onbBackdrop} data-gate={(stage === 'welcome' || stage === 'login' || authGateRequired()) ? 'true' : 'false'} role="dialog" aria-modal="true" aria-label={t('onb.welcomeTitle')}>
      <div className={css.onbShell}>
        {rail}
        <main className={css.onbMain}>
          {stage === 'welcome' && (
            <>
              <div className={css.onbHero}>
                <XPeachMarkInline size={40} />
                <div>
                  <h2>{t('onb.welcomeTitle')}</h2>
                  {t('onb.welcomeSub') !== '' && <p>{t('onb.welcomeSub')}</p>}
                </div>
              </div>
              <div className={css.onbFooter}>
                <button type="button" className={css.onbPrimary} onClick={() => { void goLoginOrSources() }}>{t('onb.start')}</button>
              </div>
            </>
          )}

          {stage === 'login' && (
            <>
              <div className={css.onbHead}>
                <h2>{t('onb.loginTitle')}</h2>
                {t('onb.loginSub') !== '' && <p>{t('onb.loginSub')}</p>}
              </div>
              {ssoSession !== null ? (
                <div className={css.onbLoginCard}>
                  <label className={css.onbLabel}>{t('sso.waitingTitle')}</label>
                  <div className={css.ssoCodeCard}>
                    <p className={css.ssoCodeHint}>{t('sso.userCodeLabel')}</p>
                    <div className={css.ssoCodeActions}>
                      <code className={css.ssoCodeValue}>
                        {ssoSession.userCode}
                      </code>
                      <button
                        type="button"
                        className={css.onbPrimary}
                        onClick={() => {
                          void navigator.clipboard.writeText(ssoSession.userCode)
                          setSsoCodeCopied(true)
                          setTimeout(() => { setSsoCodeCopied(false) }, 2000)
                        }}
                      >
                        {ssoCodeCopied ? t('sso.codeCopied') : t('sso.copyCode')}
                      </button>
                      <a
                        href={ssoSession.verificationUriComplete}
                        target="_blank"
                        rel="noreferrer"
                        className={`${css.onbGhost} ${css.ssoLinkBtn}`}
                      >
                        {t('sso.openBrowserAgain')}
                      </a>
                    </div>
                    <p className={css.ssoCodeHint}>{t('sso.pollingHint')}</p>
                  </div>
                  {error !== null && <p className={css.bindError}>{error}</p>}
                </div>
              ) : (
                <div className={css.onbLoginCard}>
                  {ssoDeviceStart !== undefined && (
                    <div className={css.ssoLoginTriggerWrap}>
                      <button
                        type="button"
                        className={`${css.onbPrimary} ${css.ssoLoginTriggerBtn}`}
                        disabled={busy}
                        onClick={() => { void doSsoDevice() }}
                      >
                        {busy ? t('sso.starting') : t('sso.loginBtn')}
                      </button>
                    </div>
                  )}
                  {error !== null && <p className={css.bindError}>{error}</p>}
                </div>
              )}
              {ssoSession !== null && (
                <div className={css.onbFooter}>
                  <button type="button" className={css.onbGhost} onClick={() => { setSsoSession(null) }}>
                    {t('sso.cancel')}
                  </button>
                </div>
              )}
            </>
          )}

          {stage === 'sources' && (
            <>
              <div className={css.onbHead}>
                <h2>{t('onb.sourcesTitle')}</h2>
                {t('onb.sourcesSub') !== '' && <p>{t('onb.sourcesSub')}</p>}
              </div>
              {scan === undefined ? (
                <div className={css.onbEmpty}><XPeachMarkInline size={28} /><b>{t('onb.scanning')}</b></div>
              ) : sourceList.length === 0 ? (
                <div className={css.onbEmpty}><XPeachMarkInline size={28} /><b>{t('onb.noneTitle')}</b>{t('onb.noneSub') !== '' && <p>{t('onb.noneSub')}</p>}</div>
              ) : (
                <div className={css.onbCards}>
                  {sourceList.map((source) => {
                    const meta = SOURCE_META[source.id] ?? { icon: '💬', key: 'onb.src.chatgpt' }
                    const on = picked.includes(source.id)
                    return (
                      <button key={source.id} type="button" className={css.onbCard} data-on={on}
                        onClick={() => { setPicked(prev => on ? prev.filter(id => id !== source.id) : [...prev, source.id]) }}>
                        <span className={css.onbCardIcon}>{meta.icon}</span>
                        <span className={css.onbCardBody}>
                          <span className={css.onbCardTitle}>{source.label}</span>
                          <span className={css.onbCardDesc}>{t(meta.key as never)}</span>
                          <span className={css.onbCardCount}>{t('onboard.threads', { n: String(source.threads) })}</span>
                        </span>
                        <span className={css.onbCheck} data-on={on}>{on ? '✓' : ''}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className={css.onbFooter}>
                <button type="button" className={css.onbGhost} onClick={() => { setPicked(sourceList.map(source => source.id)) }}>{t('onb.selectAll')}</button>
                <button type="button" className={css.onbGhost} onClick={() => { setPicked([]) }}>{t('onb.clearAll')}</button>
                <span className={css.onbSpacer} />
                {sourceList.length > 0 && <span className={css.onbHint}>{picked.length} / {sourceList.length}</span>}
                <button type="button" className={css.onbGhost} onClick={() => { void finish() }}>{t('onb.skipGuide')}</button>
                {hasAssets && <button type="button" className={css.onbPrimary} onClick={() => { setStage('extras') }}>{t('onb.next')}</button>}
                {!hasAssets && (sourceList.length === 0 || scan === undefined
                  ? <button type="button" className={css.onbPrimary} disabled={scan === undefined} onClick={() => { setStage('extras') }}>{t('onb.next')}</button>
                  : picked.length === 0
                    ? null
                    : <button type="button" className={css.onbPrimary} onClick={() => { void doImport() }}>{t('onb.importNow')}</button>)}
              </div>
            </>
          )}

          {stage === 'extras' && (
            <>
              <div className={css.onbHead}>
                <h2>{t('onb.extrasTitle')}</h2>
                {t('onb.extrasSub') !== '' && <p>{t('onb.extrasSub')}</p>}
              </div>
              <div className={css.onbCards}>
                {([
                  ['skills', '🧩', 'onboard.skills', 'onb.skillsDesc', scan?.skills.length ?? 0],
                  ['prompts', '📝', 'onboard.prompts', 'onb.promptsDesc', scan?.prompts.length ?? 0],
                  ['mcp', '🔌', 'onboard.mcp', 'onb.mcpDesc', scan?.mcp.length ?? 0],
                ] as const).map(([id, icon, title, desc, count]) => {
                  const on = assets[id]
                  return (
                    <button key={id} type="button" className={css.onbCard} data-on={on}
                      onClick={() => { setAssets(prev => ({ ...prev, [id]: !prev[id] })) }}>
                      <span className={css.onbCardIcon}>{icon}</span>
                      <span className={css.onbCardBody}>
                        <span className={css.onbCardTitle}>{t(title)}</span>
                        <span className={css.onbCardDesc}>{t(desc)}</span>
                        <span className={css.onbCardCount}>{count}</span>
                      </span>
                      <span className={css.onbCheck} data-on={on}>{on ? '✓' : ''}</span>
                    </button>
                  )
                })}
              </div>
              <div className={css.onbFooter}>
                <button type="button" className={css.onbGhost} onClick={() => { setStage('sources') }}>{t('onb.back')}</button>
                <span className={css.onbSpacer} />
                <button type="button" className={css.onbGhost} onClick={() => { void finish() }}>{t('onb.skipGuide')}</button>
                <button type="button" className={css.onbPrimary} onClick={() => { void doImport() }}>{t('onb.importNow')}</button>
              </div>
            </>
          )}

          {stage === 'done' && (
            <>
              <div className={css.onbDone}>
                <span className={css.onbDoneMark}>🎉</span>
                <h2>{t('onb.doneTitle')}</h2>
                {t('onb.doneSub') !== '' && <p>{t('onb.doneSub')}</p>}
              </div>
              <div className={css.onbSummary}>
                <div><b>{summary.threads}</b><span>{t('onboard.conversations')}</span></div>
                <div><b>{summary.skills}</b><span>{t('onboard.skills')}</span></div>
                <div><b>{summary.prompts}</b><span>{t('onboard.prompts')}</span></div>
                <div><b>{summary.mcp}</b><span>{t('onboard.mcp')}</span></div>
              </div>
              <div className={css.onbFooter}>
                <span className={css.onbSpacer} />
                <button type="button" className={css.onbPrimary} onClick={() => { setStage('closed') }}>{t('onb.doneStart')}</button>
              </div>
            </>
          )}

          {stage === 'importing' && (
            <>
              <div className={css.onbHead}>
                <h2>{t('onb.importingTitle')}</h2>
                {t('onb.importingSub') !== '' && <p>{t('onb.importingSub')}</p>}
              </div>
              <div className={css.onbProgress}>
                {progress.map(row => (
                  <div key={row.id} className={css.onbProgressRow} data-status={row.status}>
                    <span className={css.onbProgressIcon}>
                      {row.status === 'done' ? '✓' : row.status === 'error' ? '!' : row.status === 'running' ? '◐' : '·'}
                    </span>
                    <span className={css.onbProgressLabel}>{row.label}</span>
                    <span className={css.onbProgressBar}><span className={css.onbProgressFill}
                      style={{ width: row.status === 'done' ? '100%' : row.status === 'running' ? '60%' : row.status === 'error' ? '100%' : '0%' }} /></span>
                  </div>
                ))}
              </div>
              {error !== null && <p className={css.bindError}>{error}</p>}
            </>
          )}
        </main>
      </div>
    </div>
  )

  async function doSsoDevice(): Promise<void> {
    if (ssoDeviceStart === undefined) return
    setBusy(true); setError(null)
    const r = await ssoDeviceStart(true)
    setBusy(false)
    if ('error' in r) {
      setError(r.error)
      return
    }
    setSsoSession(r)
    if (!r.browserOpened && typeof window !== 'undefined') {
      window.open(r.verificationUriComplete, '_blank', 'noopener,noreferrer')
    }
  }
}
