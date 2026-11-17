/** Relay 密钥与令牌身份的单文件提交，以及旧格式文件投影。 */
import { existsSync, readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { withFileLock, writeFileAtomic } from '@xpeach/xph-atomic-write'
import { deepEqualJson } from '@xpeach/xph-util-values'

/** 只对相同 relay 密钥有效的令牌身份。 */
export interface RelayTokenInfo {
  /** 已确认归属的站点令牌编号。 */
  readonly id?: number
  /** 站点显示名称，不参与归属判断。 */
  readonly name?: string
  /** 同一密钥已确认的分组集合。 */
  readonly groups?: readonly string[]
  /** 与快照密钥匹配的归属证据。 */
  readonly key?: string
}

/** 一次读取得到的完整凭据状态；修订号零表示尚未迁移旧文件。 */
export interface RelaySnapshot {
  /** 持久化格式版本；未来版本拒绝读取。 */
  readonly version: 1
  /** 在同一权威文件中单调递增的提交版本。 */
  readonly revision: number
  /** 当前中转密钥；省略表示已撤销。 */
  readonly key?: string
  /** 与当前密钥一起提交的站点身份。 */
  readonly token?: RelayTokenInfo
  /** 兼容投影尚未完成，普通读侧必须拒绝消费。 */
  readonly projectionPending: boolean
}

/** 并发变化或未完成投影均禁止依赖旧文件继续操作。 */
export class RelayStateError extends Error {
  /**
   * 创建不含凭据内容的稳定失败。
   * @param code - 需要调用方处理的失败原因。
   * @param options - 仅供宿主诊断的原始原因。
   */
  constructor(readonly code: 'credential-changed' | 'credential-write-incomplete', options?: ErrorOptions) {
    super(code === 'credential-changed'
      ? '凭据已变化，已拒绝旧操作；请重新同步。'
      : '凭据提交或兼容文件投影未完成，已停止依赖操作；请重新启动以修复投影。', options)
  }
}

/** Relay 状态的部署位置、兼容投影和锁等待策略。 */
export interface RelayStateOptions {
  /** 同一共享组所有实例使用的绝对权威文件路径。 */
  readonly filename: string
  /** 当前 profile 的旧密钥文件，仅用于初次迁移和兼容投影。 */
  readonly legacyKeyFile: string
  /** 与旧密钥同目录的旧身份文件。 */
  readonly legacyTokenFile: string
  /** 与本权威文件共用提交版本的兼容投影目录。 */
  readonly projectionDirs: readonly string[]
  /** 获取跨进程锁的最长等待时间，毫秒。 */
  readonly lockWaitMs: number
}

function normalizedKey(key: string | undefined): string {
  return (key ?? '').replace(/^(?:xpk|sk)-/u, '').trim()
}

function readOptional(filename: string): string | undefined {
  try {
    return readFileSync(filename, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

function tokenInfo(raw: unknown): RelayTokenInfo | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const fields = raw as Record<string, unknown>
  if (Object.keys(fields).some(key => !['id', 'name', 'key', 'groups'].includes(key))) return undefined
  if (fields.id !== undefined && (typeof fields.id !== 'number' || !Number.isSafeInteger(fields.id))) return undefined
  if (fields.name !== undefined && typeof fields.name !== 'string') return undefined
  if (fields.key !== undefined && (typeof fields.key !== 'string' || fields.key.length === 0)) return undefined
  const groups = fields.groups
  if (groups !== undefined && (!Array.isArray(groups) || !groups.every((group): group is string => typeof group === 'string'))) return undefined
  return {
    ...(typeof fields.id === 'number' ? { id: fields.id } : {}),
    ...(typeof fields.name === 'string' ? { name: fields.name } : {}),
    ...(typeof fields.key === 'string' ? { key: fields.key } : {}),
    ...(groups === undefined ? {} : { groups }),
  }
}

/**
 * 共享原子快照是 key/token 唯一读源，旧文件只在首次迁移时参与读取。
 * 写入采用锁内重读和比较，兼容投影失败留下可修复的显式未完成状态。
 */
export class RelayState {
  /**
   * 绑定共享状态文件和兼容投影位置。
   * @param options - 已验证的部署选项。
   */
  constructor(private readonly options: RelayStateOptions) {}

  /**
   * 读取同一修订的 key/token；不返回未完成事务中的兼容文件。
   * @returns 完整快照，或尚未迁移的有效旧二元状态。
   */
  read(): RelaySnapshot {
    const snapshot = this.readRaw()
    if (snapshot.projectionPending) throw new RelayStateError('credential-write-incomplete')
    return snapshot
  }

  /**
   * 比较调用方持有的修订与当前磁盘状态。
   * @param expected - 操作开始时的快照。
   */
  assertCurrent(expected: RelaySnapshot): void {
    if (!this.same(expected, this.read())) throw new RelayStateError('credential-changed')
  }

  /**
   * 在同一凭据修订下发布依赖状态，避免目录写入跨越另一进程的轮转。
   * @param expected - 操作开始时捕获的快照。
   * @param operation - 持锁执行的发布操作，不得再次提交 relay 状态。
   * @param signal - 等待锁的取消信号。
   * @returns 发布操作的结果。
   */
  async withCurrent<T>(expected: RelaySnapshot, operation: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    return await this.locked(async () => {
      this.assertCurrent(expected)
      const result = await operation()
      this.assertCurrent(expected)
      return result
    }, signal)
  }

  /**
   * 提交完整 key/token 二元状态；部分投影不会被读侧误认为成功。
   * @param expected - 网络操作前捕获的完整快照。
   * @param next - 同时生效的新密钥和令牌身份，空对象表示撤销。
   * @param signal - 等待文件锁时的取消信号。
   * @returns 已完成兼容投影的快照。
   */
  async commit(
    expected: RelaySnapshot,
    next: { readonly key?: string; readonly token?: RelayTokenInfo },
    signal?: AbortSignal,
  ): Promise<RelaySnapshot> {
    return await this.locked(async () => {
      this.assertCurrent(expected)
      if (expected.revision >= Number.MAX_SAFE_INTEGER) throw new RelayStateError('credential-write-incomplete')
      if (next.token !== undefined && (next.key === undefined || normalizedKey(next.token.key) !== normalizedKey(next.key))) {
        throw new RelayStateError('credential-changed')
      }
      const pending: RelaySnapshot = { version: 1, revision: expected.revision + 1, ...next, projectionPending: true }
      try {
        await writeFileAtomic(this.options.filename, JSON.stringify(pending), { mode: 0o600, dirMode: 0o700 })
        return await this.project(pending)
      } catch (cause) {
        throw new RelayStateError('credential-write-incomplete', { cause })
      }
    }, signal)
  }

  /**
   * 启动时只从权威快照修复投影，绝不将遗留文件推回快照。
   * @returns 修复后的快照；尚无权威快照时保持旧文件不变。
   */
  async repair(): Promise<RelaySnapshot> {
    return await this.locked(async () => {
      const snapshot = this.readRaw()
      if (snapshot.revision === 0) return snapshot
      try {
        const pending: RelaySnapshot = { ...snapshot, projectionPending: true }
        await writeFileAtomic(this.options.filename, JSON.stringify(pending), { mode: 0o600, dirMode: 0o700 })
        return await this.project(pending)
      } catch (cause) {
        throw new RelayStateError('credential-write-incomplete', { cause })
      }
    })
  }

  private async locked<T>(operation: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    try {
      await mkdir(dirname(this.options.filename), { recursive: true, mode: 0o700 })
      return await withFileLock(this.options.filename, operation, {
        waitMs: this.options.lockWaitMs,
        ...signal === undefined ? {} : { signal },
      })
    } catch (cause) {
      if (cause instanceof RelayStateError) throw cause
      throw new RelayStateError('credential-write-incomplete', { cause })
    }
  }

  private same(left: RelaySnapshot, right: RelaySnapshot): boolean {
    return deepEqualJson(left, right)
  }

  private readRaw(): RelaySnapshot {
    const raw = readOptional(this.options.filename)
    if (raw === undefined) {
      const sharesAuthorityDirectory = this.options.projectionDirs.some(dir => resolve(dir) === dirname(this.options.filename))
      const sharedKey = sharesAuthorityDirectory ? readOptional(join(dirname(this.options.filename), 'xpeach.key'))?.trim() : undefined
      const key = sharedKey || readOptional(this.options.legacyKeyFile)?.trim()
      const tokenFile = sharedKey ? join(dirname(this.options.filename), 'xpeach.token') : this.options.legacyTokenFile
      const tokenText = readOptional(tokenFile)
      let token: RelayTokenInfo | undefined
      try {
        token = tokenText === undefined ? undefined : tokenInfo(JSON.parse(tokenText))
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error
      }
      return { version: 1, revision: 0, ...(key ? { key } : {}),
        ...(key && token?.key !== undefined && normalizedKey(token.key) === normalizedKey(key) ? { token } : {}), projectionPending: false }
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (_error) {
      // 语法错误可能包含凭据原文，不能作为可展示的 cause 保存。
      throw new RelayStateError('credential-write-incomplete')
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new RelayStateError('credential-write-incomplete')
    const fields = parsed as Record<string, unknown>
    const token = fields.token === undefined ? undefined : tokenInfo(fields.token)
    if (Object.keys(fields).some(key => !['version', 'revision', 'key', 'token', 'projectionPending'].includes(key))
      || fields.version !== 1 || typeof fields.revision !== 'number' || !Number.isSafeInteger(fields.revision) || fields.revision < 1
      || typeof fields.projectionPending !== 'boolean'
      || (fields.key !== undefined && (typeof fields.key !== 'string' || fields.key.length === 0))
      || (fields.token !== undefined && (token === undefined || typeof fields.key !== 'string' || normalizedKey(token.key) !== normalizedKey(fields.key)))) {
      throw new RelayStateError('credential-write-incomplete')
    }
    return { version: 1, revision: fields.revision, ...(typeof fields.key === 'string' ? { key: fields.key } : {}),
      ...(token === undefined ? {} : { token }), projectionPending: fields.projectionPending }
  }

  private async project(snapshot: RelaySnapshot): Promise<RelaySnapshot> {
    const targets = new Set(this.options.projectionDirs.filter(dir => existsSync(dir)))
    const keyFiles = new Set([this.options.legacyKeyFile, ...[...targets].map(dir => join(dir, 'xpeach.key'))])
    const tokenFiles = new Set([this.options.legacyTokenFile, ...[...targets].map(dir => join(dir, 'xpeach.token'))])
    for (const path of keyFiles) await writeFileAtomic(path, snapshot.key === undefined ? '' : snapshot.key + '\n', { mode: 0o600, dirMode: 0o700 })
    for (const path of tokenFiles) await writeFileAtomic(path, JSON.stringify(snapshot.token ?? {}), { mode: 0o600, dirMode: 0o700 })
    const committed: RelaySnapshot = { ...snapshot, projectionPending: false }
    await writeFileAtomic(this.options.filename, JSON.stringify(committed), { mode: 0o600, dirMode: 0o700 })
    return committed
  }
}
