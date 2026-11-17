/** 正式 SDK profile 在独立进程中恢复提醒，投递回原会话并保留持久收据。 */
import { createServer } from 'node:http'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { zstdDecompressSync } from 'node:zlib'
import { DeepSeekHarness } from '@xpeach/xph-sdk-client'
import { parseSessionLog } from '@xpeach/xph-llm-replay'
import { scanZstdFrames } from '@xpeach/xph-session-persistence-jsonl/src/zstd.ts'
import { expect, it } from 'vitest'
import { profileEnvironment } from './fixtures/profile-environment.ts'
import { messagesResponse } from './fixtures/messages-response.ts'

it('正式 SDK 重启后投递到期提醒，下一次启动不重复投递', async (test) => {
  const root = await mkdtemp(join(tmpdir(), 'sdk-schedule-recovery-'))
  test.onTestFinished(() => rm(root, { recursive: true, force: true }))
  const requests: string[] = []
  const model = createServer((request, response) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => { body += chunk })
    request.on('end', () => {
      requests.push(body)
      const create = requests.length === 1
      response.writeHead(200, { 'content-type': 'text/event-stream' })
      response.end(messagesResponse(create ? {
        type: 'tool_use', id: 'create-reminder', name: 'schedule_create',
        input: { prompt: '跨进程保留的提醒', title: '恢复提醒', after_seconds: 60 },
      } : { type: 'text', text: '已完成' }, create ? 'tool_use' : 'end_turn'))
    })
  })
  test.onTestFinished(() => new Promise<void>((resolve, reject) => model.close((error) => {
    if (error === undefined) resolve()
    else reject(error)
  })))
  await new Promise<void>(resolve => model.listen(0, '127.0.0.1', resolve))
  const address = model.address()
  if (address === null || typeof address === 'string') throw new Error('本地模型端口未就绪')
  const clock = join(root, 'clock.mjs')
  await writeFile(clock, `export const name = 'sdk-schedule-clock';
export function apply(ctx) {
  ctx.effect(() => {
    const original = Date.now;
    const now = Number(process.env.XPH_TEST_SCHEDULE_NOW);
    Date.now = () => now;
    return () => { Date.now = original; };
  });
}
`)
  const patch = join(root, 'fixture.patch.yml')
  await writeFile(patch, JSON.stringify([
    { id: 'session-log-deepseek', config: { enabled: false } },
    { id: 'session-title-llm', disabled: true },
    { insert: [{ id: 'sdk-schedule-clock', name: pathToFileURL(clock).href }] },
  ]))
  const home = join(root, 'home')
  const environment = profileEnvironment(root, `http://127.0.0.1:${address.port}`)
  const options = (now: number) => ({
    dshBin: fileURLToPath(new URL('../../../lib/bin.js', import.meta.url)),
    profile: 'sdk', cwd: root, processCwd: root, dshHome: home, patches: [patch],
    env: { ...environment, HOME: root, XPH_HOME: home, XPH_TEST_SCHEDULE_NOW: String(now) },
  })
  const start = Date.parse('2030-01-01T00:00:00Z')
  const id = 'sdk-scheduled-original'
  const own = (harness: DeepSeekHarness): DeepSeekHarness => {
    const abort = (): void => { void harness.close() }
    test.signal.addEventListener('abort', abort, { once: true })
    test.onTestFinished(async () => {
      test.signal.removeEventListener('abort', abort)
      await harness.close()
    })
    return harness
  }
  const first = own(new DeepSeekHarness(options(start)))
  expect((await first.run('创建一分钟后的提醒', { sessionId: id })).finishReason).toBe('completed')
  expect(requests).toHaveLength(2)
  await first.close()

  const second = own(new DeepSeekHarness(options(start + 61_000)))
  await second.start()
  await expect.poll(() => requests.length).toBe(3)
  await second.client.request('session/wait', { sessionId: id })
  expect(requests[2]).toContain('跨进程保留的提醒')
  expect(requests[2]).toContain('创建一分钟后的提醒')
  await second.close()

  const third = own(new DeepSeekHarness(options(start + 120_000)))
  const restored = await third.resumeSession(id)
  expect((await restored.run('确认提醒已经完成')).finishReason).toBe('completed')
  await third.close()
  expect(requests).toHaveLength(4)
  const logs = (await readdir(join(home, 'sessions'), { recursive: true }))
    .filter(path => /session\.v\d+\.jsonl(?:\.zstd)?$/u.test(path))
  expect(logs).toHaveLength(1)
  const log = await readFile(join(home, 'sessions', logs[0]!))
  let decoded = log
  if (logs[0]!.endsWith('.zstd')) {
    const { frames, tornStart } = scanZstdFrames(log)
    expect(tornStart).toBeUndefined()
    decoded = Buffer.concat(frames.map(({ start, end }) => zstdDecompressSync(log.subarray(start, end))))
  }
  const events = parseSessionLog(decoded.toString('utf8'))
  expect(events.filter(event => event.type === 'user/message' && event.data.source.kind === 'schedule')).toHaveLength(1)
  expect(events.filter(event => event.type === 'turn/end')).toHaveLength(3)
})
