import { EventEmitter } from 'node:events'
import type { BrowserWindow } from 'electron'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DesktopTaskNotificationManager,
  validateDesktopTaskNotificationPayload,
  type DesktopTaskNotificationPayload,
} from '../src/task-notification.ts'

const native = await vi.hoisted(async () => {
  const { EventEmitter } = await import('node:events')
  const notices: Notice[] = []
  class Notice extends EventEmitter {
    static isSupported = vi.fn(() => true)
    show = vi.fn()
    close = vi.fn()
    constructor(readonly options: unknown) {
      super()
      notices.push(this)
    }
  }
  return {
    notices,
    Notice,
    dock: {
      bounce: vi.fn(() => 42),
      cancelBounce: vi.fn(),
      setBadge: vi.fn(),
    },
    setBadgeCount: vi.fn(() => true),
  }
})

vi.mock('electron', () => ({
  Notification: native.Notice,
  app: {
    dock: native.dock,
    setBadgeCount: native.setBadgeCount,
  },
}))

let manager: DesktopTaskNotificationManager | undefined

afterEach(() => {
  manager?.dispose()
  manager = undefined
  native.notices.length = 0
  vi.clearAllMocks()
  native.Notice.isSupported.mockReturnValue(true)
})

function setup(platform: 'darwin' | 'win32' | 'linux', focused = false) {
  const window = Object.assign(new EventEmitter(), {
    focused,
    visible: true,
    isFocused() { return this.focused },
    isVisible() { return this.visible },
    isDestroyed: () => false,
    flashFrame: vi.fn(),
  })
  const focusWindow = vi.fn()
  const onSelectSession = vi.fn()
  manager = new DesktopTaskNotificationManager({
    window: () => window as unknown as BrowserWindow,
    focusWindow,
    onSelectSession,
    iconPath: '/app/icon.png',
    platform,
  })
  return { window, focusWindow, onSelectSession, manager }
}

describe('DesktopTaskNotificationManager', () => {
  it('validates and truncates task notification payloads at the IPC boundary', () => {
    const validated = validateDesktopTaskNotificationPayload({
      id: 'approval:call-1',
      kind: 'approval',
      title: '等待授权确认',
      subtitle: 'xpeach-harness',
      body: '请求执行终端命令：pnpm build',
      sessionId: 'sess-123',
      urgent: true,
    })
    expect(validated).toEqual({
      id: 'approval:call-1',
      kind: 'approval',
      title: '等待授权确认',
      subtitle: 'xpeach-harness',
      body: '请求执行终端命令：pnpm build',
      sessionId: 'sess-123',
      urgent: true,
    })

    expect(() => validateDesktopTaskNotificationPayload(null)).toThrow()
    expect(() => validateDesktopTaskNotificationPayload({ id: '', kind: 'completed', title: 'ok' })).toThrow()
    expect(() => validateDesktopTaskNotificationPayload({ id: '1', kind: 'unknown', title: 'ok' })).toThrow()
  })

  it('adapts macOS notifications with subtitle, critical Dock bounce, badge count, and click-to-session navigation', () => {
    const f = setup('darwin', false)
    const payload: DesktopTaskNotificationPayload = {
      id: 'approval:1',
      kind: 'approval',
      title: '等待授权确认',
      subtitle: '修复登录与更新通道',
      body: '请求执行终端命令：pnpm test',
      sessionId: 'sess-mac-1',
    }
    expect(f.manager.notify(payload)).toBe(true)
    expect(f.manager.notify(payload)).toBe(false)
    expect(native.notices).toHaveLength(1)
    expect(native.notices[0]!.options).toEqual({
      title: '等待授权确认',
      subtitle: '修复登录与更新通道',
      body: '请求执行终端命令：pnpm test',
      silent: false,
    })
    expect(native.dock.bounce).toHaveBeenCalledWith('critical')
    expect(native.dock.setBadge).toHaveBeenCalledWith('1')

    native.notices[0]!.emit('click')
    expect(f.focusWindow).toHaveBeenCalledOnce()
    expect(f.onSelectSession).toHaveBeenCalledWith('sess-mac-1')
    expect(native.dock.cancelBounce).toHaveBeenCalledWith(42)
    expect(native.dock.setBadge).toHaveBeenLastCalledWith('')
  })

  it('adapts Windows notifications with combined title, icon, timeoutType never for urgent items, and flashFrame', () => {
    const f = setup('win32', false)
    f.manager.notify({
      id: 'question:1',
      kind: 'question',
      title: '等待你的选择或输入',
      subtitle: '前端重构会话',
      body: '请选择部署环境：1. 生产环境  2. 预发布环境',
      sessionId: 'sess-win-1',
    })
    expect(native.notices).toHaveLength(1)
    expect(native.notices[0]!.options).toEqual({
      title: '等待你的选择或输入 · 前端重构会话',
      body: '请选择部署环境：1. 生产环境  2. 预发布环境',
      silent: false,
      timeoutType: 'never',
      icon: '/app/icon.png',
    })
    expect(f.window.flashFrame).toHaveBeenCalledWith(true)

    f.window.emit('focus')
    expect(f.window.flashFrame).toHaveBeenLastCalledWith(false)
  })

  it('adapts Linux notifications with urgency levels, taskbar flashFrame, and launcher badge count', () => {
    const f = setup('linux', false)
    f.manager.notify({
      id: 'completed:1',
      kind: 'completed',
      title: '任务已完成',
      subtitle: 'xpeach-harness',
      body: '已完成当前回合推理与工具执行（耗时 14s）',
      sessionId: 'sess-linux-1',
    })
    expect(native.notices).toHaveLength(1)
    expect(native.notices[0]!.options).toEqual({
      title: '任务已完成 · xpeach-harness',
      body: '已完成当前回合推理与工具执行（耗时 14s）',
      silent: false,
      urgency: 'normal',
      icon: '/app/icon.png',
    })
    expect(f.window.flashFrame).toHaveBeenCalledWith(true)
    expect(native.setBadgeCount).toHaveBeenCalledWith(1)

    f.window.emit('focus')
    expect(f.window.flashFrame).toHaveBeenLastCalledWith(false)
    expect(native.setBadgeCount).toHaveBeenLastCalledWith(0)
  })
})
