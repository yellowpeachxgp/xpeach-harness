/**
 * First-run onboarding and unified 1-click XPeach SSO sign-in modal:
 * welcome, OAuth 2.0 + PKCE S256 browser login, local conversation migration,
 * skills/MCP/prompts import, and completion summary.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { JSX } from 'react'
import { useModalLayer } from '@xpeach/xph-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type {
  XPeachOnboardingScan,
  XPeachOps,
} from './ops.ts'
import type { XPeachKey } from './locales.ts'
import { XPeachMark as XPeachMarkInline } from './brand.tsx'
import css from './xpeach.module.css'

/** Props injected into the XPeach onboarding & unified SSO sign-in overlay. */
export type XPeachOnboardingProps = PropsLocale<'xpeach.account'> & InjectFace<Pick<
  XPeachOps,
  | 'ssoBrowserStart'
  | 'ssoBrowserPoll'
  | 'ssoBrowserCancel'
  | 'ssoDeviceStart'
  | 'ssoDevicePoll'
  | 'subscribeCredentialChange'
  | 'subscribeSessionExpired'
  | 'subscribeModelSignInRequired'
  | 'keyState'
  | 'sessionBound'
  | 'onboardingScan'
  | 'importConversations'
  | 'importAssets'
  | 'onboardingDone'
  | 'onboardingComplete'
>>

type Stage = 'check' | 'welcome' | 'login' | 'sources' | 'extras' | 'importing' | 'done' | 'closed'
type StepId = 'welcome' | 'login' | 'sources' | 'extras' | 'done'
type Status = 'pending' | 'running' | 'done' | 'error'

interface ProgressItem {
  readonly id: string
  readonly itemLabel: string
  status: Status
}

interface PendingSsoAttempt {
  readonly attemptId: string
  readonly mode: 'pkce' | 'device'
  readonly authorizationUrl: string
  readonly interval: number
  readonly deviceCode?: string | undefined
  readonly userCode?: string | undefined
}

const STEPS: readonly StepId[] = ['welcome', 'login', 'sources', 'extras', 'done']

type LoginModalListener = (autoStartSso: boolean) => void
const loginModalListeners = new Set<LoginModalListener>()

/**
 * Open the XPeach SSO login modal overlay from any client UI surface.
 * @param autoStartSso - when true, immediately initiates 1-click SSO sign-in.
 */
export function openXPeachLoginModal(autoStartSso = false): void {
  for (const listener of loginModalListeners) {
    listener(autoStartSso)
  }
}

/**
 * Whether the desktop shell demands a bound session before the workspace opens.
 * @returns true when the boot handshake published the gate flag.
 */
function authGateRequired(): boolean {
  return (globalThis as { __XPH_AUTH_GATE__?: boolean }).__XPH_AUTH_GATE__ === true
}

/** Per-source presentation metadata for local conversation stores. */
export const SOURCE_META: Record<string, { icon: string; key: string; labelKey?: XPeachKey }> = {
  deepseek: { icon: '◆', key: 'onb.src.deepseek', labelKey: 'onb.src.deepseekLabel' },
  claude: { icon: '✳️', key: 'onb.src.claude', labelKey: 'onb.src.claudeLabel' },
  codex: { icon: '⬡', key: 'onb.src.codex', labelKey: 'onb.src.codexLabel' },
  zcode: { icon: '⚡', key: 'onb.src.zcode', labelKey: 'onb.src.zcodeLabel' },
  chatgpt: { icon: '💬', key: 'onb.src.chatgpt', labelKey: 'onb.src.chatgptLabel' },
  gemini: { icon: '✦', key: 'onb.src.gemini', labelKey: 'onb.src.geminiLabel' },
  antigravity: { icon: '🚀', key: 'onb.src.antigravity', labelKey: 'onb.src.antigravityLabel' },
}

/**
 * Render the first-run onboarding wizard and unified 1-click SSO sign-in overlay.
 * @param props - locale translator and injected XPeach operations.
 * @returns the modal element, or null when closed.
 */
