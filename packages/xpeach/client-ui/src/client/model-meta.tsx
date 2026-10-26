/**
 * Client-side model context-window and capability helpers for the composer
 * model selector and XPeach marketplace rows.
 * @module @xpeach/xph-client-ui/client/model-meta
 */

import type { JSX } from 'react'
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
  const supportsImage = !nonVisionRegex.test(lower)

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
  }
}

/**
 * Inline model label renderer for the `conversation.input.model.label` slot,
 * annotating each model with its context window badge.
 *
 * @param props - slot owner props carrying the model catalog entry.
 * @returns inline model name and context-window badge element.
 */
export function XPeachModelLabel(props: {
  readonly model: { readonly id: string; readonly name: string }
  readonly placement?: 'trigger' | 'menu' | 'option'
}): JSX.Element {
  const spec = inferClientModelSpec(props.model.id)
  return (
    <span className={css.composerModelLabel}>
      <span>{props.model.name}</span>
      <span className={css.composerCtxBadge}>{spec.badge}</span>
    </span>
  )
}
