import type { JsonValue } from '@xpeach/xph-util-values'
/**
 * Wire types of the generated `xpeach` Remote namespace. Client-safe: no Host
 * imports. Shapes mirror the New API management payloads the site returns.
 *
 * Credential note: `tokenUsage`/`tokenLogs` accept the site's relay API key
 * (sk- token) — the same credential the model providers use. `self`/`tokens`
 * are dashboard-surface reads and require a personal access token (PAT).
 * @module @xpeach/xph-account/types
 */

/** Request for `xpeach.self`: no inputs — the signed-in credential selects the user. */
export interface XPeachSelfRequest {}

/** Request for `xpeach.tokens`: no inputs — one fixed-size first page. */
export interface XPeachTokensRequest {}

/** Request for `xpeach.tokenUsage`: no inputs — the credential selects the token. */
export interface XPeachTokenUsageRequest {}

/** Request for `xpeach.tokenLogs`: no inputs — the site serves the token's log tail. */
export interface XPeachTokenLogsRequest {}

/** The signed-in user's profile as New API's /api/user/self reports it (PAT only). */
export interface XPeachUserSelf {
  readonly id: number
  readonly username: string
  readonly display_name?: string
  readonly email?: string
  readonly role?: number
  readonly status?: number
  readonly group?: string
  readonly quota?: number
  readonly used_quota?: number
  readonly request_count?: number
  readonly aff_code?: string
  readonly aff_count?: number
  readonly aff_quota?: number
  readonly aff_history_quota?: number
  readonly has_password?: boolean
}

/** One own-usage log row as /api/log/usage reports it. */
export interface XPeachSelfLogEntry {
  readonly id: number
  readonly user_id?: number
  readonly created_at: number
  readonly username?: string
  readonly model_name?: string
  readonly token_name?: string
  readonly group?: string
  readonly quota: number
  readonly prompt_tokens: number
  readonly completion_tokens: number
  readonly use_time: number
  readonly is_stream?: boolean
  readonly channel?: number
  readonly request_id?: string
  readonly other?: string
}

/** One page of own-usage logs. */
export interface XPeachSelfLogPage {
  readonly page: number
  readonly page_size: number
  readonly total: number
  readonly items: readonly XPeachSelfLogEntry[]
}

/** Own-usage totals. */
export interface XPeachSelfLogStat {
  readonly quota: number
  readonly rpm: number
  readonly tpm: number
}

/** One API token row as New API's /api/token/ list reports it (PAT only). */
export interface XPeachToken {
  readonly id: number
  readonly name: string
  readonly status: number
  readonly key_prefix?: string
  readonly group?: string
  readonly used_quota?: number
  readonly remain_quota?: number
  readonly unlimited_quota?: boolean
  readonly expired_time?: number
  readonly created_time?: number
}

/** One page of the token list (PAT only). */
export interface XPeachTokenPage {
  readonly items: readonly XPeachToken[]
  readonly total: number
  readonly page?: number
  readonly page_size?: number
}

/** Usage summary of the calling API token as /api/usage/token/ reports it. */
export interface XPeachTokenUsage {
  readonly name: string
  readonly total_granted: number
  readonly total_used: number
  readonly total_available: number
  readonly unlimited_quota: boolean
  readonly model_limits_enabled: boolean
  readonly expires_at: number
}

/** Request for `xpeach.models`: no inputs — the credential scopes the catalog. */
export interface XPeachModelsRequest {}

/** One model entry in the relay's /v1/models catalog. */
export interface XPeachModel {
  readonly id: string
  readonly name?: string
  readonly object?: string
  readonly owned_by?: string
  readonly created?: number
  /** Upstream vendor tag the site attaches (e.g. openai). */
  readonly provider?: string
  /** Token groups this model is callable through. */
  readonly groups?: readonly string[]
  /** Endpoint protocols the entry accepts (e.g. ['openai']). */
  readonly supported_endpoint_types?: readonly string[]
  /** Maximum combined input and output context window in tokens. */
  readonly contextWindow?: number
  /** Maximum output tokens per response. */
  readonly maxTokens?: number
  /** Request modalities the model accepts. */
  readonly inputModalities?: readonly ('text' | 'image')[]
  /** Default reasoning effort level when thinking is enabled. */
  readonly defaultReasoningEffort?: string
}

/** Request for `xpeach.bindKey`: the relay API key the user pasted. */
export interface XPeachBindKeyRequest {
  /**
   * The site Access Token (system access token) — the user's management credential,
   * sent as a raw Authorization header. Not an sk- API key: the account layer
   * mints/reuses the sk- relay token itself.
   */
  readonly key: string
}

/** Outcome of a bind/unbind/write through the credentials seam. */
export interface XPeachBindResult {
  /** Whether the credential is now bound. */
  readonly bound: boolean
  /** Masked preview (sk-…last4) for display while bound; never the value. */
  readonly preview?: string
  /** Whether the site-management token is bound (xpeach.admin file / XPEACH_ADMIN_KEY env). */
  readonly adminBound?: boolean
  /** Masked admin-token preview while bound. */
  readonly adminPreview?: string
}

