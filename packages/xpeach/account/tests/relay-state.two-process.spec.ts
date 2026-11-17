/** R3 独立进程屏障验收；子进程要求主代理已生成当前 lib/types/relay-state.js。 */
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { RelayState } from '../src/relay-state.ts'
import type { RelayStateOptions } from '../src/relay-state.ts'
import {
  allDiskFiles, expectedDisk, identityA, identityB, observedDisk, optionsFor, prepareDirectories,
} from './relay-state/fixtures/state-files.ts'

const artifact = fileURLToPath(new URL('../lib/types/relay-state.js', import.meta.url))
const worker = fileURLToPath(new URL('./relay-state/fixtures/relay-worker.ts', import.meta.url))
const roots: string[] = []
const children: Peer[] = []

interface Message {
  phase: string
  revision?: number
  code?: string
  message?: string
}

interface Exit {
  code: number | null
  signal: NodeJS.Signals | null
  spawnError: Error | undefined
}

class Peer {
  readonly child: ChildProcess
  readonly closed: Promise<Exit>
  private readonly messages: Message[] = []
  private readonly waiting: { phase: string; resolve: (value: Message) => void; reject: (error: Error) => void }[] = []
  private outcome: Exit | undefined
  private failure: Error | undefined
  private stderr = ''

  constructor(root: string, options: RelayStateOptions, mode: 'stale' | 'rotate' | 'fail-held') {
    // 不继承账号变量、NODE_OPTIONS 或任何用户 home。
    const env: NodeJS.ProcessEnv = { HOME: root, USERPROFILE: root, TMPDIR: root, TMP: root, TEMP: root }
    for (const name of ['PATH', 'SystemRoot', 'WINDIR']) {
      if (process.env[name] !== undefined) env[name] = process.env[name]
    }
    this.child = spawn(process.execPath, [worker, artifact, JSON.stringify(options), mode], {
      cwd: root, env, stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    })
    let spawnError: Error | undefined
    this.child.once('error', (error) => { spawnError = error })
    this.child.stderr?.on('data', (chunk: Buffer) => { this.stderr = (this.stderr + chunk.toString()).slice(-8192) })
    this.child.on('message', (value: unknown) => {
      if (typeof value !== 'object' || value === null || !('phase' in value) || typeof value.phase !== 'string') {
        this.fail(new Error('子进程发送了非法屏障消息。'))
        return
      }
      const message: Message = {
        phase: value.phase,
        ...'revision' in value && typeof value.revision === 'number' ? { revision: value.revision } : {},
        ...'code' in value && typeof value.code === 'string' ? { code: value.code } : {},
        ...'message' in value && typeof value.message === 'string' ? { message: value.message } : {},
      }
      if (message.phase === 'failure') {
        this.fail(new Error(message.message ?? '子进程报告失败。'))
        return
      }
      const index = this.waiting.findIndex(waiter => waiter.phase === message.phase)
      if (index === -1) this.messages.push(message)
      else this.waiting.splice(index, 1)[0]!.resolve(message)
    })
    this.closed = new Promise((resolve) => {
      this.child.once('close', (code, signal) => {
        const outcome = { code, signal, spawnError }
        this.outcome = outcome
        this.fail(new Error(`子进程已退出：code=${String(code)}，signal=${String(signal)}；${this.stderr}`))
        resolve(outcome)
      })
    })
  }

  wait(phase: string): Promise<Message> {
    const index = this.messages.findIndex(message => message.phase === phase)
    if (index !== -1) return Promise.resolve(this.messages.splice(index, 1)[0]!)
    if (this.failure !== undefined) return Promise.reject(this.failure)
    return new Promise((resolve, reject) => { this.waiting.push({ phase, resolve, reject }) })
  }

