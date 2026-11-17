/** SDK 源测试的默认模型端点始终位于本次测试独占的 loopback 服务。 */
import { createServer } from 'node:http'
import { beforeEach, onTestFinished, vi } from 'vitest'

/**
 * 自定义端点使用随包模型目录；默认请求不得访问官方服务。
 * @param requests - 记录误发至本地桩的请求，供所属行为测试断言。
 */
export function useLocalDeepSeekEndpoint(requests: string[] = []): void {
  beforeEach(async () => {
    requests.length = 0
    const endpoint = createServer((request, response) => {
      requests.push(`${request.method} ${request.url}`)
      request.resume()
      response.writeHead(503, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ error: '测试目录不可用，使用随包模型目录' }))
    })
    onTestFinished(async () => {
      if (!endpoint.listening) return
      await new Promise<void>((resolve, reject) => {
        endpoint.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    })
    await new Promise<void>((resolve, reject) => {
      endpoint.once('error', reject)
      endpoint.listen(0, '127.0.0.1', resolve)
    })
    const address = endpoint.address()
    if (address === null || typeof address === 'string') throw new Error('本地模型端点没有分配端口')
    vi.stubEnv('DEEPSEEK_BASE_URL', `http://127.0.0.1:${address.port}`)
    vi.stubEnv('DEEPSEEK_API_KEY', 'keyless-sdk-server-test')
  })
}