export function XPeachOnboarding({
  t,
  ssoBrowserStart,
  ssoBrowserPoll,
  ssoBrowserCancel,
  ssoDeviceStart,
  ssoDevicePoll,
  subscribeCredentialChange,
  subscribeSessionExpired,
  subscribeModelSignInRequired,
  keyState,
  sessionBound,
  onboardingScan,
  importConversations,
  importAssets,
  onboardingDone,
  onboardingComplete,
}: XPeachOnboardingProps): JSX.Element | null {
  const [stage, setStage] = useState<Stage>('check')
  const [standaloneLogin, setStandaloneLogin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ssoPending, setSsoPending] = useState<PendingSsoAttempt | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [scan, setScan] = useState<XPeachOnboardingScan | undefined>(undefined)
  const [picked, setPicked] = useState<readonly string[]>([])
  const [assets, setAssets] = useState({ mcp: true, skills: true, prompts: true })
  const [progress, setProgress] = useState<readonly ProgressItem[]>([])
  const [summary, setSummary] = useState({ threads: 0, skills: 0, prompts: 0, mcp: 0 })
  const shellRef = useRef<HTMLDivElement | null>(null)

  const startUnifiedSso = useCallback(async (): Promise<void> => {
    setBusy(true)
    setError(null)
    if (ssoBrowserStart !== undefined) {
      const r = await ssoBrowserStart(true)
      setBusy(false)
      if ('error' in r) {
        setError(r.error)
        return
      }
      setSsoPending({
        attemptId: r.attemptId,
        mode: r.mode,
        authorizationUrl: r.authorizationUrl,
        interval: r.interval,
        ...(r.deviceCode !== undefined ? { deviceCode: r.deviceCode } : {}),
        ...(r.userCode !== undefined ? { userCode: r.userCode } : {}),
      })
      if (!r.browserOpened && typeof window !== 'undefined') {
        window.open(r.authorizationUrl, '_blank', 'noopener,noreferrer')
      }
      return
    }
    if (ssoDeviceStart !== undefined) {
      const r = await ssoDeviceStart(true)
      setBusy(false)
      if ('error' in r) {
        setError(r.error)
        return
      }
      setSsoPending({
        attemptId: r.deviceCode,
        mode: 'device',
        authorizationUrl: r.verificationUriComplete,
        interval: r.interval,
        deviceCode: r.deviceCode,
        userCode: r.userCode,
      })
      if (!r.browserOpened && typeof window !== 'undefined') {
        window.open(r.verificationUriComplete, '_blank', 'noopener,noreferrer')
      }
      return
    }
    setBusy(false)
  }, [ssoBrowserStart, ssoDeviceStart])

  const cancelPendingSso = useCallback((): void => {
    if (ssoPending !== null && ssoPending.mode === 'pkce') {
      void ssoBrowserCancel?.(ssoPending.attemptId)
    }
    setSsoPending(null)
  }, [ssoPending, ssoBrowserCancel])

  useEffect(() => {
    const onOpenModal: LoginModalListener = (autoStartSso) => {
      setStandaloneLogin(true)
      setError(null)
      setStage('login')
      if (autoStartSso) {
        void startUnifiedSso()
      }
    }
    loginModalListeners.add(onOpenModal)
    return () => {
      loginModalListeners.delete(onOpenModal)
    }
  }, [startUnifiedSso])

  useEffect(() => {
    const offExpired = subscribeSessionExpired?.(() => {
      setStandaloneLogin(true)
      setSsoPending(null)
      setError(t('sso.sessionRevokedNotice'))
      setStage('login')
    })
    const offModelSignIn = subscribeModelSignInRequired?.(() => {
      setStandaloneLogin(true)
      setSsoPending(null)
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
          setSsoPending(null)
          setStage('login')
          return
        }
        try { localStorage.setItem('xpeach.onboarding.done', '1') } catch (_err) { /* ignore storage quota */ }
        ;(globalThis as { __XPH_AUTH_GATE__?: boolean }).__XPH_AUTH_GATE__ = false
        setSsoPending(null)
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
    if (stage !== 'login' || ssoPending === null) return
    const runPoll = ssoBrowserPoll !== undefined
      ? () => ssoBrowserPoll(ssoPending.attemptId, ssoPending.deviceCode)
      : ssoPending.deviceCode !== undefined && ssoDevicePoll !== undefined
        ? () => ssoDevicePoll(ssoPending.deviceCode ?? '')
        : undefined
    if (runPoll === undefined) return

    let active = true
    let inFlight = false
    const intervalMs = Math.max(1200, (ssoPending.interval || 1) * 1000)
    const timer = setInterval(() => {
      if (inFlight) return
      inFlight = true
      void runPoll().then((res) => {
        inFlight = false
        if (!active) return
        if ('error' in res) {
          setError(res.error)
          setSsoPending(null)
          return
        }
        if (res.status === 'approved') {
          setSsoPending(null)
          setError(null)
          try { localStorage.setItem('xpeach.onboarding.done', '1') } catch (_err) { /* ignore storage quota */ }
          ;(globalThis as { __XPH_AUTH_GATE__?: boolean }).__XPH_AUTH_GATE__ = false
          void onboardingComplete()
          setStage(standaloneLogin ? 'closed' : 'sources')
        } else if (res.status === 'expired') {
          setError(res.message ?? t('sso.expired'))
          setSsoPending(null)
        } else if (res.status === 'denied') {
          setError(res.message ?? t('sso.denied'))
          setSsoPending(null)
        } else if (res.status === 'error') {
          setError(res.message ?? t('sso.failed'))
          setSsoPending(null)
        }
      }).catch(() => {
        inFlight = false
      })
    }, intervalMs)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [stage, ssoPending, ssoBrowserPoll, ssoDevicePoll, onboardingComplete, standaloneLogin, t])

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

  const dismissModal = async (): Promise<void> => {
    if (ssoPending !== null && ssoPending.mode === 'pkce') {
      void ssoBrowserCancel?.(ssoPending.attemptId)
    }
    ;(globalThis as { __XPH_AUTH_GATE__?: boolean }).__XPH_AUTH_GATE__ = false
    try {
      localStorage.setItem('xpeach.onboarding.done', '1')
    } catch (_storageUnavailable) {
      // Storage access is optional when sandboxed.
    }
    setStandaloneLogin(false)
    setSsoPending(null)
    await onboardingComplete()
    setStage('closed')
  }

  const doImport = async (): Promise<void> => {
    setStage('importing')
    setError(null)
    const items: { id: string; itemLabel: string; run: () => Promise<void> }[] = []
    for (const id of picked) {
      const meta = SOURCE_META[id]
      items.push({
        id: 'src-' + id,
        itemLabel: meta === undefined ? id : t(meta.key as never),
        run: async () => {
          const r = await importConversations([id])
          if ('error' in r) throw new Error(r.error)
          setSummary(prev => ({ ...prev, threads: prev.threads + r.reduce((sum, item) => sum + item.imported, 0) }))
          const srcErr = r.find(item => Boolean(item.error))?.error
          if (srcErr !== undefined && srcErr !== '') throw new Error(srcErr)
        },
      })
    }
    if (assets.skills) items.push({
      id: 'skills', itemLabel: t('onboard.skills'),
      run: async () => {
        const r = await importAssets({ mcp: false, skills: true, prompts: false })
        if ('error' in r) throw new Error(r.error)
        setSummary(prev => ({ ...prev, skills: prev.skills + r.skills }))
        if (Array.isArray(r.errors) && r.errors.length > 0) throw new Error(r.errors.join('; '))
      },
    })
    if (assets.prompts) items.push({
      id: 'prompts', itemLabel: t('onboard.prompts'),
      run: async () => {
        const r = await importAssets({ mcp: false, skills: false, prompts: true })
        if ('error' in r) throw new Error(r.error)
        setSummary(prev => ({ ...prev, prompts: prev.prompts + r.prompts }))
        if (Array.isArray(r.errors) && r.errors.length > 0) throw new Error(r.errors.join('; '))
      },
    })
    if (assets.mcp) items.push({
      id: 'mcp', itemLabel: t('onboard.mcp'),
      run: async () => {
        const r = await importAssets({ mcp: true, skills: false, prompts: false })
        if ('error' in r) throw new Error(r.error)
        setSummary(prev => ({ ...prev, mcp: prev.mcp + r.mcp }))
        if (Array.isArray(r.errors) && r.errors.length > 0) throw new Error(r.errors.join('; '))
      },
    })
    setProgress(items.map(item => ({ id: item.id, itemLabel: item.itemLabel, status: 'pending' })))
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

  const isModalOpen = stage !== 'check' && stage !== 'closed'
  const gated = authGateRequired()
  useModalLayer(shellRef, isModalOpen, () => {
    if (!busy && stage !== 'importing' && !gated) {
      void dismissModal()
    }
  })

  if (!isModalOpen) return null

  const stepIndex = stage === 'importing' ? STEPS.indexOf('extras') : STEPS.indexOf(stage)
  const rail = (
    <aside className={css.onbRail}>
      <div className={css.onbBrand}>
        <XPeachMarkInline size={28} />
        <span>{t('brand.title')}</span>
      </div>
      <ol className={css.onbSteps}>
        {STEPS.map((step, index) => (
          <li key={step} className={css.onbStep} data-on={index <= stepIndex}>
            <span className={css.onbStepDot}>
              {index < stepIndex ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M2.2 6.2L5 9l4.8-5.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : String(index + 1)}
            </span>
            <span>{t(('onb.step.' + step) as never)}</span>
          </li>
        ))}
      </ol>
      {t('onb.privacy') !== '' && <p className={css.onbPrivacy}>{t('onb.privacy')}</p>}
    </aside>
  )

  const isGate = (stage === 'welcome' || stage === 'login' || gated) ? 'true' : 'false'
  const hasSsoCapability = ssoBrowserStart !== undefined || ssoDeviceStart !== undefined

  const modal = (
    <div className={css.onbBackdrop} data-gate={isGate} role="presentation">
      <div
        ref={shellRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('onb.welcomeTitle')}
        className={css.onbShell}
        data-gate={isGate}
        data-standalone={standaloneLogin ? 'true' : 'false'}
      >
        {!standaloneLogin && rail}
        <main className={css.onbMain}>
          {!gated && (
            <button
              type="button"
              className={css.onbCloseBtn}
              aria-label={t('onb.skipGuide')}
              onClick={() => { void dismissModal() }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {stage === 'welcome' && (
            <>
              <div className={css.onbHero}>
                <div className={css.ssoBrandBadge}>
                  <XPeachMarkInline size={30} />
                </div>
                <div className={css.onbHead}>
                  <h2>{t('onb.welcomeTitle')}</h2>
                  {t('onb.welcomeSub') !== '' && <p>{t('onb.welcomeSub')}</p>}
                </div>
              </div>

              <div className={css.onbFeatureGrid}>
                <div className={css.onbFeatureItem}>
                  <span className={css.onbFeatureIcon} aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2.5" y="3" width="11" height="10" rx="2" />
                      <path d="M5.5 6.5h5M5.5 9.5h3.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className={css.onbFeatureTitle}>{t('onb.featureLocal')}</span>
                  <span className={css.onbFeatureDesc}>{t('onb.featureLocalDesc')}</span>
                </div>

                <div className={css.onbFeatureItem}>
                  <span className={css.onbFeatureIcon} aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 2.2l4.8 2v3.6c0 3.1-2 5.2-4.8 6.2-2.8-1-4.8-3.1-4.8-6.2V4.2L8 2.2z" strokeLinejoin="round" />
                      <path d="M5.8 8.1l1.5 1.5 3-3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className={css.onbFeatureTitle}>{t('onb.featureSafe')}</span>
                  <span className={css.onbFeatureDesc}>{t('onb.featureSafeDesc')}</span>
                </div>

                <div className={css.onbFeatureItem}>
                  <span className={css.onbFeatureIcon} aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 2L4 9h4l-1 5 5-7H8l1-5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className={css.onbFeatureTitle}>{t('onb.featureFast')}</span>
                  <span className={css.onbFeatureDesc}>{t('onb.featureFastDesc')}</span>
                </div>
              </div>

              <div className={css.onbFooter}>
                {!gated && (
                  <button type="button" className={css.onbGhost} onClick={() => { void dismissModal() }}>
                    {t('onb.skipGuide')}
                  </button>
                )}
                <span className={css.onbSpacer} />
                <button type="button" className={css.onbPrimary} onClick={() => { void goLoginOrSources() }}>
                  {t('onb.start')}
                </button>
              </div>
            </>
          )}

          {stage === 'login' && (
            <>
              <div className={css.ssoHeroWrap}>
                <div className={css.ssoHeroCard}>
                  <div className={css.ssoBrandBadge}>
                    <XPeachMarkInline size={30} />
                  </div>
                  <span className={css.ssoEyebrow}>{t('sso.cardEyebrow')}</span>
                  <h2 className={css.ssoCardTitle}>{t('onb.loginTitle')}</h2>
                  <p className={css.ssoCardDesc}>{t('sso.cardDesc')}</p>

                  <div className={css.ssoPillsRow}>
                    <span className={css.ssoFeaturePill}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M2.2 6.2L5 9l4.8-5.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t('sso.pillPkce')}
                    </span>
                    <span className={css.ssoFeaturePill}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M2.2 6.2L5 9l4.8-5.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t('sso.pillSync')}
                    </span>
                    <span className={css.ssoFeaturePill}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M2.2 6.2L5 9l4.8-5.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t('sso.pillRefresh')}
                    </span>
                  </div>

                  {ssoPending === null ? (
                    hasSsoCapability && (
                      <button
                        type="button"
                        className={css.ssoPrimaryCta}
                        disabled={busy}
                        onClick={() => { void startUnifiedSso() }}
                      >
                        <span>{busy ? t('sso.starting') : t('sso.loginBtn')}</span>
                        {!busy && (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                            <path d="M6 4h6v6M12 4L4.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    )
                  ) : (
                    <div className={css.ssoWaitingBox}>
                      <div className={css.ssoWaitingTitleRow}>
                        <span className={css.ssoPulseDot} aria-hidden="true" />
                        <span>{t('sso.waitingTitle')}</span>
                      </div>

                      {ssoPending.mode === 'device' && ssoPending.userCode !== undefined && (
                        <div className={css.ssoCodeActions}>
                          <code className={css.ssoCodeValue}>{ssoPending.userCode}</code>
                          <button
                            type="button"
                            className={css.marketBtn}
                            onClick={() => {
                              void navigator.clipboard.writeText(ssoPending.userCode ?? '')
                              setCodeCopied(true)
                              setTimeout(() => { setCodeCopied(false) }, 2000)
                            }}
                          >
                            {codeCopied ? t('sso.codeCopied') : t('sso.copyCode')}
                          </button>
                        </div>
                      )}

                      <p className={css.ssoCodeHint}>{t('sso.pollingHint')}</p>

                      <div className={css.ssoWaitingActions}>
                        <a
                          href={ssoPending.authorizationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`${css.marketBtn} ${css.ssoLinkBtn}`}
                        >
                          {t('sso.openBrowserAgain')}
                        </a>
                        <button
                          type="button"
                          className={css.marketBtn}
                          onClick={() => {
                            void navigator.clipboard.writeText(ssoPending.authorizationUrl)
                            setLinkCopied(true)
                            setTimeout(() => { setLinkCopied(false) }, 2000)
                          }}
                        >
                          {linkCopied ? t('sso.linkCopied') : t('sso.copyLink')}
                        </button>
                        <button
                          type="button"
                          className={css.marketBtn}
                          onClick={cancelPendingSso}
                        >
                          {t('sso.cancel')}
                        </button>
                      </div>
                    </div>
                  )}

                  {error !== null && <p role="alert" className={css.bindError}>{error}</p>}
                </div>
              </div>

              {!gated && (
                <div className={css.onbFooter}>
                  <span className={css.onbSpacer} />
                  <button type="button" className={css.onbGhost} onClick={() => { void dismissModal() }}>
                    {t('onb.loginLater')}
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
                      <button
                        key={source.id}
                        type="button"
                        className={css.onbCard}
                        data-on={on}
                        onClick={() => { setPicked(prev => on ? prev.filter(id => id !== source.id) : [...prev, source.id]) }}
                      >
                        <span className={css.onbCardIcon}>{meta.icon}</span>
                        <span className={css.onbCardBody}>
                          <span className={css.onbCardTitle}>{meta.labelKey !== undefined ? t(meta.labelKey) : source.label}</span>
                          <span className={css.onbCardDesc}>{t(meta.key as never)}</span>
                          <span className={css.onbCardCount}>{t('onboard.threads', { n: String(source.threads) })}</span>
                        </span>
                        <span className={css.onbCheck} data-on={on}>
                          {on && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M2.2 6.2L5 9l4.8-5.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className={css.onbFooter}>
                <button type="button" className={css.onbGhost} onClick={() => { setPicked(sourceList.map(source => source.id)) }}>{t('onb.selectAll')}</button>
                <button type="button" className={css.onbGhost} onClick={() => { setPicked([]) }}>{t('onb.clearAll')}</button>
                <span className={css.onbSpacer} />
                {sourceList.length > 0 && <span className={css.onbHint}>{`${String(picked.length)} / ${String(sourceList.length)}`}</span>}
                <button type="button" className={css.onbGhost} onClick={() => { void finish() }}>{t('onb.skipGuide')}</button>
                {hasAssets && <button type="button" className={css.onbPrimary} onClick={() => { setStage('extras') }}>{t('onb.next')}</button>}
                {!hasAssets && (sourceList.length === 0 || scan === undefined
                  ? <button type="button" className={css.onbPrimary} disabled={scan === undefined} onClick={() => { setStage('extras') }}>{t('onb.next')}</button>
                  : picked.length === 0
                    ? <button type="button" className={css.onbPrimary} onClick={() => { void finish() }}>{t('onb.next')}</button>
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
                ] as const).map(([id, icon, titleKey, descKey, count]) => {
                  const on = assets[id]
                  return (
                    <button
                      key={id}
                      type="button"
                      className={css.onbCard}
                      data-on={on}
                      onClick={() => { setAssets(prev => ({ ...prev, [id]: !prev[id] })) }}
                    >
                      <span className={css.onbCardIcon}>{icon}</span>
                      <span className={css.onbCardBody}>
                        <span className={css.onbCardTitle}>{t(titleKey)}</span>
                        <span className={css.onbCardDesc}>{t(descKey)}</span>
                        <span className={css.onbCardCount}>{String(count)}</span>
                      </span>
                      <span className={css.onbCheck} data-on={on}>
                        {on && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M2.2 6.2L5 9l4.8-5.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
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
                <span className={css.onbDoneMark} aria-hidden="true">🎉</span>
                <h2>{t('onb.doneTitle')}</h2>
                {t('onb.doneSub') !== '' && <p>{t('onb.doneSub')}</p>}
              </div>
              <div className={css.onbSummary}>
                <div><b>{String(summary.threads)}</b><span>{t('onboard.conversations')}</span></div>
                <div><b>{String(summary.skills)}</b><span>{t('onboard.skills')}</span></div>
                <div><b>{String(summary.prompts)}</b><span>{t('onboard.prompts')}</span></div>
                <div><b>{String(summary.mcp)}</b><span>{t('onboard.mcp')}</span></div>
              </div>
              {error !== null && <p className={css.bindError}>{error}</p>}
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
                    <span className={css.onbProgressIcon} aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                        {row.status === 'done' ? (
                          <path d="M2.2 6.2L5 9l4.8-5.5" strokeLinecap="round" strokeLinejoin="round" />
                        ) : row.status === 'error' ? (
                          <path d="M6 2.5v4.2M6 9.2v.4" strokeLinecap="round" />
                        ) : (
                          <circle cx="6" cy="6" r="3.5" />
                        )}
                      </svg>
                    </span>
                    <span className={css.onbProgressLabel}>{row.itemLabel}</span>
                    <span className={css.onbProgressBar}>
                      <span
                        className={css.onbProgressFill}
                        style={{ width: row.status === 'done' || row.status === 'error' ? '100%' : row.status === 'running' ? '60%' : '0%' }}
                      />
                    </span>
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

  return typeof document !== 'undefined'
    ? createPortal(modal, document.body)
    : modal
}
