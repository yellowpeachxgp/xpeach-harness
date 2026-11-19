/**
 * Client-side model context-window and capability helpers for the composer
 * model selector and XPeach marketplace rows.
 * @module @xpeach/xph-client-ui/client/model-meta
 */

import { useSyncExternalStore, type JSX } from 'react'
import type {
  XPeachModelPerfSummary,
  XPeachPricingCatalog,
  XPeachPricingRow,
  XPeachSuccessRatePoint,
} from './ops.ts'
import css from './xpeach.module.css'

/** Client-resolved specification for a model identifier. */
export interface ClientModelSpec {
  /** Context window in tokens. */
  readonly contextWindow: number
  /** Maximum output completion tokens. */
  readonly maxTokens: number
  /** Compact context window badge (`200K`, `1M`, `400K`, `256K`, `128K`). */
  readonly badge: string
  /** Whether the model accepts image attachments alongside text. */
  readonly supportsImage: boolean
  /** Whether the model supports multimodal vision inputs. */
  readonly vision: boolean
  /** Whether the model supports high-effort reasoning/thinking. */
  readonly reasoning: boolean
}

function compactTokenBadge(tokens: number): string {
  if (tokens >= 1_000_000) {
    const mBin = tokens / 1_048_576
    const mNear = Math.round(mBin)
    if (Math.abs(mBin - mNear) < 0.08) return `${String(mNear)}M`
    return `${(tokens / 1_000_000).toFixed(1).replace(/\.0$/u, '')}M`
  }
  const kBin = tokens / 1024
  if (Number.isInteger(kBin) && (kBin === 16 || kBin === 32 || kBin === 64 || kBin === 128 || kBin === 256 || kBin === 512)) {
    return `${String(kBin)}K`
  }
  return `${String(Math.round(tokens / 1000))}K`
}

/**
 * Infer context window, max output tokens, compact badge, and image modality
 * support for a model identifier on the client.
 *
 * @param id - model identifier.
 * @param explicitContextWindow - optional server-provided context window.
 * @param explicitMaxTokens - optional server-provided max completion tokens.
 * @returns resolved client model specification.
 */
