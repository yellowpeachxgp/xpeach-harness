/**
 * Durable model-to-endpoint pool routing and per-model invocation settings for XPeach Account.
 *
 * Classifies catalog models across the three primary wire-protocol pools
 * (`openai-completions`, `openai-responses`, `anthropic-messages`), applies
 * user drag-and-drop pool overrides, ordering, and per-model call settings from
 * `xpeach.model-routing.json`, and materializes protocol-valid `llm-pi-ai`
 * provider profiles that survive application restarts and catalog syncs.
 *
 * @module @xpeach/xph-account/model-routing
 */
import type { JsonValue } from '@xpeach/xph-util-values'
import type {
  XPeachEndpointPoolId,
  XPeachModel,
  XPeachModelCallSettings,
  XPeachModelCompatSettings,
  XPeachModelPoolEntry,
  XPeachModelPoolsSnapshot,
  XPeachModelReasoningLevel,
  XPeachModelRoutingState,
} from './types.ts'

/** Ordered list of the three primary XPeach wire-protocol endpoint pools. */
export const ENDPOINT_POOLS: readonly XPeachEndpointPoolId[] = [
  'openai-completions',
  'openai-responses',
  'anthropic-messages',
] as const

/** Default reasoning levels enabled for XPeach catalog models. */
export const DEFAULT_ENABLED_REASONING_EFFORTS: readonly XPeachModelReasoningLevel[] = [
  'off',
  'low',
  'medium',
  'high',
] as const

const ALL_REASONING_LEVELS = new Set<XPeachModelReasoningLevel>([
  'off',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
])

const VALID_THINKING_FORMATS = new Set<NonNullable<XPeachModelCompatSettings['thinkingFormat']>>([
  'openai',
  'deepseek',
  'openrouter',
  'together',
  'baseten',
  'zai',
  'qwen',
  'chat-template',
  'qwen-chat-template',
  'string-thinking',
  'ant-ling',
])

const CHAT_NATIVE_FAMILY_RE = new RegExp(
  '^(?:.*/)?(?:deepseek|qwen|qwq|glm|chatglm|kimi|moonshot|gemini|grok|minimax|doubao|seed'
    + '|yi|llama|mistral|mixtral|pixtral|codestral|hunyuan|ernie|step|baichuan|spark|gpt-3\\.5|gpt-4)',
  'iu',
)
const CLAUDE_FAMILY_RE = /(?:^|\/|[-_])claude[-_0-9]/iu
const RESPONSES_FIRST_RE = new RegExp(
  '(?:^|/|[-_])swe(?:[-_0-9.]|$)|codex|(?:^|/)gpt-[56](?:[-._a-z0-9]|$)|(?:^|/)o[134](?:[-_a-z0-9]|$)|computer-use',
  'iu',
)

/** Default empty routing ledger before any user customization. */
export const DEFAULT_MODEL_ROUTING_STATE: XPeachModelRoutingState = {
  version: 1,
  endpointOverrides: {},
  poolOrder: {},
  modelSettings: {},
  customModels: [],
}

/**
 * Map a wire-endpoint pool identifier to its `llm-pi-ai` provider key.
 * @param endpoint - target endpoint pool identifier.
 * @returns provider key under `llm-pi-ai.providers`.
 */
export function providerKeyForEndpoint(endpoint: XPeachEndpointPoolId): string {
  switch (endpoint) {
    case 'openai-completions':
      return 'xpeach'
    case 'openai-responses':
      return 'xpeach-openai-responses'
    case 'anthropic-messages':
      return 'xpeach-anthropic'
  }
}

/**
 * Map an `llm-pi-ai` provider key back to its XPeach endpoint pool identifier.
 * @param providerKey - provider key under `llm-pi-ai.providers`.
 * @returns matching endpoint pool identifier, or `undefined` for non-pool providers.
 */
export function endpointForProviderKey(providerKey: string): XPeachEndpointPoolId | undefined {
  if (providerKey === 'xpeach') return 'openai-completions'
  if (providerKey === 'xpeach-openai-responses') return 'openai-responses'
  if (providerKey === 'xpeach-anthropic') return 'anthropic-messages'
  return undefined
}

