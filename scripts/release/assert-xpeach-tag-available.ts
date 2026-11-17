/** 在构建及发布前验证版本、不可变标签和同名 Release。 */
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

interface ReleaseCheck {
  readonly repository: string
  readonly version: string
  readonly ref: string
  readonly commit: string
  readonly token: string
  readonly apiUrl?: string
  readonly request?: typeof fetch
}

/**
 * 分支发布拒绝复用标签；标签触发只接受当前提交的原标签，所有路径拒绝已有 Release。
 * @param options - 目标仓库、版本、触发引用、检出的提交与读取凭据。
 * @returns 两个远端记录均满足不可变发布要求后完成。
 * @throws 引用不符、目标已发布、身份或网络检查无法完成时拒绝继续。
 */
export async function assertXPeachTagAvailable(options: ReleaseCheck): Promise<void> {
  const { repository, version, ref, commit, token, request = fetch } = options
  if (!/^[\w.-]+\/[\w.-]+$/u.test(repository)
    || !/^\d+\.\d+\.\d+(?:-[\dA-Za-z.-]+)?$/u.test(version)) {
    throw new Error('发布仓库或版本无效，已停止发布。')
  }
  const tag = `v${version}`
  const tagged = ref === `refs/tags/${tag}`
  const suffix = new Map([['refs/heads/alpha', '-alpha'], ['refs/heads/beta', '-beta'], ['refs/heads/main', '-least']]).get(ref)
  if (!tagged && (suffix === undefined || !version.endsWith(suffix))) {
    throw new Error('发布引用与版本通道不一致，已停止发布。')
  }
  if (token === '' || !/^[\da-f]{40}$/u.test(commit)) throw new Error('缺少发布检查身份或检出提交，已停止发布。')
  const base = `${(options.apiUrl ?? 'https://api.github.com').replace(/\/$/u, '')}/repos/${repository}`
  const read = async (path: string): Promise<Response> => {
    let response: Response
    try {
      response = await request(`${base}/${path}`, {
        headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
        signal: AbortSignal.timeout(15_000),
      })
    } catch (cause) {
      throw new Error('无法完成远端发布检查，已停止发布；请检查 GitHub 连接后重试。', { cause })
    }
    if (response.status !== 404 && !response.ok) throw new Error(`远端发布检查被拒绝（HTTP ${response.status}），已停止发布。`)
    return response
  }
  const release = await read(`releases/tags/${encodeURIComponent(tag)}`)
  if (release.status !== 404) throw new Error(`Release ${tag} 已存在，禁止删除、覆盖或重新发布。`)
  let reference = await read(`git/ref/tags/${encodeURIComponent(tag)}`)
  if (reference.status === 404) {
    if (tagged) throw new Error(`触发标签 ${tag} 不存在，已停止发布。`)
    return
  }
  if (!tagged) throw new Error(`标签 ${tag} 已存在，禁止复用；请使用新的版本。`)
  for (let depth = 0; depth < 16; depth += 1) {
    const body: unknown = await reference.json().catch((cause: unknown) => {
      throw new Error('标签目标响应无法解析，已停止发布。', { cause })
    })
    if (body === null || typeof body !== 'object' || !('object' in body)
      || body.object === null || typeof body.object !== 'object'
      || !('type' in body.object) || !('sha' in body.object)
      || typeof body.object.sha !== 'string' || !/^[\da-f]{40}$/u.test(body.object.sha)) {
      throw new Error('标签目标响应无效，已停止发布。')
    }
    if (body.object.type === 'commit') {
      if (body.object.sha !== commit) throw new Error('触发标签与检出提交不同，已停止发布。')
      return
    }
    if (body.object.type !== 'tag') throw new Error('触发标签未指向提交，已停止发布。')
    reference = await read(`git/tags/${body.object.sha}`)
    if (reference.status === 404) throw new Error('触发标签对象不存在，已停止发布。')
  }
  throw new Error('标签嵌套超过检查上限，已停止发布。')
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  void assertXPeachTagAvailable({
    repository: process.env.GITHUB_REPOSITORY ?? '',
    version: process.env.XPEACH_RELEASE_VERSION ?? '',
    ref: process.env.GITHUB_REF ?? '',
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    token: process.env.GH_TOKEN ?? '',
    ...process.env.GITHUB_API_URL === undefined ? {} : { apiUrl: process.env.GITHUB_API_URL },
  }).catch((error: unknown) => {
    // 不输出请求头、凭据或网络异常的内部详情。
    console.error(error instanceof Error ? error.message : '发布检查失败，已停止发布。')
    process.exitCode = 1
  })
}