export function inferClientModelSpec(
  id: string,
  explicitContextWindow?: number,
  explicitMaxTokens?: number,
): ClientModelSpec {
  const lower = id.trim().toLowerCase()
  const nonVisionRegex = /(?:^|[-_./])(embedding|embeddings|text-embedding|rerank|reranker|bge|whisper|tts|moderation)(?:$|[-_./])/u
  const textOnlyChatRegex = /(?:^|\/)(?:deepseek-(?:v3|r1|chat|reasoner|v4-pro|coder)|qwen3?-coder|qwq|kimi-k2)/u
  const reasoningA = /(?:^|\/)(?:swe-|claude-(?:opus-4|sonnet-4|3-7)|gpt-[56]|codex|o[134](?:$|[-_.])|gemini-(?:2\.5|3))/u
  const reasoningB =
    /(?:^|\/)(?:deepseek-(?:r1|r2|reasoner|v4)|qwen3|qwq|glm-(?:5|4\.[567])|grok-(?:4|3-mini)|minimax-m2|kimi-k2-thinking)/u
  const supportsImage = !nonVisionRegex.test(lower) && !textOnlyChatRegex.test(lower)
  const reasoning = reasoningA.test(lower) || reasoningB.test(lower)

  let ctx = explicitContextWindow
  let maxOut = explicitMaxTokens

  if (ctx === undefined || ctx <= 0) {
    if (/(?:^|[-_.])2m(?:$|[-_.])/u.test(lower) || lower.includes('gemini-1.5-pro')) {
      ctx = 2_097_152
      maxOut ??= 65_536
    } else if (
      /(?:^|[-_.])(?:1m|1000k|1024k)(?:$|[-_.])/u.test(lower)
      || lower.includes('gpt-4.1')
      || lower.includes('gemini-')
      || lower.includes('deepseek-v4')
      || lower.includes('deepseek-flash')
      || lower.includes('deepseek-r2')
      || lower.includes('qwen3-coder-plus')
      || lower.includes('qwen-long')
      || lower.includes('qwen-turbo')
      || lower.includes('glm-4-long')
      || lower.includes('minimax-text-01')
      || lower.includes('minimax-01')
      || lower.includes('abab6.5s')
      || lower.includes('llama-4-scout')
    ) {
      ctx = lower.includes('gpt-4.1') ? 1_047_576 : 1_048_576
      maxOut ??= 65_536
    } else if (/(?:^|[-_.])512k(?:$|[-_.])/u.test(lower)) {
      ctx = 524_288
      maxOut ??= 65_536
    } else if (
      /(?:^|[-_.])400k(?:$|[-_.])/u.test(lower)
      || lower.includes('gpt-5')
      || lower.includes('gpt-6')
      || lower.includes('codex')
    ) {
      ctx = 400_000
      maxOut ??= 128_000
    } else if (
      /(?:^|[-_.])256k(?:$|[-_.])/u.test(lower)
      || lower.includes('swe-')
      || lower.includes('grok-4')
      || lower.includes('kimi-k2')
      || lower.includes('kimi-latest')
      || lower.includes('doubao-seed')
      || lower.includes('seed-')
      || lower.includes('llama-4')
    ) {
      ctx = 262_144
      maxOut ??= 65_536
    } else if (
      (
        /(?:^|[-_.])128k(?:$|[-_.])/u.test(lower)
        || lower.includes('deepseek-')
        || lower.includes('gpt-4o')
        || lower.includes('gpt-4-turbo')
        || lower.includes('grok-')
        || lower.includes('qwen')
        || lower.includes('qwq')
        || lower.includes('kimi')
        || lower.includes('moonshot')
        || (lower.includes('glm-') && !/glm-(?:5|4\.[567])/u.test(lower))
        || lower.includes('doubao-')
        || lower.includes('llama-')
      )
      && !/(?:^|[-_.])200k(?:$|[-_.])/u.test(lower)
    ) {
      ctx = lower.includes('gpt-4') ? 128_000 : 131_072
      maxOut ??= 32_768
    } else if (/(?:^|[-_.])64k(?:$|[-_.])/u.test(lower)) {
      ctx = 65_536
      maxOut ??= 16_384
    } else if (/(?:^|[-_.])32k(?:$|[-_.])/u.test(lower)) {
      ctx = 32_768
      maxOut ??= 8_192
    } else {
      ctx = 200_000
      maxOut ??= 64_000
    }
  }

  return {
    contextWindow: ctx,
    maxTokens: maxOut ?? 64_000,
    badge: compactTokenBadge(ctx),
    supportsImage,
    vision: supportsImage,
    reasoning,
  }
}

/** Semantic availability grade for a model's 24-hour success rate. */
export type SuccessRateGrade = 'excellent' | 'good' | 'warning' | 'critical' | 'unknown'

/** One hourly availability bar slot for the 24-hour model sparkline. */
export interface HourlySuccessBarSlot {
  readonly hourTs: number
  readonly rate: number | null
  readonly grade: SuccessRateGrade
}

/** Snapshot of client-cached model performance telemetry and pricing. */
export interface ClientModelTelemetrySnapshot {
  readonly perfByModel: ReadonlyMap<string, XPeachModelPerfSummary>
  readonly priceByModel: ReadonlyMap<string, XPeachPricingRow>
  readonly groupRatio: Readonly<Record<string, number>>
  readonly activeGroup: string | undefined
}

let telemetrySnapshot: ClientModelTelemetrySnapshot = {
  perfByModel: new Map(),
  priceByModel: new Map(),
  groupRatio: {},
  activeGroup: undefined,
}

const telemetryListeners = new Set<() => void>()

function subscribeTelemetry(listener: () => void): () => void {
  telemetryListeners.add(listener)
  return () => {
    telemetryListeners.delete(listener)
  }
}

function getTelemetrySnapshot(): ClientModelTelemetrySnapshot {
  return telemetrySnapshot
}

/**
 * Update the shared client-side model performance and pricing cache so both the
 * composer model selector (`XPeachModelLabel`) and the XPeach console Model
 * Market stay synchronized.
 *
 * @param patch - optional performance summary list, pricing catalog, and active token group.
 */
