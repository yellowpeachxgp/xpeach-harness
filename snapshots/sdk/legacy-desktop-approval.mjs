/** 旧桌面录制仅保留审批文字；审批、会话投影与问答仍由真实服务处理。 */
import ApprovalService, { setApprovalPolicy } from '../../packages/interaction/user-approval/lib/index.js'
import { createUserMessage } from '../../packages/llm/llm/lib/index.js'

const labels = { never: 'never ask the user for approval', ask: 'ask the user for approval' }
const askText = 'Approval prompts are enabled in this session: operations that require approval may ask through the configured answerers; without an available answerer, the request fails closed.'
const neverText = 'Approval prompts are disabled in this session: actions that require approval are rejected automatically — do not request sandbox escalation (do not set `sandbox_permissions`).'

/** 通过公开贡献接口和公开策略操作保留旧录制文字，不改当前产品服务。 */
export default class LegacyDesktopApproval extends ApprovalService {
  static inject = ['agents', 'systemPrompt']

  constructor(ctx, config) {
    super(ctx, config)
    ctx.on('agent/created', async ({ agent }) => {
      await agent.ctx.plugin({
        name: 'legacy-desktop-approval-context',
        inject: ['systemPrompt'],
        apply: inner => {
          inner.systemPrompt.context({
            name: 'approval:policy',
            order: inner.systemPrompt.getContextOrder('APPROVAL_POLICY'),
            text: () => (this.overrideOf(agent.session) ?? this.config.policy) === 'never' ? neverText : askText,
          })
        },
      })
    })
  }

  setPolicy(agent, policy) {
    const previous = this.overrideOf(agent.session) ?? this.config.policy
    if (previous === policy) return
    setApprovalPolicy(agent.session, policy)
    agent.inject(createUserMessage({
      content: [{ type: 'text', text: `The user changed the approval policy from "${labels[previous]}" to "${labels[policy]}".` }],
      source: { kind: 'user-approval' },
    }))
  }
}
