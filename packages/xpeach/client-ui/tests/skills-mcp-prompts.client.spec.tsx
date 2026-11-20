// @vitest-environment jsdom
/** Unit tests for Skills & MCP batch operations and the Prompt & Gateway Inspector UI. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type XPeachKey, zh } from '../src/client/locales.ts'
import type { XPeachGatewayInspectorSnapshot, XPeachMcpSnapshot, XPeachOps, XPeachSkillsSnapshot } from '../src/client/ops.ts'
import { XPeachMcpPage } from '../src/client/XPeachMcp.tsx'
import { XPeachPromptInspectorPage } from '../src/client/XPeachPromptInspector.tsx'
import { XPeachSkillsPage } from '../src/client/XPeachSkills.tsx'

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
  }) as Parameters<typeof XPeachSkillsPage>[0]['t']
}

describe('Skills, MCP batch controls & Prompt Inspector Studio', () => {
  it('supports select-all and atomic batch disable/enable in XPeachSkillsPage', async () => {
    const initialSnap: XPeachSkillsSnapshot = {
      skills: [
        {
          id: 'user:alpha',
          name: 'alpha-skill',
          dirName: 'alpha-skill',
          description: 'Alpha capability',
          path: '/Users/dev/.xph/skills/alpha-skill/SKILL.md',
          source: 'user',
          enabled: true,
          valid: true,
          content: 'Alpha',
        },
        {
          id: 'agents:beta',
          name: 'beta-skill',
          dirName: 'beta-skill',
          description: 'Beta capability',
          path: '/Users/dev/.agents/skills/beta-skill/SKILL.md',
          source: 'agents',
          enabled: true,
          valid: true,
          content: 'Beta',
        },
      ],
      rulesPath: '/Users/dev/.xph/AGENTS.md',
      rulesContent: '',
    }
    const skillBatchToggle = vi.fn<NonNullable<XPeachOps['skillBatchToggle']>>(async ({ enabled }) => ({
      ...initialSnap,
      skills: initialSnap.skills.map(s => ({ ...s, enabled })),
    }))

    render(
      <XPeachSkillsPage
        skillsList={vi.fn(async () => initialSnap)}
        skillToggle={vi.fn(async () => initialSnap)}
        skillBatchToggle={skillBatchToggle}
        skillSave={vi.fn(async () => initialSnap)}
        skillDelete={vi.fn(async () => initialSnap)}
        rulesSave={vi.fn(async () => initialSnap)}
        importAssets={vi.fn(async () => ({ mcp: 0, skills: 0, prompts: 0, errors: [] }))}
        t={makeTranslator(zh)}
      />,
    )

    await screen.findByText('alpha-skill')
    fireEvent.click(screen.getByRole('button', { name: zh['ctrl.selectAll'].replace('{n}', '2') }))
    expect(screen.getByText(zh['ctrl.selectedCount'].replace('{n}', '2'))).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: zh['ctrl.batchDisable'] }))
    await waitFor(() => {
      expect(skillBatchToggle).toHaveBeenCalledWith({
        items: [
          { dirName: 'alpha-skill', name: 'alpha-skill' },
          { dirName: 'beta-skill', name: 'beta-skill' },
        ],
        enabled: false,
      })
    })
  })

  it('supports select-all and atomic batch toggle in XPeachMcpPage', async () => {
    const initialMcp: XPeachMcpSnapshot = {
      servers: [
        {
          id: 'mcp-fs',
          serverName: 'filesystem',
          disabled: false,
          transportType: 'stdio',
          command: 'npx',
          args: ['@modelcontextprotocol/server-filesystem'],
          status: 'active',
          toolCount: 2,
          tools: [{ name: 'read_file', description: 'Read file' }],
        },
        {
          id: 'mcp-web',
          serverName: 'web-fetch',
          disabled: false,
          transportType: 'streamable-http',
          url: 'https://mcp.example.com/sse',
          status: 'configured',
          toolCount: 0,
          tools: [],
        },
      ],
      patchPath: '/Users/dev/.xph/profiles/desktop/cordis.patch.yml',
    }
    const mcpBatchToggle = vi.fn<NonNullable<XPeachOps['mcpBatchToggle']>>(async ({ enabled }) => ({
      ...initialMcp,
      servers: initialMcp.servers.map(s => ({ ...s, disabled: !enabled })),
    }))

    render(
      <XPeachMcpPage
        mcpList={vi.fn(async () => initialMcp)}
        mcpToggle={vi.fn(async () => initialMcp)}
        mcpBatchToggle={mcpBatchToggle}
        mcpSave={vi.fn(async () => initialMcp)}
        mcpDelete={vi.fn(async () => initialMcp)}
        importAssets={vi.fn(async () => ({ mcp: 0, skills: 0, prompts: 0, errors: [] }))}
        t={makeTranslator(zh)}
      />,
    )

    await screen.findByText('filesystem')
    fireEvent.click(screen.getByRole('button', { name: zh['ctrl.selectAll'].replace('{n}', '2') }))
    fireEvent.click(screen.getByRole('button', { name: zh['ctrl.batchDisable'] }))

    await waitFor(() => {
      expect(mcpBatchToggle).toHaveBeenCalledWith({
        ids: ['mcp-fs', 'mcp-web'],
        enabled: false,
      })
    })
  })

  it('renders full upstream headers, request body JSON, implicit prompts, and saves overrides in XPeachPromptInspectorPage', async () => {
    const snap: XPeachGatewayInspectorSnapshot = {
      method: 'POST',
      endpointUrl: 'https://fast.xpeach.codes/v1/chat/completions',
      activeBaseUrl: 'https://fast.xpeach.codes/v1',
      protocol: 'openai-completions',
      providerKey: 'xpeach',
      model: 'swe-2-max',
      availableModels: ['swe-2-max', 'claude-sonnet-4-5'],
      recentSessions: [],
      headers: [
        { name: 'Authorization', value: 'Bearer sk-1234••••5678', source: 'auth', editable: false, enabled: true },
        { name: 'user-agent', value: 'deepseek-harness/0.0.36-alpha', source: 'attribution', editable: false, enabled: true },
      ],
      sections: [
        {
          name: 'harness:identity',
          order: -1000,
          category: 'identity',
          defaultText: 'You are an AI agent powered by XPeach Harness.',
          effectiveText: 'You are an AI agent powered by XPeach Harness.',
          enabled: true,
          overridden: false,
          isCustom: false,
          charCount: 46,
          estTokens: 12,
        },
      ],
      contexts: [
        {
          name: 'working-directory',
          order: 100,
          required: true,
          defaultText: 'Current working directory: /repo',
          effectiveText: 'Current working directory: /repo',
          enabled: true,
          overridden: false,
          isCustom: false,
          charCount: 32,
          estTokens: 9,
        },
      ],
      implicitInjections: [
        {
          id: 'skill-catalog',
          label: '<available_skills> 技能目录隐性注入',
          sourceKind: 'skill-catalog',
          trigger: 'skill-catalog',
          enabled: true,
          toggleable: true,
          previewText: '<system-reminder>\n<available_skills>\n- `audit`: Audit\n</available_skills>\n</system-reminder>',
          charCount: 92,
          estTokens: 25,
        },
      ],
      tools: [
        {
          name: 'bash',
          source: 'builtin',
          defaultDescription: 'Execute shell command',
          effectiveDescription: 'Execute shell command',
          parameters: { type: 'object', properties: { command: { type: 'string' } } },
          enabled: true,
          overridden: false,
          estTokens: 30,
        },
      ],
      variables: { model: 'swe-2-max', provider: 'xpeach' },
      renderedSystemPrompt: 'You are an AI agent powered by XPeach Harness.',
      renderedRuntimeContext: 'Current runtime context.\n\nCurrent working directory: /repo',
      requestBodyJson: JSON.stringify({ model: 'swe-2-max', stream: true, messages: [{ role: 'developer', content: 'You are an AI agent powered by XPeach Harness.' }] }, null, 2),
      curlPreview: 'curl -X POST "https://fast.xpeach.codes/v1/chat/completions"',
      stats: {
        systemTokens: 12,
        contextTokens: 9,
        implicitTokens: 25,
        toolTokens: 30,
        totalEstTokens: 76,
      },
      config: {
        disabledSections: [],
        sectionOverrides: {},
        customSections: [],
        disabledContexts: [],
        contextOverrides: {},
        customContexts: [],
        disabledImplicitInjectors: [],
        customPreStepInjections: [],
        disabledTools: [],
        toolDescriptionOverrides: {},
        customHeaders: [],
        conversationTracking: true,
        reasoningEffort: 'default',
        cacheRetention: 'default',
        temperature: null,
        maxTokens: null,
      },
      capturedRequests: [],
    }

    const gatewayInspectorSave = vi.fn<NonNullable<XPeachOps['gatewayInspectorSave']>>(
      async ({ config }) => ({ ...snap, config }),
    )

    render(
      <XPeachPromptInspectorPage
        gatewayInspectorSnapshot={vi.fn(async () => snap)}
        gatewayInspectorSave={gatewayInspectorSave}
        t={makeTranslator(zh)}
      />,
    )

    await screen.findByText('https://fast.xpeach.codes/v1/chat/completions')
    expect(screen.getByText('Authorization')).toBeTruthy()
    expect(screen.getByText(/You are an AI agent powered by XPeach Harness/)).toBeTruthy()

    // Switch to Implicit tab and toggle skill-catalog off
    fireEvent.click(screen.getByRole('button', { name: zh['prompts.tab.implicit'].replace('{n}', '2') }))
    await screen.findByText('<available_skills> 技能目录隐性注入')
    fireEvent.click(screen.getByRole('switch', { name: '<available_skills> 技能目录隐性注入' }))

    await waitFor(() => {
      expect(gatewayInspectorSave).toHaveBeenCalledTimes(1)
      expect(gatewayInspectorSave.mock.calls[0]?.[0]?.config.disabledImplicitInjectors).toContain('skill-catalog')
    })
  })
})
