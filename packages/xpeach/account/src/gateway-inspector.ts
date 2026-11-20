/**
 * Upstream LLM Gateway & Prompt Inspector engine for XPeach Account.
 *
 * Inspects and governs all five layers of an outbound gateway request:
 * 1. Upstream HTTP endpoint and headers (auth, protocol, attribution, tracking, custom headers)
 * 2. Ordered `systemPrompt` sections (identity, persona, policy, tool guidance, custom sections)
 * 3. Dynamic runtime-context blocks (`working-directory`, `sandbox-policy`, `approval-policy`, custom blocks)
 * 4. Pre-step implicit prompt injections (`agent-instructions`, `skill-catalog`, `time-context`, `tmux-context`,
 *    `repeat-tool-reminder`, custom injections)
 * 5. Tool schemas (`tools` declarations) and request-level sampling / reasoning parameters
 *
 * @module @xpeach/xph-account/gateway-inspector
 */
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@xpeach/xph-cordis'
import { deepFreeze, type JsonValue } from '@xpeach/xph-util-values'
import type {
  XPeachCapturedOutboundRequest,
  XPeachCustomContextBlock,
  XPeachCustomGatewayHeader,
  XPeachCustomPreStepInjection,
  XPeachCustomPromptSection,
  XPeachGatewayHeaderItem,
  XPeachGatewayInspectorRequest,
  XPeachGatewayInspectorSnapshot,
  XPeachInspectedContextBlock,
  XPeachInspectedImplicitItem,
  XPeachInspectedPromptSection,
  XPeachInspectedToolItem,
  XPeachModelCallSettings,
  XPeachPromptOverridesConfig,
  XPeachSkillItem,
  XPeachWireProtocol,
} from './types.ts'

const { version: ACCOUNT_VERSION } = createRequire(import.meta.url)('../package.json') as { version: string }

const DEFAULT_USER_AGENT = `deepseek-harness/${ACCOUNT_VERSION} (+https://github.com/deepseek-ai/deepseek-harness)`
const MAX_CAPTURED_REQUESTS = 10
const VALID_EFFORTS = new Set(['default', 'off', 'minimal', 'low', 'medium', 'high', 'xhigh'])
const VALID_CACHE_RETENTIONS = new Set(['default', 'none', 'short', 'long'])

/** Default prompt and gateway override configuration when no user overrides exist. */
export const DEFAULT_PROMPT_OVERRIDES: XPeachPromptOverridesConfig = {
  disabledSections: [],
  sectionOverrides: {},
  customSections: [],
  disabledContexts: [],
  contextOverrides: {},
  customContexts: [],
  disabledImplicitInjectors: [],
  customPreStepInjections: [],
  disabledTools: [],
  toolDescriptionOverrides: {},
  customHeaders: [],
  conversationTracking: true,
  reasoningEffort: 'default',
  cacheRetention: 'default',
  temperature: null,
  maxTokens: null,
}

interface RawPromptSection {
  name: string
  text: string
  interpolate?: boolean
}

interface RawPromptContext {
  name: string
  text: string
  interpolate?: boolean
}

interface RawToolSchema {
  name: string
  description: string
  parameters: Record<string, JsonValue>
  deferLoading?: boolean
}

interface RawPromptAssembly {
  sections: RawPromptSection[]
  contexts: RawPromptContext[]
  tools: RawToolSchema[]
  variables: Record<string, string | undefined>
  finalizeTools?: (assembly: RawPromptAssembly) => RawPromptAssembly
}

interface RawAssembleContext {
  scope?: object
  signal?: AbortSignal
  __xpeachInspectRaw?: boolean
}

interface LiveSystemPromptService {
  assemble(context?: RawAssembleContext): Promise<RawPromptAssembly>
}

interface LiveToolsGuardTarget {
  guard(fn: (exec: { readonly name: string }) => string | undefined): () => void
  schemas?(): readonly RawToolSchema[]
  restrict?(filter: { readonly deny?: readonly string[] }): () => void
}

interface RawMessageBlock {
  readonly type: string
  readonly text?: string
  readonly id?: string
  readonly name?: string
  readonly input?: Record<string, JsonValue>
}

interface RawRequestMessage {
  readonly id?: string
  readonly role: string
  readonly content: readonly RawMessageBlock[]
  readonly toolCallId?: string
  readonly isError?: boolean
  readonly source?: {
    readonly kind?: string
    readonly form?: string
    readonly name?: string
  }
}

interface RawPreStepDecision {
  readonly kind: 'enter' | 'reject'
  readonly messages: readonly RawRequestMessage[]
  readonly startsRequestSeries?: boolean
}

interface RawStreamOptions {
  readonly provider?: string
  readonly model?: string
  readonly system?: string
  readonly messages?: readonly RawRequestMessage[]
  readonly tools?: readonly RawToolSchema[]
  readonly temperature?: number
  readonly maxTokens?: number
  readonly reasoningEffort?: string
  readonly sessionId?: string
  readonly signal?: AbortSignal
}

interface RawSessionEvent {
  readonly type: string
  readonly data?: Record<string, JsonValue>
}

interface RawSessionHeaderSummary {
  readonly id: string
  readonly title?: string
  readonly cwd?: string
  readonly createdAt: number | string
}

interface RawSessionPersistence {
  list(): Promise<readonly ({ readonly header: RawSessionHeaderSummary } | string)[]>
  open(id: string, mode: 'read'): Promise<{
    read(): Promise<{ readonly header: { readonly id: string; readonly cwd?: string }; readonly events?: readonly RawSessionEvent[] }>
    close(): Promise<void>
  }>
}

/**
 * Estimate LLM token count from UTF-8 text (CJK characters ~0.65 tok/char, ASCII ~0.26 tok/char).
 * @param text - input string to estimate.
 * @returns approximate token count.
 */
export function estimateTokens(text: string): number {
  if (text.length === 0) return 0
  let cjk = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x2e80 && code <= 0x9fff) cjk++
  }
  const ascii = text.length - cjk
  return Math.max(1, Math.ceil(cjk * 0.65 + ascii * 0.26))
}

function isPlainRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function readStringMap(raw: unknown): Record<string, string> {
  if (!isPlainRecord(raw)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

/**
 * Sanitize and normalize raw JSON into a valid {@link XPeachPromptOverridesConfig}.
 * @param raw - untrusted JSON value read from disk or wire request.
 * @returns validated override configuration.
 */
export function normalizePromptOverridesConfig(raw: unknown): XPeachPromptOverridesConfig {
  if (!isPlainRecord(raw)) return DEFAULT_PROMPT_OVERRIDES

  const customSections: XPeachCustomPromptSection[] = Array.isArray(raw['customSections'])
    ? raw['customSections']
      .filter((item): item is Record<string, JsonValue> => isPlainRecord(item))
      .map((item, idx) => ({
        id: typeof item['id'] === 'string' && item['id'].length > 0 ? item['id'] : `custom-sec-${String(idx + 1)}`,
        name: typeof item['name'] === 'string' && item['name'].trim().length > 0 ? item['name'].trim() : `custom:section-${String(idx + 1)}`,
        order: typeof item['order'] === 'number' && Number.isFinite(item['order']) ? item['order'] : 10150,
        text: typeof item['text'] === 'string' ? item['text'] : '',
        enabled: item['enabled'] !== false,
      }))
    : []

  const customContexts: XPeachCustomContextBlock[] = Array.isArray(raw['customContexts'])
    ? raw['customContexts']
      .filter((item): item is Record<string, JsonValue> => isPlainRecord(item))
      .map((item, idx) => ({
        id: typeof item['id'] === 'string' && item['id'].length > 0 ? item['id'] : `custom-ctx-${String(idx + 1)}`,
        name: typeof item['name'] === 'string' && item['name'].trim().length > 0 ? item['name'].trim() : `custom:context-${String(idx + 1)}`,
        order: typeof item['order'] === 'number' && Number.isFinite(item['order']) ? item['order'] : 250,
        text: typeof item['text'] === 'string' ? item['text'] : '',
        enabled: item['enabled'] !== false,
      }))
    : []

  const customPreStepInjections: XPeachCustomPreStepInjection[] = Array.isArray(raw['customPreStepInjections'])
    ? raw['customPreStepInjections']
      .filter((item): item is Record<string, JsonValue> => isPlainRecord(item))
      .map((item, idx) => ({
        id: typeof item['id'] === 'string' && item['id'].length > 0 ? item['id'] : `custom-inj-${String(idx + 1)}`,
        label: typeof item['label'] === 'string' && item['label'].trim().length > 0 ? item['label'].trim() : `Custom Injection ${String(idx + 1)}`,
        placement: item['placement'] === 'before-user' ? 'before-user' : 'after-user',
        text: typeof item['text'] === 'string' ? item['text'] : '',
        enabled: item['enabled'] !== false,
      }))
    : []

  const customHeaders: XPeachCustomGatewayHeader[] = Array.isArray(raw['customHeaders'])
    ? raw['customHeaders']
      .filter((item): item is Record<string, JsonValue> => isPlainRecord(item))
      .map(item => ({
        key: typeof item['key'] === 'string' ? item['key'].trim() : '',
        value: typeof item['value'] === 'string' ? item['value'] : '',
        enabled: item['enabled'] !== false,
      }))
      .filter(item => item.key.length > 0)
    : []

  const rawEffort = typeof raw['reasoningEffort'] === 'string' && VALID_EFFORTS.has(raw['reasoningEffort'])
    ? (raw['reasoningEffort'] as XPeachPromptOverridesConfig['reasoningEffort'])
    : 'default'
  const rawCache = typeof raw['cacheRetention'] === 'string' && VALID_CACHE_RETENTIONS.has(raw['cacheRetention'])
    ? (raw['cacheRetention'] as XPeachPromptOverridesConfig['cacheRetention'])
    : 'default'

  const rawTemp = raw['temperature']
  const temperature = typeof rawTemp === 'number' && Number.isFinite(rawTemp) && rawTemp >= 0 && rawTemp <= 2
    ? rawTemp
    : null
  const rawMax = raw['maxTokens']
  const maxTokens = typeof rawMax === 'number' && Number.isFinite(rawMax) && rawMax >= 1
    ? Math.floor(rawMax)
    : null

  return {
    disabledSections: readStringArray(raw['disabledSections']),
    sectionOverrides: readStringMap(raw['sectionOverrides']),
    customSections,
    disabledContexts: readStringArray(raw['disabledContexts']),
    contextOverrides: readStringMap(raw['contextOverrides']),
    customContexts,
    disabledImplicitInjectors: readStringArray(raw['disabledImplicitInjectors']),
    customPreStepInjections,
    disabledTools: readStringArray(raw['disabledTools']),
    toolDescriptionOverrides: readStringMap(raw['toolDescriptionOverrides']),
    customHeaders,
    conversationTracking: raw['conversationTracking'] !== false,
    reasoningEffort: rawEffort,
    cacheRetention: rawCache,
    temperature,
    maxTokens,
  }
}

/**
 * Mask an API token so UI inspection shows prefix/suffix without leaking secret material.
 * @param key - raw API key or undefined.
 * @returns masked token representation.
 */
export function maskGatewayKey(key: string | undefined): string {
  if (key === undefined || key.length === 0) return '<unbound>'
  if (key.length <= 10) return 'sk-••••'
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`
}

function interpolateSafe(text: string, variables: Readonly<Record<string, string>>): string {
  return text.replace(/\{\{([a-z][a-z0-9_]*)\}\}/gu, (full, name: string) => (
    Object.hasOwn(variables, name) ? (variables[name] ?? full) : full
  ))
}

function classifySectionCategory(name: string): XPeachInspectedPromptSection['category'] {
  if (name.startsWith('harness:identity')) return 'identity'
  if (name.startsWith('deployment:persona')) return 'persona'
  if (name.startsWith('tool:') || name.startsWith('tools:') || name.startsWith('mcp:')) return 'tool-guidance'
  if (name.includes('policy') || name.includes('plan') || name.includes('team') || name.includes('ptc')) return 'policy'
  if (name.startsWith('harness:') || name.startsWith('web:') || name.includes('file-reference') || name.includes('deliverable')) return 'environment'
  return 'policy'
}

function inferDefaultSectionOrder(name: string, index: number): number {
  if (name === 'harness:identity') return -1000
  if (name === 'deployment:persona-prefix') return 0
  if (name === 'deployment:persona-suffix') return 10200
  if (name.startsWith('plan')) return 500
  if (name.startsWith('team')) return 600
  if (name.startsWith('file-reference')) return 900
  if (name.startsWith('tool:') || name.startsWith('mcp:')) return 1000 + index * 50
  if (name.startsWith('tools:')) return 5000
  if (name.startsWith('deliverable')) return 9000
  if (name.startsWith('harness:')) return 10000
  if (name.startsWith('web:')) return 10100
  return index * 100
}

function classifyToolSource(name: string): XPeachInspectedToolItem['source'] {
  if (name.startsWith('mcp__') || name.startsWith('mcp_')) return 'mcp'
  if (name === 'skill') return 'skill'
  if (/^cordis/u.test(name)) return 'extension'
  return 'builtin'
}

/**
 * Resolve the exact upstream endpoint URL for a base gateway root and wire protocol.
 * @param baseUrl - active XPeach gateway base URL.
 * @param protocol - selected wire protocol.
 * @returns full HTTP POST URL targeted by the adapter.
 */
export function resolveGatewayEndpointUrl(baseUrl: string, protocol: XPeachWireProtocol): string {
  const cleanRoot = baseUrl.replace(/\/+$/u, '').replace(/\/v1$/u, '')
  switch (protocol) {
    case 'anthropic-messages':
      return `${cleanRoot}/v1/messages?beta=true`
    case 'openai-responses':
      return `${cleanRoot}/v1/responses`
    case 'openai-completions':
    default:
      return `${cleanRoot}/v1/chat/completions`
  }
}

/**
 * Build the complete ordered list of HTTP headers sent to the upstream gateway.
 * @param options - protocol, masked key, session id, and override config.
 * @returns ordered header items with source attribution.
 */
export function buildGatewayHeaders(options: {
  readonly protocol: XPeachWireProtocol
  readonly maskedKey: string
  readonly sessionId: string
  readonly config: XPeachPromptOverridesConfig
}): XPeachGatewayHeaderItem[] {
  const { protocol, maskedKey, sessionId, config } = options
  const headers: XPeachGatewayHeaderItem[] = []

  if (protocol === 'anthropic-messages') {
    headers.push(
      { name: 'x-api-key', value: maskedKey, source: 'auth', editable: false, enabled: true },
      { name: 'anthropic-version', value: '2023-06-01', source: 'protocol', editable: false, enabled: true },
      { name: 'anthropic-beta', value: 'interleaved-thinking-2025-05-14', source: 'protocol', editable: false, enabled: config.reasoningEffort !== 'off' },
      { name: 'anthropic-dangerous-direct-browser-access', value: 'true', source: 'protocol', editable: false, enabled: true },
    )
  } else {
    headers.push({
      name: 'Authorization',
      value: `Bearer ${maskedKey}`,
      source: 'auth',
      editable: false,
      enabled: true,
    })
  }

  headers.push(
    { name: 'Content-Type', value: 'application/json', source: 'protocol', editable: false, enabled: true },
    { name: 'Accept', value: 'application/json', source: 'protocol', editable: false, enabled: true },
    { name: 'user-agent', value: DEFAULT_USER_AGENT, source: 'attribution', editable: false, enabled: true },
    { name: 'X-Stainless-Lang', value: 'js', source: 'protocol', editable: false, enabled: true },
    { name: 'X-Stainless-Runtime', value: 'node', source: 'protocol', editable: false, enabled: true },
    { name: 'X-Stainless-Retry-Count', value: '0', source: 'protocol', editable: false, enabled: true },
  )

  const trackingHeaders = [
    'X-Session-ID',
    'session-id',
    ...(protocol === 'openai-responses' ? ['session_id'] : []),
    'X-Conversation-ID',
    'thread-id',
    'X-Client-Request-ID',
    'prompt_cache_key',
  ]
  for (const name of trackingHeaders) {
    headers.push({
      name,
      value: sessionId,
      source: 'tracking',
      editable: false,
      enabled: config.conversationTracking,
    })
  }

  for (const custom of config.customHeaders) {
    if (custom.key.toLowerCase() === 'user-agent') continue
    headers.push({
      name: custom.key,
      value: custom.value,
      source: 'custom',
      editable: true,
      enabled: custom.enabled,
    })
  }

  return headers
}

/**
 * Serialize assembled prompt, messages, tools, and sampling knobs into the exact
 * upstream JSON body for the selected protocol.
 * @param input - protocol, model, system prompt, messages, tools, and config.
 * @returns pretty-printed JSON payload sent in the HTTP request body.
 */
export function buildUpstreamRequestBodyJson(input: {
  readonly protocol: XPeachWireProtocol
  readonly model: string
  readonly systemPrompt: string
  readonly messages: readonly {
    readonly role: string
    readonly content: string | readonly Record<string, JsonValue>[]
    readonly sourceTag?: string
    readonly toolCallId?: string
    readonly toolCalls?: readonly Record<string, JsonValue>[]
  }[]
  readonly tools: readonly {
    readonly name: string
    readonly description: string
    readonly parameters: Readonly<Record<string, JsonValue>>
  }[]
  readonly sessionId: string
  readonly config: XPeachPromptOverridesConfig
  readonly effectiveReasoning?: string
}): string {
  const { protocol, model, systemPrompt, messages, tools, sessionId, config, effectiveReasoning } = input
  const effort = config.reasoningEffort !== 'default'
    ? config.reasoningEffort
    : (effectiveReasoning ?? 'high')

  if (protocol === 'anthropic-messages') {
    const anthropicMessages: JsonValue[] = messages
      .filter(m => m.role !== 'system')
      .map((m, idx, arr): JsonValue => {
        const isLast = idx === arr.length - 1
        if (m.role === 'tool') {
          return {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: m.toolCallId ?? 'toolu_01',
                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
              },
            ],
          }
        }
        return {
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: typeof m.content === 'string'
            ? [{
              type: 'text',
              text: m.content,
              ...(isLast && m.role !== 'assistant' && config.cacheRetention !== 'none'
                ? { cache_control: { type: 'ephemeral' } }
                : {}),
            }]
            : [...m.content],
        }
      })

    const thinkingBudgetMap: Record<string, number> = {
      minimal: 1024,
      low: 2048,
      medium: 8192,
      high: 16384,
      xhigh: 31744,
    }
    const budgetTokens = effort !== 'off' ? (thinkingBudgetMap[effort] ?? 16384) : undefined
    const maxTokens = config.maxTokens ?? 32_768
    const payload: Record<string, JsonValue> = {
      model,
      max_tokens: maxTokens,
      stream: true,
      ...(systemPrompt.length > 0
        ? {
          system: [
            {
              type: 'text',
              text: systemPrompt,
              ...(config.cacheRetention !== 'none' ? { cache_control: { type: 'ephemeral' } } : {}),
            },
          ],
        }
        : {}),
      messages: anthropicMessages,
      ...(tools.length > 0
        ? {
          tools: tools.map((t, idx) => ({
            name: t.name,
            description: t.description,
            eager_input_streaming: true,
            input_schema: t.parameters,
            ...(idx === tools.length - 1 && config.cacheRetention !== 'none'
              ? { cache_control: { type: 'ephemeral' } }
              : {}),
          })),
        }
        : {}),
      ...(budgetTokens !== undefined && maxTokens > budgetTokens
        ? { thinking: { type: 'enabled', budget_tokens: Math.min(budgetTokens, maxTokens - 1024), display: 'summarized' } }
        : {}),
      ...(config.temperature !== null && budgetTokens === undefined
        ? { temperature: config.temperature }
        : {}),
    }
    return JSON.stringify(payload, null, 2)
  }

  if (protocol === 'openai-responses') {
    const inputItems: JsonValue[] = []
    if (systemPrompt.length > 0) {
      inputItems.push({
        role: effort !== 'off' ? 'developer' : 'system',
        content: [{ type: 'input_text', text: systemPrompt }],
      })
    }
    for (const m of messages) {
      if (m.role === 'system') continue
      if (m.role === 'tool') {
        inputItems.push({
          type: 'function_call_output',
          call_id: m.toolCallId ?? 'call_01',
          output: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })
        continue
      }
      inputItems.push({
        role: m.role === 'assistant' ? 'assistant' : m.role === 'developer' ? 'developer' : 'user',
        content: typeof m.content === 'string'
          ? [{ type: m.role === 'assistant' ? 'output_text' : 'input_text', text: m.content }]
          : [...m.content],
      })
    }

    const payload: Record<string, JsonValue> = {
      model,
      stream: true,
      store: false,
      input: inputItems,
      ...(tools.length > 0
        ? {
          tools: tools.map(t => ({
            type: 'function',
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        }
        : {}),
      ...(effort !== 'off'
        ? {
          reasoning: { effort, summary: 'auto' },
          include: ['reasoning.encrypted_content'],
        }
        : {}),
      ...(config.temperature !== null ? { temperature: config.temperature } : {}),
      max_output_tokens: config.maxTokens ?? 32_768,
      ...(config.cacheRetention !== 'none' ? { prompt_cache_key: sessionId } : {}),
    }
    return JSON.stringify(payload, null, 2)
  }

  const chatMessages: JsonValue[] = []
  if (systemPrompt.length > 0) {
    chatMessages.push({
      role: effort !== 'off' ? 'developer' : 'system',
      content: systemPrompt,
    })
  }
  for (const m of messages) {
    if (m.role === 'system') continue
    if (m.role === 'tool') {
      chatMessages.push({
        role: 'tool',
        tool_call_id: m.toolCallId ?? 'call_01',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })
      continue
    }
    chatMessages.push({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : [...m.content],
      ...(m.toolCalls !== undefined && m.toolCalls.length > 0 ? { tool_calls: [...m.toolCalls] } : {}),
    })
  }

  const payload: Record<string, JsonValue> = {
    model,
    stream: true,
    store: false,
    stream_options: { include_usage: true },
    max_completion_tokens: config.maxTokens ?? 32_768,
    messages: chatMessages,
    ...(tools.length > 0
      ? {
        tools: tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
      }
      : {}),
    ...(effort !== 'off' ? { reasoning_effort: effort } : {}),
    ...(config.temperature !== null ? { temperature: config.temperature } : {}),
    ...(config.cacheRetention === 'long' ? { prompt_cache_key: sessionId } : {}),
  }
  return JSON.stringify(payload, null, 2)
}

function buildCurlCommand(url: string, headers: readonly XPeachGatewayHeaderItem[], bodyJson: string): string {
  const activeHeaders = headers
    .filter(h => h.enabled)
    .map(h => `  -H ${JSON.stringify(`${h.name}: ${h.value}`)} \\`)
    .join('\n')
  const escapedBody = bodyJson.replace(/'/gu, "'\\''")
  return `curl -X POST ${JSON.stringify(url)} \\\n${activeHeaders}\n  -d '${escapedBody}'`
}

function createSyntheticUserMessage(text: string): RawRequestMessage {
  return deepFreeze({
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'xpeach-custom-injection', form: 'instructions' },
  })
}

/**
 * Runtime controller installed on `XPeachAccount` to enforce user prompt/tool
 * adjustments and inspect or capture outbound gateway requests.
 */
export class XPeachGatewayInspectorController {
  private readonly captured: XPeachCapturedOutboundRequest[] = []

  constructor(
    private readonly deps: {
      readonly ctx: Context
      readonly readConfig: () => XPeachPromptOverridesConfig
      readonly getActiveBaseUrl: () => string
      readonly getCustomBaseUrl?: (() => string | undefined) | undefined
      readonly readModelCallSettings?: ((modelId: string) => XPeachModelCallSettings | undefined) | undefined
      readonly readBoundKey: () => string | undefined
      readonly listSkillsSnapshot: (signal: AbortSignal) => {
        readonly skills: readonly XPeachSkillItem[]
        readonly rulesPath: string
        readonly rulesContent: string
      }
    },
  ) {}

  /**
   * Register reversible Cordis listeners on `system-prompt/assemble`, `agent/pre-step`,
   * and `tools.guard` so user overrides govern every real model step.
   */
  installHooks(): void {
    const registerEvent = this.deps.ctx.on.bind(this.deps.ctx) as (
      name: string,
      listener: (...args: never[]) => unknown,
    ) => () => boolean

    registerEvent('system-prompt/assemble', async (
      _assembly: RawPromptAssembly,
      context: RawAssembleContext | undefined,
      next: () => Promise<RawPromptAssembly>,
    ): Promise<RawPromptAssembly> => {
      const resolved = await next()
      if (context?.__xpeachInspectRaw === true) {
        return resolved
      }
      const cfg = this.deps.readConfig()
      const disabledSec = new Set(cfg.disabledSections)
      const disabledCtx = new Set(cfg.disabledContexts)
      const disabledTools = new Set(cfg.disabledTools)

      const sections: RawPromptSection[] = resolved.sections
        .filter(sec => !disabledSec.has(sec.name))
        .map(sec => (
          Object.hasOwn(cfg.sectionOverrides, sec.name)
            ? { ...sec, text: cfg.sectionOverrides[sec.name] ?? sec.text }
            : sec
        ))

      for (const custom of cfg.customSections) {
        if (!custom.enabled || custom.text.trim().length === 0) continue
        sections.push({
          name: custom.name,
          text: custom.text,
          interpolate: false,
        })
      }

      const contexts: RawPromptContext[] = resolved.contexts
        .filter(c => !disabledCtx.has(c.name))
        .map(c => (
          Object.hasOwn(cfg.contextOverrides, c.name)
            ? { ...c, text: cfg.contextOverrides[c.name] ?? c.text }
            : c
        ))

      for (const custom of cfg.customContexts) {
        if (!custom.enabled || custom.text.trim().length === 0) continue
        contexts.push({
          name: custom.name,
          text: custom.text,
          interpolate: false,
        })
      }

      const prevFinalize = resolved.finalizeTools
      return {
        ...resolved,
        sections,
        contexts,
        finalizeTools: (settled: RawPromptAssembly): RawPromptAssembly => {
          const base = prevFinalize !== undefined ? prevFinalize(settled) : settled
          const filteredSections = base.sections
            .filter(sec => !disabledSec.has(sec.name))
            .map(sec => (
              Object.hasOwn(cfg.sectionOverrides, sec.name)
                ? { ...sec, text: cfg.sectionOverrides[sec.name] ?? sec.text }
                : sec
            ))
          const filteredTools = base.tools
            .filter(tool => !disabledTools.has(tool.name))
            .map(tool => (
              Object.hasOwn(cfg.toolDescriptionOverrides, tool.name)
                ? { ...tool, description: cfg.toolDescriptionOverrides[tool.name] ?? tool.description }
                : tool
            ))
          return {
            ...base,
            sections: filteredSections,
            tools: filteredTools,
          }
        },
      }
    })

    registerEvent('agent/pre-step', async (
      _payload: object,
      next: () => Promise<RawPreStepDecision>,
    ): Promise<RawPreStepDecision> => {
      const decision = await next()
      if (decision.kind === 'reject') return decision
      const cfg = this.deps.readConfig()
      const disabledImplicit = new Set(cfg.disabledImplicitInjectors)
      let messages = [...decision.messages]

      if (disabledImplicit.size > 0) {
        messages = messages.filter((msg) => {
          const kind = msg.source?.kind ?? 'user'
          if (kind === 'user') return true
          if (disabledImplicit.has(kind)) return false
          if (disabledImplicit.has('skill-catalog') && (kind === 'skill-catalog' || kind === 'tool-skill' || msg.source?.form === 'catalog')) {
            return false
          }
          return true
        })
      }

      const beforeInjections = cfg.customPreStepInjections
        .filter(item => item.enabled && item.placement === 'before-user' && item.text.trim().length > 0)
        .map(item => createSyntheticUserMessage(item.text))
      const afterInjections = cfg.customPreStepInjections
        .filter(item => item.enabled && item.placement === 'after-user' && item.text.trim().length > 0)
        .map(item => createSyntheticUserMessage(item.text))

      if (beforeInjections.length === 0 && afterInjections.length === 0 && messages.length === decision.messages.length) {
        return decision
      }
      return {
        ...decision,
        messages: [...beforeInjections, ...messages, ...afterInjections],
      }
    })

    registerEvent('agent/created', (payload: { readonly agent?: { readonly ctx?: { readonly tools?: LiveToolsGuardTarget } } }) => {
      const cfg = this.deps.readConfig()
      if (cfg.disabledTools.length === 0) return
      const scopedTools = payload.agent?.ctx?.tools
      if (scopedTools?.restrict === undefined || scopedTools.schemas === undefined) return
      const known = new Set(scopedTools.schemas().map(s => s.name))
      const deny = cfg.disabledTools.filter(name => name !== 'run_code' && known.has(name))
      if (deny.length > 0) {
        try {
          scopedTools.restrict({ deny })
        } catch (_err) { /* ignore if tool is already scope-shadowed */ }
      }
    })

    const injectServices = this.deps.ctx.inject.bind(this.deps.ctx) as (
      deps: readonly string[],
      cb: (innerCtx: Context) => void,
    ) => void
    injectServices(['tools'], (innerCtx) => {
      const toolsSvc = (innerCtx.get as (name: string) => LiveToolsGuardTarget | undefined)('tools')
      if (toolsSvc?.guard !== undefined) {
        innerCtx.effect(() => toolsSvc.guard((exec) => {
          const cfg = this.deps.readConfig()
          if (cfg.disabledTools.length > 0 && cfg.disabledTools.includes(exec.name)) {
            return `Tool "${exec.name}" is disabled in XPeach Prompt & Gateway Inspector.`
          }
          return undefined
        }))
      }
    })
  }

  /**
   * Apply user stream-level overrides (`temperature`, `maxTokens`, `reasoningEffort`)
   * and record the outbound request in the in-memory ring buffer.
   * @param options - raw `llm/stream` options.
   * @returns adjusted stream options for downstream adapter execution.
   */
  interceptAndCaptureStream<T extends RawStreamOptions>(options: T): T {
    const cfg = this.deps.readConfig()
    const provider = options.provider ?? 'xpeach'
    const protocol: XPeachWireProtocol = provider === 'xpeach-anthropic'
      ? 'anthropic-messages'
      : provider === 'xpeach-openai-responses'
        ? 'openai-responses'
        : 'openai-completions'

    const perModel = typeof options.model === 'string' && options.model.length > 0
      ? this.deps.readModelCallSettings?.(options.model)
      : undefined
    const effectiveTemp = perModel?.temperature !== undefined && perModel.temperature !== null
      ? perModel.temperature
      : cfg.temperature
    const effectiveMaxTokens = cfg.maxTokens !== null
      ? cfg.maxTokens
      : perModel?.maxTokens
    let effectiveEffort = options.reasoningEffort
    if (cfg.reasoningEffort !== 'default') {
      effectiveEffort = cfg.reasoningEffort === 'off' ? undefined : cfg.reasoningEffort
    } else if (perModel?.defaultReasoning !== undefined && perModel.defaultReasoning !== 'default') {
      effectiveEffort = perModel.defaultReasoning === 'off' ? undefined : perModel.defaultReasoning
    }

    const adjusted: RawStreamOptions = {
      ...options,
      ...(effectiveTemp !== null ? { temperature: effectiveTemp } : {}),
      ...(effectiveMaxTokens !== undefined ? { maxTokens: effectiveMaxTokens } : {}),
      ...(effectiveEffort !== undefined ? { reasoningEffort: effectiveEffort } : {}),
    }
    if (effectiveEffort === undefined && (cfg.reasoningEffort === 'off' || perModel?.defaultReasoning === 'off')) {
      Reflect.deleteProperty(adjusted, 'reasoningEffort')
    }

    try {
      const model = adjusted.model ?? 'unknown'
      const sessionId = adjusted.sessionId ?? 'session-live'
      const baseRoot = this.deps.getCustomBaseUrl?.() ?? this.deps.getActiveBaseUrl()
      const url = resolveGatewayEndpointUrl(baseRoot, protocol)
      const headers = buildGatewayHeaders({
        protocol,
        maskedKey: maskGatewayKey(this.deps.readBoundKey()),
        sessionId,
        config: cfg,
      })

      const rawMessages = adjusted.messages ?? []
      const leadingSystemParts: string[] = []
      if (typeof adjusted.system === 'string' && adjusted.system.length > 0) {
        leadingSystemParts.push(adjusted.system)
      }
      let msgStart = 0
      while (msgStart < rawMessages.length && rawMessages[msgStart]?.role === 'system') {
        const sysText = (rawMessages[msgStart]?.content ?? [])
          .filter(b => b.type === 'text' && typeof b.text === 'string')
          .map(b => b.text ?? '')
          .join('')
        if (sysText.length > 0) leadingSystemParts.push(sysText)
        msgStart++
      }
      const systemPrompt = leadingSystemParts.join('\n\n')
      const convMessages = rawMessages.slice(msgStart).map((m) => {
        const text = m.content
          .filter(b => b.type === 'text' && typeof b.text === 'string')
          .map(b => b.text ?? '')
          .join('\n')
        return {
          role: m.role,
          content: text,
          ...(m.toolCallId !== undefined ? { toolCallId: m.toolCallId } : {}),
        }
      })
      const tools = (adjusted.tools ?? [])
        .filter(t => t.deferLoading !== true)
        .map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        }))

      const bodyJson = buildUpstreamRequestBodyJson({
        protocol,
        model,
        systemPrompt,
        messages: convMessages,
        tools,
        sessionId,
        config: cfg,
        ...(adjusted.reasoningEffort !== undefined ? { effectiveReasoning: adjusted.reasoningEffort } : {}),
      })

      this.captured.unshift({
        id: `cap-${String(Date.now())}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        provider,
        protocol,
        model,
        ...(adjusted.sessionId !== undefined ? { sessionId: adjusted.sessionId } : {}),
        method: 'POST',
        url,
        headers,
        bodyJson,
        messageCount: convMessages.length + (systemPrompt.length > 0 ? 1 : 0),
        toolCount: tools.length,
        estTotalTokens: estimateTokens(bodyJson),
      })
      if (this.captured.length > MAX_CAPTURED_REQUESTS) {
        this.captured.length = MAX_CAPTURED_REQUESTS
      }
    } catch (_captureErr) {
      // Never block live LLM streaming on inspector capture serialization.
    }

    return adjusted as T
  }

  /**
   * Assemble a complete live snapshot of prompts, implicit injections, tools,
   * headers, and upstream request body for the Inspector UI.
   * @param request - optional protocol, model, sessionId, and sample user message.
   * @param signal - carrier cancellation signal.
   * @returns complete gateway inspector snapshot.
   */
  async buildSnapshot(
    request: XPeachGatewayInspectorRequest,
    signal: AbortSignal,
  ): Promise<XPeachGatewayInspectorSnapshot> {
    signal.throwIfAborted()
    const cfg = this.deps.readConfig()
    const getSvc = this.deps.ctx.get.bind(this.deps.ctx) as (name: string) => unknown

    const settingsSvc = getSvc('settings') as { describe?: () => unknown } | undefined
    let availableModels: string[] = []
    let defaultModel = 'deepseek-v3.2'
    let defaultProtocol: XPeachWireProtocol = 'openai-completions'

    if (settingsSvc?.describe !== undefined) {
      try {
        const described = await settingsSvc.describe()
        if (typeof described === 'object' && described !== null) {
          const namespaces = Array.isArray((described as { namespaces?: unknown }).namespaces)
            ? ((described as { namespaces: readonly Record<string, unknown>[] }).namespaces)
            : []
          const defaultModelNs = namespaces.find(ns => ns['ns'] === 'agent-default-model')
          const dmVal = defaultModelNs?.['value'] as { defaultModel?: { provider?: string; model?: string } } | undefined
          if (typeof dmVal?.defaultModel?.model === 'string' && dmVal.defaultModel.model.length > 0) {
            defaultModel = dmVal.defaultModel.model
          }
          if (dmVal?.defaultModel?.provider === 'xpeach-anthropic') {
            defaultProtocol = 'anthropic-messages'
          } else if (dmVal?.defaultModel?.provider === 'xpeach-openai-responses') {
            defaultProtocol = 'openai-responses'
          }
          const piNs = namespaces.find(ns => ns['ns'] === 'llm-pi-ai')
          const providers = (piNs?.['value'] as { providers?: Record<string, { models?: { id?: string }[] }> } | undefined)?.providers ?? {}
          const modelSet = new Set<string>()
          for (const [key, prof] of Object.entries(providers)) {
            if (!key.startsWith('xpeach')) continue
            for (const m of prof.models ?? []) {
              if (typeof m.id === 'string' && m.id.length > 0) modelSet.add(m.id)
            }
          }
          availableModels = [...modelSet]
        }
      } catch (_err) { /* ignore settings read failure */ }
    }

    const model = request.model !== undefined && request.model.trim().length > 0
      ? request.model.trim()
      : (availableModels.includes(defaultModel) ? defaultModel : (availableModels[0] ?? defaultModel))
    const inferredProtocol: XPeachWireProtocol = /(?:^|\/|[-_])claude[-_0-9]/iu.test(model)
      ? 'anthropic-messages'
      : defaultProtocol
    const protocol: XPeachWireProtocol = request.protocol ?? inferredProtocol
    const providerKey = protocol === 'anthropic-messages'
      ? 'xpeach-anthropic'
      : protocol === 'openai-responses'
        ? 'xpeach-openai-responses'
        : 'xpeach'

    const systemPromptSvc = getSvc('systemPrompt') as LiveSystemPromptService | undefined
    let rawAssembly: RawPromptAssembly = {
      sections: [
        { name: 'harness:identity', text: 'You are an AI agent powered by XPeach Harness.' },
      ],
      contexts: [
        { name: 'working-directory', text: `Current working directory: ${process.cwd()}` },
      ],
      tools: [],
      variables: { provider: providerKey, model },
    }

    if (systemPromptSvc?.assemble !== undefined) {
      try {
        rawAssembly = await systemPromptSvc.assemble({ signal, __xpeachInspectRaw: true })
      } catch (_err) { /* fallback to minimal assembly if a scoped variable requires an active agent */ }
    } else {
      const toolsSvc = getSvc('tools') as LiveToolsGuardTarget | undefined
      if (toolsSvc?.schemas !== undefined) {
        rawAssembly = {
          ...rawAssembly,
          tools: [...toolsSvc.schemas()],
        }
      }
    }

    const variables: Record<string, string> = {}
    for (const [k, v] of Object.entries(rawAssembly.variables)) {
      variables[k] = v ?? ''
    }
    variables['provider'] = variables['provider'] || providerKey
    variables['model'] = variables['model'] || model

    const disabledSecSet = new Set(cfg.disabledSections)
    const sections: XPeachInspectedPromptSection[] = rawAssembly.sections.map((sec, idx) => {
      const defaultInterpolated = sec.interpolate === false ? sec.text : interpolateSafe(sec.text, variables)
      const overridden = Object.hasOwn(cfg.sectionOverrides, sec.name)
      const rawEffective = overridden ? (cfg.sectionOverrides[sec.name] ?? sec.text) : sec.text
      const effectiveText = sec.interpolate === false ? rawEffective : interpolateSafe(rawEffective, variables)
      const enabled = !disabledSecSet.has(sec.name)
      return {
        name: sec.name,
        order: inferDefaultSectionOrder(sec.name, idx),
        category: classifySectionCategory(sec.name),
        defaultText: defaultInterpolated,
        effectiveText,
        enabled,
        overridden,
        isCustom: false,
        charCount: effectiveText.length,
        estTokens: estimateTokens(effectiveText),
      }
    })

    for (const custom of cfg.customSections) {
      sections.push({
        name: custom.name,
        order: custom.order,
        category: 'custom',
        defaultText: custom.text,
        effectiveText: custom.text,
        enabled: custom.enabled,
        overridden: false,
        isCustom: true,
        customId: custom.id,
        charCount: custom.text.length,
        estTokens: estimateTokens(custom.text),
      })
    }
    sections.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))

    const renderedSystemPrompt = sections
      .filter(s => s.enabled && s.effectiveText.trim().length > 0)
      .map(s => s.effectiveText)
      .join('\n\n')

    const disabledCtxSet = new Set(cfg.disabledContexts)
    const contexts: XPeachInspectedContextBlock[] = rawAssembly.contexts.map((ctxEntry, idx) => {
      const defaultInterpolated = ctxEntry.interpolate === false ? ctxEntry.text : interpolateSafe(ctxEntry.text, variables)
      const overridden = Object.hasOwn(cfg.contextOverrides, ctxEntry.name)
      const rawEffective = overridden ? (cfg.contextOverrides[ctxEntry.name] ?? ctxEntry.text) : ctxEntry.text
      const effectiveText = ctxEntry.interpolate === false ? rawEffective : interpolateSafe(rawEffective, variables)
      const required = ctxEntry.name === 'working-directory'
      const enabled = required || !disabledCtxSet.has(ctxEntry.name)
      return {
        name: ctxEntry.name,
        order: 100 + idx * 10,
        required,
        defaultText: defaultInterpolated,
        effectiveText,
        enabled,
        overridden,
        isCustom: false,
        charCount: effectiveText.length,
        estTokens: estimateTokens(effectiveText),
      }
    })

    for (const custom of cfg.customContexts) {
      contexts.push({
        name: custom.name,
        order: custom.order,
        required: false,
        defaultText: custom.text,
        effectiveText: custom.text,
        enabled: custom.enabled,
        overridden: false,
        isCustom: true,
        customId: custom.id,
        charCount: custom.text.length,
        estTokens: estimateTokens(custom.text),
      })
    }
    contexts.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))

    const activeContextText = contexts
      .filter(c => c.enabled && c.effectiveText.trim().length > 0)
      .map(c => c.effectiveText)
      .join('\n\n')
    const renderedRuntimeContext = activeContextText.length > 0
      ? `Current runtime context. This snapshot supersedes earlier runtime-context snapshots.\n\n${activeContextText}`
      : ''

    // Build pre-step implicit injections snapshot
    const skillsSnap = this.deps.listSkillsSnapshot(signal)
    const workspaceAgentsMdPath = join(process.cwd(), 'AGENTS.md')
    let workspaceRules = ''
    if (existsSync(workspaceAgentsMdPath)) {
      try { workspaceRules = readFileSync(workspaceAgentsMdPath, 'utf8') } catch (_err) { workspaceRules = '' }
    }
    const combinedRulesParts: string[] = []
    if (skillsSnap.rulesContent.trim().length > 0) {
      combinedRulesParts.push(`# Global Instructions (${skillsSnap.rulesPath})\n${skillsSnap.rulesContent.trim()}`)
    }
    if (workspaceRules.trim().length > 0) {
      combinedRulesParts.push(`# Workspace Instructions (${workspaceAgentsMdPath})\n${workspaceRules.trim()}`)
    }
    // Wrap `<system-reminder>` blocks matching @xpeach/xph-agent-instructions and @xpeach/xph-tool-skill
    const agentInstructionsPreview = combinedRulesParts.length > 0
      ? [
        '<system-reminder>',
        'The following workspace instructions may be relevant to this task:',
        '',
        combinedRulesParts.join('\n\n'),
        '</system-reminder>',
      ].join('\n')
      : ''

    const enabledSkills = skillsSnap.skills.filter(s => s.enabled)
    const skillCatalogPreview = enabledSkills.length > 0
      ? [
        '<system-reminder>',
        'A skill is a reusable set of task-specific instructions. Call the `skill` tool to load one when relevant.',
        '<available_skills>',
        ...enabledSkills.map(s => `- \`${s.name}\`: ${s.description}`),
        '</available_skills>',
        '</system-reminder>',
      ].join('\n')
      : ''

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const nowIso = new Date().toISOString()
    const timeContextPreview = `Current time: ${nowIso} (${tz}) · Turn 1, Step 1.`
    const tmuxEnv = process.env['TMUX']
    const tmuxPreview = tmuxEnv !== undefined && tmuxEnv.length > 0
      ? `Active tmux environment detected (${tmuxEnv}).`
      : '(Inactive outside tmux session — injects active tmux window/pane metadata when TMUX is set)'
    const repeatGuardPreview = '(Conditional — injects a <system-reminder> warning only when the model repeats an identical tool call loop)'

    const disabledImplicitSet = new Set(cfg.disabledImplicitInjectors)
    const implicitInjections: XPeachInspectedImplicitItem[] = [
      {
        id: 'agent-instructions',
        label: 'AGENTS.md / CLAUDE.md 全局与项目规则注入',
        sourceKind: 'agent-instructions',
        trigger: 'workspace-rules',
        enabled: !disabledImplicitSet.has('agent-instructions'),
        toggleable: true,
        previewText: agentInstructionsPreview || '(当前未配置全局或工作区 AGENTS.md)',
        charCount: agentInstructionsPreview.length,
        estTokens: estimateTokens(agentInstructionsPreview),
      },
      {
        id: 'skill-catalog',
        label: `<available_skills> 技能目录隐性注入 (${String(enabledSkills.length)} 个启用技能)`,
        sourceKind: 'skill-catalog',
        trigger: 'skill-catalog',
        enabled: !disabledImplicitSet.has('skill-catalog'),
        toggleable: true,
        previewText: skillCatalogPreview || '(当前无已启用技能)',
        charCount: skillCatalogPreview.length,
        estTokens: estimateTokens(skillCatalogPreview),
      },
      {
        id: 'time-context',
        label: 'time-context 实时时钟与时区隐性注入',
        sourceKind: 'time-context',
        trigger: 'every-turn',
        enabled: !disabledImplicitSet.has('time-context'),
        toggleable: true,
        previewText: timeContextPreview,
        charCount: timeContextPreview.length,
        estTokens: estimateTokens(timeContextPreview),
      },
      {
        id: 'tmux-context',
        label: 'tmux-context 终端复用环境感知注入',
        sourceKind: 'tmux-context',
        trigger: 'conditional',
        enabled: !disabledImplicitSet.has('tmux-context'),
        toggleable: true,
        previewText: tmuxPreview,
        charCount: tmuxEnv !== undefined ? tmuxPreview.length : 0,
        estTokens: tmuxEnv !== undefined ? estimateTokens(tmuxPreview) : 0,
      },
      {
        id: 'repeat-tool-reminder',
        label: 'repeat-tool-reminder 重复工具调用防死循环提醒',
        sourceKind: 'repeat-tool-reminder',
        trigger: 'conditional',
        enabled: !disabledImplicitSet.has('repeat-tool-reminder'),
        toggleable: true,
        previewText: repeatGuardPreview,
        charCount: 0,
        estTokens: 0,
      },
    ]

    for (const customInj of cfg.customPreStepInjections) {
      implicitInjections.push({
        id: customInj.id,
        label: customInj.label,
        sourceKind: 'xpeach-custom-injection',
        trigger: 'custom',
        enabled: customInj.enabled,
        toggleable: true,
        previewText: customInj.text,
        charCount: customInj.text.length,
        estTokens: estimateTokens(customInj.text),
        isCustom: true,
        placement: customInj.placement,
      })
    }

    const toolsSvc = getSvc('tools') as LiveToolsGuardTarget | undefined
    const mergedToolMap = new Map<string, RawToolSchema>()
    for (const schema of rawAssembly.tools) {
      mergedToolMap.set(schema.name, schema)
    }
    if (toolsSvc?.schemas !== undefined) {
      for (const schema of toolsSvc.schemas()) {
        if (!mergedToolMap.has(schema.name)) {
          mergedToolMap.set(schema.name, schema)
        }
      }
    }

    const disabledToolsSet = new Set(cfg.disabledTools)
    const tools: XPeachInspectedToolItem[] = [...mergedToolMap.values()].map((tool) => {
      const overridden = Object.hasOwn(cfg.toolDescriptionOverrides, tool.name)
      const effectiveDescription = overridden
        ? (cfg.toolDescriptionOverrides[tool.name] ?? tool.description)
        : tool.description
      const enabled = !disabledToolsSet.has(tool.name)
      const schemaText = JSON.stringify({ name: tool.name, description: effectiveDescription, parameters: tool.parameters })
      return {
        name: tool.name,
        source: classifyToolSource(tool.name),
        defaultDescription: tool.description,
        effectiveDescription,
        parameters: tool.parameters,
        enabled,
        overridden,
        estTokens: estimateTokens(schemaText),
      }
    })

    // Recent sessions & optional real session history loading
    const persistence = getSvc('sessionPersistence') as RawSessionPersistence | undefined
    const recentSessions: { id: string; title?: string; cwd?: string; updatedAt: number }[] = []
    if (persistence?.list !== undefined) {
      try {
        const listed = await persistence.list()
        for (const entry of listed.slice(0, 12)) {
          if (typeof entry === 'string') continue
          const ts = typeof entry.header.createdAt === 'number'
            ? entry.header.createdAt
            : (Date.parse(entry.header.createdAt) || 0)
          recentSessions.push({
            id: entry.header.id,
            ...(entry.header.title !== undefined ? { title: entry.header.title } : {}),
            ...(entry.header.cwd !== undefined ? { cwd: entry.header.cwd.replace(homedir(), '~') } : {}),
            updatedAt: ts,
          })
        }
        recentSessions.sort((a, b) => b.updatedAt - a.updatedAt)
      } catch (_err) { /* ignore session listing error */ }
    }

    const sessionId = request.sessionId !== undefined && request.sessionId.trim().length > 0
      ? request.sessionId.trim()
      : 'sess_preview_01'

    const wireMessages: {
      role: string
      content: string | readonly Record<string, JsonValue>[]
      toolCallId?: string
      toolCalls?: readonly Record<string, JsonValue>[]
    }[] = []

    let loadedRealSession = false
    if (request.sessionId !== undefined && request.sessionId.trim().length > 0 && persistence?.open !== undefined) {
      try {
        const handle = await persistence.open(request.sessionId.trim(), 'read')
        try {
          const snap = await handle.read()
          for (const ev of snap.events ?? []) {
            if (ev.type === 'user/message' && isPlainRecord(ev.data)) {
              const blocks = Array.isArray(ev.data['content']) ? ev.data['content'] : []
              const text = blocks
                .filter((b): b is Record<string, JsonValue> => isPlainRecord(b) && b['type'] === 'text')
                .map(b => (typeof b['text'] === 'string' ? b['text'] : ''))
                .join('\n')
              if (text.length > 0) wireMessages.push({ role: 'user', content: text })
            } else if (ev.type === 'assistant/message' && isPlainRecord(ev.data)) {
              const msgObj = isPlainRecord(ev.data['message']) ? ev.data['message'] : ev.data
              const blocks = Array.isArray(msgObj['content']) ? msgObj['content'] : []
              const textParts: string[] = []
              const toolCalls: Record<string, JsonValue>[] = []
              for (const b of blocks) {
                if (!isPlainRecord(b)) continue
                if (b['type'] === 'text' && typeof b['text'] === 'string') textParts.push(b['text'])
                if (b['type'] === 'tool-call' && typeof b['name'] === 'string') {
                  toolCalls.push({
                    id: typeof b['id'] === 'string' ? b['id'] : 'call_01',
                    type: 'function',
                    function: {
                      name: b['name'],
                      arguments: JSON.stringify(b['input'] ?? {}),
                    },
                  })
                }
              }
              wireMessages.push({
                role: 'assistant',
                content: textParts.join('\n'),
                ...(toolCalls.length > 0 ? { toolCalls } : {}),
              })
            } else if (ev.type === 'tool/result' && isPlainRecord(ev.data)) {
              const callId = typeof ev.data['callId'] === 'string' ? ev.data['callId'] : 'call_01'
              const output = typeof ev.data['content'] === 'string'
                ? ev.data['content']
                : JSON.stringify(ev.data['content'] ?? '')
              wireMessages.push({ role: 'tool', toolCallId: callId, content: output })
            }
          }
          loadedRealSession = wireMessages.length > 0
        } finally {
          await handle.close()
        }
      } catch (_err) { /* fall back to synthetic turn preview */ }
    }

    if (!loadedRealSession) {
      for (const customInj of cfg.customPreStepInjections) {
        if (customInj.enabled && customInj.placement === 'before-user' && customInj.text.trim().length > 0) {
          wireMessages.push({ role: 'user', content: customInj.text })
        }
      }
      const sampleText = request.sampleUserMessage?.trim() || '请帮我分析当前项目架构并检查潜在性能瓶颈'
      wireMessages.push({ role: 'user', content: sampleText })
      if (!disabledImplicitSet.has('agent-instructions') && agentInstructionsPreview.length > 0) {
        wireMessages.push({ role: 'user', content: agentInstructionsPreview })
      }
      if (!disabledImplicitSet.has('skill-catalog') && skillCatalogPreview.length > 0) {
        wireMessages.push({ role: 'user', content: skillCatalogPreview })
      }
      if (!disabledImplicitSet.has('time-context')) {
        wireMessages.push({ role: 'user', content: timeContextPreview })
      }
      if (renderedRuntimeContext.length > 0) {
        wireMessages.push({ role: 'user', content: renderedRuntimeContext })
      }
      for (const customInj of cfg.customPreStepInjections) {
        if (customInj.enabled && customInj.placement === 'after-user' && customInj.text.trim().length > 0) {
          wireMessages.push({ role: 'user', content: customInj.text })
        }
      }
    }

    const activeBaseUrl = this.deps.getActiveBaseUrl()
    const endpointUrl = resolveGatewayEndpointUrl(activeBaseUrl, protocol)
    const headers = buildGatewayHeaders({
      protocol,
      maskedKey: maskGatewayKey(this.deps.readBoundKey()),
      sessionId,
      config: cfg,
    })

    const activeTools = tools
      .filter(t => t.enabled)
      .map(t => ({
        name: t.name,
        description: t.effectiveDescription,
        parameters: t.parameters,
      }))

    const requestBodyJson = buildUpstreamRequestBodyJson({
      protocol,
      model,
      systemPrompt: renderedSystemPrompt,
      messages: wireMessages,
      tools: activeTools,
      sessionId,
      config: cfg,
    })

    const systemTokens = estimateTokens(renderedSystemPrompt)
    const contextTokens = estimateTokens(renderedRuntimeContext)
    const implicitTokens = implicitInjections
      .filter(item => item.enabled)
      .reduce((acc, item) => acc + item.estTokens, 0)
    const toolTokens = tools
      .filter(item => item.enabled)
      .reduce((acc, item) => acc + item.estTokens, 0)

    return {
      method: 'POST',
      endpointUrl,
      activeBaseUrl,
      protocol,
      providerKey,
      model,
      availableModels,
      recentSessions,
      ...(request.sessionId !== undefined && request.sessionId.trim().length > 0
        ? { selectedSessionId: request.sessionId.trim() }
        : {}),
      headers,
      sections,
      contexts,
      implicitInjections,
      tools,
      variables,
      renderedSystemPrompt,
      renderedRuntimeContext,
      requestBodyJson,
      curlPreview: buildCurlCommand(endpointUrl, headers, requestBodyJson),
      stats: {
        systemTokens,
        contextTokens,
        implicitTokens,
        toolTokens,
        totalEstTokens: systemTokens + contextTokens + implicitTokens + toolTokens,
      },
      config: cfg,
      capturedRequests: [...this.captured],
    }
  }
}