/** One site group in the model-market catalog. */
export interface XPeachSiteGroup {
  readonly name: string
  readonly desc?: string
  readonly ratio?: number
  /** Number of models enabled in this group. */
  readonly models: number
}

/** The site's model market as this token sees it. */
export interface XPeachSiteCatalog {
  /** Every group the site prices, with model counts and ratios. */
  readonly groups: readonly XPeachSiteGroup[]
  /** Groups currently assigned to the relay token. */
  readonly tokenGroups: readonly string[]
  /** Model ids the relay token can call right now. */
  readonly models: readonly string[]
  /** Token row id when known. */
  readonly tokenId?: number
  /** Bound token's display name when the record carries one. */
  readonly tokenName?: string
  /** Last characters of the bound relay key, for confirming which credential a group edit targets. */
  readonly keyTail?: string
}

/** Outcome of a model-catalog sync into the llm-pi-ai settings section. */
export interface XPeachModelSyncResult {
  readonly ok: boolean
  readonly count: number
  readonly groups: readonly string[]
  readonly error?: string
  /** 同步未完成的稳定原因；旧的可信目录保持原样。 */
  readonly code?: 'identity-unknown' | 'identity-budget-exhausted' | 'credential-changed' | 'credential-write-incomplete'
  /** Token row id a group write targeted, when one ran. */
  readonly tokenId?: number
  /** Bound token's display name a group write targeted, when one ran. */
  readonly tokenName?: string
}

/** One relay log row as /api/log/token returns it. */
export interface XPeachTokenLogEntry {
  readonly id: number
  readonly user_id: number
  readonly created_at: number
  readonly username: string
  readonly token_name: string
  readonly model_name: string
  readonly quota: number
  readonly prompt_tokens: number
  readonly completion_tokens: number
  readonly use_time: number
  readonly is_stream: boolean
  readonly channel: number
  readonly group?: string
  readonly request_id?: string
  readonly other?: string
}

/** Request for `xpeach.chat`: one playground call against any catalog model. */
export interface XPeachChatRequest {
  /** Catalog model id to call. */
  readonly model: string
  /** The user's prompt text. */
  readonly prompt: string
  /** Optional max_tokens cap (default 4096). */
  readonly maxTokens?: number
  /**
   * Optional caller-chosen correlation id. When set, the call streams from the
   * relay and each SSE delta is broadcast as a `xpeach/playground-chunk` event
   * carrying this id, so the console can render tokens as they arrive.
   */
  readonly callId?: string | undefined
}

/** One streaming delta broadcast as `xpeach/playground-chunk` during a streamed chat call. */
export interface XPeachPlaygroundChunk {
  /** Correlates chunks to the requesting playground instance. */
  readonly callId: string
  /** Incremental content delta for this SSE event. */
  readonly delta: string
}

/** One playground reply: content plus billing facts the console shows. */
export interface XPeachChatReply {
  /** The model's answer text (first choice). */
  readonly content: string
  /** Tokens billed for the prompt. */
  readonly promptTokens: number
  /** Tokens generated. */
  readonly completionTokens: number
  /** Wall-clock latency of the call. */
  readonly latencyMs: number
}

/* ---------- Admin (site-management key) surfaces ---------- */

/** Request for admin remotes: optional page (0-based) and filter text. */
export interface XPeachAdminPageRequest {
  readonly page?: number | undefined
  readonly size?: number | undefined
  /** Free-text filter where the endpoint supports it (username/model/group). */
  readonly query?: string | undefined
}

/** One user row as the admin /api/user/ list returns it. */
export interface XPeachAdminUser {
  readonly id: number
  readonly username: string
  readonly display_name?: string
  readonly email?: string
  readonly role?: number
  readonly status?: number
  readonly group?: string
  readonly quota?: number
  readonly used_quota?: number
  readonly request_count?: number
  readonly aff_count?: number
  readonly aff_quota?: number
}

/** Paged list envelope from admin list endpoints. */
export interface XPeachAdminPage<T> {
  readonly page: number
  readonly page_size: number
  readonly total: number
  readonly items: readonly T[]
}

/** One site token row (admin /api/token/). */
export interface XPeachAdminToken {
  readonly id: number
  readonly user_id: number
  readonly name?: string
  readonly key?: string
  readonly status?: number
  readonly group?: string
  readonly groups?: string[]
  readonly auto_groups?: string[] | null
  readonly cross_group_retry?: boolean
  readonly remain_quota?: number
  readonly used_quota?: number
  readonly unlimited_quota?: boolean
  readonly created_time?: number
  readonly accessed_time?: number
}

/** One site-wide log row (admin /api/log/). */
export interface XPeachAdminLogEntry {
  readonly id: number
  readonly user_id?: number
  readonly username?: string
  readonly token_name?: string
  readonly model_name?: string
  readonly group?: string
  readonly channel_name?: string
  readonly quota?: number
  readonly prompt_tokens?: number
  readonly completion_tokens?: number
  readonly use_time?: number
  readonly created_at?: number
  readonly is_stream?: boolean
}

