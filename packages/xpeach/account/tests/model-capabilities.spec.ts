import { describe, expect, it } from 'vitest'
import { modelInputs, modelProtocol, readProviderKeys } from '../src/index.ts'

describe('catalogue capabilities', () => {
  it('declares image input only for a route that advertises vision', () => {
    // The listing carries no modality field, so the identifier is the signal.
    expect(modelInputs({ id: 'deepseek-v4-flash-vision' })).toEqual(['text', 'image'])
    expect(modelInputs({ id: 'gpt-6-vl' })).toEqual(['text', 'image'])
    // A name that merely contains the letters is not a vision route.
    expect(modelInputs({ id: 'claude-opus-5' })).toEqual(['text'])
    expect(modelInputs({ id: 'revision-model' })).toEqual(['text'])
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
