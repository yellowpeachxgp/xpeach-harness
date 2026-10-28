/** The conversation-tracking switch: an absent field means on. */
import { describe, expect, it } from 'vitest'

/**
 * Read the switch out of a provider map, the way the settings row does.
 * @param providers - the llm-pi-ai provider map.
 * @returns whether tracking is on.
 */
function trackingOn(providers: Record<string, { conversationTracking?: boolean }>): boolean {
  return providers.xpeach?.conversationTracking !== false
}

describe('conversation tracking switch', () => {
  it('treats an absent field as on, because a relay rejects a nameless request', () => {
    expect(trackingOn({ xpeach: {} })).toBe(true)
    expect(trackingOn({ xpeach: { conversationTracking: true } })).toBe(true)
  })

  it('reads the canonical provider, which every product provider is written with', () => {
    expect(trackingOn({ xpeach: { conversationTracking: false } })).toBe(false)
    // The other product providers carry the same value, so they never disagree.
    expect(trackingOn({ xpeach: { conversationTracking: false }, 'xpeach-anthropic': { conversationTracking: false } })).toBe(false)
  })

  it('ignores a provider this product does not own', () => {
    expect(trackingOn({ custom: { conversationTracking: false } })).toBe(true)
  })
})
