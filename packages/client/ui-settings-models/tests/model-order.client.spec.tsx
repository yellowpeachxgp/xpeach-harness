/** Model row reordering: the profile array order is the order the picker shows. */
import { describe, expect, it } from 'vitest'

/** Move one entry, the way the editor's reorder callback does. */
function move<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items]
  const next = [...items]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return [...items]
  next.splice(to, 0, moved)
  return next
}

describe('model row order', () => {
  it('moves a row down and up without losing an entry', () => {
    const rows = ['a', 'b', 'c']
    expect(move(rows, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(move(rows, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(move(rows, 1, 1)).toEqual(['a', 'b', 'c'])
  })

  it('ignores a move outside the list', () => {
    // A drop past the end must not duplicate or drop a row.
    const rows = ['a', 'b']
    expect(move(rows, 0, 5)).toEqual(['a', 'b'])
    expect(move(rows, -1, 0)).toEqual(['a', 'b'])
  })

  it('keeps every entry when a single row list is reordered', () => {
    expect(move(['only'], 0, 0)).toEqual(['only'])
  })
})
