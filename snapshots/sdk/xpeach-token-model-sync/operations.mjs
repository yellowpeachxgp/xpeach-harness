/** 测试工具只调用真实公开账号操作，并向模型返回真实结果。 */
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineContentToolFixture } from '../../../packages/test-support/tool-testkit/lib/index.js'
import { credentialRef } from '../../../packages/credentials/credentials/lib/index.js'

export const name = 'issue65-scenario-setup'
export const inject = ['xpeachAccount', 'issue65Site', 'credentials', 'llm']

/** SDK 就绪前通过公开操作绑定合成凭据，避免在模型解析后才准备凭据。 */
export async function apply(ctx) {
  const site = ctx.get('issue65Site')
  const account = ctx.get('xpeachAccount')
  assert.ok(account, '账号服务必须由产品插件提供')
  account.networkAutoOp({ auto: false }, AbortSignal.timeout(10_000))
  const profile = ctx.profileContext.dir
  mkdirSync(profile, { recursive: true })
  writeFileSync(join(profile, 'xpeach.admin'), 'issue65-fake-admin\n', { mode: 0o600 })
  const bound = await account.keySlotAddOp({ name: '独立快照', key: site.relayKey }, AbortSignal.timeout(10_000))
  assert.equal(bound.ok, true)
  assert.equal(account.isBound(), true)
  // 槽位绑定只保证凭据发布；显式等待公开目录同步后再检查适配器。
  const synchronized = await account.syncModelsOp({}, AbortSignal.timeout(10_000))
  assert.equal(synchronized.ok, true, synchronized.error)
  const ref = credentialRef(site.credentialRef)
  const credentials = ctx.get('credentials')
  assert.ok(credentials, '真实账号和PI组合必须挂载credentials服务')
  const published = await credentials.resolve(ref)
  assert.equal(published?.value === site.relayKey, true, '公开key-slot操作返回后，账号凭据引用尚未发布')
  const selected = await ctx.get('llm').resolveCallConfig({ provider: 'xpeach', model: 'retained-model' })
  assert.equal(selected.provider, 'xpeach')
  assert.equal(selected.model, 'retained-model')
  site.ready = true
  ctx.provide('issue65Ready', true)
}

/** 真实 Agent 创建时注册检查工具，并校验其可见的已发布凭据。 */
export async function prepareScenario(ctx, agent, site) {
  const account = ctx.get('xpeachAccount')
  const ref = credentialRef(site.credentialRef)
  const agentCredentials = agent.ctx.get('credentials')
  assert.ok(agentCredentials, 'Agent必须能够访问已发布凭据的credentials服务')
  const agentPublished = await agentCredentials.resolve(ref)
  assert.equal(agentPublished?.value === site.relayKey, true, 'Agent可见的凭据引用与账号公开发布结果不同')
  agent.ctx.effect(() => agent.ctx.tools.register(defineContentToolFixture({
    name: 'xpeach_sync_check',
    description: '检查令牌身份不可确认时是否拒写，以及目录收缩后的模型可用性。',
    parameters: {},
    async execute(_args, exec) {
      site.reveal = false
      const groups = await account.setGroupsOp({ groups: ['其他渠道'] }, exec.signal)
      assert.equal(groups.ok, false)
      assert.equal(site.writes.length, 0)
      site.reveal = true
      site.models = ['retained-model']
      const synced = await account.syncModelsOp({}, exec.signal)
      assert.equal(synced.ok, true, synced.error)
      let missingModelCode
      try {
        await ctx.get('llm').resolveCallConfig({ provider: 'xpeach', model: 'removed-model' })
      } catch (error) {
        missingModelCode = error.code
      }
      assert.equal(missingModelCode, 'UNKNOWN_MODEL')
      return [{ type: 'text', text: JSON.stringify({
        写组已拒绝: !groups.ok, 远端写次数: site.writes.length, 目录同步成功: synced.ok, 缺失模型错误: missingModelCode,
      }) }]
    },
  })))
}
