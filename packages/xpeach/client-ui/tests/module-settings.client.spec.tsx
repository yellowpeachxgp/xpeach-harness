// @vitest-environment jsdom
/** Unit tests for the Feature Module settings panel and General Preferences rows. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GeneralPreferencesRow } from '../src/client/GeneralPreferencesRow.tsx'
import { en, type XPeachKey, zh } from '../src/client/locales.ts'
import {
  ModuleSettingsSection,
  type ModuleSettingsSectionProps,
  ModuleSettingsTab,
} from '../src/client/ModuleSettingsSection.tsx'
import type { XPeachSettingsMutationOp, XPeachSettingsNamespaceItem } from '../src/client/ops.ts'

afterEach(cleanup)

function makeTranslator(dict: Record<XPeachKey, string>): ModuleSettingsSectionProps['t'] {
  return ((key: string, params?: Record<string, string | number>): string => {
    let text = (dict as Record<string, string>)[key] ?? key
    if (params !== undefined) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }) as ModuleSettingsSectionProps['t']
}

describe('ModuleSettingsSection & GeneralPreferencesRow', () => {
  it('keeps zh and en locale dictionaries key-identical', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
  })

  it('renders all 6 feature module cards, applies quick chips and segmented buttons, and resets overrides', async () => {
    const initialNamespaces: XPeachSettingsNamespaceItem[] = [
      {
        ns: 'agent-loop',
        value: { maxParallelToolCalls: 8 },
        base: { maxParallelToolCalls: 8 },
        user: {},
        revision: 1,
      },
      {
        ns: 'permission',
        value: { defaultPreset: 'workspace-write' },
        base: { defaultPreset: 'workspace-write' },
        user: {},
        revision: 2,
      },
      {
        ns: 'bash-sandbox',
        value: { timeoutMs: 120_000, maxTimeoutMs: 600_000, maxOutputBytes: 64_000, maxSpillBytes: 10_485_760, graceMs: 5_000 },
        base: { timeoutMs: 60_000, maxTimeoutMs: 600_000, maxOutputBytes: 64_000, maxSpillBytes: 10_485_760, graceMs: 5_000 },
        user: { timeoutMs: 120_000 },
        revision: 3,
      },
      {
        ns: 'subagent',
        value: { maxDepth: 1, maxActiveSubagents: 8 },
        base: { maxDepth: 1, maxActiveSubagents: 8 },
        user: {},
        revision: 4,
      },
      {
        ns: 'web',
        value: { searchProvider: 'deepseek-official', fetchProvider: 'http' },
        base: { searchProvider: 'deepseek-official', fetchProvider: 'http' },
        user: {},
        revision: 5,
      },
    ]

    const mutateCalls: Array<{ ns: string; ops: readonly XPeachSettingsMutationOp[]; rev?: number | undefined }> = []
    const describeSettings = vi.fn(async () => initialNamespaces)
    const mutateSettings = vi.fn(async (ns: string, ops: readonly XPeachSettingsMutationOp[], rev?: number) => {
      mutateCalls.push({ ns, ops, rev })
      return {
        ns,
        value: { maxParallelToolCalls: 16 },
        base: { maxParallelToolCalls: 8 },
        user: { maxParallelToolCalls: 16 },
        revision: 6,
      }
    })

    const t = makeTranslator(zh)
    render(
      <ModuleSettingsSection
        t={t}
        describeSettings={describeSettings}
        mutateSettings={mutateSettings}
        trackingState={async () => true}
        setTracking={async () => null}
        protocolPreference={async () => 'compatible'}
        setProtocolPreference={async () => null}
        autoSyncModels={async () => true}
        setAutoSyncModels={async () => null}
        syncModels={async () => ({ ok: true, count: 12, groups: ['default'] })}
        networkStatus={async () => ({
          at: Date.now(),
          active: 'https://fast.xpeach.codes',
          auto: true,
          probes: [{ id: 'fast', label: 'Fast', url: 'https://fast.xpeach.codes', latencyMs: 42, loss: 0, samples: 3, ok: true }],
          history: {},
        })}
        networkAuto={async () => ({
          at: Date.now(),
          active: 'https://fast.xpeach.codes',
          auto: false,
          probes: [],
          history: {},
        })}
        networkRoute={async () => ({
          at: Date.now(),
          active: 'https://fast.xpeach.codes',
          auto: false,
          probes: [],
          history: {},
        })}
      />,
    )

    await waitFor(() => {
      expect(describeSettings).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText(zh['modules.engine.title'])).toBeTruthy()
    expect(screen.getByText(zh['modules.shell.title'])).toBeTruthy()
    expect(screen.getByText(zh['modules.subagent.title'])).toBeTruthy()
    expect(screen.getByText(zh['modules.web.title'])).toBeTruthy()
    expect(screen.getByText(zh['modules.ui.title'])).toBeTruthy()
    expect(screen.getByText(zh['modules.gateway.title'])).toBeTruthy()

    // Click preset chip "16" on maxParallelToolCalls
    const chip16 = screen.getAllByRole('button', { name: '16' })[0]!
    fireEvent.click(chip16)
    await waitFor(() => {
      expect(mutateCalls.some(c => c.ns === 'agent-loop')).toBe(true)
    })
    expect(mutateCalls.find(c => c.ns === 'agent-loop')?.ops).toEqual([
      { op: 'set', path: ['maxParallelToolCalls'], value: 16 },
    ])

    // Click reset button on customized bash-sandbox timeoutMs
    const resetBtns = screen.getAllByRole('button', { name: zh['modules.act.reset'] })
    expect(resetBtns.length).toBeGreaterThanOrEqual(2)
    fireEvent.click(resetBtns[resetBtns.length - 1]!)
    await waitFor(() => {
      expect(mutateCalls.some(c => c.ns === 'bash-sandbox' && c.ops[0]?.op === 'unset')).toBe(true)
    })

    // Filter to a single category
    fireEvent.click(screen.getByRole('tab', { name: zh['modules.cat.subagent'] }))
    expect(screen.getByText(zh['modules.subagent.title'])).toBeTruthy()
    expect(screen.queryByText(zh['modules.shell.title'])).toBeNull()
  })

  it('renders ModuleSettingsTab and GeneralPreferencesRow quick switches', async () => {
    const t = makeTranslator(zh)
    const mutateSettings = vi.fn(async (ns: string) => ({
      ns,
      value: { enabled: true },
      revision: 2,
    }))

    render(
      <div>
        <ModuleSettingsTab
          t={t}
          describeSettings={async () => []}
          mutateSettings={mutateSettings}
          trackingState={async () => true}
          setTracking={async () => null}
          protocolPreference={async () => 'compatible'}
          setProtocolPreference={async () => null}
          syncModels={async () => ({ ok: true, count: 5, groups: [] })}
          networkStatus={async () => ({ at: 0, active: '', auto: true, probes: [], history: {} })}
          networkAuto={async () => ({ at: 0, active: '', auto: true, probes: [], history: {} })}
          networkRoute={async () => ({ at: 0, active: '', auto: true, probes: [], history: {} })}
        />
        <GeneralPreferencesRow
          t={t}
          describeSettings={async () => [
            { ns: 'subagent-model-selection-settings', value: { enabled: false }, revision: 1 },
          ]}
          mutateSettings={mutateSettings}
          trackingState={async () => true}
          setTracking={async () => null}
          protocolPreference={async () => 'compatible'}
          setProtocolPreference={async () => null}
          syncModels={async () => ({ ok: true, count: 5, groups: [] })}
          networkStatus={async () => ({ at: 0, active: '', auto: true, probes: [], history: {} })}
          networkAuto={async () => ({ at: 0, active: '', auto: true, probes: [], history: {} })}
          networkRoute={async () => ({ at: 0, active: '', auto: true, probes: [], history: {} })}
        />
      </div>,
    )

    expect(screen.getAllByText(zh['modules.subagent.modelSel.title']).length).toBeGreaterThanOrEqual(2)
  })
})
