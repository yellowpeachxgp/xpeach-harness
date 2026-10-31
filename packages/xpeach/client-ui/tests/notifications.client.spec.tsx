import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dispatchTaskNotification,
  formatApprovalNotification,
  formatCompletionNotification,
  formatErrorNotification,
  formatQuestionNotification,
  formatToolDisplayName,
  formatWorkspaceSessionSubtitle,
  getActiveNotificationBanners,
  installTaskNotificationMonitor,
  openNotificationSession,
  readNotificationPreferences,
  resetNotificationStateForTests,
  writeNotificationPreferences,
  type NotificationMonitorContextLike,
  type XPeachTranslateFn,
} from '../src/client/notifications.ts'
import { en, zh, type XPeachKey } from '../src/client/locales.ts'

function createTranslator(dict: Record<XPeachKey, string>): XPeachTranslateFn {
  return (key, params) => {
    let text = dict[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v))
      }
    }
    return text
  }
}

const tZh = createTranslator(zh)
const tEn = createTranslator(en)

describe('XPeach notification formatting &beautification', () => {
  it('translates technical tool names into human-friendly labels', () => {
    expect(formatToolDisplayName('bash', tZh)).toBe('终端命令')
    expect(formatToolDisplayName('write_file', tZh)).toBe('写入文件')
    expect(formatToolDisplayName('edit_file', tZh)).toBe('编辑文件')
    expect(formatToolDisplayName('web_search', tZh)).toBe('网页搜索')
    expect(formatToolDisplayName('mcp__github__create_issue', tZh)).toBe('外部工具 (github · create_issue)')
    expect(formatToolDisplayName('bash', tEn)).toBe('Terminal Command')
  })

  it('formats workspace and session subtitles cleanly', () => {
    expect(
      formatWorkspaceSessionSubtitle('优化系统弹窗通知', '/Volumes/SN 770/Developer/xpeach-harness'),
    ).toBe('xpeach-harness · 优化系统弹窗通知')
    expect(
      formatWorkspaceSessionSubtitle('xpeach-harness', '/Volumes/SN 770/Developer/xpeach-harness'),
    ).toBe('xpeach-harness')
  })

  it('formats tool approval, question, plan-review, completion, and error notifications', () => {
    const approval = formatApprovalNotification({
      sessionId: 'sess-1',
      sessionTitle: '重构登录模块',
      cwd: '/workspace/xpeach-harness',
      key: 'approval:1',
      toolName: 'bash',
      displayReasonText: '请求执行 `pnpm test` 验证单元测试',
      t: tZh,
    })
    expect(approval.title).toBe('需要确认 · 终端命令')
    expect(approval.subtitle).toBe('xpeach-harness · 重构登录模块')
    expect(approval.body).toBe('请求执行 pnpm test 验证单元测试')
    expect(approval.urgent).toBe(true)

    const question = formatQuestionNotification({
      sessionId: 'sess-2',
      sessionTitle: '配置发布环境',
      cwd: '/workspace/xpeach-harness',
      key: 'question:1',
      kind: 'question',
      questions: [
        {
          id: 'q1',
          question: '请选择要部署的目标通道',
          options: [{ label: 'Stable (least)' }, { label: 'Beta' }, { label: 'Alpha' }],
        },
      ],
      t: tZh,
    })
    expect(question.title).toBe('等待选择与输入')
    expect(question.body).toBe('请选择要部署的目标通道 · 选项：Stable (least) / Beta / Alpha')
    expect(question.urgent).toBe(true)

    const planReview = formatQuestionNotification({
      sessionId: 'sess-3',
      sessionTitle: '三端通知适配',
      cwd: '/workspace/xpeach-harness',
      key: 'question:2',
      kind: 'plan-review',
      questions: [
        {
          id: 'p1',
          question: '请确认实施计划',
          detail: '# 实施步骤\n1. 桌面端 Electron 原生通知\n2. Host 三端系统通知回退',
        },
      ],
      t: tZh,
    })
    expect(planReview.title).toBe('执行方案待确认')
    expect(planReview.badge).toBe('方案待确认')
    expect(planReview.body).toContain('实施步骤')

    const completed = formatCompletionNotification({
      sessionId: 'sess-4',
      sessionTitle: '修复更新通道布局',
      cwd: '/workspace/xpeach-harness',
      durationMs: 24_200,
      t: tZh,
    })
    expect(completed.title).toBe('任务已完成')
    expect(completed.body).toBe('「修复更新通道布局」已完成（耗时 24 秒）。')
    expect(completed.urgent).toBe(false)

    const errNotif = formatErrorNotification({
      sessionId: 'sess-5',
      sessionTitle: '构建流水线',
      cwd: '/workspace/xpeach-harness',
      message: 'API rate limit exceeded on upstream channel',
      t: tZh,
    })
    expect(errNotif.title).toBe('任务执行中断')
    expect(errNotif.body).toBe('API rate limit exceeded on upstream channel')
    expect(errNotif.urgent).toBe(true)
  })
})

