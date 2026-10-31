/** Cross-platform native task and interaction notification manager for macOS, Windows, and Linux. */

import * as electron from 'electron'
import type { BrowserWindow, Notification, NotificationConstructorOptions } from 'electron'
import type { DesktopTaskNotificationKind, DesktopTaskNotificationPayload } from './ipc.ts'

export type { DesktopTaskNotificationKind, DesktopTaskNotificationPayload } from './ipc.ts'

const VALID_KINDS = new Set<DesktopTaskNotificationKind>([
  'completed',
  'error',
  'approval',
  'question',
  'plan-review',
])

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  const collapsed = value.replace(/\r\n?/gu, '\n').trim()
  if (collapsed.length <= maxLength) return collapsed
  return `${collapsed.slice(0, maxLength - 1)}…`
}

/**
 * Validate and normalize an untrusted IPC payload into a {@link DesktopTaskNotificationPayload}.
 * @param raw - IPC argument supplied by the renderer.
 * @returns Validated notification payload.
 */
export function validateDesktopTaskNotificationPayload(raw: unknown): DesktopTaskNotificationPayload {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('xph desktop: task notification payload must be an object')
  }
  const record = raw as Record<string, unknown>
  const id = cleanText(record['id'], 200)
  const kind = record['kind']
  const title = cleanText(record['title'], 160)
  const subtitle = cleanText(record['subtitle'], 160)
  const body = cleanText(record['body'], 400)
  const sessionId = cleanText(record['sessionId'], 160)
  if (id === '' || title === '' || typeof kind !== 'string' || !VALID_KINDS.has(kind as DesktopTaskNotificationKind)) {
    throw new Error('xph desktop: invalid task notification fields')
  }
  return {
    id,
    kind: kind as DesktopTaskNotificationKind,
    title,
    ...(subtitle !== '' ? { subtitle } : {}),
    body: body !== '' ? body : title,
    ...(sessionId !== '' ? { sessionId } : {}),
    ...(typeof record['urgent'] === 'boolean' ? { urgent: record['urgent'] } : {}),
    ...(typeof record['silent'] === 'boolean' ? { silent: record['silent'] } : {}),
  }
}

/** Dependencies and platform hooks for {@link DesktopTaskNotificationManager}. */
export interface DesktopTaskNotificationManagerOptions {
  /** Current primary application window, when created. */
  readonly window: () => BrowserWindow | undefined
  /** Restore, show, and focus the primary window. */
  readonly focusWindow: () => void
  /** Notify the renderer to switch to the clicked notification's session. */
  readonly onSelectSession: (sessionId: string) => void
  /** Path to the platform window/notification icon, when available. */
  readonly iconPath?: string
  /** Target platform identifier (`'darwin' | 'win32' | 'linux'`), injectable for tests. */
  readonly platform?: string
}

const MAX_RECENT_IDS = 200
const MAX_ACTIVE_NOTIFICATIONS = 8

/**
 * Manages native system popup notifications, Dock bounce/badges on macOS,
 * taskbar frame flashing on Windows/Linux, and click-to-session navigation.
 */
export class DesktopTaskNotificationManager {
  private readonly recentIds = new Set<string>()
  private readonly activeNotifications = new Set<Notification>()
  private readonly platform: string
  private bounceId: number | undefined
  private unreadCount = 0
  private boundWindow: BrowserWindow | undefined
  private readonly onWindowFocus = (): void => {
    this.clearAttention()
  }

  /**
   * @param options - Window accessor, focus callback, session navigation callback, and icon path.
   */
  constructor(private readonly options: DesktopTaskNotificationManagerOptions) {
    this.platform = options.platform ?? process.platform
  }

  /**
   * Bind focus listeners to the active main window so focusing the window clears badges and flashing.
   * @param window - Primary application BrowserWindow.
   */
  attachWindow(window: BrowserWindow): void {
    if (this.boundWindow === window) return
    if (this.boundWindow !== undefined && !this.boundWindow.isDestroyed?.()) {
      this.boundWindow.off?.('focus', this.onWindowFocus)
    }
    this.boundWindow = window
    window.on?.('focus', this.onWindowFocus)
  }

