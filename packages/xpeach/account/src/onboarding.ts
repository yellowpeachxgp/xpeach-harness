/**
 * First-run onboarding: silently detect local conversation stores and agent
 * assets, then import the ones the user picks. Conversation threads from
 * Claude Code / Codex / zcode are decoded into native XPeach session logs
 * (v4 JSONL, concatenated zstd frames: one header frame + one event frame).
 */
import { cpSync, type Dirent, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { constants, zstdCompressSync, zstdDecompressSync } from 'node:zlib'
import type { JsonValue } from '@xpeach/xph-util-values'
import { chatgptDatabaseFiles, decodeChatgptDatabase } from './chatgpt-db.ts'

import type {
  XPeachAssetImportResult, XPeachConversationImportResult, XPeachDetectedMcp, XPeachDetectedPrompt,
  XPeachDetectedSkill, XPeachDetectedSource, XPeachOnboardingScan, XPeachSourceId,
} from './types.ts'

/** One decoded conversation thread (internal to the importer). */
interface ImportedThread {
  readonly title: string
  readonly cwd?: string
  readonly createdAt: number
  readonly messages: readonly { readonly role: 'user' | 'assistant'; readonly text: string; readonly time: number }[]
}

/** The OS user home. */
const home = (): string => homedir()

/** Normalize a timestamp to a non-negative safe integer in milliseconds. */
function sanitizeTimestamp(raw: number): number {
  const floored = Math.floor(raw)
  return Number.isSafeInteger(floored) && floored >= 0 ? floored : Date.now()
}

/** Directory that holds one product's session logs. */
const paths = (): Record<XPeachSourceId, string> => ({
  deepseek: join(home(), '.dsh', 'sessions'),
  claude: join(home(), '.claude', 'projects'),
  codex: join(home(), '.codex', 'sessions'),
  zcode: join(home(), '.zcode', 'v2', 'sessions'),
  chatgpt: join(home(), 'Library', 'Application Support', 'ChatGPT'),
  gemini: existsSync(join(home(), '.gemini', 'tmp')) ? join(home(), '.gemini', 'tmp') : join(home(), '.gemini'),
  antigravity: join(home(), '.gemini', 'antigravity', 'brain'),
})

/** Count matching files under a root (bounded walk). */
function countFiles(root: string, match: (name: string) => boolean, maxDepth = 5): number {
  if (!existsSync(root)) return 0
  let count = 0
  const walk = (dir: string, depth: number): void => {
    if (depth > maxDepth) return
    let entries: Dirent[]
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch (_err) { return }
    for (const entry of entries) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path, depth + 1)
      else if (match(entry.name)) count += 1
    }
  }
  walk(root, 0)
  return count
}

/** Read a file if it exists, else undefined. */
function readText(path: string): string | undefined {
  try { return readFileSync(path, 'utf8') } catch (_err) { return undefined }
}

/** Parse JSON if it exists and is an object. */
function readJson(path: string): Record<string, unknown> | undefined {
  const text = readText(path)
  if (text === undefined) return undefined
  let value: unknown = null
  try { value = JSON.parse(text) } catch (_err) { return undefined }
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

/**
 * Convert an arbitrary skill or directory name into a valid lowercase kebab-case identifier.
 * @param raw - raw skill or directory name.
 * @returns valid kebab-case skill name (max 64 characters).
 */
export function sanitizeSkillName(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '')
  return cleaned.length > 0 ? cleaned : 'skill'
}

/**
 * Sanitize an MCP server name to satisfy `[A-Za-z0-9_-]{1,32}`.
 * @param raw - raw server name.
 * @returns valid MCP serverName.
 */
export function sanitizeMcpServerName(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32)
  return cleaned.length > 0 ? cleaned : 'mcp'
}

/**
 * Sanitize an MCP plugin entry id.
 * @param rawName - raw server name or id.
 * @returns normalized `mcp-<slug>` identifier.
 */
export function sanitizeMcpId(rawName: string): string {
  const trimmed = rawName.trim()
  const withoutPrefix = trimmed.replace(/^mcp[-_]+/i, '')
  const slug = (withoutPrefix.length > 0 ? withoutPrefix : trimmed)
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'server'
  return `mcp-${slug}`
}

/** Unquote a YAML scalar value. */
function unquoteYamlScalar(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.length >= 2 && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
    if (trimmed.startsWith('"')) {
      try {
        const parsed: unknown = JSON.parse(trimmed)
        if (typeof parsed === 'string') return parsed
      } catch (_err) { /* fallback below */ }
      return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    }
    return trimmed.slice(1, -1).replace(/''/g, "'")
  }
  return trimmed
}

/**
 * Parse and normalize a `SKILL.md` document so its YAML frontmatter satisfies `skill-filesystem`.
 * @param raw - raw markdown contents of `SKILL.md`.
 * @param fallbackName - directory name used when frontmatter omits `name`.
 * @returns normalized metadata, markdown body, reconstructed `SKILL.md` content, and whether the input was already valid.
 */
