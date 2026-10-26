/** XPeach right-pane console: account + full site model market + playground. */
import { type JSX, useEffect, useMemo, useRef, useState } from 'react'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type { XPeachHealthRow, XPeachOps, XPeachData, XPeachPricingRow, XPeachSiteCatalog, XPeachNetworkSnapshot } from './ops.ts'
import { XPeachAdmin } from './XPeachAdmin.tsx'
import { XPeachUser } from './XPeachUser.tsx'
import { XPeachProfile } from './XPeachProfile.tsx'
import { openXPeachLoginModal } from './XPeachOnboarding.tsx'
import { XPeachMark } from './brand.tsx'
import type { XPeachModel } from '@xpeach/xph-account/types'
import { rel, callUsd, isBrandSafe, SITE, parseOther, decodeExpr } from './fmt.ts'
import { inferClientModelSpec } from './model-meta.tsx'
import css from './xpeach.module.css'

/** Pane-tab props: runtime share + locale + injected ops (session scope). */
export type XPeachTabProps =
  { readonly sessionId?: string | undefined } & PropsLocale<'xpeach.account'> & InjectFace<XPeachOps>

type State =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; data: XPeachData }
  | { readonly status: 'error'; message: string }

type Seg = 'overview' | 'market' | 'logs' | 'network' | 'site' | 'user'

type PlayState =
  | { readonly status: 'idle' }
  | { readonly status: 'running'; content?: string }
  | { readonly status: 'ok'; content: string; meta: string }
  | { readonly status: 'fail'; message: string }

/** Inline playground for one catalog model. */
/** Expanded market row: site description, per-million price table, groups, endpoints, health. */
function MarketDetail({ id, model, row, h, t, billingRate, groupCatalog, selGroup, tokenGroup, onPickGroup }: {
  readonly id: string
  readonly model?: XPeachModel | undefined
  readonly row: XPeachPricingRow | undefined
  readonly h: { ok: boolean; mocked?: boolean | undefined; latencyMs?: number | undefined; error?: string | undefined } | undefined
  readonly t: XPeachTabProps['t']
  readonly billingRate: XPeachOps['billingRate'] | undefined
  /** Model → candidate groups index built from the PAT group catalog. */
  readonly groupCatalog: ReadonlyMap<string, { name: string; ratio: number | undefined }[]> | undefined
  readonly selGroup: string | undefined
  readonly tokenGroup: string | undefined
  readonly onPickGroup: (model: string, group: string) => void
}): JSX.Element {
  const [rate, setRate] = useState<{ modelRatio: number; completionRatio: number; cacheRatio: number; groupRatio: number } | undefined>()
  useEffect(() => {
    if (billingRate === undefined) return
    let alive = true
    void billingRate(id, selGroup).then((r) => { if (alive && r !== undefined && !('error' in r)) setRate(r) })
    return () => { alive = false }
  }, [id, selGroup, billingRate])
  const candidates = groupCatalog?.get(id) ?? []
  const spec = inferClientModelSpec(id, model?.contextWindow, model?.maxTokens)
  const mr = row?.model_ratio ?? 0
  const cr = row?.completion_ratio ?? 1
  const ckr = row?.cache_ratio
  const ccr = row?.create_cache_ratio
  const money = (r: number): string => (r * 2).toFixed(r * 2 < 1 ? 3 : 2) + '\u{1F351}/M'
  return (
    <div className={css.marketDetail}>
      {row?.description !== undefined && row.description !== '' && (
        <p className={css.marketDesc}>{row.description}</p>
      )}
      {row !== undefined && (
        <div className={css.priceGrid}>
          <span className={css.priceCell}><b>{money(mr)}</b><i>{t('market.priceIn')}</i></span>
          <span className={css.priceCell}><b>{money(mr * cr)}</b><i>{t('market.priceOut')}</i></span>
          {ckr !== undefined && <span className={css.priceCell}><b>{money(mr * ckr)}</b><i>{t('market.priceCacheRead')}</i></span>}
          {ccr !== undefined && <span className={css.priceCell}><b>{money(mr * ccr)}</b><i>{t('market.priceCacheWrite')}</i></span>}
        </div>
      )}
      {candidates.length > 0 && (
        <div className={css.groupPickBox}>
          <span className={css.groupPickLabel}>{t('market.groups')}</span>
          <div className={css.groupPickRow}>
            {candidates.map(g => (
              <button key={g.name} type="button"
                className={selGroup === g.name || (selGroup === undefined && candidates.length === 1) ? css.groupChipOn : css.groupPickChip}
                onClick={() => { onPickGroup(id, g.name) }}>
                {g.name}
                {g.ratio !== undefined && <b className={css.groupPickRatio}>{`×${g.ratio}`}</b>}
                {g.name === tokenGroup && <em className={css.groupNow}>·{t('market.groupNow')}</em>}
              </button>
            ))}
          </div>
          {candidates.length === 1 && <p className={css.groupPickNote}>{t('market.groupAuto')}</p>}
        </div>
      )}
      {rate !== undefined && (() => {
        const gin = (rate.modelRatio * rate.groupRatio * 2).toFixed(2) + '\u{1F351}', gout = (rate.modelRatio * rate.completionRatio * rate.groupRatio * 2).toFixed(2) + '\u{1F351}'
        return <p className={css.effectivePrice}>{t('market.yourPrice', { gin, gout, ratio: String(rate.groupRatio) })}</p>
      })()}
      <div className={css.detailMeta}>
        <span className={css.ctxBadge}>{t('market.detailCtx', { ctx: spec.badge, out: `${String(Math.round(spec.maxTokens / 1000))}K` })}</span>
        {spec.supportsImage && <span className={css.capChip}>{t('market.detailModality')}</span>}
        {(row?.supported_endpoint_types ?? []).map(ep => <span key={ep} className={css.epChip}>{ep}</span>)}
        {row?.tags !== undefined && row.tags !== '' && <span className={css.marketMeta}>{row.tags}</span>}
        {h !== undefined && (h.ok
          ? <span className={h.mocked ? css.healthMock : css.healthOk}>{h.mocked ? t('market.probedMock') : t('market.probedOk', { ms: String(h.latencyMs ?? 0) })}</span>
          : <span className={css.healthFail}>{t('market.probedFail')}</span>)}
      </div>
    </div>
  )
}


