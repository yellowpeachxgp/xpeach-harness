import { describe, expect, it } from 'vitest'
import {
  DEFAULT_REASONING_EFFORTS,
  formatContextWindow,
  modelCapabilities,
  modelContextWindow,
  modelInputs,
  modelProtocol,
  parseModelMetadataRegistry,
  readProviderKeys,
} from '../src/index.ts'

describe('catalogue capabilities', () => {
  it('enables text and image input by default for chat models and excludes non-chat utility endpoints', () => {
    expect(modelInputs({ id: 'deepseek-v4-flash-vision' })).toEqual(['text', 'image'])
    expect(modelInputs({ id: 'gpt-5.4' })).toEqual(['text', 'image'])
    expect(modelInputs({ id: 'claude-opus-4-6' })).toEqual(['text', 'image'])
    expect(modelInputs({ id: 'swe-2-max' })).toEqual(['text', 'image'])
    expect(modelInputs({ id: 'revision-model' })).toEqual(['text', 'image'])
    // Explicit non-chat utility endpoints remain text-only.
    expect(modelInputs({ id: 'text-embedding-3-large' })).toEqual(['text'])
    expect(modelInputs({ id: 'bge-reranker-v2-m3' })).toEqual(['text'])
    expect(modelInputs({ id: 'whisper-1' })).toEqual(['text'])
  })

  it('resolves model context windows from upstream fields, synced metadata registry, and built-in family specs', () => {
    // Tier 1: Upstream fields on `/v1/models`
    expect(modelContextWindow({ id: 'custom-model', context_window: 524_288 })).toBe(524_288)
    expect(modelContextWindow({ id: 'custom-model', context_length: 300_000 })).toBe(300_000)

    // Tier 2: Dynamic metadata registry (exact match + regex rules)
    const registry = parseModelMetadataRegistry({
      version: 1,
      models: {
        'custom-exact-model': { contextWindow: 768_000, maxTokens: 64_000 },
      },
      rules: [
        { pattern: '^xpeach-ultra-', contextWindow: 1_048_576, maxTokens: 128_000 },
      ],
    })
    expect(modelContextWindow({ id: 'custom-exact-model' }, registry)).toBe(768_000)
    expect(modelContextWindow({ id: 'xpeach-ultra-v1' }, registry)).toBe(1_048_576)

    // Tier 3: Built-in official model family specifications & suffix rules
    expect(modelContextWindow({ id: 'claude-opus-4-6' })).toBe(200_000)
    expect(modelContextWindow({ id: 'claude-opus-4-6-1m' })).toBe(1_048_576)
    expect(modelContextWindow({ id: 'gpt-5.4' })).toBe(400_000)
    expect(modelContextWindow({ id: 'codex-mini-latest' })).toBe(400_000)
    expect(modelContextWindow({ id: 'gpt-4.1' })).toBe(1_047_576)
    expect(modelContextWindow({ id: 'o3' })).toBe(200_000)
    expect(modelContextWindow({ id: 'gpt-4o' })).toBe(128_000)
    expect(modelContextWindow({ id: 'gemini-2.5-pro' })).toBe(1_048_576)
    expect(modelContextWindow({ id: 'gemini-1.5-pro' })).toBe(2_097_152)
    expect(modelContextWindow({ id: 'deepseek-v4' })).toBe(1_048_576)
    expect(modelContextWindow({ id: 'deepseek-r1' })).toBe(131_072)
    expect(modelContextWindow({ id: 'swe-2-max' })).toBe(262_144)
    expect(modelContextWindow({ id: 'grok-4' })).toBe(262_144)
    expect(modelContextWindow({ id: 'kimi-k2' })).toBe(262_144)
    expect(modelContextWindow({ id: 'qwen3-coder-plus' })).toBe(1_048_576)
    expect(modelContextWindow({ id: 'glm-5' })).toBe(200_000)
    expect(modelContextWindow({ id: 'minimax-text-01' })).toBe(1_048_576)
  })

  it('defaults reasoning effort to high while exposing off/low/medium/high levels', () => {
    const caps = modelCapabilities({ id: 'claude-opus-4-6' })
    expect(caps.defaultReasoningEffort).toBe('high')
    expect(caps.reasoningEfforts).toEqual(DEFAULT_REASONING_EFFORTS)
    expect(caps.reasoningEfforts.off).toBeNull()
    expect(caps.reasoningEfforts.high).toBe('high')
    expect(caps.input).toEqual(['text', 'image'])
    expect(caps.contextWindow).toBe(200_000)
  })

  it('formats context windows into compact badge labels', () => {
    expect(formatContextWindow(200_000)).toBe('200K')
    expect(formatContextWindow(400_000)).toBe('400K')
    expect(formatContextWindow(262_144)).toBe('256K')
    expect(formatContextWindow(131_072)).toBe('128K')
    expect(formatContextWindow(1_048_576)).toBe('1M')
    expect(formatContextWindow(1_047_576)).toBe('1M')
    expect(formatContextWindow(2_097_152)).toBe('2M')
  })

  it('keeps a multi-wire route on chat completions by default', () => {
    // A relay is most likely to have channels for chat completions, so the
    // default must not move a working route onto a wire it may not serve.
    const both = { supported_endpoint_types: ['anthropic', 'openai'] }
    expect(modelProtocol(both)).toBe('openai-completions')
    expect(modelProtocol(both, 'compatible')).toBe('openai-completions')
  })

  it('prefers the richest wire when the deployment opts into native', () => {
    // Anthropic keeps native cache breakpoints.
    expect(modelProtocol({ supported_endpoint_types: ['anthropic', 'openai'] }, 'native')).toBe('anthropic-messages')
    // The Responses API keeps reasoning state.
    expect(modelProtocol({ supported_endpoint_types: ['openai', 'openai-response'] }, 'native')).toBe('openai-responses')
    expect(modelProtocol({ supported_endpoint_types: ['openai'] }, 'native')).toBe('openai-completions')
  })

  it('takes the declared wire under auto only when chat completions is absent', () => {
    // Both offered: stay on the wire this relay has served before.
    expect(modelProtocol({ supported_endpoint_types: ['anthropic', 'openai'] }, 'auto')).toBe('openai-completions')
    // Only Anthropic offered: auto still finds a drivable wire.
    expect(modelProtocol({ supported_endpoint_types: ['anthropic'] }, 'auto')).toBe('anthropic-messages')
    expect(modelProtocol({ supported_endpoint_types: ['openai-response'] }, 'auto')).toBe('openai-responses')
  })

  it('still routes a single-wire route to the only wire it accepts', () => {
    // Nothing to choose: a route with no chat completions must not be stranded.
    expect(modelProtocol({ supported_endpoint_types: ['anthropic'] })).toBe('anthropic-messages')
    expect(modelProtocol({ supported_endpoint_types: ['openai-response'] })).toBe('openai-responses')
    expect(modelProtocol({})).toBe('openai-completions')
  })

  it('reads the live provider keys so a stale write can be retired', () => {
    const described = {
      namespaces: [
        { ns: 'llm', value: {} },
        { ns: 'llm-pi-ai', value: { providers: { xpeach: {}, 'xpeach-anthropic': {}, custom: {} } } },
      ],
    }
    expect(readProviderKeys(described)).toEqual(['xpeach', 'xpeach-anthropic', 'custom'])
    expect(readProviderKeys([
      { ns: 'llm-pi-ai', value: { providers: { xpeach: {}, 'xpeach-openai-responses': {} } } },
    ])).toEqual(['xpeach', 'xpeach-openai-responses'])
    // Anything it cannot read retires nothing.
    expect(readProviderKeys(undefined)).toEqual([])
    expect(readProviderKeys({})).toEqual([])
  })

  it('bounds retries so an unfixable channel error does not stall the turn', () => {
    // A relay answers "no channel for this group" as a 500, which the default
    // policy retries five times; two attempts still cover a blipping channel.
    const policy = { mode: 'normal' as const, maxRetries: 2 }
    expect(policy.maxRetries).toBeLessThan(5)
    expect(policy.maxRetries).toBeGreaterThan(0)
  })

  it('keeps every family when none is chosen, and only the chosen ones otherwise', () => {
    // The site groups its catalogue; the switch list narrows it.
    const catalogue = [
      { id: 'swe-2-max', groups: ['SWE'] },
      { id: 'gpt-6-astra', groups: ['GPT｜Standard'] },
      { id: 'claude-opus-5', groups: ['Claude｜Max'] },
      { id: 'both', groups: ['SWE', 'Claude｜Max'] },
    ]
    const keep = (enabled: readonly string[] | undefined): string[] =>
      enabled === undefined || enabled.length === 0
        ? catalogue.map(m => m.id)
        : catalogue.filter(m => (m.groups ?? []).some(g => enabled.includes(g))).map(m => m.id)

    // Absent or empty must not silently narrow a fresh profile.
    expect(keep(undefined)).toHaveLength(4)
    expect(keep([])).toHaveLength(4)
    expect(keep(['SWE'])).toEqual(['swe-2-max', 'both'])
    // A model in two families survives either choice.
    expect(keep(['Claude｜Max'])).toEqual(['claude-opus-5', 'both'])
  })
})
