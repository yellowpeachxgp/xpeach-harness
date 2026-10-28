/** Site-admin segment: the management-token surfaces (users/tokens/pricing/logs). */
import { type JSX, useEffect, useMemo, useState } from 'react'
import css from './xpeach.module.css'
import { EditDrawer, DrawerField } from './XPeachDrawer.tsx'
import type { PropsLocale } from '@xpeach/xph-client-ui-slots'
import type { XPeachOps, XPeachAdminUserRow, XPeachAdminTokenRow, XPeachAdminLogRow } from './ops.ts'
import { quotaUsd, callUsd, rel, at } from './fmt.ts'

type T = PropsLocale<'xpeach.account'>['t']
type AdminSub = 'users' | 'tokens' | 'pricing' | 'sitelogs' | 'channels' | 'codes' | 'groups' | 'notice'
type AdminOverview = {
  adminName: string
  totalUsers: number
  totalLogs: number
  totalTokens: number
  groups: readonly string[]
  selfQuotaUsed?: number | undefined
  rpm?: number | undefined
  tpm?: number | undefined
}

type Page<T> = { page: number; page_size: number; total: number; items: readonly T[] }

function num(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function Pager({
  page, total, size, onPage,
}: {
  page: number
  total: number
  size: number
  onPage: (p: number) => void
}): JSX.Element | null {
  const pages = Math.max(1, Math.ceil(total / size))
  if (pages <= 1) return null
  return (
    <div className={css.pager}>
      <button type="button" className={css.pagerBtn} disabled={page <= 0} onClick={() => { onPage(page - 1) }}>‹</button>
      <span className={css.pagerInfo}>{page + 1}/{pages} · {num(total)}</span>
      <button type="button" className={css.pagerBtn} disabled={page >= pages - 1} onClick={() => { onPage(page + 1) }}>›</button>
    </div>
  )
}

/**
 * Render the site-administration segment inside the XPeach console.
 * @param props - locale translator and administration operations.
 * @returns the administration segment element.
 */
export function XPeachAdmin({ t, ops }: { t: T; ops: XPeachOps }): JSX.Element {
  const [sub, setSub] = useState<AdminSub>('users')
  const [ov, setOv] = useState<AdminOverview | { error: string } | null>(null)
  const [users, setUsers] = useState<Page<XPeachAdminUserRow> | { error: string } | null>(null)
  const [tokens, setTokens] = useState<Page<XPeachAdminTokenRow> | { error: string } | null>(null)
  const [logs, setLogs] = useState<Page<XPeachAdminLogRow> | { error: string } | null>(null)
  const [pricing, setPricing] = useState<import('./ops.ts').XPeachPricingCatalog | { error: string } | null>(null)
  const [channels, setChannels] = useState<Page<import('./ops.ts').XPeachChannelRow> | { error: string } | null>(null)
  const [codes, setCodes] = useState<Page<import('./ops.ts').XPeachRedemptionRow> | { error: string } | null>(null)
  const [newCode, setNewCode] = useState({ quota: '100', count: '5', name: '' })
  const [codeBusy, setCodeBusy] = useState(false)
  const [codeResult, setCodeResult] = useState<readonly string[] | string | null>(null)
  const [chMsg, setChMsg] = useState<string | null>(null)
  const [chExpand, setChExpand] = useState<number | null>(null)
  const [chDraft, setChDraft] = useState<Record<string, string>>({})
  const [chBusy, setChBusy] = useState(false)
  const [opts, setOpts] = useState<Record<string, string> | { error: string } | null>(null)
  const [optDraft, setOptDraft] = useState<Record<string, string>>({})
  const [optMsg, setOptMsg] = useState<string | null>(null)
  const [tokDraft, setTokDraft] = useState({ uid: '', name: '', quota: '', unlimited: true, group: '' })
  const [tokMsg, setTokMsg] = useState<string | null>(null)
  const [tokOpen, setTokOpen] = useState(false)
  const [usrExpand, setUsrExpand] = useState<number | null>(null)
  const [usrDraft, setUsrDraft] = useState<Record<string, string>>({})
  const [usrMsg, setUsrMsg] = useState<string | null>(null)
  const [usrBusy, setUsrBusy] = useState(false)
  const [priceSnap, setPriceSnap] = useState<Map<string, import('./ops.ts').XPeachModelPricingEntryRow> | null>(null)
  const [priceExpand, setPriceExpand] = useState<string | null>(null)
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({})
  const [priceBusy, setPriceBusy] = useState(false)
  const [priceMsg, setPriceMsg] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pQuery, setPQuery] = useState('')
  const size = 15

  useEffect(() => {
    void ops.adminOverview().then(setOv)
  }, [])
  useEffect(() => {
    if (sub === 'users') void ops.adminUsers(page, size).then(setUsers)
    else if (sub === 'tokens') void ops.adminTokens(page, size).then(setTokens)
    else if (sub === 'sitelogs') void ops.adminLogs(page, size).then(setLogs)
    else if (sub === 'channels') void ops.adminChannels(page).then((r) => { setChannels(r) })
    else if (sub === 'codes') void ops.adminRedemptions(page).then((r) => { setCodes(r) })
    else if ((sub === 'groups' || sub === 'notice') && opts === null) void ops.adminOptions().then((r) => {
      if ('error' in r) { setOpts(r); return }
      const map: Record<string, string> = {}
      for (const e of r.entries) map[e.key] = e.value
      setOpts(map)
    })
    else if (sub === 'pricing' && pricing === null) void ops.adminPricing().then(setPricing)
  }, [sub, page])

  const pricedRows = useMemo(() => {
    if (pricing === null || 'error' in pricing) return []
    const q = pQuery.trim().toLowerCase()
    return pricing.entries.filter(r => q === '' || r.model_name.toLowerCase().includes(q))
  }, [pricing, pQuery])

  const errText = (v: { error: string } | null | object): string | null =>
    v !== null && typeof v === 'object' && 'error' in v ? (v).error : null

  return (
    <>
      {ov !== null && !('error' in ov) && (
        <div className={css.adminHead}>
          <span className={css.adminStat}>{ov.adminName}</span>
          <span className={css.adminStat}>{num(ov.totalUsers)} {t('admin.users')}</span>
          <span className={css.adminStat}>{num(ov.totalLogs)} {t('admin.calls')}</span>
          {ov.rpm !== undefined && <span className={css.adminStat}>{t('admin.rpmTpm', { rpm: String(ov.rpm), tpm: num(ov.tpm ?? 0) })}</span>}
        </div>
      )}
      {ov !== null && 'error' in ov && <p className={css.bindError}>{ov.error}</p>}
      <nav className={css.segRow}>
        {([['users', 'admin.sub.users'], ['tokens', 'admin.sub.tokens'], ['pricing', 'admin.sub.pricing'], ['sitelogs', 'admin.sub.sitelogs'], ['channels', 'admin.sub.channels'], ['codes', 'admin.sub.codes'], ['groups', 'admin.sub.groups'], ['notice', 'admin.sub.notice']] as const).map(([k, key]) => (
          <button key={k} type="button" onClick={() => { setSub(k); setPage(0) }}
            className={sub === k ? css.segOn : css.segOff}>{t(key)}</button>
        ))}
      </nav>

      {sub === 'users' && (
        <>
          {usrMsg !== null && <p className={css.bindHint}>{usrMsg}</p>}
          {errText(users) !== null && <p className={css.bindError}>{errText(users)}</p>}
          <ul className={css.adminList}>
            {users !== null && !('error' in users) && users.items.map(u => (
              <li key={u.id} className={css.adminRow}>
                <div className={css.adminMain} role="button" tabIndex={0}
                  aria-expanded={usrExpand === u.id}
                  onClick={() => {
                    if (usrExpand === u.id) { setUsrExpand(null); return }
                    setUsrExpand(u.id)
                    setUsrDraft({
                      display_name: u.display_name ?? '', email: u.email ?? '',
                      quota: String((u.quota ?? 0) / 500000), group: u.group ?? '',
                      status: String(u.status ?? 1),
                    })
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') setUsrExpand(usrExpand === u.id ? null : u.id) }}>
                  <svg className={usrExpand === u.id ? css.expandOn : css.expandOff} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className={css.adminId}>{u.username}</span>
                  {u.display_name !== undefined && u.display_name !== '' && u.display_name !== u.username && <span className={css.adminDim}>{u.display_name}</span>}
                  {u.group !== undefined && u.group !== '' && <span className={css.groupChip}>{u.group}</span>}
                  {u.status !== undefined && u.status !== 1 && <span className={css.epChip}>{t('admin.statusBadge', { status: String(u.status) })}</span>}
                </div>
                <div className={css.adminMeta}>
                  {quotaUsd(u.used_quota)} / {quotaUsd(u.quota)}
                  {(u.aff_count ?? 0) > 0 && <span>{t('admin.affBadge', { count: String(u.aff_count) })}</span>}
                </div>
                {usrExpand === u.id && (
                  <EditDrawer
                    actions={<>
                      <button type="button" className={css.bindButton} disabled={usrBusy}
                        onClick={() => {
                          setUsrBusy(true); setUsrMsg(null)
                          void ops.adminUserGet(u.id).then((full) => {
                            if ('error' in full) { setUsrBusy(false); setUsrMsg(full.error as string); return }
                            void ops.adminUserUpdate({
                              ...full,
                              id: u.id, username: u.username,
                              display_name: usrDraft['display_name'], email: usrDraft['email'],
                              quota: Number(usrDraft['quota']) * 500000, group: usrDraft['group'],
                              status: Number(usrDraft['status']),
                            }).then((err) => {
                              setUsrBusy(false); setUsrMsg(err ?? u.username + ' ' + t('admin.savedOk'))
                              void ops.adminUsers(page, size).then(setUsers)
                            })
                          })
                        }}>{usrBusy ? t('bind.working') : t('admin.save')}</button>
                      <button type="button" className={css.rowAct} disabled={usrBusy}
                        onClick={() => {
                          setUsrBusy(true); setUsrMsg(null)
                          const action = u.status === 1 ? 'disable' : 'enable'
                          void ops.adminUserManage(u.id, action, 0).then((err) => {
                            setUsrBusy(false); setUsrMsg(err ?? u.username + ' ' + (action === 'disable' ? t('admin.chOff') : t('admin.chEnable')) + ' ✓')
                            void ops.adminUsers(page, size).then(setUsers)
                          })
                        }}>{u.status === 1 ? t('admin.chOff') : t('admin.chEnable')}</button>
                    </>}>
                    <DrawerField label={t('user.ef.display_name')}>
                      <input className={css.bindInput} value={usrDraft['display_name'] ?? ''} onChange={(e) => { setUsrDraft({ ...usrDraft, display_name: e.target.value }) }} /></DrawerField>
                    <DrawerField label={t('user.ef.email')}>
                      <input className={css.bindInput} value={usrDraft['email'] ?? ''} onChange={(e) => { setUsrDraft({ ...usrDraft, email: e.target.value }) }} /></DrawerField>
                    <DrawerField label={t('user.tquotaPeach')}>
                      <input className={css.bindInput} type="number" value={usrDraft['quota'] ?? ''} onChange={(e) => { setUsrDraft({ ...usrDraft, quota: e.target.value }) }} /></DrawerField>
                    <DrawerField label={t('user.tgroup')}>
                      <input className={css.bindInput} value={usrDraft['group'] ?? ''} onChange={(e) => { setUsrDraft({ ...usrDraft, group: e.target.value }) }} /></DrawerField>
                    <DrawerField label={t('user.tstatus')}>
                      <select className={css.bindInput} value={usrDraft['status'] ?? '1'} onChange={(e) => { setUsrDraft({ ...usrDraft, status: e.target.value }) }}>
                        <option value="1">{t('user.statusOn')}</option>
                        <option value="2">{t('user.statusOff')}</option>
                      </select></DrawerField>
                  </EditDrawer>
                )}
              </li>
            ))}
          </ul>
          {users !== null && !('error' in users) && <Pager page={page} total={users.total} size={size} onPage={setPage} />}
        </>
      )}

      {sub === 'tokens' && (
        <>
          <div className={css.bindRow}>
            <button type="button" className={css.bindGhost} onClick={() => { setTokOpen(v => !v) }}>{tokOpen ? t('market.tryClose') : t('admin.tokNew')}</button>
            {tokMsg !== null && <span className={css.bindHint}>{tokMsg}</span>}
          </div>
          {tokOpen && (
            <div className={css.chEdit}>
              <p className={css.bindHint} style={{ gridColumn: '1 / -1' }}>{t('admin.tokSelfHint')}</p>
              <label className={css.chField}><span>{t('user.tname')}</span><input className={css.bindInput} value={tokDraft.name} onChange={(e) => { setTokDraft({ ...tokDraft, name: e.target.value }) }} /></label>
              <label className={css.chField}><span>{t('user.tquotaPeach')}</span><input className={css.bindInput} type="number" disabled={tokDraft.unlimited} value={tokDraft.quota} onChange={(e) => { setTokDraft({ ...tokDraft, quota: e.target.value }) }} /></label>
              <label className={css.chField}><span>{t('user.tUnlimited')}</span><input type="checkbox" checked={tokDraft.unlimited} onChange={(e) => { setTokDraft({ ...tokDraft, unlimited: e.target.checked }) }} /></label>
              <label className={css.chField}><span>{t('user.tgroup')}</span><input className={css.bindInput} value={tokDraft.group} onChange={(e) => { setTokDraft({ ...tokDraft, group: e.target.value }) }} /></label>
              <div className={css.bindRow}><button type="button" className={css.bindButton}
                onClick={() => {
                  setTokMsg(null)
                  void ops.adminTokenCreate({
                    name: tokDraft.name || 'admin-created',
                    expired_time: -1,
                    unlimited_quota: tokDraft.unlimited,
                    ...(tokDraft.unlimited ? {} : { remain_quota: Number(tokDraft.quota) * 500000 }),
                    ...(tokDraft.group !== '' ? { group: tokDraft.group } : {}),
                  }).then((err) => {
                    setTokMsg(err ?? t('user.tokCreated'))
                    setTokOpen(false)
                    void ops.adminTokens(page, size).then(setTokens)
                  })
                }}>{t('admin.codeMake')}</button></div>
            </div>
          )}
          {errText(tokens) !== null && <p className={css.bindError}>{errText(tokens)}</p>}
          <ul className={css.adminList}>
            {tokens !== null && !('error' in tokens) && tokens.items.map(tk => (
              <li key={tk.id} className={css.adminRow}>
                <div className={css.adminMain}>
                  <span className={css.adminId}>{tk.name ?? `#${tk.id}`}</span>
                  {tk.key !== undefined && <code className={css.adminKey}>{tk.key}</code>}
                  {tk.group !== undefined && tk.group !== '' && <span className={css.groupChip}>{tk.group}</span>}
                  {tk.unlimited_quota === true && <span className={css.epChip}>∞</span>}
                  <span className={css.adminActs}>
                    <button type="button" className={css.rowAct} onClick={() => {
                      if (!window.confirm(t('admin.chDelConfirm', { name: tk.name ?? String(tk.id) }))) return
                      void ops.adminTokenDelete(tk.id).then((err) => {
                        setTokMsg(err ?? t('admin.delOk'))
                        void ops.adminTokens(page, size).then(setTokens)
                      })
                    }}>{t('admin.del')}</button>
                  </span>
                </div>
                <div className={css.adminMeta}>
                  {t('admin.uidMeta', { id: String(tk.user_id), quota: quotaUsd(tk.used_quota) })}
                  {tk.accessed_time !== undefined && tk.accessed_time > 0 && <span> · {at(tk.accessed_time)}</span>}
                </div>
              </li>
            ))}
          </ul>
          {tokens !== null && !('error' in tokens) && <Pager page={page} total={tokens.total} size={size} onPage={setPage} />}
        </>
      )}

      {sub === 'pricing' && (
        <>
          <input className={css.marketSearch} value={pQuery} placeholder={t('admin.pricePh')}
            onChange={(e) => { setPQuery(e.target.value) }} />
          {errText(pricing) !== null && <p className={css.bindError}>{errText(pricing)}</p>}
          {priceMsg !== null && <p className={css.bindHint}>{priceMsg}</p>}
          <ul className={css.adminList}>
            {pricedRows.slice(0, 60).map(pr => (
              <li key={pr.model_name} className={css.adminRow}>
                <div className={css.adminMain} role="button" tabIndex={0}
                  onClick={() => {
                    if (priceExpand === pr.model_name) { setPriceExpand(null); return }
                    setPriceExpand(pr.model_name)
                    if (priceSnap === null) {
                      void ops.adminModelPricing().then((r) => {
                        if ('error' in r) { setPriceMsg(r.error); return }
                        const m = new Map<string, import('./ops.ts').XPeachModelPricingEntryRow>()
                        for (const e of r.entries) m.set(e.model_name, e)
                        setPriceSnap(m)
                        const en = m.get(pr.model_name)
                        if (en !== undefined) {
                          const d: Record<string, string> = {}
                          for (const [k, v] of Object.entries(en.configured)) d[k] = String(v)
                          setPriceDraft(d)
                        }
                      })
                    } else {
                      const en = priceSnap.get(pr.model_name)
                      const d: Record<string, string> = {}
                      if (en !== undefined) for (const [k, v] of Object.entries(en.configured)) d[k] = String(v)
                      setPriceDraft(d)
                    }
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') setPriceExpand(priceExpand === pr.model_name ? null : pr.model_name) }}>
                  <code className={css.adminId}>{pr.model_name}</code>
                  <span className={css.epChip}>{pr.quota_type === 1 ? t('admin.modePerCall') : t('admin.modeTok')}</span>
                </div>
                <div className={css.adminMeta}>
                  {pr.quota_type === 1
                    ? callUsd(pr.model_price)
                    : t('admin.priceInOut', { inPrice: ((pr.model_ratio ?? 0) * 2).toFixed(2), outPrice: ((pr.model_ratio ?? 0) * 2 * (pr.completion_ratio ?? 1)).toFixed(2) })}
                  {(pr.enable_groups ?? []).length <= 3
                    ? ' · ' + (pr.enable_groups ?? []).join(', ')
                    : t('admin.groupsCount', { n: String((pr.enable_groups ?? []).length) })}
                </div>
                {priceExpand === pr.model_name && (() => {
                  const en = priceSnap?.get(pr.model_name)
                  const eff = en?.effective ?? {}
                  return (
                    <div className={css.chEdit} onClick={(e) => { e.stopPropagation() }}>
                      <p className={css.bindHint}>
                        {en === undefined ? t('admin.priceNoCfg') : t('admin.priceVer', { v: en.version.slice(0, 10) + '…' })}
                        {'effective' in (en ?? {}) ? t('admin.effSummary', { items: Object.entries(eff).map(([k, v]) => k + '=' + String(v)).slice(0, 5).join(' ') }) : ''}
                      </p>
                      {([
                        'ModelRatio', 'CompletionRatio', 'CacheRatio', 'CreateCacheRatio',
                        'ImageRatio', 'AudioRatio', 'AudioCompletionRatio', 'FixedPrice',
                      ] as const).map((f) => {
                        const rawVal = eff[f]
                        const valText = typeof rawVal === 'string' || typeof rawVal === 'number' || typeof rawVal === 'boolean'
                          ? String(rawVal)
                          : JSON.stringify(rawVal)
                        return (
                          <label key={f} className={css.chField}>
                            <span>{rawVal !== undefined ? t('admin.effField', { field: f, val: valText }) : f}</span>
                            <input
                              className={css.bindInput}
                              type="text"
                              value={priceDraft[f] ?? ''}
                              placeholder={t('admin.priceInherit')}
                              onChange={(e) => { setPriceDraft({ ...priceDraft, [f]: e.target.value }) }}
                            />
                          </label>
                        )
                      })}
                      <div className={css.bindRow}>
                        <button type="button" className={css.bindButton} disabled={priceBusy || en === undefined}
                          onClick={() => {
                            if (en === undefined) return
                            setPriceBusy(true); setPriceMsg(null)
                            const pricing: Record<string, unknown> = {}
                            for (const [k, v] of Object.entries(priceDraft)) {
                              if (v.trim() === '') continue
                              const n = Number(v)
                              pricing[k] = Number.isNaN(n) ? v : n
                            }
                            const patch = [{ model_name: pr.model_name, expected_version: en.version, pricing }]
                            void ops.adminModelPricingPatch(patch).then((err) => {
                              setPriceBusy(false); setPriceMsg(err ?? pr.model_name + ' ' + t('admin.savedOk'))
                              setPriceSnap(null)
                            })
                          }}>{priceBusy ? t('bind.working') : t('admin.save')}</button>
                        <button type="button" className={css.bindGhost} disabled={priceBusy || en === undefined}
                          onClick={() => {
                            if (en === undefined) return
                            if (!window.confirm(t('admin.priceResetConfirm', { name: pr.model_name }))) return
                            setPriceBusy(true); setPriceMsg(null)
                            const patch = [{ model_name: pr.model_name, expected_version: en.version, reset: true }]
                            void ops.adminModelPricingPatch(patch).then((err) => {
                              setPriceBusy(false); setPriceMsg(err ?? pr.model_name + ' ' + t('admin.resetOk'))
                              setPriceSnap(null)
                            })
                          }}>{t('admin.priceReset')}</button>
                      </div>
                    </div>
                  )
                })()}
              </li>
            ))}
          </ul>
          {pricing !== null && !('error' in pricing) && <p className={css.marketMeta}>{pricedRows.length} {t('market.count')}</p>}
        </>
      )}

      {sub === 'sitelogs' && (
        <>
          <div className={css.bindRow}>
            <button type="button" className={css.bindGhost} onClick={() => {
              if (logs === null || 'error' in logs) return
              const head = 'time,username,model,channel,prompt_tokens,completion_tokens,quota,stream'
              const lines = logs.items.map(e => [new Date((e.created_at ?? 0) * 1000).toISOString(), e.username, e.model_name, e.channel_name ?? '', e.prompt_tokens ?? 0, e.completion_tokens ?? 0, e.quota ?? 0, e.is_stream ?? false].join(','))
              const blob = new Blob([head + '\n' + lines.join('\n')], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob); a.download = 'xpeach-site-logs.csv'; a.click()
              URL.revokeObjectURL(a.href)
            }}>{t('logs.csv')}</button>
          </div>
          {errText(logs) !== null && <p className={css.bindError}>{errText(logs)}</p>}
          <ul className={css.adminList}>
            {logs !== null && !('error' in logs) && logs.items.map(e => (
              <li key={e.id} className={css.adminRow}>
                <div className={css.adminMain}>
                  <span className={css.adminId}>{e.username ?? t('admin.uidFallback', { id: String(e.user_id ?? '') })}</span>
                  <span className={css.logModel}>{e.model_name}</span>
                  {e.is_stream === true && <span className={css.epChip}>{t('admin.streamBadge')}</span>}
                </div>
                <div className={css.adminMeta}>
                  {callUsd(e.quota)} · {t('unit.tok', { n: `${e.prompt_tokens ?? 0}+${e.completion_tokens ?? 0}` })}
                  {e.channel_name !== undefined && e.channel_name !== '' && <span> · {e.channel_name}</span>}
                  {e.created_at !== undefined && <span> · {rel(e.created_at, t('time.justNow'), n => t('time.minAgo', { n: String(n) }))}</span>}
                </div>
              </li>
            ))}
          </ul>
          {logs !== null && !('error' in logs) && <Pager page={page} total={logs.total} size={size} onPage={setPage} />}
        </>
      )}

      {sub === 'channels' && (
        <>
          {chMsg !== null && <p className={css.bindHint}>{chMsg}</p>}
          {errText(channels) !== null && <p className={css.bindError}>{errText(channels)}</p>}
          <ul className={css.adminList}>
            {channels !== null && !('error' in channels) && channels.items.map(ch => (
              <li key={ch.id} className={css.adminRow}>
                <div className={css.adminMain} role="button" tabIndex={0}
                  aria-expanded={chExpand === ch.id}
                  onClick={() => {
                    if (chExpand === ch.id) { setChExpand(null); return }
                    setChExpand(ch.id)
                    setChDraft({
                      name: ch.name, base_url: ch.base_url ?? '', group: ch.group ?? '',
                      models: ch.models ?? '', test_model: '', priority: String(ch.priority ?? 0),
                      weight: String(ch.weight ?? 0), key: '',
                    })
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') setChExpand(chExpand === ch.id ? null : ch.id) }}>
                  <span className={css.adminId}>{ch.name}</span>
                  <span className={css.statusDotWrap}><i className={ch.status === 1 ? css.statusDotOk : css.statusDotErr} />{ch.status === 1 ? t('admin.chOn') : t('admin.chDisabled')}</span>
                  {(ch.group ?? '').split(',').filter(Boolean).map(g => <span key={g} className={css.groupChip}>{g}</span>)}
                  <span className={css.epChip}>{t('admin.prioWeight', { prio: String(ch.priority ?? 0), weight: String(ch.weight ?? 0) })}</span>
                  {ch.response_time !== undefined && ch.response_time > 0 && <span className={ch.response_time < 3000 ? css.healthOk : css.healthFail}>{t('unit.ms', { n: String(ch.response_time) })}</span>}
                  <span className={css.adminActs}>
                    <button type="button" className={css.rowAct} onClick={(e) => {
                      e.stopPropagation()
                      setChMsg(null)
                      void ops.adminChannelTest(ch.id).then((err) => { setChMsg(err ?? ch.name + ' ' + t('admin.testOk')) })
                    }}>{t('admin.chTest')}</button>
                    <button type="button" className={css.rowAct} onClick={(e) => {
                      e.stopPropagation()
                      const next = ch.status === 1 ? 2 : 1
                      void ops.adminChannelSave({ ...ch, id: ch.id, status: next }).then(() => {
                        void ops.adminChannels(page).then((r) => { setChannels(r) })
                      })
                    }}>{ch.status === 1 ? t('admin.chOff') : t('admin.chEnable')}</button>
                    <button type="button" className={css.rowAct} onClick={(e) => {
                      e.stopPropagation()
                      if (!window.confirm(t('admin.chDelConfirm', { name: ch.name }))) return
                      void ops.adminChannelDelete(ch.id).then((err) => {
                        setChMsg(err ?? t('admin.delOk'))
                        void ops.adminChannels(page).then((r) => { setChannels(r) })
                      })
                    }}>{t('admin.del')}</button>
                  </span>
                </div>
                <div className={css.adminMeta}>
                  {(ch.models ?? '').split(',').filter(Boolean).length} {t('admin.chModels')}
                  {ch.base_url !== undefined && ch.base_url !== '' && <span> · {ch.base_url}</span>}
                </div>
                {chExpand === ch.id && (
                  <EditDrawer
                    actions={
                      <button type="button" className={css.bindButton} disabled={chBusy}
                        onClick={() => {
                          setChBusy(true); setChMsg(null)
                          void ops.adminChannelSave({
                            ...ch,
                            name: chDraft['name'], base_url: chDraft['base_url'], group: chDraft['group'],
                            models: chDraft['models'], test_model: chDraft['test_model'],
                            priority: Number(chDraft['priority']), weight: Number(chDraft['weight']),
                            ...(chDraft['key'] !== undefined && chDraft['key'] !== '' ? { key: chDraft['key'] } : {}),
                          }).then((err) => {
                            setChBusy(false); setChMsg(err ?? ch.name + ' ' + t('admin.savedOk'))
                            void ops.adminChannels(page).then((r) => { setChannels(r) })
                          })
                        }}>{chBusy ? t('bind.working') : t('admin.save')}</button>
                    }>
                    {(['name', 'base_url', 'group', 'models', 'test_model', 'priority', 'weight', 'key'] as const).map(f => (
                      <DrawerField key={f} label={t(('admin.chf.' + f) as 'admin.save')}>
                        <input className={css.bindInput} type="text" value={chDraft[f] ?? ''}
                          onChange={(e) => { setChDraft({ ...chDraft, [f]: e.target.value }) }} />
                      </DrawerField>
                    ))}
                  </EditDrawer>
                )}
              </li>
            ))}
          </ul>
          {channels !== null && !('error' in channels) && <Pager page={page} total={channels.total} size={size} onPage={setPage} />}
        </>
      )}

      {sub === 'codes' && (
        <>
          <div className={css.bindRow}>
            <input className={css.bindInput} type="number" placeholder={t('admin.codeQuota')} value={newCode.quota} onChange={(e) => { setNewCode({ ...newCode, quota: e.target.value }) }} />
            <input className={css.bindInput} type="number" placeholder={t('admin.codeCount')} value={newCode.count} onChange={(e) => { setNewCode({ ...newCode, count: e.target.value }) }} />
            <input className={css.bindInput} placeholder={t('admin.codeName')} value={newCode.name} onChange={(e) => { setNewCode({ ...newCode, name: e.target.value }) }} />
            <button type="button" className={css.bindButton} disabled={codeBusy}
              onClick={() => {
                setCodeBusy(true); setCodeResult(null)
                const quotaUnits = Math.round(Number(newCode.quota) * 500000)
                void ops.adminRedemptionCreate(quotaUnits, Number(newCode.count), newCode.name).then((r) => {
                  setCodeBusy(false)
                  setCodeResult('keys' in r ? r.keys : r.error)
                  void ops.adminRedemptions(0).then((v) => { setCodes(v) })
                })
              }}>{codeBusy ? t('bind.working') : t('admin.codeMake')}</button>
          </div>
          {codeResult !== null && (
            typeof codeResult !== 'string'
              ? (
                <div className={css.codeList}>
                  {codeResult.map(k => (
                    <code key={k} className={css.codeItem} onClick={() => { void navigator.clipboard.writeText(k) }}>{k}</code>
                  ))}
                </div>
              )
              : <p className={css.bindError}>{codeResult}</p>
          )}
          {errText(codes) !== null && <p className={css.bindError}>{errText(codes)}</p>}
          <ul className={css.adminList}>
            {codes !== null && !('error' in codes) && codes.items.map(cd => (
              <li key={cd.id} className={css.adminRow}>
                <div className={css.adminMain}>
                  <code className={css.adminId}>{cd.key.slice(0, 12)}…</code>
                  {cd.name !== undefined && cd.name !== '' && <span className={css.adminDim}>{cd.name}</span>}
                  <span className={cd.status === 1 ? css.modelChipBad : css.modelChipOk}>{cd.status === 1 ? t('admin.codeIdle') : t('admin.codeUsed')}</span>
                </div>
                <div className={css.adminMeta}>
                  {quotaUsd(cd.quota)}{cd.used_user_id !== undefined && cd.used_user_id > 0 ? t('admin.codeUid', { id: String(cd.used_user_id) }) : ''}
                </div>
              </li>
            ))}
          </ul>
          {codes !== null && !('error' in codes) && <Pager page={page} total={codes.total} size={size} onPage={setPage} />}
        </>
      )}

      {sub === 'groups' && (
        <>
          {opts !== null && 'error' in opts && <p className={css.bindError}>{opts.error}</p>}
          {optMsg !== null && <p className={css.bindHint}>{optMsg}</p>}
          {opts !== null && !('error' in opts) && (['GroupRatio', 'GroupGroupRatio', 'UserUsableGroups', 'AutoGroups', 'TopupGroupRatio', 'MaxTokenAutoGroups', 'DefaultUseAutoGroup'] as const).map(k => (
            <div key={k} className={css.optRow}>
              <label className={css.optKey}>{k}</label>
              <textarea className={css.optArea} rows={k === 'DefaultUseAutoGroup' || k === 'MaxTokenAutoGroups' ? 1 : 4}
                value={optDraft[k] ?? opts[k] ?? ''}
                onChange={(e) => { setOptDraft({ ...optDraft, [k]: e.target.value }) }} />
              <button type="button" className={css.bindGhost} disabled={optDraft[k] === undefined}
                onClick={() => {
                  setOptMsg(null)
                  void ops.adminOptionSet(k, optDraft[k] ?? '').then(() => { setOptMsg(k + ' ' + t('admin.savedOk')) })
                }}>{t('admin.save')}</button>
            </div>
          ))}
        </>
      )}

      {sub === 'notice' && (
        <>
          {opts !== null && 'error' in opts && <p className={css.bindError}>{opts.error}</p>}
          {optMsg !== null && <p className={css.bindHint}>{optMsg}</p>}
          {opts !== null && !('error' in opts) && (
            <div className={css.optRow}>
              <label className={css.optKey}>{t('admin.noticeLabel', { i18n: t('admin.noticeI18n') })}</label>
              <textarea className={css.optArea} rows={8}
                value={optDraft['Notice'] ?? opts['Notice'] ?? ''}
                onChange={(e) => { setOptDraft({ ...optDraft, Notice: e.target.value }) }} />
              <button type="button" className={css.bindGhost} disabled={optDraft['Notice'] === undefined}
                onClick={() => {
                  setOptMsg(null)
                  void ops.adminOptionSet('Notice', optDraft['Notice'] ?? '').then(() => { setOptMsg('Notice ' + t('admin.savedOk')) })
                }}>{t('admin.save')}</button>
            </div>
          )}
          <p className={css.bindHint}>{t('admin.noticeHint')}</p>
        </>
      )}
    </>
  )
}