export function normalizeSkillMarkdown(
  raw: string,
  fallbackName: string,
): {
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly body: string
  readonly content: string
  readonly valid: boolean
} {
  let hasFrontmatter = false
  let body = raw.trim()
  let parsedName: string | undefined
  let parsedDesc: string | undefined
  let parsedWhenToUse: string | undefined
  const extraFrontmatterLines: string[] = []

  const firstNewline = raw.indexOf('\n')
  if (firstNewline >= 0 && raw.slice(0, firstNewline).replace(/\r$/, '') === '---') {
    const rest = raw.slice(firstNewline + 1)
    const closeMatch = /(?:^|\r?\n)---(?:\r?\n|$)/.exec(rest)
    if (closeMatch !== null) {
      hasFrontmatter = true
      const yamlBlock = rest.slice(0, closeMatch.index)
      body = rest.slice(closeMatch.index + closeMatch[0].length).trim()
      const lines = yamlBlock.split(/\r?\n/)
      let i = 0
      while (i < lines.length) {
        const line = lines[i] ?? ''
        const keyMatch = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
        if (keyMatch === null) {
          i += 1
          continue
        }
        const key = keyMatch[1] ?? ''
        const firstVal = (keyMatch[2] ?? '').trim()
        const isBlockScalar = /^[>|][-+]?$/.test(firstVal)
        const contLines: string[] = []
        i += 1
        while (i < lines.length) {
          const nextLine = lines[i] ?? ''
          if (/^\s{2,}\S/.test(nextLine) || (isBlockScalar && nextLine.trim().length === 0)) {
            contLines.push(nextLine.trim())
            i += 1
          } else {
            break
          }
        }
        const combined = isBlockScalar
          ? contLines.filter(l => l.length > 0).join(' ')
          : contLines.length > 0
            ? [unquoteYamlScalar(firstVal), ...contLines.map(unquoteYamlScalar)].filter(l => l.length > 0).join(' ')
            : unquoteYamlScalar(firstVal)
        if (key === 'name') {
          parsedName = combined
        } else if (key === 'description') {
          parsedDesc = combined
        } else if (key === 'whenToUse' || key === 'when_to_use') {
          parsedWhenToUse = combined
        } else if (key === 'disable-model-invocation' || key === 'user-invocable') {
          extraFrontmatterLines.push(`${key}: ${firstVal}`)
        }
      }
    }
  }

  const isRawNameValid = typeof parsedName === 'string'
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsedName)
    && parsedName.length <= 64
  const isRawDescValid = typeof parsedDesc === 'string' && parsedDesc.trim().length > 0
  const valid = hasFrontmatter && isRawNameValid && isRawDescValid

  const name = isRawNameValid && parsedName !== undefined
    ? parsedName
    : sanitizeSkillName(parsedName !== undefined && parsedName.trim().length > 0 ? parsedName : fallbackName)

  let description = (parsedDesc ?? '').trim()
  if (description.length === 0) {
    const firstMeaningful = body
      .split(/\r?\n/)
      .map(l => l.replace(/^#+\s*/, '').trim())
      .find(l => l.length > 0 && !l.startsWith('```') && !l.startsWith('<!--'))
    description = firstMeaningful !== undefined && firstMeaningful.length > 0
      ? firstMeaningful.slice(0, 200)
      : `Skill ${name}`
  }

  const whenToUse = parsedWhenToUse !== undefined && parsedWhenToUse.trim().length > 0
    ? parsedWhenToUse.trim()
    : undefined

  const headerLines = [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
    ...(whenToUse !== undefined ? [`whenToUse: ${JSON.stringify(whenToUse)}`] : []),
    ...extraFrontmatterLines,
    '---',
  ]
  const content = body.length > 0
    ? `${headerLines.join('\n')}\n\n${body}\n`
    : `${headerLines.join('\n')}\n`

  return {
    name,
    description,
    ...(whenToUse !== undefined ? { whenToUse } : {}),
    body,
    content,
    valid,
  }
}

/**
 * Normalize raw `SKILL.md` text so its frontmatter has a valid kebab-case `name` and non-empty `description`.
 * @param raw - raw `SKILL.md` contents.
 * @param fallbackDirName - fallback directory name when `name` is absent.
 * @returns normalized `SKILL.md` string.
 */
export function normalizeSkillFrontmatter(raw: string, fallbackDirName: string): string {
  return normalizeSkillMarkdown(raw, fallbackDirName).content
}

/**
 * Repair any `SKILL.md` or `SKILL.md.disabled` files with invalid frontmatter inside a skills root directory.
 * @param skillsRoot - directory containing skill subdirectories.
 * @returns number of skill files repaired on disk.
 */
export function repairSkillsDirectory(skillsRoot: string): number {
  if (!existsSync(skillsRoot)) return 0
  let repaired = 0
  let entries: Dirent[]
  try { entries = readdirSync(skillsRoot, { withFileTypes: true }) } catch (_err) { return 0 }
  for (const entry of entries) {
    const dirPath = join(skillsRoot, entry.name)
    let isDir = entry.isDirectory()
    if (!isDir && entry.isSymbolicLink()) {
      try { isDir = statSync(dirPath).isDirectory() } catch (_err) { isDir = false }
    }
    if (!isDir) continue
    for (const fileName of ['SKILL.md', 'SKILL.md.disabled'] as const) {
      const filePath = join(dirPath, fileName)
      const raw = readText(filePath)
      if (raw === undefined) continue
      const norm = normalizeSkillMarkdown(raw, entry.name)
      if (!norm.valid) {
        try {
          writeFileSync(filePath, norm.content, 'utf8')
          repaired += 1
        } catch (_err) { /* ignore read-only */ }
      }
    }
  }
  return repaired
}

/** MCP servers declared by the local agents. */
function scanMcp(): XPeachDetectedMcp[] {
  const byName = new Map<string, XPeachDetectedMcp>()
  const upsert = (source: string, rawName: string, rawConfig: Record<string, unknown>): void => {
    const serverName = sanitizeMcpServerName(rawName)
    const key = serverName.toLowerCase()
    const normalized: Record<string, JsonValue> = {}
    for (const [k, v] of Object.entries(rawConfig)) {
      if (v !== undefined) normalized[k] = v as JsonValue
    }
    const urlCandidate = typeof rawConfig['url'] === 'string' && rawConfig['url'].trim().length > 0
      ? rawConfig['url'].trim()
      : typeof rawConfig['serverUrl'] === 'string' && rawConfig['serverUrl'].trim().length > 0
        ? rawConfig['serverUrl'].trim()
        : typeof rawConfig['httpUrl'] === 'string' && rawConfig['httpUrl'].trim().length > 0
          ? rawConfig['httpUrl'].trim()
          : undefined
    if (urlCandidate !== undefined) normalized['url'] = urlCandidate
    const commandCandidate = typeof rawConfig['command'] === 'string' && rawConfig['command'].trim().length > 0
      ? rawConfig['command'].trim()
      : undefined
    if (commandCandidate !== undefined) normalized['command'] = commandCandidate
    if (commandCandidate === undefined && urlCandidate === undefined) return

    const existing = byName.get(key)
    if (existing === undefined) {
      byName.set(key, { source, name: serverName, config: normalized })
      return
    }
    const mergedConfig: Record<string, JsonValue> = { ...existing.config }
    if (mergedConfig['env'] === undefined && normalized['env'] !== undefined) {
      mergedConfig['env'] = normalized['env']
    }
    if (mergedConfig['headers'] === undefined && normalized['headers'] !== undefined) {
      mergedConfig['headers'] = normalized['headers']
    }
    byName.set(key, { ...existing, config: mergedConfig })
  }

  const push = (source: string, servers: unknown): void => {
    if (servers === null || typeof servers !== 'object' || Array.isArray(servers)) return
    for (const [name, config] of Object.entries(servers as Record<string, unknown>)) {
      if (config !== null && typeof config === 'object' && !Array.isArray(config)) {
        upsert(source, name, config as Record<string, unknown>)
      }
    }
  }

  const claude = readJson(join(home(), '.claude.json'))
  push('claude', claude?.['mcpServers'])
  const cursor = readJson(join(home(), '.cursor', 'mcp.json'))
  push('cursor', cursor?.['mcpServers'])
  const zcode = readJson(join(home(), '.zcode', 'cli', 'config.json'))
  push('zcode', zcode?.['mcpServers'])
  const gemini = readJson(join(home(), '.gemini', 'settings.json'))
  push('gemini', gemini?.['mcpServers'])
  const agyConfig = readJson(join(home(), '.gemini', 'config', 'mcp_config.json'))
  push('antigravity', agyConfig?.['mcpServers'])
  const agyRoot = readJson(join(home(), '.gemini', 'antigravity', 'mcp_config.json'))
  push('antigravity', agyRoot?.['mcpServers'])

  // Codex TOML: parse [mcp_servers.<name>] and nested [mcp_servers.<name>.env] / [mcp_servers.<name>.headers]
  const toml = readText(join(home(), '.codex', 'config.toml'))
  if (toml !== undefined) {
    const codexConfigs = new Map<string, Record<string, unknown>>()
    let currentTarget: Record<string, unknown> | undefined
    for (const line of toml.split(/\r?\n/)) {
      const header = /^\[mcp_servers\.([^\]]+)\]\s*$/.exec(line.trim())
      if (header !== null) {
        const rawPath = (header[1] ?? '').trim()
        const subMatch = /^(.+)\.(env|headers|reconnect|auth)$/.exec(rawPath)
        if (subMatch !== null) {
          const baseName = (subMatch[1] ?? '').replace(/^['"]|['"]$/g, '')
          const subKey = subMatch[2] ?? 'env'
          let parent = codexConfigs.get(baseName)
          if (parent === undefined) {
            parent = {}
            codexConfigs.set(baseName, parent)
          }
          if (subKey === 'env' || subKey === 'headers') {
            const subObj = (typeof parent[subKey] === 'object' && parent[subKey] !== null && !Array.isArray(parent[subKey]))
              ? parent[subKey] as Record<string, unknown>
              : {}
            parent[subKey] = subObj
            currentTarget = subObj
          } else {
            currentTarget = undefined
          }
        } else {
          const baseName = rawPath.replace(/^['"]|['"]$/g, '')
          let serverObj = codexConfigs.get(baseName)
          if (serverObj === undefined) {
            serverObj = {}
            codexConfigs.set(baseName, serverObj)
          }
          currentTarget = serverObj
        }
        continue
      }
      if (line.trim().startsWith('[')) {
        currentTarget = undefined
        continue
      }
      const pair = /^\s*([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line)
      if (pair === null || currentTarget === undefined) continue
      const key = pair[1] as string
      const raw = (pair[2] as string).trim()
      try {
        currentTarget[key] = JSON.parse(raw) as JsonValue
      } catch (_err) {
        currentTarget[key] = raw.replace(/^['"]|['"]$/g, '')
      }
    }
    for (const [name, cfg] of codexConfigs) {
      upsert('codex', name, cfg)
    }
  }
  return [...byName.values()]
}

/** Skill directories across the local agents. */
function scanSkills(): XPeachDetectedSkill[] {
  const out: XPeachDetectedSkill[] = []
  const seen = new Set<string>()
  const isDirectoryPath = (p: string, entry: Dirent): boolean => {
    if (entry.isDirectory()) return true
    if (entry.isSymbolicLink()) {
      try { return statSync(p).isDirectory() } catch (_err) { return false }
    }
    return false
  }
  const scanDir = (source: string, root: string, depth: number): void => {
    if (!existsSync(root) || depth > 1) return
    let entries: Dirent[]
    try { entries = readdirSync(root, { withFileTypes: true }) } catch (_err) { return }
    for (const entry of entries) {
      const path = join(root, entry.name)
      if (!isDirectoryPath(path, entry)) continue
      if (existsSync(join(path, 'SKILL.md'))) {
        const key = entry.name.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          out.push({ source, name: entry.name, path })
        }
      } else if (depth === 0) {
        scanDir(source, path, depth + 1)
      }
    }
  }
  for (const [source, root] of [
    ['claude', join(home(), '.claude', 'skills')],
    ['codex', join(home(), '.codex', 'skills')],
    ['zcode', join(home(), '.zcode', 'skills')],
    ['gemini', join(home(), '.gemini', 'skills')],
    ['antigravity', join(home(), '.gemini', 'config', 'skills')],
    ['antigravity', join(home(), '.gemini', 'antigravity', 'skills')],
    ['antigravity', join(home(), '.gemini', 'antigravity', 'builtin', 'skills')],
  ] as const) {
    scanDir(source, root, 0)
  }
  return out
}

/** User-global instruction files. */
function scanPrompts(): XPeachDetectedPrompt[] {
  const out: XPeachDetectedPrompt[] = []
  for (const [source, path] of [
    ['codex', join(home(), '.codex', 'AGENTS.md')],
    ['claude', join(home(), '.claude', 'CLAUDE.md')],
    ['zcode', join(home(), '.zcode', 'AGENTS.md')],
    ['gemini', join(home(), '.gemini', 'GEMINI.md')],
    ['antigravity', join(home(), '.gemini', 'config', 'GEMINI.md')],
    ['antigravity', join(home(), '.gemini', 'config', 'AGENTS.md')],
    ['antigravity', join(home(), '.gemini', 'antigravity', 'GEMINI.md')],
  ] as const) {
    const text = readText(path)
    if (text === undefined || text.trim().length === 0) continue
    out.push({ source, path, preview: text.trim().slice(0, 200) })
  }
  return out
}

/**
 * Silent first-run detection of local conversation stores and agent assets.
 *
 * @returns detected conversation sources, MCP servers, skills, and prompt files.
 */
export function scanOnboarding(): XPeachOnboardingScan {
  const p = paths()
  const sources: XPeachDetectedSource[] = [
    { id: 'deepseek', label: 'DeepSeek Harness', path: p.deepseek, found: false, threads: 0 },
    { id: 'claude', label: 'Claude Code', path: p.claude, found: false, threads: 0 },
    { id: 'codex', label: 'Codex', path: p.codex, found: false, threads: 0 },
    { id: 'zcode', label: 'zcode', path: p.zcode, found: false, threads: 0 },
    { id: 'chatgpt', label: 'ChatGPT desktop', path: p.chatgpt, found: false, threads: 0 },
    { id: 'gemini', label: 'Gemini CLI', path: p.gemini, found: false, threads: 0 },
    { id: 'antigravity', label: 'Antigravity', path: p.antigravity, found: false, threads: 0 },
  ]
  const chatgptExports = chatgptExportFiles()
  const chatgptDatabases = chatgptDatabaseFiles(home())
  const chatgptDbThreads = chatgptDatabases.reduce((sum, path) => sum + decodeChatgptDatabase(path).length, 0)
  const counts: Record<XPeachSourceId, number> = {
    deepseek: countFiles(p.deepseek, name => /^session\.v\d+\.jsonl(\.zstd)?$/.test(name)),
    claude: countFiles(p.claude, name => name.endsWith('.jsonl')),
    codex: countFiles(p.codex, name => /^rollout-.*\.jsonl\.zst$/.test(name)),
    zcode: countFiles(p.zcode, name => name.endsWith('.json')),
    chatgpt: chatgptExports.reduce((sum, path) => sum + decodeChatgptExport(path).length, 0) + chatgptDbThreads,
    gemini: threadPaths('gemini').length,
    antigravity: threadPaths('antigravity').length,
  }
  for (const source of sources) {
    const threads = counts[source.id]
    source.threads = threads
    if (source.id === 'chatgpt') {
      source.found = threads > 0
      if (threads > 0) source.detail = chatgptExports[0] ?? chatgptDatabases[0] ?? 'conversations.json'
      else if (existsSync(p.chatgpt)) source.detail = 'desktop data detected but no readable conversations found'
    } else if (source.id === 'gemini') {
      const geminiRoot = join(home(), '.gemini')
      source.found = existsSync(geminiRoot) && threads > 0
      if (threads === 0 && existsSync(geminiRoot)) {
        source.detail = '~/.gemini detected (MCP / Skills / GEMINI.md available)'
      }
    } else {
      source.found = existsSync(p[source.id]) && threads > 0
    }
  }
  return { sources, mcp: scanMcp(), skills: scanSkills(), prompts: scanPrompts() }
}

/* ---------- conversation decoding ---------- */

/** Harness-injected context rows that are not human turns. */
function isInjected(text: string): boolean {
  const value = text.trim()
  return value.startsWith('<environment_context')
    || value.startsWith('<permissions instructions')
    || value.startsWith('<system-reminder')
    || value.startsWith('Current runtime context')
}

/** First human user message, used as the imported thread title. */
function humanTitle(messages: readonly { role: 'user' | 'assistant'; text: string }[], fallback: string): string {
  const human = messages.find(message => message.role === 'user' && !isInjected(message.text))
  return (human?.text ?? fallback).slice(0, 80)
}

/** Claude Code transcript: JSONL of user/assistant envelopes. */
function decodeClaude(path: string): ImportedThread | undefined {
  const text = readText(path)
  if (text === undefined) return undefined
  const messages: { role: 'user' | 'assistant'; text: string; time: number }[] = []
  let createdAt: number | undefined
  let cwd: string | undefined
  for (const line of text.split('\n')) {
    if (line.trim().length === 0) continue
    let event: Record<string, unknown>
    try { event = JSON.parse(line) as Record<string, unknown> } catch (_err) { continue }
    if (cwd === undefined && typeof event['cwd'] === 'string') cwd = event['cwd']
    const type = event['type']
    if (type !== 'user' && type !== 'assistant') continue
    const message = event['message'] as Record<string, unknown> | undefined
    if (message === undefined) continue
    const content = message['content']
    const parts: string[] = []
    if (typeof content === 'string') parts.push(content)
    else if (Array.isArray(content)) {
      for (const block of content) {
        if (block !== null && typeof block === 'object' && (block as Record<string, unknown>)['type'] === 'text') {
          const t = (block as Record<string, unknown>)['text']
          if (typeof t === 'string' && t.length > 0) parts.push(t)
        }
      }
    }
    const body = parts.join('\n').trim()
    if (body.length === 0) continue
    if (type === 'user' && isInjected(body)) continue
    const timestamp = typeof event['timestamp'] === 'string' ? Date.parse(event['timestamp']) : NaN
    const time = sanitizeTimestamp(Number.isFinite(timestamp) ? timestamp : Date.now())
    if (createdAt === undefined) createdAt = time
    messages.push({ role: type === 'user' ? 'user' : 'assistant', text: body, time })
  }
  if (!messages.some(m => m.role === 'user')) return undefined
  return { title: humanTitle(messages, 'Claude Code thread'), ...(cwd !== undefined ? { cwd } : {}), createdAt: sanitizeTimestamp(createdAt ?? Date.now()), messages }
}

/** Codex rollout: zstd JSONL with session_meta + response_item messages. */
function decodeCodex(path: string): ImportedThread | undefined {
  let text: string
  try { text = zstdDecompressSync(readFileSync(path)).toString('utf8') } catch (_err) { return undefined }
  const messages: { role: 'user' | 'assistant'; text: string; time: number }[] = []
  let cwd: string | undefined
  let createdAt: number | undefined
  for (const line of text.split('\n')) {
    if (line.trim().length === 0) continue
    let event: Record<string, unknown>
    try { event = JSON.parse(line) as Record<string, unknown> } catch (_err) { continue }
    const payload = event['payload'] as Record<string, unknown> | undefined
    if (payload === undefined) continue
    if (event['type'] === 'session_meta') {
      if (typeof payload['cwd'] === 'string') cwd = payload['cwd']
      if (typeof payload['timestamp'] === 'string') {
        const t = Date.parse(payload['timestamp'])
        if (Number.isFinite(t)) createdAt = sanitizeTimestamp(t)
      }
      continue
    }
    if (event['type'] !== 'response_item' || payload['type'] !== 'message') continue
    const role = payload['role']
    if (role !== 'user' && role !== 'assistant') continue
    const content = payload['content']
    const parts: string[] = []
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block !== null && typeof block === 'object') {
          const b = block as Record<string, unknown>
          if (b['type'] === 'input_text' || b['type'] === 'output_text') {
            const t = b['text']
            if (typeof t === 'string' && t.length > 0) parts.push(t)
          }
        }
      }
    }
    const body = parts.join('\n').trim()
    if (body.length === 0) continue
    if (role === 'user' && isInjected(body)) continue
    const time = typeof event['timestamp'] === 'string' ? Date.parse(event['timestamp']) : NaN
    messages.push({ role, text: body, time: sanitizeTimestamp(Number.isFinite(time) ? time : Date.now()) })
  }
  if (!messages.some(m => m.role === 'user')) return undefined
  return { title: humanTitle(messages, 'Codex thread'), ...(cwd !== undefined ? { cwd } : {}), createdAt: sanitizeTimestamp(createdAt ?? Date.now()), messages }
}

/** zcode session: { meta, messages } JSON. */
function decodeZcode(path: string): ImportedThread | undefined {
  const value = readJson(path)
  if (value === undefined) return undefined
  const meta = value['meta'] as Record<string, unknown> | undefined
  const raw = value['messages']
  if (!Array.isArray(raw)) return undefined
  const messages: { role: 'user' | 'assistant'; text: string; time: number }[] = []
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const role = row['role']
    if (role !== 'user' && role !== 'assistant') continue
    const content = row['content']
    const text = typeof content === 'string' ? content : Array.isArray(content)
      ? content.map(b => b !== null && typeof b === 'object' && typeof (b as Record<string, unknown>)['text'] === 'string' ? (b as Record<string, unknown>)['text'] as string : '').join('\n')
      : ''
    if (text.trim().length === 0) continue
    const time = sanitizeTimestamp(typeof row['timestamp'] === 'number' ? row['timestamp'] : Date.now())
    messages.push({ role, text: text.trim(), time })
  }
  if (!messages.some(m => m.role === 'user')) return undefined
  const title = typeof meta?.['title'] === 'string' && meta['title'].length > 0
    ? meta['title']
    : (messages.find(m => m.role === 'user')?.text ?? 'zcode thread').slice(0, 80)
  const cwd = typeof meta?.['workspacePath'] === 'string' ? meta['workspacePath'] : undefined
  const createdAt = sanitizeTimestamp(typeof meta?.['createdAt'] === 'number' ? meta['createdAt'] : Date.now())
  return { title, ...(cwd !== undefined ? { cwd } : {}), createdAt, messages }
}

/** Official ChatGPT export files the user may have downloaded. */
function chatgptExportFiles(): string[] {
  return [
    join(home(), 'Downloads', 'conversations.json'),
    join(home(), 'Desktop', 'conversations.json'),
    join(home(), 'Documents', 'conversations.json'),
  ].filter(path => existsSync(path))
}

/** Decode one ChatGPT export file into threads (current-node parent chain). */
function decodeChatgptExport(path: string): { key: string; thread: ImportedThread }[] {
  const text = readText(path)
  if (text === undefined) return []
  let value: unknown
  try { value = JSON.parse(text) } catch (_err) { return [] }
  if (!Array.isArray(value)) return []
  const out: { key: string; thread: ImportedThread }[] = []
  for (const item of value) {
    if (item === null || typeof item !== 'object') continue
    const conversation = item as Record<string, unknown>
    const mapping = conversation['mapping']
    if (mapping === null || typeof mapping !== 'object') continue
    const nodes = mapping as Record<string, unknown>
    const chain: Record<string, unknown>[] = []
    let nodeId = typeof conversation['current_node'] === 'string' ? conversation['current_node'] : undefined
    const seen = new Set<string>()
    while (nodeId !== undefined && nodes[nodeId] !== undefined && !seen.has(nodeId)) {
      seen.add(nodeId)
      const node = nodes[nodeId] as Record<string, unknown>
      chain.push(node)
      nodeId = typeof node['parent'] === 'string' ? node['parent'] : undefined
    }
    chain.reverse()
    const messages: { role: 'user' | 'assistant'; text: string; time: number }[] = []
    for (const node of chain) {
      const message = node['message']
      if (message === null || typeof message !== 'object') continue
      const row = message as Record<string, unknown>
      const author = row['author'] as Record<string, unknown> | undefined
      const role = author?.['role']
      if (role !== 'user' && role !== 'assistant') continue
      const content = row['content'] as Record<string, unknown> | undefined
      const parts: unknown[] = Array.isArray(content?.['parts']) ? content['parts'] : []
      const body = parts.filter((part): part is string => typeof part === 'string').join('\n').trim()
      if (body.length === 0 || (role === 'user' && isInjected(body))) continue
      const time = sanitizeTimestamp(typeof row['create_time'] === 'number' ? row['create_time'] * 1000 : Date.now())
      messages.push({ role, text: body, time })
    }
    if (!messages.some(message => message.role === 'user')) continue
    const createdAt = sanitizeTimestamp(typeof conversation['create_time'] === 'number'
      ? conversation['create_time'] * 1000
      : messages[0]?.time ?? Date.now())
    const rawTitle = typeof conversation['title'] === 'string' ? conversation['title'].trim() : ''
    const title = (rawTitle.length > 0 ? rawTitle : humanTitle(messages, 'ChatGPT thread')).slice(0, 80)
    const id = typeof conversation['id'] === 'string' ? conversation['id'] : `${title}:${String(createdAt)}`
    out.push({ key: 'chatgpt:' + id, thread: { title, createdAt, messages } })
  }
  return out
}

/** Extract text from a Gemini CLI message content payload. */
function extractGeminiText(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim()
  if (Array.isArray(raw)) {
    const parts: string[] = []
    for (const item of raw) {
      if (typeof item === 'string') {
        parts.push(item)
      } else if (item !== null && typeof item === 'object') {
        const rec = item as Record<string, unknown>
        if (typeof rec['text'] === 'string' && rec['text'].length > 0) parts.push(rec['text'])
      }
    }
    return parts.join('\n').trim()
  }
  if (raw !== null && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>
    if (typeof rec['text'] === 'string') return rec['text'].trim()
    if (Array.isArray(rec['parts'])) return extractGeminiText(rec['parts'])
  }
  return ''
}

/** Decode one Gemini CLI session file (JSON object, JSON array, or JSONL). */
function decodeGemini(path: string): ImportedThread | undefined {
  const text = readText(path)
  if (text === undefined || text.trim().length === 0) return undefined
  let rows: unknown[] = []
  let cwd: string | undefined
  let createdAt: number | undefined
  let explicitTitle: string | undefined

  try {
    const parsed: unknown = JSON.parse(text)
    if (Array.isArray(parsed)) {
      rows = parsed
    } else if (parsed !== null && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>
      if (typeof obj['cwd'] === 'string' && isAbsolute(obj['cwd'])) cwd = obj['cwd']
      if (typeof obj['title'] === 'string' && obj['title'].trim().length > 0) explicitTitle = obj['title'].trim()
      if (typeof obj['startTime'] === 'string') {
        const t = Date.parse(obj['startTime'])
        if (Number.isFinite(t)) createdAt = sanitizeTimestamp(t)
      } else if (typeof obj['startTime'] === 'number') {
        createdAt = sanitizeTimestamp(obj['startTime'])
      }
      if (Array.isArray(obj['messages'])) rows = obj['messages']
    }
  } catch (_err) {
    // Fallback to JSONL
    for (const line of text.split(/\r?\n/)) {
      if (line.trim().length === 0) continue
      try {
        rows.push(JSON.parse(line))
      } catch (_lineErr) { /* skip malformed line */ }
    }
  }

  const messages: { role: 'user' | 'assistant'; text: string; time: number }[] = []
  for (const item of rows) {
    if (item === null || typeof item !== 'object') continue
    const msg = item as Record<string, unknown>
    const rawRole = msg['type'] ?? msg['role']
    const role: 'user' | 'assistant' | undefined = rawRole === 'user'
      ? 'user'
      : (rawRole === 'gemini' || rawRole === 'model' || rawRole === 'assistant')
        ? 'assistant'
        : undefined
    if (role === undefined) continue
    const body = extractGeminiText(msg['content'] ?? msg['text'] ?? msg['parts'])
    if (body.length === 0 || (role === 'user' && isInjected(body))) continue
    const rawTs = msg['timestamp'] ?? msg['created_at'] ?? msg['time']
    const parsedTs = typeof rawTs === 'number'
      ? rawTs
      : typeof rawTs === 'string'
        ? Date.parse(rawTs)
        : NaN
    const time = sanitizeTimestamp(Number.isFinite(parsedTs) ? parsedTs : Date.now())
    if (createdAt === undefined) createdAt = time
    messages.push({ role, text: body, time })
  }

  if (!messages.some(m => m.role === 'user')) return undefined
  const title = (explicitTitle ?? humanTitle(messages, 'Gemini CLI thread')).slice(0, 80)
  return {
    title,
    ...(cwd !== undefined ? { cwd } : {}),
    createdAt: sanitizeTimestamp(createdAt ?? Date.now()),
    messages,
  }
}

/** Find the nearest existing git workspace or directory for a file path from tool calls. */
function inferWorkspaceFromPath(rawPath: string): string | undefined {
  const cleaned = rawPath.replace(/^"+|"+$/g, '').trim()
  if (!isAbsolute(cleaned)) return undefined
  let current = cleaned
  try {
    if (existsSync(current) && !statSync(current).isDirectory()) {
      current = dirname(current)
    }
  } catch (_err) {
    current = dirname(current)
  }
  let probe = current
  for (let depth = 0; depth < 12; depth += 1) {
    if (existsSync(join(probe, '.git'))) return probe
    const parent = dirname(probe)
    if (parent === probe) break
    probe = parent
  }
  return existsSync(current) ? current : undefined
}

/** Decode one Antigravity `transcript.jsonl` conversation log. */
function decodeAntigravity(path: string): ImportedThread | undefined {
  const text = readText(path)
  if (text === undefined || !text.includes('"USER_INPUT"')) return undefined
  const convId = basename(dirname(dirname(dirname(path))))
  const messages: { role: 'user' | 'assistant'; text: string; time: number }[] = []
  let createdAt: number | undefined
  let cwd: string | undefined

  for (const line of text.split(/\r?\n/)) {
    if (line.trim().length === 0) continue
    let event: Record<string, unknown>
    try { event = JSON.parse(line) as Record<string, unknown> } catch (_err) { continue }
    const rawTime = typeof event['created_at'] === 'string' ? Date.parse(event['created_at']) : NaN
    const time = sanitizeTimestamp(Number.isFinite(rawTime) ? rawTime : Date.now())
    if (createdAt === undefined) createdAt = time

    if (cwd === undefined && Array.isArray(event['tool_calls'])) {
      for (const tc of event['tool_calls']) {
        if (tc === null || typeof tc !== 'object') continue
        const args = (tc as Record<string, unknown>)['args']
        if (args === null || typeof args !== 'object') continue
        const argsRec = args as Record<string, unknown>
        const rawCwd = argsRec['Cwd'] ?? argsRec['cwd']
        if (typeof rawCwd === 'string') {
          const cleaned = rawCwd.replace(/^"+|"+$/g, '').trim()
          if (isAbsolute(cleaned) && existsSync(cleaned)) {
            cwd = cleaned
            break
          }
        }
        const rawTarget = argsRec['Path'] ?? argsRec['AbsolutePath'] ?? argsRec['TargetFile']
        if (typeof rawTarget === 'string') {
          const inferred = inferWorkspaceFromPath(rawTarget)
          if (inferred !== undefined && !inferred.replace(/\\/g, '/').includes('/.gemini/antigravity')) {
            cwd = inferred
            break
          }
        }
      }
    }

    const type = event['type']
    const content = event['content']
    if (type === 'USER_INPUT' && typeof content === 'string') {
      const reqMatch = /<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/.exec(content)
      const extracted = reqMatch !== null
        ? (reqMatch[1] ?? '').trim()
        : content
          .replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, '')
          .replace(/<USER_SETTINGS_CHANGE>[\s\S]*?<\/USER_SETTINGS_CHANGE>/g, '')
          .replace(/<SYSTEM_MESSAGE>[\s\S]*?<\/SYSTEM_MESSAGE>/g, '')
          .trim()
      if (extracted.length === 0 || isInjected(extracted)) continue
      messages.push({ role: 'user', text: extracted, time })
    } else if (type === 'PLANNER_RESPONSE' && typeof content === 'string') {
      const body = content.trim()
      if (body.length > 0) {
        messages.push({ role: 'assistant', text: body, time })
      }
    }
  }

  if (!messages.some(m => m.role === 'user')) return undefined

  let title: string | undefined
  const agyRoot = dirname(dirname(dirname(dirname( dirname(path) ))))
  const candidatePbtxts = [
    join(agyRoot, 'annotations', `${convId}.pbtxt`),
    join(home(), '.gemini', 'antigravity', 'annotations', `${convId}.pbtxt`),
  ]
  for (const pbtxtPath of candidatePbtxts) {
    const pbtxt = readText(pbtxtPath)
    if (pbtxt === undefined) continue
    const m = /title:\s*"((?:[^"\\]|\\.)*)"/.exec(pbtxt)
    if (m !== null && typeof m[1] === 'string') {
      const unescaped = m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim()
      if (unescaped.length > 0) {
        title = unescaped.slice(0, 80)
        break
      }
    }
  }

  if (cwd === undefined && isAbsolute(process.cwd()) && existsSync(process.cwd())) {
    cwd = process.cwd()
  }

  return {
    title: title ?? humanTitle(messages, 'Antigravity thread'),
    ...(cwd !== undefined ? { cwd } : {}),
    createdAt: sanitizeTimestamp(createdAt ?? Date.now()),
    messages,
  }
}

