import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dispatchHostSystemNotification,
  resetHostSystemNotificationCache,
} from '../src/system-notification.ts'

describe('dispatchHostSystemNotification', () => {
  beforeEach(() => {
    resetHostSystemNotificationCache()
  })

  it('dispatches macOS notifications via osascript positional argv without shell interpolation', async () => {
    const runCommand = vi.fn().mockResolvedValue(undefined)
    const result = await dispatchHostSystemNotification(
      {
        id: 'notif-mac-1',
        kind: 'approval',
        title: '需要操作确认 · 执行命令',
        subtitle: 'xpeach-harness · 认证登录修复',
        body: '正在请求执行 pnpm test；请确认是否放行。',
        urgent: true,
        silent: false,
      },
      { platform: 'darwin', runCommand },
    )

    expect(result).toEqual({ delivered: true, platform: 'darwin' })
    expect(runCommand).toHaveBeenCalledTimes(1)
    expect(runCommand).toHaveBeenCalledWith('/usr/bin/osascript', [
      '-e',
      expect.stringContaining('display notification notifBody'),
      '--',
      '需要操作确认 · 执行命令',
      'xpeach-harness · 认证登录修复',
      '正在请求执行 pnpm test；请确认是否放行。',
      'Ping',
    ])
  })

  it('dispatches Linux notifications via notify-send with urgency and expire-time', async () => {
    const runCommand = vi.fn().mockResolvedValue(undefined)
    const result = await dispatchHostSystemNotification(
      {
        id: 'notif-linux-1',
        kind: 'completed',
        title: '任务已完成',
        subtitle: 'xpeach-harness',
        body: '会话「重构版本通道」已完成全部步骤（耗时 18s）',
        urgent: false,
      },
      { platform: 'linux', runCommand },
    )

    expect(result).toEqual({ delivered: true, platform: 'linux' })
    expect(runCommand).toHaveBeenCalledWith('notify-send', [
      '--app-name=XPeach Harness',
      '--urgency=normal',
      '--expire-time=7000',
      '任务已完成 · xpeach-harness',
      '会话「重构版本通道」已完成全部步骤（耗时 18s）',
    ])
  })

  it('dispatches Windows Toast notifications via PowerShell EncodedCommand and environment variables', async () => {
    const runCommand = vi.fn().mockResolvedValue(undefined)
    const result = await dispatchHostSystemNotification(
      {
        id: 'notif-win-1',
        kind: 'question',
        title: '等待你的选择',
        subtitle: 'xpeach-harness',
        body: '请选择部署环境：Production / Staging（共 2 个选项）',
        urgent: true,
      },
      { platform: 'win32', runCommand },
    )

    expect(result).toEqual({ delivered: true, platform: 'win32' })
    expect(runCommand).toHaveBeenCalledWith(
      'powershell.exe',
      expect.arrayContaining(['-NoProfile', '-NonInteractive', '-EncodedCommand']),
      expect.objectContaining({
        XPH_NOTIFY_TITLE: '等待你的选择 · xpeach-harness',
        XPH_NOTIFY_BODY: '请选择部署环境：Production / Staging（共 2 个选项）',
      }),
    )
  })

  it('deduplicates repeated notification ids and rejects empty payloads', async () => {
    const runCommand = vi.fn().mockResolvedValue(undefined)
    const first = await dispatchHostSystemNotification(
      {
        id: 'dup-id-1',
        kind: 'completed',
        title: '任务已完成',
        body: '已完成',
      },
      { platform: 'darwin', runCommand },
    )
    const second = await dispatchHostSystemNotification(
      {
        id: 'dup-id-1',
        kind: 'completed',
        title: '任务已完成',
        body: '已完成',
      },
      { platform: 'darwin', runCommand },
    )
    const empty = await dispatchHostSystemNotification(
      {
        id: 'empty-id',
        kind: 'completed',
        title: '   ',
        body: '',
      },
      { platform: 'darwin', runCommand },
    )

    expect(first.delivered).toBe(true)
    expect(second).toEqual({ delivered: false, platform: 'darwin', reason: 'duplicate' })
    expect(empty).toEqual({ delivered: false, platform: 'darwin', reason: 'empty_payload' })
    expect(runCommand).toHaveBeenCalledTimes(1)
  })
})
