/** Network route health: three XPeach API endpoints, probed from the host
 * (where LLM traffic actually leaves) every 30s. Latency is the median of
 * three samples, loss the failed fraction; the account plugin switches the
 * active route when another one is clearly better. */

import type { XPeachNetworkPoint, XPeachNetworkRoute, XPeachNetworkSnapshot } from './types.ts'

export type { XPeachNetworkPoint, XPeachNetworkRoute, XPeachNetworkSnapshot }

/** Published API endpoint descriptor before probing. */
export interface XPeachRoute {
  readonly id: string
  readonly label: string
  readonly url: string
}

/** Preferred route when no choice is stored yet. */
export const DEFAULT_ROUTE_URL = 'https://fast.xpeach.codes'

/** Fast gets a deliberate scoring bonus (high weight) over the other routes. */
const ROUTE_BONUS: Readonly<Record<string, number>> = { fast: 0.8, main: 1, ultra: 1.05 }

/** The three published API routes (each serves /v1). */
export const ROUTES: readonly XPeachRoute[] = [
  { id: 'main', label: '主线路', url: 'https://xpeach.codes' },
  { id: 'fast', label: 'Fast', url: 'https://fast.xpeach.codes' },
  { id: 'ultra', label: 'UltraFast', url: 'https://ultrafast.xpeach.codes' },
]

type XPeachRouteProbe = XPeachNetworkRoute

const SAMPLES = 3

/** Probe one route with three sequential requests. */
async function probeRoute(route: XPeachRoute, key: string | undefined, timeoutMs: number): Promise<XPeachRouteProbe> {
  const path = key === undefined ? '/api/status' : '/v1/models'
  const headers: Record<string, string> = key === undefined ? { Accept: 'application/json' } : { Authorization: 'Bearer ' + key, Accept: 'application/json' }
  let okCount = 0
  const latencies: number[] = []
  for (let i = 0; i < SAMPLES; i += 1) {
    const started = performance.now()
    try {
      const response = await fetch(route.url + path, { headers, signal: AbortSignal.timeout(timeoutMs) })
      await response.text()
      if (response.ok) {
        okCount += 1
        latencies.push(performance.now() - started)
      }
    } catch (_err) { /* timeout or transport error counts as loss */ }
  }
  const sorted = [...latencies].sort((a, b) => a - b)
  const latencyMs = sorted.length === 0 ? undefined : Math.round(sorted[Math.floor(sorted.length / 2)] as number)
  return {
    ...route,
    ...(latencyMs === undefined ? {} : { latencyMs }),
    loss: (SAMPLES - okCount) / SAMPLES,
    samples: SAMPLES,
    ok: okCount > 0,
  }
}

/**
 * Probe every route in parallel (three samples each).
 *
 * @param key - optional relay API key used to probe `/v1/models` instead of `/api/status`.
 * @param timeoutMs - per-sample timeout in milliseconds.
 * @returns probe measurements for each published route.
 */
export async function probeRoutes(key: string | undefined, timeoutMs = 6000): Promise<XPeachRouteProbe[]> {
  return await Promise.all(ROUTES.map(route => probeRoute(route, key, timeoutMs)))
}

/** Score = latency penalized by loss; unreachable routes score Infinity. */
function score(probe: XPeachRouteProbe): number {
  if (!probe.ok || probe.latencyMs === undefined) return Number.POSITIVE_INFINITY
  const base = probe.latencyMs * (1 + probe.loss * 4) + probe.loss * 400
  return base * (ROUTE_BONUS[probe.id] ?? 1)
}

/**
 * Pick the best route. Keeps the current route unless another one is at least
 * 15% better (or the current one is failing) to avoid flapping.
 *
 * @param probes - current probe results across published routes.
 * @param current - URL of the currently active route.
 * @returns the selected route probe, or `undefined` when every route is unreachable.
 */
export function chooseBest(probes: readonly XPeachRouteProbe[], current: string): XPeachRouteProbe | undefined {
  const ranked = [...probes].filter(probe => probe.ok).sort((a, b) => score(a) - score(b))
  const best = ranked[0]
  if (best === undefined) return undefined
  const active = probes.find(probe => probe.url === current)
  if (active !== undefined && active.ok && active.latencyMs !== undefined && best.latencyMs !== undefined) {
    const improvement = 1 - score(best) / score(active)
    if (improvement < 0.15) return active
  }
  return best
}