/** Every thread path for one source. */
function threadPaths(source: XPeachSourceId): string[] {
  const p = paths()
  const out: string[] = []
  if (source === 'antigravity') {
    if (!existsSync(p.antigravity)) return out
    let entries: Dirent[]
    try { entries = readdirSync(p.antigravity, { withFileTypes: true }) } catch (_err) { return out }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const transcript = join(p.antigravity, entry.name, '.system_generated', 'logs', 'transcript.jsonl')
      if (!existsSync(transcript)) continue
      const text = readText(transcript)
      if (text !== undefined && text.includes('"USER_INPUT"')) {
        out.push(transcript)
      }
    }
    return out
  }
  if (source === 'gemini') {
    if (!existsSync(p.gemini)) return out
    const walkGemini = (dir: string, depth: number): void => {
      if (depth > 4 || !existsSync(dir)) return
      let entries: Dirent[]
      try { entries = readdirSync(dir, { withFileTypes: true }) } catch (_err) { return }
      const localSessions: string[] = []
      let logsJsonPath: string | undefined
      for (const entry of entries) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === 'antigravity' || entry.name === 'config' || entry.name === 'skills') continue
          walkGemini(full, depth + 1)
          continue
        }
        if (/^session-.*\.jsonl?$/.test(entry.name)) {
          localSessions.push(full)
        } else if (entry.name === 'logs.json') {
          logsJsonPath = full
        }
      }
      for (const s of localSessions) out.push(s)
      if (localSessions.length === 0 && logsJsonPath !== undefined) {
        const chatsDir = join(dir, 'chats')
        const hasChatsSession = existsSync(chatsDir) && (() => {
          try {
            return readdirSync(chatsDir).some(name => /^session-.*\.jsonl?$/.test(name))
          } catch (_err) {
            return false
          }
        })()
        if (!hasChatsSession && decodeGemini(logsJsonPath) !== undefined) {
          out.push(logsJsonPath)
        }
      }
    }
    walkGemini(p.gemini, 0)
    return out
  }
  const walk = (dir: string, depth: number): void => {
    if (depth > 6 || !existsSync(dir)) return
    let entries: Dirent[]
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch (_err) { return }
    for (const entry of entries) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) { walk(path, depth + 1); continue }
      if (source === 'claude' && entry.name.endsWith('.jsonl')) out.push(path)
      if (source === 'codex' && /^rollout-.*\.jsonl\.zst$/.test(entry.name)) out.push(path)
      if (source === 'zcode' && entry.name.endsWith('.json')) out.push(path)
    }
  }
  walk(p[source], 0)
  return out
}

