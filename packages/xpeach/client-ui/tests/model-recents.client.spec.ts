import { describe, expect, it } from 'vitest'
import { promoteRecent, RECENTS_LIMIT, type RecentModel } from '../src/client/recents.ts'

const a: RecentModel = { provider: 'xpeach', model: 'swe-2-max' }
const b: RecentModel = { provider: 'xpeach', model: 'deepseek-flash' }
const c: RecentModel = { provider: 'xpeach-anthropic', model: 'claude-opus-5' }

describe('recent models', () => {
  it('puts the newest first', () => {
    expect(promoteRecent([], a)).toEqual([a])
    expect(promoteRecent([a], b)).toEqual([b, a])
  })

  it('dedupes by the whole route, not by model id alone', () => {
    // The same model id can exist under two providers; switching wires is a
    // different route and both belong in the list.
    const sameIdOtherProvider: RecentModel = { provider: 'xpeach-anthropic', model: 'swe-2-max' }
    expect(promoteRecent([a], sameIdOtherProvider)).toEqual([sameIdOtherProvider, a])
    // Re-using the exact route moves it rather than duplicating it.
    expect(promoteRecent([b, a], a)).toEqual([a, b])
  })

  it('caps the list', () => {
    let list: RecentModel[] = []
    for (let index = 0; index <= RECENTS_LIMIT + 3; index += 1) {
      list = promoteRecent(list, { provider: 'xpeach', model: `m${index}` })
    }
    expect(list).toHaveLength(RECENTS_LIMIT)
    // The oldest entries fall off, the newest stays at the front.
    expect(list[0]?.model).toBe(`m${RECENTS_LIMIT + 3}`)
  })

  it('keeps an untouched list in order', () => {
    expect(promoteRecent([c, b, a], c)).toEqual([c, b, a])
  })
})
