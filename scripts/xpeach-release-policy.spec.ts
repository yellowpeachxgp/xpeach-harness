/** 验证发布拒绝已有目标、检查失败及不完整平台构建。 */
import { execFile } from 'node:child_process'
import { once } from 'node:events'
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import yaml from 'js-yaml'
import { expect, it, onTestFinished, vi } from 'vitest'
import { assertXPeachTagAvailable } from './release/assert-xpeach-tag-available.ts'

const commit = '1234567890abcdef1234567890abcdef12345678'
const options = { repository: 'fixture/repository', version: '1.2.3-alpha', ref: 'refs/heads/alpha', commit, token: 'synthetic' }

function requestUrl(value: Parameters<typeof fetch>[0]): string {
  return typeof value === 'string' ? value : value instanceof URL ? value.href : value.url
}

it.each([false, true])('原生 Node 发布检查入口使用本地响应，已有 Release=%s', async (existing) => {
  const home = await mkdtemp(join(tmpdir(), 'xpeach-release-check-'))
  onTestFinished(() => rm(home, { recursive: true, force: true }))
  const paths: string[] = []
  const server = createServer((request, response) => {
    paths.push(request.url ?? '')
    response.writeHead(existing ? 200 : 404, { 'Content-Type': 'application/json' })
    response.end('{}')
  })
  onTestFinished(() => new Promise<void>((done, reject) => {
    server.close((error) => { if (error === undefined) done(); else reject(error) })
  }))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('本地响应服务没有端口')
  const running = promisify(execFile)(process.execPath, [resolve(import.meta.dirname, 'release/assert-xpeach-tag-available.ts')], {
    cwd: resolve(import.meta.dirname, '..'),
    env: { PATH: process.env.PATH, HOME: home, USERPROFILE: home,
      GITHUB_API_URL: `http://127.0.0.1:${address.port}`, GITHUB_REPOSITORY: options.repository,
      XPEACH_RELEASE_VERSION: options.version, GITHUB_REF: options.ref, GH_TOKEN: options.token },
    timeout: 10_000,
  })
  if (existing) {
    await expect(running).rejects.toMatchObject({ code: 1, killed: false, signal: null })
    await expect(running).rejects.toThrow('已存在')
  } else await expect(running).resolves.toMatchObject({ stderr: '' })
  expect(paths.length).toBe(existing ? 1 : 2)
})

it('两个远端目标均不存在才允许分支发布', async () => {
  const request = vi.fn<typeof fetch>().mockImplementation(async () => new Response('', { status: 404 }))
  await assertXPeachTagAvailable({ ...options, request })
  expect(request.mock.calls.map(([url]) => requestUrl(url))).toEqual([
    'https://api.github.com/repos/fixture/repository/releases/tags/v1.2.3-alpha',
    'https://api.github.com/repos/fixture/repository/git/ref/tags/v1.2.3-alpha',
  ])
})

it.each(['release', 'tag'])('已有 %s 时拒绝，且所有请求均只读', async (existing) => {
  const request = vi.fn<typeof fetch>().mockImplementation(async url =>
    new Response('{}', { status: (requestUrl(url).includes('/releases/') ? existing === 'release' : existing === 'tag') ? 200 : 404 }))
  await expect(assertXPeachTagAvailable({ ...options, request })).rejects.toThrow('已存在')
  expect(request.mock.calls.every(([, init]) => init?.method === undefined)).toBe(true)
})

it.each([401, 403, 429, 500])('HTTP %i 的不确定状态拒绝发布', async (status) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status }))
  await expect(assertXPeachTagAvailable({ ...options, request })).rejects.toThrow(`HTTP ${status}`)
})

it('网络失败保留原因并拒绝发布', async () => {
  const cause = new Error('合成断网')
  const request = vi.fn<typeof fetch>().mockRejectedValue(cause)
  await expect(assertXPeachTagAvailable({ ...options, request })).rejects.toMatchObject({ cause })
})

it.each(['refs/heads/main', 'refs/heads/feature', 'refs/tags/v1.2.4-alpha'])('引用 %s 与版本不符时不访问网络', async (ref) => {
  const request = vi.fn<typeof fetch>()
  await expect(assertXPeachTagAvailable({ ...options, ref, request })).rejects.toThrow('不一致')
  expect(request).not.toHaveBeenCalled()
})

it.each([false, true])('标签触发校验原标签的提交，注释标签=%s', async (annotated) => {
  const request = vi.fn<typeof fetch>().mockImplementation(async (url) => {
    if (requestUrl(url).includes('/releases/')) return new Response('', { status: 404 })
    const indirect = annotated && requestUrl(url).includes('/git/ref/')
    return Response.json({ object: { type: indirect ? 'tag' : 'commit', sha: indirect ? 'a'.repeat(40) : commit } })
  })
  await assertXPeachTagAvailable({ ...options, ref: 'refs/tags/v1.2.3-alpha', request })
  expect(request).toHaveBeenCalledTimes(annotated ? 3 : 2)
})

it.each(['missing', 'different', 'malformed'])('触发标签 %s 时拒绝发布', async (problem) => {
  const request = vi.fn<typeof fetch>().mockImplementation(async (url) => {
    if (requestUrl(url).includes('/releases/') || problem === 'missing') return new Response('', { status: 404 })
    return Response.json(problem === 'malformed' ? {} : { object: { type: 'commit', sha: 'a'.repeat(40) } })
  })
  await expect(assertXPeachTagAvailable({ ...options, ref: 'refs/tags/v1.2.3-alpha', request })).rejects.toThrow('停止发布')
})

