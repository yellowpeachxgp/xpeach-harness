/** Codex-style personal profile home: centered identity hero, unified 5-column
 * metric bar, featured works showcase, 52-week token activity heatmap, popular
 * plugins strip, and account insights. */
import { type JSX, useEffect, useMemo, useState } from 'react'
import { XPeachMark } from './brand.tsx'
import { openXPeachLoginModal } from './XPeachOnboarding.tsx'
import type { XPeachMacosInstallerStatus, XPeachOps, XPeachSelfLogRow, XPeachUserSelfRow } from './ops.ts'
import type { XPeachTabProps } from './XPeachTab.tsx'
import { quotaUsd, rel } from './fmt.ts'
import css from './xpeach.module.css'

type Props = {
  readonly t: XPeachTabProps['t']
  readonly userSelf: XPeachOps['userSelf']
  readonly userLogs: XPeachOps['userLogs']
  readonly userLogStat: XPeachOps['userLogStat']
  readonly recentSessions: XPeachOps['recentSessions']
  readonly openPlugins: XPeachOps['openPlugins']
  readonly macosInstallerStatus?: XPeachOps['macosInstallerStatus'] | undefined
  readonly macosInstallerAction?: XPeachOps['macosInstallerAction'] | undefined
  readonly onEditProfile?: (() => void) | undefined
}

const INSTALLER_STEPS = [
  'installer.step1',
  'installer.step2',
  'installer.step3',
  'installer.step4',
  'installer.step5',
] as const

/**
 * Render the macOS native `.pkg` guided installer and CLI management card.
 * @param props - locale translator and optional installer status/action operations.
 * @returns the macOS guided installer card element.
 */
export function MacosInstallerCard({
  t,
  macosInstallerStatus,
  macosInstallerAction,
}: {
  readonly t: XPeachTabProps['t']
  readonly macosInstallerStatus?: XPeachOps['macosInstallerStatus'] | undefined
  readonly macosInstallerAction?: XPeachOps['macosInstallerAction'] | undefined
}): JSX.Element | null {
  const [status, setStatus] = useState<XPeachMacosInstallerStatus | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verifyOutput, setVerifyOutput] = useState<string | null>(null)

  useEffect(() => {
    if (macosInstallerStatus === undefined) return
    let alive = true
    void macosInstallerStatus().then((res) => {
      if (alive && !('error' in res)) setStatus(res)
    })
    return () => { alive = false }
  }, [macosInstallerStatus])

  if (status !== undefined && !status.supported) return null

  const runAction = async (action: 'build' | 'open' | 'reveal' | 'install-direct'): Promise<void> => {
    if (macosInstallerAction === undefined || busy) return
    setBusy(true)
    setMessage(null)
    setError(null)
    const res = await macosInstallerAction(action)
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setStatus(res.status)
    if (!res.ok) setError(res.message)
    else setMessage(res.message)
    if (res.verifyOutput !== undefined && res.verifyOutput.length > 0) {
      setVerifyOutput(res.verifyOutput)
    }
  }

  const stepReady = status?.pkgExists === true || status?.appInstalled === true
  const cliInstalled = status?.xphCliInstalled === true

  return (
    <section className={css.profileBox}>
      <div className={css.profileBoxHead}>
        <span>{t('installer.title')}</span>
        <span className={css.profileMeta}>
          {status !== undefined ? `${status.version} · ${status.arch}` : ''}
        </span>
      </div>
      <p className={css.bindHint}>{t('installer.subtitle')}</p>
      <div className={css.installerSteps}>
        {INSTALLER_STEPS.map(stepKey => (
          <span key={stepKey} className={css.installerStep} data-ready={stepReady}>
            <i className={css.installerStepDot} aria-hidden="true" />
            <span>{t(stepKey)}</span>
          </span>
        ))}
      </div>
      <div className={css.installerGrid}>
        <div className={css.installerItem}>
          <div className={css.installerItemHead}>
            <span>{t('installer.appStatus')}</span>
            <span className={status?.appInstalled === true ? css.ctrlStatusOn : css.ctrlStatusOff}>
              {status?.appInstalled === true ? t('installer.installed') : t('installer.notInstalled')}
            </span>
          </div>
          <code className={css.installerPath}>{status?.appPath ?? '—'}</code>
        </div>
        <div className={css.installerItem}>
          <div className={css.installerItemHead}>
            <span>{t('installer.cliStatus')}</span>
            <span className={cliInstalled ? css.ctrlStatusOn : css.ctrlStatusOff}>
              {cliInstalled ? t('installer.installed') : t('installer.notInstalled')}
            </span>
          </div>
          <code className={css.installerPath}>{status?.xphCliPath ?? '—'}</code>
        </div>
        <div className={css.installerItem}>
          <div className={css.installerItemHead}>
            <span>{t('installer.pkgStatus')}</span>
            <span className={status?.pkgExists === true ? css.ctrlStatusOn : css.ctrlStatusOff}>
              {status?.pkgExists === true ? t('installer.pkgReady') : t('installer.pkgMissing')}
            </span>
          </div>
          <code className={css.installerPath}>{status?.pkgPath ?? '—'}</code>
        </div>
      </div>
      <div className={css.ctrlHeadActions}>
        <button
          type="button"
          className={css.bindButton}
          disabled={busy || macosInstallerAction === undefined}
          onClick={() => { void runAction('open') }}
        >
          {busy ? t('installer.working') : t('installer.openWizard')}
        </button>
        <button
          type="button"
          className={css.probeBtnOn}
          disabled={busy || macosInstallerAction === undefined}
          onClick={() => { void runAction('install-direct') }}
        >
          {t('installer.installDirect')}
        </button>
        <button
          type="button"
          className={css.probeBtn}
          disabled={busy || macosInstallerAction === undefined}
          onClick={() => { void runAction('build') }}
        >
          {t('installer.buildPkg')}
        </button>
        {status?.pkgExists === true && (
          <button
            type="button"
            className={css.bindGhost}
            disabled={busy || macosInstallerAction === undefined}
            onClick={() => { void runAction('reveal') }}
          >
            {t('installer.revealFinder')}
          </button>
        )}
      </div>
      {message !== null && <p className={css.ctrlBannerOk}>{message}</p>}
      {error !== null && <p className={css.bindError}>{error}</p>}
      {verifyOutput !== null && (
        <div className={css.installerVerifyBox}>
          <span className={css.profileMeta}>{t('installer.verifyTitle')}</span>
          <pre className={css.installerVerifyPre}>{verifyOutput}</pre>
        </div>
      )}
    </section>
  )
}

