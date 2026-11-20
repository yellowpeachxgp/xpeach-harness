/** Unit tests for XPeachGatewayInspectorController and wire request builders. */
import { describe, expect, it } from 'vitest'
import { Context } from '@xpeach/xph-cordis'
import {
  buildGatewayHeaders,
  buildUpstreamRequestBodyJson,
  DEFAULT_PROMPT_OVERRIDES,
  estimateTokens,
  maskGatewayKey,
  normalizePromptOverridesConfig,
  resolveGatewayEndpointUrl,
  XPeachGatewayInspectorController,
} from '../src/gateway-inspector.ts'

describe('XPeach Gateway & Prompt Inspector engine', () => {
  it('resolves exact upstream URLs and headers across OpenAI Chat, OpenAI Responses, and Anthropic Messages', () => {
    expect(resolveGatewayEndpointUrl('https://fast.xpeach.codes/v1', 'openai-completions')).toBe(
      'https://fast.xpeach.codes/v1/chat/completions',
    )
    expect(resolveGatewayEndpointUrl('https://fast.xpeach.codes/v1/', 'openai-responses')).toBe(
      'https://fast.xpeach.codes/v1/responses',
    )
    expect(resolveGatewayEndpointUrl('https://fast.xpeach.codes/v1', 'anthropic-messages')).toBe(
      'https://fast.xpeach.codes/v1/messages?beta=true',
    )

    const masked = maskGatewayKey('sk-1234567890abcdef')
    expect(masked).toBe('sk-123••••••••cdef')

    const anthropicHeaders = buildGatewayHeaders({
      protocol: 'anthropic-messages',
      maskedKey: masked,
      sessionId: 'sess_42',
      config: {
        ...DEFAULT_PROMPT_OVERRIDES,
        customHeaders: [{ key: 'X-Trace-Env', value: 'staging', enabled: true }],
      },
    })
    expect(anthropicHeaders.some(h => h.name === 'x-api-key' && h.value === masked)).toBe(true)
    expect(anthropicHeaders.some(h => h.name === 'anthropic-version' && h.value === '2023-06-01')).toBe(true)
    expect(anthropicHeaders.some(h => h.name === 'X-Trace-Env' && h.value === 'staging')).toBe(true)
    expect(anthropicHeaders.some(h => h.name === 'X-Session-ID' && h.enabled)).toBe(true)
  })

  it('builds complete upstream JSON bodies and enforces prompt, implicit, and tool overrides', async () => {
    const ctx = new Context()
    let currentConfig = normalizePromptOverridesConfig({
      disabledSections: ['tool:bash'],
      sectionOverrides: { 'harness:identity': 'Custom XPeach Agent Identity.' },
      customSections: [
        { id: 'cs-1', name: 'custom:style', order: 10150, text: 'Always respond in concise Markdown.', enabled: true },
      ],
      disabledImplicitInjectors: ['time-context'],
      customPreStepInjections: [
        { id: 'ci-1', label: 'Guardrail', placement: 'after-user', text: '<system-reminder>Verify types.</system-reminder>', enabled: true },
      ],
      disabledTools: ['write'],
      toolDescriptionOverrides: { read: 'Read file contents safely.' },
      customHeaders: [{ key: 'X-Custom', value: '1', enabled: true }],
      conversationTracking: true,
      reasoningEffort: 'medium',
      cacheRetention: 'short',
      temperature: null,
      maxTokens: 16384,
    })

    const fakeSystemPrompt = {
      assemble: async () => ({
        sections: [
          { name: 'harness:identity', text: 'Default Identity' },
          { name: 'tool:bash', text: 'Bash instructions' },
        ],
        contexts: [
          { name: 'working-directory', text: 'Current working directory: /repo' },
          { name: 'sandbox:policy', text: 'workspace-write' },
        ],
        tools: [
          { name: 'read', description: 'Original read', parameters: { type: 'object', properties: {} } },
          { name: 'write', description: 'Original write', parameters: { type: 'object', properties: {} } },
        ],
        variables: { model: 'swe-2-max', provider: 'xpeach' },
      }),
    }
    ;(ctx.provide as (name: string) => void)('systemPrompt')
    Object.assign(ctx, { systemPrompt: fakeSystemPrompt })

    const controller = new XPeachGatewayInspectorController({
      ctx,
      readConfig: () => currentConfig,
      getActiveBaseUrl: () => 'https://fast.xpeach.codes/v1',
      readBoundKey: () => 'sk-abcdef1234567890',
      listSkillsSnapshot: () => ({
        skills: [
          {
            id: 'user:audit',
            name: 'audit',
            dirName: 'audit',
            description: 'Run security audit',
            path: '/tmp/skills/audit/SKILL.md',
            source: 'user',
            enabled: true,
            valid: true,
            content: 'Audit steps',
          },
        ],
        rulesPath: '/tmp/AGENTS.md',
        rulesContent: '# Team Rule\nRun tests.',
      }),
    })

    const snap = await controller.buildSnapshot({ protocol: 'openai-completions', model: 'swe-2-max' }, new AbortController().signal)
    expect(snap.endpointUrl).toBe('https://fast.xpeach.codes/v1/chat/completions')
    expect(snap.renderedSystemPrompt).toContain('Custom XPeach Agent Identity.')
    expect(snap.renderedSystemPrompt).toContain('Always respond in concise Markdown.')
    expect(snap.renderedSystemPrompt).not.toContain('Bash instructions')

    const parsedBody = JSON.parse(snap.requestBodyJson) as {
      model: string
      reasoning_effort: string
      max_completion_tokens: number
      tools: { function: { name: string; description: string } }[]
      messages: { role: string; content: string }[]
    }
    expect(parsedBody.model).toBe('swe-2-max')
    expect(parsedBody.reasoning_effort).toBe('medium')
    expect(parsedBody.max_completion_tokens).toBe(16384)
    expect(parsedBody.tools).toHaveLength(1)
    expect(parsedBody.tools[0]?.function.name).toBe('read')
    expect(parsedBody.tools[0]?.function.description).toBe('Read file contents safely.')
    expect(parsedBody.messages.some(m => m.content.includes('<available_skills>'))).toBe(true)
    expect(parsedBody.messages.some(m => m.content.includes('<system-reminder>Verify types.</system-reminder>'))).toBe(true)
    expect(estimateTokens(snap.requestBodyJson)).toBeGreaterThan(20)

    const anthropicJson = buildUpstreamRequestBodyJson({
      protocol: 'anthropic-messages',
      model: 'claude-sonnet-4-5',
      systemPrompt: snap.renderedSystemPrompt,
      messages: [{ role: 'user', content: 'Hello' }],
      tools: [{ name: 'read', description: 'Read file', parameters: { type: 'object', properties: {} } }],
      sessionId: 'sess_1',
      config: currentConfig,
    })
    expect(anthropicJson).toContain('"thinking"')
    expect(anthropicJson).toContain('"input_schema"')

    currentConfig = DEFAULT_PROMPT_OVERRIDES
    expect(currentConfig.conversationTracking).toBe(true)
  })
})