/** One pricing row from /api/pricing. */
export interface XPeachPricingEntry {
  readonly model_name: string
  readonly vendor_id?: number
  readonly quota_type?: number
  readonly model_ratio?: number
  readonly model_price?: number
  readonly completion_ratio?: number
  readonly cache_ratio?: number
  readonly create_cache_ratio?: number
  readonly description?: string
  readonly tags?: string
  readonly icon?: string
  readonly enable_groups?: readonly string[]
  readonly supported_endpoint_types?: readonly string[]
}

/** Admin aggregate snapshot for the console header. */
export interface XPeachAdminOverview {
  readonly adminName: string
  readonly totalUsers: number
  readonly totalLogs: number
  readonly totalTokens: number
  readonly groups: readonly string[]
  readonly selfQuotaUsed?: number | undefined
  readonly rpm?: number | undefined
  readonly tpm?: number | undefined
}

/** Rate sheet for one model: the four multipliers the site actually bills. */
export interface XPeachBillingRate {
  /** Base per-token weight. */
  readonly modelRatio: number
  /** Output-token weight multiplier. */
  readonly completionRatio: number
  /** Cache-read weight multiplier (lower is cheaper). */
  readonly cacheRatio: number
  /** The caller-group discount actually applied on the token's last call. */
  readonly groupRatio: number
  /** Which catalog group the rate was computed under, when a picker chose one. */
  readonly group?: string
}

/** Raw pricing payload: entry rows plus the per-group ratio table and usable groups. */
export interface XPeachPricingCatalog {
  readonly entries: readonly XPeachPricingEntry[]
  readonly groupRatio: Readonly<Record<string, number>>
  readonly usableGroup?: Readonly<Record<string, string>> | undefined
  readonly autoGroups?: readonly string[] | undefined
}

/** One measured health row for a catalog model. */
export interface XPeachHealthRow {
  /** Catalog model id probed. */
  readonly id: string
  /** The probe completed with a 2xx within the timeout AND a real answer. */
  readonly ok: boolean
  /** True when the channel answered a "[Mock]" probe reply — HTTP 200 but no real model behind it. */
  readonly mocked?: boolean | undefined
  /** Round-trip in milliseconds (undefined when the probe failed). */
  readonly latencyMs?: number | undefined
  /** Site/transport error when the probe failed. */
  readonly error?: string | undefined
}

/** Request for `xpeach.modelHealth`: live probe of catalog models. */
export interface XPeachHealthRequest {
  /** Restrict the probe to these ids; empty probes the whole catalog. */
  readonly models?: readonly string[]
}

/** Site channel row as /api/channel/ reports it (admin). */
export interface XPeachChannel {
  readonly id: number
  readonly type: number
  readonly name: string
  readonly key?: string
  readonly status: number
  readonly weight?: number
  readonly priority?: number
  readonly group?: string
  readonly models?: string
  readonly base_url?: string
  readonly response_time?: number
  readonly auto_ban?: number
  readonly used_quota?: number
  readonly test_time?: number
}

/** Redemption (top-up code) row as /api/redemption/ reports it (admin). */
export interface XPeachRedemption {
  readonly id: number
  readonly user_id?: number
  readonly key: string
  readonly status: number
  readonly name?: string
  readonly quota?: number
  readonly created_time?: number
  readonly redeemed_time?: number
  readonly used_user_id?: number
}

/** Generic envelope for New API write ops that return no meaningful payload. */
export interface XPeachWriteResult {
  readonly success?: boolean
  readonly message?: string
  readonly data?: string | readonly string[] | XPeachToken
}

/** Per-model pricing snapshot entry (admin scope): configured overrides + effective + lock version. */
export interface XPeachModelPricingEntry {
  readonly model_name: string
  readonly version: string
  readonly configured: Record<string, JsonValue>
  readonly effective: Record<string, JsonValue>
  readonly cache_write_mode?: string
  readonly billing_details?: Record<string, JsonValue>
}
/** Full pricing snapshot returned by GET /api/option/model_pricing. */
export interface XPeachModelPricingSnapshot {
  readonly entries: readonly XPeachModelPricingEntry[]
  readonly options: Record<string, string>
  readonly empty_version: string
}
/** Optimistic-locked pricing change for PATCH /api/option/model_pricing. */
export interface XPeachModelPricingChange {
  readonly model_name: string
  readonly expected_version: string
  readonly pricing?: Record<string, JsonValue>
  readonly reset?: boolean
}


/** Local conversation store ids the first-run onboarding can detect. */
export type XPeachSourceId = 'deepseek' | 'claude' | 'codex' | 'zcode' | 'chatgpt' | 'gemini' | 'antigravity'

/** One skill entry discovered in the user/agents/project skill roots. */
export interface XPeachSkillItem {
  readonly id: string
  readonly name: string
  readonly dirName: string
  readonly description: string
  readonly whenToUse?: string
  readonly path: string
  readonly source: 'user' | 'agents' | 'project' | 'builtin'
  readonly enabled: boolean
  readonly valid: boolean
  readonly reason?: string
  readonly content: string
}

/** Snapshot of local skills and global AGENTS.md rules. */
export interface XPeachSkillsSnapshot {
  readonly skills: readonly XPeachSkillItem[]
  readonly rulesPath: string
  readonly rulesContent: string
}