function Playground({ model, t, chat, subscribePlaygroundChunk }: {
  readonly model: string
  readonly t: XPeachTabProps['t']
  readonly chat: XPeachOps['chat']
  readonly subscribePlaygroundChunk?: XPeachOps['subscribePlaygroundChunk']
}): JSX.Element {
  const [prompt, setPrompt] = useState(() => t('play.defaultPrompt'))
  const [play, setPlay] = useState<PlayState>({ status: 'idle' })
  const streamId = useRef('')
  const run = (): void => {
    if (!prompt.trim() || play.status === 'running') return
    const callId = 'pg-' + Math.random().toString(36).slice(2, 10)
    streamId.current = callId
    let buf = ''
    setPlay({ status: 'running', content: '' })
    const unsub = subscribePlaygroundChunk === undefined ? undefined : subscribePlaygroundChunk((chunk) => {
      if (chunk.callId !== streamId.current) return
      buf += chunk.delta
      setPlay(prev => prev.status === 'running' ? { status: 'running', content: buf } : prev)
    })
    void chat(model, prompt, callId).then((reply) => {
      if (unsub !== undefined) unsub()
      if ('error' in reply) { setPlay({ status: 'fail', message: reply.error }); return }
      setPlay({
        status: 'ok',
        content: reply.content,
        meta: `${(reply.latencyMs / 1000).toFixed(1)}s · ${reply.promptTokens}+${reply.completionTokens} tok`,
      })
    })
  }
  return (
    <div className={css.playBox}>
      <textarea className={css.playInput} rows={3} value={prompt}
        placeholder={t('pg.promptPh')} onChange={(e) => { setPrompt(e.target.value) }} />
      <button type="button" className={css.playRun} disabled={play.status === 'running'}
        onClick={run}>{play.status === 'running' ? t('pg.running') : t('pg.run')}</button>
      {play.status === 'running' && play.content !== undefined && play.content.length > 0 && (
        <div className={css.playReply}>
          <p className={css.playText}>{play.content}<span className={css.playCursor}>▍</span></p>
        </div>)}
      {play.status === 'ok' && (
        <div className={css.playReply}>
          <p className={css.playText}>{play.content}</p>
          <span className={css.playMeta}>{play.meta}</span>
        </div>)}
      {play.status === 'fail' && <p className={css.bindError}>{play.message}</p>}
    </div>
  )
}

