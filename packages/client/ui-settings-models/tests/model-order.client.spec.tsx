// @vitest-environment jsdom
/** Model row reordering: the profile array order is the order the picker shows. */
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModelListEditor, type ModelDraft } from '../src/client/ModelListEditor.tsx'
import { en } from '../src/client/locales.ts'
import type { ModelsOperations } from '../src/client/operations.ts'

afterEach(() => { cleanup() })

/** Move one entry, the way the editor's reorder callback does. */
function move<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items]
  const next = [...items]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return [...items]
  next.splice(to, 0, moved)
  return next
}

const operations: ModelsOperations = {
  storeCredential: () => Promise.resolve(undefined),
  removeCredential: () => Promise.resolve(undefined),
  writeSettings: () => Promise.resolve({ kind: 'refused', message: 'unused' }),
  discoverModels: () => Promise.resolve({ kind: 'found', models: [] }),
}

function Harness({ initial }: { initial: ModelDraft[] }) {
  const [models, setModels] = useState<ModelDraft[]>(initial)
  return (
    <ModelListEditor
      models={models}
      onChange={setModels}
      probe={{ settingsNs: 'llm-pi-ai' }}
      operations={operations}
      t={key => en[key]}
      disabled={false}
      onBusyChange={() => {}}
    />
  )
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

  it('keeps expanded disclosures and in-flight capacity text with their moved rows and blocks input drags', () => {
    const { container } = render(
      <Harness initial={[{ id: 'alpha' }, { id: 'beta' }, { id: 'gamma' }]} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Model options 1' }))
    const cap1 = screen.getByRole<HTMLInputElement>('textbox', { name: 'Context window 1' })
    fireEvent.change(cap1, { target: { value: '128000' } })
    expect(cap1.value).toBe('128000')

    const rows = container.querySelectorAll<HTMLElement>('[data-drag-handle="model-row"]')
    expect(rows).toHaveLength(3)

    // Dragging inside an input is blocked rather than reordering the row.
    const idInput = screen.getByRole<HTMLInputElement>('textbox', { name: 'Model ID 1' })
    const inputDrag = new Event('dragstart', { bubbles: true, cancelable: true })
    fireEvent(idInput, inputDrag)
    expect(inputDrag.defaultPrevented).toBe(true)

    const dataTransfer = { effectAllowed: 'none', dropEffect: 'none', setData: vi.fn() }
    fireEvent.dragStart(rows[0]!, { dataTransfer })
    fireEvent.dragOver(rows[2]!, { dataTransfer })
    fireEvent.dragLeave(rows[2]!, { relatedTarget: rows[2]!.querySelector('input') })
    fireEvent.drop(rows[2]!, { dataTransfer })
    fireEvent.dragEnd(rows[0]!, { dataTransfer })

    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Model ID 1' }).value).toBe('beta')
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Model ID 2' }).value).toBe('gamma')
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Model ID 3' }).value).toBe('alpha')
    expect(screen.getByRole('button', { name: 'Model options 3' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Context window 3' }).value).toBe('128000')
  })
})
