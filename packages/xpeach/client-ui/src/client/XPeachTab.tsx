/** XPeach right-pane console: account + full site model market + playground. */
import { type JSX, useEffect, useMemo, useRef, useState } from 'react'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type {
  XPeachData,
  XPeachHealthRow,
  XPeachModelPerfDetail,
  XPeachModelPerfSummary,
  XPeachNetworkSnapshot,
  XPeachOps,
  XPeachPerfGroupRow,
  XPeachPricingRow,
  XPeachSiteCatalog,
} from './ops.ts'
import { XPeachAdmin } from './XPeachAdmin.tsx'
import { XPeachUser } from './XPeachUser.tsx'
import { XPeachProfile } from './XPeachProfile.tsx'
import { openXPeachLoginModal } from './XPeachOnboarding.tsx'
import { XPeachMark } from './brand.tsx'
import type { XPeachModel } from '@xpeach/xph-account/types'
import { rel, callUsd, isBrandSafe, SITE, parseOther, decodeExpr } from './fmt.ts'
import {
  buildHourlySuccessBars,
  formatCompactModelPrice,
  formatModelLatency,
  formatModelTps,
  formatSuccessRate,
  gradeSuccessRate,
  inferClientModelSpec,
  updateClientModelTelemetryCache,
} from './model-meta.tsx'
import css from './xpeach.module.css'

/** Pane-tab props: runtime share + locale + injected ops (session scope). */
export type XPeachTabProps =
  { readonly sessionId?: string | undefined } & PropsLocale<'xpeach.account'> & InjectFace<XPeachOps>

type State =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; data: XPeachData }
  | { readonly status: 'error'; message: string }

type Seg = 'overview' | 'market' | 'logs' | 'network' | 'site' | 'user'

type MarketSortMode = 'default' | 'tps' | 'latency' | 'success' | 'price'

type PlayState =
  | { readonly status: 'idle' }
  | { readonly status: 'running'; content?: string }
  | { readonly status: 'ok'; content: string; meta: string }
  | { readonly status: 'fail'; message: string }

