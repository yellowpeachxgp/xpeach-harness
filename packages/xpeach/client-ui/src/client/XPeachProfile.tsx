/** Codex-style profile home: the Access Token is the login state, so the
 * page renders the site account itself — identity, quota, token activity
 * heatmap, top models, and the latest calls. */
import { useEffect, useMemo, useState } from 'react'
import { XPeachMark } from './brand.tsx'
import type { XPeachOps, XPeachSelfLogRow, XPeachUserSelfRow } from './ops.ts'
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
}

const WEEKS = 26
const CELLS = WEEKS * 7

/** Local day key (YYYY-MM-DD) from a unix-seconds timestamp. */
function dayKey(ts: number): string {
  const d = new Date(ts * 1000)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
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

export function XPeachProfile({ t, userSelf, userLogs, userLogStat, recentSessions, openPlugins }: Props): JSX.Element {
  const [me, setMe] = useState<XPeachUserSelfRow | { error: string } | undefined>(undefined)
  const [logs, setLogs] = useState<readonly XPeachSelfLogRow[]>([])
  const [stat, setStat] = useState<{ rpm: number, tpm: number } | undefined>(undefined)
  const [sessions, setSessions] = useState<readonly { id: string, cwd?: string, updatedAt: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void userSelf().then(r => { if (alive) setMe(r) })
    void userLogStat().then(r => { if (alive && !('error' in r)) setStat({ rpm: r.rpm, tpm: r.tpm }) })
    void recentSessions().then(r => { if (alive && !('error' in r)) setSessions(r) })
    void (async () => {
      const all: XPeachSelfLogRow[] = []
      for (let page = 0; page < 6; page += 1) {
        const chunk = await userLogs(page, 100)
        if ('error' in chunk) break
        all.push(...chunk.items)
        if (chunk.items.length < 100) break
      }
      if (alive) { setLogs(all); setLoading(false) }
    })()
    return () => { alive = false }
  }, [userSelf, userLogs, userLogStat, recentSessions])

  const stats = useMemo(() => {
    const perDay = new Map<string, number>()
    const perModel = new Map<string, { calls: number, tokens: number }>()
    let tokens = 0
    let longest = 0
    for (const row of logs) {
      const tok = (row.prompt_tokens ?? 0) + (row.completion_tokens ?? 0)
      tokens += tok
      const key = dayKey(row.created_at)
      perDay.set(key, (perDay.get(key) ?? 0) + tok)
      const name = row.model_name ?? 'unknown'
      const agg = perModel.get(name) ?? { calls: 0, tokens: 0 }
      perModel.set(name, { calls: agg.calls + 1, tokens: agg.tokens + tok })
      longest = Math.max(longest, row.use_time ?? 0)
    }
    const days = new Set(perDay.keys())
    const top = [...perModel.entries()].sort((a, b) => b[1].calls - a[1].calls).slice(0, 5)
    const maxDay = Math.max(...perDay.values(), 1)
    return { perDay, days, tokens, longest, top, maxDay, streak: streakOf(days) }
  }, [logs])

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

  const fmt = (n: number): string => n >= 1e8 ? (n / 1e8).toFixed(2) + '亿' : n >= 1e4 ? (n / 1e4).toFixed(1) + '万' : String(n)

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
            {'@' + (meRow?.username ?? 'xpeach')}
            {meRow?.group !== undefined && <span className={css.profileGroup}>{meRow.group}</span>}
            {meRow?.aff_code !== undefined && <span className={css.profileAff}>{'邀请码 ' + meRow.aff_code}</span>}
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
            {fmt(stats.tokens)}{' tok · '}{stats.days.size}{t('profile.daysUnit')}
            {stat !== undefined && (' · ' + stat.rpm + ' rpm · ' + fmt(stat.tpm) + ' tpm')}
          </span>
        </div>
        <div className={css.heatmap} role="img" aria-label={t('profile.activity')}>
          {cells.map(c => (
            <span key={c.key} className={css.heatCell} data-level={c.level}
              title={c.key + ' · ' + fmt(c.value) + ' tok'} />
          ))}
        </div>
      </section>

      <section className={css.profileBox}>
        <div className={css.profileBoxHead}><span>{t('profile.models')}</span><span className={css.profileMeta}>{t('profile.longest') + ' ' + Math.round(stats.longest / 60) + ' min'}</span></div>
        {stats.top.length === 0 && <p className={css.bindHint}>{t('profile.empty')}</p>}
        <ul className={css.profileList}>
          {stats.top.map(([name, agg]) => (
            <li key={name} className={css.profileListRow}>
              <span className={css.profileListName}>{name}</span>
              <span className={css.profileMeta}>{agg.calls}{' calls · '}{fmt(agg.tokens)}{' tok'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={css.profileBox}>
        <div className={css.profileBoxHead}><span>{t('profile.works')}</span><span className={css.profileMeta}>{sessions.length}</span></div>
        {sessions.length === 0 && <p className={css.bindHint}>{t('profile.empty')}</p>}
        <div className={css.worksGrid}>
          {sessions.map(s => {
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

      <section className={css.profileBox}>
        <div className={css.profileBoxHead}><span>{t('profile.plugins')}</span></div>
        <div className={css.profileListRow}>
          <span className={css.profileMeta}>{t('profile.pluginsHint')}</span>
          <button type="button" className={css.bindButton} onClick={openPlugins}>{t('profile.openPlugins')}</button>
        </div>
      </section>

      <section className={css.profileBox}>
        <div className={css.profileBoxHead}><span>{t('profile.recent')}</span><span className={css.profileMeta}>{logs.length}{' / '}{logs.length > 0 ? fmt(stats.tokens) + ' tok' : ''}</span></div>
        {logs.length === 0 && <p className={css.bindHint}>{t('profile.empty')}</p>}
        <ul className={css.profileList}>
          {logs.slice(0, 6).map(row => (
            <li key={row.id} className={css.profileListRow}>
              <span className={css.profileListName}>{row.model_name ?? 'unknown'}</span>
              <span className={css.profileMeta}>
                {(row.prompt_tokens + row.completion_tokens).toLocaleString()}{' tok · '}
                {row.group ?? ''}{' · '}{rel(Math.floor(row.created_at), t('time.justNow'), n => t('time.minAgo', { n }))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