/** Session project directory key (mirrors the persistence slug). */
function projectKey(cwd: string): string {
  let out = ''
  let separator = false
  for (let i = 0; i < cwd.length; i += 1) {
    const ch = cwd[i]
    if (ch === undefined) continue
    if (ch === '/' || ch === '\\' || ch === ':') { if (!separator) out += '-'; separator = true; continue }
    if (ch !== '~' && /^[A-Za-z0-9._-]$/.test(ch)) { out += ch; separator = false; continue }
    out += '~' + cwd.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')
    separator = false
  }
  const slug = out.replace(/^-+/, '') || 'root'
  return `--${slug.slice(0, 251)}--`
}

/** Write one decoded thread as a native v4 session log. */
function writeSession(root: string, thread: ImportedThread): string {
  const hasValidCwd = typeof thread.cwd === 'string' && thread.cwd.trim().length > 0 && isAbsolute(thread.cwd)
  const cwd = hasValidCwd ? thread.cwd : join(home(), 'XPeach Imported')
  // A real directory gives the workspace bootstrap a home for cwd-less imports.
  if (!hasValidCwd) { try { mkdirSync(cwd, { recursive: true }) } catch (_err) { /* best effort */ } }
  const id = 'session-' + randomUUID()
  const dir = join(root, projectKey(cwd), id)
  mkdirSync(dir, { recursive: true })
  const events: Record<string, unknown>[] = []
  let seq = 0
  const baseCreatedAt = sanitizeTimestamp(thread.createdAt)
  const time = (offset: number): number => sanitizeTimestamp(baseCreatedAt + offset)
  const push = (type: string, data: Record<string, unknown>, extra: Record<string, unknown> = {}): number => {
    const current = seq
    events.push({ type, seq: seq++, time: time(seq * 1000), data, ...extra })
    return current
  }
  push('permission/preset', { preset: 'danger-full-access' })
  push('sandbox/mode', { mode: 'danger-full-access' })
  push('approval/policy', { policy: 'never' })
  push('session/end-seed', {})
  // Group messages into turns: one user message plus the assistants that follow.
  const turns: { user?: { text: string; time: number }; assistants: { text: string; time: number }[] }[] = []
  for (const message of thread.messages) {
    if (message.role === 'user') {
      turns.push({ user: { text: message.text, time: message.time }, assistants: [] })
    } else {
      let lastTurn = turns[turns.length - 1]
      if (lastTurn === undefined) {
        lastTurn = { assistants: [] }
        turns.push(lastTurn)
      }
      lastTurn.assistants.push({ text: message.text, time: message.time })
    }
  }
  let turn = 0
  let titleWritten = false
  for (const current of turns) {
    if (current.user === undefined && current.assistants.length === 0) continue
    turn += 1
    push('turn/start', { turn })
    let step = 0
    let stepOpen = false
    if (current.user !== undefined) {
      step = 1
      stepOpen = true
      push('step/start', { turn, step })
      const userSeq = push('user/message', {
        content: [{ type: 'text', text: current.user.text }],
        source: { kind: 'user', rpcId: randomUUID() },
        role: 'user',
        id: randomUUID(),
      }, { surfaceOp: 'append' })
      if (!titleWritten) {
        titleWritten = true
        push('session/title', { title: thread.title, messageSeqs: [userSeq], source: { kind: 'fallback' } })
      }
      if (current.assistants.length === 0) {
        push('step/end', { turn, step })
        stepOpen = false
      }
    }
    for (const assistant of current.assistants) {
      if (!stepOpen) {
        step += 1
        push('step/start', { turn, step })
        stepOpen = true
      }
      push('assistant/message', {
        turn,
        step,
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: assistant.text }],
          source: { kind: 'model', provider: 'imported', model: 'imported' },
          id: randomUUID(),
        },
        usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, totalTokens: 0 },
        stream: [],
      }, { surfaceOp: 'append' })
      push('step/end', { turn, step })
      stepOpen = false
    }
    push('turn/end', { turn, reason: { kind: 'completed' } })
  }
  if (!titleWritten) {
    const firstUser = events.find(event => event['type'] === 'user/message')
    if (firstUser !== undefined) push('session/title', { title: thread.title, messageSeqs: [firstUser['seq'] as number], source: { kind: 'fallback' } })
  }
  const header = JSON.stringify({ type: 'session', version: 4, id, createdAt: baseCreatedAt, cwd, isSeeded: false, delegationDepth: 0, agentPreset: 'ptc' }) + '\n'
  const body = events.map(event => JSON.stringify(event)).join('\n') + '\n'
  const zstdOptions = { params: { [constants.ZSTD_c_checksumFlag]: 1 } }
  const headerFrame = zstdCompressSync(Buffer.from(header), zstdOptions)
  const bodyFrame = zstdCompressSync(Buffer.from(body), zstdOptions)
  writeFileSync(join(dir, 'session.v4.jsonl.zstd'), Buffer.concat([headerFrame, bodyFrame]))
  return join(dir, 'session.v4.jsonl.zstd')
}

