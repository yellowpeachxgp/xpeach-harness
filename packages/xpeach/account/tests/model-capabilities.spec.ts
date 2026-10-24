import { describe, expect, it } from 'vitest'
import { modelInputs, modelProtocol } from '../src/index.ts'

describe('catalogue capabilities', () => {
  it('declares image input only for a route that advertises vision', () => {
    // The listing carries no modality field, so the identifier is the signal.
    expect(modelInputs({ id: 'deepseek-v4-flash-vision' })).toEqual(['text', 'image'])
    expect(modelInputs({ id: 'gpt-6-vl' })).toEqual(['text', 'image'])
    // A name that merely contains the letters is not a vision route.
    expect(modelInputs({ id: 'claude-opus-5' })).toEqual(['text'])
    expect(modelInputs({ id: 'revision-model' })).toEqual(['text'])
  })

  it('picks the richest protocol the site says the route accepts', () => {
    // The Responses API keeps reasoning state across turns.
    expect(modelProtocol({ supported_endpoint_types: ['openai', 'openai-response'] })).toBe('openai-responses')
    // Anthropic keeps native cache breakpoints.
    expect(modelProtocol({ supported_endpoint_types: ['anthropic', 'openai'] })).toBe('anthropic-messages')
    // Chat completions is the universal floor.
    expect(modelProtocol({ supported_endpoint_types: ['openai'] })).toBe('openai-completions')
    // A listing with no endpoint types still gets a drivable protocol.
    expect(modelProtocol({})).toBe('openai-completions')
  })
})