/** Request payload for `xpeach.skillToggle`. */
export interface XPeachSkillToggleRequest {
  readonly dirName: string
  readonly name: string
  readonly enabled: boolean
}

/** Request payload for `xpeach.skillBatchToggle`. */
export interface XPeachSkillBatchToggleRequest {
  readonly items: readonly { readonly dirName: string; readonly name: string }[]
  readonly enabled: boolean
}

/** Request payload for `xpeach.skillBatchDelete`. */
export interface XPeachSkillBatchDeleteRequest {
  readonly dirNames: readonly string[]
}

/** Request payload for `xpeach.skillSave`. */
export interface XPeachSkillSaveRequest {
  readonly dirName?: string
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly content: string
}

/** Request payload for `xpeach.skillDelete`. */
export interface XPeachSkillDeleteRequest {
  readonly dirName: string
}

/** Request payload for `xpeach.rulesSave`. */
export interface XPeachRulesSaveRequest {
  readonly content: string
}

/** One configured MCP server in the profile patch and its live tool state. */
export interface XPeachMcpItem {
  readonly id: string
  readonly serverName: string
  readonly disabled: boolean
  readonly transportType: 'stdio' | 'streamable-http'
  readonly command?: string
  readonly args?: readonly string[]
  readonly env?: Readonly<Record<string, string>>
  readonly url?: string
  readonly headers?: Readonly<Record<string, string>>
  readonly status: 'active' | 'disabled' | 'configured'
  readonly toolCount: number
  readonly tools: readonly { readonly name: string; readonly description: string }[]
}

/** Snapshot of configured MCP servers and active profile patch path. */
export interface XPeachMcpSnapshot {
  readonly servers: readonly XPeachMcpItem[]
  readonly patchPath: string
}

/** Request payload for `xpeach.mcpToggle`. */
export interface XPeachMcpToggleRequest {
  readonly id: string
  readonly enabled: boolean
}

/** Request payload for `xpeach.mcpSave`. */
export interface XPeachMcpSaveRequest {
  readonly id?: string
  readonly serverName: string
  readonly transportType: 'stdio' | 'streamable-http'
  readonly command?: string
  readonly args?: readonly string[]
  readonly env?: Readonly<Record<string, string>>
  readonly url?: string
  readonly headers?: Readonly<Record<string, string>>
  readonly disabled?: boolean
}

/** Request payload for `xpeach.mcpDelete`. */
export interface XPeachMcpDeleteRequest {
  readonly id: string
}

/** Request payload for `xpeach.mcpBatchToggle`. */
export interface XPeachMcpBatchToggleRequest {
  readonly ids: readonly string[]
  readonly enabled: boolean
}

/** Request payload for `xpeach.mcpBatchDelete`. */
export interface XPeachMcpBatchDeleteRequest {
  readonly ids: readonly string[]
}

/** One detected local conversation store. */
export interface XPeachDetectedSource {
  id: XPeachSourceId
  label: string
  path: string
  found: boolean
  threads: number
  detail?: string
}

/** One MCP server declared by a local agent. */
export interface XPeachDetectedMcp {
  readonly source: string
  readonly name: string
  readonly config: Readonly<Record<string, JsonValue>>
}

/** One skill directory found under a local agent. */
export interface XPeachDetectedSkill {
  readonly source: string
  readonly name: string
  readonly path: string
}

/** One user-global instruction file found under a local agent. */
export interface XPeachDetectedPrompt {
  readonly source: string
  readonly path: string
  readonly preview: string
}

/** Silent first-run detection report. */
export interface XPeachOnboardingScan {
  readonly sources: readonly XPeachDetectedSource[]
  readonly mcp: readonly XPeachDetectedMcp[]
  readonly skills: readonly XPeachDetectedSkill[]
  readonly prompts: readonly XPeachDetectedPrompt[]
}

/** Per-source conversation import outcome. */
export interface XPeachConversationImportResult {
  readonly source: XPeachSourceId
  readonly imported: number
  readonly skipped: number
  readonly error?: string
}

/** Skills / prompts / MCP import outcome. */
export interface XPeachAssetImportResult {
  readonly mcp: number
  readonly skills: number
  readonly prompts: number
  readonly errors: readonly string[]
}


/** One probed API route. */
export interface XPeachNetworkRoute {
  readonly id: string
  readonly label: string
  readonly url: string
  readonly latencyMs?: number
  readonly loss: number
  readonly samples: number
  readonly ok: boolean
}

/** One history point for a route's sparkline. */
export interface XPeachNetworkPoint {
  readonly at: number
  readonly latencyMs?: number
  readonly loss: number
}

/** Latest network probe snapshot. */
export interface XPeachNetworkSnapshot {
  readonly at: number
  readonly active: string
  readonly auto: boolean
  readonly probes: readonly XPeachNetworkRoute[]
  readonly history: Readonly<Record<string, readonly XPeachNetworkPoint[]>>
}