/**
 * Decode and import one source's threads into the XPeach session root.
 *
 * @param source - local conversation store identifier to import.
 * @param root - destination session root directory.
 * @returns counts of imported and skipped conversations, plus any top-level error.
 */
export function importConversations(source: XPeachSourceId, root: string): XPeachConversationImportResult {
  if (source === 'deepseek') {
    // DeepSeek logs are already native: copy session directories, never overwrite.
    const src = paths().deepseek
    if (!existsSync(src)) return { source, imported: 0, skipped: 0, error: 'not found' }
    let imported = 0
    let skipped = 0
    const walk = (dir: string, depth: number): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const path = join(dir, entry.name)
        if (entry.name.startsWith('session-')) {
          const dest = join(root, basename(dir), entry.name)
          if (existsSync(dest)) { skipped += 1; continue }
          cpSync(path, dest, { recursive: true, force: false, filter: f => !f.endsWith('session.lock') })
          imported += 1
          continue
        }
        if (depth < 2) walk(path, depth + 1)
      }
    }
    walk(src, 0)
    return { source, imported, skipped }
  }
  const chatgptDbFiles = source === 'chatgpt' ? chatgptDatabaseFiles(home()) : []
  if (source === 'chatgpt' && chatgptExportFiles().length === 0 && chatgptDbFiles.length === 0) {
    return { source, imported: 0, skipped: 0, error: 'ChatGPT desktop data not found; export conversations.json or install the desktop app' }
  }
  const homeRoot = dirname(root)
  const indexFile = join(homeRoot, '.xpeach-imported.json')
  let index: Record<string, string[]> = {}
  let parsedIndex: unknown = null
  try { parsedIndex = JSON.parse(readText(indexFile) ?? '{}') } catch (_err) { parsedIndex = null }
  if (parsedIndex !== null && typeof parsedIndex === 'object' && !Array.isArray(parsedIndex)) {
    index = parsedIndex as Record<string, string[]>
  }
  const seen = new Set(index[source] ?? [])
  let imported = 0
  let skipped = 0
  const record = (key: string): void => { seen.add(key) }
  if (source === 'chatgpt') {
    for (const path of chatgptExportFiles()) {
      for (const { key, thread } of decodeChatgptExport(path)) {
        if (seen.has(key)) { skipped += 1; continue }
        try { writeSession(root, thread); record(key); imported += 1 } catch (_err) { skipped += 1 }
      }
    }
    for (const path of chatgptDbFiles) {
      for (const thread of decodeChatgptDatabase(path)) {
        if (seen.has(thread.key)) { skipped += 1; continue }
        try { writeSession(root, thread); record(thread.key); imported += 1 } catch (_err) { skipped += 1 }
      }
    }
  } else {
    const decode = source === 'claude'
      ? decodeClaude
      : source === 'codex'
        ? decodeCodex
        : source === 'gemini'
          ? decodeGemini
          : source === 'antigravity'
            ? decodeAntigravity
            : decodeZcode
    for (const path of threadPaths(source)) {
      let key = path
      try { key = `${path}:${String(Math.floor(statSync(path).mtimeMs))}` } catch (_err) { /* unreadable */ }
      if (seen.has(key)) { skipped += 1; continue }
      const thread = decode(path)
      if (thread === undefined) { skipped += 1; continue }
      try { writeSession(root, thread); record(key); imported += 1 } catch (_err) { skipped += 1 }
    }
  }
  index[source] = [...seen]
  try { writeFileSync(indexFile, JSON.stringify(index), { mode: 0o600 }) } catch (_err) { /* best effort */ }
  return { source, imported, skipped }
}