  async release(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.child.send({ action: 'continue' }, (error) => {
        if (error === null) resolve()
        else reject(error)
      })
    })
  }

  async expectCleanExit(): Promise<void> {
    const outcome = await this.closed
    expect(outcome.spawnError, this.stderr).toBeUndefined()
    expect(outcome.signal, this.stderr).toBeNull()
    expect(this.child.killed, this.stderr).toBe(false)
    expect(outcome.code, this.stderr).toBe(0)
  }

  async dispose(): Promise<void> {
    if (this.outcome === undefined) this.child.kill('SIGTERM')
    await this.closed
  }

  private fail(error: Error): void {
    this.failure ??= error
    for (const waiter of this.waiting.splice(0)) waiter.reject(error)
  }
}

afterEach(async () => {
  await Promise.all(children.splice(0).map(child => child.dispose()))
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

async function fixture(): Promise<{ root: string; options: RelayStateOptions }> {
  const root = await mkdtemp(join(tmpdir(), 'xph-relay-two-process-'))
  roots.push(root)
  const options = optionsFor(root)
  await prepareDirectories(options)
  const state = new RelayState(options)
  await state.commit(state.read(), identityA)
  return { root, options }
}

function start(root: string, options: RelayStateOptions, mode: 'stale' | 'rotate' | 'fail-held'): Peer {
  const peer = new Peer(root, options, mode)
  children.push(peer)
  return peer
}

// 夹具不使用 tsx/根 paths map；缺少构建产物时明确跳过，不算完成进程验收。
describe.skipIf(!existsSync(artifact))('Relay 独立进程（需要当前 build:artifacts）', () => {
  it('旧进程计算在新提交之后返回时仍由锁内CAS拒绝，不覆盖任一文件', async () => {
    const { root, options } = await fixture()
    const stale = start(root, options, 'stale')
    const rotating = start(root, options, 'rotate')
    expect(await stale.wait('captured')).toMatchObject({ revision: 1 })
    expect(await rotating.wait('captured')).toMatchObject({ revision: 1 })
    await rotating.release()
    expect(await rotating.wait('done')).toMatchObject({ revision: 2 })
    await rotating.expectCleanExit()
    const committed = { version: 1 as const, revision: 2, ...identityB, projectionPending: false }
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, committed))
    const beforeLateCalculation = await allDiskFiles(root)
    await stale.release()
    expect(await stale.wait('done')).toMatchObject({ code: 'credential-changed' })
    await stale.expectCleanExit()
    expect(await allDiskFiles(root)).toEqual(beforeLateCalculation)
    expect(new RelayState(options).read()).toEqual(committed)
  })

  it('持锁进程操作异常后释放锁，另一进程完成等待中的提交并可重开', async () => {
    const { root, options } = await fixture()
    const holder = start(root, options, 'fail-held')
    expect(await holder.wait('captured')).toMatchObject({ revision: 1 })
    await holder.release()
    await holder.wait('held')
    expect(await readFile(`${options.filename}.lock`, 'utf8')).toBe(`${holder.child.pid}\n`)
    const rotating = start(root, options, 'rotate')
    expect(await rotating.wait('captured')).toMatchObject({ revision: 1 })
    await rotating.release()
    await rotating.wait('attempting')
    expect(JSON.parse(await readFile(options.filename, 'utf8'))).toEqual({ version: 1, revision: 1, ...identityA, projectionPending: false })
    expect(await readFile(`${options.filename}.lock`, 'utf8')).toBe(`${holder.child.pid}\n`)
    await holder.release()
    expect(await holder.wait('done')).toMatchObject({ code: 'synthetic-operation-failed' })
    expect(await rotating.wait('done')).toMatchObject({ revision: 2 })
    await Promise.all([holder.expectCleanExit(), rotating.expectCleanExit()])
    const state = new RelayState(options)
    const committed = { version: 1 as const, revision: 2, ...identityB, projectionPending: false }
    expect(state.read()).toEqual(committed)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, committed))
    const reopened = await state.commit(committed, identityA)
    expect(reopened.revision).toBe(3)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, reopened))
  })
})
