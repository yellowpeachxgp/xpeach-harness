/**
 * Type face of the forwarded-Host-event allowlist: the consumer key projection
 * and the selection seat it fills. The allowlist VALUE lives in
 * `./remote-events.ts`, keeping this module type-only per the package
 * convention; both compiler faces list both files, so the Host forwarding loop
 * and the consumer `ctx.remote.$on` key face read one declaration instead of
 * two copies that could drift.
 *
 * @module @xpeach/xph-api-remotes/types
 */

import type { API_REMOTE_FORWARDED_EVENTS } from './remote-events.ts'

/** Type projection of the allowlist; the consumer and the Host read this one. */
export type ApiRemoteForwardedEvent = typeof API_REMOTE_FORWARDED_EVENTS[number]['event']

declare module '@xpeach/xph-typert-protocol' {
  interface TypertRemoteEventSelection extends Record<ApiRemoteForwardedEvent, true> {}
}

declare module '@xpeach/xph-cordis' {
  interface Events {
    /**
     * Streamed delta from an XPeach playground chat call, emitted while the SSE
     * body is still arriving so the console can render tokens live. Best-effort
     * fan-out; the call's resolved reply remains the authoritative content.
     * @param chunk - call correlation id and the incremental text delta.
     * @mode emit
     */
    'xpeach/playground-chunk'(chunk: { callId: string; delta: string }): void
  }
}