/** One parsed MCP server entry from `cordis.patch.yml`. */
export interface XPeachMcpPatchEntry {
  readonly id: string
  readonly serverName: string
  readonly disabled: boolean
  readonly transportType: 'stdio' | 'streamable-http'
  readonly command?: string
  readonly args?: readonly string[]
  readonly env?: Readonly<Record<string, string>>
  readonly url?: string
  readonly headers?: Readonly<Record<string, string>>
}

/** Parse one folded YAML/JSON value into a string dictionary. */
function parseStringMap(raw: string): Record<string, string> | undefined {
  const folded = raw.replace(/\\\r?\n\s*/g, '').replace(/\r?\n\s*/g, ' ').trim()
  if (folded.length === 0) return undefined
  try {
    const parsed: unknown = JSON.parse(folded)
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === 'string') out[k] = v
      }
      return Object.keys(out).length > 0 ? out : undefined
    }
  } catch (_err) {
    const out: Record<string, string> = {}
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*([A-Za-z0-9_.-]+):\s*(.+)$/.exec(line)
      if (m !== null && m[1] !== undefined && m[2] !== undefined) {
        out[m[1]] = unquoteYamlScalar(m[2])
      }
    }
    return Object.keys(out).length > 0 ? out : undefined
  }
  return undefined
}