/** Status of the macOS native `.pkg` guided installer and installed bundle/CLI. */
export interface XPeachMacosInstallerStatus {
  readonly supported: boolean
  readonly platform: string
  readonly arch: string
  readonly version: string
  readonly pkgPath: string
  readonly pkgExists: boolean
  readonly pkgSizeBytes: number
  readonly appInstalled: boolean
  readonly appPath: string
  readonly xphCliInstalled: boolean
  readonly xphCliPath: string
  readonly receiptPath: string
  readonly installedAt?: string | undefined
}

/** Request options for building, opening, or installing the macOS `.pkg` guided installer. */
export interface XPeachMacosInstallerActionRequest {
  readonly action: 'build' | 'open' | 'reveal' | 'install-direct'
}

/** Result of a macOS `.pkg` guided installer action. */
export interface XPeachMacosInstallerActionResult {
  readonly ok: boolean
  readonly action: 'build' | 'open' | 'reveal' | 'install-direct'
  readonly message: string
  readonly status: XPeachMacosInstallerStatus
  readonly verifyOutput?: string | undefined
}

/** Request options for starting an XPeach SSO Device Authorization flow. */
export interface XPeachSsoDeviceStartRequest {
  readonly openBrowser?: boolean | undefined
  readonly clientName?: string | undefined
}

/** Response returned when starting an XPeach SSO Device Authorization flow. */
export interface XPeachSsoDeviceStartResult {
  readonly deviceCode: string
  readonly userCode: string
  readonly verificationUri: string
  readonly verificationUriComplete: string
  readonly expiresIn: number
  readonly interval: number
  readonly browserOpened: boolean
  readonly clientId?: string | undefined
  readonly issuer?: string | undefined
}

/** Request payload for polling an XPeach SSO Device Authorization flow. */
export interface XPeachSsoDevicePollRequest {
  readonly deviceCode: string
}

/** Request options for starting a unified 1-click XPeach SSO browser sign-in (PKCE S256 loopback with Device fallback). */
export interface XPeachSsoBrowserStartRequest {
  readonly openBrowser?: boolean | undefined
  readonly clientName?: string | undefined
}

/** Non-blocking session descriptor returned by `ssoBrowserStart`. */
export interface XPeachSsoBrowserStartResult {
  readonly attemptId: string
  readonly mode: 'pkce' | 'device'
  readonly authorizationUrl: string
  readonly expiresIn: number
  readonly interval: number
  readonly browserOpened: boolean
  readonly deviceCode?: string | undefined
  readonly userCode?: string | undefined
}

/** Request payload for polling a unified XPeach SSO browser sign-in attempt. */
export interface XPeachSsoBrowserPollRequest {
  readonly attemptId: string
  readonly deviceCode?: string | undefined
}

/** Request payload for cancelling an in-flight XPeach SSO browser sign-in attempt. */
export interface XPeachSsoBrowserCancelRequest {
  readonly attemptId: string
}

/** Bridged SSO + PeachCode (NewAPI) credential bundle returned upon Device Flow approval. */
export interface XPeachSsoBridgePayload {
  readonly sso?: {
    readonly accessToken: string
    readonly refreshToken?: string | undefined
    readonly idToken?: string | undefined
    readonly expiresIn?: number | undefined
    readonly issuer?: string | undefined
    readonly clientId?: string | undefined
    readonly user?: {
      readonly id: string
      readonly username?: string | null | undefined
      readonly email?: string | null | undefined
      readonly name?: string | null | undefined
      readonly picture?: string | null | undefined
    } | undefined
  } | undefined
  readonly peachcode?: {
    readonly baseUrl?: string | undefined
    readonly userId?: number | undefined
    readonly username?: string | undefined
    readonly group?: string | undefined
    readonly quota?: number | undefined
    readonly usedQuota?: number | undefined
    readonly accessToken?: string | undefined
    readonly apiKey?: string | undefined
    readonly tokenId?: number | undefined
    readonly tokenName?: string | undefined
    readonly tokenGroups?: readonly string[] | undefined
  } | undefined
}

/** Status returned by a single poll cycle against XPeach SSO Device Authorization. */
export interface XPeachSsoDevicePollResult {
  readonly status: 'pending' | 'approved' | 'expired' | 'denied' | 'error'
  readonly bound?: boolean | undefined
  readonly username?: string | undefined
  readonly email?: string | undefined
  readonly preview?: string | undefined
  readonly adminPreview?: string | undefined
  readonly message?: string | undefined
}

/** Result of verifying or refreshing an SSO + PeachCode credential bundle via `@xpeach/ts-xpeach`. */
export type XPeachSsoCredentialSyncResult =
  | {
    readonly status: 'ok'
    readonly payload: XPeachSsoBridgePayload
  }
  | {
    readonly status: 'revoked'
    readonly revoked?: true | undefined
    readonly code: 401 | 403
    readonly message: string
  }
  | {
    readonly status: 'transient_error'
    readonly transient?: true | undefined
    readonly message: string
  }

/** Request options for revoking an SSO session via RFC 7009 (`@xpeach/ts-xpeach`). */
export interface XPeachSsoRevokeRequest {
  readonly allDevices?: boolean | undefined
  readonly revokePeachcode?: boolean | undefined
}

