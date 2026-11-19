/** Node 直接运行的 IPC 夹具；只导入显式构建产物，不启动 Cordis。 */
import { pathToFileURL } from 'node:url'
import type { RelayState, RelayStateOptions } from '../../../src/relay-state.ts'
import { identityA, identityB } from './state-files.ts'

async function send(phase: string, details: { revision?: number; code?: string; message?: string } = {}): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (process.send === undefined) {
      reject(new Error('进程夹具必须通过 IPC 启动。'))
      return
    }
    process.send({ phase, ...details }, (error) => {
      if (error === null) resolve()
      else reject(error)
    })
  })
}

function command(): Promise<void> {
  return new Promise((resolve, reject) => {
    const disconnected = () => {
      process.off('message', received)
      reject(new Error('父进程在释放屏障前断开连接。'))
    }
    const received = (value: unknown) => {
      process.off('disconnect', disconnected)
      if (typeof value === 'object' && value !== null && 'action' in value && value.action === 'continue') resolve()
      else reject(new Error('进程夹具收到非法屏障指令。'))
    }
    process.once('message', received)
    process.once('disconnect', disconnected)
  })
}

async function run(): Promise<void> {
  const [artifactPath, optionsText, mode] = process.argv.slice(2)
  if (artifactPath === undefined || optionsText === undefined) throw new Error('缺少构建产物或测试目录参数。')
  const options = JSON.parse(optionsText) as RelayStateOptions
  const runtime = await import(pathToFileURL(artifactPath).href) as { RelayState: typeof RelayState }
  const state = new runtime.RelayState(options)
  const expected = state.read()
  const proceed = command()
  await send('captured', { revision: expected.revision })
  await proceed

  if (mode === 'stale') {
    try {
      await state.commit(expected, identityA)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'credential-changed') {
        await send('done', { code: error.code })
        return
      }
      throw error
    }
    throw new Error('旧计算意外覆盖了新凭据。')
  }
  if (mode === 'rotate') {
    const committing = state.commit(expected, identityB)
    await send('attempting')
    const committed = await committing
    await send('done', { revision: committed.revision })
    return
  }
  if (mode === 'fail-held') {
    const failure = new Error('合成持锁发布失败')
    try {
      await state.withCurrent(expected, async () => {
        const release = command()
        await send('held')
        await release
        throw failure
      })
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'credential-write-incomplete' && error.cause === failure) {
        await send('done', { code: 'synthetic-operation-failed' })
        return
      }
      throw error
    }
    throw new Error('合成持锁操作未按预期失败。')
  }
  throw new Error('进程夹具模式不受支持。')
}

try {
  await run()
} catch (error) {
  process.exitCode = 1
  const message = error instanceof Error ? error.stack ?? error.message : String(error)
  process.stderr.write(`Relay 状态进程验收失败：${message}\n`)
  if (process.connected) await send('failure', { message })
} finally {
  if (process.connected) process.disconnect()
}
