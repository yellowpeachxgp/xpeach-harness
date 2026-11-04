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
    expect(gpt6.vision).toBe(true)
    expect(gpt6.reasoning).toBe(true)

    const claude = inferClientModelSpec('claude-opus-4-6')
    expect(claude.contextWindow).toBe(200_000)
    expect(claude.badge).toBe('200K')
    expect(claude.vision).toBe(true)
    expect(claude.reasoning).toBe(true)

    const gemini = inferClientModelSpec('gemini-3.1-pro-preview')
    expect(gemini.contextWindow).toBe(1_048_576)
    expect(gemini.badge).toBe('1M')
    expect(gemini.vision).toBe(true)
    expect(gemini.reasoning).toBe(true)

    const swe = inferClientModelSpec('swe-2-max')
    expect(swe.contextWindow).toBe(262_144)
    expect(swe.badge).toBe('256K')
    expect(swe.vision).toBe(true)
    expect(swe.reasoning).toBe(true)

    const deepseekR1 = inferClientModelSpec('deepseek-r1')
    expect(deepseekR1.vision).toBe(false)
    expect(deepseekR1.supportsImage).toBe(false)
    expect(deepseekR1.reasoning).toBe(true)

    const deepseekChat = inferClientModelSpec('deepseek-chat')
    expect(deepseekChat.vision).toBe(false)
    expect(deepseekChat.reasoning).toBe(false)

    const deepseekV3 = inferClientModelSpec('deepseek-v3')
    expect(deepseekV3.vision).toBe(false)
    expect(deepseekV3.reasoning).toBe(false)

    const gpt4oMini = inferClientModelSpec('gpt-4o-mini')
    expect(gpt4oMini.vision).toBe(true)
    expect(gpt4oMini.reasoning).toBe(false)

    const haiku35 = inferClientModelSpec('claude-3-5-haiku')
    expect(haiku35.vision).toBe(true)
    expect(haiku35.reasoning).toBe(false)

    const qwenCoder = inferClientModelSpec('qwen3-coder')
    expect(qwenCoder.vision).toBe(false)
    expect(qwenCoder.reasoning).toBe(true)

    const kimiK2 = inferClientModelSpec('kimi-k2')
    expect(kimiK2.vision).toBe(false)
    expect(kimiK2.reasoning).toBe(false)
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
