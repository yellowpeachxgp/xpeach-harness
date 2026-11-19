/** 外部站点和模型响应夹具；不模拟账号或适配器的内部算法。 */
import { appendFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { prepareScenario } from './operations.mjs'

export const name = 'issue65-http-fixture'
export const inject = ['profileContext']

export function apply(ctx) {
  const home = ctx.profileContext.home
  // 镜像的默认 home 也限制在本次子进程，避免平台临时目录别名逃逸。
  process.env.HOME = home
  process.env.USERPROFILE = home
  process.env.XPH_HOME = home
  const state = {
    credentialRef: 'ISSUE65_RELAY', relayKey: ['sk', 'issue65', 'snapshot'].join('-'),
    ready: false, reveal: true, writes: [], models: ['retained-model', 'removed-model'],
  }
  for (const variable of [state.credentialRef, 'ISSUE65_ADMIN', 'ISSUE65_SESSION']) delete process.env[variable]
  ctx.provide('issue65Site', state)
  ctx.on('agent/created', async ({ agent }) => { await prepareScenario(ctx, agent, state) })
  ctx.on('agent/request', async (_request, next) => {
    if (!state.ready) throw new Error('账号快照的公开凭据准备尚未完成')
    return await next()
  })
  const fixture = process.env.DSH_SNAPSHOT_FILE
  if (fixture === undefined) throw new Error('账号快照需要选中的 Session 回放文件')
  const responses = readFileSync(fixture, 'utf8').trim().split('\n').map(line => JSON.parse(line))
    .filter(event => event.type === 'assistant/message').map(event => event.data.message)
  const previous = globalThis.fetch
  const reply = (data, status = 200) => Response.json(data, { status })
  const fetchFixture = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input)
    // 所有其他域名均在本地拒绝，绝不委托真实网络。
    if (url.hostname !== 'issue65.invalid') return reply({ message: '快照禁止外网请求：' + url.origin + url.pathname }, 503)
    const method = init?.method ?? 'GET'
    if (url.pathname === '/metadata') return reply({})
    if (url.pathname === '/api/user/self') return reply({ success: true, data: { id: 1, username: '独立快照账号', status: 1 } })
    if (url.pathname === '/api/usage/token/') return reply({ success: true, data: {
      name: '独立快照令牌', total_granted: 100, total_available: 100, total_used: 0,
      expires_at: -1, unlimited_quota: false, model_limits_enabled: false,
    } })
    if (url.pathname === '/api/pricing') return reply({ data: [], group_ratio: {}, usable_group: {} })
    if (url.pathname === '/api/user/groups' || url.pathname === '/api/user/self/groups') return reply({ success: true, data: {} })
    if (url.pathname === '/v1/models') return reply({ data: state.models.map(id => ({ id, groups: ['测试渠道'], supported_endpoint_types: ['openai'] })) })
    const token = { id: 1, user_id: 1, name: '独立快照令牌', key: state.relayKey.slice(3), groups: ['测试渠道'], status: 1 }
    if (url.pathname === '/api/token/' && method === 'GET') return reply({ success: true, data: { items: [token], total: 1 } })
    if (url.pathname === '/api/token/1') return reply({ success: true, data: token })
    if (url.pathname === '/api/token/1/key') return state.reveal
      ? reply({ success: true, data: { key: token.key } })
      : reply({ success: false, message: '站点暂时不能显示密钥' }, 503)
    if (url.pathname === '/api/token/' && method === 'PUT') {
      state.writes.push(JSON.parse(String(init?.body)))
      return reply({ success: true, data: {} })
    }
    if (url.pathname === '/v1/chat/completions') {
      const body = JSON.parse(String(init?.body))
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
      // 只比较布尔值，失败诊断不回显 Authorization 或凭据内容。
      assert.equal(headers.get('authorization') === `Bearer ${state.relayKey}`, true, '真实PI适配器未使用账号发布的合成凭据')
      assert.equal(body.model, 'retained-model', '模型请求必须属于当前XPeach路由的保留模型')
      appendFileSync(join(home, 'issue65-requests.jsonl'), JSON.stringify(body) + '\n')
      const message = responses.shift()
      if (message === undefined) throw new Error('真实适配器请求超过已记录的模型响应数')
      const calls = message.content.filter(block => block.type === 'tool-call')
      const text = message.content.filter(block => block.type === 'text').map(block => block.text).join('')
      const delta = calls.length === 0 ? { content: text } : { tool_calls: calls.map((call, index) => ({
        index, id: call.id, type: 'function', function: { name: call.name, arguments: call.arguments },
      })) }
      const event = (delta, finish_reason = null) => ({ id: 'issue65-response', object: 'chat.completion.chunk', created: 1,
        model: body.model, choices: [{ index: 0, delta, finish_reason }] })
      const chunks = [event({ role: 'assistant' }), event(delta), event({}, calls.length === 0 ? 'stop' : 'tool_calls')]
      return new Response(chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    }
    throw new Error(`未声明的快照请求：${method} ${url.pathname}`)
  }
  ctx.effect(() => {
    globalThis.fetch = fetchFixture
    return () => {
      if (globalThis.fetch !== fetchFixture) throw new Error('快照 fetch 所有权发生变化')
      globalThis.fetch = previous
    }
  })
}