/** Parse one folded YAML/JSON value into a string array. */
function parseStringList(raw: string): string[] | undefined {
  const folded = raw.replace(/\\\r?\n\s*/g, '').replace(/\r?\n\s*/g, ' ').trim()
  if (folded.length === 0) return undefined
  try {
    const parsed: unknown = JSON.parse(folded)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string')
    }
  } catch (_err) {
    const out: string[] = []
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*-\s*(.+)$/.exec(line)
      if (m !== null && m[1] !== undefined) out.push(unquoteYamlScalar(m[1]))
    }
    if (out.length > 0) return out
  }
  return undefined
}

/** Parse one MCP plugin YAML block into an `XPeachMcpPatchEntry`. */
function parseMcpBlock(block: string): XPeachMcpPatchEntry | undefined {
  if (!block.includes('xph-mcp-client') && !block.includes('dsh-mcp-client')) return undefined
  const lines = block.split(/\r?\n/)
  const firstLine = lines[0] ?? ''
  const idMatch = /^\s*-\s*id:\s*(.+)$/.exec(firstLine)
  if (idMatch === null || idMatch[1] === undefined) return undefined
  const rawId = unquoteYamlScalar(idMatch[1].replace(/#.*$/, ''))
  let disabled = false
  let configStart = -1
  let configIndent = 6

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i] ?? ''
    const disMatch = /^\s+disabled:\s*(true|false)\b/.exec(line)
    if (disMatch !== null && configStart < 0) {
      disabled = disMatch[1] === 'true'
      continue
    }
    const cfgMatch = /^(\s+)config:\s*$/.exec(line)
    if (cfgMatch !== null && cfgMatch[1] !== undefined) {
      configStart = i + 1
      configIndent = cfgMatch[1].length
      break
    }
  }
  if (configStart < 0) return undefined

  const fields = new Map<string, string>()
  const keyIndent = configIndent + 2
  let currentKey: string | undefined
  let currentBuf: string[] = []
  const flushKey = (): void => {
    if (currentKey !== undefined) {
      fields.set(currentKey, currentBuf.join('\n'))
    }
    currentKey = undefined
    currentBuf = []
  }

  for (let i = configStart; i < lines.length; i += 1) {
    const line = lines[i] ?? ''
    if (line.trim().length === 0 || line.trim().startsWith('#')) continue
    const indent = /^(\s*)/.exec(line)?.[1]?.length ?? 0
    if (indent === keyIndent) {
      const km = /^\s*([A-Za-z0-9_]+):(?:\s*(.*))?$/.exec(line)
      if (km !== null && km[1] !== undefined) {
        flushKey()
        currentKey = km[1]
        if (km[2] !== undefined && km[2].trim().length > 0) {
          currentBuf.push(km[2])
        }
        continue
      }
    }
    if (indent > keyIndent && currentKey !== undefined) {
      currentBuf.push(line)
    }
  }
  flushKey()

  const decodeScalar = (raw: string | undefined): string | undefined => {
    if (raw === undefined) return undefined
    const folded = raw.replace(/\\\r?\n\s*/g, '').replace(/\r?\n\s*/g, ' ').trim()
    if (folded.length === 0) return undefined
    return unquoteYamlScalar(folded)
  }

  const rawTransport = decodeScalar(fields.get('transport'))
  const transportType: 'stdio' | 'streamable-http' = rawTransport === 'streamable-http' ? 'streamable-http' : 'stdio'
  const rawServerName = decodeScalar(fields.get('serverName')) ?? rawId.replace(/^mcp-/, '')
  const serverName = sanitizeMcpServerName(rawServerName)
  const id = rawId.length > 0 ? rawId : sanitizeMcpId(serverName)
  const command = decodeScalar(fields.get('command'))
  const url = decodeScalar(fields.get('url'))
  const args = parseStringList(fields.get('args') ?? '')
  const env = parseStringMap(fields.get('env') ?? '')
  const headers = parseStringMap(fields.get('headers') ?? '')

  return {
    id,
    serverName,
    disabled,
    transportType,
    ...(command !== undefined ? { command } : {}),
    ...(args !== undefined ? { args } : {}),
    ...(env !== undefined ? { env } : {}),
    ...(url !== undefined ? { url } : {}),
    ...(headers !== undefined ? { headers } : {}),
  }
}

/** Deduplicate MCP patch entries by normalized `serverName` and `id`, merging `env`/`headers` when present. */
function deduplicateMcpEntries(entries: readonly XPeachMcpPatchEntry[]): { entries: XPeachMcpPatchEntry[]; hadDuplicates: boolean } {
  const byServer = new Map<string, XPeachMcpPatchEntry>()
  const usedIds = new Set<string>()
  let hadDuplicates = false
  for (const item of entries) {
    const serverName = sanitizeMcpServerName(item.serverName)
    const key = serverName.toLowerCase()
    const existing = byServer.get(key)
    if (existing !== undefined) {
      hadDuplicates = true
      byServer.set(key, {
        ...existing,
        ...(existing.env === undefined && item.env !== undefined ? { env: item.env } : {}),
        ...(existing.headers === undefined && item.headers !== undefined ? { headers: item.headers } : {}),
      })
      continue
    }
    let id = item.id.trim().length > 0 ? item.id.trim() : sanitizeMcpId(serverName)
    if (usedIds.has(id)) {
      hadDuplicates = true
      id = `${id}-${String(usedIds.size + 1)}`
    }
    usedIds.add(id)
    byServer.set(key, { ...item, id, serverName })
  }
  return { entries: [...byServer.values()], hadDuplicates }
}

/** Split `cordis.patch.yml` into non-MCP text and parsed MCP entries. */
function splitPatchFile(raw: string): { nonMcpLines: string[]; entries: XPeachMcpPatchEntry[]; rawMcpCount: number } {
  const lines = raw.split(/\r?\n/)
  const nonMcpLines: string[] = []
  const rawEntries: XPeachMcpPatchEntry[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    if (/^-\s+insert:\s*$/.test(line)) {
      const insertHeader = line
      i += 1
      const itemBlocks: string[][] = []
      let currentBlock: string[] | undefined
      while (i < lines.length) {
        const sub = lines[i] ?? ''
        if (sub.length > 0 && !/^\s/.test(sub) && !sub.startsWith('#')) {
          break
        }
        if (/^\s{2,6}-\s+id:\s*/.test(sub)) {
          if (currentBlock !== undefined) itemBlocks.push(currentBlock)
          currentBlock = [sub]
        } else if (currentBlock !== undefined) {
          currentBlock.push(sub)
        } else {
          // Leading comment or blank line before first item in insert block
          nonMcpLines.push(sub)
        }
        i += 1
      }
      if (currentBlock !== undefined) itemBlocks.push(currentBlock)

      const keptBlocks: string[][] = []
      for (const block of itemBlocks) {
        const joined = block.join('\n')
        const parsed = parseMcpBlock(joined)
        if (parsed !== undefined) {
          rawEntries.push(parsed)
        } else {
          keptBlocks.push(block)
        }
      }
      if (keptBlocks.length > 0) {
        nonMcpLines.push(insertHeader)
        for (const block of keptBlocks) {
          nonMcpLines.push(...block)
        }
      }
      continue
    }
    nonMcpLines.push(line)
    i += 1
  }

  const { entries } = deduplicateMcpEntries(rawEntries)
  return { nonMcpLines, entries, rawMcpCount: rawEntries.length }
}

