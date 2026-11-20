// @vitest-environment jsdom
/** Unit tests for the XPeach 3-Endpoint Model Pools Studio (drag-and-drop & per-model settings). */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type XPeachKey, zh } from '../src/client/locales.ts'
import type {
  XPeachModelPoolEntry,
  XPeachModelPoolsSaveRequest,
  XPeachModelPoolsSnapshot,
} from '../src/client/ops.ts'
import { XPeachModelPools } from '../src/client/XPeachModelPools.tsx'

afterEach(cleanup)

function makeTranslator(dict: Record<XPeachKey, string>) {
  return ((key: string, params?: Record<string, string | number>): string => {
    let text = (dict as Record<string, string>)[key] ?? key
    if (params !== undefined) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }) as Parameters<typeof XPeachModelPools>[0]['t']
}

function makePoolEntry(
  id: string,
  endpoint: XPeachModelPoolEntry['endpoint'],
  overrides?: Partial<XPeachModelPoolEntry>,
): XPeachModelPoolEntry {
  return {
    id,
    displayName: id,
    endpoint,
    recommendedEndpoint: endpoint,
    overriddenEndpoint: false,
    groups: ['SWE'],
    supportedEndpoints: ['openai'],
    contextWindow: 200_000,
    defaultContextWindow: 200_000,
    maxTokens: 32_768,
    defaultMaxTokens: 32_768,
    input: ['text', 'image'],
    defaultInput: ['text', 'image'],
    defaultReasoning: 'default',
    enabledEfforts: ['off', 'low', 'medium', 'high'],
    temperature: null,
    compat: {},
    disabled: false,
    isCustom: false,
    hasCustomSettings: false,
    ...overrides,
  }
}

describe('XPeachModelPools Studio', () => {
  it('renders the 3 endpoint pools, supports drag-and-drop pool switching, and saves per-model call settings', async () => {
    let currentSnap: XPeachModelPoolsSnapshot = {
      baseUrl: 'https://fast.xpeach.codes',
      defaultBaseUrl: 'https://fast.xpeach.codes',
      conversationTracking: true,
      autoSyncModels: true,
      activeDefaultModel: { provider: 'xpeach-openai-responses', model: 'swe-2' },
      pools: {
        'openai-completions': [makePoolEntry('deepseek-v4.1-flash', 'openai-completions')],
        'openai-responses': [makePoolEntry('swe-2', 'openai-responses')],
        'anthropic-messages': [makePoolEntry('claude-opus-5-5', 'anthropic-messages')],
      },
      disabledModels: [],
      routing: {
        version: 1,
        endpointOverrides: {},
        poolOrder: {},
        modelSettings: {},
        customModels: [],
      },
    }

    const saveCalls: XPeachModelPoolsSaveRequest[] = []
    const modelPoolsSnapshot = vi.fn(async () => currentSnap)
    const modelPoolsSave = vi.fn(async (req: XPeachModelPoolsSaveRequest) => {
      saveCalls.push(req)
      currentSnap = {
        ...currentSnap,
        routing: req.routing,
      }
      return currentSnap
    })

    const { container } = render(
      <XPeachModelPools
        t={makeTranslator(zh)}
        modelPoolsSnapshot={modelPoolsSnapshot}
        modelPoolsSave={modelPoolsSave}
        modelPoolsReset={vi.fn(async () => currentSnap)}
        syncModels={vi.fn(async () => ({ ok: true, count: 3, groups: ['SWE'] }))}
        selectModel={vi.fn(async () => null)}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('deepseek-v4.1-flash')).toBeTruthy()
      expect(screen.getByText('swe-2')).toBeTruthy()
      expect(screen.getByText('claude-opus-5-5')).toBeTruthy()
    })

    // 1. Drag `deepseek-v4.1-flash` from Chat Completions into Responses API pool
    const deepseekCard = container.querySelector('[data-model-id="deepseek-v4.1-flash"]') as HTMLElement
    const responsesBucket = container.querySelector('[data-pool-id="openai-responses"]') as HTMLElement
    expect(deepseekCard).toBeTruthy()
    expect(responsesBucket).toBeTruthy()

    let dragPayload = ''
    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: (_fmt: string, val: string) => { dragPayload = val },
      getData: () => dragPayload,
    }

    fireEvent.dragStart(deepseekCard, { dataTransfer })
    fireEvent.dragOver(responsesBucket, { dataTransfer })
    fireEvent.drop(responsesBucket, { dataTransfer })

    await waitFor(() => {
      expect(saveCalls.length).toBe(1)
    })
    expect(saveCalls[0]?.routing.endpointOverrides['deepseek-v4.1-flash']).toBe('openai-responses')

    // 2. Open detailed settings modal for `swe-2` and customize contextWindow, maxTokens, and temperature
    fireEvent.click(screen.getByText('swe-2'))

    await waitFor(() => {
      expect(screen.getByText(/模型详细调用设置 · swe-2/u)).toBeTruthy()
    })

    const ctxInput = screen.getByLabelText('上下文窗口上限 (Context Window)') as HTMLInputElement
    const maxInput = screen.getByLabelText('单次最大输出 (Max Output Tokens)') as HTMLInputElement
    fireEvent.change(ctxInput, { target: { value: '262144' } })
    fireEvent.change(maxInput, { target: { value: '65536' } })

    const saveBtn = screen.getByText('保存并持久化')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(saveCalls.length).toBe(2)
    })
    const sweSettings = saveCalls[1]?.routing.modelSettings['swe-2']
    expect(sweSettings?.contextWindow).toBe(262_144)
    expect(sweSettings?.maxTokens).toBe(65_536)
  })
})