/** Result of verifying the active SSO session and local credentials. */
export interface XPeachSsoSessionStatus {
  readonly valid: boolean
  readonly status: 'ok' | 'revoked' | 'unbound' | 'transient_error'
  readonly revoked?: boolean | undefined
  readonly transient?: boolean | undefined
  readonly error?: string | undefined
  readonly username?: string | undefined
  readonly email?: string | undefined
  readonly message?: string | undefined
}

/** Supported human-verification scenes centrally governed by XPeach SSO. */
export type XPeachSsoCaptchaScene = 'login' | 'register' | 'recovery' | 'reset_password' | 'checkin' | 'partner_consent'

/** Unified public human-verification policy served by XPeach SSO (including self-hosted Cap). */
export interface XPeachSsoCaptchaPolicy {
  readonly provider: 'none' | 'builtin' | 'turnstile' | 'recaptcha' | 'hcaptcha' | 'cap'
  readonly enabled: boolean
  readonly siteKey: string
  readonly capOrigin: string | null
  readonly capSiteKeys: {
    readonly login: string
    readonly register: string
    readonly recovery: string
    readonly checkin: string
    readonly partnerConsent: string
  }
  readonly scenes: {
    readonly login: boolean
    readonly register: boolean
    readonly recovery: boolean
    readonly checkin: boolean
    readonly partnerConsent: boolean
  }
}

/** Request payload for fetching a scene-scoped SSO human-verification challenge. */
export interface XPeachSsoCaptchaChallengeRequest {
  readonly scene: XPeachSsoCaptchaScene
}

/** Scene-scoped human-verification challenge payload returned by XPeach SSO. */
export interface XPeachSsoCaptchaChallenge {
  readonly provider: 'none' | 'builtin' | 'turnstile' | 'recaptcha' | 'hcaptcha' | 'cap'
  readonly siteKey: string
  readonly capOrigin: string | null
  readonly enabled: boolean
  readonly question: string | null
  readonly captchaToken: string | null
}

/** Hourly success-rate sample from PeachAPI `/api/perf-metrics/summary`. */
export interface XPeachSuccessRatePoint {
  readonly ts: number
  readonly success_rate: number
}

/** Per-model 24-hour performance summary from PeachAPI `/api/perf-metrics/summary`. */
export interface XPeachModelPerfSummary {
  readonly model_name: string
  readonly avg_latency_ms: number
  readonly success_rate: number
  readonly avg_tps: number
  readonly recent_success_series?: readonly XPeachSuccessRatePoint[] | undefined
}

/** Hourly per-group performance sample from PeachAPI `/api/perf-metrics`. */
export interface XPeachPerfSeriesPoint {
  readonly ts: number
  readonly avg_ttft_ms: number
  readonly avg_latency_ms: number
  readonly success_rate: number
  readonly avg_tps: number
}

/** Per-group performance aggregate and time series for one model from `/api/perf-metrics`. */
export interface XPeachPerfGroupRow {
  readonly group: string
  readonly avg_ttft_ms: number
  readonly avg_latency_ms: number
  readonly success_rate: number
  readonly avg_tps: number
  readonly series: readonly XPeachPerfSeriesPoint[]
}

/** Full model performance detail across groups from PeachAPI `/api/perf-metrics`. */
export interface XPeachModelPerfDetail {
  readonly model_name: string
  readonly hours?: number | undefined
  readonly series_schema?: string | undefined
  readonly groups: readonly XPeachPerfGroupRow[]
}

export type {
  ParsedXPeachVersion,
  XPeachCheckUpdateRequest,
  XPeachReleaseCandidate,
  XPeachReleaseChannel,
  XPeachSetUpdateChannelRequest,
  XPeachUpdateChannelStatus,
  XPeachUpdateCheckResult,
  XPeachUpdatePreference,
} from './update-channel.ts'

export type {
  XPeachSystemNotificationKind,
  XPeachSystemNotificationOptions,
  XPeachSystemNotificationRequest,
  XPeachSystemNotificationResult,
} from './system-notification.ts'

/** Supported upstream wire protocols in the XPeach Gateway & Prompt Inspector. */
export type XPeachWireProtocol = 'openai-completions' | 'openai-responses' | 'anthropic-messages'

/** Custom system-prompt section authored by the user in the Prompt Inspector. */
export interface XPeachCustomPromptSection {
  readonly id: string
  readonly name: string
  readonly order: number
  readonly text: string
  readonly enabled: boolean
}

/** Custom runtime-context block authored by the user in the Prompt Inspector. */
export interface XPeachCustomContextBlock {
  readonly id: string
  readonly name: string
  readonly order: number
  readonly text: string
  readonly enabled: boolean
}

/** Custom pre-step implicit user-turn prompt injection authored by the user. */
export interface XPeachCustomPreStepInjection {
  readonly id: string
  readonly label: string
  readonly placement: 'before-user' | 'after-user'
  readonly text: string
  readonly enabled: boolean
}

/** Custom HTTP header configured for upstream gateway requests. */
export interface XPeachCustomGatewayHeader {
  readonly key: string
  readonly value: string
  readonly enabled: boolean
}