/**
 * Read and deduplicate MCP client entries from a `cordis.patch.yml` file.
 * @param patchPath - path to `cordis.patch.yml`.
 * @returns deduplicated list of configured MCP entries.
 */
export function readMcpPatchEntries(patchPath: string): XPeachMcpPatchEntry[] {
  const raw = readText(patchPath)
  if (raw === undefined) return []
  const { entries, rawMcpCount } = splitPatchFile(raw)
  if (rawMcpCount > entries.length) {
    try { writeMcpPatchEntries(patchPath, entries) } catch (_err) { /* ignore */ }
  }
  return entries
}

/** Format one `XPeachMcpPatchEntry` as YAML lines inside an `- insert:` block. */
function formatMcpPatchEntry(entry: XPeachMcpPatchEntry): string {
  const serverName = sanitizeMcpServerName(entry.serverName)
  const id = entry.id.trim().length > 0 ? entry.id.trim() : sanitizeMcpId(serverName)
  const lines = [
    `    - id: ${id}`,
    "      name: '@xpeach/xph-mcp-client'",
    ...(entry.disabled ? ['      disabled: true'] : []),
    '      config:',
    `        transport: ${entry.transportType}`,
    `        serverName: ${JSON.stringify(serverName)}`,
    '        failOnStartupError: false',
  ]
  if (entry.transportType === 'streamable-http') {
    if (entry.url !== undefined && entry.url.length > 0) {
      lines.push(`        url: ${JSON.stringify(entry.url)}`)
    }
    if (entry.headers !== undefined && Object.keys(entry.headers).length > 0) {
      lines.push(`        headers: ${JSON.stringify(entry.headers)}`)
    }
  } else {
    if (entry.command !== undefined && entry.command.length > 0) {
      lines.push(`        command: ${JSON.stringify(entry.command)}`)
    }
    if (entry.args !== undefined) {
      lines.push(`        args: ${JSON.stringify(entry.args)}`)
    }
    if (entry.env !== undefined && Object.keys(entry.env).length > 0) {
      lines.push(`        env: ${JSON.stringify(entry.env)}`)
    }
  }
  return lines.join('\n')
}

/**
 * Write deduplicated MCP client entries into `cordis.patch.yml`, preserving all non-MCP patch entries.
 * @param patchPath - path to `cordis.patch.yml`.
 * @param entries - MCP entries to persist.
 */
export function writeMcpPatchEntries(patchPath: string, entries: readonly XPeachMcpPatchEntry[]): void {
  const existing = readText(patchPath) ?? ''
  const { nonMcpLines } = splitPatchFile(existing)
  const { entries: deduped } = deduplicateMcpEntries(entries)
  const baseText = nonMcpLines
    .join('\n')
    .trimEnd()
    .replace(/(?:^|\n)\s*\[\]\s*$/, '')
    .trimEnd()

  mkdirSync(dirname(patchPath), { recursive: true })
  if (deduped.length === 0) {
    const hasNonComment = baseText.split(/\r?\n/).some(l => l.trim().length > 0 && !l.trim().startsWith('#'))
    const out = hasNonComment
      ? `${baseText}\n`
      : baseText.length > 0
        ? `${baseText}\n[]\n`
        : '[]\n'
    writeFileSync(patchPath, out, 'utf8')
    return
  }

  const mcpBlock = `- insert:\n${deduped.map(formatMcpPatchEntry).join('\n')}\n`
  const prefix = baseText.length > 0 ? `${baseText}\n` : ''
  writeFileSync(patchPath, `${prefix}${mcpBlock}`, 'utf8')
}

/**
 * Copy skills, merge prompts, and append MCP rows to the profile patch.
 *
 * @param selection - flags selecting which asset categories to import.
 * @param home_ - target profile home directory.
 * @param profilePatch - path to the profile `cordis.patch.yml` file.
 * @returns counts of imported MCP servers, skills, and prompts, plus any error messages.
 */
export function importAssets(
  selection: { readonly mcp: boolean; readonly skills: boolean; readonly prompts: boolean },
  home_: string,
  profilePatch: string,
): XPeachAssetImportResult {
  const scan = scanOnboarding()
  const errors: string[] = []
  let mcp = 0
  let skills = 0
  let prompts = 0
  if (selection.skills) {
    const root = join(home_, 'skills')
    mkdirSync(root, { recursive: true })
    for (const skill of scan.skills) {
      const dest = join(root, skill.name)
      if (existsSync(dest)) continue
      try {
        cpSync(skill.path, dest, { recursive: true, force: false, dereference: true })
        skills += 1
      } catch (error) {
        errors.push('skill ' + skill.name + ': ' + String(error))
      }
    }
    repairSkillsDirectory(root)
  }
  if (selection.prompts) {
    const dest = join(home_, 'AGENTS.md')
    const existing = readText(dest)
    const parts: string[] = []
    for (const prompt of scan.prompts) {
      const marker = '<!-- imported from ' + prompt.path + ' -->'
      if (existing !== undefined && existing.includes(marker)) continue
      const text = readText(prompt.path)
      if (text === undefined || text.trim().length === 0) continue
      parts.push(marker + '\n' + text.trim())
    }
    if (parts.length > 0) {
      const merged = (existing === undefined || existing.trim().length === 0 ? '' : existing.trimEnd() + '\n\n') + parts.join('\n\n---\n\n') + '\n'
      try {
        mkdirSync(dirname(dest), { recursive: true })
        writeFileSync(dest, merged)
        prompts = parts.length
      } catch (error) {
        errors.push('prompts: ' + String(error))
      }
    }
  }
  if (selection.mcp && scan.mcp.length > 0) {
    try {
      const existingEntries = readMcpPatchEntries(profilePatch)
      const existingNames = new Set(existingEntries.map(e => e.serverName.toLowerCase()))
      const existingIds = new Set(existingEntries.map(e => e.id))
      const combined: XPeachMcpPatchEntry[] = [...existingEntries]

      for (const server of scan.mcp) {
        const config = server.config
        const command = typeof config['command'] === 'string' && config['command'].trim().length > 0
          ? config['command'].trim()
          : undefined
        const url = typeof config['url'] === 'string' && config['url'].trim().length > 0
          ? config['url'].trim()
          : undefined
        if (command === undefined && url === undefined) continue
        const serverName = sanitizeMcpServerName(server.name)
        const id = sanitizeMcpId(server.name)
        if (existingNames.has(serverName.toLowerCase()) || existingIds.has(id)) continue

        const args = Array.isArray(config['args'])
          ? config['args'].filter((a): a is string => typeof a === 'string')
          : undefined
        const env = (config['env'] !== null && typeof config['env'] === 'object' && !Array.isArray(config['env']))
          ? Object.fromEntries(
            Object.entries(config['env'] as Record<string, unknown>)
              .filter((pair): pair is [string, string] => typeof pair[1] === 'string'),
          )
          : undefined
        const headers = (config['headers'] !== null && typeof config['headers'] === 'object' && !Array.isArray(config['headers']))
          ? Object.fromEntries(
            Object.entries(config['headers'] as Record<string, unknown>)
              .filter((pair): pair is [string, string] => typeof pair[1] === 'string'),
          )
          : undefined

        combined.push({
          id,
          serverName,
          disabled: false,
          transportType: url !== undefined ? 'streamable-http' : 'stdio',
          ...(command !== undefined ? { command } : {}),
          ...(args !== undefined ? { args } : {}),
          ...(env !== undefined && Object.keys(env).length > 0 ? { env } : {}),
          ...(url !== undefined ? { url } : {}),
          ...(headers !== undefined && Object.keys(headers).length > 0 ? { headers } : {}),
        })
        existingNames.add(serverName.toLowerCase())
        existingIds.add(id)
        mcp += 1
      }
      if (mcp > 0) {
        writeMcpPatchEntries(profilePatch, combined)
      }
    } catch (error) {
      mcp = 0
      errors.push('mcp: ' + String(error))
    }
  }
  return { mcp, skills, prompts, errors }
}