interface Step { readonly name?: string; readonly run?: string; readonly env?: Record<string, string> }
interface Job { readonly needs?: string | string[]; readonly if?: string; readonly steps: readonly Step[] }
const workflow = yaml.load(readFileSync(resolve(import.meta.dirname, '../.github/workflows/xpeach-release.yml'), 'utf8')) as { jobs: Record<string, Job> }

it('发布等待验收及完整平台矩阵成功，任一失败都不发布', () => {
  expect(workflow.jobs.release?.needs).toEqual(['version', 'acceptance', 'build'])
  expect(workflow.jobs.release?.if?.replace(/\s+/gu, ' ').trim())
    .toBe("needs.version.result == 'success' && needs.acceptance.result == 'success' && needs.build.result == 'success'")
  expect(workflow.jobs.build?.needs).toEqual(['version', 'acceptance'])
  const acceptance = workflow.jobs.acceptance?.steps.map(step => step.run ?? '').join('\n')
  for (const required of ['build:official', 'lint:contracts-ready', 'doc-sync', 'hygiene', 'snapshots/sdk/sdk.snapshot.ts', 'sdk-restart']) {
    expect(acceptance).toContain(required)
  }
})

it('发布不删除或覆盖已有目标，原子创建新标签并验证标签后创建 Release', () => {
  const steps = workflow.jobs.release!.steps
  const script = steps.map(step => step.run ?? '').join('\n')
  expect(script).not.toMatch(/release\s+delete|--cleanup-tag|--clobber|git\s+tag\s+-(?:d|f)/u)
  expect(script).toContain('git/refs')
  expect(script).toContain('--verify-tag')
  expect(script).toContain('--draft --verify-tag')
  expect(script.indexOf('--draft=false')).toBeGreaterThan(script.indexOf('release upload'))
  expect(script).toContain('assert-xpeach-tag-available.ts')
  const counter = steps.findIndex(step => step.name === 'Commit the bumped counter')
  expect(steps.findIndex(step => step.run?.includes('assert-xpeach-tag-available.ts'))).toBeLessThan(counter)
  expect(workflow.jobs.version!.steps.some(step => step.run?.includes('assert-xpeach-tag-available.ts'))).toBe(true)
})

// 发布脚本使用 GitHub 的 Bash runner；Windows 的原生 Node 入口由上面的用例覆盖。
it.skipIf(process.platform === 'win32').each(['complete', 'missing-platform', 'upload-failed'])('真实发布脚本在 %s 条件下保护可见发布', async (mode) => {
  const home = await mkdtemp(join(tmpdir(), 'xpeach-release-workflow-'))
  onTestFinished(() => rm(home, { recursive: true, force: true }))
  const environment = { PATH: process.env.PATH, HOME: home, USERPROFILE: home }
  const command = promisify(execFile)
  await command('git', ['init', home], { env: environment })
  await command('git', ['-c', 'user.name=测试', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-m', '测试基线'], { cwd: home, env: environment })
  await mkdir(join(home, 'artifacts'))
  await mkdir(join(home, 'bin'))
  await mkdir(join(home, 'scripts/release'), { recursive: true })
  await writeFile(join(home, 'scripts/release/assert-xpeach-tag-available.ts'), readFileSync(resolve(import.meta.dirname, 'release/assert-xpeach-tag-available.ts')))
  for (const name of mode === 'missing-platform' ? ['macos-test.zip'] : ['macos-test.zip', 'linux-test.zip', 'windows-test.zip']) {
    await writeFile(join(home, 'artifacts', name), '合成安装包')
  }
  const gh = join(home, 'bin/gh')
  await writeFile(gh, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CALLS"\nif [ "$1 $2" = "release upload" ] && [ "$MODE" = "upload-failed" ]; then exit 1; fi\nif [ "$1 $2" = "release view" ]; then echo installer.zip; fi\n')
  await chmod(gh, 0o755)
  const server = createServer((_request, response) => { response.writeHead(404); response.end() })
  onTestFinished(() => new Promise<void>((done, reject) => {
    server.close((error) => { if (error === undefined) done(); else reject(error) })
  }))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('本地响应服务没有端口')
  const script = workflow.jobs.release!.steps.find(step => step.name === 'Publish the GitHub release')!.run!
    .replaceAll('${{ needs.version.outputs.version }}', options.version)
  const running = command('bash', ['-c', script], { cwd: home, timeout: 10_000,
    env: { ...environment, PATH: `${join(home, 'bin')}:${process.env.PATH ?? ''}`, CALLS: join(home, 'calls'), MODE: mode,
      GH_TOKEN: options.token, GITHUB_REPOSITORY: options.repository, GITHUB_REF: options.ref,
      GITHUB_API_URL: `http://127.0.0.1:${address.port}` } })
  if (mode === 'complete') await expect(running).resolves.toMatchObject({ stderr: '' })
  else await expect(running).rejects.toMatchObject({ code: 1, killed: false, signal: null })
  const calls = mode === 'missing-platform' ? '' : readFileSync(join(home, 'calls'), 'utf8')
  expect(calls.includes('--draft=false')).toBe(mode === 'complete')
  expect(calls).not.toMatch(/release delete|--clobber/u)
  if (mode === 'upload-failed') expect(calls).toContain('--draft --verify-tag')
})
