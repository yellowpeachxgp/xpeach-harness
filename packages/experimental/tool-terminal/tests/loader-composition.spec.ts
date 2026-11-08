import { executeToolFixture } from '@xpeach/xph-tool-testkit'
import * as NativeToolExecutor from '@xpeach/xph-tool-executor-native'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { provideWorkingDirectoryFixture, unsupportedInbox } from '@xpeach/xph-agent-loop-testkit'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@xpeach/xph-cordis'
import Loader from '@xpeach/xph-cordis-plugin-loader'
import Include from '@xpeach/xph-cordis-plugin-include'
import { ToolCallId } from '@xpeach/xph-llm'
import { Session, SessionId } from '@xpeach/xph-session'
import AgentRegistry from '@xpeach/xph-agent'
import type { Agent } from '@xpeach/xph-agent'
import SystemPrompt from '@xpeach/xph-system-prompt'
import ToolRuntime from '@xpeach/xph-tools'
import TerminalSessionService from '@xpeach/xph-terminal'
import SandboxProvider from '@xpeach/xph-sandbox'
import type { ConfinedArgv, SandboxPolicy } from '@xpeach/xph-sandbox'
import SandboxPolicyService from '@xpeach/xph-sandbox-policy'
import SessionProjectionRegistry from '@xpeach/xph-session-projection'
import LocalSubprocessRuntime from '@xpeach/xph-subprocess-local'
import * as TerminalLocal from '@xpeach/xph-terminal-bash'
import * as ToolPty from '@xpeach/xph-tool-terminal'

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

class PassthroughSandbox extends SandboxProvider {
  async confine(argv: readonly string[], _policy: SandboxPolicy): Promise<ConfinedArgv> {
    return { argv: [...argv], enforcement: 'full', denialSignatures: [], runnerFailureRules: [] }
  }
}

async function agent(ctx: Context): Promise<Agent> {
  const scope = ctx.plugin(() => {})
  const id = SessionId('pty-loader-agent')
  const session = Session.create(id)
  const value: Agent = {
    id, options: {}, session, inbox: unsupportedInbox(),
    status: 'idle',
    ctx: scope.ctx,
    send: () => {},
    followup: () => {}, steer: () => {}, inject: () => {}, cancel() {},
    runMaintenance: job => job(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  await ctx.agents.register(value)
  return value
}

function resultText(result: { content: { type: string; text?: string }[] }): string {
  return result.content.filter(block => block.type === 'text').map(block => block.text).join('')
}

const suite = process.platform === 'linux' || process.platform === 'darwin' ? describe : describe.skip

suite('terminal real Loader composition through cordis.yml', () => {
  it('boots cordis.yml and preserves shell state across real tool calls', async () => {
    root = await mkdtemp(join(tmpdir(), 'dsh-pty-loader-'))
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      "- name: '@xpeach/xph-agent'",
      "- name: '@xpeach/xph-system-prompt'",
      "- name: '@xpeach/xph-tools'",
      "- name: '@xpeach/xph-tool-executor-native'",
      "- name: '@xpeach/xph-terminal'",
      "- name: '@xpeach/xph-test-sandbox'",
      "- name: '@xpeach/xph-session-projection'",
      "- name: '@xpeach/xph-sandbox-policy'",
      '  config:',
      '    mode: danger-full-access',
      `    workspaceRoot: ${JSON.stringify(root)}`,
      "- name: '@xpeach/xph-subprocess-local'",
      "- name: '@xpeach/xph-terminal-bash'",
      '  config:',
      '    pollIntervalMs: 10',
      '    exactProbeAfterMs: 20',
      '    idleSilenceMs: 250',
      '    handoffGraceMs: 250',
      '    timeoutMs: 2000',
      '    disposeGraceMs: 500',
      "- name: '@xpeach/xph-tool-terminal'",
      '',
    ].join('\n'))

    context = new Context()

    provideWorkingDirectoryFixture(context)
    context.baseUrl = pathToFileURL(root).href + '/'
    await context.plugin(Loader)
    context.loader.builtins.include = Include
    const modules = new Map<string, unknown>([
      ['@xpeach/xph-agent', AgentRegistry],
      ['@xpeach/xph-system-prompt', SystemPrompt],
      ['@xpeach/xph-tools', ToolRuntime],
      ['@xpeach/xph-tool-executor-native', NativeToolExecutor],
      ['@xpeach/xph-terminal', TerminalSessionService],
      ['@xpeach/xph-test-sandbox', PassthroughSandbox],
      ['@xpeach/xph-session-projection', SessionProjectionRegistry],
      ['@xpeach/xph-sandbox-policy', SandboxPolicyService],
      ['@xpeach/xph-subprocess-local', LocalSubprocessRuntime],
      ['@xpeach/xph-terminal-bash', TerminalLocal],
      ['@xpeach/xph-tool-terminal', ToolPty],
    ])
    context.loader.internal = {
      version: 'v2',
      async import(specifier: string) {
        if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
        return modules.get(specifier)
      },
    } as unknown as NonNullable<typeof context.loader.internal>
    await context.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
    await context.loader.await()

    const owner = await agent(context)
    const signal = new AbortController().signal
    const spawn = await executeToolFixture(context, {
      signal, callId: ToolCallId('spawn'), name: 'terminal_open', arguments: { type: 'shell', name: 'main', cwd: root }, agent: owner,
    })
    expect(resultText(spawn)).toContain('started terminal session pty-1 (main)')

    await executeToolFixture(context, {
      signal, callId: ToolCallId('state'), name: 'terminal_send', arguments: { sessionId: 'pty-1', text: 'export KEEP=loader; cd /' }, agent: owner,
    })
    const read = await executeToolFixture(context, {
      signal, callId: ToolCallId('read'), name: 'terminal_send', arguments: { sessionId: 'pty-1', text: 'printf "cwd=%s keep=%s\\n" "$PWD" "$KEEP"' }, agent: owner,
    })
    expect(resultText(read)).toContain('cwd=/ keep=loader')
    expect(context.terminals.list(owner)).toHaveLength(1)
  }, 15_000)
})