/** Durable user overrides for system prompts, implicit injections, tools, and upstream gateway headers/body. */
export interface XPeachPromptOverridesConfig {
  readonly disabledSections: readonly string[]
  readonly sectionOverrides: Readonly<Record<string, string>>
  readonly customSections: readonly XPeachCustomPromptSection[]
  readonly disabledContexts: readonly string[]
  readonly contextOverrides: Readonly<Record<string, string>>
  readonly customContexts: readonly XPeachCustomContextBlock[]
  readonly disabledImplicitInjectors: readonly string[]
  readonly customPreStepInjections: readonly XPeachCustomPreStepInjection[]
  readonly disabledTools: readonly string[]
  readonly toolDescriptionOverrides: Readonly<Record<string, string>>
  readonly customHeaders: readonly XPeachCustomGatewayHeader[]
  readonly conversationTracking: boolean
  readonly reasoningEffort: 'default' | 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'
  readonly cacheRetention: 'default' | 'none' | 'short' | 'long'
  readonly temperature: number | null
  readonly maxTokens: number | null
}

/** Request payload for `xpeach.gatewayInspectorSnapshot`. */
export interface XPeachGatewayInspectorRequest {
  readonly protocol?: XPeachWireProtocol
  readonly model?: string
  readonly sessionId?: string
  readonly sampleUserMessage?: string
}

/** Request payload for `xpeach.gatewayInspectorSave`. */
export interface XPeachGatewayInspectorSaveRequest {
  readonly config: XPeachPromptOverridesConfig
  readonly preview?: XPeachGatewayInspectorRequest
}

/** One HTTP header entry displayed in the upstream gateway inspector. */
export interface XPeachGatewayHeaderItem {
  readonly name: string
  readonly value: string
  readonly source: 'auth' | 'protocol' | 'attribution' | 'tracking' | 'custom'
  readonly editable: boolean
  readonly enabled: boolean
}

/** One system-prompt section inspected before variable interpolation and wire serialization. */
export interface XPeachInspectedPromptSection {
  readonly name: string
  readonly order: number
  readonly category: 'identity' | 'persona' | 'policy' | 'tool-guidance' | 'environment' | 'custom'
  readonly defaultText: string
  readonly effectiveText: string
  readonly enabled: boolean
  readonly overridden: boolean
  readonly isCustom: boolean
  readonly customId?: string
  readonly charCount: number
  readonly estTokens: number
}

/** One dynamic runtime-context block inspected in the prompt studio. */
export interface XPeachInspectedContextBlock {
  readonly name: string
  readonly order: number
  readonly required: boolean
  readonly defaultText: string
  readonly effectiveText: string
  readonly enabled: boolean
  readonly overridden: boolean
  readonly isCustom: boolean
  readonly customId?: string
  readonly charCount: number
  readonly estTokens: number
}

/** One implicit / pre-step prompt injection exposed to the user. */
export interface XPeachInspectedImplicitItem {
  readonly id: string
  readonly label: string
  readonly sourceKind: string
  readonly trigger: 'every-turn' | 'workspace-rules' | 'skill-catalog' | 'conditional' | 'custom'
  readonly enabled: boolean
  readonly toggleable: boolean
  readonly previewText: string
  readonly charCount: number
  readonly estTokens: number
  readonly isCustom?: boolean
  readonly placement?: 'before-user' | 'after-user'
}

/** One tool schema exposed in the upstream request body. */
export interface XPeachInspectedToolItem {
  readonly name: string
  readonly source: 'builtin' | 'mcp' | 'skill' | 'extension'
  readonly defaultDescription: string
  readonly effectiveDescription: string
  readonly parameters: Readonly<Record<string, JsonValue>>
  readonly enabled: boolean
  readonly overridden: boolean
  readonly estTokens: number
}

/** One captured real outbound LLM gateway request recorded at `llm/stream`. */
export interface XPeachCapturedOutboundRequest {
  readonly id: string
  readonly timestamp: number
  readonly provider: string
  readonly protocol: XPeachWireProtocol
  readonly model: string
  readonly sessionId?: string
  readonly method: 'POST'
  readonly url: string
  readonly headers: readonly XPeachGatewayHeaderItem[]
  readonly bodyJson: string
  readonly messageCount: number
  readonly toolCount: number
  readonly estTotalTokens: number
}

/** Complete snapshot of assembled prompts, implicit injections, tools, headers, and upstream request body. */
export interface XPeachGatewayInspectorSnapshot {
  readonly method: 'POST'
  readonly endpointUrl: string
  readonly activeBaseUrl: string
  readonly protocol: XPeachWireProtocol
  readonly providerKey: string
  readonly model: string
  readonly availableModels: readonly string[]
  readonly recentSessions: readonly {
    readonly id: string
    readonly title?: string
    readonly cwd?: string
    readonly updatedAt: number
  }[]
  readonly selectedSessionId?: string
  readonly headers: readonly XPeachGatewayHeaderItem[]
  readonly sections: readonly XPeachInspectedPromptSection[]
  readonly contexts: readonly XPeachInspectedContextBlock[]
  readonly implicitInjections: readonly XPeachInspectedImplicitItem[]
  readonly tools: readonly XPeachInspectedToolItem[]
  readonly variables: Readonly<Record<string, string>>
  readonly renderedSystemPrompt: string
  readonly renderedRuntimeContext: string
  readonly requestBodyJson: string
  readonly curlPreview: string
  readonly stats: {
    readonly systemTokens: number
    readonly contextTokens: number
    readonly implicitTokens: number
    readonly toolTokens: number
    readonly totalEstTokens: number
  }
  readonly config: XPeachPromptOverridesConfig
  readonly capturedRequests: readonly XPeachCapturedOutboundRequest[]
}

