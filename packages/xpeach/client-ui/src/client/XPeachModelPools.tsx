/**
 * XPeach 3-Endpoint Model Pools Studio (`Settings → Models` header slot).
 *
 * Displays all XPeach models partitioned across the three wire-protocol pools
 * (`OpenAI Chat Completions`, `OpenAI Responses API`, `Anthropic Messages`),
 * supports drag-and-drop cross-pool endpoint switching and intra-pool ordering,
 * multi-select batch transfers, gateway URL & session-header controls, and a
 * per-model invocation configuration modal backed by `xpeach.model-routing.json`.
 */
import { type DragEvent, type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Modal } from '@xpeach/xph-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type { XPeachKey } from './locales.ts'
import type {
  XPeachEndpointPoolId,
  XPeachModelCallSettings,
  XPeachModelCompatSettings,
  XPeachModelPoolEntry,
  XPeachModelPoolsSnapshot,
  XPeachModelReasoningLevel,
  XPeachModelRoutingState,
  XPeachOps,
} from './ops.ts'
import css from './xpeach.module.css'

/** Operations subset required by the XPeach 3-Endpoint Model Pools Studio. */
export type XPeachModelPoolsOps = Pick<
  XPeachOps,
  | 'modelPoolsSnapshot'
  | 'modelPoolsSave'
  | 'modelPoolsReset'
  | 'syncModels'
  | 'selectModel'
>

/** Props injected into {@link XPeachModelPools}. */
export type XPeachModelPoolsProps = PropsLocale<'xpeach.account'> & InjectFace<XPeachModelPoolsOps>

interface PoolDescriptor {
  readonly poolId: XPeachEndpointPoolId
  readonly titleKey: XPeachKey
  readonly routeKey: XPeachKey
  readonly descKey: XPeachKey
}

const POOL_DESCRIPTORS: readonly PoolDescriptor[] = [
  {
    poolId: 'openai-completions',
    titleKey: 'pools.pool.chat.title',
    routeKey: 'pools.pool.chat.route',
    descKey: 'pools.pool.chat.desc',
  },
  {
    poolId: 'openai-responses',
    titleKey: 'pools.pool.responses.title',
    routeKey: 'pools.pool.responses.route',
    descKey: 'pools.pool.responses.desc',
  },
  {
    poolId: 'anthropic-messages',
    titleKey: 'pools.pool.anthropic.title',
    routeKey: 'pools.pool.anthropic.route',
    descKey: 'pools.pool.anthropic.desc',
  },
]

const ALL_EFFORTS: readonly XPeachModelReasoningLevel[] = [
  'off',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
]

const THINKING_FORMAT_OPTIONS: readonly NonNullable<XPeachModelCompatSettings['thinkingFormat']>[] = [
  'openai',
  'deepseek',
  'qwen',
  'zai',
  'openrouter',
  'chat-template',
  'qwen-chat-template',
]

const MAX_TOKENS_FIELD_OPTIONS: readonly NonNullable<XPeachModelCompatSettings['maxTokensField']>[] = [
  'max_completion_tokens',
  'max_tokens',
]

const CTX_WINDOW_PRESETS: readonly number[] = [65_536, 128_000, 200_000, 262_144, 1_000_000]
const MAX_OUTPUT_PRESETS: readonly number[] = [4_096, 8_192, 16_384, 32_768, 65_536]

type DropTargetKey = XPeachEndpointPoolId | 'disabled'
type TriStateValue = 'auto' | 'on' | 'off'

interface ModelDetailDraft {
  readonly modelId: string
  readonly recommendedEndpoint: XPeachEndpointPoolId
  readonly defaultCtx: number
  readonly defaultMax: number
  readonly defaultInput: readonly ('text' | 'image')[]
  readonly endpoint: XPeachEndpointPoolId
  readonly disabled: boolean
  readonly displayName: string
  readonly contextWindow: string
  readonly maxTokens: string
  readonly supportsImage: boolean
  readonly defaultReasoning: 'default' | XPeachModelReasoningLevel
  readonly enabledEfforts: readonly XPeachModelReasoningLevel[]
  readonly temperatureRaw: string
  readonly thinkingFormat: '' | NonNullable<XPeachModelCompatSettings['thinkingFormat']>
  readonly maxTokensField: '' | NonNullable<XPeachModelCompatSettings['maxTokensField']>
  readonly supportsDeveloperRole: TriStateValue
  readonly supportsReasoningEffort: TriStateValue
  readonly requiresThinkingAsText: TriStateValue
  readonly supportsStrictMode: TriStateValue
  readonly supportsMaxOutputTokens: TriStateValue
  readonly supportsLongCacheRetention: TriStateValue
  readonly forceAdaptiveThinking: TriStateValue
  readonly supportsTemperature: TriStateValue
  readonly supportsCacheControlOnTools: TriStateValue
  readonly allowEmptySignature: TriStateValue
}

function formatTokenCap(tokens: number): string {
  if (!Number.isFinite(tokens) || tokens <= 0) return '200K'
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000
    return `${m.toFixed(1).replace(/\.0$/u, '')}M`
  }
  if (tokens % 1024 === 0) {
    const k = tokens / 1024
    if (k === 4 || k === 8 || k === 16 || k === 32 || k === 64 || k === 128 || k === 256 || k === 512) {
      return `${String(k)}K`
    }
  }
  return `${String(Math.round(tokens / 1000))}K`
}

function boolToTri(val: boolean | undefined): TriStateValue {
  if (val === true) return 'on'
  if (val === false) return 'off'
  return 'auto'
}

function triToBool(val: TriStateValue): boolean | undefined {
  if (val === 'on') return true
  if (val === 'off') return false
  return undefined
}

function createDraftFromEntry(entry: XPeachModelPoolEntry): ModelDetailDraft {
  return {
    modelId: entry.id,
    recommendedEndpoint: entry.recommendedEndpoint,
    defaultCtx: entry.defaultContextWindow,
    defaultMax: entry.defaultMaxTokens,
    defaultInput: entry.defaultInput,
    endpoint: entry.endpoint,
    disabled: entry.disabled,
    displayName: entry.displayName === entry.id ? '' : entry.displayName,
    contextWindow: String(entry.contextWindow),
    maxTokens: String(entry.maxTokens),
    supportsImage: entry.input.includes('image'),
    defaultReasoning: entry.defaultReasoning,
    enabledEfforts: [...entry.enabledEfforts],
    temperatureRaw: entry.temperature === null ? '' : String(entry.temperature),
    thinkingFormat: entry.compat.thinkingFormat ?? '',
    maxTokensField: entry.compat.maxTokensField ?? '',
    supportsDeveloperRole: boolToTri(entry.compat.supportsDeveloperRole),
    supportsReasoningEffort: boolToTri(entry.compat.supportsReasoningEffort),
    requiresThinkingAsText: boolToTri(entry.compat.requiresThinkingAsText),
    supportsStrictMode: boolToTri(entry.compat.supportsStrictMode ?? entry.compat.supportsStrictTools),
    supportsMaxOutputTokens: boolToTri(entry.compat.supportsMaxOutputTokens),
    supportsLongCacheRetention: boolToTri(entry.compat.supportsLongCacheRetention),
    forceAdaptiveThinking: boolToTri(entry.compat.forceAdaptiveThinking),
    supportsTemperature: boolToTri(entry.compat.supportsTemperature),
    supportsCacheControlOnTools: boolToTri(entry.compat.supportsCacheControlOnTools),
    allowEmptySignature: boolToTri(entry.compat.allowEmptySignature),
  }
}