  /**
   * Dispatch a native OS notification and trigger background window attention when unfocused.
   * @param payload - Validated notification payload.
   * @returns `true` when the notification or attention cue was dispatched, `false` when deduplicated.
   */
  notify(payload: DesktopTaskNotificationPayload): boolean {
    if (this.recentIds.has(payload.id)) return false
    this.recentIds.add(payload.id)
    if (this.recentIds.size > MAX_RECENT_IDS) {
      const oldest = this.recentIds.values().next().value
      if (oldest !== undefined) this.recentIds.delete(oldest)
    }

    const win = this.options.window()
    if (win !== undefined && !win.isDestroyed?.()) {
      this.attachWindow(win)
    }
    const isWindowFocused =
      win !== undefined && !win.isDestroyed?.() && Boolean(win.isVisible?.()) && Boolean(win.isFocused?.())
    const urgent = payload.urgent ?? (
      payload.kind === 'approval'
      || payload.kind === 'question'
      || payload.kind === 'plan-review'
      || payload.kind === 'error'
    )

    if (!isWindowFocused) {
      this.unreadCount += 1
      this.requestAttention(win, urgent)
    }

    const ElectronNotification = (electron as { Notification?: typeof Notification }).Notification
    if (ElectronNotification === undefined || !ElectronNotification.isSupported?.()) {
      return !isWindowFocused
    }

    try {
      const notificationOptions = this.buildNotificationOptions(payload, urgent)
      const notification = new ElectronNotification(notificationOptions)
      if (this.activeNotifications.size >= MAX_ACTIVE_NOTIFICATIONS) {
        const oldest = this.activeNotifications.values().next().value
        if (oldest !== undefined) {
          this.activeNotifications.delete(oldest)
          oldest.removeAllListeners()
          try { oldest.close() } catch (_error) { /* Ignore close errors on evicted notifications. */ }
        }
      }
      this.activeNotifications.add(notification)

      const cleanup = (): void => {
        this.activeNotifications.delete(notification)
        notification.removeAllListeners()
      }
      notification.once('close', cleanup)
      notification.once('failed', cleanup)
      notification.once('click', () => {
        cleanup()
        this.clearAttention()
        this.options.focusWindow()
        if (payload.sessionId !== undefined && payload.sessionId !== '') {
          this.options.onSelectSession(payload.sessionId)
        }
      })
      notification.show()
      return true
    } catch (error) {
      console.warn('desktop task notification: failed to show system notification', error)
      return !isWindowFocused
    }
  }

  /** Clear Dock bounce, badge counts, and taskbar frame flashing. */
  clearAttention(): void {
    this.unreadCount = 0
    const win = this.options.window() ?? this.boundWindow
    try {
      if ((this.platform === 'win32' || this.platform === 'linux') && win !== undefined && !win.isDestroyed?.()) {
        win.flashFrame?.(false)
      }
      if (this.platform === 'darwin') {
        if (this.bounceId !== undefined) {
          electron.app?.dock?.cancelBounce(this.bounceId)
          this.bounceId = undefined
        }
        electron.app?.dock?.setBadge('')
      }
      if (this.platform === 'linux' && typeof electron.app?.setBadgeCount === 'function') {
        electron.app.setBadgeCount(0)
      }
    } catch (error) {
      console.warn('desktop task notification: could not clear attention', error)
    }
  }

  /** Dispose all active notifications and clear window attention before application quit. */
  dispose(): void {
    this.clearAttention()
    if (this.boundWindow !== undefined && !this.boundWindow.isDestroyed?.()) {
      this.boundWindow.off?.('focus', this.onWindowFocus)
    }
    this.boundWindow = undefined
    for (const notification of this.activeNotifications) {
      notification.removeAllListeners()
      try { notification.close() } catch (_error) { /* Ignore close errors during shutdown. */ }
    }
    this.activeNotifications.clear()
    this.recentIds.clear()
  }

  private requestAttention(win: BrowserWindow | undefined, urgent: boolean): void {
    try {
      if (this.platform === 'darwin') {
        if (this.bounceId !== undefined) {
          electron.app?.dock?.cancelBounce(this.bounceId)
        }
        this.bounceId = electron.app?.dock?.bounce(urgent ? 'critical' : 'informational')
        electron.app?.dock?.setBadge(String(this.unreadCount))
        return
      }
      if (this.platform === 'win32') {
        if (win !== undefined && !win.isDestroyed?.()) {
          win.flashFrame?.(true)
        }
        return
      }
      if (this.platform === 'linux') {
        if (win !== undefined && !win.isDestroyed?.()) {
          win.flashFrame?.(true)
        }
        if (typeof electron.app?.setBadgeCount === 'function') {
          electron.app.setBadgeCount(this.unreadCount)
        }
      }
    } catch (error) {
      console.warn('desktop task notification: attention unavailable', error)
    }
  }

  private buildNotificationOptions(
    payload: DesktopTaskNotificationPayload,
    urgent: boolean,
  ): NotificationConstructorOptions {
    const hasSubtitle = payload.subtitle !== undefined && payload.subtitle.trim() !== ''
    const combinedHeader = hasSubtitle ? `${payload.title} · ${payload.subtitle}` : payload.title
    const silent = payload.silent ?? false

    if (this.platform === 'darwin') {
      return {
        title: payload.title,
        ...(hasSubtitle ? { subtitle: payload.subtitle } : {}),
        body: payload.body,
        silent,
      }
    }

    if (this.platform === 'win32') {
      return {
        title: combinedHeader,
        body: payload.body,
        silent,
        timeoutType: urgent ? 'never' : 'default',
        ...(this.options.iconPath !== undefined ? { icon: this.options.iconPath } : {}),
      }
    }

    return {
      title: combinedHeader,
      body: payload.body,
      silent,
      urgency: urgent ? 'critical' : 'normal',
      ...(this.options.iconPath !== undefined ? { icon: this.options.iconPath } : {}),
    }
  }
}