/** Expanded market row: site description, per-million price table, per-group 24h performance & pricing table, endpoints, health. */
function MarketDetail({
  id,
  model,
  row,
  h,
  t,
  billingRate,
  perfMetricsDetail,
  groupCatalog,
  selGroup,
  tokenGroup,
  onPickGroup,
}: {
  readonly id: string
  readonly model?: XPeachModel | undefined
  readonly row: XPeachPricingRow | undefined
  readonly h: { ok: boolean; mocked?: boolean | undefined; latencyMs?: number | undefined; error?: string | undefined } | undefined
  readonly t: XPeachTabProps['t']
  readonly billingRate: XPeachOps['billingRate'] | undefined
  readonly perfMetricsDetail?: XPeachOps['perfMetricsDetail'] | undefined
  /** Model → candidate groups index built from the merged group catalog. */
  readonly groupCatalog: ReadonlyMap<string, { name: string; ratio: number | undefined; desc?: string | undefined }[]> | undefined
  readonly selGroup: string | undefined
  readonly tokenGroup: string | undefined
  readonly onPickGroup: (model: string, group: string) => void
}): JSX.Element {
  const [rate, setRate] = useState<{ modelRatio: number; completionRatio: number; cacheRatio: number; groupRatio: number } | undefined>()
  const [perfDetail, setPerfDetail] = useState<XPeachModelPerfDetail | undefined>(undefined)
  const [perfLoading, setPerfLoading] = useState(false)

  useEffect(() => {
    if (billingRate === undefined) return
    let alive = true
    void billingRate(id, selGroup).then((r) => { if (alive && r !== undefined && !('error' in r)) setRate(r) })
    return () => { alive = false }
  }, [id, selGroup, billingRate])

  useEffect(() => {
    if (perfMetricsDetail === undefined) return
    let alive = true
    setPerfLoading(true)
    void perfMetricsDetail(id, 24).then((res) => {
      if (!alive) return
      setPerfLoading(false)
      if (!('error' in res)) {
        setPerfDetail(res)
      }
    }).catch(() => {
      if (alive) setPerfLoading(false)
    })
    return () => { alive = false }
  }, [id, perfMetricsDetail])

  const candidates = groupCatalog?.get(id) ?? []
  const spec = inferClientModelSpec(id, model?.contextWindow, model?.maxTokens)
  const mr = row?.model_ratio ?? 0
  const cr = row?.completion_ratio ?? 1
  const ckr = row?.cache_ratio
  const ccr = row?.create_cache_ratio
  const money = (r: number): string => (r * 2).toFixed(r * 2 < 1 ? 3 : 2) + '\u{1F351}/M'

  const mergedGroupRows = useMemo(() => {
    const perfByGroup = new Map<string, XPeachPerfGroupRow>()
    for (const gRow of perfDetail?.groups ?? []) {
      if (gRow.group.length > 0) perfByGroup.set(gRow.group, gRow)
    }
    const candidateNames = new Set(candidates.map(c => c.name))
    const allGroups: { name: string; ratio: number | undefined; desc?: string | undefined; perf?: XPeachPerfGroupRow | undefined }[] =
      candidates.map(c => ({
        name: c.name,
        ratio: c.ratio,
        desc: c.desc,
        perf: perfByGroup.get(c.name),
      }))
    for (const [groupName, pRow] of perfByGroup) {
      if (!candidateNames.has(groupName) && groupName !== 'default' && groupName !== '管理员分组') {
        allGroups.push({
          name: groupName,
          ratio: undefined,
          perf: pRow,
        })
      }
    }
    return allGroups
  }, [candidates, perfDetail])

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

      {mergedGroupRows.length > 0 && (
        <div className={css.perfGroupSection}>
          <div className={css.perfGroupHead}>
            <p className={css.perfOverviewTitle}>{t('market.detail.perfTitle')}</p>
            <p className={css.perfOverviewSubtitle}>
              {perfLoading
                ? t('market.detail.loadingPerf')
                : (perfDetail?.groups.length ?? 0) === 0
                  ? t('market.detail.noGroupPerf')
                  : t('market.detail.perfSubtitle')}
            </p>
          </div>
          <div className={css.perfGroupTableWrap}>
            <table className={css.perfGroupTable}>
              <thead>
                <tr>
                  <th>{t('market.detail.colGroup')}</th>
                  <th>{t('market.detail.colRatio')}</th>
                  <th>{t('market.detail.colPrice')}</th>
                  <th>{t('market.detail.colTps')}</th>
                  <th>{t('market.detail.colTtft')}</th>
                  <th>{t('market.detail.colLatency')}</th>
                  <th>{t('market.detail.colSuccess')}</th>
                  <th>{t('market.detail.colAction')}</th>
                </tr>
              </thead>
              <tbody>
                {mergedGroupRows.map((gItem) => {
                  const isCurrent = gItem.name === tokenGroup || gItem.name === selGroup
                  const mult = gItem.ratio ?? 1
                  const effPrice = formatCompactModelPrice(row, mult) ?? '—'
                  const gPerf = gItem.perf
                  const grade = gradeSuccessRate(gPerf?.success_rate)
                  const bars = buildHourlySuccessBars(
                    gPerf?.series.map(pt => ({ ts: pt.ts, success_rate: pt.success_rate })),
                    24,
                  )
                  return (
                    <tr key={gItem.name} className={isCurrent ? css.perfGroupRowActive : undefined}>
                      <td>
                        <div className={css.perfGroupNameCell}>
                          <span>
                            <b>{gItem.name}</b>
                            {isCurrent && <em className={css.groupNow}> · {t('market.detail.currentGroup')}</em>}
                          </span>
                          {gItem.desc !== undefined && gItem.desc !== '' && (
                            <span className={css.perfGroupDesc}>{gItem.desc}</span>
                          )}
                        </div>
                      </td>
                      <td>{gItem.ratio !== undefined ? `×${String(gItem.ratio)}` : '×1'}</td>
                      <td><span className={css.priceDetailPill}>{effPrice}</span></td>
                      <td>{formatModelTps(gPerf?.avg_tps)}</td>
                      <td>{formatModelLatency(gPerf?.avg_ttft_ms)}</td>
                      <td>{formatModelLatency(gPerf?.avg_latency_ms)}</td>
                      <td>
                        {gPerf !== undefined ? (
                          <div className={css.modelPerfInline}>
                            <span className={css.perfRatePill} data-grade={grade}>
                              <span className={css.perfStatusDot} />
                              {formatSuccessRate(gPerf.success_rate)}
                            </span>
                            <span className={css.hourlyBars} aria-hidden="true">
                              {bars.map(slot => (
                                <i
                                  key={slot.hourTs}
                                  className={css.hourlyBar}
                                  data-grade={slot.grade}
                                />
                              ))}
                            </span>
                          </div>
                        ) : (
                          <span className={css.marketMeta}>{t('market.perf.noData')}</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={isCurrent ? css.probeBtnOn : css.probeBtn}
                          onClick={() => { onPickGroup(id, gItem.name) }}
                        >
                          {isCurrent ? t('market.detail.currentGroup') : t('market.detail.switchGroup')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={css.detailMeta}>
        <span className={css.ctxBadge}>{t('market.detailCtx', { ctx: spec.badge, out: `${String(Math.round(spec.maxTokens / 1000))}K` })}</span>
        <span className={css.capChip}>{spec.vision ? t('market.detailModality') : t('market.detailModalityText')}</span>
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
  t, sessionId, load, models, keyState, chat, mountedModels, addModel, selectModel,
  subscribePlaygroundChunk, subscribeCredentialChange, adminOverview, adminUsers, adminTokens,
  adminPricing, adminLogs, modelHealth, billingRate, groupCatalog, priceSync, sessionBound,
  userSelf, userTokens, userTopup, stripeAmount, stripePay, adminChannels, adminRedemptions,
  adminRedemptionCreate, adminOptionSet, adminChannelSave, adminChannelDelete, adminChannelTest,
  adminTokenCreate, adminTokenDelete, adminOptions, adminModelPricing, adminModelPricingPatch,
  adminUserGet, adminUserUpdate, adminUserManage, userTokenCreate, userTokenUpdate, userTokenDelete,
  userSelfEdit, userAff, userTokenKey, importDeepseek, siteCatalog, setGroups, syncModels,
  userLogs, userLogStat, recentSessions, openPlugins, networkStatus, networkProbe, networkAuto, networkRoute,
  onboardingScan, importConversations, macosInstallerStatus, macosInstallerAction,
  perfMetricsSummary, perfMetricsDetail,
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
  const [siteAdmin, setSiteAdmin] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('xpeach.tab.keyState.v1')
      if (raw !== null) return (JSON.parse(raw) as { siteAdmin?: boolean }).siteAdmin === true
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
  const [pricingGroupRatio, setPricingGroupRatio] = useState<Readonly<Record<string, number>>>({})
  const [pricingUsableGroup, setPricingUsableGroup] = useState<Readonly<Record<string, string>>>({})
  const [perfMap, setPerfMap] = useState<ReadonlyMap<string, XPeachModelPerfSummary>>(new Map())
  const [perfSyncing, setPerfSyncing] = useState(false)
  const [sortMode, setSortMode] = useState<MarketSortMode>('default')
  type GroupMetaMap = Record<string, { desc?: string; models?: readonly string[]; ratio?: string | number }>
  const [groupMeta, setGroupMeta] = useState<GroupMetaMap | undefined>(undefined)
  const [marketView, setMarketView] = useState<'all' | 'groups'>('all')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [selGroup, setSelGroup] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('xpeach.selGroup')
      return raw !== null ? JSON.parse(raw) as Record<string, string> : {}
    } catch (_storageError) {
      return {}
    }
  })
  const pickGroup = (model: string, group: string): void => {
    if (model.length === 0) return
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
      if (c.tokenGroups[0] !== undefined) {
        updateClientModelTelemetryCache({ activeGroup: c.tokenGroups[0] })
      }
    })
  }
  const loadPerfSummary = (): void => {
    if (perfMetricsSummary === undefined) return
    setPerfSyncing(true)
    void perfMetricsSummary(24).then((rows) => {
      setPerfSyncing(false)
      if ('error' in rows) return
      const m = new Map<string, XPeachModelPerfSummary>()
      for (const r of rows) {
        if (r.model_name.length > 0) {
          m.set(r.model_name, r)
        }
      }
      setPerfMap(m)
      updateClientModelTelemetryCache({ perf: rows })
    }).catch(() => {
      setPerfSyncing(false)
    })
  }
  useEffect(() => {
    if (seg === 'market') {
      loadCatalog()
      loadPerfSummary()
    }
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
      if (typeof document !== 'undefined' && document.hidden) return
      void networkStatus().then((r) => { if (!('error' in r)) setNetwork(r) })
    }, 10_000)
    return () => { clearInterval(timer) }
  }, [seg])
  const applyGroup = (model: string, group: string): void => {
    if (model.length > 0) pickGroup(model, group)
    const current = groupSel.length > 0 ? groupSel : (siteCat?.tokenGroups ?? [])
    if (current[0] === group) { setGroupMsg(t('market.groupApplied')); return }
    const nextGroups = [group, ...current.filter(g => g !== group)].slice(0, 16)
    setGroupSel(nextGroups)
    setGroupBusy(true); setGroupMsg(null)
    updateClientModelTelemetryCache({ activeGroup: group })
    void setGroups(nextGroups).then((r) => {
      setGroupBusy(false)
      if ('error' in r) { setGroupMsg(r.error); return }
      setGroupMsg(t('market.appliedGroup', { name: group }))
      loadCatalog()
      void models().then((m) => { if (Array.isArray(m)) setCatalog(m) })
      void mountedModels().then(setMounted)
    })
  }
  const doSyncModels = (): void => {
    setGroupBusy(true); setGroupMsg(null)
    void syncModels().then((r) => {
      setGroupBusy(false)
      setGroupMsg('error' in r ? r.error : t('market.synced', { n: r.count }))
      void models().then((m) => { if (Array.isArray(m)) setCatalog(m) })
      void mountedModels().then(setMounted)
    })
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
    if (seg !== 'market') return
    let alive = true
    void groupCatalog().then((cat) => {
      if (!alive || 'error' in cat) return
      setGroupMeta(cat)
    })
    return () => { alive = false }
  }, [groupCatalog, seg, keyMask])
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
      if (nextAdmin) {
        void userSelf().then((me) => {
          if ('error' in me) return
          const isAdmin = (me.role ?? 0) >= 10 || me.group === '管理员分组'
          setSiteAdmin(isAdmin)
          if (!isAdmin) setSeg(prev => prev === 'site' ? 'overview' : prev)
          try {
            localStorage.setItem('xpeach.tab.keyState.v1', JSON.stringify({ preview: nextPreview, adminBound: nextAdmin, siteAdmin: isAdmin }))
          } catch (_err) { /* ignore */ }
        })
      } else {
        setSiteAdmin(false)
        setSeg(prev => prev === 'site' ? 'overview' : prev)
        try {
          localStorage.setItem('xpeach.tab.keyState.v1', JSON.stringify({ preview: nextPreview, adminBound: nextAdmin, siteAdmin: false }))
        } catch (_err) { /* ignore */ }
      }
    })
    if (seg === 'market') {
      void models().then((m) => { if (Array.isArray(m)) setCatalog(m) })
      void mountedModels().then(setMounted)
      loadCatalog()
      loadPerfSummary()
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
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      refresh()
    }, 60_000)
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
    if (seg !== 'market' && seg !== 'site') return
    let alive = true
    void adminPricing().then((cat) => {
      if (!alive || 'error' in cat) return
      const map = new Map<string, XPeachPricingRow>()
      for (const e of cat.entries) map.set(e.model_name, e)
      setPriceMap(map)
      setPricingGroupRatio(cat.groupRatio)
      if (cat.usableGroup !== undefined) setPricingUsableGroup(cat.usableGroup)
      updateClientModelTelemetryCache({ pricing: cat })
    })
    return () => { alive = false }
  }, [adminBound, keyMask, adminPricing, seg])

  const { mergedGroupMeta, mergedGroupIdx, availableGroups } = useMemo(() => {
    const modelSets = new Map<string, Set<string>>()
    const ratios = new Map<string, number>()
    const descs = new Map<string, string>()

    const ensureGroup = (gName: string): Set<string> => {
      let s = modelSets.get(gName)
      if (s === undefined) {
        s = new Set<string>()
        modelSets.set(gName, s)
      }
      return s
    }

    for (const [gName, g] of Object.entries(groupMeta ?? {})) {
      if (gName.length === 0) continue
      const set = ensureGroup(gName)
      for (const m of g.models ?? []) {
        if (typeof m === 'string' && m.length > 0) set.add(m)
      }
      const numRatio = typeof g.ratio === 'string' ? Number(g.ratio) : g.ratio
      if (typeof numRatio === 'number' && Number.isFinite(numRatio) && numRatio >= 0) {
        ratios.set(gName, numRatio)
      }
      if (typeof g.desc === 'string' && g.desc.length > 0) {
        descs.set(gName, g.desc)
      }
    }

    for (const [gName, r] of Object.entries(pricingGroupRatio)) {
      if (typeof r === 'number' && Number.isFinite(r) && !ratios.has(gName)) {
        ratios.set(gName, r)
      }
    }
    for (const [gName, d] of Object.entries(pricingUsableGroup)) {
      if (typeof d === 'string' && d.length > 0 && !descs.has(gName)) {
        descs.set(gName, d)
      }
    }

    const usableKeys = Object.keys(pricingUsableGroup)
    const usableSet = usableKeys.length > 0 ? new Set(usableKeys) : undefined
    for (const [modelName, pRow] of priceMap.entries()) {
      for (const gName of pRow.enable_groups ?? []) {
        if (gName.length === 0) continue
        if (usableSet !== undefined && !usableSet.has(gName) && !modelSets.has(gName)) continue
        ensureGroup(gName).add(modelName)
      }
    }

    for (const m of catalog) {
      for (const gName of m.groups ?? []) {
        if (typeof gName === 'string' && gName.length > 0) {
          ensureGroup(gName).add(m.id)
        }
      }
    }

    for (const g of siteCat?.groups ?? []) {
      ensureGroup(g.name)
      if (g.ratio !== undefined && !ratios.has(g.name)) ratios.set(g.name, g.ratio)
      if (g.desc !== undefined && g.desc.length > 0 && !descs.has(g.name)) descs.set(g.name, g.desc)
    }

    const metaOut: Record<string, { desc?: string; models: readonly string[]; ratio?: number }> = {}
    const idxOut = new Map<string, { name: string; ratio: number | undefined; desc?: string | undefined }[]>()

    for (const [gName, mSet] of modelSets.entries()) {
      const modelsArr = [...mSet]
      const r = ratios.get(gName)
      const d = descs.get(gName)
      metaOut[gName] = {
        models: modelsArr,
        ...(r !== undefined ? { ratio: r } : {}),
        ...(d !== undefined ? { desc: d } : {}),
      }
      for (const mId of modelsArr) {
        const arr = idxOut.get(mId) ?? []
        if (!arr.some(item => item.name === gName)) {
          arr.push({ name: gName, ratio: r, desc: d })
          idxOut.set(mId, arr)
        }
      }
    }

    const avail = Object.entries(metaOut)
      .filter(([name, info]) => name !== 'default' && name !== '管理员分组' && info.models.length > 0)
      .map(([name, info]) => ({
        name,
        models: info.models.length,
        ratio: info.ratio,
        desc: info.desc,
      }))
      .sort((a, b) => b.models - a.models)

    return { mergedGroupMeta: metaOut, mergedGroupIdx: idxOut, availableGroups: avail }
  }, [groupMeta, pricingGroupRatio, pricingUsableGroup, priceMap, catalog, siteCat])

  const allModelIds = useMemo(() => {
    const ids = new Set<string>([
      ...priceMap.keys(),
      ...catalog.map(model => model.id),
      ...perfMap.keys(),
    ])
    for (const g of Object.values(mergedGroupMeta)) {
      for (const mId of g.models) ids.add(mId)
    }
    return [...ids]
  }, [priceMap, catalog, perfMap, mergedGroupMeta])

  const perfOverview = useMemo(() => {
    const activePerf = [...perfMap.values()].filter(
      item => item.success_rate > 0 || item.avg_tps > 0 || item.avg_latency_ms > 0,
    )
    if (activePerf.length === 0) return undefined
    const avgSuccess = activePerf.reduce((acc, item) => acc + item.success_rate, 0) / activePerf.length
    const tpsItems = activePerf.filter(item => item.avg_tps > 0)
    const avgTps = tpsItems.length > 0
      ? tpsItems.reduce((acc, item) => acc + item.avg_tps, 0) / tpsItems.length
      : 0
    const latItems = activePerf.filter(item => item.avg_latency_ms > 0)
    const avgLat = latItems.length > 0
      ? latItems.reduce((acc, item) => acc + item.avg_latency_ms, 0) / latItems.length
      : 0
    return {
      count: activePerf.length,
      avgSuccess,
      avgTps,
      avgLat,
    }
  }, [perfMap])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const activeGroupSet = activeGroup === null
      ? undefined
      : new Set(mergedGroupMeta[activeGroup]?.models ?? [])
    const pool = activeGroup === null
      ? allModelIds
      : allModelIds.filter(
        id => (activeGroupSet?.has(id) ?? false)
          || (mergedGroupIdx.get(id) ?? []).some(group => group.name === activeGroup),
      )
    const safe = pool.map((id): XPeachModel => {
      const catEntry = catalog.find(model => model.id === id)
      const groupsFromIdx = (mergedGroupIdx.get(id) ?? [])
        .map(g => g.name)
        .filter(gName => gName !== 'default' && gName !== '管理员分组')
      if (catEntry !== undefined) {
        return groupsFromIdx.length > 0
          ? { ...catEntry, groups: groupsFromIdx }
          : catEntry
      }
      return groupsFromIdx.length > 0
        ? { id, groups: groupsFromIdx }
        : { id }
    })
    const scoped = q === '' ? safe : safe.filter(m => m.id.toLowerCase().includes(q))

    const sorted = [...scoped].sort((a, b) => {
      const pinDiff = Number(pins.has(b.id)) - Number(pins.has(a.id))
      if (pinDiff !== 0) return pinDiff
      if (speedSort && health !== null) {
        const ha = health.get(a.id), hb = health.get(b.id)
        if (ha !== undefined || hb !== undefined) {
          if (ha === undefined || hb === undefined) return Number(ha === undefined) - Number(hb === undefined)
          return Number(hb.ok) - Number(ha.ok) || (ha.latencyMs ?? 9e9) - (hb.latencyMs ?? 9e9)
        }
      }
      if (sortMode === 'tps') {
        const ta = perfMap.get(a.id)?.avg_tps ?? -1
        const tb = perfMap.get(b.id)?.avg_tps ?? -1
        if (tb !== ta) return tb - ta
      } else if (sortMode === 'latency') {
        const la = perfMap.get(a.id)?.avg_latency_ms ?? 0
        const lb = perfMap.get(b.id)?.avg_latency_ms ?? 0
        const va = la > 0 ? la : 9e9
        const vb = lb > 0 ? lb : 9e9
        if (va !== vb) return va - vb
      } else if (sortMode === 'success') {
        const sa = perfMap.get(a.id)?.success_rate ?? -1
        const sb = perfMap.get(b.id)?.success_rate ?? -1
        if (sb !== sa) return sb - sa
      } else if (sortMode === 'price') {
        const pa = priceMap.get(a.id)
        const pb = priceMap.get(b.id)
        const va = pa?.quota_type === 1 ? (pa.model_price ?? 9e9) : (pa?.model_ratio !== undefined ? pa.model_ratio * 2 : 9e9)
        const vb = pb?.quota_type === 1 ? (pb.model_price ?? 9e9) : (pb?.model_ratio !== undefined ? pb.model_ratio * 2 : 9e9)
        if (va !== vb) return va - vb
      }
      return 0
    })
    return sorted
  }, [allModelIds, catalog, activeGroup, mergedGroupMeta, mergedGroupIdx, query, speedSort, health, pins, sortMode, perfMap, priceMap])

  const mountedSet = useMemo(() => new Set(mounted), [mounted])
  const joinModel = (id: string): void => {
    setAdded(prev => ({ ...prev, [id]: 'adding' }))
    void (async () => {
      const currentGroups = groupSel.length > 0 ? groupSel : (siteCat?.tokenGroups ?? [])
      const currentPrimary = currentGroups[0]
      const modelGroups = (mergedGroupIdx.get(id) ?? []).map(g => g.name)
      const explicitGroup = activeGroup !== null && (modelGroups.length === 0 || modelGroups.includes(activeGroup))
        ? activeGroup
        : selGroup[id]
      const needsPrimarySwitch = explicitGroup !== undefined
        ? explicitGroup !== currentPrimary
        : (currentPrimary !== undefined && modelGroups.length > 0 && !modelGroups.includes(currentPrimary))
      const targetGroup = explicitGroup ?? (needsPrimarySwitch ? modelGroups[0] : undefined)
      if (targetGroup !== undefined && targetGroup !== currentPrimary) {
        const nextGroups = [targetGroup, ...currentGroups.filter(g => g !== targetGroup)].slice(0, 16)
        setGroupSel(nextGroups)
        updateClientModelTelemetryCache({ activeGroup: targetGroup })
        const groupRes = await setGroups(nextGroups)
        if (!('error' in groupRes)) {
          setGroupMsg(t('market.appliedGroup', { name: targetGroup }))
          loadCatalog()
          void models().then((m) => { if (Array.isArray(m)) setCatalog(m) })
        }
      }
      const err = await addModel(id)
      if (err !== null) {
        setAdded(prev => ({ ...prev, [id]: err }))
        return
      }
      void mountedModels().then(setMounted)
      const selErr = selectModel === undefined ? null : await selectModel(sessionId, id)
      setAdded(prev => ({
        ...prev,
        [id]: selErr === null ? 'added' : selErr === 'no active session' ? t('market.noActiveSession') : selErr,
      }))
    })()
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
              <span>{SITE.host}{priceAt !== undefined ? ' · ' + t('price.synced', { at: rel(Math.floor(priceAt.at / 1000), t('time.justNow'), n => t('time.minAgo', { n })) }) + (priceAt.stale ? ' ⚠' : '') : ''}</span>
            </p>
          </div>
        </div>
        <div className={css.consoleNavWrap}>
          <nav className={css.segRow}>
            {([['overview', 'console.seg.overview'], ['market', 'console.seg.market'], ['logs', 'console.seg.logs'], ['network', 'console.seg.network'], ['user', 'console.seg.user']] as const).map(([k, key]) => (
              <button key={k} type="button" onClick={() => { setSeg(k) }}
                className={seg === k ? css.segOn : css.segOff}>{t(key)}</button>
            ))}
            {adminBound && siteAdmin && (
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
          <h3 className={css.loginTitle}>{t('onb.loginTitle')}</h3>
          <button
            type="button"
            className={css.bindButton}
            style={{ width: '100%', maxWidth: '340px', marginTop: '4px' }}
            onClick={() => { openXPeachLoginModal(true) }}
          >
            {t('sso.loginBtn')}
          </button>
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

          {perfOverview !== undefined && (
            <section className={css.perfOverviewCard}>
              <div className={css.perfOverviewHead}>
                <div className={css.perfOverviewTitleWrap}>
                  <h3 className={css.perfOverviewTitle}>
                    <span className={css.perfStatusDot} style={{ color: '#10b981' }} />
                    {t('market.perf.title')}
                  </h3>
                  <p className={css.perfOverviewSubtitle}>{t('market.perf.subtitle')}</p>
                </div>
                <button
                  type="button"
                  className={css.probeBtn}
                  disabled={perfSyncing}
                  onClick={loadPerfSummary}
                >
                  {perfSyncing ? t('market.perf.refreshing') : t('market.perf.refresh')}
                </button>
              </div>
              <div className={css.perfOverviewStats}>
                <div className={css.perfStatCell}>
                  <span className={css.perfStatLabel}>{t('market.perf.avgSuccess')}</span>
                  <span className={css.perfStatValue}>
                    <span
                      className={css.perfRatePill}
                      data-grade={gradeSuccessRate(perfOverview.avgSuccess)}
                    >
                      <span className={css.perfStatusDot} />
                      {formatSuccessRate(perfOverview.avgSuccess)}
                    </span>
                  </span>
                </div>
                <div className={css.perfStatCell}>
                  <span className={css.perfStatLabel}>{t('market.perf.avgTps')}</span>
                  <span className={css.perfStatValue}>{formatModelTps(perfOverview.avgTps)}</span>
                </div>
                <div className={css.perfStatCell}>
                  <span className={css.perfStatLabel}>{t('market.perf.avgLatency')}</span>
                  <span className={css.perfStatValue}>{formatModelLatency(perfOverview.avgLat)}</span>
                </div>
                <div className={css.perfStatCell}>
                  <span className={css.perfStatLabel}>{t('market.perf.monitoredModels')}</span>
                  <span className={css.perfStatValue}>{perfOverview.count}</span>
                </div>
              </div>
            </section>
          )}

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

            <div className={css.sortBar}>
              {([
                ['default', 'market.sort.default'],
                ['tps', 'market.sort.tps'],
                ['latency', 'market.sort.latency'],
                ['success', 'market.sort.successRate'],
                ['price', 'market.sort.price'],
              ] as const).map(([modeKey, labelKey]) => (
                <button
                  key={modeKey}
                  type="button"
                  className={sortMode === modeKey ? css.sortPillOn : css.sortPill}
                  onClick={() => { setSortMode(modeKey) }}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>

            {availableGroups.length > 0 && (
              <div className={css.groupFilterBar}>
                <span className={css.groupPickLabel}>{t('market.groupFilter.label')}</span>
                <button
                  type="button"
                  className={activeGroup === null ? css.groupFilterChipOn : css.groupFilterChip}
                  onClick={() => { setActiveGroup(null) }}
                >
                  {t('market.groupFilter.all', { n: String(allModelIds.length) })}
                </button>
                {availableGroups.map((g) => {
                  const isSelected = activeGroup === g.name
                  const isPrimary = (groupSel[0] ?? siteCat?.tokenGroups[0]) === g.name
                  return (
                    <button
                      key={g.name}
                      type="button"
                      className={isSelected ? css.groupFilterChipOn : css.groupFilterChip}
                      onClick={() => {
                        const nextActive = isSelected ? null : g.name
                        setActiveGroup(nextActive)
                        if (nextActive !== null && !isPrimary && !groupBusy) {
                          applyGroup('', nextActive)
                        }
                      }}
                    >
                      <span>{g.name}</span>
                      <b className={css.groupPickRatio}>{g.models}</b>
                      {g.ratio !== undefined && <span className={css.groupPickRatio}>×{g.ratio}</span>}
                      {isPrimary && <em className={css.groupNow}>·{t('market.groupCard.activePrimary')}</em>}
                    </button>
                  )
                })}
              </div>
            )}

            {activeGroup !== null && (() => {
              const gMeta = mergedGroupMeta[activeGroup]
              const primaryGroup = groupSel[0] ?? siteCat?.tokenGroups[0]
              const isPrimary = primaryGroup === activeGroup
              return (
                <div className={css.activeGroupBanner}>
                  <div className={css.activeGroupBannerInfo}>
                    <div className={css.activeGroupBannerTitle}>
                      <span>{t('market.groupFilter.modelsInGroup', { group: activeGroup, n: String(filtered.length) })}</span>
                      {gMeta?.ratio !== undefined && (
                        <span className={css.priceDetailPill}>
                          {t('market.price.effectiveMult', { mult: String(gMeta.ratio) })}
                        </span>
                      )}
                      {isPrimary && (
                        <span className={css.marketIn}>{t('market.groupFilter.isPrimary')}</span>
                      )}
                    </div>
                    {gMeta?.desc !== undefined && gMeta.desc !== '' && (
                      <span className={css.activeGroupBannerDesc}>{gMeta.desc}</span>
                    )}
                  </div>
                  <div className={css.activeGroupBannerActions}>
                    {!isPrimary && (
                      <button
                        type="button"
                        className={css.probeBtnOn}
                        disabled={groupBusy}
                        onClick={() => { applyGroup('', activeGroup) }}
                      >
                        {t('market.groupFilter.switchPrimary')}
                      </button>
                    )}
                    <button type="button" className={css.probeBtn} onClick={() => { setActiveGroup(null) }}>
                      {t('market.clearGroup')}
                    </button>
                  </div>
                </div>
              )
            })()}

            {(siteCat !== undefined || availableGroups.length > 0) && (
              <div className={css.groupBar}>
                <span className={css.groupPickLabel}>
                  {t('market.tokenGroups')}
                  {(siteCat?.tokenName !== undefined || siteCat?.keyTail !== undefined) && (
                    <em className={css.groupNow}>
                      ·{siteCat.tokenName ?? '…' + (siteCat.keyTail ?? '')}
                    </em>
                  )}
                </span>
                {(availableGroups.length > 0 ? availableGroups : (siteCat?.groups.filter(g => g.models > 0) ?? [])).map((g) => {
                  const on = groupSel.includes(g.name)
                  return (
                    <button key={g.name} type="button" className={on ? css.groupChipOn : css.groupPickChip}
                      onClick={() => {
                        if (!on && groupSel.length >= 16) { setGroupMsg(t('market.groupLimit')); return }
                        setGroupSel(prev => prev[0] === g.name
                          ? prev.filter(x => x !== g.name)
                          : [g.name, ...prev.filter(x => x !== g.name)])
                      }}>
                      {g.name}<b className={css.groupPickRatio}>{g.models}</b>
                      {groupSel[0] === g.name && <em className={css.groupNow}>·{t('market.groupNow')}</em>}
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

            {marketView === 'groups' && availableGroups.length > 0 && (
              <div className={css.groupCards}>
                {availableGroups.map((group) => {
                  const isSelected = activeGroup === group.name
                  const isPrimary = (groupSel[0] ?? siteCat?.tokenGroups[0]) === group.name
                  return (
                    <button key={group.name} type="button"
                      className={isSelected ? css.groupCardOn : css.groupCard}
                      onClick={() => {
                        const nextActive = isSelected ? null : group.name
                        setActiveGroup(nextActive)
                        if (nextActive !== null && !isPrimary && !groupBusy) {
                          applyGroup('', nextActive)
                        }
                      }}>
                      <span className={css.groupCardName}>
                        {group.name}
                        {isPrimary && <em className={css.groupNow}> · {t('market.groupCard.activePrimary')}</em>}
                      </span>
                      <span className={css.groupCardMeta}>
                        {t('market.groupModels', { n: String(group.models) })}{group.ratio !== undefined && ' · ×' + String(group.ratio)}
                      </span>
                      {group.desc !== undefined && group.desc !== '' && <span className={css.groupCardDesc}>{group.desc}</span>}
                      <span className={css.groupPickRatio}>{t('market.groupCard.viewModels', { n: String(group.models) })}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <ul className={css.marketList}>
            {filtered.map((m) => {
              const inLib = mountedSet.has(m.id)
              const st = added[m.id] ?? 'idle'
              const spec = inferClientModelSpec(m.id, m.contextWindow, m.maxTokens)
              const perf = perfMap.get(m.id)
              const perfGrade = gradeSuccessRate(perf?.success_rate)
              const hourlyBars = perf !== undefined ? buildHourlySuccessBars(perf.recent_success_series, 24) : []
              const pr = priceMap.get(m.id)
              const targetGroup = activeGroup ?? selGroup[m.id] ?? billedGroupByModel.get(m.id) ?? siteCat?.tokenGroups[0]
              const groupMult = targetGroup !== undefined
                ? (mergedGroupMeta[targetGroup]?.ratio ?? pricingGroupRatio[targetGroup] ?? 1)
                : 1
              const compactPrice = formatCompactModelPrice(pr, groupMult)
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
                    {spec.vision && <span className={css.capChip}>{t('market.capVision')}</span>}
                    {spec.reasoning && <span className={css.capChip}>{t('market.capReasoningHigh')}</span>}
                    {(() => {
                      const gs = (m.groups ?? []).filter(g => isBrandSafe(g))
                      return (
                        <>
                          {gs.slice(0, 2).map(g => (
                            <span
                              key={g}
                              className={css.groupChip}
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveGroup(activeGroup === g ? null : g)
                              }}
                            >
                              {g}
                            </span>
                          ))}
                          {gs.length > 2 && <span className={css.groupChipMore} title={gs.join(', ')}>+{gs.length - 2}</span>}
                        </>
                      )
                    })()}
                    {perf !== undefined && (
                      <span className={css.modelPerfInline}>
                        <span className={css.hourlyBars} aria-hidden="true">
                          {hourlyBars.map(slot => (
                            <i
                              key={slot.hourTs}
                              className={css.hourlyBar}
                              data-grade={slot.grade}
                            />
                          ))}
                        </span>
                        <span className={css.perfRatePill} data-grade={perfGrade}>
                          <span className={css.perfStatusDot} />
                          {formatSuccessRate(perf.success_rate)}
                        </span>
                        {perf.avg_tps > 0 && (
                          <span className={css.perfMetricPill}>{formatModelTps(perf.avg_tps)}</span>
                        )}
                        {perf.avg_latency_ms > 0 && (
                          <span className={css.perfMetricPill}>{formatModelLatency(perf.avg_latency_ms)}</span>
                        )}
                      </span>
                    )}
                    {(() => { const h = health?.get(m.id); return h === undefined ? null : h.ok
                      ? <span className={css.healthOk} title={t('unit.ms', { n: String(h.latencyMs ?? 0) })}>{t('unit.ms', { n: String(h.latencyMs ?? 0) })}</span>
                      : h.mocked
                        ? <span className={css.healthMock} title={h.error}>{'⚠'}</span>
                        : <span className={css.healthFail} title={h.error}>{'✗'}</span> })()}
                    <span className={css.marketOwner}>{[m.owned_by ?? m.provider, ...(m.supported_endpoint_types ?? [])].filter(Boolean).join(' · ')}</span>
                    {inLib && <span className={css.marketIn}>{t('market.inLib')}</span>}
                    {compactPrice !== undefined && (
                      <span className={css.priceDetailPill}>
                        <span>{compactPrice}</span>
                        {groupMult !== 1 && (
                          <span className={css.priceDiscountBadge}>×{groupMult}</span>
                        )}
                      </span>
                    )}
                    <div className={css.marketActs} onClick={(e) => { e.stopPropagation() }}>
                      <button type="button" className={css.marketBtn}
                        onClick={() => { setOpenPlay(openPlay === m.id ? null : m.id) }}>
                        {openPlay === m.id ? t('market.tryClose') : t('market.try')}
                      </button>
                      {st === 'added'
                        ? <span className={css.marketIn}>✓ {t(inLib ? 'market.selected' : 'market.addedSelected')}</span>
                        : st === 'adding'
                          ? <span className={css.marketMeta}>{t('market.adding')}</span>
                          : typeof st === 'string' && st !== 'idle'
                            ? <span className={css.bindError}>{st}</span>
                            : <button type="button" className={css.marketBtn} onClick={() => { joinModel(m.id) }}>{t(inLib ? 'market.select' : 'market.join')}</button>}
                    </div>
                  </div>
                  {expand === m.id && (
                    <MarketDetail
                      id={m.id}
                      model={m}
                      row={pr}
                      h={health?.get(m.id)}
                      t={t}
                      billingRate={billingRate}
                      perfMetricsDetail={perfMetricsDetail}
                      groupCatalog={mergedGroupIdx}
                      selGroup={selGroup[m.id] ?? activeGroup ?? undefined}
                      tokenGroup={billedGroupByModel.get(m.id) ?? siteCat?.tokenGroups[0]}
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
                        {other?.frt !== undefined && other.frt >= 0 && <div><dt>{t('logs.frt')}</dt><dd>{t('unit.ms', { n: String(other.frt) })}</dd></div>}
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
          macosInstallerStatus={macosInstallerStatus} macosInstallerAction={macosInstallerAction}
          siteCatalog={siteCatalog} setGroups={setGroups} />
      )}
      {seg === 'site' && adminBound && siteAdmin && (
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