const WEEKS = 52
const CELLS = WEEKS * 7

type ActivityMode = 'daily' | 'weekly' | 'cumulative'

/** Local day key (YYYY-MM-DD) from a unix-seconds timestamp. */
function dayKey(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Consecutive active days ending today or yesterday. */
function streakOf(days: ReadonlySet<string>): number {
  let streak = 0
  const cursor = new Date()
  if (!days.has(dayKey(cursor.getTime() / 1000))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor.getTime() / 1000))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Longest consecutive active day streak across all recorded day keys. */
function longestStreakOf(days: ReadonlySet<string>, currentStreak: number): number {
  if (days.size === 0) return 0
  const sorted = [...days]
    .map(k => Math.floor(Date.parse(`${k}T00:00:00Z`) / 86_400_000))
    .filter(n => Number.isFinite(n))
    .sort((a, b) => a - b)
  let best = Math.max(1, currentStreak)
  let run = 1
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] === (sorted[i - 1] ?? 0) + 1) {
      run += 1
      if (run > best) best = run
    } else if (sorted[i] !== sorted[i - 1]) {
      run = 1
    }
  }
  return best
}

interface ProfileCacheSnapshot {
  readonly me?: XPeachUserSelfRow | undefined
  readonly logs?: readonly XPeachSelfLogRow[] | undefined
  readonly stat?: { readonly rpm: number; readonly tpm: number } | undefined
  readonly sessions?: readonly { readonly id: string; readonly cwd?: string; readonly updatedAt: number }[] | undefined
}

const PROFILE_CACHE_KEY = 'xpeach.profile.cache.v1'

function readProfileCache(): ProfileCacheSnapshot {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    if (raw !== null) {
      return JSON.parse(raw) as ProfileCacheSnapshot
    }
  } catch (_err) {
    // Ignore invalid cache
  }
  return {}
}

function writeProfileCache(patch: Partial<ProfileCacheSnapshot>): void {
  try {
    const prev = readProfileCache()
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ ...prev, ...patch }))
  } catch (_err) {
    // Ignore storage quota errors
  }
}

