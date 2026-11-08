/** Conversation navigation spacing preserves the right-pane header alignment. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/skeleton/ConversationRoot.module.css', import.meta.url), 'utf8')

describe('conversation header geometry', () => {
  it('removes the extra tab inset only in narrow Web windows', () => {
    const narrow = /@media \(max-width: 767px\) \{([\s\S]*?)\n\}/.exec(css)?.[1]
    expect(narrow).toContain(':global(html:not([data-platform])) .tabs')
    expect(narrow).toContain('padding-left: 0')
  })
})
