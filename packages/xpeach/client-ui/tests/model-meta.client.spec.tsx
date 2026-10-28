import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SlotCore, type PropsRenderSlots } from '@xpeach/xph-client-ui-slots'
import { inferClientModelSpec, XPeachModelLabel } from '../src/client/model-meta.tsx'

describe('model-meta and XPeachModelLabel', () => {
  it('infers context window and capabilities for known model families', () => {
    const gpt6 = inferClientModelSpec('gpt-6-high')
    expect(gpt6.contextWindow).toBe(400_000)
    expect(gpt6.badge).toBe('400K')
    expect(gpt6.supportsImage).toBe(true)

    const claude = inferClientModelSpec('claude-opus-4-6')
    expect(claude.contextWindow).toBe(200_000)
    expect(claude.badge).toBe('200K')

    const gemini = inferClientModelSpec('gemini-3.1-pro-preview')
    expect(gemini.contextWindow).toBe(1_048_576)
    expect(gemini.badge).toBe('1M')

    const swe = inferClientModelSpec('swe-2-max')
    expect(swe.contextWindow).toBe(262_144)
    expect(swe.badge).toBe('256K')
  })

  it('renders model name and context-window badge in XPeachModelLabel', () => {
    const html = renderToStaticMarkup(
      <XPeachModelLabel
        model={{ id: 'gpt-6-high', name: 'gpt-6-high' }}
        placement="option"
      />,
    )
    expect(html).toContain('gpt-6-high')
    expect(html).toContain('400K')
  })

  it('shadows priority-0 model label registrations at priority -10 without colliding', () => {
    const core = new SlotCore()
    const disposeRoot = core.register(
      {
        name: 'root',
        children: {
          'conversation.input.model.label': { kind: 'single', scope: 'session', inline: true },
        },
      },
      (_props: PropsRenderSlots<'conversation.input.model.label'>) => null,
    )
    const disposeDefault = core.register(
      { name: 'conversation.input.model.label' },
      ({ model }) => <span>{model.name}</span>,
    )
    const disposeXPeach = core.register(
      { name: 'conversation.input.model.label', priority: -10 },
      XPeachModelLabel,
    )
    const entries = core.entriesOfSlot('conversation.input.model.label')
    expect(entries).toHaveLength(1)
    expect(entries[0]?.component).toBe(XPeachModelLabel)
    disposeXPeach()
    disposeDefault()
    disposeRoot()
  })
})