/** Primary wire-endpoint pool identifier for XPeach model routing. */
export type XPeachEndpointPoolId = 'openai-completions' | 'openai-responses' | 'anthropic-messages'

/** Selectable reasoning-effort level identifier for per-model configuration. */
export type XPeachModelReasoningLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'

/** Per-model wire-compatibility overrides stored in `xpeach.model-routing.json`. */
export interface XPeachModelCompatSettings {
  readonly thinkingFormat?:
    | 'openai'
    | 'deepseek'
    | 'openrouter'
    | 'together'
    | 'baseten'
    | 'zai'
    | 'qwen'
    | 'chat-template'
    | 'qwen-chat-template'
    | 'string-thinking'
    | 'ant-ling'
    | undefined
  readonly maxTokensField?: 'max_completion_tokens' | 'max_tokens' | undefined
  readonly supportsDeveloperRole?: boolean | undefined
  readonly supportsReasoningEffort?: boolean | undefined
  readonly requiresThinkingAsText?: boolean | undefined
  readonly supportsStrictMode?: boolean | undefined
  readonly supportsMaxOutputTokens?: boolean | undefined
  readonly supportsLongCacheRetention?: boolean | undefined
  readonly forceAdaptiveThinking?: boolean | undefined
  readonly supportsTemperature?: boolean | undefined
  readonly supportsCacheControlOnTools?: boolean | undefined
  readonly supportsStrictTools?: boolean | undefined
  readonly allowEmptySignature?: boolean | undefined
}

/** Durable per-model invocation and capability overrides persisted across restarts. */
export interface XPeachModelCallSettings {
  readonly displayName?: string | undefined
  readonly contextWindow?: number | undefined
  readonly maxTokens?: number | undefined
  readonly input?: readonly ('text' | 'image')[] | undefined
  readonly defaultReasoning?: 'default' | XPeachModelReasoningLevel | undefined
  readonly enabledEfforts?: readonly XPeachModelReasoningLevel[] | undefined
  readonly temperature?: number | null | undefined
  readonly compat?: XPeachModelCompatSettings | undefined
  readonly disabled?: boolean | undefined
}

/** Durable profile-scoped XPeach model routing and per-model settings ledger (`xpeach.model-routing.json`). */
export interface XPeachModelRoutingState {
  readonly version: 1
  readonly endpointOverrides: Readonly<Record<string, XPeachEndpointPoolId>>
  readonly poolOrder: Readonly<Partial<Record<XPeachEndpointPoolId, readonly string[]>>>
  readonly modelSettings: Readonly<Record<string, XPeachModelCallSettings>>
  readonly customModels: readonly string[]
  readonly customBaseUrl?: string | undefined
  readonly conversationTracking?: boolean | undefined
}

/** Resolved view of one model inside the 3-endpoint pool studio. */
export interface XPeachModelPoolEntry {
  readonly id: string
  readonly displayName: string
  readonly endpoint: XPeachEndpointPoolId
  readonly recommendedEndpoint: XPeachEndpointPoolId
  readonly overriddenEndpoint: boolean
  readonly groups: readonly string[]
  readonly supportedEndpoints: readonly string[]
  readonly contextWindow: number
  readonly defaultContextWindow: number
  readonly maxTokens: number
  readonly defaultMaxTokens: number
  readonly input: readonly ('text' | 'image')[]
  readonly defaultInput: readonly ('text' | 'image')[]
  readonly defaultReasoning: 'default' | XPeachModelReasoningLevel
  readonly enabledEfforts: readonly XPeachModelReasoningLevel[]
  readonly temperature: number | null
  readonly compat: XPeachModelCompatSettings
  readonly disabled: boolean
  readonly isCustom: boolean
  readonly hasCustomSettings: boolean
}

/** Complete snapshot of the three XPeach endpoint pools, gateway settings, and disabled models. */
export interface XPeachModelPoolsSnapshot {
  readonly baseUrl: string
  readonly defaultBaseUrl: string
  readonly conversationTracking: boolean
  readonly autoSyncModels: boolean
  readonly activeDefaultModel?: {
    readonly provider: string
    readonly model: string
  } | undefined
  readonly pools: Readonly<Record<XPeachEndpointPoolId, readonly XPeachModelPoolEntry[]>>
  readonly disabledModels: readonly XPeachModelPoolEntry[]
  readonly routing: XPeachModelRoutingState
}

/** Request payload for saving updated XPeach endpoint pool assignments and per-model call settings. */
export interface XPeachModelPoolsSaveRequest {
  readonly routing: XPeachModelRoutingState
  readonly autoSyncModels?: boolean | undefined
}
