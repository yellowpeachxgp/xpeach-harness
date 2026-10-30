/**
 * Regression coverage for the fresh-install activation failure.
 *
 * A new install has no profile directory, and every state file the account
 * service owns lives inside it. A bare writeFileSync therefore threw ENOENT
 * from the constructor, so the plugin never activated and onboarding step 2
 * reported "active Service xpeachAccount is unavailable".
 */

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { chatgptDatabaseFiles } from '../src/chatgpt-db.ts'
import {
  importAssets,
  importConversations,
  normalizeSkillMarkdown,
  readMcpPatchEntries,
  repairSkillsDirectory,
  scanOnboarding,
  writeMcpPatchEntries,
} from '../src/onboarding.ts'
import {
  XPeachAccount,
  XPeachDeepSeekAccount,
  candidateSsoBaseURLs,
  validateSsoBaseUrl,
  validateVerificationUrl,
} from '../src/index.ts'

const roots: string[] = []

/** A profile directory that does not exist yet, as on a fresh install. */
function freshProfile(): string {
  const root = mkdtempSync(join(tmpdir(), 'xph-account-fresh-'))
  roots.push(root)
  return join(root, 'profiles', 'xpeach')
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

/** Reach the private writer without constructing the whole cordis service. */
function writeState(path: string, body: string): void {
  const writer = Reflect.get(XPeachAccount.prototype, 'writeState') as ((path: string, body: string) => void) | undefined
  if (typeof writer !== 'function') throw new Error('XPeachAccount.writeState is missing')
  writer.call({}, path, body)
}

describe('account state writes on a fresh install', () => {
  it('creates the profile directory instead of failing with ENOENT', () => {
    const profile = freshProfile()
    const marker = join(profile, 'xpeach.key.seeded')

    expect(() => { writeState(marker, '') }).not.toThrow()
    expect(readFileSync(marker, 'utf8')).toBe('')
  })

  it('creates nested directories for the admin and session files', () => {
    const profile = freshProfile()
    const nested = join(profile, 'state', 'xpeach.admin')

    writeState(nested, 'token\n')
    expect(readFileSync(nested, 'utf8')).toBe('token\n')
  })

  it('writes state files readable only by the owner', () => {
    const profile = freshProfile()
    const marker = join(profile, 'xpeach.key')

    writeState(marker, 'sk-test\n')
    expect(statSync(marker).mode & 0o777).toBe(0o600)
  })

  it('overwrites an existing file without disturbing its directory', () => {
    const profile = freshProfile()
    const marker = join(profile, 'xpeach.key')

    writeState(marker, 'first\n')
    writeState(marker, 'second\n')
    expect(readFileSync(marker, 'utf8')).toBe('second\n')
  })

  it('declares protocolPreference and enabledFamilies as volatile Config fields', () => {
    const dict = XPeachAccount.Config.dict as Record<string, { meta?: { volatile?: boolean } }>
    expect(dict['protocolPreference']?.meta?.volatile).toBe(true)
    expect(dict['enabledFamilies']?.meta?.volatile).toBe(true)
  })

  it('matches only dot-prefixed SQLite extensions across macOS, Linux, and Windows ChatGPT roots', () => {
    const home = mkdtempSync(join(tmpdir(), 'xph-chatgpt-home-'))
    roots.push(home)
    const linuxDir = join(home, '.config', 'ChatGPT')
    const winPkgDir = join(home, 'AppData', 'Local', 'Packages', 'OpenAI.ChatGPT-Desktop_abc', 'LocalCache', 'Roaming', 'ChatGPT')
    mkdirSync(linuxDir, { recursive: true })
    mkdirSync(winPkgDir, { recursive: true })
    writeFileSync(join(linuxDir, 'conversations.sqlite3'), '')
    writeFileSync(join(linuxDir, 'notadb'), '')
    writeFileSync(join(winPkgDir, 'store.db'), '')

    const found = chatgptDatabaseFiles(home)
    expect(found).toContain(join(linuxDir, 'conversations.sqlite3'))
    expect(found).toContain(join(winPkgDir, 'store.db'))
    expect(found).not.toContain(join(linuxDir, 'notadb'))
  })

  it('produces valid v4 zstd session logs with balanced step/start and step/end events for multi-assistant turns', () => {
    const fakeHome = mkdtempSync(join(tmpdir(), 'xph-onboard-home-'))
    roots.push(fakeHome)
    const prevHome = process.env.HOME
    process.env.HOME = fakeHome
    try {
      const zcodeDir = join(fakeHome, '.zcode', 'v2', 'sessions')
      mkdirSync(zcodeDir, { recursive: true })
      writeFileSync(join(zcodeDir, 'thread-1.json'), JSON.stringify({
        meta: { title: 'Test multi-assistant', workspacePath: 'relative/not-absolute', createdAt: 1700000000123.7 },
        messages: [
          { role: 'user', content: 'hello', timestamp: 1700000000123.7 },
          { role: 'assistant', content: 'first reply', timestamp: 1700000001500.9 },
          { role: 'assistant', content: 'second reply', timestamp: 1700000002800.2 },
        ],
      }))
      const destSessions = join(fakeHome, '.xph', 'sessions')
      const res = importConversations('zcode', destSessions)
      expect(res.imported).toBe(1)
      const projectDirs = readdirSync(destSessions)
      expect(projectDirs).toHaveLength(1)
      const sessionDirs = readdirSync(join(destSessions, projectDirs[0]!))
      expect(sessionDirs).toHaveLength(1)
      const archivePath = join(destSessions, projectDirs[0]!, sessionDirs[0]!, 'session.v4.jsonl.zstd')
      const decompressed = zstdDecompressSync(readFileSync(archivePath)).toString('utf8').trim().split('\n')
      const header = JSON.parse(decompressed[0]!) as { createdAt: number; cwd: string; version: number }
      expect(header.version).toBe(4)
      expect(Number.isSafeInteger(header.createdAt)).toBe(true)
      expect(header.cwd.startsWith('/')).toBe(true)
      const events = decompressed.slice(1).map(line => JSON.parse(line) as { type: string; time: number; data: Record<string, unknown> })
      let openSteps = 0
      for (const ev of events) {
        expect(Number.isSafeInteger(ev.time)).toBe(true)
        if (ev.type === 'step/start') {
          expect(openSteps).toBe(0)
          openSteps += 1
        } else if (ev.type === 'step/end') {
          expect(openSteps).toBe(1)
          openSteps -= 1
        }
      }
      expect(openSteps).toBe(0)
    } finally {
      if (prevHome === undefined) delete process.env.HOME
      else process.env.HOME = prevHome
    }
  })

  it('deduplicates imported prompts and replaces empty [] YAML array in cordis.patch.yml', () => {
    const fakeHome = mkdtempSync(join(tmpdir(), 'xph-assets-home-'))
    roots.push(fakeHome)
    const prevHome = process.env.HOME
    process.env.HOME = fakeHome
    try {
      mkdirSync(join(fakeHome, '.claude'), { recursive: true })
      writeFileSync(join(fakeHome, '.claude', 'CLAUDE.md'), 'Always run tests.\n')
      writeFileSync(join(fakeHome, '.claude.json'), JSON.stringify({
        mcpServers: {
          demo: { command: 'npx', args: ['-y', 'demo-mcp'] },
        },
      }))
      const xphHome = join(fakeHome, '.xph')
      mkdirSync(xphHome, { recursive: true })
      const patchFile = join(xphHome, 'cordis.patch.yml')
      writeFileSync(patchFile, '# comment\n[]\n')

      const first = importAssets({ mcp: true, skills: false, prompts: true }, xphHome, patchFile)
      expect(first.prompts).toBe(1)
      expect(first.mcp).toBe(1)
      const patchText = readFileSync(patchFile, 'utf8')
      expect(patchText).not.toContain('[]')
      expect(patchText).toContain("name: '@xpeach/xph-mcp-client'")

      const second = importAssets({ mcp: true, skills: false, prompts: true }, xphHome, patchFile)
      expect(second.prompts).toBe(0)
      expect(second.mcp).toBe(0)
    } finally {
      if (prevHome === undefined) delete process.env.HOME
      else process.env.HOME = prevHome
    }
  })

  it('cleans up session, slot, and token files on unbindKey and rolls back failed bindKey without deleting existing credentials', async () => {
    const profile = freshProfile()
    const keyFile = join(profile, 'xpeach.key')
    const adminKeyFile = join(profile, 'xpeach.admin')
    const sessionKeyFile = join(profile, 'xpeach.session')
    const slotsFile = join(profile, 'xpeach.keys')
    const tokenFile = join(profile, 'xpeach.token')
    writeState(keyFile, 'sk-existing1234\n')
    writeState(adminKeyFile, 'adm-existing1234\n')
    writeState(sessionKeyFile, 'sess-existing1234\n')
    writeState(slotsFile, JSON.stringify([{ name: 's1', key: 'sk-existing1234' }]))
    writeState(tokenFile, JSON.stringify({ id: 1, name: 'xph-1', groups: ['SWE'] }))

    const unset = vi.fn(async () => {})
    const set = vi.fn(async () => {})
    const emit = vi.fn()
    const fakeAccount = Object.create(XPeachAccount.prototype) as Record<string, unknown>
    fakeAccount['keyFile'] = keyFile
    fakeAccount['adminKeyFile'] = adminKeyFile
    fakeAccount['sessionKeyFile'] = sessionKeyFile
    fakeAccount['ssoStateFile'] = join(profile, 'xpeach.sso.json')
    fakeAccount['timeoutMs'] = 15_000
    fakeAccount['keyVar'] = 'XPEACH_TEST_RELAY_KEY'
    fakeAccount['adminKeyVar'] = 'XPEACH_TEST_ADMIN_KEY'
    fakeAccount['sessionKeyVar'] = 'XPEACH_TEST_SESSION_KEY'
    fakeAccount['apiKeyEnv'] = 'XPEACH_API_KEY'
    fakeAccount['ctx'] = {
      get: (name: string) => (name === 'credentials' ? { set, unset } : undefined),
      emit,
    }
    fakeAccount['api'] = {
      setAdminKey: vi.fn(),
      setSessionKey: vi.fn(),
      ssoRevokeToken: vi.fn().mockResolvedValue(true),
      adminSelf: vi.fn(async () => { throw new Error('unauthorized') }),
    }

    const bindKey = Reflect.get(XPeachAccount.prototype, 'bindKey') as (req: { key: string }, sig: AbortSignal) => Promise<unknown>
    await expect(bindKey.call(fakeAccount, { key: 'adm-invalid9999' }, new AbortController().signal)).rejects.toThrow('unauthorized')
    expect(readFileSync(keyFile, 'utf8')).toBe('sk-existing1234\n')
    expect(readFileSync(adminKeyFile, 'utf8')).toBe('adm-existing1234\n')
    expect(existsSync(slotsFile)).toBe(true)

    const unbindKey = Reflect.get(XPeachAccount.prototype, 'unbindKey')
    const res = await unbindKey.call(fakeAccount, {}, new AbortController().signal)
    expect(res.bound).toBe(false)
    expect(existsSync(keyFile)).toBe(false)
    expect(existsSync(adminKeyFile)).toBe(false)
    expect(existsSync(sessionKeyFile)).toBe(false)
    expect(existsSync(slotsFile)).toBe(false)
    expect(existsSync(tokenFile)).toBe(false)
    expect(unset).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('credentials/reference-updated', 'XPEACH_API_KEY')
  })

  it('scans and imports Gemini CLI and Antigravity conversations, TOML MCP sub-tables, and nested skills', () => {
    const fakeHome = mkdtempSync(join(tmpdir(), 'xph-gemini-ag-home-'))
    roots.push(fakeHome)
    const prevHome = process.env.HOME
    process.env.HOME = fakeHome
    try {
      // Gemini CLI session
      const geminiChats = join(fakeHome, '.gemini', 'tmp', 'proj1', 'chats')
      mkdirSync(geminiChats, { recursive: true })
      writeFileSync(join(geminiChats, 'session-1.json'), JSON.stringify({
        sessionId: 'gem-1',
        startTime: '2026-10-20T10:00:00Z',
        messages: [
          { type: 'user', content: [{ text: 'Explain Gemini CLI import' }] },
          { type: 'gemini', content: 'Gemini CLI threads are imported into XPeach.' },
        ],
      }))

      // Antigravity transcript + pbtxt annotation
      const convId = '11111111-2222-3333-4444-555555555555'
      const agLogs = join(fakeHome, '.gemini', 'antigravity', 'brain', convId, '.system_generated', 'logs')
      const agAnnot = join(fakeHome, '.gemini', 'antigravity', 'annotations')
      const workspaceDir = join(fakeHome, 'workspace-ag')
      mkdirSync(agLogs, { recursive: true })
      mkdirSync(agAnnot, { recursive: true })
      mkdirSync(workspaceDir, { recursive: true })
      writeFileSync(join(agAnnot, `${convId}.pbtxt`), 'title: "Antigravity Annotated Title"\n')
      writeFileSync(join(agLogs, 'transcript.jsonl'), [
        JSON.stringify({
          type: 'USER_INPUT',
          created_at: '2026-10-21T12:00:00Z',
          content: '<USER_REQUEST>\nFix the onboarding importer\n</USER_REQUEST>',
        }),
        JSON.stringify({
          type: 'PLANNER_RESPONSE',
          created_at: '2026-10-21T12:00:05Z',
          content: 'I will update onboarding.ts now.',
          tool_calls: [{ name: 'run_command', args: { Cwd: workspaceDir } }],
        }),
      ].join('\n') + '\n')

      // Subagent-only transcript without USER_INPUT should be ignored
      const subLogs = join(fakeHome, '.gemini', 'antigravity', 'brain', 'sub-only', '.system_generated', 'logs')
      mkdirSync(subLogs, { recursive: true })
      writeFileSync(join(subLogs, 'transcript.jsonl'), JSON.stringify({ type: 'PLANNER_RESPONSE', content: 'sub' }) + '\n')

      // Codex TOML with [mcp_servers.foo.env] sub-table + Gemini MCP with serverUrl
      mkdirSync(join(fakeHome, '.codex'), { recursive: true })
      writeFileSync(join(fakeHome, '.codex', 'config.toml'), [
        '[mcp_servers.memory]',
        'command = "npx"',
        'args = ["-y", "@modelcontextprotocol/server-memory"]',
        '[mcp_servers.memory.env]',
        'MEMORY_Token = "secret-123"',
      ].join('\n') + '\n')
      writeFileSync(join(fakeHome, '.gemini', 'settings.json'), JSON.stringify({
        mcpServers: {
          remoteDocs: { serverUrl: 'https://mcp.example.com/sse' },
        },
      }))

      // Nested .system skill and uppercase skill
      const sysSkillDir = join(fakeHome, '.codex', 'skills', '.system', 'skill-creator')
      const agSkillDir = join(fakeHome, '.gemini', 'antigravity', 'builtin', 'skills', 'generative_ui')
      mkdirSync(sysSkillDir, { recursive: true })
      mkdirSync(agSkillDir, { recursive: true })
      writeFileSync(join(sysSkillDir, 'SKILL.md'), '---\nname: "Skill:Creator"\ndescription: >-\n  Creates new skills\n  automatically.\n---\n# Creator\n')
      writeFileSync(join(agSkillDir, 'SKILL.md'), '---\nname: generative_ui\ndescription: Rich widgets\n---\n# UI\n')

      const scan = scanOnboarding()
      const gemSource = scan.sources.find(s => s.id === 'gemini')
      const agSource = scan.sources.find(s => s.id === 'antigravity')
      expect(gemSource?.found).toBe(true)
      expect(gemSource?.threads).toBe(1)
      expect(agSource?.found).toBe(true)
      expect(agSource?.threads).toBe(1)

      // TOML sub-table did not create a bogus 'memory.env' server
      expect(scan.mcp.map(m => m.name)).toContain('memory')
      expect(scan.mcp.map(m => m.name)).toContain('remoteDocs')
      expect(scan.mcp.map(m => m.name)).not.toContain('memory.env')
      const memMcp = scan.mcp.find(m => m.name === 'memory')
      expect((memMcp?.config['env'] as Record<string, string>)?.['MEMORY_Token']).toBe('secret-123')

      expect(scan.skills.map(s => s.name)).toContain('skill-creator')
      expect(scan.skills.map(s => s.name)).toContain('generative_ui')

      const destSessions = join(fakeHome, '.xph', 'sessions')
      const gemRes = importConversations('gemini', destSessions)
      const agRes = importConversations('antigravity', destSessions)
      expect(gemRes.imported).toBe(1)
      expect(agRes.imported).toBe(1)
    } finally {
      if (prevHome === undefined) delete process.env.HOME
      else process.env.HOME = prevHome
    }
  })

  it('normalizes invalid skill frontmatter and supports full Skills, Rules, and MCP CRUD operations', () => {
    const root = mkdtempSync(join(tmpdir(), 'xph-crud-home-'))
    roots.push(root)
    const prevXphHome = process.env.XPH_HOME
    process.env.XPH_HOME = root
    try {
      const profileDir = join(root, 'profiles', 'xpeach')
      const skillsDir = join(root, 'skills')
      mkdirSync(join(skillsDir, 'Excel'), { recursive: true })
      writeFileSync(join(skillsDir, 'Excel', 'SKILL.md'), '---\nname: "Excel"\ndescription: Spreadsheet helper\n---\nUse formulas.\n')
      mkdirSync(join(skillsDir, 'browser-use'), { recursive: true })
      writeFileSync(join(skillsDir, 'browser-use', 'SKILL.md'), '# Browser Use\nAutomate web pages.\n')

      const repaired = repairSkillsDirectory(skillsDir)
      expect(repaired).toBe(2)
      const excelNorm = normalizeSkillMarkdown(readFileSync(join(skillsDir, 'Excel', 'SKILL.md'), 'utf8'), 'Excel')
      expect(excelNorm.valid).toBe(true)
      expect(excelNorm.name).toBe('excel')

      const emit = vi.fn()
      const fakeAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
      Object.assign(fakeAccount, {
        keyFile: join(profileDir, 'xpeach.key'),
        ctx: {
          get: (name: string) => {
            if (name === 'tools') {
              return {
                schemas: () => [
                  { name: 'mcp__memory__create_entities', description: 'Create entities' },
                  { name: 'mcp__memory__read_graph', description: 'Read graph' },
                ],
              }
            }
            return undefined
          },
          emit,
        },
      })

      const sig = new AbortController().signal
      const initialSkills = fakeAccount.skillsListOp({}, sig)
      expect(initialSkills.skills.map(s => s.name)).toEqual(['browser-use', 'excel'])
      expect(initialSkills.skills.every(s => s.enabled && s.valid)).toBe(true)

      // Toggle skill off and back on
      const afterDisable = fakeAccount.skillToggleOp({ dirName: 'Excel', name: 'excel', enabled: false }, sig)
      expect(afterDisable.skills.find(s => s.dirName === 'Excel')?.enabled).toBe(false)
      expect(existsSync(join(skillsDir, 'Excel', 'SKILL.md.disabled'))).toBe(true)

      const afterEnable = fakeAccount.skillToggleOp({ dirName: 'Excel', name: 'excel', enabled: true }, sig)
      expect(afterEnable.skills.find(s => s.dirName === 'Excel')?.enabled).toBe(true)
      expect(existsSync(join(skillsDir, 'Excel', 'SKILL.md'))).toBe(true)

      // Save new skill and global rules
      const afterSave = fakeAccount.skillSaveOp({
        name: 'My Custom_Skill',
        description: 'Custom skill description',
        content: 'Step 1: Run check.',
      }, sig)
      expect(afterSave.skills.some(s => s.name === 'my-custom-skill')).toBe(true)

      const afterRules = fakeAccount.rulesSaveOp({ content: '# Global Rules\nAlways test.' }, sig)
      expect(afterRules.rulesContent).toBe('# Global Rules\nAlways test.\n')

      // Delete skill
      const afterDelete = fakeAccount.skillDeleteOp({ dirName: 'my-custom-skill' }, sig)
      expect(afterDelete.skills.some(s => s.name === 'my-custom-skill')).toBe(false)

      // MCP deduplication and CRUD
      const patchPath = join(profileDir, 'cordis.patch.yml')
      mkdirSync(profileDir, { recursive: true })
      writeFileSync(patchPath, [
        '- insert:',
        '    - id: xpeach-account',
        "      name: '@xpeach/xph-account'",
        '- insert:',
        '    - id: mcp-memory',
        "      name: '@xpeach/xph-mcp-client'",
        '      config:',
        '        transport: stdio',
        '        serverName: "memory"',
        '        command: "npx"',
        '        args: ["-y", "@modelcontextprotocol/server-memory"]',
        '- insert:',
        '    - id: mcp-memory',
        "      name: '@xpeach/xph-mcp-client'",
        '      config:',
        '        transport: stdio',
        '        serverName: "memory"',
        '        command: "npx"',
      ].join('\n') + '\n')

      const mcpSnap = fakeAccount.mcpListOp({}, sig)
      expect(mcpSnap.servers).toHaveLength(1)
      expect(mcpSnap.servers[0]?.serverName).toBe('memory')
      expect(mcpSnap.servers[0]?.status).toBe('active')
      expect(mcpSnap.servers[0]?.toolCount).toBe(2)

      // Non-MCP entries in cordis.patch.yml are preserved after deduplication
      expect(readFileSync(patchPath, 'utf8')).toContain("name: '@xpeach/xph-account'")

      const afterMcpSave = fakeAccount.mcpSaveOp({
        serverName: 'github',
        transportType: 'streamable-http',
        url: 'https://api.githubcopilot.com/mcp/',
        headers: { Authorization: 'Bearer ghp_test' },
      }, sig)
      expect(afterMcpSave.servers).toHaveLength(2)

      const afterMcpToggle = fakeAccount.mcpToggleOp({ id: 'mcp-github', enabled: false }, sig)
      expect(afterMcpToggle.servers.find(s => s.id === 'mcp-github')?.disabled).toBe(true)
      expect(afterMcpToggle.servers.find(s => s.id === 'mcp-github')?.status).toBe('disabled')

      const afterMcpDelete = fakeAccount.mcpDeleteOp({ id: 'mcp-github' }, sig)
      expect(afterMcpDelete.servers).toHaveLength(1)
      expect(readMcpPatchEntries(patchPath)).toHaveLength(1)
      writeMcpPatchEntries(patchPath, [])
      expect(readFileSync(patchPath, 'utf8')).toContain("name: '@xpeach/xph-account'")
    } finally {
      if (prevXphHome === undefined) delete process.env.XPH_HOME
      else process.env.XPH_HOME = prevXphHome
    }
  })

  it('reconciles candidate home sessions, projection cache, and workspace attachments in chronological order', async () => {
    const ownHome = mkdtempSync(join(tmpdir(), 'xph-reconcile-own-'))
    const candHome = mkdtempSync(join(tmpdir(), 'xph-reconcile-cand-'))
    roots.push(ownHome, candHome)
    const prevXphHome = process.env.XPH_HOME
    process.env.XPH_HOME = ownHome
    try {
      const candSessDir = join(candHome, 'sessions', '--proj--', 'session-cand-1')
      mkdirSync(candSessDir, { recursive: true })
      writeFileSync(join(candSessDir, 'session.v4.jsonl.zstd'), 'dummy')

      const candSkillDir = join(candHome, 'skills', 'PowerPoint')
      mkdirSync(candSkillDir, { recursive: true })
      writeFileSync(join(candSkillDir, 'SKILL.md'), '---\nname: PowerPoint\ndescription: Slides\n---\nBody\n')

      const cwdA = join(ownHome, 'proj-a')
      const cwdB = join(ownHome, 'proj-b')
      const coldCalls: string[] = []
      const attachedOrder: { cwd: string; sessionId: string }[] = []
      const wsMap = new Map<string, { id: string; rootPath: string; sessionIds: string[]; attachSession: (sid: string) => void }>()

      const fakeAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
      Object.assign(fakeAccount, {
        candidateHomes: [candHome],
        keyFile: join(ownHome, 'profiles', 'xpeach', 'xpeach.key'),
        ctx: {
          emit: vi.fn(),
          get: (name: string) => {
            if (name === 'sessionPersistence') {
              return {
                list: async () => [
                  { header: { id: 'session-a2', createdAt: 2000, cwd: cwdA } },
                  { header: { id: 'session-a1', createdAt: 1000, cwd: cwdA } },
                  { header: { id: 'session-b1', createdAt: 3000, cwd: cwdB } },
                ],
                open: async (id: string) => ({
                  inheritedEventCount: 0,
                  read: async () => ({ header: { id, createdAt: 1000, cwd: cwdA }, events: [{ type: 'turn/start' }] }),
                  close: async () => {},
                }),
              }
            }
            if (name === 'sessionProjectionCache') {
              return {
                cachedSnapshot: (header: { id: string }) => (header.id === 'session-a2' ? { ok: true } : undefined),
                coldSnapshot: (header: { id: string }) => {
                  coldCalls.push(header.id)
                  return { ok: true }
                },
              }
            }
            if (name === 'workspaceRegistry') {
              return {
                list: () => [...wsMap.values()],
                create: async (rootPath: string) => {
                  let ws = wsMap.get(rootPath)
                  if (ws === undefined) {
                    ws = {
                      id: `ws-${wsMap.size + 1}`,
                      rootPath,
                      sessionIds: [],
                      attachSession: (sid: string) => {
                        ws!.sessionIds.unshift(sid)
                        attachedOrder.push({ cwd: rootPath, sessionId: sid })
                      },
                    }
                    wsMap.set(rootPath, ws)
                  }
                  return ws
                },
              }
            }
            return undefined
          },
        },
      })

      await fakeAccount.reconcileSessionsAndWorkspaces()

      // Copied candidate session and repaired candidate skill
      expect(existsSync(join(ownHome, 'sessions', '--proj--', 'session-cand-1', 'session.v4.jsonl.zstd'))).toBe(true)
      expect(readFileSync(join(ownHome, 'skills', 'PowerPoint', 'SKILL.md'), 'utf8')).toContain('name: powerpoint')

      // Projection cache warmed only for uncached sessions
      expect(coldCalls).toEqual(['session-a1', 'session-b1'])

      // Attached in ascending createdAt order within each workspace and ascending max createdAt across workspaces
      expect(attachedOrder).toEqual([
        { cwd: cwdA, sessionId: 'session-a1' },
        { cwd: cwdA, sessionId: 'session-a2' },
        { cwd: cwdB, sessionId: 'session-b1' },
      ])
    } finally {
      if (prevXphHome === undefined) delete process.env.XPH_HOME
      else process.env.XPH_HOME = prevXphHome
    }
  })

  it('starts an SSO Device Authorization flow, polls pending -> approved, and binds bridged PeachCode credentials', async () => {
    const profile = freshProfile()
    const keyFile = join(profile, 'xpeach.key')
    const adminKeyFile = join(profile, 'xpeach.admin')
    const sessionKeyFile = join(profile, 'xpeach.session')
    const ssoStateFile = join(profile, 'xpeach.sso.json')

    const authorizeMock = vi.fn().mockResolvedValue({
      deviceCode: 'dvc_test_123456',
      userCode: 'XPH8-9K2M',
      verificationUri: 'https://sso.xpeach.codes/device',
      verificationUriComplete: 'https://sso.xpeach.codes/device?code=XPH8-9K2M',
      expiresIn: 600,
      interval: 2,
    })
    const tokenMock = vi.fn()
      .mockResolvedValueOnce({ status: 'pending' as const })
      .mockResolvedValueOnce({
        status: 'approved' as const,
        payload: {
          sso: {
            accessToken: 'xph_at_sso_token_abc',
            expiresIn: 2592000,
            user: {
              id: 'eb21-ac28-c74a-6e28',
              username: 'yellowpeach',
              email: 'admin@xpeach.codes',
              name: 'YellowPeach',
            },
          },
          peachcode: {
            baseUrl: 'https://fast.xpeach.codes',
            userId: 1,
            username: 'yellowpeach',
            group: 'svip',
            quota: 500000000,
            usedQuota: 1000,
            accessToken: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
            apiKey: 'sk-xph9A8b7C6d5E4f3G2h1I0j9K8l7M6n5O4p3Q2r1S0t9U8v7',
            tokenId: 42,
            tokenName: 'xph-sso-default',
          },
        },
      })

    const fakeAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(fakeAccount, {
      liveConfig: {
        ssoBaseURL: 'https://sso.xpeach.codes',
        ssoClientId: 'xpeach-harness',
      },
      keyFile,
      keyVar: 'XPEACH_TEST_RELAY_KEY',
      adminKeyFile,
      adminKeyVar: 'XPEACH_TEST_ADMIN_KEY',
      sessionKeyFile,
      sessionKeyVar: 'XPEACH_TEST_SESSION_KEY',
      ssoStateFile,
      apiKeyEnv: 'XPEACH_API_KEY',
      timeoutMs: 15_000,
      api: {
        ssoDeviceAuthorize: authorizeMock,
        ssoDeviceToken: tokenMock,
        ssoRevokeToken: vi.fn().mockResolvedValue(true),
        setAdminKey: vi.fn(),
        setSessionKey: vi.fn(),
        models: vi.fn().mockResolvedValue([]),
      },
      ctx: {
        emit: vi.fn(),
        get: () => undefined,
      },
    })

    const signal = new AbortController().signal
    const started = await fakeAccount.ssoDeviceStartOp({ openBrowser: false, clientName: 'UnitTest' }, signal)
    expect(started.deviceCode).toBe('dvc_test_123456')
    expect(started.userCode).toBe('XPH8-9K2M')
    expect(started.browserOpened).toBe(false)

    const firstPoll = await fakeAccount.ssoDevicePollOp({ deviceCode: started.deviceCode }, signal)
    expect(firstPoll.status).toBe('pending')

    const secondPoll = await fakeAccount.ssoDevicePollOp({ deviceCode: started.deviceCode }, signal)
    expect(secondPoll.status).toBe('approved')
    expect(secondPoll.bound).toBe(true)
    expect(secondPoll.username).toBe('yellowpeach')
    expect(secondPoll.preview).toBe('sk-xp…U8v7')
    expect(secondPoll.adminPreview).toBe('a1b2…c5d6')

    expect(readFileSync(keyFile, 'utf8').trim()).toBe('sk-xph9A8b7C6d5E4f3G2h1I0j9K8l7M6n5O4p3Q2r1S0t9U8v7')
    expect(readFileSync(adminKeyFile, 'utf8').trim()).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')
    expect(existsSync(ssoStateFile)).toBe(true)

    await fakeAccount.unbindKey({}, signal)
    expect(existsSync(keyFile)).toBe(false)
    expect(existsSync(adminKeyFile)).toBe(false)
    expect(existsSync(ssoStateFile)).toBe(false)
  })

  it('enforces strict SSO origin and verification URL security invariants (F-01, F-02, F-03)', async () => {
    expect(validateSsoBaseUrl('https://sso.xpeach.codes/')).toBe('https://sso.xpeach.codes')
    expect(validateSsoBaseUrl('http://localhost:3000/device')).toBe('http://localhost:3000')
    expect(validateSsoBaseUrl('http://127.0.0.1:3000')).toBe('http://127.0.0.1:3000')

    // F-01: candidateSsoBaseURLs never downgrades production HTTPS to plaintext localhost
    expect(candidateSsoBaseURLs('https://sso.xpeach.codes')).toEqual(['https://sso.xpeach.codes'])
    expect(candidateSsoBaseURLs('https://sso.xpeach.codes')).not.toContain('http://localhost:3000')

    expect(() => validateSsoBaseUrl('http://sso.xpeach.codes')).toThrow()
    expect(() => validateSsoBaseUrl('http://evil.example.com:3000')).toThrow()
    expect(() => validateSsoBaseUrl('https://user:pass@sso.xpeach.codes')).toThrow()
    expect(() => validateSsoBaseUrl('javascript:alert(1)')).toThrow()
    expect(() => validateSsoBaseUrl('file:///etc/passwd')).toThrow()

    expect(
      validateVerificationUrl('/device?code=ABCD-EFGH', 'https://sso.xpeach.codes'),
    ).toBe('https://sso.xpeach.codes/device?code=ABCD-EFGH')
    expect(
      validateVerificationUrl('http://localhost:3000/device?code=ABCD-EFGH', 'http://localhost:3000'),
    ).toBe('http://localhost:3000/device?code=ABCD-EFGH')

    // F-02: Cross-origin verification URLs (including HTTPS attacker origins) must be rejected
    expect(() => validateVerificationUrl('https://evil.example/device', 'https://sso.xpeach.codes')).toThrow(/origin mismatch/i)
    expect(() => validateVerificationUrl('http://localhost:3000/device', 'https://sso.xpeach.codes')).toThrow(/origin mismatch/i)
    expect(() => validateVerificationUrl('javascript:alert(1)', 'https://sso.xpeach.codes')).toThrow()
    expect(() => validateVerificationUrl('http://attacker.com/device', 'https://sso.xpeach.codes')).toThrow()
    expect(() => validateVerificationUrl('https://admin:secret@sso.xpeach.codes/device', 'https://sso.xpeach.codes')).toThrow()
    expect(() => validateVerificationUrl('https://sso.xpeach.codes/device?code=AB CD', 'https://sso.xpeach.codes')).toThrow()

    // F-03: openUrlInSystemBrowser rejects cross-origin or control-character URLs
    const openUrl = Reflect.get(XPeachAccount.prototype, 'openUrlInSystemBrowser') as (
      rawUrl: string,
      expectedSsoBaseURL?: string,
    ) => Promise<boolean>
    const fakeAccount = { currentSsoBaseURL: () => 'https://sso.xpeach.codes' }
    await expect(openUrl.call(fakeAccount, 'https://evil.example/device', 'https://sso.xpeach.codes')).rejects.toThrow(/origin mismatch/i)
    await expect(openUrl.call(fakeAccount, 'https://sso.xpeach.codes/device?code=A\u0000B', 'https://sso.xpeach.codes')).rejects.toThrow()
  })

  it('complies with the full DeepSeekAccount contract in XPeachDeepSeekAccount (F-04)', async () => {
    let bound = false
    const deviceStartMock = vi.fn().mockResolvedValue({
      deviceCode: 'dvc_contract_1',
      userCode: 'ABCD-1234',
      verificationUri: 'https://sso.xpeach.codes/device',
      verificationUriComplete: 'https://sso.xpeach.codes/device?code=ABCD-1234',
      expiresIn: 600,
      interval: 60,
      browserOpened: false,
    })
    const devicePollMock = vi.fn().mockResolvedValue({ status: 'pending' as const })
    const logoutMock = vi.fn(async () => {
      bound = false
      return { bound: false }
    })

    const fakeAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(fakeAccount, {
      isBound: () => bound,
      currentSiteRoot: () => 'https://xpeach.codes',
      ssoDeviceStartOp: deviceStartMock,
      ssoDevicePollOp: devicePollMock,
      ssoLogoutOp: logoutMock,
      getProfile: vi.fn().mockResolvedValue({
        id: 'usr_101',
        name: 'YellowPeach',
        contact: 'admin@xpeach.codes',
      }),
      getBalance: vi.fn().mockResolvedValue({
        available: true as const,
        totalBalance: '42.50',
        toppedUpBalance: '42.50',
        grantedBalance: '0.00',
        currency: 'USD' as const,
      }),
      currentPlatformSession: () => (bound
        ? {
          status: 'signed-in' as const,
          bearerToken: 'xph_at_session_token',
          userId: 'usr_101',
          expiresAt: Date.now() + 3600_000,
        }
        : { status: 'signed-out' as const }),
      resolveVerifiedRelayKey: vi.fn().mockResolvedValue('sk-xphVerifiedRelayKey'),
    })

    const bridge = Object.create(XPeachDeepSeekAccount.prototype) as XPeachDeepSeekAccount
    Object.assign(bridge, {
      account: fakeAccount,
      attempt: null,
      attemptAbort: undefined,
      watchers: new Set<(identityChanged: boolean) => void>(),
    })

    // Initial state: signed-out with explicit attempt: null
    const initialState = await bridge.getState()
    expect(initialState).toEqual({
      status: 'signed-out',
      links: {
        usageUrl: 'https://xpeach.codes/console',
        topUpUrl: 'https://xpeach.codes/topup',
      },
      attempt: null,
    })
    expect('attempt' in initialState).toBe(true)

    // Unbound profile, balance, and platform session return null
    expect(await bridge.getProfile()).toBeNull()
    expect(await bridge.getBalance()).toBeNull()
    expect(await bridge.getPlatformSession()).toBeNull()

    // getDeviceIdentity returns a Promise with osVersion
    const identityUnbound = await bridge.getDeviceIdentity()
    expect(identityUnbound.deviceId).toBe('xpeach-harness')
    expect(typeof identityUnbound.osVersion).toBe('string')

    // watch() yields initial AccountView immediately and yields subsequent transitions
    const watchAbort = new AbortController()
    const stream = bridge.watch(watchAbort.signal, true)
    const firstYield = await stream.next()
    expect(firstYield.done).toBe(false)
    expect(firstYield.value).toEqual(initialState)

    // Start sign-in with AccountClientMetadata object (verifies no client.trim crash and status is never 'signing-in')
    const startedState = await bridge.startSignIn(
      { version: '0.0.18', locale: 'zh-CN', timezoneOffsetSeconds: 28800 },
      'http://127.0.0.1:4321',
      'desktop',
    )
    expect(startedState.status).toBe('signed-out')
    expect(startedState.attempt).not.toBeNull()
    expect(startedState.attempt?.phase).toBe('waiting-browser')
    expect(startedState.attempt?.authorizeUrl).toBe('https://sso.xpeach.codes/device?code=ABCD-1234')
    expect(typeof startedState.attempt?.expiresAt).toBe('number')

    const secondYield = await stream.next()
    expect(secondYield.done).toBe(false)
    expect(secondYield.value?.status).toBe('signed-out')
    expect(secondYield.value?.attempt?.phase).toBe('waiting-browser')

    // Cancel sign-in transitions attempt phase to 'cancelled'
    const cancelledState = await bridge.cancelSignIn(startedState.attempt?.id)
    expect(cancelledState.attempt?.phase).toBe('cancelled')

    // Simulate bound state
    bound = true
    bridge.notifyWatchers(true)
    const thirdYield = await stream.next()
    expect(thirdYield.value?.status).toBe('credential-stored')

    const profileOutcome = await bridge.getProfile()
    expect(profileOutcome).toEqual({
      status: 'ready',
      value: {
        id: 'usr_101',
        name: 'YellowPeach',
        contact: 'admin@xpeach.codes',
        avatarUrl: null,
      },
    })

    const balanceOutcome = await bridge.getBalance()
    expect(balanceOutcome).toEqual({
      status: 'ready',
      value: [{ currency: 'USD', balance: '42.50' }],
      bonusWallets: [],
    })

    const platformSession = await bridge.getPlatformSession()
    expect(platformSession).toEqual({
      origin: 'https://xpeach.codes',
      token: 'xph_at_session_token',
      userId: 'usr_101',
    })

    const identityBound = await bridge.getDeviceIdentity()
    expect(identityBound.userId).toBe('usr_101')
    expect(await bridge.resolveToken('https://fast.xpeach.codes')).toBe('sk-xphVerifiedRelayKey')

    watchAbort.abort()
    const finalYield = await stream.next()
    expect(finalYield.done).toBe(true)
  })

  it('rejects locally expired SSO sessions when upstream refresh fails transiently instead of failing open (F-09)', async () => {
    const profile = freshProfile()
    const keyFile = join(profile, 'xpeach.key')
    const adminKeyFile = join(profile, 'xpeach.admin')
    const sessionKeyFile = join(profile, 'xpeach.session')
    const ssoStateFile = join(profile, 'xpeach.sso.json')

    writeState(keyFile, 'sk-expiredtest1234567890\n')
    writeState(adminKeyFile, 'admin-expiredtest123456\n')
    writeState(ssoStateFile, JSON.stringify({
      accessToken: 'xph_at_expired_token',
      expiresIn: 60,
      boundAt: new Date(Date.now() - 120_000).toISOString(),
      user: { id: 'usr_exp', username: 'expireduser', email: 'exp@xpeach.codes' },
    }))

    const fakeAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(fakeAccount, {
      liveConfig: {
        ssoBaseURL: 'https://sso.xpeach.codes',
        ssoClientId: 'xpeach-harness',
      },
      keyFile,
      keyVar: 'XPEACH_TEST_EXP_RELAY_KEY',
      adminKeyFile,
      adminKeyVar: 'XPEACH_TEST_EXP_ADMIN_KEY',
      sessionKeyFile,
      sessionKeyVar: 'XPEACH_TEST_EXP_SESSION_KEY',
      ssoStateFile,
      apiKeyEnv: 'XPEACH_API_KEY',
      timeoutMs: 15_000,
      lastSsoVerifyAt: Date.now(),
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        ssoPeachcodeCredentials: vi.fn().mockResolvedValue({
          status: 'transient_error',
          transient: true,
          message: 'fetch failed: ECONNREFUSED',
        }),
        ssoRevokeToken: vi.fn().mockResolvedValue(false),
        setAdminKey: vi.fn(),
        setSessionKey: vi.fn(),
      },
      ctx: {
        emit: vi.fn(),
        get: () => undefined,
      },
    })

    const verifyResult = await fakeAccount.verifyAndSyncSsoSession(false)
    expect(verifyResult.valid).toBe(false)
    expect(verifyResult.revoked).toBe(true)
    expect(verifyResult.error).toBe('SSO session expired')
    expect(existsSync(keyFile)).toBe(false)
    expect(existsSync(adminKeyFile)).toBe(false)
    expect(existsSync(ssoStateFile)).toBe(false)
  })

  it('dynamically revokes all local credentials, cancels tasks, and blocks LLM streams when SSO reports a ban (403) or revocation (401)', async () => {
    const profile = freshProfile()
    const keyFile = join(profile, 'xpeach.key')
    const adminKeyFile = join(profile, 'xpeach.admin')
    const sessionKeyFile = join(profile, 'xpeach.session')
    const ssoStateFile = join(profile, 'xpeach.sso.json')

    const ssoBridgeSyncMock = vi.fn()
    const ssoRevokeMock = vi.fn().mockResolvedValue(true)
    const cancelTaskMock = vi.fn()
    const emitMock = vi.fn()
    const settingsUpdateMock = vi.fn().mockResolvedValue(undefined)

    const fakeAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(fakeAccount, {
      liveConfig: {
        ssoBaseURL: 'https://sso.xpeach.codes',
        ssoClientId: 'xpeach-harness',
      },
      keyFile,
      keyVar: 'XPEACH_TEST_BAN_RELAY_KEY',
      adminKeyFile,
      adminKeyVar: 'XPEACH_TEST_BAN_ADMIN_KEY',
      sessionKeyFile,
      sessionKeyVar: 'XPEACH_TEST_BAN_SESSION_KEY',
      ssoStateFile,
      apiKeyEnv: 'XPEACH_API_KEY',
      timeoutMs: 15_000,
      lastSsoVerifyAt: 0,
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        ssoPeachcodeCredentials: ssoBridgeSyncMock,
        ssoRevokeToken: ssoRevokeMock,
        setAdminKey: vi.fn(),
        setSessionKey: vi.fn(),
        models: vi.fn().mockResolvedValue([]),
      },
      ctx: {
        emit: emitMock,
        get: (name: string) => {
          if (name === 'agents') {
            return {
              list: () => [{
                status: 'running',
                session: { requestContext: () => ({ provider: 'xpeach' }) },
                cancel: cancelTaskMock,
              }],
            }
          }
          if (name === 'settings') {
            return {
              describe: () => Promise.resolve({
                namespaces: [{
                  ns: 'llm-pi-ai',
                  value: {
                    providers: {
                      xpeach: { models: [{ id: 'swe-2-max' }] },
                    },
                  },
                }],
              }),
              update: settingsUpdateMock,
            }
          }
          return undefined
        },
      },
    })

    // Seed bound state via applySsoBridgePayload
    const applyBridge = Reflect.get(XPeachAccount.prototype, 'applySsoBridgePayload') as (
      payload: unknown,
      signal: AbortSignal,
    ) => Promise<unknown>
    await applyBridge.call(
      fakeAccount,
      {
        sso: {
          accessToken: 'xph_at_active_session_token',
          expiresIn: 2592000,
          user: { id: 'usr_ban_test', username: 'banneduser', email: 'ban@xpeach.codes' },
        },
        peachcode: {
          userId: 99,
          username: 'banneduser',
          group: 'SWE',
          accessToken: 'admin_token_9999888877776666',
          apiKey: 'sk-xphBanTestKey1234567890abcdef1234567890abcdef',
          tokenId: 12,
          tokenName: 'xph-sso-default',
        },
      },
      new AbortController().signal,
    )

    expect(fakeAccount.isBound()).toBe(true)
    expect(existsSync(keyFile)).toBe(true)
    expect(existsSync(adminKeyFile)).toBe(true)
    expect(existsSync(ssoStateFile)).toBe(true)

    // Verify 0600 file permissions on POSIX
    if (process.platform !== 'win32') {
      expect(statSync(keyFile).mode & 0o777).toBe(0o600)
      expect(statSync(adminKeyFile).mode & 0o777).toBe(0o600)
      expect(statSync(ssoStateFile).mode & 0o777).toBe(0o600)
    }

    // Simulate real-time user ban on SSO / PeachCode (HTTP 403 access_denied)
    ssoBridgeSyncMock.mockResolvedValueOnce({
      status: 'revoked',
      code: 403,
      message: 'PeachCode account is disabled',
    })

    const verifyResult = await fakeAccount.verifyAndSyncSsoSession(true)
    expect(verifyResult.valid).toBe(false)
    expect(verifyResult.status).toBe('revoked')

    // All local credential files and env vars must be wiped immediately
    expect(fakeAccount.isBound()).toBe(false)
    expect(existsSync(keyFile)).toBe(false)
    expect(existsSync(adminKeyFile)).toBe(false)
    expect(existsSync(ssoStateFile)).toBe(false)
    expect(process.env.XPEACH_TEST_BAN_RELAY_KEY).toBeUndefined()
    expect(process.env.XPEACH_TEST_BAN_ADMIN_KEY).toBeUndefined()

    // Running agent task must be cancelled and session-expired + signed-out events emitted
    expect(cancelTaskMock).toHaveBeenCalledWith(
      { kind: 'hook', reason: 'deepseek-account/signed-out' },
      { keepInbox: true },
    )
    expect(settingsUpdateMock).toHaveBeenCalledWith('llm-pi-ai', {
      providers: {
        xpeach: { models: [] },
      },
    })
    expect(emitMock).toHaveBeenCalledWith('deepseek-account/session-expired')
    expect(emitMock).toHaveBeenCalledWith('deepseek-account/signed-out')

    // Pre-inference llm/stream waterfall guard must block xpeach* calls when unbound/revoked
    const guardLlmStream = Reflect.get(XPeachAccount.prototype, 'guardLlmStream') as (
      options: { readonly provider?: string },
      next: () => AsyncGenerator<Record<string, unknown>, void, unknown>,
    ) => AsyncGenerator<Record<string, unknown>, void, unknown>
    const nextSpy = vi.fn()
    const chunks: Record<string, unknown>[] = []
    for await (const chunk of guardLlmStream.call(fakeAccount, { provider: 'xpeach' }, nextSpy)) {
      chunks.push(chunk)
    }
    expect(nextSpy).not.toHaveBeenCalled()
    expect(chunks).toHaveLength(1)
    expect(chunks[0]?.['type']).toBe('finish')
    expect((chunks[0]?.['error'] as { code?: string } | undefined)?.code).toBe('ACCOUNT_SIGN_IN_REQUIRED')
  })

  it('persists credentials and onboarding state across restarts and sibling profiles until explicit sign-out', async () => {
    const rootHome = freshProfile()
    const cliProfile = join(rootHome, 'profiles', 'xpeach')
    const desktopProfile = join(rootHome, 'profiles', 'xpeach-desktop')
    const prevHome = process.env.XPH_HOME
    process.env.XPH_HOME = rootHome

    try {
      const settingsUpdateMock = vi.fn().mockResolvedValue(undefined)
      const cliAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
      Object.assign(cliAccount, {
        liveConfig: {
          ssoBaseURL: 'https://sso.xpeach.codes',
          ssoClientId: 'xpeach-harness',
        },
        keyFile: join(cliProfile, 'xpeach.key'),
        keyVar: 'XPEACH_TEST_PERSIST_RELAY_KEY',
        adminKeyFile: join(cliProfile, 'xpeach.admin'),
        adminKeyVar: 'XPEACH_TEST_PERSIST_ADMIN_KEY',
        sessionKeyFile: join(cliProfile, 'xpeach.session'),
        sessionKeyVar: 'XPEACH_TEST_PERSIST_SESSION_KEY',
        ssoStateFile: join(cliProfile, 'xpeach.sso.json'),
        routeFile: join(cliProfile, 'xpeach.route.json'),
        apiKeyEnv: 'XPEACH_API_KEY',
        timeoutMs: 15_000,
        lastSsoVerifyAt: 0,
        api: {
          siteBaseURL: 'https://fast.xpeach.codes',
          models: vi.fn().mockResolvedValue([]),
          ssoRevokeToken: vi.fn().mockResolvedValue(true),
          setAdminKey: vi.fn(),
          setSessionKey: vi.fn(),
        },
        ctx: {
          emit: vi.fn(),
          get: (name: string) => {
            if (name === 'settings') {
              return {
                describe: () => Promise.resolve({
                  namespaces: [{
                    ns: 'ui-settings-account',
                    value: { version: 1, step: 'welcome', completion: null },
                  }],
                }),
                update: settingsUpdateMock,
              }
            }
            return undefined
          },
        },
      })

      const applyBridge = Reflect.get(XPeachAccount.prototype, 'applySsoBridgePayload') as (
        payload: unknown,
        signal: AbortSignal,
      ) => Promise<unknown>
      await applyBridge.call(
        cliAccount,
        {
          sso: {
            accessToken: 'xph_at_persistent_session',
            expiresIn: 2592000,
            user: { id: 'usr_persist', username: 'persistuser', email: 'persist@xpeach.codes' },
          },
          peachcode: {
            userId: 77,
            username: 'persistuser',
            group: 'SWE',
            accessToken: 'admin_persist_token_1234567890',
            apiKey: 'sk-xphPersistKey1234567890abcdef1234567890abcdef',
            tokenId: 5,
            tokenName: 'xph-sso-default',
          },
        },
        new AbortController().signal,
      )

      // Wait a tick for async ensureDesktopOnboardingCompleted
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(settingsUpdateMock).toHaveBeenCalledWith('ui-settings-account', {
        version: 1,
        step: 'done',
        completion: 'completed',
      })
      expect(cliAccount.onboardingDoneOp({}, new AbortController().signal)).toEqual({ done: true })

      // Simulate cold start in sibling desktop profile (xpeach-desktop)
      const desktopAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
      Object.assign(desktopAccount, {
        liveConfig: {
          ssoBaseURL: 'https://sso.xpeach.codes',
          ssoClientId: 'xpeach-harness',
        },
        keyFile: join(desktopProfile, 'xpeach.key'),
        keyVar: 'XPEACH_TEST_PERSIST_RELAY_KEY',
        adminKeyFile: join(desktopProfile, 'xpeach.admin'),
        adminKeyVar: 'XPEACH_TEST_PERSIST_ADMIN_KEY',
        sessionKeyFile: join(desktopProfile, 'xpeach.session'),
        sessionKeyVar: 'XPEACH_TEST_PERSIST_SESSION_KEY',
        ssoStateFile: join(desktopProfile, 'xpeach.sso.json'),
        routeFile: join(desktopProfile, 'xpeach.route.json'),
        apiKeyEnv: 'XPEACH_API_KEY',
        timeoutMs: 15_000,
        lastSsoVerifyAt: 0,
        api: {
          siteBaseURL: 'https://fast.xpeach.codes',
          setAdminKey: vi.fn(),
          setSessionKey: vi.fn(),
        },
        ctx: {
          emit: vi.fn(),
          get: () => undefined,
        },
      })

      const bootstrapKey = Reflect.get(XPeachAccount.prototype, 'bootstrapKey') as () => void
      bootstrapKey.call(desktopAccount)

      expect(desktopAccount.isBound()).toBe(true)
      expect(existsSync(join(desktopProfile, 'xpeach.key'))).toBe(true)
      expect(existsSync(join(desktopProfile, 'xpeach.admin'))).toBe(true)
      expect(existsSync(join(desktopProfile, 'xpeach.sso.json'))).toBe(true)
      expect(desktopAccount.onboardingDoneOp({}, new AbortController().signal)).toEqual({ done: true })

      // Explicit sign-out must wipe both profiles + shared root and record .xpeach-signed-out
      await cliAccount.unbindKey({}, new AbortController().signal)
      expect(cliAccount.isBound()).toBe(false)
      expect(existsSync(join(cliProfile, 'xpeach.key'))).toBe(false)
      expect(existsSync(join(desktopProfile, 'xpeach.key'))).toBe(false)
      expect(existsSync(join(rootHome, 'xpeach.key'))).toBe(false)
      expect(existsSync(join(rootHome, '.xpeach-signed-out'))).toBe(true)

      // Subsequent cold start must stay signed out and not resurrect credentials
      bootstrapKey.call(desktopAccount)
      expect(desktopAccount.isBound()).toBe(false)
    } finally {
      if (prevHome === undefined) {
        Reflect.deleteProperty(process.env, 'XPH_HOME')
      } else {
        process.env.XPH_HOME = prevHome
      }
      Reflect.deleteProperty(process.env, 'XPEACH_TEST_PERSIST_RELAY_KEY')
      Reflect.deleteProperty(process.env, 'XPEACH_TEST_PERSIST_ADMIN_KEY')
      Reflect.deleteProperty(process.env, 'XPEACH_TEST_PERSIST_SESSION_KEY')
    }
  })

  it('does not wipe existing credentials when probing a rejected candidate key in keySlotAddOp', async () => {
    const profile = freshProfile()
    const keyFile = join(profile, 'xpeach.key')
    const adminKeyFile = join(profile, 'xpeach.admin')
    const sessionKeyFile = join(profile, 'xpeach.session')
    const ssoStateFile = join(profile, 'xpeach.sso.json')
    const routeFile = join(profile, 'xpeach.route.json')

    writeState(keyFile, 'sk-existingValidKey1234567890\n')
    writeState(adminKeyFile, 'admin-existingValidToken1234\n')

    const fakeAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
    const handleAuthRejected = Reflect.get(XPeachAccount.prototype, 'handleAuthRejected') as (status: 401 | 403) => Promise<void>
    Object.assign(fakeAccount, {
      liveConfig: {},
      keyFile,
      keyVar: 'XPEACH_TEST_SLOT_RELAY_KEY',
      adminKeyFile,
      adminKeyVar: 'XPEACH_TEST_SLOT_ADMIN_KEY',
      sessionKeyFile,
      sessionKeyVar: 'XPEACH_TEST_SLOT_SESSION_KEY',
      ssoStateFile,
      routeFile,
      apiKeyEnv: 'XPEACH_API_KEY',
      timeoutMs: 15_000,
      probingSlotKey: false,
      api: {
        tokenUsage: vi.fn(async () => {
          await handleAuthRejected.call(fakeAccount, 401)
          throw new Error('401 Unauthorized')
        }),
        setAdminKey: vi.fn(),
        setSessionKey: vi.fn(),
      },
      ctx: {
        emit: vi.fn(),
        get: () => undefined,
      },
    })

    const res = await fakeAccount.keySlotAddOp(
      { name: 'bad-slot', key: 'sk-invalidCandidateKey000000' },
      new AbortController().signal,
    )
    expect(res.ok).toBe(false)
    expect(existsSync(keyFile)).toBe(true)
    expect(existsSync(adminKeyFile)).toBe(true)
    expect(fakeAccount.isBound()).toBe(true)
    Reflect.deleteProperty(process.env, 'XPEACH_TEST_SLOT_RELAY_KEY')
  })
})
