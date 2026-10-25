/**
 * ChatGPT desktop local-data reader. The app's storage is not a published
 * format, so this module discovers its SQLite databases and reconstructs
 * threads with a schema-adaptive reader: it finds message tables (role +
 * content columns), groups rows by conversation/thread columns, reads titles
 * from a conversation table when present, and normalizes common spellings
 * (Core Data Z-prefixed columns, JSON content parts, boolean is_user).
 */
import { execFileSync } from 'node:child_process'
import { type Dirent, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Decoded message row from a local ChatGPT SQLite database. */
export interface DbMessage {
  readonly role: 'user' | 'assistant'
  readonly text: string
  readonly time: number
}

/** Reconstructed conversation thread from a local ChatGPT SQLite database. */
export interface DbThread {
  readonly key: string
  readonly title: string
  readonly createdAt: number
  readonly messages: readonly DbMessage[]
}

const DB_EXTENSIONS = /\.(db|sqlite|sqlite3)$/i
const UNPARSED = Symbol('unparsed')

/** Quote a SQLite table or column identifier with doubled embedded quotes. */
function quoteIdent(id: string): string {
  return `"${id.replaceAll('"', '""')}"`
}

/** Run one read-only SQLite query and parse JSON output. */
function query(db: string, sql: string): unknown[] {
  let raw = ''
  try {
    raw = execFileSync('sqlite3', ['-readonly', '-json', db, sql], {
      encoding: 'utf8', timeout: 15_000, maxBuffer: 32 * 1024 * 1024,
    })
  } catch (_err) { return [] }
  const out = raw.trim()
  if (out.length === 0) return []
  let parsed: unknown = null
  try { parsed = JSON.parse(out) } catch (_err) { return [] }
  return Array.isArray(parsed) ? parsed : []
}

/** Tables and their column names (lowercased, Z prefix stripped). */
function schema(db: string): { table: string; columns: Map<string, string> }[] {
  const tables = query(db, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .map(row => (row as { name?: unknown }).name)
    .filter((name): name is string => typeof name === 'string')
  const out: { table: string; columns: Map<string, string> }[] = []
  for (const table of tables) {
    const info = query(db, 'PRAGMA table_info(' + quoteIdent(table) + ')')
    const columns = new Map<string, string>()
    for (const row of info) {
      const name = (row as { name?: unknown }).name
      if (typeof name !== 'string') continue
      const normalized = name.toLowerCase().replace(/^z_?/, '')
      columns.set(normalized, name)
    }
    out.push({ table, columns })
  }
  return out
}

/** First column matching any of the patterns. */
function pick(columns: Map<string, string>, patterns: readonly RegExp[]): string | undefined {
  for (const pattern of patterns) {
    for (const [normalized, original] of columns) {
      if (pattern.test(normalized)) return original
    }
  }
  return undefined
}

/** Extract readable text from a content cell (plain, JSON parts, or blocks). */
function contentText(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      let parsed: unknown = UNPARSED
      try { parsed = JSON.parse(trimmed) } catch (_err) { /* plain text that looks like JSON */ }
      if (parsed !== UNPARSED) return contentText(parsed)
    }
    return trimmed
  }
  if (Array.isArray(value)) return value.map(item => contentText(item)).filter(Boolean).join('\n').trim()
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['parts', 'text', 'content', 'body', 'value']) {
      if (record[key] !== undefined) {
        const text = contentText(record[key])
        if (text.length > 0) return text
      }
    }
  }
  return ''
}

/** Normalize a role cell. */
function roleOf(value: unknown): 'user' | 'assistant' | undefined {
  if (typeof value === 'boolean') return value ? 'user' : 'assistant'
  if (typeof value === 'number') return value === 1 ? 'user' : value === 0 ? 'assistant' : undefined
  if (typeof value !== 'string') return undefined
  const role = value.toLowerCase()
  if (role === 'user' || role === 'human' || role === 'customer') return 'user'
  if (role === 'assistant' || role === 'ai' || role === 'bot' || role === 'model' || role === 'chatgpt') return 'assistant'
  return undefined
}

/** Normalize a timestamp cell (seconds, milliseconds, or Core Data epoch). */
function timeOf(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(n) || n <= 0) return 0
  if (n > 1e14) return Math.floor(n / 1000)
  if (n > 1e11) return Math.floor(n)
  if (n > 1e9) return Math.floor(n * 1000)
  // Core Data stores seconds since 2001-01-01.
  return Math.floor((n + 978_307_200) * 1000)
}

/**
 * Decode one SQLite database into threads.
 *
 * @param path - filesystem path to the SQLite database file.
 * @returns reconstructed conversation threads found in the database.
 */
