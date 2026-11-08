/** The standalone SDK-minimal bundle's complete declared Cordis tree. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { entryListSchema } from '@xpeach/xph-cordis-plugin-include'

function packageName(specifier: string): string {
  return specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!
}

describe('dsh-sdk-minimal bundle', () => {
  it('declares one standalone allowlisted tree with every row dependency', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      dsh?: { bundle?: { patch?: string } }
    }
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    const patches = yaml.load(
      readFileSync(resolve(root, manifest.dsh!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    ) as Array<{ insert?: Array<{ id?: string; inject?: string[]; name?: string; config?: Record<string, unknown>; disabled?: unknown }> }>
    expect(patches).toHaveLength(1)
    const rows = patches[0]?.insert ?? []
    expect(rows.map(row => [row.id, row.name])).toEqual([
      ['sdk-app-startup', '@xpeach/xph-sdk-app'],
      ['sdk-jsonrpc-server', '@xpeach/xph-sdk-jsonrpc-server'],
      ['deepseek-llm-api-extensions', '@xpeach/xph-deepseek-llm-api-extensions'],
      ['session-log-deepseek', '@xpeach/xph-session-log-deepseek'],
      ['plugin-package-inventory-deepseek', '@xpeach/xph-plugin-package-inventory-deepseek'],
      ['llm-deepseek', '@xpeach/xph-llm-deepseek-api-key'],
      ['sandbox', '@xpeach/xph-sandbox-local'],
      ['filesystem', '@xpeach/xph-fs-local'],
      ['attachment-local', '@xpeach/xph-attachment-local'],
      ['tool-fs', '@xpeach/xph-tool-fs'],
      ['working-directory', '@xpeach/xph-working-directory'],
      ['tool-working-directory', '@xpeach/xph-tool-working-directory'],
      ['session-projection', '@xpeach/xph-session-projection'],
      ['token-meter', '@xpeach/xph-token-meter'],
      ['compaction-basic', '@xpeach/xph-compaction-basic'],
      ['image-offload', '@xpeach/xph-compaction-image-offload'],
      ['sandbox-policy', '@xpeach/xph-sandbox-policy'],
      ['subprocess', '@xpeach/xph-subprocess-local'],
      ['pty', '@xpeach/xph-terminal'],
      ['terminal-bash', '@xpeach/xph-terminal-bash'],
      ['terminal-pwsh', '@xpeach/xph-terminal-bash'],
      ['timer', '@xpeach/xph-cordis-plugin-timer'],
      ['llm', '@xpeach/xph-llm'],
      ['session', '@xpeach/xph-session'],
      ['session-title', '@xpeach/xph-session-title'],
      ['system-prompt', '@xpeach/xph-system-prompt'],
      ['tools', '@xpeach/xph-tools'],
      ['mcp-resources', '@xpeach/xph-mcp-resources'],
      ['agent', '@xpeach/xph-agent'],
      ['llm-retry', '@xpeach/xph-llm-retry'],
      ['jobs', '@xpeach/xph-jobs-local'],
      ['agent-loop', '@xpeach/xph-agent-loop'],
      ['persistent-bash', '@xpeach/xph-tool-bash-persistent'],
      ['persistent-pwsh', '@xpeach/xph-tool-pwsh-persistent'],
      ['sessions', '@xpeach/xph-session-persistence-jsonl'],
      ['session-checkpoint-policy', '@xpeach/xph-session-checkpoint-policy'],
    ])
    expect(rows.find(row => row.id === 'sdk-app-startup')?.config).toEqual({ profile: 'sdk-minimal' })
    expect(rows.find(row => row.id === 'sdk-jsonrpc-server')).toMatchObject({
      inject: ['sdkAppStartup', 'loader'],
      config: { maxTokensAsSuccess: false },
    })
    expect(rows.find(row => row.id === 'llm-deepseek')?.config).toEqual({
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      defaultContextWindow: { __jsExpr: 'Number(process.env.DSH_CONTEXT_WINDOW ?? 1000000)' },
      streamIdleTimeoutMs: 172800000,
    })
    expect(rows.find(row => row.id === 'system-prompt')?.config).toEqual({
      includeHarnessIdentity: false,
      includeRuntimeContext: false,
      personaPrefix: { __jsExpr: "process.env.DSH_SYSTEM_PROMPT ?? 'You are a helpful software engineer assistant.'" },
    })
    expect(rows.find(row => row.id === 'agent-loop')?.config).toEqual({ agents: [] })
    expect(rows.find(row => row.id === 'tool-fs')?.config).toEqual({ read: false, readImage: true, write: false, edit: false })
    expect(rows.find(row => row.id === 'compaction-basic')?.config).toBeUndefined()
    expect(rows.find(row => row.id === 'terminal-bash')).toMatchObject({
      disabled: { __jsExpr: "process.platform === 'win32'" },
    })
    expect(rows.find(row => row.id === 'terminal-pwsh')).toMatchObject({
      disabled: { __jsExpr: "process.platform !== 'win32'" },
      config: { shellDialect: 'pwsh', timeoutMs: 300000 },
    })
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(
      [...new Set(rows.map(row => row.name).filter((name): name is string => name !== undefined).map(packageName))].sort(),
    )
  })
})