describe('dispatchTaskNotification & installTaskNotificationMonitor', () => {
  beforeEach(() => {
    resetNotificationStateForTests()
    writeNotificationPreferences({ enabled: true, sound: false })
  })

  afterEach(() => {
    resetNotificationStateForTests()
    delete (globalThis as Record<string, unknown>)['dshDesktop']
  })

  it('dispatches to Desktop native bridge when available and falls back to Host OS notification in Web mode', async () => {
    const hostNotify = vi.fn().mockResolvedValue({ delivered: true, platform: 'darwin' })
    const item = formatCompletionNotification({
      sessionId: 'sess-web',
      sessionTitle: 'Web 会话任务',
      cwd: '/workspace/xpeach-harness',
      durationMs: 12_000,
      t: tZh,
    })

    await dispatchTaskNotification(item, { sendHostNotification: hostNotify })
    expect(hostNotify).toHaveBeenCalledTimes(1)
    expect(getActiveNotificationBanners()).toHaveLength(1)

    const desktopNotify = vi.fn().mockResolvedValue({ shown: true })
    ;(globalThis as Record<string, unknown>)['dshDesktop'] = {
      notifications: {
        notify: desktopNotify,
        subscribeClick: () => () => {},
      },
    }

    const desktopItem = formatApprovalNotification({
      sessionId: 'sess-desktop',
      sessionTitle: 'Desktop 会话',
      cwd: '/workspace/xpeach-harness',
      key: 'approval:99',
      toolName: 'edit_file',
      reason: '修改配置文件',
      t: tZh,
    })

    await dispatchTaskNotification(desktopItem, { sendHostNotification: hostNotify })
    expect(desktopNotify).toHaveBeenCalledTimes(1)
    expect(desktopNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'sess-desktop',
        kind: 'approval',
        title: '需要确认 · 编辑文件',
        urgent: true,
      }),
    )
  })

  it('monitors session completion, approval, question, and click-to-open session navigation', async () => {
    const statusMap = new Map<
      string,
      {
        running: boolean
        pendingInteraction:
          | {
            kind: 'approval' | 'question' | 'plan-review'
            key: string
            toolName?: string
            reason?: string
            questions?: readonly { id: string; question: string; options?: readonly { label: string }[] }[]
          }
          | undefined
      }
    >()
    statusMap.set('sess-1', { running: true, pendingInteraction: undefined })
    statusMap.set('sess-sub', { running: true, pendingInteraction: undefined })

    const statusListeners = new Set<() => void>()
    const openSession = vi.fn()
    let clickSubscriber: ((payload: { id: string; sessionId: string }) => void) | undefined

    ;(globalThis as Record<string, unknown>)['dshDesktop'] = {
      notifications: {
        notify: vi.fn().mockResolvedValue({ shown: true }),
        subscribeClick: (cb: (payload: { id: string; sessionId: string }) => void) => {
          clickSubscriber = cb
          return () => {}
        },
      },
    }

    const ctx: NotificationMonitorContextLike = {
      get: (name: string) => {
        if (name === 'sessions') {
          return {
            list: {
              getSnapshot: () => ({
                byId: {
                  'sess-1': {
                    id: 'sess-1',
                    displayTitle: '主任务会话',
                    cwd: '/workspace/xpeach-harness',
                    origin: 'user',
                    retainedBy: { mainView: 0 },
                  },
                  'sess-sub': {
                    id: 'sess-sub',
                    displayTitle: '子代理任务',
                    cwd: '/workspace/xpeach-harness',
                    origin: 'subagent',
                    retainedBy: { mainView: 0 },
                  },
                },
              }),
              subscribe: () => () => {},
            },
          }
        }
        if (name === 'uiSession') {
          return {
            sessionStatus: {
              getSnapshot: () => statusMap,
              subscribe: (cb: () => void) => {
                statusListeners.add(cb)
                return () => {
                  statusListeners.delete(cb)
                }
              },
            },
          }
        }
        if (name === 'uiWorkspace') {
          return { openSession }
        }
        return undefined
      },
      on: () => () => {},
      locale: {
        bind: () => tZh,
        resolveText: text => text.en,
      },
      layout: {
        getSnapshot: () => ({ activePanel: 'xpeach' }),
        selectPanel: vi.fn(),
      },
      remote: {
        $on: () => () => {},
      },
    }

    const dispose = installTaskNotificationMonitor(ctx)

    // 1. Trigger an approval request on sess-1
    statusMap.set('sess-1', {
      running: true,
      pendingInteraction: {
        kind: 'approval',
        key: 'approval:10',
        toolName: 'bash',
        reason: '执行构建检查',
      },
    })
    for (const listener of statusListeners) listener()

    expect(getActiveNotificationBanners()).toHaveLength(1)
    expect(getActiveNotificationBanners()[0]?.kind).toBe('approval')
    expect(getActiveNotificationBanners()[0]?.title).toBe('需要确认 · 终端命令')

    // 2. Resolve approval and transition sess-1 + sess-sub to completed
    statusMap.set('sess-1', { running: false, pendingInteraction: undefined })
    statusMap.set('sess-sub', { running: false, pendingInteraction: undefined })
    for (const listener of statusListeners) listener()

    // Approval banner is cleared and replaced by the completed banner for sess-1 (subagent is ignored)
    const banners = getActiveNotificationBanners()
    expect(banners).toHaveLength(1)
    expect(banners[0]?.sessionId).toBe('sess-1')
    expect(banners[0]?.kind).toBe('completed')

    // 3. Clicking the banner or OS notification navigates to sess-1
    openNotificationSession(banners[0]!)
    expect(openSession).toHaveBeenCalledWith('sess-1')

    clickSubscriber?.({ id: 'notif-os', sessionId: 'sess-1' })
    expect(openSession).toHaveBeenCalledTimes(2)

    expect(readNotificationPreferences()).toEqual({ enabled: true, sound: false })
    dispose()
  })
})