function buildRoutingAfterMove(
  snapshot: XPeachModelPoolsSnapshot,
  modelIds: readonly string[],
  target: DropTargetKey,
  beforeModelId?: string,
): XPeachModelRoutingState {
  const moveSet = new Set(modelIds)
  const current = snapshot.routing
  const overrideMap = new Map<string, XPeachEndpointPoolId>(Object.entries(current.endpointOverrides))
  const settingsMap = new Map<string, XPeachModelCallSettings>(Object.entries(current.modelSettings))
  const nextPoolOrder: Partial<Record<XPeachEndpointPoolId, readonly string[]>> = { ...current.poolOrder }

  const allEntries = new Map<string, XPeachModelPoolEntry>()
  for (const desc of POOL_DESCRIPTORS) {
    for (const item of snapshot.pools[desc.poolId]) allEntries.set(item.id, item)
  }
  for (const item of snapshot.disabledModels) allEntries.set(item.id, item)

  if (target === 'disabled') {
    for (const id of moveSet) {
      settingsMap.set(id, { ...(settingsMap.get(id) ?? {}), disabled: true })
    }
    return {
      ...current,
      endpointOverrides: Object.fromEntries(overrideMap.entries()),
      modelSettings: Object.fromEntries(settingsMap.entries()),
      poolOrder: nextPoolOrder,
    }
  }

  for (const id of moveSet) {
    const entry = allEntries.get(id)
    const recommended = entry?.recommendedEndpoint
    if (recommended !== undefined && target === recommended) {
      overrideMap.delete(id)
    } else {
      overrideMap.set(id, target)
    }
    const curSetting = settingsMap.get(id)
    if (curSetting?.disabled === true) {
      const { disabled: _removed, ...rest } = curSetting
      if (Object.keys(rest).length === 0) settingsMap.delete(id)
      else settingsMap.set(id, rest)
    }
  }

  for (const desc of POOL_DESCRIPTORS) {
    const pId = desc.poolId
    const baseIds = snapshot.pools[pId].map(m => m.id).filter(id => !moveSet.has(id))
    if (pId === target) {
      const orderedMoved = [...modelIds]
      if (beforeModelId !== undefined && baseIds.includes(beforeModelId)) {
        const insertIdx = baseIds.indexOf(beforeModelId)
        baseIds.splice(insertIdx, 0, ...orderedMoved)
      } else {
        baseIds.push(...orderedMoved)
      }
    }
    nextPoolOrder[pId] = baseIds
  }

  return {
    ...current,
    endpointOverrides: Object.fromEntries(overrideMap.entries()),
    poolOrder: nextPoolOrder,
    modelSettings: Object.fromEntries(settingsMap.entries()),
  }
}

function applyOptimisticMove(
  snapshot: XPeachModelPoolsSnapshot,
  modelIds: readonly string[],
  target: DropTargetKey,
  beforeModelId?: string,
): XPeachModelPoolsSnapshot {
  const moveSet = new Set(modelIds)
  const allEntries = new Map<string, XPeachModelPoolEntry>()
  for (const desc of POOL_DESCRIPTORS) {
    for (const item of snapshot.pools[desc.poolId]) allEntries.set(item.id, item)
  }
  for (const item of snapshot.disabledModels) allEntries.set(item.id, item)

  const nextRouting = buildRoutingAfterMove(snapshot, modelIds, target, beforeModelId)
  const movedEntries = modelIds
    .map(id => allEntries.get(id))
    .filter((e): e is XPeachModelPoolEntry => e !== undefined)

  if (target === 'disabled') {
    const nextPools: Record<XPeachEndpointPoolId, readonly XPeachModelPoolEntry[]> = {
      'openai-completions': snapshot.pools['openai-completions'].filter(m => !moveSet.has(m.id)),
      'openai-responses': snapshot.pools['openai-responses'].filter(m => !moveSet.has(m.id)),
      'anthropic-messages': snapshot.pools['anthropic-messages'].filter(m => !moveSet.has(m.id)),
    }
    const existingDisabled = snapshot.disabledModels.filter(m => !moveSet.has(m.id))
    return {
      ...snapshot,
      pools: nextPools,
      disabledModels: [
        ...existingDisabled,
        ...movedEntries.map(e => ({ ...e, disabled: true })),
      ],
      routing: nextRouting,
    }
  }

  const updatedMoved = movedEntries.map((e): XPeachModelPoolEntry => ({
    ...e,
    endpoint: target,
    overriddenEndpoint: target !== e.recommendedEndpoint,
    disabled: false,
  }))

  const buildPoolList = (poolId: XPeachEndpointPoolId): readonly XPeachModelPoolEntry[] => {
    const kept = snapshot.pools[poolId].filter(m => !moveSet.has(m.id))
    if (poolId !== target) return kept
    if (beforeModelId !== undefined) {
      const idx = kept.findIndex(m => m.id === beforeModelId)
      if (idx !== -1) {
        return [...kept.slice(0, idx), ...updatedMoved, ...kept.slice(idx)]
      }
    }
    return [...kept, ...updatedMoved]
  }

  return {
    ...snapshot,
    pools: {
      'openai-completions': buildPoolList('openai-completions'),
      'openai-responses': buildPoolList('openai-responses'),
      'anthropic-messages': buildPoolList('anthropic-messages'),
    },
    disabledModels: snapshot.disabledModels.filter(m => !moveSet.has(m.id)),
    routing: nextRouting,
  }
}

/**
 * Render the 3-Endpoint Model Pools Studio inside `Settings → Models`.
 * @param props - localized `t` function and injected XPeach pool operations.
 * @returns pool studio element, or `null` before injection.
 */