/**
 * Classify a model into its recommended primary wire-protocol endpoint pool.
 *
 * Routes `claude-*` to `anthropic-messages` (`POST /v1/messages`), agentic and
 * stateful reasoning families (`swe-*`, `codex*`, `gpt-5*`, `gpt-6*`, `o1/o3/o4`)
 * to `openai-responses` (`POST /v1/responses`), and general chat models
 * (`deepseek-*`, `qwen*`, `glm*`, `gemini*`, `gpt-4*`, etc.) to `openai-completions`
 * (`POST /v1/chat/completions`).
 *
 * @param model - model identifier and optional upstream `supported_endpoint_types`.
 * @returns recommended primary endpoint pool identifier.
 */
export function recommendedModelEndpoint(model: {
  readonly id?: string | undefined
  readonly supported_endpoint_types?: readonly string[] | undefined
}): XPeachEndpointPoolId {
  const rawId = (model.id ?? '').trim()
  const lower = rawId.toLowerCase()
  const offered = new Set((model.supported_endpoint_types ?? []).map(s => s.trim().toLowerCase()))

  if (CLAUDE_FAMILY_RE.test(lower) || lower === 'claude' || lower.startsWith('anthropic/')) {
    return 'anthropic-messages'
  }
  if (offered.has('anthropic') && !offered.has('openai') && !offered.has('openai-response')) {
    return 'anthropic-messages'
  }
  if (RESPONSES_FIRST_RE.test(lower)) {
    return 'openai-responses'
  }
  if (offered.has('openai-response') && !CHAT_NATIVE_FAMILY_RE.test(lower)) {
    return 'openai-responses'
  }
  return 'openai-completions'
}

function isPlainRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEndpointPoolId(value: unknown): value is XPeachEndpointPoolId {
  return value === 'openai-completions' || value === 'openai-responses' || value === 'anthropic-messages'
}