export function updateClientModelTelemetryCache(patch: {
  readonly perf?: readonly XPeachModelPerfSummary[] | undefined
  readonly pricing?: XPeachPricingCatalog | undefined
  readonly activeGroup?: string | undefined
}): void {
  let nextPerf = telemetrySnapshot.perfByModel
  let nextPrice = telemetrySnapshot.priceByModel
  let nextRatio = telemetrySnapshot.groupRatio
  let nextGroup = telemetrySnapshot.activeGroup
  let changed = false

  if (patch.perf !== undefined) {
    const map = new Map<string, XPeachModelPerfSummary>()
    for (const row of patch.perf) {
      if (typeof row.model_name === 'string' && row.model_name.length > 0) {
        map.set(row.model_name, row)
      }
    }
    nextPerf = map
    changed = true
  }

  if (patch.pricing !== undefined) {
    const map = new Map<string, XPeachPricingRow>()
    for (const row of patch.pricing.entries) {
      if (typeof row.model_name === 'string' && row.model_name.length > 0) {
        map.set(row.model_name, row)
      }
    }
    nextPrice = map
    nextRatio = patch.pricing.groupRatio
    changed = true
  }

  if ('activeGroup' in patch && patch.activeGroup !== telemetrySnapshot.activeGroup) {
    nextGroup = patch.activeGroup
    changed = true
  }

  if (!changed) return
  telemetrySnapshot = {
    perfByModel: nextPerf,
    priceByModel: nextPrice,
    groupRatio: nextRatio,
    activeGroup: nextGroup,
  }
  for (const fn of telemetryListeners) {
    fn()
  }
}

/**
 * Subscribe to the client-side model performance and pricing telemetry store.
 *
 * @returns current telemetry and pricing snapshot.
 */
export function useClientModelTelemetry(): ClientModelTelemetrySnapshot {
  return useSyncExternalStore(subscribeTelemetry, getTelemetrySnapshot, getTelemetrySnapshot)
}

/**
 * Classify a model's 24-hour success rate percentage into a semantic health grade.
 *
 * @param rate - success rate in `[0, 100]`, or `null`/`undefined`.
 * @returns semantic availability grade.
 */
export function gradeSuccessRate(rate: number | null | undefined): SuccessRateGrade {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return 'unknown'
  if (rate >= 99) return 'excellent'
  if (rate >= 95) return 'good'
  if (rate >= 85) return 'warning'
  return 'critical'
}

/**
 * Format a model throughput value in tokens per second (`t/s`).
 *
 * @param tps - tokens per second value.
 * @returns compact formatted throughput string.
 */
export function formatModelTps(tps: number | null | undefined): string {
  if (tps === null || tps === undefined || !Number.isFinite(tps) || tps <= 0) return '—'
  if (tps < 10) return `${tps.toFixed(2)} t/s`
  if (tps < 100) return `${tps.toFixed(1)} t/s`
  return `${String(Math.round(tps))} t/s`
}

/**
 * Format a latency measurement in milliseconds or seconds.
 *
 * @param ms - latency in milliseconds.
 * @returns compact formatted latency string.
 */
export function formatModelLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms <= 0) return '—'
  if (ms < 1000) return `${String(Math.round(ms))}ms`
  const sec = ms / 1000
  if (sec < 10) return `${sec.toFixed(2)}s`
  return `${sec.toFixed(1)}s`
}

/**
 * Format a success rate percentage (`0`–`100`).
 *
 * @param rate - success rate percentage.
 * @returns compact percentage string.
 */
export function formatSuccessRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return '—'
  if (rate >= 99.95) return '100%'
  return `${rate.toFixed(1).replace(/\.0$/u, '')}%`
}

/**
 * Format a compact input/output price string (`🍑/M`) for a pricing row and group multiplier.
 *
 * @param price - model pricing row from `/api/pricing`.
 * @param groupMult - active group billing multiplier (`default = 1`).
 * @returns compact price string, or `undefined` when unpriced.
 */
export function formatCompactModelPrice(
  price: XPeachPricingRow | undefined,
  groupMult = 1,
): string | undefined {
  if (price === undefined) return undefined
  const mult = Number.isFinite(groupMult) && groupMult > 0 ? groupMult : 1
  if (price.quota_type === 1 && price.model_price !== undefined) {
    return `${(price.model_price * mult).toFixed(2)}🍑`
  }
  if (price.model_ratio !== undefined) {
    const inPrice = price.model_ratio * 2 * mult
    const outPrice = inPrice * (price.completion_ratio ?? 1)
    const fmt = (n: number): string => (n < 0.1 ? n.toFixed(3) : n.toFixed(2)).replace(/\.?0+$/u, '')
    return `${fmt(inPrice)}→${fmt(outPrice)}🍑/M`
  }
  return undefined
}

