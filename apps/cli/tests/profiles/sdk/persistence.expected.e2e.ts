/** 验证正式 sdk-minimal profile 的日志落盘及跨进程恢复。 */
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DeepSeekHarness } from '@xpeach/xph-sdk-client'
import { parseSessionLog } from '@xpeach/xph-llm-replay'
import { describe, expect, it } from 'vitest'
import { profileEnvironment } from './fixtures/profile-environment.ts'
import { messagesResponse } from './fixtures/messages-response.ts'

const dshBin = fileURLToPath(new URL('../../../lib/bin.js', import.meta.url))

describe.skipIf(!existsSync(dshBin))('sdk-minimal 持久化与恢复', () => {
  it('重启后恢复原会话，后续请求包含已提交历史且日志保留两个完整回合', async (test) => {
    const root = await mkdtemp(join(tmpdir(), 'sdk-minimal-persistence-'))
    test.onTestFinished(async () => { await rm(root, { recursive: true, force: true }) })
    const requests: string[] = []
    const server = createServer((request, response) => {
      let body = ''
      request.setEncoding('utf8')
      request.on('data', (chunk: string) => { body += chunk })
      request.on('end', () => {
        requests.push(body)
        response.writeHead(200, { 'content-type': 'text/event-stream' })
        response.end(messagesResponse({ type: 'text', text: `已完成第${requests.length}次请求` }, 'end_turn'))
      })
    })
    test.onTestFinished(async () => {
      await new Promise<void>((resolve, reject) => server.close((error) => {
        if (error === undefined) resolve()
        else reject(error)
      }))
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('本地模型服务未分配 TCP 地址')
    const home = join(root, 'home')
    const patch = join(root, 'local-model.patch.yml')
    await writeFile(patch, JSON.stringify([{ id: 'session-log-deepseek', config: { enabled: false } }]))
    const env = profileEnvironment(root, `http://127.0.0.1:${address.port}`)
    Object.assign(env, { HOME: root, XPH_HOME: home })
    const options = { dshBin, profile: 'sdk-minimal', cwd: root, processCwd: root, dshHome: home, env, patches: [patch] }
    const sessionId = 'sdk-minimal-persisted'
    await using first = new DeepSeekHarness(options)
    const abortFirst = (): void => { void first.close() }
    test.signal.addEventListener('abort', abortFirst, { once: true })
    test.onTestFinished(() => { test.signal.removeEventListener('abort', abortFirst) })
    expect((await first.run('保留这条首轮输入。', { sessionId })).finishReason).toBe('completed')
    await first.close()

    const sessionFiles = (await readdir(join(home, 'sessions'), { recursive: true }))
      .filter(path => /session\.v\d+\.jsonl$/u.test(path))
    expect(sessionFiles).toHaveLength(1)
    const logPath = join(home, 'sessions', sessionFiles[0]!)
    const firstLog = await readFile(logPath, 'utf8')
    expect(parseSessionLog(firstLog).filter(event => event.type === 'turn/end')).toHaveLength(1)

    await using second = new DeepSeekHarness(options)
    const abortSecond = (): void => { void second.close() }
    test.signal.addEventListener('abort', abortSecond, { once: true })
    test.onTestFinished(() => { test.signal.removeEventListener('abort', abortSecond) })
    const restored = await second.resumeSession(sessionId)
    expect(restored.id).toBe(sessionId)
    expect((await restored.run('继续这个已恢复的会话。')).finishReason).toBe('completed')
    await second.close()
    expect(requests).toHaveLength(2)
    expect(requests[1]).toContain('保留这条首轮输入。')
    expect(requests[1]).toContain('已完成第1次请求')
    const events = parseSessionLog(await readFile(logPath, 'utf8'))
    expect(events.filter(event => event.type === 'turn/start')).toHaveLength(2)
    expect(events.filter(event => event.type === 'turn/end')).toHaveLength(2)
    expect(events.filter(event => event.type === 'assistant/message')).toHaveLength(2)
    expect(events.filter(event => event.type === 'user/message' && event.data.source.kind === 'user')).toHaveLength(2)
  })
})