function normalizeCompat(raw: unknown): XPeachModelCompatSettings | undefined {
  if (!isPlainRecord(raw)) return undefined
  const tf = raw['thinkingFormat']
  const thinkingFormat = typeof tf === 'string' && VALID_THINKING_FORMATS.has(tf as NonNullable<XPeachModelCompatSettings['thinkingFormat']>)
    ? (tf as NonNullable<XPeachModelCompatSettings['thinkingFormat']>)
    : undefined
  const mtf = raw['maxTokensField']
  const maxTokensField = mtf === 'max_completion_tokens' || mtf === 'max_tokens' ? mtf : undefined
  const out: XPeachModelCompatSettings = {
    ...(thinkingFormat !== undefined ? { thinkingFormat } : {}),
    ...(maxTokensField !== undefined ? { maxTokensField } : {}),
    ...(typeof raw['supportsDeveloperRole'] === 'boolean' ? { supportsDeveloperRole: raw['supportsDeveloperRole'] } : {}),
    ...(typeof raw['supportsReasoningEffort'] === 'boolean' ? { supportsReasoningEffort: raw['supportsReasoningEffort'] } : {}),
    ...(typeof raw['requiresThinkingAsText'] === 'boolean' ? { requiresThinkingAsText: raw['requiresThinkingAsText'] } : {}),
    ...(typeof raw['supportsStrictMode'] === 'boolean' ? { supportsStrictMode: raw['supportsStrictMode'] } : {}),
    ...(typeof raw['supportsMaxOutputTokens'] === 'boolean' ? { supportsMaxOutputTokens: raw['supportsMaxOutputTokens'] } : {}),
    ...(typeof raw['supportsLongCacheRetention'] === 'boolean' ? { supportsLongCacheRetention: raw['supportsLongCacheRetention'] } : {}),
    ...(typeof raw['forceAdaptiveThinking'] === 'boolean' ? { forceAdaptiveThinking: raw['forceAdaptiveThinking'] } : {}),
    ...(typeof raw['supportsTemperature'] === 'boolean' ? { supportsTemperature: raw['supportsTemperature'] } : {}),
    ...(typeof raw['supportsCacheControlOnTools'] === 'boolean' ? { supportsCacheControlOnTools: raw['supportsCacheControlOnTools'] } : {}),
    ...(typeof raw['supportsStrictTools'] === 'boolean' ? { supportsStrictTools: raw['supportsStrictTools'] } : {}),
    ...(typeof raw['allowEmptySignature'] === 'boolean' ? { allowEmptySignature: raw['allowEmptySignature'] } : {}),
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function normalizeModelCallSettings(raw: unknown): XPeachModelCallSettings | undefined {
  if (!isPlainRecord(raw)) return undefined
  const displayName = typeof raw['displayName'] === 'string' && raw['displayName'].trim().length > 0
    ? raw['displayName'].trim()
    : undefined
  const contextWindow = typeof raw['contextWindow'] === 'number'
    && Number.isInteger(raw['contextWindow'])
    && raw['contextWindow'] >= 1024
    ? raw['contextWindow']
    : undefined
  const maxTokens = typeof raw['maxTokens'] === 'number'
    && Number.isInteger(raw['maxTokens'])
    && raw['maxTokens'] >= 256
    ? raw['maxTokens']
    : undefined
  let input: readonly ('text' | 'image')[] | undefined
  if (Array.isArray(raw['input'])) {
    const modalities = raw['input'].filter((m): m is 'text' | 'image' => m === 'text' || m === 'image')
    if (modalities.length > 0) {
      input = modalities.includes('text') ? [...new Set(modalities)] : ['text', ...new Set(modalities)]
    }
  }
  const dr = raw['defaultReasoning']
  const defaultReasoning = dr === 'default' || (typeof dr === 'string' && ALL_REASONING_LEVELS.has(dr as XPeachModelReasoningLevel))
    ? (dr as 'default' | XPeachModelReasoningLevel)
    : undefined
  let enabledEfforts: readonly XPeachModelReasoningLevel[] | undefined
  if (Array.isArray(raw['enabledEfforts'])) {
    const filtered = raw['enabledEfforts'].filter(
      (lvl): lvl is XPeachModelReasoningLevel => typeof lvl === 'string' && ALL_REASONING_LEVELS.has(lvl as XPeachModelReasoningLevel),
    )
    if (filtered.length > 0) {
      enabledEfforts = [...new Set(filtered)]
    }
  }
  let temperature: number | null | undefined
  if (raw['temperature'] === null) {
    temperature = null
  } else if (typeof raw['temperature'] === 'number' && Number.isFinite(raw['temperature']) && raw['temperature'] >= 0 && raw['temperature'] <= 2) {
    temperature = Math.round(raw['temperature'] * 100) / 100
  }
  const compat = normalizeCompat(raw['compat'])
  const disabled = typeof raw['disabled'] === 'boolean' ? raw['disabled'] : undefined

  const normalized: XPeachModelCallSettings = {
    ...(displayName !== undefined ? { displayName } : {}),
    ...(contextWindow !== undefined ? { contextWindow } : {}),
    ...(maxTokens !== undefined ? { maxTokens } : {}),
    ...(input !== undefined ? { input } : {}),
    ...(defaultReasoning !== undefined ? { defaultReasoning } : {}),
    ...(enabledEfforts !== undefined ? { enabledEfforts } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    ...(compat !== undefined ? { compat } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined
}

/**
 * Validate and normalize an untrusted JSON payload into {@link XPeachModelRoutingState}.
 * @param raw - raw JSON value from disk or RPC request.
 * @returns sanitized routing state.
 */
export function normalizeModelRoutingState(raw: unknown): XPeachModelRoutingState {
  if (!isPlainRecord(raw)) return DEFAULT_MODEL_ROUTING_STATE

  const endpointOverrides: Record<string, XPeachEndpointPoolId> = {}
  if (isPlainRecord(raw['endpointOverrides'])) {
    for (const [id, ep] of Object.entries(raw['endpointOverrides'])) {
      const trimmed = id.trim()
      if (trimmed.length > 0 && isEndpointPoolId(ep)) {
        endpointOverrides[trimmed] = ep
      }
    }
  }

  const poolOrder: Partial<Record<XPeachEndpointPoolId, readonly string[]>> = {}
  if (isPlainRecord(raw['poolOrder'])) {
    for (const pool of ENDPOINT_POOLS) {
      const list = raw['poolOrder'][pool]
      if (Array.isArray(list)) {
        const cleaned = [...new Set(list.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map(s => s.trim()))]
        if (cleaned.length > 0) {
          poolOrder[pool] = cleaned
        }
      }
    }
  }

  const modelSettings: Record<string, XPeachModelCallSettings> = {}
  if (isPlainRecord(raw['modelSettings'])) {
    for (const [id, item] of Object.entries(raw['modelSettings'])) {
      const trimmed = id.trim()
      if (trimmed.length === 0) continue
      const settings = normalizeModelCallSettings(item)
      if (settings !== undefined) {
        modelSettings[trimmed] = settings
      }
    }
  }

  const customModels = Array.isArray(raw['customModels'])
    ? [...new Set(raw['customModels'].filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map(s => s.trim()))]
    : []

  const rawBase = typeof raw['customBaseUrl'] === 'string' ? raw['customBaseUrl'].trim().replace(/\/+$/u, '').replace(/\/v1$/u, '') : ''
  const customBaseUrl = rawBase.length > 0 ? rawBase : undefined
  const conversationTracking = typeof raw['conversationTracking'] === 'boolean'
    ? raw['conversationTracking']
    : undefined

  return {
    version: 1,
    endpointOverrides,
    poolOrder,
    modelSettings,
    customModels,
    ...(customBaseUrl !== undefined ? { customBaseUrl } : {}),
    ...(conversationTracking !== undefined ? { conversationTracking } : {}),
  }
}

/**
 * Filter per-model `compat` switches down to only those legal on `endpoint` so
 * `llm-pi-ai` strict catalog resolution never rejects cross-pool moves.
 * @param compat - user-configured per-model compat switches.
 * @param endpoint - active wire protocol of the pool hosting the model.
 * @returns protocol-filtered compat object, or `undefined` when empty.
 */
export function filterCompatForEndpoint(
  compat: XPeachModelCompatSettings | undefined,
  endpoint: XPeachEndpointPoolId,
): Record<string, JsonValue> | undefined {
  if (compat === undefined) return undefined
  const out: Record<string, JsonValue> = {}
  if (endpoint === 'openai-completions') {
    if (compat.thinkingFormat !== undefined) out['thinkingFormat'] = compat.thinkingFormat
    if (compat.maxTokensField !== undefined) out['maxTokensField'] = compat.maxTokensField
    if (compat.supportsDeveloperRole !== undefined) out['supportsDeveloperRole'] = compat.supportsDeveloperRole
    if (compat.supportsReasoningEffort !== undefined) out['supportsReasoningEffort'] = compat.supportsReasoningEffort
    if (compat.requiresThinkingAsText !== undefined) out['requiresThinkingAsText'] = compat.requiresThinkingAsText
    if (compat.supportsStrictMode !== undefined) out['supportsStrictMode'] = compat.supportsStrictMode
    if (compat.supportsLongCacheRetention !== undefined) out['supportsLongCacheRetention'] = compat.supportsLongCacheRetention
  } else if (endpoint === 'openai-responses') {
    if (compat.supportsDeveloperRole !== undefined) out['supportsDeveloperRole'] = compat.supportsDeveloperRole
    if (compat.supportsMaxOutputTokens !== undefined) out['supportsMaxOutputTokens'] = compat.supportsMaxOutputTokens
    if (compat.supportsStrictMode !== undefined) out['supportsStrictMode'] = compat.supportsStrictMode
    if (compat.supportsLongCacheRetention !== undefined) out['supportsLongCacheRetention'] = compat.supportsLongCacheRetention
  } else {
    if (compat.forceAdaptiveThinking !== undefined) out['forceAdaptiveThinking'] = compat.forceAdaptiveThinking
    if (compat.supportsTemperature !== undefined) out['supportsTemperature'] = compat.supportsTemperature
    if (compat.supportsCacheControlOnTools !== undefined) out['supportsCacheControlOnTools'] = compat.supportsCacheControlOnTools
    if (compat.supportsStrictTools !== undefined) out['supportsStrictTools'] = compat.supportsStrictTools
    if (compat.allowEmptySignature !== undefined) out['allowEmptySignature'] = compat.allowEmptySignature
    if (compat.supportsLongCacheRetention !== undefined) out['supportsLongCacheRetention'] = compat.supportsLongCacheRetention
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Convert an array of enabled reasoning levels into the `llm-pi-ai` `reasoningEfforts` map.
 * @param efforts - enabled reasoning levels.
 * @returns `reasoningEfforts` dictionary compatible with `llm-pi-ai`.
 */
export function buildReasoningEffortsMap(
  efforts: readonly XPeachModelReasoningLevel[],
): Record<string, string | null> {
  const effective = efforts.length > 0 ? efforts : ['off' as const]
  const out: Record<string, string | null> = {}
  for (const lvl of effective) {
    out[lvl] = lvl === 'off' ? null : lvl
  }
  return out
}

function hasMeaningfulModelSettings(
  settings: XPeachModelCallSettings | undefined,
  id: string,
  defaultCtx: number,
  defaultMax: number,
  defaultInput: readonly ('text' | 'image')[],
): boolean {
  if (settings === undefined) return false
  if (settings.displayName !== undefined && settings.displayName !== id) return true
  if (settings.contextWindow !== undefined && settings.contextWindow !== defaultCtx) return true
  if (settings.maxTokens !== undefined && settings.maxTokens !== defaultMax) return true
  if (settings.input !== undefined) {
    if (settings.input.length !== defaultInput.length || settings.input.some(m => !defaultInput.includes(m))) {
      return true
    }
  }
  if (settings.defaultReasoning !== undefined && settings.defaultReasoning !== 'default') return true
  if (settings.enabledEfforts !== undefined) {
    if (
      settings.enabledEfforts.length !== DEFAULT_ENABLED_REASONING_EFFORTS.length
      || settings.enabledEfforts.some(e => !DEFAULT_ENABLED_REASONING_EFFORTS.includes(e))
    ) {
      return true
    }
  }
  if (settings.temperature !== undefined && settings.temperature !== null) return true
  if (settings.compat !== undefined && Object.keys(settings.compat).length > 0) return true
  return false
}

/** Input dependencies for building both the UI pool snapshot and `llm-pi-ai` provider map. */
export interface BuildModelPoolsInput {
  readonly catalogModels: readonly XPeachModel[]
  readonly routing: XPeachModelRoutingState
  readonly resolveCapabilities: (model: XPeachModel) => {
    readonly contextWindow: number
    readonly maxTokens: number
    readonly input: readonly ('text' | 'image')[]
  }
  readonly activeBaseUrl: string
  readonly defaultBaseUrl: string
  readonly keyVar: string
  readonly existingProviders: Readonly<Record<string, Record<string, unknown>>>
  readonly customHeaders: Readonly<Record<string, string>>
  readonly globalReasoning?: string | undefined
  readonly cacheRetention?: string | undefined
  readonly fallbackTracking: boolean
  readonly autoSyncModels: boolean
  readonly activeDefaultModel?: {
    readonly provider: string
    readonly model: string
  } | undefined
}

/** Materialized pools snapshot and `llm-pi-ai` provider map. */
export interface BuiltModelPoolsResult {
  readonly snapshot: XPeachModelPoolsSnapshot
  readonly providers: Record<string, Record<string, unknown>>
  readonly enabledCount: number
}

/**
 * Extract model records currently stored in `llm-pi-ai` `xpeach*` providers so
 * offline boots and custom models never disappear before a remote `/v1/models` sync.
 * @param existingProviders - current `llm-pi-ai` provider map.
 * @returns deduplicated fallback `XPeachModel` list.
 */
export function extractModelsFromExistingProviders(
  existingProviders: Readonly<Record<string, Record<string, unknown>>>,
): XPeachModel[] {
  const seen = new Set<string>()
  const out: XPeachModel[] = []
  for (const [key, prov] of Object.entries(existingProviders)) {
    if (endpointForProviderKey(key) === undefined) continue
    const list = prov['models']
    if (!Array.isArray(list)) continue
    for (const raw of list) {
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) continue
      const id = typeof (raw as { id?: unknown }).id === 'string' ? (raw as { id: string }).id.trim() : ''
      if (id.length === 0 || seen.has(id)) continue
      seen.add(id)
      out.push({ id })
    }
  }
  return out
}

/**
 * Materialize the three XPeach endpoint pools and their exact `llm-pi-ai`
 * provider profiles from the catalog and durable user routing ledger.
 *
 * Every enabled model is assigned to **one** primary endpoint pool
 * (`routing.endpointOverrides[id] ?? recommendedModelEndpoint(model)`), ordered
 * by `routing.poolOrder[endpoint]`, and enriched with per-model call settings.
 *
 * @param input - catalog models, durable routing ledger, and gateway context.
 * @returns resolved pool snapshot and `llm-pi-ai` provider dictionary.
 */
export function buildModelPoolsAndProviders(input: BuildModelPoolsInput): BuiltModelPoolsResult {
  const {
    catalogModels,
    routing,
    resolveCapabilities,
    activeBaseUrl,
    defaultBaseUrl,
    keyVar,
    existingProviders,
    customHeaders,
    globalReasoning,
    cacheRetention,
    fallbackTracking,
    autoSyncModels,
    activeDefaultModel,
  } = input

  const catalogSet = new Set<string>()
  const mergedById = new Map<string, XPeachModel>()
  for (const m of catalogModels) {
    const id = m.id.trim()
    if (id.length === 0) continue
    catalogSet.add(id)
    mergedById.set(id, { ...m, id })
  }
  for (const customId of routing.customModels) {
    const id = customId.trim()
    if (id.length === 0 || mergedById.has(id)) continue
    mergedById.set(id, { id })
  }

  const effectiveBaseRoot = (routing.customBaseUrl ?? activeBaseUrl).trim().replace(/\/+$/u, '').replace(/\/v1$/u, '')
  const openAIBase = `${effectiveBaseRoot}/v1`
  const anthropicBase = effectiveBaseRoot
  const tracking = routing.conversationTracking ?? fallbackTracking

  const poolBuckets: Record<XPeachEndpointPoolId, XPeachModelPoolEntry[]> = {
    'openai-completions': [],
    'openai-responses': [],
    'anthropic-messages': [],
  }
  const disabledModels: XPeachModelPoolEntry[] = []

  for (const m of mergedById.values()) {
    const recommended = recommendedModelEndpoint(m)
    const explicitEndpoint = routing.endpointOverrides[m.id]
    const endpoint = explicitEndpoint ?? recommended
    const settings = routing.modelSettings[m.id]
    const caps = resolveCapabilities(m)
    const defaultCtx = caps.contextWindow
    const defaultMax = Math.min(caps.maxTokens, 32_768)
    const defaultInput = caps.input

    const contextWindow = settings?.contextWindow ?? defaultCtx
    const maxTokens = settings?.maxTokens ?? defaultMax
    const modalities = settings?.input ?? defaultInput
    const displayName = settings?.displayName ?? m.id
    const defaultReasoning = settings?.defaultReasoning ?? 'default'
    const enabledEfforts = settings?.enabledEfforts ?? DEFAULT_ENABLED_REASONING_EFFORTS
    const temperature = settings?.temperature ?? null
    const compat = settings?.compat ?? {}
    const disabled = settings?.disabled === true
    const isCustom = !catalogSet.has(m.id) && routing.customModels.includes(m.id)
    const hasCustomSettings = hasMeaningfulModelSettings(settings, m.id, defaultCtx, defaultMax, defaultInput)

    const entry: XPeachModelPoolEntry = {
      id: m.id,
      displayName,
      endpoint,
      recommendedEndpoint: recommended,
      overriddenEndpoint: explicitEndpoint !== undefined && explicitEndpoint !== recommended,
      groups: m.groups ?? [],
      supportedEndpoints: m.supported_endpoint_types ?? [],
      contextWindow,
      defaultContextWindow: defaultCtx,
      maxTokens,
      defaultMaxTokens: defaultMax,
      input: modalities,
      defaultInput,
      defaultReasoning,
      enabledEfforts,
      temperature,
      compat,
      disabled,
      isCustom,
      hasCustomSettings,
    }

    if (disabled) {
      disabledModels.push(entry)
    } else {
      poolBuckets[endpoint].push(entry)
    }
  }

  for (const pool of ENDPOINT_POOLS) {
    const order = routing.poolOrder[pool]
    if (order !== undefined && order.length > 0) {
      const rank = new Map<string, number>()
      order.forEach((id, idx) => { rank.set(id, idx) })
      poolBuckets[pool].sort((a, b) => {
        const ra = rank.get(a.id)
        const rb = rank.get(b.id)
        if (ra !== undefined && rb !== undefined) return ra - rb
        if (ra !== undefined) return -1
        if (rb !== undefined) return 1
        return 0
      })
    }
  }

  const providers: Record<string, Record<string, unknown>> = {}
  let enabledCount = 0

  for (const pool of ENDPOINT_POOLS) {
    const key = providerKeyForEndpoint(pool)
    const items = poolBuckets[pool]
    enabledCount += items.length

    if (items.length === 0) {
      if (key in existingProviders) {
        providers[key] = { ...existingProviders[key], models: [] }
      }
      continue
    }

    let highestMaxTokens = 32_768
    const wireModels = items.map((item) => {
      if (item.maxTokens > highestMaxTokens) highestMaxTokens = item.maxTokens
      const filteredCompat = filterCompatForEndpoint(item.compat, pool)
      return {
        id: item.id,
        name: item.displayName,
        contextWindow: item.contextWindow,
        maxTokens: item.maxTokens,
        input: [...item.input],
        reasoningEfforts: buildReasoningEffortsMap(item.enabledEfforts),
        ...(filteredCompat !== undefined ? { compat: filteredCompat } : {}),
      }
    })

    providers[key] = {
      displayName: pool === 'openai-completions' ? '🍑Code' : `🍑Code ${pool}`,
      apiKeyEnv: keyVar,
      api: pool,
      baseURL: pool === 'anthropic-messages' ? anthropicBase : openAIBase,
      defaultInput: ['text', 'image'],
      ...(highestMaxTokens > 32_768 ? { defaultMaxTokens: highestMaxTokens } : {}),
      ...(globalReasoning !== undefined ? { reasoning: globalReasoning } : {}),
      ...(cacheRetention !== undefined ? { cacheRetention } : {}),
      ...(Object.keys(customHeaders).length > 0 ? { headers: { ...customHeaders } } : {}),
      conversationTracking: tracking,
      retryPolicy: { mode: 'normal', maxRetries: 2 },
      models: wireModels,
    }
  }

  for (const [key, existing] of Object.entries(existingProviders)) {
    if (endpointForProviderKey(key) !== undefined && !(key in providers)) {
      providers[key] = { ...existing, models: [] }
    }
  }

  const snapshot: XPeachModelPoolsSnapshot = {
    baseUrl: effectiveBaseRoot,
    defaultBaseUrl: defaultBaseUrl.replace(/\/+$/u, '').replace(/\/v1$/u, ''),
    conversationTracking: tracking,
    autoSyncModels,
    ...(activeDefaultModel !== undefined ? { activeDefaultModel } : {}),
    pools: {
      'openai-completions': poolBuckets['openai-completions'],
      'openai-responses': poolBuckets['openai-responses'],
      'anthropic-messages': poolBuckets['anthropic-messages'],
    },
    disabledModels,
    routing,
  }

  return { snapshot, providers, enabledCount }
}
