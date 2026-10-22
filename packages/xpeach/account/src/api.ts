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
} from './types.ts'

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
}

export class XPeachApi {
  private baseURL: string
  private readonly timeoutMs: number
  private readonly resolveKey: () => Promise<string>
  private readonly resolveAdmin: () => string | undefined
  private readonly resolveCookie: () => string | undefined
  /**
   * Price sync table — the joined pricing catalog + group ratios, persisted at
   * the profile so every consumer (cost pill, market cells, estimates) reads
   * one clocked snapshot instead of paying a live fetch each time.
   */
  private priceCache: { at: number, entries: XPeachPricingCatalog['entries'], groupRatio: XPeachPricingCatalog['groupRatio'], groups: Record<string, { desc?: string, models?: readonly string[], ratio?: string | number }> } | undefined
  private readonly priceCacheFile: string

  /** Site root this adapter talks to. */
  get siteBaseURL(): string { return this.baseURL }

  /** Re-point every subsequent request at another site root. */
  setBaseURL(url: string): void { this.baseURL = url.replace(/\/+$/, '') }

  constructor(options: XPeachApiOptions) {
    this.priceCacheFile = options.priceCacheFile ?? ''
    this.baseURL = options.baseURL
    this.timeoutMs = options.timeoutMs
    this.resolveKey = options.resolveKey
    this.resolveAdmin = options.resolveAdmin
    this.resolveCookie = options.resolveCookie ?? (() => undefined)
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
    const key = this.resolveAdmin()
    if (key === undefined) {
      throw new RemoteError('xpeach/missing-credential', 'xpeach: no site-management token; drop it at the profile xpeach.admin file', { ref: 'admin' })
    }
    return await this.fetchJson(this.baseURL + path, {
      headers: { Authorization: key, Accept: 'application/json' },
    }, this.timeoutMs, signal)
  }

  /** Session-cookie GET — full user scope (self/tokens/topup/aff/stripe). */
  private async sessionGet<T>(path: string, signal: AbortSignal): Promise<T> {
    const cookie = this.resolveCookie()
    if (cookie === undefined) {
      throw new RemoteError('xpeach/missing-credential', 'xpeach: no site session; paste the session cookie in Settings → XPeach', { ref: 'session' })
    }
    return await this.fetchJson(this.baseURL + path, {
      headers: { Cookie: 'session=' + cookie, Accept: 'application/json' },
    }, this.timeoutMs, signal)
  }

