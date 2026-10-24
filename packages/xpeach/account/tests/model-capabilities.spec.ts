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
    // Anything it cannot read retires nothing.
    expect(readProviderKeys(undefined)).toEqual([])
    expect(readProviderKeys({})).toEqual([])
  })
})