/**
 * Render the Codex-style personal profile home inside the XPeach console.
 * @param props - locale translator and account/session operations.
 * @returns the profile overview element.
 */
export function XPeachProfile({
  t,
  userSelf,
  userLogs,
  userLogStat,
  recentSessions,
  openPlugins,
  macosInstallerStatus,
  macosInstallerAction,
  onEditProfile,
}: Props): JSX.Element {
  const initialCache = useMemo(() => readProfileCache(), [])
  const [me, setMe] = useState<XPeachUserSelfRow | { error: string } | undefined>(initialCache.me)
  const [logs, setLogs] = useState<readonly XPeachSelfLogRow[]>(initialCache.logs ?? [])
  const [stat, setStat] = useState<{ rpm: number; tpm: number } | undefined>(initialCache.stat)
  const [sessions, setSessions] = useState<readonly { id: string; cwd?: string; updatedAt: number }[]>(initialCache.sessions ?? [])
  const [activityMode, setActivityMode] = useState<ActivityMode>('daily')
  const [isPrivate, setIsPrivate] = useState(false)
  const [copiedAction, setCopiedAction] = useState<'invite' | 'share' | null>(null)
  const [showInstaller, setShowInstaller] = useState(false)

  useEffect(() => {
    let alive = true
    const isAlive = (): boolean => alive
    void userSelf().then((r) => {
      if (!isAlive()) return
      setMe(r)
      if (!('error' in r)) writeProfileCache({ me: r })
    })
    void userLogStat().then((r) => {
      if (!isAlive() || 'error' in r) return
      const nextStat = { rpm: r.rpm, tpm: r.tpm }
      setStat(nextStat)
      writeProfileCache({ stat: nextStat })
    })
    void recentSessions().then((r) => {
      if (!isAlive() || 'error' in r) return
      setSessions(r)
      writeProfileCache({ sessions: r })
    })
    const loadPages = async (): Promise<void> => {
      const first = await userLogs(0, 100)
      if (!isAlive() || 'error' in first) return
      setLogs(first.items)
      writeProfileCache({ logs: first.items })
      if (first.items.length < 100) return
      const rest = await Promise.all([
        userLogs(1, 100).catch(() => ({ error: 'failed' as const })),
        userLogs(2, 100).catch(() => ({ error: 'failed' as const })),
        userLogs(3, 100).catch(() => ({ error: 'failed' as const })),
      ])
      if (!isAlive()) return
      const merged: XPeachSelfLogRow[] = [...first.items]
      for (const page of rest) {
        if ('error' in page) break
        merged.push(...page.items)
        if (page.items.length < 100) break
      }
      setLogs(merged)
      writeProfileCache({ logs: merged })
    }
    void loadPages()
    return () => { alive = false }
  }, [userSelf, userLogs, userLogStat, recentSessions])

  const stats = useMemo(() => {
    const perDay = new Map<string, number>()
    const perModel = new Map<string, { calls: number; tokens: number }>()
    let tokens = 0
    let longest = 0
    for (const row of logs) {
      const tok = row.prompt_tokens + row.completion_tokens
      tokens += tok
      const key = dayKey(row.created_at)
      perDay.set(key, (perDay.get(key) ?? 0) + tok)
      const name = row.model_name ?? t('profile.unknownModel')
      const agg = perModel.get(name) ?? { calls: 0, tokens: 0 }
      perModel.set(name, { calls: agg.calls + 1, tokens: agg.tokens + tok })
      longest = Math.max(longest, row.use_time)
    }
    const days = new Set(perDay.keys())
    const top = [...perModel.entries()].sort((a, b) => b[1].calls - a[1].calls).slice(0, 5)
    const maxDay = Math.max(...perDay.values(), 1)
    const streak = streakOf(days)
    const maxStreak = longestStreakOf(days, streak)
    return { perDay, days, tokens, longest, top, maxDay, streak, maxStreak }
  }, [logs, t])

  const meRow = me !== undefined && !('error' in me) ? me : undefined
  const error = me !== undefined && 'error' in me ? me.error : undefined

  const fmt = (n: number): string => n >= 1e8
    ? t('unit.yi', { n: (n / 1e8).toFixed(2) })
    : n >= 1e4 ? t('unit.wan', { n: (n / 1e4).toFixed(1) }) : String(n)

  const fmtDuration = (sec: number): string => {
    const safeSec = Math.max(0, Math.round(sec))
    if (safeSec >= 3600) {
      const h = Math.floor(safeSec / 3600)
      const m = Math.max(1, Math.round((safeSec % 3600) / 60))
      return t('profile.dur.hm', { h: String(h), m: String(m) })
    }
    if (safeSec >= 60) {
      const m = Math.floor(safeSec / 60)
      const s = safeSec % 60
      return t('profile.dur.ms', { m: String(m), s: String(s) })
    }
    return t('profile.dur.s', { s: String(safeSec) })
  }

  // Account-level total & peak tokens: combine sampled logs with all-time used_quota when present.
  const totalTokens = useMemo(() => {
    const quotaDerived = meRow?.used_quota !== undefined ? Math.round(meRow.used_quota * 0.45) : 0
    return Math.max(stats.tokens, quotaDerived)
  }, [meRow?.used_quota, stats.tokens])

  const peakTokens = useMemo(() => {
    if (totalTokens > stats.tokens && stats.tokens > 0) {
      const ratio = Math.min(totalTokens * 0.52, stats.maxDay * (totalTokens / stats.tokens))
      return Math.max(stats.maxDay, Math.round(ratio))
    }
    return stats.days.size > 0 ? stats.maxDay : 0
  }, [totalTokens, stats.tokens, stats.maxDay, stats.days.size])

  // 52 weeks × 7 days ending today, column-major.
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rawCells = Array.from({ length: CELLS }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (CELLS - 1 - i))
    const key = dayKey(d.getTime() / 1000)
    const value = stats.perDay.get(key) ?? 0
    return { key, value, weekIdx: Math.floor(i / 7) }
  })

  const cells = useMemo(() => {
    if (activityMode === 'weekly') {
      const weekTotals = new Array<number>(WEEKS).fill(0)
      for (const c of rawCells) {
        weekTotals[c.weekIdx] = (weekTotals[c.weekIdx] ?? 0) + c.value
      }
      const maxWeek = Math.max(...weekTotals, 1)
      return rawCells.map((c) => {
        const wVal = weekTotals[c.weekIdx] ?? 0
        const activeVal = c.value > 0 ? wVal : Math.floor(wVal * 0.35)
        const level = activeVal === 0 ? 0 : Math.min(4, 1 + Math.floor((activeVal / maxWeek) * 3.99))
        return { key: c.key, value: c.value, level }
      })
    }
    if (activityMode === 'cumulative') {
      let running = 0
      const cumValues = rawCells.map((c) => {
        running += c.value
        return running
      })
      const maxCum = Math.max(running, 1)
      return rawCells.map((c, idx) => {
        const cum = cumValues[idx] ?? 0
        const level = c.value === 0 ? 0 : Math.min(4, 1 + Math.floor((cum / maxCum) * 3.99))
        return { key: c.key, value: cum, level }
      })
    }
    return rawCells.map((c) => {
      const level = c.value === 0 ? 0 : Math.min(4, 1 + Math.floor((c.value / stats.maxDay) * 3.99))
      return { key: c.key, value: c.value, level }
    })
  }, [rawCells, activityMode, stats.maxDay])

  const monthLabels = useMemo(() => {
    const currentMonth = today.getMonth()
    return Array.from({ length: 12 }, (_, idx) => {
      const m = ((currentMonth + 1 + idx) % 12) + 1
      const key = `profile.month.${m as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}` as const
      return { id: `${idx}-${m}`, label: t(key) }
    })
  }, [t, today])

  const displayName = meRow?.display_name !== undefined && meRow.display_name !== ''
    ? meRow.display_name
    : (meRow?.username ?? t('profile.guest'))
  const handleText = meRow?.username !== undefined
    ? `@${isPrivate ? `${meRow.username.slice(0, 2)}***` : meRow.username}`
    : t('profile.defaultHandle')

  const copyText = (text: string, kind: 'invite' | 'share'): void => {
    try {
      void navigator.clipboard.writeText(text)
    } catch (_clipboardErr) {
      // Clipboard may be unavailable in non-interactive test environments.
    }
    setCopiedAction(kind)
    setTimeout(() => {
      setCopiedAction(prev => (prev === kind ? null : prev))
    }, 1800)
  }

  const fastModel = useMemo(() => {
    const found = stats.top.find(([name]) => /flash|mini|haiku|fast/i.test(name))
    return found !== undefined ? found[0] : undefined
  }, [stats.top])

  return (
    <div className={css.codexProfileWrap}>
      <section className={css.codexHeroCard}>
        <div className={css.codexTopBar}>
          <span className={css.profileMeta}>
            {stat !== undefined ? t('profile.rateSummary', { rpm: String(stat.rpm), tpm: fmt(stat.tpm) }).replace(/^ · /, '') : t('profile.featuredEyebrow')}
          </span>
          <div className={css.codexActionGroup}>
            {onEditProfile !== undefined && (
              <button type="button" className={css.codexGhostBtn} onClick={onEditProfile}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2l8.5-8.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{t('profile.act.edit')}</span>
              </button>
            )}
            <button
              type="button"
              className={css.codexGhostBtn}
              onClick={() => {
                const code = meRow?.aff_code ?? 'xpeach'
                copyText(`https://xpeach.codes/register?aff=${code}`, 'invite')
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6.5 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 13.5c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4M12.5 5.5v4M10.5 7.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{copiedAction === 'invite' ? t('profile.act.inviteCopied') : t('profile.act.invite')}</span>
            </button>
            <button
              type="button"
              className={css.codexGhostBtn}
              data-active={isPrivate}
              onClick={() => { setIsPrivate(v => !v) }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span>{isPrivate ? t('profile.act.private') : t('profile.act.public')}</span>
            </button>
            <button
              type="button"
              className={css.codexGhostBtn}
              onClick={() => {
                copyText(`${displayName} (${handleText}) · ${fmt(totalTokens)} tokens · XPeach Harness`, 'share')
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 10.5V2.5M8 2.5L5 5.5M8 2.5l3 3M3 10v2.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{copiedAction === 'share' ? t('profile.act.shared') : t('profile.act.share')}</span>
            </button>
          </div>
        </div>

        <div className={css.codexHero}>
          <div className={css.codexAvatar} aria-hidden="true">
            <XPeachMark size={38} />
          </div>
          <h2 className={css.codexName}>{displayName}</h2>
          <p className={css.codexHandle}>
            <span>{handleText}</span>
            {meRow?.group !== undefined && <span className={css.profileGroup}>{meRow.group}</span>}
            {meRow?.aff_code !== undefined && !isPrivate && (
              <span className={css.profileAff}>{t('profile.affTag', { code: meRow.aff_code })}</span>
            )}
          </p>
          {error !== undefined && (
            <div className={css.ssoCodeActions}>
              <p className={css.bindError}>{error}</p>
              <button type="button" className={css.codexGhostBtn} onClick={() => { openXPeachLoginModal(false) }}>
                <span>{t('launch.signIn')}</span>
              </button>
            </div>
          )}
        </div>

        <dl className={css.codexStatBar}>
          <div className={css.codexStatCell} title={`${t('profile.calls')}: ${fmt(meRow?.request_count ?? logs.length)}`}>
            <dd>{isPrivate ? '•••' : fmt(totalTokens)}</dd>
            <dt>{t('profile.stat.totalTokens')}</dt>
          </div>
          <div className={css.codexStatCell} title={`${t('profile.spent')}: ${quotaUsd(meRow?.used_quota ?? 0)}`}>
            <dd>{isPrivate ? '•••' : fmt(peakTokens)}</dd>
            <dt>{t('profile.stat.peakTokens')}</dt>
          </div>
          <div className={css.codexStatCell}>
            <dd>{fmtDuration(stats.longest)}</dd>
            <dt>{t('profile.stat.longestTask')}</dt>
          </div>
          <div className={css.codexStatCell}>
            <dd>{stats.maxStreak} {t('profile.daysUnit')}</dd>
            <dt>{t('profile.stat.longestStreak')}</dt>
          </div>
          <div className={css.codexStatCell}>
            <dd>{stats.streak} {t('profile.daysUnit')}</dd>
            <dt>{t('profile.stat.currentStreak')}</dt>
          </div>
        </dl>
      </section>

      <div className={css.codexColumn}>
        <section className={css.codexSection}>
          <div className={css.codexSectionHead}>
            <span className={css.codexSectionTitle}>{t('profile.activity')}</span>
            <div className={css.codexModeTabs} role="tablist">
              {([
                ['daily', 'profile.mode.daily'],
                ['weekly', 'profile.mode.weekly'],
                ['cumulative', 'profile.mode.cumulative'],
              ] as const).map(([mode, labelKey]) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={activityMode === mode}
                  className={activityMode === mode ? css.codexModeOn : css.codexModeOff}
                  onClick={() => { setActivityMode(mode) }}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div className={css.codexHeatmap} role="img" aria-label={t('profile.activity')}>
            {cells.map(c => (
              <span
                key={c.key}
                className={css.codexHeatCell}
                data-level={c.level}
                title={`${c.key} · ${t('unit.tok', { n: fmt(c.value) })}`}
              />
            ))}
          </div>
          <div className={css.codexMonthRow} aria-hidden="true">
            {monthLabels.map(m => (
              <span key={m.id}>{m.label}</span>
            ))}
          </div>
        </section>

        <div className={css.bentoSplitRow}>
          <section className={css.codexSection}>
            <div className={css.codexSectionHead}>
              <span className={css.codexSectionTitle}>{t('profile.featuredWorks')}</span>
            </div>
            <div className={css.codexWorksRow}>
              <div className={css.codexShowcaseFrame}>
                <div className={css.codexShowcaseInner}>
                  <div className={css.codexShowcaseEyebrow}>
                    <i className={css.codexShowcaseDot} aria-hidden="true" />
                    <span>{t('profile.featuredEyebrow')}</span>
                  </div>
                  <div className={css.codexShowcaseHeadline}>
                    <span>{t('profile.featuredTagline1')}</span>
                    <span>{t('profile.featuredTagline2')}</span>
                  </div>
                  <div className={css.codexShowcaseFoot}>
                    <span className={css.codexShowcaseBar}><i /></span>
                    <div className={css.codexShowcaseMeta}>
                      <span>{t('profile.featuredSite')}</span>
                      <b>🍑</b>
                    </div>
                  </div>
                </div>
              </div>
              {sessions.slice(0, 2).map((s) => {
                const name = s.cwd !== undefined ? s.cwd.split('/').filter(Boolean).pop() ?? s.cwd : s.id.slice(0, 8)
                return (
                  <div key={s.id} className={css.codexShowcaseFrame}>
                    <div className={css.codexShowcaseSession}>
                      <div className={css.codexShowcaseEyebrow}>
                        <i className={css.codexShowcaseDot} aria-hidden="true" />
                        <span>{t('profile.featuredWorkSub')}</span>
                      </div>
                      <strong className={css.codexSessionTitle}>{name}</strong>
                      <span className={css.profileMeta}>
                        {rel(Math.floor(s.updatedAt / 1000), t('time.justNow'), n => t('time.minAgo', { n }))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className={css.codexSection}>
            <div className={css.codexSectionHead}>
              <span className={css.codexSectionTitle}>{t('profile.insights')}</span>
              {stat !== undefined && (
                <span className={css.profileMeta}>
                  {t('profile.rateSummary', { rpm: String(stat.rpm), tpm: fmt(stat.tpm) }).replace(/^ · /, '')}
                </span>
              )}
            </div>
            <ul className={css.codexInsightList}>
              <li className={css.codexInsightRow}>
                <span className={css.codexInsightLabel}>{t('profile.quotaRowLabel')}</span>
                <span className={css.codexInsightValue}>
                  {isPrivate
                    ? '•••'
                    : t('profile.quotaRowValue', {
                      used: quotaUsd(meRow?.used_quota ?? 0),
                      left: quotaUsd(meRow?.quota ?? 0),
                    })}
                </span>
              </li>
              <li className={css.codexInsightRow}>
                <span className={css.codexInsightLabel}>{t('profile.calls')}</span>
                <span className={css.codexInsightValue}>{isPrivate ? '•••' : fmt(meRow?.request_count ?? logs.length)}</span>
              </li>
              <li className={css.codexInsightRow}>
                <span className={css.codexInsightLabel}>{t('profile.fastMode')}</span>
                <span className={css.codexInsightValue}>{fastModel ?? t('profile.fastModeUnused')}</span>
              </li>
              {stats.top.slice(0, 4).map(([name, agg]) => (
                <li key={name} className={css.codexInsightRow}>
                  <span className={css.codexInsightModel}>{name}</span>
                  <span className={css.codexInsightValue}>
                    {t('profile.modelMeta', { calls: String(agg.calls), tokens: fmt(agg.tokens) })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className={css.codexSection}>
          <div className={css.codexSectionHead}>
            <span className={css.codexSectionTitle}>{t('profile.popularPlugins')}</span>
            <button type="button" className={css.codexGhostBtn} onClick={openPlugins}>
              <span>{t('profile.openPlugins')}</span>
            </button>
          </div>
          <div className={css.codexPluginRow}>
            <button type="button" className={css.codexPluginTile} onClick={openPlugins} title={t('profile.plugin.relay')} aria-label={t('profile.plugin.relay')}>
              <XPeachMark size={20} />
              <span className={css.codexPluginLabel}>{t('profile.plugin.relay')}</span>
            </button>
            <button type="button" className={css.codexPluginTile} data-tone="amber" onClick={openPlugins} title={t('profile.plugin.skills')} aria-label={t('profile.plugin.skills')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2.5l1.9 4.6 4.6 1.9-4.6 1.9L10 15.5l-1.9-4.6-4.6-1.9 4.6-1.9L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className={css.codexPluginLabel}>{t('profile.plugin.skills')}</span>
            </button>
            <button type="button" className={css.codexPluginTile} data-tone="blue" onClick={openPlugins} title={t('profile.plugin.mcp')} aria-label={t('profile.plugin.mcp')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="14" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="14" r="2.2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7.8 7.2L9 12M12.2 7.2L11 12M8.2 6h3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className={css.codexPluginLabel}>{t('profile.plugin.mcp')}</span>
            </button>
            <button type="button" className={css.codexPluginTile} data-tone="clay" onClick={openPlugins} title={t('profile.plugin.claude')} aria-label={t('profile.plugin.claude')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 3v14M3 10h14M5.1 5.1l9.8 9.8M14.9 5.1l-9.8 9.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className={css.codexPluginLabel}>{t('profile.plugin.claude')}</span>
            </button>
            <button type="button" className={css.codexPluginTile} data-tone="green" onClick={openPlugins} title={t('profile.plugin.codex')} aria-label={t('profile.plugin.codex')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6.5 8l2.5 2-2.5 2M10.5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={css.codexPluginLabel}>{t('profile.plugin.codex')}</span>
            </button>
            <button type="button" className={css.codexPluginTile} data-tone="sky" onClick={openPlugins} title={t('profile.plugin.gemini')} aria-label={t('profile.plugin.gemini')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2.5C10 6.6 13.4 10 17.5 10 13.4 10 10 13.4 10 17.5 10 13.4 6.6 10 2.5 10 6.6 10 10 6.6 10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className={css.codexPluginLabel}>{t('profile.plugin.gemini')}</span>
            </button>
            <button type="button" className={css.codexPluginTile} data-tone="violet" onClick={openPlugins} title={t('profile.plugin.deepseek')} aria-label={t('profile.plugin.deepseek')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7.5 6L4 10l3.5 4M12.5 6L16 10l-3.5 4M11 5l-2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={css.codexPluginLabel}>{t('profile.plugin.deepseek')}</span>
            </button>
            <button type="button" className={css.codexPluginTile} data-tone="rose" onClick={openPlugins} title={t('profile.plugin.git')} aria-label={t('profile.plugin.git')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="6.5" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="6.5" cy="14.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="13.5" cy="8.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6.5 7.3v5.4M13.5 10.3c0 2-1.5 2.5-4 2.5h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className={css.codexPluginLabel}>{t('profile.plugin.git')}</span>
            </button>
            <button type="button" className={css.codexPluginTile} data-tone="gold" onClick={openPlugins} title={t('profile.plugin.browser')} aria-label={t('profile.plugin.browser')}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="6.8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3.5 10h13M10 3.2c2 2 2 11.6 0 13.6M10 3.2c-2 2-2 11.6 0 13.6" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              <span className={css.codexPluginLabel}>{t('profile.plugin.browser')}</span>
            </button>
          </div>
        </section>

        {macosInstallerStatus !== undefined && (
          <div className={css.codexInstallerWrap}>
            <button
              type="button"
              className={css.codexInstallerToggle}
              aria-expanded={showInstaller}
              onClick={() => { setShowInstaller(v => !v) }}
            >
              <span>{t('profile.installerToggle')}</span>
              <svg
                className={showInstaller ? css.expandOn : css.expandOff}
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showInstaller && (
              <MacosInstallerCard
                t={t}
                macosInstallerStatus={macosInstallerStatus}
                macosInstallerAction={macosInstallerAction}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
