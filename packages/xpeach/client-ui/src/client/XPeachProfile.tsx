/** Codex-style profile home: the Access Token is the login state, so the
 * page renders the site account itself — identity, quota, token activity
 * heatmap, top models, and the latest calls. */
import { type JSX, useEffect, useMemo, useState } from 'react'
import { XPeachMark } from './brand.tsx'
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
  const cliInstalled = status?.xphCliInstalled === true && status.dshCliInstalled

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

const WEEKS = 26
const CELLS = WEEKS * 7

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

/**
 * Render the overview profile home inside the XPeach console.
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
}: Props): JSX.Element {
  const [me, setMe] = useState<XPeachUserSelfRow | { error: string } | undefined>(undefined)
  const [logs, setLogs] = useState<readonly XPeachSelfLogRow[]>([])
  const [stat, setStat] = useState<{ rpm: number; tpm: number } | undefined>(undefined)
  const [sessions, setSessions] = useState<readonly { id: string; cwd?: string; updatedAt: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void userSelf().then((r) => { if (alive) setMe(r) })
    void userLogStat().then((r) => { if (alive && !('error' in r)) setStat({ rpm: r.rpm, tpm: r.tpm }) })
    void recentSessions().then((r) => { if (alive && !('error' in r)) setSessions(r) })
    const loadPages = async (): Promise<void> => {
      const all: XPeachSelfLogRow[] = []
      for (let page = 0; page < 6; page += 1) {
        const chunk = await userLogs(page, 100)
        if ('error' in chunk) break
        all.push(...chunk.items)
        if (chunk.items.length < 100) break
      }
      if (alive) { setLogs(all); setLoading(false) }
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
    return { perDay, days, tokens, longest, top, maxDay, streak: streakOf(days) }
  }, [logs, t])

  const meRow = me !== undefined && !('error' in me) ? me : undefined
  const error = me !== undefined && 'error' in me ? me.error : undefined

  // 26 weeks × 7 days ending today, column-major.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cells = Array.from({ length: CELLS }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (CELLS - 1 - i))
    const key = dayKey(d.getTime() / 1000)
    const value = stats.perDay.get(key) ?? 0
    const level = value === 0 ? 0 : Math.min(4, 1 + Math.floor((value / stats.maxDay) * 3.99))
    return { key, value, level }
  })

  const fmt = (n: number): string => n >= 1e8
    ? t('unit.yi', { n: (n / 1e8).toFixed(2) })
    : n >= 1e4 ? t('unit.wan', { n: (n / 1e4).toFixed(1) }) : String(n)

  if (loading) {
    return <div className={css.profileRoot}><div className={css.profileBox}><i className={css.skelLine} style={{ width: '40%' }} /></div></div>
  }

  return (
    <div className={css.profileRoot}>
      <section className={css.profileHero}>
        <div className={css.profileAvatar} aria-hidden="true"><XPeachMark size={32} /></div>
        <div className={css.profileIdentity}>
          <h2 className={css.profileName}>{meRow?.display_name ?? meRow?.username ?? t('profile.guest')}</h2>
          <p className={css.profileHandle}>
            {meRow?.username !== undefined ? `@${meRow.username}` : t('profile.defaultHandle')}
            {meRow?.group !== undefined && <span className={css.profileGroup}>{meRow.group}</span>}
            {meRow?.aff_code !== undefined && <span className={css.profileAff}>{t('profile.affTag', { code: meRow.aff_code })}</span>}
          </p>
          {error !== undefined && <p className={css.bindError}>{error}</p>}
        </div>
      </section>

      <dl className={css.profileStats}>
        <div className={css.profileStat}><dt>{t('profile.calls')}</dt><dd>{fmt(meRow?.request_count ?? logs.length)}</dd></div>
        <div className={css.profileStat}><dt>{t('profile.spent')}</dt><dd>{quotaUsd(meRow?.used_quota ?? 0)}</dd></div>
        <div className={css.profileStat}><dt>{t('profile.left')}</dt><dd>{quotaUsd(meRow?.quota ?? 0)}</dd></div>
        <div className={css.profileStat}><dt>{t('profile.streak')}</dt><dd>{stats.streak}{t('profile.daysUnit')}</dd></div>
      </dl>

      <section className={css.profileBox}>
        <div className={css.profileBoxHead}>
          <span>{t('profile.activity')} <em className={css.profileMeta}>{t('profile.window', { n: String(logs.length) })}</em></span>
          <span className={css.profileMeta}>
            {t('profile.activitySummary', { tokens: fmt(stats.tokens), days: String(stats.days.size), unit: t('profile.daysUnit') })}
            {stat !== undefined && t('profile.rateSummary', { rpm: String(stat.rpm), tpm: fmt(stat.tpm) })}
          </span>
        </div>
        <div className={css.heatmap} role="img" aria-label={t('profile.activity')}>
          {cells.map(c => (
            <span key={c.key} className={css.heatCell} data-level={c.level}
              title={`${c.key} · ${t('unit.tok', { n: fmt(c.value) })}`} />
          ))}
        </div>
      </section>

      <section className={css.profileBox}>
        <div className={css.profileBoxHead}><span>{t('profile.models')}</span><span className={css.profileMeta}>{t('profile.longestSummary', { label: t('profile.longest'), min: String(Math.round(stats.longest / 60)) })}</span></div>
        {stats.top.length === 0 && <p className={css.bindHint}>{t('profile.empty')}</p>}
        <ul className={css.profileList}>
          {stats.top.map(([name, agg]) => (
            <li key={name} className={css.profileListRow}>
              <span className={css.profileListName}>{name}</span>
              <span className={css.profileMeta}>{t('profile.modelMeta', { calls: String(agg.calls), tokens: fmt(agg.tokens) })}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={css.profileBox}>
        <div className={css.profileBoxHead}><span>{t('profile.works')}</span><span className={css.profileMeta}>{sessions.length}</span></div>
        {sessions.length === 0 && <p className={css.bindHint}>{t('profile.empty')}</p>}
        <div className={css.worksGrid}>
          {sessions.map((s) => {
            const name = s.cwd !== undefined ? s.cwd.split('/').filter(Boolean).pop() ?? s.cwd : s.id.slice(0, 8)
            return (
              <div key={s.id} className={css.workCard}>
                <span className={css.workName}>{name}</span>
                <span className={css.profileMeta}>{rel(Math.floor(s.updatedAt / 1000), t('time.justNow'), n => t('time.minAgo', { n }))}</span>
              </div>
            )
          })}
        </div>
      </section>

      <MacosInstallerCard
        t={t}
        macosInstallerStatus={macosInstallerStatus}
        macosInstallerAction={macosInstallerAction}
      />

      <section className={css.profileBox}>
        <div className={css.profileBoxHead}><span>{t('profile.plugins')}</span></div>
        <div className={css.profileListRow}>
          <span className={css.profileMeta}>{t('profile.pluginsHint')}</span>
          <button type="button" className={css.bindButton} onClick={openPlugins}>{t('profile.openPlugins')}</button>
        </div>
      </section>

      <section className={css.profileBox}>
        <div className={css.profileBoxHead}><span>{t('profile.recent')}</span><span className={css.profileMeta}>{logs.length}{' / '}{logs.length > 0 ? t('unit.tok', { n: fmt(stats.tokens) }) : ''}</span></div>
        {logs.length === 0 && <p className={css.bindHint}>{t('profile.empty')}</p>}
        <ul className={css.profileList}>
          {logs.slice(0, 6).map(row => (
            <li key={row.id} className={css.profileListRow}>
              <span className={css.profileListName}>{row.model_name ?? t('profile.unknownModel')}</span>
              <span className={css.profileMeta}>
                {t('unit.tok', { n: (row.prompt_tokens + row.completion_tokens).toLocaleString() })}{' · '}
                {row.group ?? ''}{' · '}{rel(Math.floor(row.created_at), t('time.justNow'), n => t('time.minAgo', { n }))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
