/** Display-format craft helpers shared by the XPeach surfaces. */
import type { XPeachTokenLogEntry } from '@xpeach/xph-account/types'

/** Quota units: New API prices one 🍑 at 500000 — display in site units. */
export function quotaUsd(quota: number | undefined): string {
  if (quota === undefined) return '—'
  return (quota / 500000).toFixed(2) + '\u{1F351}'
}

/** Per-call cost: sub-cent precision since one request often runs below $0.01. */
export function callUsd(quota: number | undefined): string {
  if (quota === undefined || quota === 0) return '—'
  const usd = quota / 500000
  return usd < 0.01 ? '<0.01\u{1F351}' : usd.toFixed(2) + '\u{1F351}'
}

/** HH:MM local clock from a unix-seconds stamp. */
export function at(stamp: number): string {
  const d = new Date(stamp * 1000)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

/**
 * Relative freshness: "just now" under 90s, "Nm" under an hour, else HH:MM.
 */
export function rel(stamp: number, justNow: string, minAgo: (n: number) => string): string {
  const sec = Math.max(0, Math.floor(Date.now() / 1000 - stamp))
  if (sec < 90) return justNow
  if (sec < 3600) return minAgo(Math.max(1, Math.floor(sec / 60)))
  return at(stamp)
}

/** Sum quota consumed by log rows stamped today → usd string. */
export function todaySpend(logs: readonly XPeachTokenLogEntry[]): string {
  const day = new Date()
  day.setHours(0, 0, 0, 0)
  const total = logs
    .filter(e => e.created_at * 1000 >= day.getTime())
    .reduce((sum, e) => sum + (e.quota ?? 0), 0)
  return quotaUsd(total)
}

/** Bucketed token volume for the sparkline: last N rows, oldest → newest. */
export function sparkBars(logs: readonly XPeachTokenLogEntry[], bars = 24): number[] {
  const slice = logs.slice(0, bars).reverse()
  if (slice.length === 0) return []
  const max = Math.max(...slice.map(e => (e.prompt_tokens ?? 0) + (e.completion_tokens ?? 0)), 1)
  return slice.map(e => Math.max(0.08, ((e.prompt_tokens ?? 0) + (e.completion_tokens ?? 0)) / max))
}

/** Daily quota spend for the last `days` calendar days, oldest → newest. */
export function dailySpend(logs: readonly XPeachTokenLogEntry[], days = 7): { label: string; usd: number }[] {
  const out: { label: string; usd: number }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(today.getTime() - i * 86400000)
    const end = start.getTime() + 86400000
    const quota = logs.reduce((sum, e) => {
      const t = e.created_at * 1000
      return t >= start.getTime() && t < end ? sum + (e.quota ?? 0) : sum
    }, 0)
    out.push({
      label: (start.getMonth() + 1) + '/' + start.getDate(),
      usd: quota / 500000,
    })
  }
  return out
}

/** Human duration from use_time seconds. */
export function useTime(seconds: number): string {
  return seconds < 60 ? seconds + 's' : Math.floor(seconds / 60) + 'm' + (seconds % 60) + 's'
}

/**
 * Whitelabel filter: rows whose model id / group still carries the upstream
 * brand name are dropped from consumer surfaces (market, mix, log chips). The
 * admin Site segment deliberately keeps raw station data — operators see the
 * real catalog, customers see only ours.
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
  apiBase: 'https://xpeach.codes/v1',
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
export function parseOther(raw: string | undefined): LogOther | undefined {
  if (raw === undefined) return undefined
  try { return JSON.parse(raw) as LogOther } catch { return undefined }
}
/** Decode the base64 tiered-billing expression (len thresholds × weights). */
export function decodeExpr(b64: string | undefined): string | undefined {
  if (b64 === undefined) return undefined
  try { return atob(b64) } catch { return undefined }
}

/** Per-model daily cost stacks: top-4 models + 'other', newest palette-stable. */
export function dailySpendByModel(logs: readonly XPeachTokenLogEntry[], days = 7):
{ label: string; usd: number; stacks: { model: string; usd: number }[] }[] {
  const totals = new Map<string, number>()
  for (const e of logs) totals.set(e.model_name, (totals.get(e.model_name) ?? 0) + (e.quota ?? 0))
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m]) => m)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const out: { label: string; usd: number; stacks: { model: string; usd: number }[] }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(today.getTime() - i * 86400000).getTime()
    const end = start + 86400000
    const bucket = new Map<string, number>()
    for (const e of logs) {
      const t = e.created_at * 1000
      if (t >= start && t < end) bucket.set(e.model_name, (bucket.get(e.model_name) ?? 0) + (e.quota ?? 0))
    }
    const stacks = top.map(m => ({ model: m, usd: (bucket.get(m) ?? 0) / 500000 })).filter(s => s.usd > 0)
    const other = [...bucket.entries()].filter(([m]) => !top.includes(m)).reduce((s, [, v]) => s + v, 0) / 500000
    if (other > 0) stacks.push({ model: '·other', usd: other })
    const usd = stacks.reduce((s, x) => s + x.usd, 0)
    out.push({ label: (new Date(start).getMonth() + 1) + '/' + new Date(start).getDate(), usd, stacks })
  }
  return out
}