export function decodeChatgptDatabase(path: string): DbThread[] {
  if (!existsSync(path)) return []
  const tables = schema(path)
  // Title table: a table with a title/name column and an id column.
  const titleTable = tables.find(table => table.columns.has('title') || table.columns.has('name'))
  const titleIdColumn = titleTable === undefined ? undefined
    : pick(titleTable.columns, [/^id$/, /(conversation|thread|chat).*id/, /^pk$/])
  const titles = new Map<string, string>()
  if (titleTable !== undefined && titleIdColumn !== undefined) {
    const titleColumn = titleTable.columns.get('title') ?? titleTable.columns.get('name')
    if (titleColumn !== undefined) {
      for (const row of query(path, 'SELECT ' + quoteIdent(titleIdColumn) + ' AS id, ' + quoteIdent(titleColumn) + ' AS title FROM ' + quoteIdent(titleTable.table))) {
        const record = row as Record<string, unknown>
        const id = record['id']
        const title = record['title']
        if ((typeof id === 'string' || typeof id === 'number') && typeof title === 'string' && title.trim().length > 0) {
          titles.set(String(id), title.trim())
        }
      }
    }
  }
  const threads: DbThread[] = []
  for (const table of tables) {
    const roleColumn = pick(table.columns, [/^(role|author|sender|from|is_user|isuser|type)$/])
    const contentColumn = pick(table.columns, [/^(content|text|body|message|parts|data)$/])
    if (roleColumn === undefined || contentColumn === undefined) continue
    const idColumn = pick(table.columns, [/^id$/, /^pk$/])
    const groupColumn = pick(table.columns, [/(conversation|thread|chat|session).*(id)?/, /^conversation$/, /^thread$/])
    const timeColumn = pick(table.columns, [/^(created|timestamp|time|date|created_at|updated_at)/])
    const select = ['rowid AS __rowid']
    const aliases = new Map<string, string>()
    for (const [alias, column] of [['role', roleColumn], ['content', contentColumn], ['id', idColumn], ['group', groupColumn], ['time', timeColumn]] as const) {
      if (column !== undefined) { select.push(quoteIdent(column) + ' AS ' + quoteIdent(alias)); aliases.set(alias, column) }
    }
    if (!aliases.has('role') || !aliases.has('content')) continue
    const orderBy = aliases.has('time') ? '"time"' : '__rowid'
    const rows = query(path, 'SELECT ' + select.join(', ') + ' FROM ' + quoteIdent(table.table) + ' ORDER BY ' + orderBy)
    const grouped = new Map<string, DbMessage[]>()
    for (const row of rows) {
      const record = row as Record<string, unknown>
      const role = roleOf(record['role'])
      const text = contentText(record['content'])
      if (role === undefined || text.length === 0) continue
      const rawGroup = record['group']
      const group = typeof rawGroup === 'string' || typeof rawGroup === 'number' ? String(rawGroup) : 'default'
      const time = timeOf(record['time'])
      const list = grouped.get(group) ?? []
      list.push({ role, text, time })
      grouped.set(group, list)
    }
    for (const [group, messages] of grouped) {
      if (!messages.some(message => message.role === 'user')) continue
      const createdAt = messages[0]?.time ?? Date.now()
      const title = titles.get(group) ?? (messages.find(message => message.role === 'user')?.text ?? 'ChatGPT thread').slice(0, 80)
      threads.push({ key: 'chatgpt-db:' + path + ':' + group, title: title.slice(0, 80), createdAt, messages })
    }
    // One message table is enough; later tables are usually indexes/metadata.
    break
  }
  return threads
}

/**
 * Discover SQLite files under ChatGPT desktop data directories across macOS, Windows, and Linux.
 *
 * @param home - user home directory path.
 * @returns discovered SQLite database file paths.
 */
export function chatgptDatabaseFiles(home: string): string[] {
  const roots = [
    join(home, 'Library', 'Application Support', 'com.openai.chat'),
    join(home, 'Library', 'Application Support', 'ChatGPT'),
    join(home, 'Library', 'Application Support', 'OpenAI', 'ChatGPT'),
    join(home, 'Library', 'Containers', 'com.openai.chat', 'Data', 'Library', 'Application Support'),
    join(home, 'AppData', 'Roaming', 'ChatGPT'),
    join(home, 'AppData', 'Local', 'ChatGPT'),
    join(home, '.config', 'ChatGPT'),
    join(home, '.local', 'share', 'ChatGPT'),
  ]
  const packagesDir = join(home, 'AppData', 'Local', 'Packages')
  let packageEntries: Dirent[] = []
  try { packageEntries = readdirSync(packagesDir, { withFileTypes: true }) } catch (_err) { /* no Windows Packages directory */ }
  for (const entry of packageEntries) {
    if (entry.isDirectory() && entry.name.startsWith('OpenAI.ChatGPT-Desktop_')) {
      roots.push(join(packagesDir, entry.name, 'LocalCache', 'Roaming', 'ChatGPT'))
    }
  }
  const out: string[] = []
  const walk = (dir: string, depth: number): void => {
    if (depth > 4) return
    let entries: Dirent[]
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch (_err) { return }
    for (const entry of entries) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) { walk(path, depth + 1); continue }
      if (DB_EXTENSIONS.test(entry.name)) out.push(path)
    }
  }
  for (const root of roots) walk(root, 0)
  return out
}
