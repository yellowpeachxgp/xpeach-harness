/**
 * XPeach New API adapter — every site endpoint this harness calls lives behind
 * this one class. Two credential channels ride it: the relay key (Bearer) for
 * user-facing OpenAI-compatible + token surfaces, and the site-management
 * token (raw Authorization) for admin surfaces. Keeping the entire HTTP seam in
 * one module means upstream New API changes touch this file and only this file.
 */
import { RemoteError } from '@xpeach/xph-typert-protocol'
import { ROUTES } from './network.ts'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type { JsonValue } from '@xpeach/xph-util-values'
import { dirname } from 'node:path'
import type {
  XPeachAdminLogEntry, XPeachAdminOverview, XPeachAdminPage, XPeachAdminToken,
  XPeachAdminUser, XPeachBillingRate, XPeachChannel, XPeachChatReply, XPeachChatRequest, XPeachHealthRow, XPeachModel,
  XPeachModelPricingChange, XPeachModelPricingSnapshot,
  XPeachPricingCatalog, XPeachPricingEntry, XPeachRedemption, XPeachTokenLogEntry, XPeachTokenPage, XPeachTokenUsage, XPeachWriteResult,
  XPeachUserSelf, XPeachSelfLogPage, XPeachSelfLogStat,
  XPeachSsoBridgePayload, XPeachSsoCredentialSyncResult, XPeachSsoDeviceStartResult, XPeachSsoRevokeRequest,
} from './types.ts'

/**
 * Validate and normalize an XPeach SSO base URL.
 * Only `https:` origins or loopback `http:` origins (`localhost`, `127.0.0.1`, `[::1]`)
 * without embedded credentials are permitted.
 *
 * @param rawUrl - candidate SSO base URL string.
 * @returns normalized origin URL without a trailing slash.
 */
export function validateSsoBaseUrl(rawUrl: string): string {
  let parsed: URL
  try {
    parsed = new URL(rawUrl.trim())
  } catch {
    throw new RemoteError('xpeach/invalid-sso-url', `xpeach: invalid SSO base URL: ${rawUrl}`, {})
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new RemoteError('xpeach/invalid-sso-url', 'xpeach: SSO base URL must not contain embedded credentials', {})
  }
  const isHttps = parsed.protocol === 'https:'
  const isLoopbackHttp = parsed.protocol === 'http:' && (
    parsed.hostname === 'localhost'
    || parsed.hostname === '127.0.0.1'
    || parsed.hostname === '[::1]'
    || parsed.hostname === '::1'
  )
  if (!isHttps && !isLoopbackHttp) {
    throw new RemoteError('xpeach/invalid-sso-url', `xpeach: SSO base URL must use HTTPS or loopback HTTP (${parsed.origin})`, {})
  }
  return parsed.origin
}

/**
 * Validate a browser verification URL returned by the SSO Device Authorization endpoint.
 * Rejects non-HTTP(S) schemes (`javascript:`, `file:`, `data:`), embedded credentials,
 * and non-HTTPS non-loopback origins.
 *
 * @param rawUrl - candidate verification URL or relative path.
 * @param fallbackOrigin - validated SSO origin used to resolve relative URLs.
 * @returns validated absolute URL string safe for opening in the user's browser.
 */
export function validateVerificationUrl(rawUrl: string, fallbackOrigin: string): string {
  const safeOrigin = validateSsoBaseUrl(fallbackOrigin)
  let parsed: URL
  try {
    parsed = new URL(rawUrl.trim(), safeOrigin)
  } catch {
    throw new RemoteError('xpeach/invalid-sso-url', `xpeach: invalid verification URL: ${rawUrl}`, {})
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new RemoteError('xpeach/invalid-sso-url', 'xpeach: verification URL must not contain embedded credentials', {})
  }
  const isHttps = parsed.protocol === 'https:'
  const isLoopbackHttp = parsed.protocol === 'http:' && (
    parsed.hostname === 'localhost'
    || parsed.hostname === '127.0.0.1'
    || parsed.hostname === '[::1]'
    || parsed.hostname === '::1'
  )
  if (!isHttps && !isLoopbackHttp) {
    throw new RemoteError('xpeach/invalid-sso-url', `xpeach: verification URL must use HTTPS or loopback HTTP (${parsed.protocol})`, {})
  }
  return parsed.toString()
}

/** Configuration options for constructing an `XPeachApi` client. */
export interface XPeachApiOptions {
  /** Site root (no trailing slash). */
  readonly baseURL: string
  /** Per-request timeout in milliseconds. */
  readonly timeoutMs: number
  /** Relay key resolver (throws-shaped callers handle undefined upstream). */
  readonly resolveKey: () => Promise<string>
  /** Admin token resolver; undefined = admin surfaces report "not bound". */
  readonly resolveAdmin: () => string | undefined
  /** Site session-cookie resolver; undefined = session surfaces report "not bound". */
  readonly resolveCookie: () => string | undefined
  /** Price sync-table persistence path; empty disables the disk layer. */
  readonly priceCacheFile?: string
  /** Optional callback invoked when an authenticated endpoint rejects credentials with HTTP 401 or 403. */
  readonly onAuthRejected?: ((status: 401 | 403, path: string, message: string) => void) | undefined
}

type GroupCatalog = Record<string, { desc?: string; models?: readonly string[]; ratio?: string | number }>

interface PriceCacheEntry {
  at: number
  entries: XPeachPricingCatalog['entries']
  groupRatio: XPeachPricingCatalog['groupRatio']
  groups: GroupCatalog
}

/** HTTP adapter for XPeach relay, session, and site-administration endpoints. */
export class XPeachApi {
  private baseURL: string
  private readonly timeoutMs: number
  private readonly resolveKey: () => Promise<string>
  private readonly resolveAdmin: () => string | undefined
  private readonly resolveCookie: () => string | undefined
  private readonly onAuthRejected: ((status: 401 | 403, path: string, message: string) => void) | undefined
  private adminKeyOverride: string | undefined
  private sessionKeyOverride: string | undefined
  /**
   * Price sync table — the joined pricing catalog + group ratios, persisted at
   * the profile so every consumer (cost pill, market cells, estimates) reads
   * one clocked snapshot instead of paying a live fetch each time.
   */
  private priceCache: PriceCacheEntry | undefined
  private readonly priceCacheFile: string

  /** Site root this adapter talks to. */
  get siteBaseURL(): string { return this.baseURL }

  /**
   * Re-point every subsequent request at another site root.
   *
   * @param url - replacement site root URL.
   */
  setBaseURL(url: string): void { this.baseURL = url.replace(/\/+$/, '') }

  /**
   * Override the in-memory admin access token without reading disk.
   *
   * @param key - trimmed admin access token, or `undefined` to clear the override.
   */
  setAdminKey(key: string | undefined): void { this.adminKeyOverride = key }

  /**
   * Override the in-memory session cookie value without reading disk.
   *
   * @param cookie - trimmed session cookie value, or `undefined` to clear the override.
   */
  setSessionKey(cookie: string | undefined): void { this.sessionKeyOverride = cookie }