/**
 * Build a fixed-length hourly availability bar series (`default = 24` hours)
 * from PeachAPI's `recent_success_series`.
 *
 * @param series - sparse hourly success-rate points from `/api/perf-metrics/summary`.
 * @param hours - number of hourly slots to emit (`default = 24`).
 * @returns ordered hourly bar slots from oldest to newest.
 */
export function buildHourlySuccessBars(
  series: readonly XPeachSuccessRatePoint[] | undefined,
  hours = 24,
): readonly HourlySuccessBarSlot[] {
  const safeHours = Math.max(1, Math.min(72, Math.floor(hours)))
  const currentHourTs = Math.floor(Date.now() / 1000 / 3600) * 3600
  const startHourTs = currentHourTs - (safeHours - 1) * 3600
  const byHour = new Map<number, number>()
  for (const point of series ?? []) {
    if (!Number.isFinite(point.ts) || !Number.isFinite(point.success_rate)) continue
    const normalizedTs = Math.floor(point.ts / 3600) * 3600
    byHour.set(normalizedTs, Math.max(0, Math.min(100, point.success_rate)))
  }
  return Array.from({ length: safeHours }, (_, index) => {
    const hourTs = startHourTs + index * 3600
    const rate = byHour.get(hourTs) ?? null
    return {
      hourTs,
      rate,
      grade: gradeSuccessRate(rate),
    }
  })
}

/**
 * Inline model label renderer for the `conversation.input.model.label` slot,
 * annotating each model with its context window badge and—inside the selector
 * dropdown menu (`placement === 'option'`)—its live 24h TPS speed, latency,
 * success rate, and pricing.
 *
 * @param props - slot owner props carrying the model catalog entry.
 * @returns inline model name, context-window badge, and telemetry pills.
 */
export function XPeachModelLabel(props: {
  readonly model: { readonly id: string; readonly name: string }
  readonly placement?: 'trigger' | 'menu' | 'option'
}): JSX.Element {
  const spec = inferClientModelSpec(props.model.id)
  const telemetry = useClientModelTelemetry()
  if (props.placement !== 'option') {
    return (
      <span className={css.composerModelLabel}>
        <span>{props.model.name}</span>
        <span className={css.composerCtxBadge}>{spec.badge}</span>
      </span>
    )
  }
  const perf = telemetry.perfByModel.get(props.model.id)
  const priceRow = telemetry.priceByModel.get(props.model.id)
  const activeRatio = telemetry.activeGroup !== undefined
    ? (telemetry.groupRatio[telemetry.activeGroup] ?? 1)
    : 1
  const priceTag = formatCompactModelPrice(priceRow, activeRatio)
  const grade = perf !== undefined ? gradeSuccessRate(perf.success_rate) : 'unknown'
  return (
    <span className={css.composerModelOptionRow}>
      <span className={css.composerModelMain}>
        <span className={css.composerModelName}>{props.model.name}</span>
        <span className={css.composerCtxBadge}>{spec.badge}</span>
      </span>
      {(perf !== undefined || priceTag !== undefined) && (
        <span className={css.composerModelTelemetry}>
          {perf !== undefined && (
            <>
              <span className={css.composerPerfChip} data-grade={grade}>
                <span className={css.composerPerfDot} data-grade={grade} />
                {formatSuccessRate(perf.success_rate)}
              </span>
              {perf.avg_tps > 0 && (
                <span className={css.composerPerfMetric}>{formatModelTps(perf.avg_tps)}</span>
              )}
              {perf.avg_latency_ms > 0 && (
                <span className={css.composerPerfMetric}>{formatModelLatency(perf.avg_latency_ms)}</span>
              )}
            </>
          )}
          {priceTag !== undefined && (
            <span className={css.composerPriceChip}>{priceTag}</span>
          )}
        </span>
      )}
    </span>
  )
}