export function XPeachModelPools(props: XPeachModelPoolsProps): JSX.Element | null {
  const { t, modelPoolsSnapshot, modelPoolsSave, modelPoolsReset, syncModels, selectModel } = props

  const [snapshot, setSnapshot] = useState<XPeachModelPoolsSnapshot | null>(null)
  const [baseUrlInput, setBaseUrlInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [draggingIds, setDraggingIds] = useState<readonly string[]>([])
  const [dropTarget, setDropTarget] = useState<DropTargetKey | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newModelId, setNewModelId] = useState('')
  const [newModelPool, setNewModelPool] = useState<XPeachEndpointPoolId>('openai-responses')
  const [modalDraft, setModalDraft] = useState<ModelDetailDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  const poolRefs = useRef<Partial<Record<XPeachEndpointPoolId, HTMLElement | null>>>({})

  const applyLoadedSnapshot = useCallback((next: XPeachModelPoolsSnapshot) => {
    setSnapshot(next)
    setBaseUrlInput(next.baseUrl)
  }, [])

  const loadSnapshot = useCallback(async () => {
    if (modelPoolsSnapshot === undefined) return
    const res = await modelPoolsSnapshot()
    if ('error' in res) {
      setErr(res.error)
      return
    }
    setErr(null)
    applyLoadedSnapshot(res)
  }, [modelPoolsSnapshot, applyLoadedSnapshot])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  const persistRouting = useCallback(async (nextRouting: XPeachModelRoutingState, showToast = true) => {
    if (modelPoolsSave === undefined) return
    setBusy(true)
    setErr(null)
    try {
      const saved = await modelPoolsSave({ routing: nextRouting })
      if ('error' in saved) {
        setErr(saved.error)
        return
      }
      applyLoadedSnapshot(saved)
      if (showToast) setBanner(t('pools.savedToast'))
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }, [modelPoolsSave, applyLoadedSnapshot, t])

  const filteredPools = useMemo(() => {
    if (snapshot === null) return null
    const q = search.trim().toLowerCase()
    const matchEntry = (item: XPeachModelPoolEntry): boolean => {
      if (q.length === 0) return true
      return item.id.toLowerCase().includes(q)
        || item.displayName.toLowerCase().includes(q)
        || item.groups.some(g => g.toLowerCase().includes(q))
    }
    return {
      'openai-completions': snapshot.pools['openai-completions'].filter(matchEntry),
      'openai-responses': snapshot.pools['openai-responses'].filter(matchEntry),
      'anthropic-messages': snapshot.pools['anthropic-messages'].filter(matchEntry),
      disabled: snapshot.disabledModels.filter(matchEntry),
    }
  }, [snapshot, search])

  const visibleActiveIds = useMemo(() => {
    if (filteredPools === null) return []
    return [
      ...filteredPools['openai-completions'].map(m => m.id),
      ...filteredPools['openai-responses'].map(m => m.id),
      ...filteredPools['anthropic-messages'].map(m => m.id),
    ]
  }, [filteredPools])

  if (modelPoolsSnapshot === undefined) return null

  const moveModelsToTarget = (ids: readonly string[], target: DropTargetKey, beforeModelId?: string): void => {
    if (snapshot === null || ids.length === 0) return
    const optimistic = applyOptimisticMove(snapshot, ids, target, beforeModelId)
    setSnapshot(optimistic)
    setDraggingIds([])
    setDropTarget(null)
    void persistRouting(optimistic.routing)
  }

  const handleCardDragStart = (e: DragEvent<HTMLElement>, modelId: string): void => {
    const batch = selectedIds.has(modelId) && selectedIds.size > 1
      ? [...selectedIds]
      : [modelId]
    setDraggingIds(batch)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(batch))
  }

  const readDraggedIds = (e: DragEvent<HTMLElement>): readonly string[] => {
    if (draggingIds.length > 0) return draggingIds
    try {
      const parsed: unknown = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0)
      }
    } catch (_err) {
      // Ignore non-JSON drag payloads.
    }
    return []
  }

  const handlePoolDrop = (e: DragEvent<HTMLElement>, target: DropTargetKey, beforeModelId?: string): void => {
    e.preventDefault()
    e.stopPropagation()
    const ids = readDraggedIds(e)
    setDropTarget(null)
    setDraggingIds([])
    if (ids.length === 0) return
    moveModelsToTarget(ids, target, beforeModelId)
  }

  const toggleSelectOne = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSyncRemote = async (): Promise<void> => {
    if (syncing) return
    setSyncing(true)
    setErr(null)
    setBanner(null)
    try {
      const res = await syncModels()
      if ('error' in res && typeof res.error === 'string' && res.error.length > 0) {
        setErr(res.error)
      } else {
        await loadSnapshot()
        const count = 'count' in res ? res.count : 0
        setBanner(t('pools.syncedToast', { n: String(count) }))
      }
    } finally {
      setSyncing(false)
    }
  }

  const handleResetDefaults = async (): Promise<void> => {
    if (modelPoolsReset === undefined || busy) return
    setBusy(true)
    setErr(null)
    try {
      const res = await modelPoolsReset()
      if ('error' in res) {
        setErr(res.error)
        return
      }
      setSelectedIds(new Set())
      applyLoadedSnapshot(res)
      setBanner(t('pools.savedToast'))
    } finally {
      setBusy(false)
    }
  }

  const handleSaveBaseUrl = (nextUrl: string | undefined): void => {
    if (snapshot === null) return
    const cleaned = nextUrl?.trim().replace(/\/+$/u, '').replace(/\/v1$/u, '') ?? ''
    const customBaseUrl = cleaned.length > 0 && cleaned !== snapshot.defaultBaseUrl ? cleaned : undefined
    const { customBaseUrl: _old, ...rest } = snapshot.routing
    const nextRouting: XPeachModelRoutingState = {
      ...rest,
      ...(customBaseUrl !== undefined ? { customBaseUrl } : {}),
    }
    setBaseUrlInput(customBaseUrl ?? snapshot.defaultBaseUrl)
    void persistRouting(nextRouting)
  }

  const handleToggleTracking = (): void => {
    if (snapshot === null) return
    const nextTracking = !snapshot.conversationTracking
    setSnapshot({ ...snapshot, conversationTracking: nextTracking })
    void persistRouting({
      ...snapshot.routing,
      conversationTracking: nextTracking,
    })
  }

  const handleAddCustomModel = (): void => {
    if (snapshot === null) return
    const cleanId = newModelId.trim()
    if (cleanId.length === 0) return
    const nextCustom = snapshot.routing.customModels.includes(cleanId)
      ? snapshot.routing.customModels
      : [...snapshot.routing.customModels, cleanId]
    const nextOverrides: Record<string, XPeachEndpointPoolId> = {
      ...snapshot.routing.endpointOverrides,
      [cleanId]: newModelPool,
    }
    const nextSettings: Record<string, XPeachModelCallSettings> = { ...snapshot.routing.modelSettings }
    if (nextSettings[cleanId]?.disabled === true) {
      const { disabled: _d, ...rest } = nextSettings[cleanId]
      nextSettings[cleanId] = rest
    }
    setNewModelId('')
    setAddOpen(false)
    void persistRouting({
      ...snapshot.routing,
      customModels: nextCustom,
      endpointOverrides: nextOverrides,
      modelSettings: nextSettings,
    })
  }

  const handleRemoveCustomModel = (modelId: string): void => {
    if (snapshot === null) return
    const nextCustom = snapshot.routing.customModels.filter(id => id !== modelId)
    const nextOverrides = Object.fromEntries(
      Object.entries(snapshot.routing.endpointOverrides).filter(([k]) => k !== modelId),
    )
    const nextSettings = Object.fromEntries(
      Object.entries(snapshot.routing.modelSettings).filter(([k]) => k !== modelId),
    )
    void persistRouting({
      ...snapshot.routing,
      customModels: nextCustom,
      endpointOverrides: nextOverrides,
      modelSettings: nextSettings,
    })
  }

  const handleSaveModalDraft = (): void => {
    if (snapshot === null || modalDraft === null) return
    const parsedCtx = Number.parseInt(modalDraft.contextWindow.trim(), 10)
    const parsedMax = Number.parseInt(modalDraft.maxTokens.trim(), 10)
    const contextWindow = Number.isInteger(parsedCtx) && parsedCtx >= 1024 ? parsedCtx : modalDraft.defaultCtx
    const maxTokens = Number.isInteger(parsedMax) && parsedMax >= 256 ? parsedMax : modalDraft.defaultMax
    const input: readonly ('text' | 'image')[] = modalDraft.supportsImage ? ['text', 'image'] : ['text']
    const parsedTemp = modalDraft.temperatureRaw.trim() === ''
      ? null
      : Number.parseFloat(modalDraft.temperatureRaw.trim())
    const temperature = parsedTemp !== null && Number.isFinite(parsedTemp) && parsedTemp >= 0 && parsedTemp <= 2
      ? Math.round(parsedTemp * 100) / 100
      : null

    const devRole = triToBool(modalDraft.supportsDeveloperRole)
    const reasonEff = triToBool(modalDraft.supportsReasoningEffort)
    const thinkText = triToBool(modalDraft.requiresThinkingAsText)
    const strictVal = triToBool(modalDraft.supportsStrictMode)
    const maxOut = triToBool(modalDraft.supportsMaxOutputTokens)
    const longCache = triToBool(modalDraft.supportsLongCacheRetention)
    const adaptThink = triToBool(modalDraft.forceAdaptiveThinking)
    const supTemp = triToBool(modalDraft.supportsTemperature)
    const cacheTools = triToBool(modalDraft.supportsCacheControlOnTools)
    const emptySig = triToBool(modalDraft.allowEmptySignature)

    const compat: XPeachModelCompatSettings = {
      ...(modalDraft.thinkingFormat !== '' ? { thinkingFormat: modalDraft.thinkingFormat } : {}),
      ...(modalDraft.maxTokensField !== '' ? { maxTokensField: modalDraft.maxTokensField } : {}),
      ...(devRole !== undefined ? { supportsDeveloperRole: devRole } : {}),
      ...(reasonEff !== undefined ? { supportsReasoningEffort: reasonEff } : {}),
      ...(thinkText !== undefined ? { requiresThinkingAsText: thinkText } : {}),
      ...(strictVal !== undefined ? { supportsStrictMode: strictVal, supportsStrictTools: strictVal } : {}),
      ...(maxOut !== undefined ? { supportsMaxOutputTokens: maxOut } : {}),
      ...(longCache !== undefined ? { supportsLongCacheRetention: longCache } : {}),
      ...(adaptThink !== undefined ? { forceAdaptiveThinking: adaptThink } : {}),
      ...(supTemp !== undefined ? { supportsTemperature: supTemp } : {}),
      ...(cacheTools !== undefined ? { supportsCacheControlOnTools: cacheTools } : {}),
      ...(emptySig !== undefined ? { allowEmptySignature: emptySig } : {}),
    }

    const callSettings: XPeachModelCallSettings = {
      ...(modalDraft.displayName.trim().length > 0 && modalDraft.displayName.trim() !== modalDraft.modelId
        ? { displayName: modalDraft.displayName.trim() }
        : {}),
      contextWindow,
      maxTokens,
      input,
      defaultReasoning: modalDraft.defaultReasoning,
      enabledEfforts: modalDraft.enabledEfforts.length > 0 ? modalDraft.enabledEfforts : ['off'],
      temperature,
      ...(Object.keys(compat).length > 0 ? { compat } : {}),
      ...(modalDraft.disabled ? { disabled: true } : {}),
    }

    const baseOverrides = Object.entries(snapshot.routing.endpointOverrides)
      .filter(([k]) => k !== modalDraft.modelId)
    const nextOverrides: Record<string, XPeachEndpointPoolId> = modalDraft.endpoint === modalDraft.recommendedEndpoint
      ? Object.fromEntries(baseOverrides)
      : { ...Object.fromEntries(baseOverrides), [modalDraft.modelId]: modalDraft.endpoint }

    const nextSettings: Record<string, XPeachModelCallSettings> = {
      ...snapshot.routing.modelSettings,
      [modalDraft.modelId]: callSettings,
    }

    setModalDraft(null)
    void persistRouting({
      ...snapshot.routing,
      endpointOverrides: nextOverrides,
      modelSettings: nextSettings,
    })
  }

  const handleResetSingleModel = (): void => {
    if (snapshot === null || modalDraft === null) return
    const targetId = modalDraft.modelId
    const nextOverrides = Object.fromEntries(
      Object.entries(snapshot.routing.endpointOverrides).filter(([k]) => k !== targetId),
    )
    const nextSettings = Object.fromEntries(
      Object.entries(snapshot.routing.modelSettings).filter(([k]) => k !== targetId),
    )
    setModalDraft(null)
    void persistRouting({
      ...snapshot.routing,
      endpointOverrides: nextOverrides,
      modelSettings: nextSettings,
    })
  }

  const poolTitleOf = (poolId: XPeachEndpointPoolId): string => {
    const found = POOL_DESCRIPTORS.find(d => d.poolId === poolId)
    return found !== undefined ? t(found.titleKey) : poolId
  }

  const inferRecommendedForNewId = (rawId: string): XPeachEndpointPoolId => {
    const lower = rawId.trim().toLowerCase()
    if (/(?:^|\/|[-_])claude[-_0-9]/iu.test(lower) || lower === 'claude' || lower.startsWith('anthropic/')) {
      return 'anthropic-messages'
    }
    if (/(?:^|\/|[-_])swe(?:[-_0-9.]|$)|codex|(?:^|\/)gpt-[56](?:[-._a-z0-9]|$)|(?:^|\/)o[134](?:[-_a-z0-9]|$)/iu.test(lower)) {
      return 'openai-responses'
    }
    return 'openai-completions'
  }

  return (
    <section className={css.poolStudioRoot}>
      {/* Top Gateway & Studio Actions Card */}
      <div className={css.poolGatewayCard}>
        <div className={css.poolStudioHead}>
          <div className={css.poolStudioTitleBlock}>
            <h3 className={css.poolStudioTitle}>{t('pools.studioTitle')}</h3>
            <p className={css.poolStudioDesc}>{t('pools.studioDesc')}</p>
          </div>
          <div className={css.poolStudioActions}>
            <button
              type="button"
              className={css.marketBtn}
              disabled={syncing || busy}
              onClick={() => { void handleSyncRemote() }}
            >
              {syncing ? t('pools.syncingBtn') : t('pools.syncBtn')}
            </button>
            <button
              type="button"
              className={css.marketBtn}
              disabled={busy}
              onClick={() => { setAddOpen(v => !v) }}
            >
              {t('pools.addModelBtn')}
            </button>
            <button
              type="button"
              className={css.marketBtn}
              disabled={busy}
              onClick={() => { void handleResetDefaults() }}
            >
              {t('pools.resetBtn')}
            </button>
          </div>
        </div>

        {snapshot !== null && (
          <>
            <div className={css.poolGatewayRow}>
              <input
                type="url"
                className={css.poolBaseInput}
                value={baseUrlInput}
                aria-label={t('pools.baseUrlLabel')}
                placeholder={t('pools.baseUrlPh')}
                onChange={(e) => { setBaseUrlInput(e.target.value) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveBaseUrl(baseUrlInput)
                }}
              />
              <button
                type="button"
                className={css.marketBtn}
                disabled={busy || baseUrlInput.trim() === snapshot.baseUrl}
                onClick={() => { handleSaveBaseUrl(baseUrlInput) }}
              >
                {t('pools.baseUrlSave')}
              </button>
              {snapshot.routing.customBaseUrl !== undefined && (
                <button
                  type="button"
                  className={css.marketBtn}
                  disabled={busy}
                  onClick={() => { handleSaveBaseUrl(undefined) }}
                >
                  {t('pools.baseUrlReset')}
                </button>
              )}
            </div>

            <div className={css.poolTrackingRow}>
              <div className={css.poolTrackingCopy}>
                <span className={css.poolTrackingTitle}>{t('pools.trackingLabel')}</span>
                <span className={css.poolTrackingHint}>{t('pools.trackingHint')}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={snapshot.conversationTracking}
                aria-label={t('pools.trackingLabel')}
                className={css.ctrlToggleSwitch}
                data-on={snapshot.conversationTracking ? 'true' : 'false'}
                disabled={busy}
                onClick={handleToggleTracking}
              >
                <span className={css.ctrlToggleKnob} />
              </button>
            </div>
          </>
        )}
      </div>

      {err !== null && <p role="alert" className={css.errLine}>{err}</p>}
      {banner !== null && <div role="status" className={css.poolStatusBanner}>{banner}</div>}

      {/* Inline Custom Model Adder */}
      {addOpen && (
        <div className={css.poolAddInline}>
          <input
            type="text"
            className={css.poolBaseInput}
            value={newModelId}
            placeholder={t('pools.addModelPh')}
            onChange={(e) => {
              const val = e.target.value
              setNewModelId(val)
              if (val.trim().length > 0) {
                setNewModelPool(inferRecommendedForNewId(val))
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCustomModel()
            }}
          />
          <nav className={css.segRow}>
            {POOL_DESCRIPTORS.map(desc => (
              <button
                key={desc.poolId}
                type="button"
                className={newModelPool === desc.poolId ? css.segOn : css.segOff}
                onClick={() => { setNewModelPool(desc.poolId) }}
              >
                {t(desc.titleKey)}
              </button>
            ))}
          </nav>
          <Button
            variant="primary"
            size="sm"
            disabled={busy || newModelId.trim().length === 0}
            onClick={handleAddCustomModel}
          >
            {t('pools.addModelConfirm')}
          </Button>
        </div>
      )}

      {/* 3-Pool Quick-Drop Overview Matrix */}
      {snapshot !== null && (
        <div className={css.poolDockGrid}>
          {POOL_DESCRIPTORS.map((desc) => {
            const count = snapshot.pools[desc.poolId].length
            return (
              <button
                key={desc.poolId}
                type="button"
                className={css.poolDockTile}
                data-drop-active={dropTarget === desc.poolId ? 'true' : 'false'}
                onClick={() => {
                  poolRefs.current[desc.poolId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (dropTarget !== desc.poolId) setDropTarget(desc.poolId)
                }}
                onDragLeave={() => {
                  if (dropTarget === desc.poolId) setDropTarget(null)
                }}
                onDrop={(e) => { handlePoolDrop(e, desc.poolId) }}
              >
                <span className={css.poolDockTop}>
                  <span className={css.poolDockName}>{t(desc.titleKey)}</span>
                  <span className={css.poolDockCount}>{String(count)}</span>
                </span>
                <span className={css.poolDockRoute}>{t(desc.routeKey)}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Search & Multi-Select Batch Transfer Bar */}
      {snapshot !== null && (
        <div className={css.poolToolbar}>
          <div className={css.poolSearchWrap}>
            <input
              type="search"
              className={css.marketSearch}
              style={{ width: '100%' }}
              value={search}
              placeholder={t('pools.searchPh')}
              onChange={(e) => { setSearch(e.target.value) }}
            />
            {search.length > 0 && (
              <button
                type="button"
                className={css.ctrlSearchClear}
                aria-label={t('pools.clearSel')}
                onClick={() => { setSearch('') }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <button
            type="button"
            className={css.marketBtn}
            onClick={() => {
              if (selectedIds.size > 0 && visibleActiveIds.every(id => selectedIds.has(id))) {
                setSelectedIds(new Set())
              } else {
                setSelectedIds(new Set(visibleActiveIds))
              }
            }}
          >
            {selectedIds.size > 0 && visibleActiveIds.length > 0 && visibleActiveIds.every(id => selectedIds.has(id))
              ? t('pools.clearSel')
              : t('pools.selectAll')}
          </button>

          {selectedIds.size > 0 && (
            <>
              <span className={css.poolMiniTag} data-tone="accent">
                {t('pools.selectedCount', { n: String(selectedIds.size) })}
              </span>
              <button
                type="button"
                className={css.marketBtn}
                disabled={busy}
                onClick={() => {
                  moveModelsToTarget([...selectedIds], 'openai-completions')
                  setSelectedIds(new Set())
                }}
              >
                {t('pools.batchMoveChat')}
              </button>
              <button
                type="button"
                className={css.marketBtn}
                disabled={busy}
                onClick={() => {
                  moveModelsToTarget([...selectedIds], 'openai-responses')
                  setSelectedIds(new Set())
                }}
              >
                {t('pools.batchMoveResponses')}
              </button>
              <button
                type="button"
                className={css.marketBtn}
                disabled={busy}
                onClick={() => {
                  moveModelsToTarget([...selectedIds], 'anthropic-messages')
                  setSelectedIds(new Set())
                }}
              >
                {t('pools.batchMoveAnthropic')}
              </button>
              <button
                type="button"
                className={css.ctrlBtnDanger}
                disabled={busy}
                onClick={() => {
                  moveModelsToTarget([...selectedIds], 'disabled')
                  setSelectedIds(new Set())
                }}
              >
                {t('pools.batchDisable')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Three Dedicated Wire-Protocol Endpoint Pool Containers */}
      {snapshot !== null && filteredPools !== null && POOL_DESCRIPTORS.map((desc) => {
        const items = filteredPools[desc.poolId]
        const totalInPool = snapshot.pools[desc.poolId].length
        const isDropOver = dropTarget === desc.poolId
        return (
          <div
            key={desc.poolId}
            ref={(el) => { poolRefs.current[desc.poolId] = el }}
            className={css.poolBucket}
            data-pool-id={desc.poolId}
            data-drop-active={isDropOver ? 'true' : 'false'}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              if (dropTarget !== desc.poolId) setDropTarget(desc.poolId)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null) && dropTarget === desc.poolId) {
                setDropTarget(null)
              }
            }}
            onDrop={(e) => { handlePoolDrop(e, desc.poolId) }}
          >
            <div className={css.poolBucketHead}>
              <div className={css.poolBucketMeta}>
                <div className={css.poolBucketTitleRow}>
                  <h4 className={css.poolBucketTitle}>{t(desc.titleKey)}</h4>
                  <code className={css.poolRouteBadge}>{t(desc.routeKey)}</code>
                  <span className={css.poolDockCount}>
                    {t('pools.modelCount', { n: String(totalInPool) })}
                  </span>
                </div>
                <p className={css.poolBucketDesc}>{t(desc.descKey)}</p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className={css.poolEmptyDrop}>
                {isDropOver ? t('pools.dropHere') : t('pools.emptyPool')}
              </div>
            ) : (
              <div className={css.poolCardGrid}>
                {items.map((item) => {
                  const isSelected = selectedIds.has(item.id)
                  const isDragging = draggingIds.includes(item.id)
                  const isDefault = snapshot.activeDefaultModel?.model === item.id
                  return (
                    <div
                      key={item.id}
                      draggable={!busy}
                      className={css.poolModelCard}
                      data-model-id={item.id}
                      data-selected={isSelected ? 'true' : 'false'}
                      data-dragging={isDragging ? 'true' : 'false'}
                      title={t('pools.card.dragHint')}
                      onDragStart={(e) => { handleCardDragStart(e, item.id) }}
                      onDragEnd={() => {
                        setDraggingIds([])
                        setDropTarget(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(e) => { handlePoolDrop(e, desc.poolId, item.id) }}
                    >
                      <div className={css.poolModelTop}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-label={item.id}
                          className={css.ctrlCheckBtn}
                          data-checked={isSelected ? 'true' : 'false'}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelectOne(item.id)
                          }}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M2.2 6.2L5 9l4.8-5.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <span className={css.poolDragGrip} aria-hidden="true">
                          <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                            <circle cx="3" cy="2.5" r="1" />
                            <circle cx="7" cy="2.5" r="1" />
                            <circle cx="3" cy="6" r="1" />
                            <circle cx="7" cy="6" r="1" />
                            <circle cx="3" cy="9.5" r="1" />
                            <circle cx="7" cy="9.5" r="1" />
                          </svg>
                        </span>
                        <div
                          className={css.poolModelNameWrap}
                          onClick={() => { setModalDraft(createDraftFromEntry(item)) }}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className={css.poolModelId}>{item.id}</span>
                          {item.displayName !== item.id && (
                            <span className={css.poolModelAlias}>{item.displayName}</span>
                          )}
                        </div>
                      </div>

                      <div className={css.poolModelMetaRow}>
                        <div className={css.poolBadges}>
                          {isDefault && (
                            <span className={css.poolMiniTag} data-tone="good">{t('pools.badge.default')}</span>
                          )}
                          {item.overriddenEndpoint && (
                            <span className={css.poolMiniTag} data-tone="accent">{t('pools.badge.overridden')}</span>
                          )}
                          {item.hasCustomSettings && (
                            <span className={css.poolMiniTag} data-tone="accent">{t('pools.badge.tuned')}</span>
                          )}
                          {item.isCustom && (
                            <span className={css.poolMiniTag}>{t('pools.badge.custom')}</span>
                          )}
                          <span className={css.poolMiniTag}>{formatTokenCap(item.contextWindow)}</span>
                          {item.input.includes('image') && (
                            <span className={css.poolMiniTag}>{t('pools.badge.vision')}</span>
                          )}
                        </div>

                        <div className={css.poolCardActions}>
                          {!isDefault && selectModel !== undefined && (
                            <button
                              type="button"
                              className={css.poolMiniBtn}
                              disabled={busy}
                              onClick={(e) => {
                                e.stopPropagation()
                                void selectModel(undefined, item.id).then(() => loadSnapshot())
                              }}
                            >
                              {t('pools.card.setDefault')}
                            </button>
                          )}
                          <button
                            type="button"
                            className={css.poolMiniBtn}
                            onClick={(e) => {
                              e.stopPropagation()
                              setModalDraft(createDraftFromEntry(item))
                            }}
                          >
                            {t('pools.card.configure')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Disabled Models Drop-Tray */}
      {snapshot !== null && filteredPools !== null && (snapshot.disabledModels.length > 0 || draggingIds.length > 0) && (
        <div
          className={css.poolBucket}
          data-drop-active={dropTarget === 'disabled' ? 'true' : 'false'}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            if (dropTarget !== 'disabled') setDropTarget('disabled')
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null) && dropTarget === 'disabled') {
              setDropTarget(null)
            }
          }}
          onDrop={(e) => { handlePoolDrop(e, 'disabled') }}
        >
          <div className={css.poolBucketHead}>
            <div className={css.poolBucketMeta}>
              <h4 className={css.poolBucketTitle}>
                {t('pools.disabledTrayTitle', { n: String(snapshot.disabledModels.length) })}
              </h4>
              <p className={css.poolBucketDesc}>{t('pools.disabledTrayHint')}</p>
            </div>
          </div>

          {filteredPools.disabled.length === 0 ? (
            <div className={css.poolEmptyDrop}>{t('pools.disabledTrayHint')}</div>
          ) : (
            <div className={css.poolCardGrid}>
              {filteredPools.disabled.map(item => (
                <div
                  key={item.id}
                  draggable={!busy}
                  className={css.poolModelCard}
                  data-disabled="true"
                  onDragStart={(e) => { handleCardDragStart(e, item.id) }}
                  onDragEnd={() => {
                    setDraggingIds([])
                    setDropTarget(null)
                  }}
                >
                  <div className={css.poolModelTop}>
                    <div className={css.poolModelNameWrap}>
                      <span className={css.poolModelId}>{item.id}</span>
                    </div>
                    <div className={css.poolCardActions}>
                      <button
                        type="button"
                        className={css.poolMiniBtn}
                        disabled={busy}
                        onClick={() => { moveModelsToTarget([item.id], item.endpoint) }}
                      >
                        {t('pools.card.enable')}
                      </button>
                      <button
                        type="button"
                        className={css.poolMiniBtn}
                        onClick={() => { setModalDraft(createDraftFromEntry(item)) }}
                      >
                        {t('pools.card.configure')}
                      </button>
                      {item.isCustom && (
                        <button
                          type="button"
                          className={css.poolMiniBtn}
                          disabled={busy}
                          onClick={() => { handleRemoveCustomModel(item.id) }}
                        >
                          {t('pools.card.removeCustom')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Per-Model Detailed Invocation Settings Modal */}
      <Modal
        open={modalDraft !== null}
        onClose={() => { setModalDraft(null) }}
        title={modalDraft !== null ? `${t('pools.modal.title')} · ${modalDraft.modelId}` : t('pools.modal.title')}
        closeLabel={t('notice.dismiss')}
        backdropBlur={false}
        {...(css.poolDetailDialog !== undefined ? { className: css.poolDetailDialog } : {})}
        onKeyDownCapture={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            setModalDraft(null)
          }
        }}
        {...(modalDraft !== null
          ? {
            footer: (
              <>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={handleResetSingleModel}
                >
                  {t('pools.modal.resetModel')}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => { setModalDraft(null) }}
                >
                  {t('pools.modal.cancel')}
                </Button>
                <Button
                  variant="primary"
                  disabled={busy}
                  onClick={handleSaveModalDraft}
                >
                  {busy ? t('pools.modal.saving') : t('pools.modal.save')}
                </Button>
              </>
            ),
          }
          : {})}
      >
        {modalDraft !== null && (
          <div className={css.poolModalBody}>
            {/* Endpoint Pool Selection */}
            <div className={css.poolModalField}>
              <div className={css.poolCompatRow}>
                <span className={css.poolModalLabel}>{t('pools.modal.endpointLabel')}</span>
                <span className={css.poolMiniTag} data-tone="accent">
                  {t('pools.modal.recommendedTag', { pool: poolTitleOf(modalDraft.recommendedEndpoint) })}
                </span>
              </div>
              <nav className={css.segRow}>
                {POOL_DESCRIPTORS.map(desc => (
                  <button
                    key={desc.poolId}
                    type="button"
                    className={modalDraft.endpoint === desc.poolId ? css.segOn : css.segOff}
                    onClick={() => { setModalDraft({ ...modalDraft, endpoint: desc.poolId }) }}
                  >
                    {t(desc.titleKey)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Enable / Disable Model Toggle */}
            <div className={css.poolCompatRow}>
              <span className={css.poolModalLabel}>{t('pools.modal.enabledLabel')}</span>
              <button
                type="button"
                role="switch"
                aria-checked={!modalDraft.disabled}
                aria-label={t('pools.modal.enabledLabel')}
                className={css.ctrlToggleSwitch}
                data-on={!modalDraft.disabled ? 'true' : 'false'}
                onClick={() => { setModalDraft({ ...modalDraft, disabled: !modalDraft.disabled }) }}
              >
                <span className={css.ctrlToggleKnob} />
              </button>
            </div>

            {/* Display Alias & Temperature */}
            <div className={css.poolModalGrid}>
              <label className={css.poolModalField}>
                <span className={css.poolModalLabel}>{t('pools.modal.displayNameLabel')}</span>
                <input
                  type="text"
                  className={css.poolBaseInput}
                  value={modalDraft.displayName}
                  placeholder={t('pools.modal.displayNamePh')}
                  onChange={(e) => { setModalDraft({ ...modalDraft, displayName: e.target.value }) }}
                />
              </label>
              <label className={css.poolModalField}>
                <span className={css.poolModalLabel}>{t('pools.modal.temperatureLabel')}</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  className={css.poolBaseInput}
                  value={modalDraft.temperatureRaw}
                  placeholder={t('pools.modal.temperaturePh')}
                  onChange={(e) => { setModalDraft({ ...modalDraft, temperatureRaw: e.target.value }) }}
                />
              </label>
            </div>

            {/* Context Window & Max Output Tokens with Preset Chips */}
            <div className={css.poolModalGrid}>
              <div className={css.poolModalField}>
                <span className={css.poolModalLabel}>{t('pools.modal.ctxWindowLabel')}</span>
                <input
                  type="number"
                  min="1024"
                  step="1024"
                  className={css.poolBaseInput}
                  aria-label={t('pools.modal.ctxWindowLabel')}
                  value={modalDraft.contextWindow}
                  onChange={(e) => { setModalDraft({ ...modalDraft, contextWindow: e.target.value }) }}
                />
                <div className={css.poolPresetRow}>
                  {CTX_WINDOW_PRESETS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className={css.poolPresetChip}
                      data-on={modalDraft.contextWindow === String(preset) ? 'true' : 'false'}
                      onClick={() => { setModalDraft({ ...modalDraft, contextWindow: String(preset) }) }}
                    >
                      {formatTokenCap(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={css.poolModalField}>
                <span className={css.poolModalLabel}>{t('pools.modal.maxTokensLabel')}</span>
                <input
                  type="number"
                  min="256"
                  step="256"
                  className={css.poolBaseInput}
                  aria-label={t('pools.modal.maxTokensLabel')}
                  value={modalDraft.maxTokens}
                  onChange={(e) => { setModalDraft({ ...modalDraft, maxTokens: e.target.value }) }}
                />
                <div className={css.poolPresetRow}>
                  {MAX_OUTPUT_PRESETS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className={css.poolPresetChip}
                      data-on={modalDraft.maxTokens === String(preset) ? 'true' : 'false'}
                      onClick={() => { setModalDraft({ ...modalDraft, maxTokens: String(preset) }) }}
                    >
                      {formatTokenCap(preset)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Modalities */}
            <div className={css.poolModalField}>
              <span className={css.poolModalLabel}>{t('pools.modal.modalitiesLabel')}</span>
              <div className={css.poolPresetRow}>
                <button
                  type="button"
                  className={css.poolPresetChip}
                  data-on="true"
                  disabled
                >
                  {t('pools.modal.modText')}
                </button>
                <button
                  type="button"
                  className={css.poolPresetChip}
                  data-on={modalDraft.supportsImage ? 'true' : 'false'}
                  onClick={() => { setModalDraft({ ...modalDraft, supportsImage: !modalDraft.supportsImage }) }}
                >
                  {t('pools.modal.modImage')}
                </button>
              </div>
            </div>

            {/* Default Reasoning Effort & Offered Levels */}
            <div className={css.poolModalGrid}>
              <label className={css.poolModalField}>
                <span className={css.poolModalLabel}>{t('pools.modal.defaultReasoningLabel')}</span>
                <select
                  className={css.poolBaseInput}
                  value={modalDraft.defaultReasoning}
                  onChange={(e) => {
                    setModalDraft({
                      ...modalDraft,
                      defaultReasoning: e.target.value as ModelDetailDraft['defaultReasoning'],
                    })
                  }}
                >
                  <option value="default">{t('pools.modal.reasoningFollowGlobal')}</option>
                  <option value="off">{t('pools.modal.reasoningOff')}</option>
                  {ALL_EFFORTS.filter(lvl => lvl !== 'off').map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </label>

              <div className={css.poolModalField}>
                <span className={css.poolModalLabel}>{t('pools.modal.enabledEffortsLabel')}</span>
                <div className={css.poolPresetRow}>
                  {ALL_EFFORTS.map((lvl) => {
                    const active = modalDraft.enabledEfforts.includes(lvl)
                    return (
                      <button
                        key={lvl}
                        type="button"
                        className={css.poolPresetChip}
                        data-on={active ? 'true' : 'false'}
                        onClick={() => {
                          const next = active
                            ? modalDraft.enabledEfforts.filter(x => x !== lvl)
                            : [...modalDraft.enabledEfforts, lvl]
                          setModalDraft({ ...modalDraft, enabledEfforts: next.length > 0 ? next : ['off'] })
                        }}
                      >
                        {lvl}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Endpoint-Specific Wire Compatibility Switches */}
            <div className={css.poolCompatBox}>
              <span className={css.poolModalLabel}>{t('pools.modal.compatTitle')}</span>

              {modalDraft.endpoint === 'openai-completions' && (
                <>
                  <div className={css.poolCompatRow}>
                    <span className={css.poolBucketDesc}>{t('pools.modal.thinkingFormat')}</span>
                    <select
                      className={css.poolBaseInput}
                      style={{ maxWidth: '200px' }}
                      aria-label={t('pools.modal.thinkingFormat')}
                      value={modalDraft.thinkingFormat}
                      onChange={(e) => {
                        setModalDraft({
                          ...modalDraft,
                          thinkingFormat: e.target.value as ModelDetailDraft['thinkingFormat'],
                        })
                      }}
                    >
                      <option value="">{t('pools.modal.compatAuto')}</option>
                      {THINKING_FORMAT_OPTIONS.map(fmt => (
                        <option key={fmt} value={fmt}>{fmt}</option>
                      ))}
                    </select>
                  </div>

                  <div className={css.poolCompatRow}>
                    <span className={css.poolBucketDesc}>{t('pools.modal.maxTokensField')}</span>
                    <select
                      className={css.poolBaseInput}
                      style={{ maxWidth: '200px' }}
                      aria-label={t('pools.modal.maxTokensField')}
                      value={modalDraft.maxTokensField}
                      onChange={(e) => {
                        setModalDraft({
                          ...modalDraft,
                          maxTokensField: e.target.value as ModelDetailDraft['maxTokensField'],
                        })
                      }}
                    >
                      <option value="">{t('pools.modal.compatAuto')}</option>
                      {MAX_TOKENS_FIELD_OPTIONS.map(fld => (
                        <option key={fld} value={fld}>{fld}</option>
                      ))}
                    </select>
                  </div>

                  <TriSwitchRow
                    labelText={t('pools.modal.developerRole')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsDeveloperRole}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsDeveloperRole: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.reasoningEffortSupport')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsReasoningEffort}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsReasoningEffort: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.thinkingAsText')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.requiresThinkingAsText}
                    onChange={(v) => { setModalDraft({ ...modalDraft, requiresThinkingAsText: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.strictMode')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsStrictMode}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsStrictMode: v }) }}
                  />
                </>
              )}

              {modalDraft.endpoint === 'openai-responses' && (
                <>
                  <TriSwitchRow
                    labelText={t('pools.modal.developerRole')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsDeveloperRole}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsDeveloperRole: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.maxOutputTokens')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsMaxOutputTokens}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsMaxOutputTokens: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.strictMode')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsStrictMode}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsStrictMode: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.longCache')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsLongCacheRetention}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsLongCacheRetention: v }) }}
                  />
                </>
              )}

              {modalDraft.endpoint === 'anthropic-messages' && (
                <>
                  <TriSwitchRow
                    labelText={t('pools.modal.adaptiveThinking')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.forceAdaptiveThinking}
                    onChange={(v) => { setModalDraft({ ...modalDraft, forceAdaptiveThinking: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.supportsTemp')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsTemperature}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsTemperature: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.cacheOnTools')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsCacheControlOnTools}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsCacheControlOnTools: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.strictMode')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.supportsStrictMode}
                    onChange={(v) => { setModalDraft({ ...modalDraft, supportsStrictMode: v }) }}
                  />
                  <TriSwitchRow
                    labelText={t('pools.modal.allowEmptySig')}
                    autoText={t('pools.modal.compatAuto')}
                    onText={t('pools.modal.compatOn')}
                    offText={t('pools.modal.compatOff')}
                    value={modalDraft.allowEmptySignature}
                    onChange={(v) => { setModalDraft({ ...modalDraft, allowEmptySignature: v }) }}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

function TriSwitchRow(props: {
  readonly labelText: string
  readonly autoText: string
  readonly onText: string
  readonly offText: string
  readonly value: TriStateValue
  readonly onChange: (next: TriStateValue) => void
}): JSX.Element {
  const { labelText, autoText, onText, offText, value, onChange } = props
  return (
    <div className={css.poolCompatRow}>
      <span className={css.poolBucketDesc}>{labelText}</span>
      <nav className={css.segRow}>
        <button
          type="button"
          className={value === 'auto' ? css.segOn : css.segOff}
          onClick={() => { onChange('auto') }}
        >
          {autoText}
        </button>
        <button
          type="button"
          className={value === 'on' ? css.segOn : css.segOff}
          onClick={() => { onChange('on') }}
        >
          {onText}
        </button>
        <button
          type="button"
          className={value === 'off' ? css.segOn : css.segOff}
          onClick={() => { onChange('off') }}
        >
          {offText}
        </button>
      </nav>
    </div>
  )
}
