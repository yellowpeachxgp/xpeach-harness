/** Display-format craft helpers shared by the XPeach surfaces. */
import type { XPeachTokenLogEntry } from '@xpeach/xph-account/types'

/**
 * Quota units: New API prices one 🍑 at 500000 — display in site units.
 * @param quota - raw site quota units.
 * @returns formatted peach quota string.
 */
export function quotaUsd(quota: number | undefined): string {
  if (quota === undefined) return '—'
  return (quota / 500000).toFixed(2) + '\u{1F351}'
}

/**
 * Per-call cost: sub-cent precision since one request often runs below $0.01.
 * @param quota - raw site quota units for one call.
 * @returns formatted per-call peach cost string.
 */
export function callUsd(quota: number | undefined): string {
  if (quota === undefined || quota === 0) return '—'
  const usd = quota / 500000
  return usd < 0.01 ? '<0.01\u{1F351}' : usd.toFixed(2) + '\u{1F351}'
}

/**
 * HH:MM local clock from a unix-seconds stamp.
 * @param stamp - unix timestamp in seconds.
 * @returns HH:MM formatted clock string.
 */
export function at(stamp: number): string {
  const d = new Date(stamp * 1000)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

/**
 * Relative freshness: "just now" under 90s, "Nm" under an hour, else HH:MM.
 * @param stamp - unix timestamp in seconds.
 * @param justNow - localized label for timestamps under 90 seconds ago.
 * @param minAgo - formatter for minutes-ago label.
 * @returns formatted relative time or HH:MM string.
 */
export function rel(stamp: number, justNow: string, minAgo: (n: number) => string): string {
  const sec = Math.max(0, Math.floor(Date.now() / 1000 - stamp))
  if (sec < 90) return justNow
  if (sec < 3600) return minAgo(Math.max(1, Math.floor(sec / 60)))
  return at(stamp)
}

/**
 * Sum quota consumed by log rows stamped today → usd string.
 * @param logs - token call log rows.
 * @returns formatted today spend string.
 */
export function todaySpend(logs: readonly XPeachTokenLogEntry[]): string {
  const day = new Date()
  day.setHours(0, 0, 0, 0)
  const total = logs
    .filter(e => e.created_at * 1000 >= day.getTime())
    .reduce((sum, e) => sum + e.quota, 0)
  return quotaUsd(total)
}

/**
 * Bucketed token volume for the sparkline: last N rows, oldest → newest.
 * @param logs - token call log rows.
 * @param bars - maximum bar count.
 * @returns normalized bar heights in [0.08, 1].
 */
export function sparkBars(logs: readonly XPeachTokenLogEntry[], bars = 24): number[] {
  const slice = logs.slice(0, bars).reverse()
  if (slice.length === 0) return []
  const max = Math.max(...slice.map(e => e.prompt_tokens + e.completion_tokens), 1)
  return slice.map(e => Math.max(0.08, (e.prompt_tokens + e.completion_tokens) / max))
}

/**
 * Daily quota spend for the last `days` calendar days, oldest → newest.
 * @param logs - token call log rows.
 * @param days - number of calendar days to include.
 * @returns daily spend buckets.
 */
export function dailySpend(logs: readonly XPeachTokenLogEntry[], days = 7): { label: string; usd: number }[] {
  const out: { label: string; usd: number }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(today.getTime() - i * 86400000)
    const end = start.getTime() + 86400000
    const quota = logs.reduce((sum, e) => {
      const t = e.created_at * 1000
      return t >= start.getTime() && t < end ? sum + e.quota : sum
    }, 0)
    out.push({
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      usd: quota / 500000,
    })
  }
  return out
}

/**
 * Human duration from use_time seconds.
 * @param seconds - elapsed duration in seconds.
 * @returns compact duration label.
 */
export function useTime(seconds: number): string {
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m${seconds % 60}s`
}

/**
 * Whitelabel filter: rows whose model id / group still carries the upstream
 * brand name are dropped from consumer surfaces (market, mix, log chips). The
 * admin Site segment deliberately keeps raw station data — operators see the
 * real catalog, customers see only ours.
 * @param fields - string fields to inspect.
 * @returns true when none of the fields contain upstream brand tokens.
 */
export function isBrandSafe(...fields: readonly (string | undefined)[]): boolean {
  return !fields.some(f => f !== undefined && /deepseek|deep-seek/i.test(f))
}

/** The site origin (kept in one place so every surface agrees). */
export const SITE = {
  /** Main site — the canonical login/console origin. */
  host: 'xpeach.codes',
  console: 'https://xpeach.codes/console',
  token: 'https://xpeach.codes/console/token',
  accessToken: 'https://xpeach.codes/security',
  topup: 'https://xpeach.codes/console/topup',
  apiBase: 'https://fast.xpeach.codes/v1',
  /** Referral entry point. */
  register: 'https://fast.xpeach.codes/register',
} as const

/** Fields we surface from a log row's 'other' JSON blob (site's billing record). */
export interface LogOther {
  readonly billing_mode?: string
  readonly cache_tokens?: number
  readonly group_ratio?: number
  readonly frt?: number
  readonly expr_b64?: string
  readonly ip?: string
}

/**
 * Parse a log row's serialized `other` JSON metadata.
 * @param raw - raw JSON string from the log entry.
 * @returns parsed billing metadata, or undefined on malformed input.
 */
export function parseOther(raw: string | undefined): LogOther | undefined {
  if (raw === undefined) return undefined
  try {
    return JSON.parse(raw) as LogOther
  } catch (_invalidJson) {
    return undefined
  }
}

/**
 * Decode the base64 tiered-billing expression (len thresholds × weights).
 * @param b64 - base64-encoded billing expression.
 * @returns decoded expression string, or undefined on invalid base64.
 */
export function decodeExpr(b64: string | undefined): string | undefined {
  if (b64 === undefined) return undefined
  try {
    return atob(b64)
  } catch (_invalidBase64) {
    return undefined
  }
}

/**
 * Per-model daily cost stacks: top-4 models + 'other', newest palette-stable.
 * @param logs - token call log rows.
 * @param days - number of calendar days to include.
 * @returns daily spend buckets with per-model stack breakdown.
 */
export function dailySpendByModel(logs: readonly XPeachTokenLogEntry[], days = 7):
{ label: string; usd: number; stacks: { model: string; usd: number }[] }[] {
  const totals = new Map<string, number>()
  for (const e of logs) totals.set(e.model_name, (totals.get(e.model_name) ?? 0) + e.quota)
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m]) => m)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const out: { label: string; usd: number; stacks: { model: string; usd: number }[] }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const startDate = new Date(today.getTime() - i * 86400000)
    const start = startDate.getTime()
    const end = start + 86400000
    const bucket = new Map<string, number>()
    for (const e of logs) {
      const t = e.created_at * 1000
      if (t >= start && t < end) bucket.set(e.model_name, (bucket.get(e.model_name) ?? 0) + e.quota)
    }
    const stacks = top.map(m => ({ model: m, usd: (bucket.get(m) ?? 0) / 500000 })).filter(s => s.usd > 0)
    const other = [...bucket.entries()].filter(([m]) => !top.includes(m)).reduce((s, [, v]) => s + v, 0) / 500000
    if (other > 0) stacks.push({ model: '·other', usd: other })
    const usd = stacks.reduce((s, x) => s + x.usd, 0)
    out.push({ label: `${startDate.getMonth() + 1}/${startDate.getDate()}`, usd, stacks })
  }
  return out
}