  /** Session-cookie POST (JSON body). */
  private async sessionPost<T>(path: string, payload: unknown, signal: AbortSignal): Promise<T> {
    const cookie = this.resolveCookie()
    if (cookie === undefined) {
      throw new RemoteError('xpeach/missing-credential', 'xpeach: no site session; paste the session cookie in Settings → XPeach', { ref: 'session' })
    }
    return await this.fetchJson(this.baseURL + path, {
      method: 'POST',
      headers: { Cookie: 'session=' + cookie, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, this.timeoutMs, signal)
  }

  /** Session-cookie PUT/DELETE (write verbs). */
  private async sessionWrite<T>(method: 'PUT' | 'DELETE', path: string, payload: unknown, signal: AbortSignal): Promise<T> {
    const cookie = this.resolveCookie()
    if (cookie === undefined) {
      throw new RemoteError('xpeach/missing-credential', 'xpeach: no site session; paste the session cookie in Settings → XPeach', { ref: 'session' })
    }
    return await this.fetchJson(this.baseURL + path, {
      method,
      headers: { Cookie: 'session=' + cookie, Accept: 'application/json', 'Content-Type': 'application/json' },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    }, this.timeoutMs, signal)
  }

  /** User-scope GET over the login channel: Access Token first, session fallback. */
  private async authedGet<T>(path: string, signal: AbortSignal): Promise<T> {
    const token = this.resolveAdmin()
    if (token !== undefined) {
      return await this.fetchJson(this.baseURL + path, {
        headers: { Authorization: token, Accept: 'application/json' },
      }, this.timeoutMs, signal)
    }
    return await this.sessionGet<T>(path, signal)
  }

  /** User-scope POST over the login channel. */
  private async authedPost<T>(path: string, payload: unknown, signal: AbortSignal): Promise<T> {
    const token = this.resolveAdmin()
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
    const token = this.resolveAdmin()
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
    const key = this.resolveAdmin()
    if (key === undefined) {
      throw new RemoteError('xpeach/missing-credential', 'xpeach: no site-management token; drop it at the profile xpeach.admin file', { ref: 'admin' })
    }
    return await this.fetchJson(this.baseURL + path, {
      method,
      headers: { Authorization: key, Accept: 'application/json', 'Content-Type': 'application/json' },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    }, this.timeoutMs, signal)
  }

  /** Core fetch + envelope handling shared by both credential channels. */
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
    const envelope = body as { success?: boolean, message?: string, data?: unknown, error?: { message?: string } } | undefined
    if (!response.ok || envelope?.success === false) {
      const message = envelope?.message ?? envelope?.error?.message ?? response.statusText
      throw new RemoteError('xpeach/request-failed', 'xpeach: request rejected: ' + message, { status: response.status, message })
    }
    return (envelope?.data ?? body) as T
  }

  /** Has a site-management token? (UI gates admin surfaces on this.) */
  adminBound(): boolean {
    return this.resolveAdmin() !== undefined
  }

  /* ---------- relay-key surfaces ---------- */

  tokenUsage(signal: AbortSignal): Promise<XPeachTokenUsage> {
    return this.keyGet('/api/usage/token/', signal)
  }
  tokenLogs(signal: AbortSignal): Promise<readonly XPeachTokenLogEntry[]> {
    return this.keyGet('/api/log/token', signal)
  }
  /**
   * Site group catalog the token can see — { name → { desc, models, ratio } }.
   * This is the two-step picker's source: model → containing groups → ratio.
   */
  groups(signal: AbortSignal): Promise<Record<string, { desc?: string, models?: readonly string[], ratio?: string | number }>> {
    return this.keyGet('/api/user/groups', signal)
  }
  async models(signal: AbortSignal): Promise<readonly XPeachModel[]> {
    const list = await this.keyGet<unknown>('/v1/models', signal)
    const items = (list as { data?: unknown })?.data ?? list
    return Array.isArray(items) ? items as readonly XPeachModel[] : []
  }
  self(signal: AbortSignal): Promise<XPeachUserSelf> {
    return this.adminGet('/api/user/self', signal)
  }
  tokens(signal: AbortSignal): Promise<XPeachTokenPage> {
    return this.adminGet('/api/token/?p=1&size=50', signal)
  }

  /** Non-streamed chat completion (playground fallback path). */
  async chat(request: XPeachChatRequest, signal: AbortSignal): Promise<XPeachChatReply> {
    const started = Date.now()
    const body = await this.keyPost<{ choices?: { message?: { content?: string } }[], usage?: { prompt_tokens?: number, completion_tokens?: number } }>(
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
   * Streamed chat completion: reads the SSE body and invokes onDelta per
   * content delta; resolves with the assembled reply so streaming stays a
   * progressive enhancement on the same contract.
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
      throw new RemoteError('xpeach/request-failed', 'xpeach: /v1/chat/completions rejected: ' + response.status + ' ' + text.slice(0, 200), { status: response.status, message: text.slice(0, 200) })
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
          let parsed: { choices?: { delta?: { content?: string } }[], usage?: { prompt_tokens?: number, completion_tokens?: number } }
          try { parsed = JSON.parse(data) } catch { continue }
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
   * the relay. timeoutMs bounds each probe; the caller fans these out.
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
      if (!response.ok) return { id: model, ok: false, latencyMs, error: 'HTTP ' + response.status + ': ' + text.slice(0, 120) }
      // A 200 can still be a mock channel answering "[Mock]本分组禁探针" —
      // that is a probe-verdict, not a healthy reply; surface it separately.
      const mocked = /\[Mock\]|禁探针/.test(text)
      return { id: model, ok: !mocked, mocked, latencyMs, error: mocked ? 'mock channel (probe-classified)' : undefined }
    } catch (error) {
      return { id: model, ok: false, mocked: false, latencyMs: undefined, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /* ---------- admin surfaces ---------- */

  adminSelf(signal: AbortSignal) {
    return this.adminGet<{ display_name?: string, quota?: number, group?: string }>('/api/user/self', signal)
  }
  adminUsers(page: number, size: number, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminUser>> {
    return this.adminGet('/api/user/?p=' + page + '&page_size=' + size, signal)
  }
  adminTokens(page: number, size: number, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminToken>> {
    return this.adminGet('/api/token/?p=' + page + '&page_size=' + size, signal)
  }
  /**
   * Reveal a token's raw key through the access-token channel. New API returns
   * the stored key WITHOUT the `sk-` prefix — callers prepend it.
   */
  adminTokenKey(id: number, signal: AbortSignal): Promise<{ key?: string }> {
    return this.adminWrite('POST', '/api/token/' + id + '/key', undefined, signal) as Promise<{ key?: string }>
  }

  /* ---------- price sync table ---------- */

  /** Refresh cadence: the site price sheet changes rarely; 10 min is honest. */
  private static readonly PRICE_TTL_MS = 10 * 60 * 1000

  private loadPriceCache(): void {
    if (this.priceCache !== undefined || this.priceCacheFile === '') return
    try {
      const raw = JSON.parse(readFileSync(this.priceCacheFile, 'utf8')) as { at?: number, entries?: XPeachPricingCatalog['entries'], groupRatio?: XPeachPricingCatalog['groupRatio'], groups?: Record<string, { desc?: string, models?: readonly string[], ratio?: string | number }> }
      if (typeof raw.at === 'number' && Array.isArray(raw.entries)) {
        this.priceCache = { at: raw.at, entries: raw.entries, groupRatio: raw.groupRatio ?? {}, groups: raw.groups ?? {} }
      }
    } catch { /* first run / unreadable — the next sync fills it */ }
  }

  private savePriceCache(): void {
    if (this.priceCache === undefined || this.priceCacheFile === '') return
    try {
      mkdirSync(dirname(this.priceCacheFile), { recursive: true })
      writeFileSync(this.priceCacheFile, JSON.stringify(this.priceCache))
    } catch { /* cache is best-effort */ }
  }

  /**
   * The price sync table: admin pricing (model ratios) + PAT-visible group
   * catalog, refreshed when older than PRICE_TTL_MS or when forced. Falls
   * back to a stale snapshot when the site is unreachable — the UI's numbers
   * stay consistent rather than disappearing mid-session.
   */
  async pricingSync(force: boolean, signal: AbortSignal): Promise<{ at: number, entries: XPeachPricingCatalog['entries'], groupRatio: XPeachPricingCatalog['groupRatio'], groups: Record<string, { desc?: string, models?: readonly string[], ratio?: string | number }>, stale: boolean }> {
    this.loadPriceCache()
    const fresh = this.priceCache !== undefined && Date.now() - this.priceCache.at < XPeachApi.PRICE_TTL_MS
    if (fresh && !force) return { ...this.priceCache!, stale: false }
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
  adminGroups(signal: AbortSignal): Promise<readonly string[]> {
    return this.adminGet('/api/group/', signal)
  }
  /**
   * Full pricing catalog. The flat entry list is inside the envelope while the
   * per-group ratio table sits beside it on the raw body, so this one call
   * reads the body directly instead of adminGet's data unwrap.
   */
  async adminPricing(signal: AbortSignal): Promise<XPeachPricingCatalog> {
    const key = this.resolveAdmin()
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
    const body = await response.json().catch(() => undefined) as { data?: readonly XPeachPricingEntry[], group_ratio?: Record<string, number> } | undefined
    return { entries: body?.data ?? [], groupRatio: body?.group_ratio ?? {} }
  }

  /**
   * Recover the four billing multipliers for a model: catalog ratios joined
   * with the group discount the token's most recent call actually paid (from
   * the log row's `other` JSON — the billing truth, not a guess).
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
        try {
          const other = JSON.parse(last.other) as { group_ratio?: number }
          if (typeof other.group_ratio === 'number' && other.group_ratio > 0) groupRatio = other.group_ratio
        } catch { /* keep neutral group ratio */ }
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
  adminLogs(page: number, size: number, query: string | undefined, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminLogEntry>> {
    let path = '/api/log/?p=' + page + '&page_size=' + size
    if (query !== undefined && query.length > 0) path += '&username=' + encodeURIComponent(query)
    return this.adminGet(path, signal)
  }
  adminSelfStat(signal: AbortSignal): Promise<{ quota?: number, rpm?: number, tpm?: number }> {
    return this.adminGet('/api/log/self/stat', signal)
  }

  /** Overview aggregate — every contributor degrades independently. */
  async adminOverview(signal: AbortSignal): Promise<XPeachAdminOverview> {
    const zero = { page: 0, page_size: 0, total: 0, items: [] as const }
    const [self, users, logs, tokens, groups, stat] = await Promise.all([
      this.adminSelf(signal).catch(() => ({ display_name: 'Admin' as const })),
      this.adminUsers(0, 1, signal).catch(() => zero),
      this.adminLogs(0, 1, undefined, signal).catch(() => zero),
      this.adminTokens(0, 1, signal).catch(() => zero),
      this.adminGroups(signal).catch(() => [] as readonly string[]),
      this.adminSelfStat(signal).catch((): { quota?: number, rpm?: number, tpm?: number } => ({})),
    ])
    return {
      adminName: self.display_name ?? 'Admin',
      totalUsers: users.total ?? 0,
      totalLogs: logs.total ?? 0,
      totalTokens: tokens.total ?? 0,
      groups: groups ?? [],
      selfQuotaUsed: stat.quota,
      rpm: stat.rpm,
      tpm: stat.tpm,
    }
  }

  /* ---------- session-cookie surfaces (user write scope) ---------- */

  /** Session bound? (UI gates session surfaces on this.) */
  sessionBound(): boolean {
    return this.resolveCookie() !== undefined
  }

  /** Own user card: name/email/group/quota — the Access Token is the login state. */
  userSelf(signal: AbortSignal): Promise<XPeachUserSelf> {
    return this.authedGet('/api/user/self', signal)
  }
  /** Own token list (name/quota/group/expiry). */
  userTokens(page: number, signal: AbortSignal): Promise<XPeachTokenPage> {
    return this.authedGet('/api/token/?p=' + page, signal)
  }
  /** Create a site token (name/quota/expiry/group/model limits). */
  userTokenCreate(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedPost('/api/token/', payload, signal)
  }
  /** Update a site token — New API's PUT takes the full row at the collection URL. */
  userTokenUpdate(id: number, payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedWrite('PUT', '/api/token/', { ...payload, id }, signal)
  }
  /** Delete a site token. */
  userTokenDelete(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedWrite('DELETE', '/api/token/' + id, undefined, signal)
  }
  /** Redeem a top-up code. */
  userTopup(key: string, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedPost('/api/user/topup', { key }, signal)
  }
  /** Invitation/affiliate summary — New API returns the bare code string. */
  async userAff(signal: AbortSignal): Promise<Record<string, JsonValue>> {
    const raw = await this.authedGet<JsonValue>('/api/user/aff', signal)
    return typeof raw === 'string' ? { aff_code: raw } : (raw as Record<string, JsonValue>)
  }
  /** Own usage log page (newest first). */
  userLogs(page: number, size: number, signal: AbortSignal): Promise<XPeachSelfLogPage> {
    return this.authedGet('/api/log/self?p=' + page + '&page_size=' + size, signal)
  }
  /** Own usage totals (quota / rpm / tpm). */
  userLogStat(signal: AbortSignal): Promise<XPeachSelfLogStat> {
    return this.authedGet('/api/log/self/stat', signal)
  }
  /** Per-day usage rows for the self account. */
  /**
   * Interactive login: launch a persistent (headed) Chromium on the site's login
   * page; the user solves Turnstile in the window, and the session cookie is
   * harvested the moment it lands. The temp profile is deleted on exit.
   */
  async sessionLoginInteractive(signal: AbortSignal): Promise<string> {
    // Playwright ships with the workspace's web test tooling, not this package —
    // resolve through the apps/web package (monorepo sibling) via createRequire.
    const { createRequire } = await import('node:module')
    const { fileURLToPath, pathToFileURL } = await import('node:url')
    const { join } = await import('node:path')
    const anchors = [
      join(process.cwd(), 'apps/web/package.json'),
      join(process.cwd(), 'package.json'),
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
      try { mod = await import('playwright' + '') } catch (e) { tried.push('bare:' + String(e).slice(0, 60)) }
    }
    if (mod === null) throw new Error('playwright unavailable [' + tried.join(' | ') + ']')
    const pw = ((mod as { default?: unknown }).default ?? mod) as {
      chromium: { launchPersistentContext(dir: string, opts: Record<string, unknown>): Promise<{
        pages(): { isClosed(): boolean, goto(url: string, o: Record<string, unknown>): Promise<unknown> }[]
        newPage(): Promise<{ isClosed(): boolean, goto(url: string, o: Record<string, unknown>): Promise<unknown> }>
        cookies(url: string): Promise<{ name: string, value: string }[]>
        close(): Promise<void>
      }> }
    }
    if (pw.chromium === undefined) throw new Error('playwright module shape unexpected: ' + Object.keys(mod as object).join(','))
    const os = await import('node:os')
    const path = await import('node:path')
    const profileDir = path.join(os.tmpdir(), 'xpeach-login-' + Date.now())
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
        const cookies: { name: string, value: string }[] = await context.cookies(this.baseURL)
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
      try { rmSync(profileDir, { recursive: true, force: true }) } catch { /* best effort */ }
    }
  }

  /** Reveal a token's full key (session scope, CriticalRateLimit). */
  userTokenKey(id: number, signal: AbortSignal): Promise<{ key?: string }> {
    return this.authedPost('/api/token/' + id + '/key', undefined, signal) as Promise<{ key?: string }>
  }

  userSelfData(signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return this.authedGet('/api/data/self', signal)
  }
  /** Update own profile fields (username/password/email). */
  userSelfEdit(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.authedWrite('PUT', '/api/user/self', payload, signal)
  }
  /** Stripe checkout preview: credited money for a quota amount. */
  stripeAmount(amount: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.sessionPost('/api/user/stripe/amount', { amount }, signal)
  }
  /** Stripe checkout: returns the hosted pay link (open in the internal window). */
  stripePay(amount: number, paymentMethod: string, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.sessionPost('/api/user/stripe/pay', { amount, payment_method: paymentMethod }, signal)
  }

  /* ---------- admin write surfaces ---------- */

  adminChannels(page: number, signal: AbortSignal): Promise<XPeachAdminPage<XPeachChannel>> {
    return this.adminGet('/api/channel/?p=' + page, signal)
  }
  adminChannelSave(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return payload['id'] === undefined
      ? this.adminWrite('POST', '/api/channel/', payload, signal)
      : this.adminWrite('PUT', '/api/channel/', payload, signal)
  }
  adminChannelDelete(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('DELETE', '/api/channel/' + id, undefined, signal)
  }
  adminChannelTest(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminGet('/api/channel/test/' + id, signal)
  }
  adminTokenCreate(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('POST', '/api/token/', payload, signal)
  }
  /** Read one token row (access-token channel). */
  adminTokenGet(id: number, signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return this.adminGet<Record<string, JsonValue>>('/api/token/' + id, signal)
  }
  /** Update a token row — New API's PUT takes the full row body (id included). */
  adminTokenUpdate(payload: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('PUT', '/api/token/', payload, signal)
  }
  adminTokenDelete(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('DELETE', '/api/token/' + id, undefined, signal)
  }
  adminRedemptionCreate(quota: number, count: number, name: string, signal: AbortSignal): Promise<readonly string[]> {
    return this.adminWrite('POST', '/api/redemption/', { quota, count, name }, signal)
  }
  adminRedemptionDelete(id: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('DELETE', '/api/redemption/' + id, undefined, signal)
  }
  adminRedemptions(page: number, signal: AbortSignal): Promise<XPeachAdminPage<XPeachRedemption>> {
    return this.adminGet('/api/redemption/?p=' + page, signal)
  }
  adminOptions(signal: AbortSignal): Promise<readonly { key: string, value: string }[]> {
    return this.adminGet('/api/option/', signal)
  }
  adminOptionSet(key: string, value: string, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('PUT', '/api/option/', { key, value }, signal)
  }
  adminNotice(signal: AbortSignal): Promise<string> {
    return this.adminGet('/api/notice', signal)
  }

  /** Single full user row (admin scope) — needed as the PUT base object. */
  adminUserGet(id: number, signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return this.adminGet('/api/user/' + id, signal)
  }
  /** Full-object user update (role is server-pinned to origin). */
  adminUserUpdate(user: Record<string, JsonValue>, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('PUT', '/api/user/', user, signal)
  }
  /** Lightweight manage verb: add_quota / enable / disable / logout. */
  adminUserManage(id: number, action: string, value: number, signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('POST', '/api/user/manage', { id, action, value }, signal)
  }

  /** Model-level pricing snapshot (PATCH-optimistic-locked entries). */
  adminModelPricing(signal: AbortSignal): Promise<XPeachModelPricingSnapshot> {
    return this.adminGet('/api/option/model_pricing', signal)
  }
  /** Apply optimistic-locked per-model pricing changes (version = entry.version). */
  adminModelPricingPatch(changes: readonly XPeachModelPricingChange[], signal: AbortSignal): Promise<XPeachWriteResult> {
    return this.adminWrite('PATCH', '/api/option/model_pricing', { changes }, signal)
  }
}