/** The right-pane console tab body. */
export function XPeachTab({
  t, sessionId, load, models, keyState, bind, chat, mountedModels, addModel, selectModel,
  subscribePlaygroundChunk, subscribeCredentialChange, adminOverview, adminUsers, adminTokens,
  adminPricing, adminLogs, modelHealth, billingRate, groupCatalog, priceSync, sessionBound,
  userSelf, userTokens, userTopup, stripeAmount, stripePay, adminChannels, adminRedemptions,
  adminRedemptionCreate, adminOptionSet, adminChannelSave, adminChannelDelete, adminChannelTest,
  adminTokenCreate, adminTokenDelete, adminOptions, adminModelPricing, adminModelPricingPatch,
  adminUserGet, adminUserUpdate, adminUserManage, userTokenCreate, userTokenUpdate, userTokenDelete,
  userSelfEdit, userAff, userTokenKey, importDeepseek, siteCatalog, setGroups, syncModels,
  userLogs, userLogStat, recentSessions, openPlugins, networkStatus, networkProbe, networkAuto, networkRoute,
  onboardingScan, importConversations, macosInstallerStatus, macosInstallerAction,
}: XPeachTabProps): JSX.Element {
  const [state, setState] = useState<State>(() => {
    try {
      const raw = localStorage.getItem('xpeach.tab.data.v1')
      if (raw !== null) {
        const parsed = JSON.parse(raw) as XPeachData
        if (parsed.usage !== undefined) return { status: 'ready', data: parsed }
      }
    } catch (_err) {
      // Ignore invalid cache
    }
    return { status: 'loading' }
  })
  const [catalog, setCatalog] = useState<readonly XPeachModel[]>([])
  const [mounted, setMounted] = useState<readonly string[]>([])
  const [keyMask, setKeyMask] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem('xpeach.tab.keyState.v1')
      if (raw !== null) return (JSON.parse(raw) as { preview?: string | null }).preview ?? null
    } catch (_err) { /* ignore */ }
    return null
  })
  const [adminBound, setAdminBound] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('xpeach.tab.keyState.v1')
      if (raw !== null) return (JSON.parse(raw) as { adminBound?: boolean }).adminBound === true
    } catch (_err) { /* ignore */ }
    return false
  })
  const [seg, setSeg] = useState<Seg>('overview')
  const [query, setQuery] = useState('')
  const [logModel, setLogModel] = useState<string | null>(null)
  const [logLimit, setLogLimit] = useState(20)
  const [logExpand, setLogExpand] = useState<number | null>(null)
  const [logChipsOpen, setLogChipsOpen] = useState(false)
  const [openPlay, setOpenPlay] = useState<string | null>(null)
  const [added, setAdded] = useState<Record<string, string>>({})
  const [health, setHealth] = useState<Map<string, XPeachHealthRow> | null>(null)
  const [priceMap, setPriceMap] = useState<Map<string, XPeachPricingRow>>(new Map())
  type GroupMetaMap = Record<string, { desc?: string; models?: readonly string[]; ratio?: string | number }>
  const [groupMeta, setGroupMeta] = useState<GroupMetaMap | undefined>(undefined)
  const [marketView, setMarketView] = useState<'all' | 'groups'>('all')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [groupIdx, setGroupIdx] = useState<Map<string, { name: string; ratio: number | undefined }[]> | undefined>(undefined)
  const [selGroup, setSelGroup] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('xpeach.selGroup')
      return raw !== null ? JSON.parse(raw) as Record<string, string> : {}
    } catch (_storageError) {
      return {}
    }
  })
  const pickGroup = (model: string, group: string): void => {
    setSelGroup((prev) => {
      const next = { ...prev, [model]: group }
      try {
        localStorage.setItem('xpeach.selGroup', JSON.stringify(next))
      } catch (_quotaExceeded) {
        // Storage quota exceeded; keep in-memory state.
      }
      return next
    })
  }
  const [siteCat, setSiteCat] = useState<XPeachSiteCatalog | undefined>(undefined)
  const [groupSel, setGroupSel] = useState<readonly string[]>([])
  const [groupBusy, setGroupBusy] = useState(false)
  const [groupMsg, setGroupMsg] = useState<string | null>(null)
  const [network, setNetwork] = useState<XPeachNetworkSnapshot | undefined>(undefined)
  const [netBusy, setNetBusy] = useState(false)
  const loadCatalog = (): void => {
    void siteCatalog().then((c) => {
      if ('error' in c) { setSiteCat(undefined); return }
      setSiteCat(c)
      setGroupSel(c.tokenGroups)
    })
  }
  useEffect(() => {
    if (keyMask !== null && seg === 'market') loadCatalog()
  }, [keyMask, seg])
  const applyGroups = (): void => {
    setGroupBusy(true); setGroupMsg(null)
    void setGroups([...groupSel]).then((r) => {
      setGroupBusy(false)
      if ('error' in r) { setGroupMsg(r.error); return }
      setGroupMsg(t('market.synced', { n: r.count }))
      loadCatalog()
      void models().then((m) => { if (Array.isArray(m)) setCatalog(m) })
    })
  }
  const loadNetwork = (force = false): void => {
    setNetBusy(true)
    void (force ? networkProbe() : networkStatus()).then((r) => {
      setNetBusy(false)
      if (!('error' in r)) setNetwork(r)
    })
  }
  useEffect(() => {
    if (seg !== 'network') return
    loadNetwork()
    const timer = setInterval(() => {
      void networkStatus().then((r) => { if (!('error' in r)) setNetwork(r) })
    }, 10_000)
    return () => { clearInterval(timer) }
  }, [seg])
  const applyGroup = (model: string, group: string): void => {
    pickGroup(model, group)
    const current = siteCat?.tokenGroups ?? []
    if (current.includes(group)) { setGroupMsg(t('market.groupApplied')); return }
    if (current.length >= 16) { setGroupMsg(t('market.groupLimit')); return }
    void setGroups([...current, group]).then((r) => {
      if ('error' in r) { setGroupMsg(r.error); return }
      setGroupMsg(t('market.appliedGroup', { name: group }))
      loadCatalog()
      void models().then((m) => { if (Array.isArray(m)) setCatalog(m) })
    })
  }
  const doSyncModels = (): void => {
    setGroupBusy(true); setGroupMsg(null)
    void syncModels().then((r) => {
      setGroupBusy(false)
      setGroupMsg('error' in r ? r.error : t('market.synced', { n: r.count }))
      void models().then((m) => { if (Array.isArray(m)) setCatalog(m) })
    })
  }
  const [loginKey, setLoginKey] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const doLogin = async (): Promise<void> => {
    setLoginBusy(true); setLoginErr(null)
    const err = await bind(loginKey)
    setLoginBusy(false)
    if (err !== null) { setLoginErr(err); return }
    setLoginKey('')
    refresh()
  }
  const [priceAt, setPriceAt] = useState<{ at: number; stale: boolean } | undefined>(undefined)
  const syncPrice = (force = false): void => {
    void priceSync(force).then((r) => {
      if (!('error' in r)) setPriceAt({ at: r.at, stale: r.stale })
    })
  }
  useEffect(() => {
    if (seg === 'market') syncPrice(false)
  }, [priceSync, seg])
  useEffect(() => {
    if (seg !== 'market' || groupIdx !== undefined) return
    let alive = true
    void groupCatalog().then((cat) => {
      if (!alive || 'error' in cat) return
      const idx = new Map<string, { name: string; ratio: number | undefined }[]>()
      for (const [name, g] of Object.entries(cat)) {
        const ratio = typeof g.ratio === 'string' ? Number(g.ratio) : g.ratio
        for (const m of g.models ?? []) {
          const arr = idx.get(m) ?? []
          arr.push({ name, ratio: typeof ratio === 'number' && ratio > 0 ? ratio : undefined })
          idx.set(m, arr)
        }
      }
      setGroupIdx(idx)
      setGroupMeta(cat)
    })
    return () => { alive = false }
  }, [groupCatalog, groupIdx, seg])
  const [expand, setExpand] = useState<string | null>(null)
  const [probing, setProbing] = useState(false)
  const [speedSort, setSpeedSort] = useState(false)
  const [pins, setPins] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('xpeach.pins') ?? '[]') as string[])
    } catch (_storageError) {
      return new Set()
    }
  })
  const togglePin = (id: string): void => {
    setPins((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try {
        localStorage.setItem('xpeach.pins', JSON.stringify([...next]))
      } catch (_quotaExceeded) {
        // Storage quota exceeded; keep in-memory state.
      }
      return next
    })
  }
  const refresh = (): void => {
    void load().then((result) => {
      if (result.usage === undefined) {
        setState(prev => prev.status === 'ready' ? prev : { status: 'error', message: result.error ?? t('status.unavailable') })
        return
      }
      try { localStorage.setItem('xpeach.tab.data.v1', JSON.stringify(result)) } catch (_err) { /* ignore */ }
      setState({ status: 'ready', data: result })
    })
    void keyState().then((s) => {
      const nextPreview = s.bound ? (s.preview ?? null) : null
      const nextAdmin = s.adminBound === true
      setKeyMask(nextPreview)
      setAdminBound(nextAdmin)
      try {
        localStorage.setItem('xpeach.tab.keyState.v1', JSON.stringify({ preview: nextPreview, adminBound: nextAdmin }))
      } catch (_err) { /* ignore */ }
    })
    if (seg === 'market') {
      void models().then((m) => { if (Array.isArray(m)) setCatalog(m) })
      void mountedModels().then(setMounted)
    }
  }
  useEffect(() => {
    if (seg !== 'market') return
    void models().then((m) => { if (Array.isArray(m)) setCatalog(m) })
    void mountedModels().then(setMounted)
  }, [seg, models, mountedModels])
  useEffect(refresh, [load])
  useEffect(() => subscribeCredentialChange(refresh), [subscribeCredentialChange])
  useEffect(() => {
    const id = setInterval(refresh, 60_000)
    return () => { clearInterval(id) }
  }, [])

  const logs = state.status === 'ready' ? (state.data.logs ?? []) : []
  const lastCall = logs.length > 0 ? logs[0] : undefined
  const billedGroupByModel = useMemo(() => {
    const m = new Map<string, string>()
    for (const l of logs) {
      if (l.group !== undefined && l.group !== '' && !m.has(l.model_name)) m.set(l.model_name, l.group)
    }
    return m
  }, [logs])
  const logModels = useMemo(() => [...new Set(logs.map(e => e.model_name))].filter(id => isBrandSafe(id)), [logs])
  const shownLogs = useMemo(
    () => logModel === null ? logs : logs.filter(e => e.model_name === logModel),
    [logs, logModel])
  useEffect(() => {
    if (!adminBound || priceMap.size > 0 || (seg !== 'market' && seg !== 'site')) return
    let alive = true
    void adminPricing().then((cat) => {
      if (!alive || 'error' in cat) return
      const map = new Map<string, XPeachPricingRow>()
      for (const e of cat.entries) map.set(e.model_name, e)
      setPriceMap(map)
    })
    return () => { alive = false }
  }, [adminBound, adminPricing, priceMap.size, seg])
  // Every model the site prices (not just the token's current groups), joined
  // with the token catalog so mounted/known models keep their metadata.
  const allModelIds = useMemo(() => {
    const ids = new Set<string>([...priceMap.keys(), ...catalog.map(model => model.id)])
    return [...ids].filter(id => isBrandSafe(id))
  }, [priceMap, catalog])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = activeGroup === null
      ? allModelIds
      : allModelIds.filter(id => (groupIdx?.get(id) ?? []).some(group => group.name === activeGroup))
    const safe = pool.map(id => catalog.find(model => model.id === id) ?? { id })
    const scoped = q === '' ? safe : safe.filter(m => m.id.toLowerCase().includes(q))
    const sorted = (!speedSort || health === null) ? scoped : [...scoped].sort((a, b) => {
      const ha = health.get(a.id), hb = health.get(b.id)
      if (ha === undefined || hb === undefined) return Number(ha === undefined) - Number(hb === undefined)
      return Number(hb.ok) - Number(ha.ok) || (ha.latencyMs ?? 9e9) - (hb.latencyMs ?? 9e9)
    })
    return pins.size === 0 ? sorted : [...sorted].sort((a, b) => Number(pins.has(b.id)) - Number(pins.has(a.id)))
  }, [allModelIds, catalog, activeGroup, groupIdx, query, speedSort, health, pins])
  const mountedSet = useMemo(() => new Set(mounted), [mounted])
  const joinModel = (id: string): void => {
    setAdded(prev => ({ ...prev, [id]: 'adding' }))
    void addModel(id).then(async (err) => {
      if (err !== null) { setAdded(prev => ({ ...prev, [id]: err })); return }
      void mountedModels().then(setMounted)
      const selErr = selectModel === undefined ? null : await selectModel(sessionId, id)
      setAdded(prev => ({ ...prev, [id]: selErr === null ? 'added' : selErr }))
    })
  }

  return (
    <div className={css.tabRoot} data-seg={seg}>
      <header className={css.tabHead}>
        <div className={css.consoleBrand}>
          <span className={css.consoleBrandBadge} aria-hidden="true">
            <XPeachMark size={22} />
          </span>
          <div className={css.pageHeadText}>
            <h2 className={css.pageTitle}>{t('tab.title')}</h2>
            <p className={css.pageIntro}>
              <span className={ `${css.statusDot} ${css.statusDotOk}` } aria-hidden="true" />
              <span>{SITE.host}{keyMask !== null ? ' · ' + keyMask : ''}{priceAt !== undefined ? ' · ' + t('price.synced', { at: rel(Math.floor(priceAt.at / 1000), t('time.justNow'), n => t('time.minAgo', { n })) }) + (priceAt.stale ? ' ⚠' : '') : ''}</span>
            </p>
          </div>
        </div>
        <div className={css.consoleNavWrap}>
          <nav className={css.segRow}>
            {([['overview', 'console.seg.overview'], ['market', 'console.seg.market'], ['logs', 'console.seg.logs'], ['network', 'console.seg.network'], ['user', 'console.seg.user']] as const).map(([k, key]) => (
              <button key={k} type="button" onClick={() => { setSeg(k) }}
                className={seg === k ? css.segOn : css.segOff}>{t(key)}</button>
            ))}
            {adminBound && (
              <button type="button" onClick={() => { setSeg('site') }}
                className={seg === 'site' ? css.segOn : css.segOff}>{t('console.seg.site')}</button>
            )}
          </nav>
          {(() => {
            const desktopUpdates = (globalThis as typeof globalThis & {
              dshDesktop?: { protocolVersion?: number; updates?: { open?: () => Promise<void> } }
            }).dshDesktop?.updates
            if (typeof desktopUpdates?.open !== 'function') return null
            return (
              <button
                type="button"
                className={css.iconButton}
                onClick={() => { void desktopUpdates.open?.() }}
                title={t('console.checkUpdate')}
                aria-label={t('console.checkUpdate')}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2.25v7.5M5 6.75 8 9.75l3-3M3 12.75h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )
          })()}
          <button type="button" className={css.iconButton} onClick={() => { refresh(); syncPrice(true) }} title={t('pill.refresh')} aria-label={t('pill.refreshAria')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89M13.5 1.5v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </header>
      {state.status === 'loading' && seg !== 'overview' && (
        <div className={css.skelWrap} aria-busy="true" aria-label={t('status.loading')}>
          <div className={css.usageGrid}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={css.skelCell}>
                <i className={css.skelLine} style={{ width: '40%' }} />
                <i className={css.skelLine} style={{ width: '70%', height: 18 }} />
              </div>
            ))}
          </div>
          <div className={css.skelCard}>
            <i className={css.skelLine} style={{ width: '30%' }} />
            {Array.from({ length: 6 }, (_, i) => <i key={i} className={css.skelLine} style={{ width: `${92 - i * 7}%` }} />)}
          </div>
        </div>
      )}
      {state.status === 'error' && (
        <div className={css.loginCard}>
          <XPeachMark size={26} />
          <h3 className={css.loginTitle}>{t('bind.title')}</h3>
          <button
            type="button"
            className={css.bindButton}
            style={{ width: '100%', maxWidth: '340px', marginBottom: '8px' }}
            onClick={() => { openXPeachLoginModal(true) }}
          >
            {t('sso.loginBtn')}
          </button>
          <p className={css.bindHint}>{t('bind.hint')} <a href={SITE.accessToken} target="_blank" rel="noreferrer">{t('bind.getKey')}</a></p>
          <div className={css.bindRow}>
            <input className={css.bindInput} type="password" placeholder={t('bind.placeholder')}
              value={loginKey} onChange={(e) => { setLoginKey(e.target.value) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loginBusy) void doLogin() }} />
            <button type="button" className={css.bindButton}
              disabled={loginBusy || loginKey.trim() === ''}
              onClick={() => { void doLogin() }}>{loginBusy ? t('bind.working') : t('bind.submit')}</button>
          </div>
          {loginErr !== null && <p className={css.bindError}>{loginErr}</p>}
        </div>
      )}
      {state.status !== 'error' && seg === 'overview' && (
        <XPeachProfile
          t={t}
          userSelf={userSelf}
          userLogs={userLogs}
          userLogStat={userLogStat}
          recentSessions={recentSessions}
          openPlugins={openPlugins}
          macosInstallerStatus={macosInstallerStatus}
          macosInstallerAction={macosInstallerAction}
          onEditProfile={() => { setSeg('user') }}
        />
      )}
      {state.status === 'ready' && seg === 'market' && (
        <>
          <dl className={css.usageGrid}>
            <div className={css.usageCell}>
              <dt>{t('market.stat.total')}</dt>
              <dd>{allModelIds.length}</dd>
            </div>
            <div className={css.usageCell}>
              <dt>{t('market.stat.mounted')}</dt>
              <dd>{mounted.length}</dd>
            </div>
            <div className={css.usageCell}>
              <dt>{t('market.stat.groups')}</dt>
              <dd>{groupSel.length || (siteCat?.tokenGroups.length ?? 0)}</dd>
            </div>
          </dl>

          <section className={css.marketDeck}>
            <div className={css.marketToolbar}>
              <div className={css.marketSearchWrap}>
                <input className={css.marketSearch} value={query} placeholder={t('market.searchPh')}
                  onChange={(e) => { setQuery(e.target.value) }} />
              </div>
              <div className={css.marketViewRow}>
                <button type="button" className={marketView === 'all' ? css.segOn : css.segOff}
                  onClick={() => { setMarketView('all'); setActiveGroup(null) }}>{t('market.all')}</button>
                <button type="button" className={marketView === 'groups' ? css.segOn : css.segOff}
                  onClick={() => { setMarketView('groups') }}>{t('market.byGroup')}</button>
              </div>
              <button type="button" className={css.probeBtn} disabled={probing}
                onClick={() => {
                  setProbing(true)
                  void modelHealth().then((rows) => {
                    if (!('error' in rows)) setHealth(new Map(rows.map(r => [r.id, r])))
                    setProbing(false)
                  })
                }}>{probing ? t('market.probing') : '⚡ ' + t('market.probe')}</button>
              {health !== null && (
                <button type="button" className={speedSort ? css.probeBtnOn : css.probeBtn}
                  onClick={() => { setSpeedSort(v => !v) }}>{t('market.speedSort')}</button>
              )}
              <button type="button" className={css.probeBtn} disabled={groupBusy} onClick={doSyncModels}>{t('market.syncModels')}</button>
              <span className={css.marketMeta}>{filtered.length} {t('market.count')}</span>
            </div>

            {activeGroup !== null && (
              <div className={css.marketTools}>
                <span className={css.groupPickLabel}>{t('market.groupFilter', { name: activeGroup })}</span>
                <button type="button" className={css.probeBtn} onClick={() => { setActiveGroup(null) }}>{t('market.clearGroup')}</button>
              </div>
            )}

            {siteCat !== undefined && (
              <div className={css.groupBar}>
                <span className={css.groupPickLabel}>{t('market.tokenGroups')}</span>
                {siteCat.groups.filter(g => g.models > 0).map((g) => {
                  const on = groupSel.includes(g.name)
                  return (
                    <button key={g.name} type="button" className={on ? css.groupChipOn : css.groupPickChip}
                      onClick={() => {
                        if (!on && groupSel.length >= 16) { setGroupMsg(t('market.groupLimit')); return }
                        setGroupSel(prev => on ? prev.filter(x => x !== g.name) : [...prev, g.name])
                      }}>
                      {g.name}<b className={css.groupPickRatio}>{g.models}</b>
                    </button>
                  )
                })}
                <button type="button" className={css.probeBtnOn} disabled={groupBusy || groupSel.length === 0} onClick={applyGroups}>
                  {groupBusy ? t('market.syncing') : t('market.applyGroups')}
                </button>
                <span className={css.groupPickLabel}>{groupSel.length}/16</span>
                {groupMsg !== null && <span className={css.groupPickLabel}>{groupMsg}</span>}
              </div>
            )}

            {marketView === 'groups' && groupMeta !== undefined && (
              <div className={css.groupCards}>
                {Object.entries(groupMeta)
                  .filter(([, group]) => (group.models?.length ?? 0) > 0)
                  .sort((a, b) => (b[1].models?.length ?? 0) - (a[1].models?.length ?? 0))
                  .map(([name, group]) => (
                    <button key={name} type="button"
                      className={activeGroup === name ? css.groupCardOn : css.groupCard}
                      onClick={() => { setActiveGroup(activeGroup === name ? null : name) }}>
                      <span className={css.groupCardName}>{name}</span>
                      <span className={css.groupCardMeta}>
                        {t('market.groupModels', { n: String(group.models?.length ?? 0) })}{group.ratio !== undefined && ' · ×' + String(group.ratio)}
                      </span>
                      {group.desc !== undefined && group.desc !== '' && <span className={css.groupCardDesc}>{group.desc}</span>}
                    </button>
                  ))}
              </div>
            )}
          </section>

          <ul className={css.marketList}>
            {filtered.map((m) => {
              const inLib = mountedSet.has(m.id)
              const st = added[m.id] ?? 'idle'
              const spec = inferClientModelSpec(m.id, m.contextWindow, m.maxTokens)
              return (
                <li key={m.id} className={css.marketRow}>
                  <div className={css.marketHead} role="button" tabIndex={0}
                    aria-expanded={expand === m.id}
                    onClick={() => { setExpand(expand === m.id ? null : m.id) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') setExpand(expand === m.id ? null : m.id) }}>
                    <svg className={expand === m.id ? css.expandOn : css.expandOff} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className={css.marketGlyph} data-fam={familyOf(m.id)} aria-hidden="true">{glyphOf(m.id)}</span>
                    <button type="button" className={pins.has(m.id) ? css.pinOn : css.pinOff} aria-label={t('market.pin')}
                      onClick={(e) => { e.stopPropagation(); togglePin(m.id) }}>★</button>
                    <code className={css.marketId}>{m.id}</code>
                    <span
                      className={css.ctxBadge}
                      title={t('market.ctxTitle', { ctx: spec.contextWindow.toLocaleString(), out: spec.maxTokens.toLocaleString() })}
                    >
                      {spec.badge}
                    </span>
                    {spec.supportsImage && <span className={css.capChip}>{t('market.capVision')}</span>}
                    <span className={css.capChip}>{t('market.capReasoningHigh')}</span>
                    {(() => { const gs = (m.groups ?? []).filter(g => isBrandSafe(g)); return <>
                      {gs.slice(0, 2).map(g => <span key={g} className={css.groupChip}>{g}</span>)}
                      {gs.length > 2 && <span className={css.groupChipMore} title={gs.join(', ')}>+{gs.length - 2}</span>}
                    </> })()}
                    {(() => { const h = health?.get(m.id); return h === undefined ? null : h.ok
                      ? <span className={css.healthOk} title={t('unit.ms', { n: String(h.latencyMs ?? 0) })}>{t('unit.ms', { n: String(h.latencyMs ?? 0) })}</span>
                      : h.mocked
                        ? <span className={css.healthMock} title={h.error}>{'⚠'}</span>
                        : <span className={css.healthFail} title={h.error}>{'✗'}</span> })()}
                    <span className={css.marketOwner}>{[m.owned_by ?? m.provider, ...(m.supported_endpoint_types ?? [])].filter(Boolean).join(' · ')}</span>
                    {inLib && <span className={css.marketIn}>{t('market.inLib')}</span>}
                    {(() => { const pr = priceMap.get(m.id); if (pr === undefined) return null; const mr = pr.model_ratio ?? 0, cr = pr.completion_ratio ?? 1; return <span className={css.priceTag}>{[(mr * 2).toFixed(2), '\u2192', (mr * cr * 2).toFixed(2), '\u{1F351}/M'].join('')}</span> })()}
                    <div className={css.marketActs} onClick={(e) =>{  e.stopPropagation() }}>
                      <button type="button" className={css.marketBtn}
                        onClick={() => { setOpenPlay(openPlay === m.id ? null : m.id) }}>
                        {openPlay === m.id ? t('market.tryClose') : t('market.try')}
                      </button>
                      {inLib
                        ? null
                        : st === 'added'
                          ? <span className={css.marketIn}>✓ {t('market.addedSelected')}</span>
                          : st === 'adding'
                            ? <span className={css.marketMeta}>{t('market.adding')}</span>
                            : typeof st === 'string' && st !== 'idle'
                              ? <span className={css.bindError}>{st}</span>
                              : <button type="button" className={css.marketBtn} onClick={() => { joinModel(m.id) }}>{t('market.join')}</button>}
                    </div>
                  </div>
                  {expand === m.id && (
                    <MarketDetail
                      id={m.id}
                      model={m}
                      row={priceMap.get(m.id)}
                      h={health?.get(m.id)}
                      t={t}
                      billingRate={billingRate}
                      groupCatalog={groupIdx}
                      selGroup={selGroup[m.id]}
                      tokenGroup={billedGroupByModel.get(m.id)}
                      onPickGroup={applyGroup}
                    />
                  )}
                  {openPlay === m.id && <Playground model={m.id} t={t} chat={chat} subscribePlaygroundChunk={subscribePlaygroundChunk} />}
                </li>
              )
            })}
            {filtered.length === 0 && <li className={css.emptyState}><span className={css.emptyMark} aria-hidden="true"><XPeachMark size={24} /></span><span>{t('market.empty')}</span></li>}
          </ul>
        </>
      )}
      {state.status === 'ready' && seg === 'logs' && (
        <>
          <dl className={css.usageGrid}>
            <div className={css.usageCell}>
              <dt>{t('logs.stat.count')}</dt>
              <dd>{shownLogs.length}</dd>
            </div>
            <div className={css.usageCell}>
              <dt>{t('logs.stat.tokens')}</dt>
              <dd>{shownLogs.reduce((acc, e) => acc + e.prompt_tokens + e.completion_tokens, 0).toLocaleString()}</dd>
            </div>
            <div className={css.usageCell}>
              <dt>{t('logs.stat.cost')}</dt>
              <dd>{callUsd(shownLogs.reduce((acc, e) => acc + e.quota, 0))}</dd>
            </div>
            <div className={css.usageCell}>
              <dt>{t('logs.stat.avgTime')}</dt>
              <dd>{shownLogs.length === 0 ? '—' : t('unit.s', { n: (shownLogs.reduce((acc, e) => acc + e.use_time, 0) / shownLogs.length).toFixed(1) })}</dd>
            </div>
          </dl>

          <section className={css.bentoCard}>
            <div className={css.bentoCardHead}>
              <p className={css.groupTitle}>
                <span>{t('logs.title')}</span>
                {lastCall !== undefined && <span className={css.freshTag}>{rel(lastCall.created_at, t('time.justNow'), n => t('time.minAgo', { n }))}</span>}
              </p>
              <button type="button" className={css.exportBtn} onClick={() => {
                const head = 'time,model,group,channel,prompt_tokens,completion_tokens,quota,use_time_s,stream,request_id'
                const lines = shownLogs.map(e => [new Date(e.created_at * 1000).toISOString(), e.model_name, e.group ?? '', e.channel, e.prompt_tokens, e.completion_tokens, e.quota, e.use_time, e.is_stream, e.request_id ?? ''].join(','))
                const blob = new Blob([head + '\n' + lines.join('\n')], { type: 'text/csv' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'xpeach-logs.csv'
                a.click()
                URL.revokeObjectURL(a.href)
              }}>{t('logs.csv')}</button>
            </div>

            {logModels.length > 1 && (
              <div className={css.logFilter}>
                <button type="button" className={logModel === null ? css.logChipOn : css.logChip}
                  onClick={() => { setLogModel(null) }}>{t('logs.all')}</button>
                {(logChipsOpen ? logModels : logModels.slice(0, 9)).map(id => (
                  <button key={id} type="button" className={logModel === id ? css.logChipOn : css.logChip}
                    onClick={() => { setLogModel(logModel === id ? null : id) }}>{id}</button>
                ))}
                {logModels.length > 9 && (
                  <button type="button" className={css.logChip} onClick={() => { setLogChipsOpen(v => !v) }}>
                    {logChipsOpen ? t('logs.chipsLess') : t('logs.chipsMore', { n: logModels.length - 9 })}
                  </button>
                )}
              </div>
            )}

            <ul className={css.tabLogs}>
              {shownLogs.slice(0, logLimit).map((entry) => {
                const other = parseOther(entry.other)
                return (
                  <li key={entry.id} className={css.logRowWrap}>
                    <div className={css.logRowHead} role="button" tabIndex={0}
                      aria-expanded={logExpand === entry.id}
                      onClick={() => { setLogExpand(logExpand === entry.id ? null : entry.id) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') setLogExpand(logExpand === entry.id ? null : entry.id) }}>
                      <svg className={logExpand === entry.id ? css.expandOn : css.expandOff} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className={css.logModel}>{entry.model_name.replace(/deepseek/gi, 'ds')}</span>
                      {entry.group !== undefined && entry.group !== '' && <span className={css.groupChip}>{entry.group}</span>}
                      <span className={css.logMeta}>{rel(entry.created_at, t('time.justNow'), n => t('time.minAgo', { n }))} · {t('unit.tok', { n: `${entry.prompt_tokens}+${entry.completion_tokens}` })} · {t('unit.s', { n: String(entry.use_time) })}</span>
                      <span className={css.logCost}>{callUsd(entry.quota)}</span>
                    </div>
                    {logExpand === entry.id && (
                      <dl className={css.logDetail}>
                        <div><dt>{t('logs.group')}</dt><dd>{entry.group ?? '—'}</dd></div>
                        <div><dt>{t('logs.channel')}</dt><dd>{entry.channel}</dd></div>
                        <div><dt>{t('logs.reqId')}</dt><dd><code className={css.keyMask}>{entry.request_id ?? '—'}</code></dd></div>
                        <div><dt>{t('logs.stream')}</dt><dd>{entry.is_stream ? '✓' : '—'}</dd></div>
                        {other?.cache_tokens !== undefined && <div><dt>{t('logs.cacheTok')}</dt><dd>{other.cache_tokens}</dd></div>}
                        {other?.group_ratio !== undefined && <div><dt>{t('logs.gr')}</dt><dd>×{other.group_ratio}</dd></div>}
                        {other?.frt !== undefined && <div><dt>{t('logs.frt')}</dt><dd>{t('unit.ms', { n: String(other.frt) })}</dd></div>}
                        {other?.billing_mode !== undefined && <div><dt>{t('logs.mode')}</dt><dd>{other.billing_mode}</dd></div>}
                        {decodeExpr(other?.expr_b64) !== undefined && (
                          <div className={css.logDetailWide}><dt>{t('logs.expr')}</dt><dd><code>{decodeExpr(other?.expr_b64)}</code></dd></div>
                        )}
                      </dl>
                    )}
                  </li>
                )
              })}
              {shownLogs.length === 0 && <li className={css.emptyState}><span>{t('logs.empty')}</span></li>}
            </ul>
            {shownLogs.length > logLimit && (
              <button type="button" className={css.logMore} onClick={() => { setLogLimit(logLimit + 40) }}>
                {t('logs.more', { shown: String(Math.min(logLimit, shownLogs.length)), total: String(shownLogs.length) })}
              </button>
            )}
            {shownLogs.length <= logLimit && shownLogs.length > 20 && (
              <p className={css.logMoreMeta}>{t('logs.allShown', { total: String(shownLogs.length) })}</p>
            )}
          </section>
        </>
      )}
      {seg === 'network' && (
        <>
          <div className={css.networkHead}>
            <div>
              <p className={css.sparkTitle}>{t('network.current')}</p>
              <p className={css.networkActiveHost}>{network?.active.replace(/^https?:\/\//, '') ?? '—'}</p>
            </div>
            <label className={css.networkAuto}>
              <input type="checkbox" checked={network?.auto ?? true} onChange={(e) => {
                const auto = e.target.checked
                setNetBusy(true)
                void networkAuto(auto).then((r) => { setNetBusy(false); if (!('error' in r)) setNetwork(r) })
              }} />
              {t('network.auto')}
            </label>
            <button type="button" className={css.probeBtn} disabled={netBusy} onClick={() => { loadNetwork(true) }}>
              {netBusy ? t('network.testing') : t('network.test')}
            </button>
          </div>
          <div className={css.networkGrid}>
            {(network?.probes ?? []).map((probe) => {
              const active = network?.active === probe.url
              const history = network?.history[probe.id] ?? []
              const maxLatency = Math.max(...history.map(point => point.latencyMs ?? 0), 1)
              return (
                <button key={probe.id} type="button" className={active ? css.networkCardOn : css.networkCard}
                  onClick={() => {
                    setNetBusy(true)
                    void networkRoute(probe.url).then((r) => { setNetBusy(false); if (!('error' in r)) setNetwork(r) })
                  }}>
                  <span className={css.networkLabel}>
                    {probe.label}
                    {active && <em className={css.networkBadge}>{t('network.active')}</em>}
                  </span>
                  <span className={css.networkHost}>{probe.url.replace(/^https?:\/\//, '')}</span>
                  <span className={css.networkMetrics}>
                    <b>{probe.latencyMs === undefined ? '—' : t('unit.ms', { n: String(probe.latencyMs) })}</b>
                    <span>{t('network.loss')} {Math.round(probe.loss * 100)}%</span>
                  </span>
                  <span className={css.networkSpark} aria-hidden="true">
                    {history.map((point, index) => (
                      <i key={index} data-empty={point.latencyMs === undefined}
                        style={{ height: `${Math.max(2, ((point.latencyMs ?? maxLatency) / maxLatency) * 26)}px` }} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
          <p className={css.profileMeta}>{t('network.updated', { at: network === undefined ? '—' : new Date(network.at).toLocaleTimeString() })}</p>
        </>
      )}
      {seg === 'user' && (
        <XPeachUser t={t} sessionBound={sessionBound} userSelf={userSelf} userTokens={userTokens}
          userTopup={userTopup} stripeAmount={stripeAmount} stripePay={stripePay}
          userTokenCreate={userTokenCreate} userTokenUpdate={userTokenUpdate} userTokenDelete={userTokenDelete}
          userSelfEdit={userSelfEdit} userAff={userAff} userTokenKey={userTokenKey} importDeepseek={importDeepseek}
          onboardingScan={onboardingScan} importConversations={importConversations}
          macosInstallerStatus={macosInstallerStatus} macosInstallerAction={macosInstallerAction} />
      )}
      {seg === 'site' && adminBound && (
        <XPeachAdmin
          t={t}
          ops={{
            adminOverview, adminUsers, adminTokens, adminPricing, adminLogs,
            adminChannels, adminRedemptions, adminRedemptionCreate, adminOptionSet,
            adminChannelSave, adminChannelDelete, adminChannelTest, adminTokenCreate,
            adminTokenDelete, adminOptions, adminModelPricing, adminModelPricingPatch,
            adminUserGet, adminUserUpdate, adminUserManage,
          } as XPeachOps}
        />
      )}
    </div>
  )
}
/**
 * Provider-family letter tile: one pastel-hued glyph per family so the market
 * list reads like the plugin manager's package cards instead of a text dump.
 */
function familyOf(id: string): string {
  const m = /^(claude|gemini|grok|gpt|glm|mimo|qwen|kimi|swe|deepseek|doubao|minimax)/i.exec(id)
  return m?.[1]?.toLowerCase() ?? 'other'
}
function glyphOf(id: string): string {
  const fam = familyOf(id)
  return ({ claude: '◐', gemini: '✦', grok: '◮', gpt: '◈', glm: '◇', mimo: '◍', qwen: '▣', kimi: '◆', swe: '◆', deepseek: '◈', doubao: '◉', minimax: '▦' } as Record<string, string>)[fam] ?? '○'
}