  constructor(options: XPeachApiOptions) {
    this.priceCacheFile = options.priceCacheFile ?? ''
    this.baseURL = options.baseURL
    this.timeoutMs = options.timeoutMs
    this.resolveKey = options.resolveKey
    this.resolveAdmin = options.resolveAdmin
    this.resolveCookie = options.resolveCookie
    this.onAuthRejected = options.onAuthRejected
  }

  private currentAdmin(): string | undefined {
    return this.adminKeyOverride ?? this.resolveAdmin()
  }

  private currentCookie(): string | undefined {
    return this.sessionKeyOverride ?? this.resolveCookie()
  }

  /* ---------- shared fetch seams ---------- */

  /** Bearer-key GET with New API envelope unwrap. */
  private async keyGet<T>(path: string, signal: AbortSignal): Promise<T> {
    const key = await this.resolveKey()
    return await this.fetchJson(this.baseURL + path, {
      headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' },
    }, this.timeoutMs, signal)
  }

  /** Bearer-key POST (JSON). */
  private async keyPost<T>(path: string, payload: unknown, timeoutScale: number, signal: AbortSignal): Promise<T> {
    const key = await this.resolveKey()
    return await this.fetchJson(this.baseURL + path, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key, Accept: 'application/json', 'Content-Type': 'application/json',
        'X-Conversation-ID': 'xpeach-console-playground',
      },
      body: JSON.stringify(payload),
    }, this.timeoutMs * timeoutScale, signal)
  }

  /** Admin-token GET (raw Authorization header, New API system-token style). */
  private async adminGet<T>(path: string, signal: AbortSignal): Promise<T> {
    const key = this.currentAdmin()
    if (key === undefined) {
      throw new RemoteError('xpeach/missing-credential', 'xpeach: no site-management token; drop it at the profile xpeach.admin file', { ref: 'admin' })
    }
    return await this.fetchJson(this.baseURL + path, {
      headers: { Authorization: key, Accept: 'application/json' },
    }, this.timeoutMs, signal)
  }

  private requireCookie(): string {
    const cookie = this.currentCookie()
    if (cookie === undefined) {
      throw new RemoteError('xpeach/missing-credential', 'xpeach: no site session; paste the session cookie in Settings → XPeach', { ref: 'session' })
    }
    return cookie
  }

  /** Session-cookie GET — full user scope (self/tokens/topup/aff/stripe). */
  private async sessionGet<T>(path: string, signal: AbortSignal): Promise<T> {
    const cookie = this.requireCookie()
    return await this.fetchJson(this.baseURL + path, {
      headers: { Cookie: 'session=' + cookie, Accept: 'application/json' },
    }, this.timeoutMs, signal)
  }

  /** Session-cookie POST (JSON body). */
  private async sessionPost<T>(path: string, payload: unknown, signal: AbortSignal): Promise<T> {
    return await this.sessionWrite('POST', path, payload, signal)
  }

  /** Session-cookie POST/PUT/DELETE (write verbs). */
  private async sessionWrite<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, payload: unknown, signal: AbortSignal): Promise<T> {
    const cookie = this.requireCookie()
    return await this.fetchJson(this.baseURL + path, {
      method,
      headers: { Cookie: 'session=' + cookie, Accept: 'application/json', 'Content-Type': 'application/json' },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    }, this.timeoutMs, signal)
  }

  /** User-scope GET over the login channel: Access Token first, session fallback. */
  private async authedGet<T>(path: string, signal: AbortSignal): Promise<T> {
    const token = this.currentAdmin()
    if (token !== undefined) {
      return await this.fetchJson(this.baseURL + path, {
        headers: { Authorization: token, Accept: 'application/json' },
      }, this.timeoutMs, signal)
    }
    return await this.sessionGet<T>(path, signal)
  }

  /** User-scope POST over the login channel. */
  private async authedPost<T>(path: string, payload: unknown, signal: AbortSignal): Promise<T> {
    const token = this.currentAdmin()
    if (token !== undefined) {
      return await this.fetchJson(this.baseURL + path, {
        method: 'POST',
        headers: { Authorization: token, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload ?? {}),
      }, this.timeoutMs, signal)
    }
    return await this.sessionPost<T>(path, payload, signal)
  }

  /** User-scope write verbs over the login channel. */
  private async authedWrite<T>(method: 'PUT' | 'DELETE', path: string, payload: unknown, signal: AbortSignal): Promise<T> {
    const token = this.currentAdmin()
    if (token !== undefined) {
      return await this.fetchJson(this.baseURL + path, {
        method,
        headers: { Authorization: token, Accept: 'application/json', 'Content-Type': 'application/json' },
        ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      }, this.timeoutMs, signal)
    }
    return await this.sessionWrite<T>(method, path, payload, signal)
  }

  /** Admin-token write verbs (POST/PUT/DELETE — same raw-Authorization channel). */
  private async adminWrite<T>(method: 'POST' | 'PUT' | 'DELETE' | 'PATCH', path: string, payload: unknown, signal: AbortSignal): Promise<T> {
    const key = this.currentAdmin()
    if (key === undefined) {
      throw new RemoteError('xpeach/missing-credential', 'xpeach: no site-management token; drop it at the profile xpeach.admin file', { ref: 'admin' })
    }
    return await this.fetchJson(this.baseURL + path, {
      method,
      headers: { Authorization: key, Accept: 'application/json', 'Content-Type': 'application/json' },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    }, this.timeoutMs, signal)
  }

  /**
   * Send one request, failing over to the other relay routes when the transport
   * itself fails.
   *
   * A dropped connection is a property of the route, not of the request, so the
   * same call is retried against the remaining routes before it is reported.
   * Whichever route answers becomes the active one.
   * @param url - absolute URL on the active route.
   * @param init - request to repeat.
   * @param timeoutMs - per-attempt deadline.
   * @param signal - carrier cancellation.
   * @returns the first successful response.
   */
  private async send(url: string, init: RequestInit, timeoutMs: number, signal: AbortSignal): Promise<Response> {
    const origin = new URL(url).origin
    const attempts = [url]
    for (const route of ROUTES) {
      if (route.url === origin) continue
      attempts.push(route.url + new URL(url).pathname + new URL(url).search)
    }
    let last: unknown
    for (const [index, target] of attempts.entries()) {
      try {
        const response = await fetch(target, {
          ...init,
          signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
        })
        if (index > 0) this.setBaseURL(new URL(target).origin)
        return response
      } catch (cause) {
        if (signal.aborted) throw cause
        last = cause
      }
    }
    throw last
  }

  private async fetchJson<T>(url: string, init: RequestInit, timeoutMs: number, signal: AbortSignal): Promise<T> {
    let response: Response
    try {
      response = await this.send(url, init, timeoutMs, signal)
    } catch (cause) {
      if (signal.aborted) throw cause
      throw new RemoteError('xpeach/request-failed', 'xpeach: request to ' + url + ' failed: ' + String(cause), { status: 0, message: String(cause) })
    }
    const body: unknown = await response.json().catch(() => undefined)
    const envelope = body as { success?: boolean; message?: string; data?: unknown; error?: { message?: string } } | undefined
    if (!response.ok || envelope?.success === false) {
      const message = envelope?.message ?? envelope?.error?.message ?? response.statusText
      if ((response.status === 401 || response.status === 403) && this.onAuthRejected !== undefined) {
        let pathname = url
        try {
          pathname = new URL(url).pathname
        } catch {
          // URL parsing failed; keep raw URL string.
        }
        if (pathname === '/api/user/self' || pathname.startsWith('/api/usage/token')) {
          this.onAuthRejected(response.status, pathname, message)
        }
      }
      throw new RemoteError('xpeach/request-failed', 'xpeach: request rejected: ' + message, { status: response.status, message })
    }
    return (envelope?.data ?? body) as T
  }

  /**
   * Check whether a site-management token is bound.
   *
   * @returns `true` when an admin token is available.
   */
  adminBound(): boolean {
    return this.currentAdmin() !== undefined
  }

  /* ---------- relay-key surfaces ---------- */

  /**
   * Fetch usage totals for the calling relay API token.
   *
   * @param signal - request cancellation signal.
   * @returns token usage summary.
   */
  tokenUsage(signal: AbortSignal): Promise<XPeachTokenUsage> {
    return this.keyGet('/api/usage/token/', signal)
  }

  /**
   * Fetch recent usage log entries for the calling relay API token.
   *
   * @param signal - request cancellation signal.
   * @returns token log rows.
   */
  tokenLogs(signal: AbortSignal): Promise<readonly XPeachTokenLogEntry[]> {
    return this.keyGet('/api/log/token', signal)
  }

  /**
   * Site group catalog the token can see — `{ name → { desc, models, ratio } }`.
   *
   * @param signal - request cancellation signal.
   * @returns group descriptors keyed by group name.
   */
  groups(signal: AbortSignal): Promise<GroupCatalog> {
    return this.keyGet('/api/user/groups', signal)
  }

  /**
   * Fetch the `/v1/models` catalog visible to the calling relay API token.
   *
   * @param signal - request cancellation signal.
   * @returns model catalog entries.
   */
  async models(signal: AbortSignal): Promise<readonly XPeachModel[]> {
    const list = await this.keyGet<unknown>('/v1/models', signal)
    const items = (list as { data?: unknown } | null | undefined)?.data ?? list
    return Array.isArray(items) ? items as readonly XPeachModel[] : []
  }

  /**
   * Fetch the signed-in user's profile via the admin access token.
   *
   * @param signal - request cancellation signal.
   * @returns user profile record.
   */
  self(signal: AbortSignal): Promise<XPeachUserSelf> {
    return this.adminGet('/api/user/self', signal)
  }

  /**
   * Fetch the signed-in user's profile via the session cookie exclusively.
   *
   * @param signal - request cancellation signal.
   * @returns user profile record.
   */
  sessionSelf(signal: AbortSignal): Promise<XPeachUserSelf> {
    return this.sessionGet('/api/user/self', signal)
  }

  /**
   * Fetch the first page of API tokens via the admin access token.
   *
   * @param signal - request cancellation signal.
   * @returns first page of token rows.
   */
  tokens(signal: AbortSignal): Promise<XPeachTokenPage> {
    return this.adminGet('/api/token/?p=1&size=50', signal)
  }

  /**
   * Execute a non-streamed chat completion against the relay.
   *
   * @param request - model, prompt, and token limits.
   * @param signal - request cancellation signal.
   * @returns completion content, token usage, and latency.
   */
  async chat(request: XPeachChatRequest, signal: AbortSignal): Promise<XPeachChatReply> {
    const started = Date.now()
    const body = await this.keyPost<{
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }>(
      '/v1/chat/completions',
      { model: request.model, messages: [{ role: 'user', content: request.prompt }], stream: false, max_tokens: request.maxTokens ?? 4096 },
      3, signal,
    )
    return {
      content: body.choices?.[0]?.message?.content ?? '',
      promptTokens: body.usage?.prompt_tokens ?? 0,
      completionTokens: body.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - started,
    }
  }

  /**
   * Streamed chat completion: reads the SSE body and invokes `onDelta` per
   * content delta; resolves with the assembled reply.
   *
   * @param request - model, prompt, and token limits.
   * @param onDelta - callback invoked for each streamed content delta.
   * @param signal - request cancellation signal.
   * @returns assembled completion content, token usage, and latency.
   */
  async chatStream(request: XPeachChatRequest, onDelta: (delta: string) => void, signal: AbortSignal): Promise<XPeachChatReply> {
    const started = Date.now()
    const key = await this.resolveKey()
    const url = this.baseURL + '/v1/chat/completions'
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + key, Accept: 'text/event-stream', 'Content-Type': 'application/json',
          'X-Conversation-ID': 'xpeach-console-playground',
        },
        body: JSON.stringify({
          model: request.model,
          messages: [{ role: 'user', content: request.prompt }],
          stream: true,
          stream_options: { include_usage: true },
          max_tokens: request.maxTokens ?? 4096,
        }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(this.timeoutMs * 3)]),
      })
    } catch (cause) {
      if (signal.aborted) throw cause
      throw new RemoteError('xpeach/request-failed', 'xpeach: request to ' + url + ' failed: ' + String(cause), { status: 0, message: String(cause) })
    }
    if (!response.ok || response.body === null) {
      const text = await response.text().catch(() => '')
      const snippet = text.slice(0, 200)
      throw new RemoteError(
        'xpeach/request-failed',
        `xpeach: /v1/chat/completions rejected: ${String(response.status)} ${snippet}`,
        { status: response.status, message: snippet },
      )
    }
    let content = ''
    let promptTokens = 0
    let completionTokens = 0
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split(String.fromCharCode(10))
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.slice(5).trim()
          if (data === '[DONE]') continue
          let parsed: { choices?: { delta?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } }
          try {
            parsed = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[]
              usage?: { prompt_tokens?: number; completion_tokens?: number }
            }
          } catch (_err) { continue }
          const delta = parsed.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta.length > 0) {
            content += delta
            onDelta(delta)
          }
          if (parsed.usage) {
            promptTokens = parsed.usage.prompt_tokens ?? promptTokens
            completionTokens = parsed.usage.completion_tokens ?? completionTokens
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
    return { content, promptTokens, completionTokens, latencyMs: Date.now() - started }
  }

  /**
   * One cheap health ping per model: a 1-token non-streamed completion against
   * the relay.
   *
   * @param model - catalog model identifier to probe.
   * @param signal - request cancellation signal.
   * @returns health status, mock classification, and round-trip latency.
   */
  async probe(model: string, signal: AbortSignal): Promise<XPeachHealthRow> {
    const started = Date.now()
    try {
      const key = await this.resolveKey()
      const response = await fetch(this.baseURL + '/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + key,
          // A real tracking header keeps the probe out of the site's
          // probe-classifier path — bare requests 400 on missing tracking.
          'X-Conversation-ID': 'xpeach-health-probe',
        },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ok' }], stream: false, max_tokens: 1 }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(this.timeoutMs)]),
      })
      const latencyMs = Date.now() - started
      const text = await response.text()
      if (!response.ok) return { id: model, ok: false, latencyMs, error: `HTTP ${String(response.status)}: ${text.slice(0, 120)}` }
      // A 200 can still be a mock channel answering "[Mock]本分组禁探针" —
      // that is a probe-verdict, not a healthy reply; surface it separately.
      const mocked = /\[Mock\]|禁探针/.test(text)
      return { id: model, ok: !mocked, mocked, latencyMs, error: mocked ? 'mock channel (probe-classified)' : undefined }
    } catch (error) {
      return { id: model, ok: false, mocked: false, latencyMs: undefined, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /* ---------- admin surfaces ---------- */

  /**
   * Fetch minimal admin identity fields.
   *
   * @param signal - request cancellation signal.
   * @returns admin display name, quota, and group.
   */
  adminSelf(signal: AbortSignal): Promise<{ display_name?: string; quota?: number; group?: string }> {
    return this.adminGet<{ display_name?: string; quota?: number; group?: string }>('/api/user/self', signal)
  }

  /**
   * Fetch a page of site users (admin scope).
   *
   * @param page - zero-based page index.
   * @param size - page size.
   * @param signal - request cancellation signal.
   * @returns paged list of site users.
   */
  adminUsers(page: number, size: number, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminUser>> {
    return this.adminGet(`/api/user/?p=${String(page)}&page_size=${String(size)}`, signal)
  }

  /**
   * Fetch a page of site tokens (admin scope).
   *
   * @param page - zero-based page index.
   * @param size - page size.
   * @param signal - request cancellation signal.
   * @returns paged list of site tokens.
   */
  adminTokens(page: number, size: number, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminToken>> {
    return this.adminGet(`/api/token/?p=${String(page)}&page_size=${String(size)}`, signal)
  }

  /**
   * Reveal a token's raw key through the access-token channel. New API returns
   * the stored key WITHOUT the `sk-` prefix — callers prepend it.
   *
   * @param id - token row identifier.
   * @param signal - request cancellation signal.
   * @returns object containing the unprefixed raw token key.
   */
  adminTokenKey(id: number, signal: AbortSignal): Promise<{ key?: string }> {
    return this.adminWrite('POST', `/api/token/${String(id)}/key`, undefined, signal)
  }

  /* ---------- price sync table ---------- */

  /** Refresh cadence: the site price sheet changes rarely; 10 min is honest. */
  private static readonly PRICE_TTL_MS = 10 * 60 * 1000

  private loadPriceCache(): void {
    if (this.priceCache !== undefined || this.priceCacheFile === '') return
    let raw: Partial<PriceCacheEntry> | undefined
    try {
      raw = JSON.parse(readFileSync(this.priceCacheFile, 'utf8')) as Partial<PriceCacheEntry>
    } catch (_err) { /* first run / unreadable — the next sync fills it */ }
    if (raw !== undefined && typeof raw.at === 'number' && Array.isArray(raw.entries)) {
      this.priceCache = { at: raw.at, entries: raw.entries, groupRatio: raw.groupRatio ?? {}, groups: raw.groups ?? {} }
    }
  }

  private savePriceCache(): void {
    if (this.priceCache === undefined || this.priceCacheFile === '') return
    try { mkdirSync(dirname(this.priceCacheFile), { recursive: true }) } catch (_err) { return }
    try { writeFileSync(this.priceCacheFile, JSON.stringify(this.priceCache)) } catch (_err) { /* cache is best-effort */ }
  }

  /**
   * The price sync table: admin pricing (model ratios) + PAT-visible group
   * catalog, refreshed when older than `PRICE_TTL_MS` or when forced. Falls
   * back to a stale snapshot when the site is unreachable.
   *
   * @param force - whether to bypass the in-memory TTL and fetch fresh pricing.
   * @param signal - request cancellation signal.
   * @returns synchronized pricing entries, group ratios, group catalog, and staleness flag.
   */
  async pricingSync(force: boolean, signal: AbortSignal): Promise<PriceCacheEntry & { stale: boolean }> {
    this.loadPriceCache()
    if (this.priceCache !== undefined && Date.now() - this.priceCache.at < XPeachApi.PRICE_TTL_MS && !force) {
      return { ...this.priceCache, stale: false }
    }
    const [pricing, groups] = await Promise.all([
      this.adminPricing(signal).catch(() => undefined),
      this.groups(signal).catch(() => undefined),
    ])
    if (pricing === undefined && groups === undefined) {
      if (this.priceCache !== undefined) return { ...this.priceCache, stale: true }
      throw new RemoteError('xpeach/request-failed', 'xpeach: price sync failed and no cache exists', { status: 0, message: 'sync failed' })
    }
    this.priceCache = {
      at: Date.now(),
      entries: pricing?.entries ?? this.priceCache?.entries ?? [],
      groupRatio: pricing?.groupRatio ?? this.priceCache?.groupRatio ?? {},
      groups: groups ?? this.priceCache?.groups ?? {},
    }
    this.savePriceCache()
    return { ...this.priceCache, stale: false }
  }

  /**
   * Fetch all site group names (admin scope).
   *
   * @param signal - request cancellation signal.
   * @returns list of group names.
   */
  adminGroups(signal: AbortSignal): Promise<readonly string[]> {
    return this.adminGet('/api/group/', signal)
  }

  /**
   * Full pricing catalog. The flat entry list is inside the envelope while the
   * per-group ratio table sits beside it on the raw body, so this call reads
   * the body directly instead of `adminGet`'s data unwrap.
   *
   * @param signal - request cancellation signal.
   * @returns pricing entries and group ratio map.
   */
  async adminPricing(signal: AbortSignal): Promise<XPeachPricingCatalog> {
    const key = this.currentAdmin()
    if (key === undefined) {
      throw new RemoteError('xpeach/missing-credential', 'xpeach: no site-management token; drop it at the profile xpeach.admin file', { ref: 'admin' })
    }
    let response: Response
    try {
      response = await fetch(this.baseURL + '/api/pricing', {
        headers: { Authorization: key, Accept: 'application/json' },
        signal: AbortSignal.any([signal, AbortSignal.timeout(this.timeoutMs)]),
      })
    } catch (cause) {
      if (signal.aborted) throw cause
      throw new RemoteError('xpeach/request-failed', 'xpeach: pricing fetch failed: ' + String(cause), { status: 0, message: String(cause) })
    }
    const body = await response.json().catch(() => undefined) as
      | { data?: readonly XPeachPricingEntry[]; group_ratio?: Record<string, number> }
      | undefined
    return { entries: body?.data ?? [], groupRatio: body?.group_ratio ?? {} }
  }

  /**
   * Recover the four billing multipliers for a model: catalog ratios joined
   * with the group discount the token's most recent call actually paid.
   *
   * @param model - catalog model identifier.
   * @param signal - request cancellation signal.
   * @param group - optional explicit group name to compute the rate under.
   * @returns resolved billing multipliers, or `undefined` when the model is absent from the catalog.
   */
  async billingRate(model: string, signal: AbortSignal, group?: string): Promise<XPeachBillingRate | undefined> {
    const catalog = await this.pricingSync(false, signal)
    const entry = catalog.entries.find(e => e.model_name === model)
    if (entry === undefined) return undefined
    let groupRatio = 1
    if (group !== undefined) {
      // Picked group: catalog's own per-group ratio wins — it is the site's
      // authoritative multiplier table; fall through to the PAT-visible
      // /api/user/groups ratio when admin-pricing omits it.
      const r = catalog.groupRatio[group]
      if (r !== undefined && r > 0) {
        groupRatio = r
      } else {
        const gr = catalog.groups[group]?.ratio
        const n = typeof gr === 'string' ? Number(gr) : gr
        if (typeof n === 'number' && n > 0) groupRatio = n
      }
    } else {
      const last = (await this.tokenLogs(signal).catch(() => []))
        .find(row => row.model_name === model)
      if (last?.other !== undefined) {
        let other: { group_ratio?: number } | undefined
        try { other = JSON.parse(last.other) as { group_ratio?: number } } catch (_err) { /* keep neutral group ratio */ }
        if (other !== undefined && typeof other.group_ratio === 'number' && other.group_ratio > 0) groupRatio = other.group_ratio
      }
    }
    return {
      modelRatio: entry.model_ratio ?? 1,
      completionRatio: entry.completion_ratio ?? 1,
      cacheRatio: entry.cache_ratio ?? 1,
      groupRatio,
      ...(group === undefined ? {} : { group }),
    }
  }

  /**
   * Fetch a page of site-wide usage logs (admin scope).
   *
   * @param page - zero-based page index.
   * @param size - page size.
   * @param query - optional username filter.
   * @param signal - request cancellation signal.
   * @returns paged list of admin log entries.
   */
  adminLogs(page: number, size: number, query: string | undefined, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminLogEntry>> {
    let path = `/api/log/?p=${String(page)}&page_size=${String(size)}`
    if (query !== undefined && query.length > 0) path += '&username=' + encodeURIComponent(query)
    return this.adminGet(path, signal)
  }

  /**
   * Fetch own-usage statistics via the admin access token.
   *
   * @param signal - request cancellation signal.
   * @returns quota, RPM, and TPM statistics.
   */
  adminSelfStat(signal: AbortSignal): Promise<{ quota?: number; rpm?: number; tpm?: number }> {
    return this.adminGet('/api/log/self/stat', signal)
  }

  /**
   * Overview aggregate — every contributor degrades independently.
   *
   * @param signal - request cancellation signal.
   * @returns aggregated admin overview metrics.
   */
  async adminOverview(signal: AbortSignal): Promise<XPeachAdminOverview> {
    const zero = { page: 0, page_size: 0, total: 0, items: [] as const }
    const [self, users, logs, tokens, groups, stat] = await Promise.all([
      this.adminSelf(signal).catch(() => ({ display_name: 'Admin' as const })),
      this.adminUsers(0, 1, signal).catch(() => zero),
      this.adminLogs(0, 1, undefined, signal).catch(() => zero),
      this.adminTokens(0, 1, signal).catch(() => zero),
      this.adminGroups(signal).catch(() => [] as readonly string[]),
      this.adminSelfStat(signal).catch((): { quota?: number; rpm?: number; tpm?: number } => ({})),
    ])
    return {
      adminName: self.display_name ?? 'Admin',
      totalUsers: users.total,
      totalLogs: logs.total,
      totalTokens: tokens.total,
      groups,
      selfQuotaUsed: stat.quota,
      rpm: stat.rpm,
      tpm: stat.tpm,
    }
  }

  /* ---------- session-cookie surfaces (user write scope) ---------- */

  /**
   * Check whether a site session cookie is bound.
   *
   * @returns `true` when a session cookie is available.
   */
  sessionBound(): boolean {
    return this.currentCookie() !== undefined
  }

  /**
   * Own user card: name/email/group/quota — the Access Token is the login state.
   *
   * @param signal - request cancellation signal.
   * @returns user profile record.
   */
  userSelf(signal: AbortSignal): Promise<XPeachUserSelf> {
    return this.authedGet('/api/user/self', signal)
  }

  /**
   * Own token list (name/quota/group/expiry).
   *
   * @param page - zero-based page index.
   * @param signal - request cancellation signal.
   * @returns paged list of user tokens.
   */
  userTokens(page: number, signal: AbortSignal): Promise<XPeachTokenPage> {
    return this.authedGet(`/api/token/?p=${String(page)}`, signal)
  }

  /**
   * Create a site token (name/quota/expiry/group/model limits).
   *
   * @param payload - token creation fields.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  userTokenCreate(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedPost('/api/token/', payload, signal)
  }

  /**
   * Update a site token — New API's PUT takes the full row at the collection URL.
   *
   * @param id - token row identifier.
   * @param payload - updated token fields.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  userTokenUpdate(id: number, payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedWrite('PUT', '/api/token/', { ...payload, id }, signal)
  }

  /**
   * Delete a site token.
   *
   * @param id - token row identifier.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  userTokenDelete(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedWrite('DELETE', `/api/token/${String(id)}`, undefined, signal)
  }

  /**
   * Redeem a top-up code.
   *
   * @param key - redemption code string.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  userTopup(key: string, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedPost('/api/user/topup', { key }, signal)
  }

  /**
   * Invitation/affiliate summary — New API returns the bare code string.
   *
   * @param signal - request cancellation signal.
   * @returns affiliate record containing `aff_code`.
   */
  async userAff(signal: AbortSignal): Promise<Record<string, JsonValue>> {
    const raw = await this.authedGet<JsonValue>('/api/user/aff', signal)
    return typeof raw === 'string' ? { aff_code: raw } : (raw as Record<string, JsonValue>)
  }

  /**
   * Own usage log page (newest first).
   *
   * @param page - zero-based page index.
   * @param size - page size.
   * @param signal - request cancellation signal.
   * @returns paged list of user usage log rows.
   */
  userLogs(page: number, size: number, signal: AbortSignal): Promise<XPeachSelfLogPage> {
    return this.authedGet(`/api/log/self?p=${String(page)}&page_size=${String(size)}`, signal)
  }

  /**
   * Own usage totals (quota / rpm / tpm).
   *
   * @param signal - request cancellation signal.
   * @returns own usage statistics.
   */
  userLogStat(signal: AbortSignal): Promise<XPeachSelfLogStat> {
    return this.authedGet('/api/log/self/stat', signal)
  }

  /**
   * Interactive login: launch a persistent (headed) Chromium on the site's login
   * page; the user solves Turnstile in the window, and the session cookie is
   * harvested the moment it lands. The temp profile is deleted on exit.
   *
   * @param signal - request cancellation signal.
   * @returns harvested `session` cookie value.
   */
  async sessionLoginInteractive(signal: AbortSignal): Promise<string> {
    // Playwright ships with the workspace's web test tooling, not this package —
    // resolve through the apps/web package (monorepo sibling) via createRequire.
    const { createRequire } = await import('node:module')
    const { fileURLToPath, pathToFileURL } = await import('node:url')
    const anchors = [
      fileURLToPath(new URL('../../../../apps/web/package.json', import.meta.url)),
      fileURLToPath(new URL('../../../apps/web/package.json', import.meta.url)),
      fileURLToPath(new URL('../../apps/web/package.json', import.meta.url)),
    ]
    let mod: unknown = null
    const tried: string[] = []
    for (const rel of anchors) {
      try {
        const req = createRequire(rel)
        mod = await import(pathToFileURL(req.resolve('playwright')).href)
        break
      } catch (e) { tried.push(rel + ':' + String(e).slice(0, 60)) }
    }
    if (mod === null) {
      const bareSpec = 'playwright'
      try { mod = await import(bareSpec) } catch (e) { tried.push('bare:' + String(e).slice(0, 60)) }
    }
    if (mod === null) throw new Error('playwright unavailable [' + tried.join(' | ') + ']')
    const pw = ((mod as { default?: unknown }).default ?? mod) as {
      chromium?: { launchPersistentContext(dir: string, opts: Record<string, unknown>): Promise<{
        pages(): { isClosed(): boolean; goto(url: string, o: Record<string, unknown>): Promise<unknown> }[]
        newPage(): Promise<{ isClosed(): boolean; goto(url: string, o: Record<string, unknown>): Promise<unknown> }>
        cookies(url: string): Promise<{ name: string; value: string }[]>
        close(): Promise<void>
      }> }
    }
    if (pw.chromium === undefined) throw new Error('playwright module shape unexpected: ' + Object.keys(mod as object).join(','))
    const os = await import('node:os')
    const path = await import('node:path')
    const profileDir = path.join(os.tmpdir(), `xpeach-login-${String(Date.now())}`)
    console.error('[xpeach-login] resolved playwright, launching headed chromium…')
    const context = await pw.chromium.launchPersistentContext(profileDir, { headless: false, args: ['--window-size=480,720'], timeout: 20000 })
    console.error('[xpeach-login] chromium up, goto login page')
    try {
      const page = context.pages()[0] ?? await context.newPage()
      await page.goto(this.baseURL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
      console.error('[xpeach-login] login page loaded, polling cookies')
      const deadline = Date.now() + 120_000
      while (Date.now() < deadline) {
        if (signal.aborted) throw new Error('login cancelled')
        const cookies: { name: string; value: string }[] = await context.cookies(this.baseURL)
        const hit = cookies.find(c => c.name === 'session' && c.value !== '')
        if (hit !== undefined) return hit.value
        await new Promise(res => setTimeout(res, 1500))
        // Window closed by the user → abort quietly.
        if (!page.isClosed()) continue
        throw new Error('login window closed before sign-in')
      }
      throw new Error('login timed out (120s)')
    } finally {
      await context.close().catch(() => {})
      const { rmSync } = await import('node:fs')
      try { rmSync(profileDir, { recursive: true, force: true }) } catch (_err) { /* best effort */ }
    }
  }

  /**
   * Reveal a token's full key (session scope, CriticalRateLimit).
   *
   * @param id - token row identifier.
   * @param signal - request cancellation signal.
   * @returns object containing the raw token key.
   */
  userTokenKey(id: number, signal: AbortSignal): Promise<{ key?: string }> {
    return this.authedPost(`/api/token/${String(id)}/key`, undefined, signal)
  }

  /**
   * Per-day usage rows for the self account.
   *
   * @param signal - request cancellation signal.
   * @returns self usage data payload.
   */
  userSelfData(signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return this.authedGet('/api/data/self', signal)
  }

  /**
   * Update own profile fields (username/password/email).
   *
   * @param payload - profile fields to update.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  userSelfEdit(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedWrite('PUT', '/api/user/self', payload, signal)
  }

  /**
   * Stripe checkout preview: credited money for a quota amount.
   *
   * @param amount - top-up amount to preview.
   * @param signal - request cancellation signal.
   * @returns preview result from Stripe endpoint.
   */
  stripeAmount(amount: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.sessionPost('/api/user/stripe/amount', { amount }, signal)
  }

  /**
   * Stripe checkout: returns the hosted pay link (open in the internal window).
   *
   * @param amount - top-up amount to charge.
   * @param paymentMethod - selected payment method identifier.
   * @param signal - request cancellation signal.
   * @returns checkout session payload.
   */
  stripePay(amount: number, paymentMethod: string, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.sessionPost('/api/user/stripe/pay', { amount, payment_method: paymentMethod }, signal)
  }

  /* ---------- admin write surfaces ---------- */

  /**
   * Fetch a page of upstream channels (admin scope).
   *
   * @param page - zero-based page index.
   * @param signal - request cancellation signal.
   * @returns paged list of channels.
   */
  adminChannels(page: number, signal: AbortSignal): Promise<XPeachAdminPage<XPeachChannel>> {
    return this.adminGet(`/api/channel/?p=${String(page)}`, signal)
  }

  /**
   * Create or update an upstream channel (admin scope).
   *
   * @param payload - channel record (`id` present updates, absent creates).
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminChannelSave(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return payload['id'] === undefined
      ? this.adminWrite('POST', '/api/channel/', payload, signal)
      : this.adminWrite('PUT', '/api/channel/', payload, signal)
  }

  /**
   * Delete an upstream channel (admin scope).
   *
   * @param id - channel identifier.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminChannelDelete(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('DELETE', `/api/channel/${String(id)}`, undefined, signal)
  }

  /**
   * Run a connectivity test against an upstream channel (admin scope).
   *
   * @param id - channel identifier.
   * @param signal - request cancellation signal.
   * @returns channel test result.
   */
  adminChannelTest(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminGet(`/api/channel/test/${String(id)}`, signal)
  }

  /**
   * Create a site token (admin scope).
   *
   * @param payload - token creation fields.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminTokenCreate(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('POST', '/api/token/', payload, signal)
  }

  /**
   * Read one token row (access-token channel).
   *
   * @param id - token row identifier.
   * @param signal - request cancellation signal.
   * @returns token row fields.
   */
  adminTokenGet(id: number, signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return this.adminGet<Record<string, JsonValue>>(`/api/token/${String(id)}`, signal)
  }

  /**
   * Update a token row — New API's PUT takes the full row body (`id` included).
   *
   * @param payload - full token row fields.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminTokenUpdate(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('PUT', '/api/token/', payload, signal)
  }

  /**
   * Delete a token row (admin scope).
   *
   * @param id - token row identifier.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminTokenDelete(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('DELETE', `/api/token/${String(id)}`, undefined, signal)
  }

  /**
   * Mint redemption codes (admin scope).
   *
   * @param quota - quota granted per code.
   * @param count - number of codes to mint.
   * @param name - batch label.
   * @param signal - request cancellation signal.
   * @returns generated redemption code strings.
   */
  adminRedemptionCreate(quota: number, count: number, name: string, signal: AbortSignal): Promise<readonly string[]> {
    return this.adminWrite('POST', '/api/redemption/', { quota, count, name }, signal)
  }

  /**
   * Delete a redemption code row (admin scope).
   *
   * @param id - redemption row identifier.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminRedemptionDelete(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('DELETE', `/api/redemption/${String(id)}`, undefined, signal)
  }

  /**
   * Fetch a page of redemption codes (admin scope).
   *
   * @param page - zero-based page index.
   * @param signal - request cancellation signal.
   * @returns paged list of redemption rows.
   */
  adminRedemptions(page: number, signal: AbortSignal): Promise<XPeachAdminPage<XPeachRedemption>> {
    return this.adminGet(`/api/redemption/?p=${String(page)}`, signal)
  }

  /**
   * Fetch site configuration options (admin scope).
   *
   * @param signal - request cancellation signal.
   * @returns list of option key/value pairs.
   */
  adminOptions(signal: AbortSignal): Promise<readonly { key: string; value: string }[]> {
    return this.adminGet('/api/option/', signal)
  }

  /**
   * Update one site configuration option (admin scope).
   *
   * @param key - option key.
   * @param value - serialized option value.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminOptionSet(key: string, value: string, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('PUT', '/api/option/', { key, value }, signal)
  }

  /**
   * Fetch the public/site notice markdown (admin scope).
   *
   * @param signal - request cancellation signal.
   * @returns notice text.
   */
  adminNotice(signal: AbortSignal): Promise<string> {
    return this.adminGet('/api/notice', signal)
  }

  /**
   * Single full user row (admin scope) — needed as the PUT base object.
   *
   * @param id - user identifier.
   * @param signal - request cancellation signal.
   * @returns user record.
   */
  adminUserGet(id: number, signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return this.adminGet(`/api/user/${String(id)}`, signal)
  }

  /**
   * Full-object user update (role is server-pinned to origin).
   *
   * @param user - full user record to save.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminUserUpdate(user: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('PUT', '/api/user/', user, signal)
  }

  /**
   * Lightweight manage verb: `add_quota` / `enable` / `disable` / `logout`.
   *
   * @param id - target user identifier.
   * @param action - management action verb.
   * @param value - numeric value associated with the action.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminUserManage(id: number, action: string, value: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('POST', '/api/user/manage', { id, action, value }, signal)
  }

  /**
   * Model-level pricing snapshot (PATCH-optimistic-locked entries).
   *
   * @param signal - request cancellation signal.
   * @returns model pricing snapshot.
   */
  adminModelPricing(signal: AbortSignal): Promise<XPeachModelPricingSnapshot> {
    return this.adminGet('/api/option/model_pricing', signal)
  }

  /**
   * Apply optimistic-locked per-model pricing changes (`version = entry.version`).
   *
   * @param changes - list of optimistic-locked pricing changes.
   * @param signal - request cancellation signal.
   * @returns write operation result.
   */
  adminModelPricingPatch(changes: readonly XPeachModelPricingChange[], signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('PATCH', '/api/option/model_pricing', { changes }, signal)
  }

  /* ---------- XPeach SSO Device Authorization & Bridge surfaces ---------- */

  private ssoBaseURLOverride: string | undefined

  private candidateSsoBaseURLs(ssoBaseURL: string): string[] {
    const primary = validateSsoBaseUrl(this.ssoBaseURLOverride ?? ssoBaseURL)
    const candidates = [primary]
    const fallbackLocal = 'http://localhost:3000'
    if (primary !== fallbackLocal) {
      candidates.push(fallbackLocal)
    }
    return candidates
  }

  /**
   * Initiate an XPeach SSO Device Authorization session (`POST /api/v1/device/authorize`).
   *
   * @param ssoBaseURL - root URL of the XPeach SSO service.
   * @param clientId - registered client identifier.
   * @param clientName - human-readable device/client label.
   * @param signal - request cancellation signal.
   * @returns device code, user code, verification URLs, and polling parameters.
   */
  async ssoDeviceAuthorize(
    ssoBaseURL: string,
    clientId: string,
    clientName: string,
    signal: AbortSignal,
  ): Promise<Omit<XPeachSsoDeviceStartResult, 'browserOpened'>> {
    const candidates = this.candidateSsoBaseURLs(ssoBaseURL)
    let response: Response | undefined
    let activeBase = candidates[0] ?? ssoBaseURL
    let lastCause: unknown
    for (const candidate of candidates) {
      try {
        const res = await fetch(`${candidate}/api/v1/device/authorize`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            clientName,
            scope: 'openid profile email offline_access peachcode:credentials',
          }),
          signal: AbortSignal.any([signal, AbortSignal.timeout(Math.min(this.timeoutMs, 5000))]),
        })
        if (res.status === 404 && candidates.length > 1 && candidate !== candidates[candidates.length - 1]) {
          continue
        }
        response = res
        activeBase = candidate
        this.ssoBaseURLOverride = candidate
        break
      } catch (cause) {
        if (signal.aborted) throw cause
        lastCause = cause
      }
    }
    if (response === undefined) {
      throw new RemoteError('xpeach/request-failed', `xpeach: SSO device authorize failed: ${String(lastCause)}`, { status: 0, message: String(lastCause) })
    }
    const body = await response.json().catch(() => undefined) as Record<string, unknown> | undefined
    if (!response.ok || body === undefined) {
      const msg = typeof body?.['message'] === 'string'
        ? body['message']
        : typeof body?.['error'] === 'string'
          ? body['error']
          : response.statusText
      throw new RemoteError('xpeach/request-failed', `xpeach: SSO device authorize rejected: ${msg}`, { status: response.status, message: msg })
    }
    const readStr = (val: unknown, fallback = ''): string => typeof val === 'string' ? val : fallback
    const deviceCode = readStr(body['deviceCode'] ?? body['device_code'])
    const userCode = readStr(body['userCode'] ?? body['user_code'])
    const rawVerificationUri = readStr(body['verificationUri'] ?? body['verification_uri'], `${activeBase}/device`)
    const verificationUri = validateVerificationUrl(rawVerificationUri, activeBase)
    const rawVerificationUriComplete = readStr(
      body['verificationUriComplete'] ?? body['verification_uri_complete'],
      `${verificationUri}?code=${encodeURIComponent(userCode)}`,
    )
    const verificationUriComplete = validateVerificationUrl(rawVerificationUriComplete, activeBase)
    const expiresIn = typeof body['expiresIn'] === 'number'
      ? body['expiresIn']
      : typeof body['expires_in'] === 'number'
        ? body['expires_in']
        : 600
    const interval = typeof body['interval'] === 'number' && body['interval'] > 0 ? body['interval'] : 2
    if (deviceCode.length === 0 || userCode.length === 0) {
      throw new RemoteError('xpeach/request-failed', 'xpeach: SSO device authorize returned incomplete codes', { status: response.status, message: 'incomplete device payload' })
    }
    return {
      deviceCode,
      userCode,
      verificationUri,
      verificationUriComplete,
      expiresIn,
      interval,
    }
  }

  /**
   * Poll the XPeach SSO Device Token endpoint (`POST /api/v1/device/token`).
   *
   * @param ssoBaseURL - root URL of the XPeach SSO service.
   * @param clientId - registered client identifier.
   * @param deviceCode - opaque device code from `ssoDeviceAuthorize`.
   * @param signal - request cancellation signal.
   * @returns current device authorization status and bridged credentials when approved.
   */
  async ssoDeviceToken(
    ssoBaseURL: string,
    clientId: string,
    deviceCode: string,
    signal: AbortSignal,
  ): Promise<{
    readonly status: 'pending' | 'approved' | 'expired' | 'denied' | 'error'
    readonly message?: string | undefined
    readonly payload?: XPeachSsoBridgePayload | undefined
  }> {
    const candidates = this.candidateSsoBaseURLs(ssoBaseURL)
    let response: Response | undefined
    let lastCause: unknown
    for (const candidate of candidates) {
      try {
        const res = await fetch(`${candidate}/api/v1/device/token`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, deviceCode }),
          signal: AbortSignal.any([signal, AbortSignal.timeout(Math.min(this.timeoutMs, 5000))]),
        })
        if (res.status === 404 && candidates.length > 1 && candidate !== candidates[candidates.length - 1]) {
          continue
        }
        response = res
        this.ssoBaseURLOverride = candidate
        break
      } catch (cause) {
        if (signal.aborted) throw cause
        lastCause = cause
      }
    }
    if (response === undefined) {
      return { status: 'error', message: String(lastCause) }
    }
    const body = await response.json().catch(() => undefined) as Record<string, unknown> | undefined
    if (body === undefined) {
      return { status: 'error', message: `HTTP ${String(response.status)}` }
    }
    const rawStatus = typeof body['status'] === 'string'
      ? body['status']
      : typeof body['error'] === 'string'
        ? body['error']
        : ''
    if (rawStatus === 'authorization_pending' || rawStatus === 'pending' || rawStatus === 'slow_down') {
      return { status: 'pending' }
    }
    if (rawStatus === 'expired_token' || rawStatus === 'expired' || rawStatus === 'invalid_grant') {
      return { status: 'expired', message: typeof body['message'] === 'string' ? body['message'] : '验证码已过期' }
    }
    if (rawStatus === 'access_denied' || rawStatus === 'denied') {
      return { status: 'denied', message: typeof body['message'] === 'string' ? body['message'] : '已拒绝授权' }
    }
    if (body['ok'] === true || rawStatus === 'approved') {
      return {
        status: 'approved',
        payload: {
          sso: body['sso'] as XPeachSsoBridgePayload['sso'],
          peachcode: body['peachcode'] as XPeachSsoBridgePayload['peachcode'],
        },
      }
    }
    return {
      status: 'error',
      message: typeof body['message'] === 'string' ? body['message'] : (rawStatus || `HTTP ${String(response.status)}`),
    }
  }

  /**
   * Fetch or refresh PeachCode (NewAPI) credentials from XPeach SSO using a
   * previously issued SSO Bearer `AccessToken` (`POST /api/v1/peachcode/credentials`).
   * Distinguishes definitive revocation/ban (`401`/`403` -> `status: 'revoked'`)
   * from transient network or 5xx failures (`status: 'transient_error'`).
   *
   * @param ssoBaseURL - root URL of the XPeach SSO service.
   * @param ssoAccessToken - opaque or JWT SSO access token (`xph_at_...`).
   * @param signal - request cancellation signal.
   * @returns credential sync status and payload when valid.
   */
  async ssoPeachcodeCredentials(
    ssoBaseURL: string,
    ssoAccessToken: string,
    signal: AbortSignal,
  ): Promise<XPeachSsoCredentialSyncResult> {
    const candidates = this.candidateSsoBaseURLs(ssoBaseURL)
    let response: Response | undefined
    let lastCause: unknown
    for (const candidate of candidates) {
      try {
        const res = await fetch(`${candidate}/api/v1/peachcode/credentials`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${ssoAccessToken}`,
          },
          signal: AbortSignal.any([signal, AbortSignal.timeout(Math.min(this.timeoutMs, 5000))]),
        })
        if (res.status === 404 && candidates.length > 1 && candidate !== candidates[candidates.length - 1]) {
          continue
        }
        response = res
        this.ssoBaseURLOverride = candidate
        break
      } catch (cause) {
        if (signal.aborted) throw cause
        lastCause = cause
      }
    }
    if (response === undefined) {
      return {
        status: 'transient_error',
        message: String(lastCause),
      }
    }
    const body = await response.json().catch(() => undefined) as Record<string, unknown> | undefined
    if (response.status === 401 || response.status === 403) {
      const msg = typeof body?.['message'] === 'string'
        ? body['message']
        : typeof body?.['error'] === 'string'
          ? body['error']
          : response.statusText
      return {
        status: 'revoked',
        code: response.status,
        message: msg || (response.status === 403 ? 'Account has been disabled' : 'SSO session expired or revoked'),
      }
    }
    if (!response.ok || body?.['ok'] !== true) {
      const msg = typeof body?.['message'] === 'string'
        ? body['message']
        : typeof body?.['error'] === 'string'
          ? body['error']
          : response.statusText
      return {
        status: 'transient_error',
        message: msg || `HTTP ${String(response.status)}`,
      }
    }
    return {
      status: 'ok',
      payload: {
        sso: body['sso'] as XPeachSsoBridgePayload['sso'],
        peachcode: body['peachcode'] as XPeachSsoBridgePayload['peachcode'],
      },
    }
  }

  /**
   * Self-revoke the active SSO session and optionally all device tokens and
   * PeachCode credentials (`POST /api/v1/peachcode/revoke` Mode B).
   *
   * @param ssoBaseURL - root URL of the XPeach SSO service.
   * @param ssoAccessToken - active SSO Bearer access token (`xph_at_...`).
   * @param options - revocation scope flags (`allDevices`, `revokePeachcode`).
   * @param signal - request cancellation signal.
   * @returns `true` when the SSO server acknowledged revocation.
   */
  async ssoRevokeToken(
    ssoBaseURL: string,
    ssoAccessToken: string,
    options: XPeachSsoRevokeRequest,
    signal: AbortSignal,
  ): Promise<boolean> {
    const candidates = this.candidateSsoBaseURLs(ssoBaseURL)
    for (const candidate of candidates) {
      try {
        const res = await fetch(`${candidate}/api/v1/peachcode/revoke`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ssoAccessToken}`,
          },
          body: JSON.stringify({
            allDevices: options.allDevices ?? false,
            revokePeachcode: options.revokePeachcode ?? false,
          }),
          signal: AbortSignal.any([signal, AbortSignal.timeout(Math.min(this.timeoutMs, 5000))]),
        })
        if (res.status === 404 && candidates.length > 1 && candidate !== candidates[candidates.length - 1]) {
          continue
        }
        return res.ok
      } catch (cause) {
        if (signal.aborted) throw cause
      }
    }
    return false
  }
}
