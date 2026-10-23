/** First-run onboarding — a large, flat, step-by-step wizard: welcome, login,
 * pick conversation sources, pick extras, watch the import, done. */
import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@xpeach/xph-client-ui-slots'
import type { XPeachOps, XPeachOnboardingScan } from './ops.ts'
import { XPeachMark as XPeachMarkInline } from './brand.tsx'
import { SITE } from './fmt.ts'
import css from './xpeach.module.css'

type Props = PropsRuntime<'shell.overlay'> & PropsLocale<'xpeach.account'> & InjectFace<XPeachOps>

type Stage = 'check' | 'welcome' | 'login' | 'sources' | 'extras' | 'importing' | 'done' | 'closed'
type StepId = 'welcome' | 'login' | 'sources' | 'extras' | 'done'
type Status = 'pending' | 'running' | 'done' | 'error'

interface ProgressItem { readonly id: string, readonly label: string, status: Status }

const STEPS: readonly StepId[] = ['welcome', 'login', 'sources', 'extras', 'done']

/**
 * Whether the desktop shell demands a bound token before the workspace opens.
 * @returns true when the boot handshake published the gate flag.
 */
function authGateRequired(): boolean {
  return (globalThis as { __XPH_AUTH_GATE__?: boolean }).__XPH_AUTH_GATE__ === true
}

/** Per-source presentation. */
const SOURCE_META: Record<string, { icon: string, key: string }> = {
  deepseek: { icon: '🍑', key: 'onb.src.deepseek' },
  claude: { icon: '✳️', key: 'onb.src.claude' },
  codex: { icon: '⬡', key: 'onb.src.codex' },
  zcode: { icon: '⚡', key: 'onb.src.zcode' },
  chatgpt: { icon: '💬', key: 'onb.src.chatgpt' },
}

export function XPeachOnboarding({ t, bind, sessionLogin, keyState, sessionBound, onboardingScan, importConversations, importAssets, onboardingDone, onboardingComplete }: Props): JSX.Element | null {
  const [stage, setStage] = useState<Stage>('check')
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scan, setScan] = useState<XPeachOnboardingScan | undefined>(undefined)
  const [picked, setPicked] = useState<readonly string[]>([])
  const [assets, setAssets] = useState({ mcp: true, skills: true, prompts: true })
  const [progress, setProgress] = useState<readonly ProgressItem[]>([])
  const [summary, setSummary] = useState({ threads: 0, skills: 0, prompts: 0, mcp: 0 })

  useEffect(() => {
    let live = true
    void onboardingDone().then(async done => {
      if (!live) return
      // A gated launch owns the screen even when onboarding was completed before:
      // the profile has no token, so there is nothing to enter.
      if (done.done && !authGateRequired()) { setStage('closed'); return }
      const r = await onboardingScan()
      if (!live) return
      if (!('error' in r)) {
        setScan(r)
        setPicked(r.sources.filter(source => source.found).map(source => source.id))
      }
      setStage('welcome')
    })
    return () => { live = false }
  }, [onboardingDone, onboardingScan])

  const sourceList = useMemo(() => scan?.sources.filter(source => source.found) ?? [], [scan])
  const hasAssets = (scan?.mcp.length ?? 0) + (scan?.skills.length ?? 0) + (scan?.prompts.length ?? 0) > 0

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
    const items: { id: string, label: string, run: () => Promise<void> }[] = []
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

  const stepIndex = stage === 'importing' ? STEPS.indexOf('extras') : STEPS.indexOf(stage as StepId)
  const rail = (
    <aside className={css.onbRail}>
      <div className={css.onbBrand}><XPeachMarkInline size={30} /><span>XPeach</span></div>
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
    <div className={css.onbBackdrop} data-gate={authGateRequired() ? 'true' : 'false'} role="dialog" aria-modal="true" aria-label={t('onb.welcomeTitle')}>
      <div className={css.onbShell}>
        {rail}
        <main className={css.onbMain}>
          {stage === 'welcome' && (
            <>
              <div className={css.onbHero}>
                <span className={css.onbHeroMark} aria-hidden="true">🍑</span>
                <div>
                  <h2>{t('onb.welcomeTitle')}</h2>
                  {t('onb.welcomeSub') !== '' && <p>{t('onb.welcomeSub')}</p>}
                </div>
              </div>
              <div className={css.onbFooter}>
                <button type="button" className={css.onbPrimary} onClick={() => { void goLoginOrSources() }}>{t('onb.start')}</button>
                {!authGateRequired() && <button type="button" className={css.onbGhost} onClick={() => { void finish() }}>{t('onb.skipGuide')}</button>}
              </div>
            </>
          )}

          {stage === 'login' && (
            <>
              <div className={css.onbHead}>
                <h2>{t('onb.loginTitle')}</h2>
                {t('onb.loginSub') !== '' && <p>{t('onb.loginSub')}</p>}
              </div>
              <div className={css.onbLoginCard}>
                <label className={css.onbLabel}>{t('onb.loginToken')}</label>
                <input className={css.bindInput} type="password" placeholder={t('bind.placeholder')}
                  value={key} onChange={e => { setKey(e.target.value) }}
                  onKeyDown={e => { if (e.key === 'Enter' && !busy) { void doBind() } }} />
                <p className={css.onbHint}><a href={SITE.accessToken} target="_blank" rel="noreferrer">{t('bind.getKey')}</a> · {t('onb.loginPrivacy')}</p>
                {error !== null && <p className={css.bindError}>{error}</p>}
              </div>
              <div className={css.onbFooter}>
                <button type="button" className={css.onbPrimary} disabled={busy || key.trim() === ''} onClick={() => { void doBind() }}>
                  {busy ? t('bind.working') : t('bind.submit')}
                </button>
                <button type="button" className={css.onbGhost} disabled={busy} onClick={() => { void doBrowser() }}>{t('onb.loginBrowser')}</button>
                {!authGateRequired() && <button type="button" className={css.onbGhost} disabled={busy} onClick={() => { setStage('sources') }}>{t('onb.loginLater')}</button>}
              </div>
            </>
          )}

          {stage === 'sources' && (
            <>
              <div className={css.onbHead}>
                <h2>{t('onb.sourcesTitle')}</h2>
                {t('onb.sourcesSub') !== '' && <p>{t('onb.sourcesSub')}</p>}
              </div>
              {sourceList.length === 0 ? (
                <div className={css.onbEmpty}><span>🍑</span><b>{t('onb.noneTitle')}</b>{t('onb.noneSub') !== '' && <p>{t('onb.noneSub')}</p>}</div>
              ) : (
                <div className={css.onbCards}>
                  {sourceList.map(source => {
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
                {hasAssets && <button type="button" className={css.onbPrimary} onClick={() => { setStage('extras') }}>{t('onb.next')}</button>}
                {!hasAssets && <button type="button" className={css.onbPrimary} disabled={picked.length === 0} onClick={() => { void doImport() }}>{t('onb.importNow')}</button>}
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

  async function doBind(): Promise<void> {
    setBusy(true); setError(null)
    const err = await bind(key.trim())
    setBusy(false)
    if (err !== null) { setError(err); return }
    setStage('sources')
  }

  async function doBrowser(): Promise<void> {
    setBusy(true); setError(null)
    const r = await sessionLogin()
    setBusy(false)
    if (!r.bound) { setError(r.error ?? 'login failed'); return }
    setStage('sources')
  }
}
