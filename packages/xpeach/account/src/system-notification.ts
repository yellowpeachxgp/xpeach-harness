/**
 * Cross-platform OS notification dispatcher for the XPeach Harness Host process.
 *
 * When running in Web or headless CLI mode outside the Electron desktop shell,
 * this helper dispatches native OS notifications on macOS (`osascript`),
 * Windows (`powershell.exe` WinRT ToastNotificationManager), and Linux
 * (`notify-send`) with strict argument separation and bounded deduplication.
 * @module
 */

import { execFile } from 'node:child_process'

/** Notification category for a session lifecycle or interaction event. */
export type XPeachSystemNotificationKind =
  | 'completed'
  | 'approval'
  | 'question'
  | 'plan-review'
  | 'error'

/** Request payload for a host-dispatched OS system notification. */
export interface XPeachSystemNotificationRequest {
  readonly id: string
  readonly kind: XPeachSystemNotificationKind
  readonly title: string
  readonly subtitle?: string | undefined
  readonly body: string
  readonly urgent?: boolean | undefined
  readonly silent?: boolean | undefined
}

/** Delivery outcome returned by {@link dispatchHostSystemNotification}. */
export interface XPeachSystemNotificationResult {
  readonly delivered: boolean
  readonly platform: string
  readonly reason?: string | undefined
}

/** Injectable execution options for testing {@link dispatchHostSystemNotification}. */
export interface XPeachSystemNotificationOptions {
  readonly platform?: NodeJS.Platform | undefined
  readonly runCommand?: (
    file: string,
    args: readonly string[],
    env?: NodeJS.ProcessEnv,
  ) => Promise<void>
}

const MAX_RECENT_NOTIFICATION_IDS = 128
const recentNotificationIds = new Set<string>()

const MACOS_NOTIFICATION_SCRIPT = [
  'on run argv',
  '  set notifTitle to item 1 of argv',
  '  set notifSubtitle to item 2 of argv',
  '  set notifBody to item 3 of argv',
  '  set soundName to item 4 of argv',
  '  if soundName is not "" then',
  '    if notifSubtitle is not "" then',
  '      display notification notifBody with title notifTitle subtitle notifSubtitle sound name soundName',
  '    else',
  '      display notification notifBody with title notifTitle sound name soundName',
  '    end if',
  '  else',
  '    if notifSubtitle is not "" then',
  '      display notification notifBody with title notifTitle subtitle notifSubtitle',
  '    else',
  '      display notification notifBody with title notifTitle',
  '    end if',
  '  end if',
  'end run',
].join('\n')

const WINDOWS_TOAST_POWERSHELL_SCRIPT = [
  '$ErrorActionPreference = "Stop"',
  '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null',
  '[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null',
  '$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)',
  '$textNodes = $template.GetElementsByTagName("text")',
  '$null = $textNodes.Item(0).AppendChild($template.CreateTextNode($env:XPH_NOTIFY_TITLE))',
  '$null = $textNodes.Item(1).AppendChild($template.CreateTextNode($env:XPH_NOTIFY_BODY))',
  '$toast = [Windows.UI.Notifications.ToastNotification]::new($template)',
  '[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("codes.xpeach.harness").Show($toast)',
].join('; ')

const WINDOWS_ENCODED_COMMAND = Buffer.from(WINDOWS_TOAST_POWERSHELL_SCRIPT, 'utf16le').toString('base64')

function sanitizeNotificationText(value: string | undefined, maxChars: number): string {
  if (typeof value !== 'string') return ''
  let cleaned = ''
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code === 0x0a || code === 0x09 || (code >= 0x20 && code !== 0x7f)) {
      cleaned += value[index]
    }
  }
  const trimmed = cleaned.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= maxChars) return trimmed
  return `${trimmed.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`
}

function rememberNotificationId(id: string): boolean {
  if (!id) return true
  if (recentNotificationIds.has(id)) return false
  recentNotificationIds.add(id)
  if (recentNotificationIds.size > MAX_RECENT_NOTIFICATION_IDS) {
    const oldest = recentNotificationIds.values().next().value
    if (oldest !== undefined) recentNotificationIds.delete(oldest)
  }
  return true
}

/**
 * Clears the in-memory notification deduplication cache for unit tests.
 */
export function resetHostSystemNotificationCache(): void {
  recentNotificationIds.clear()
}

function defaultRunCommand(
  file: string,
  args: readonly string[],
  env?: NodeJS.ProcessEnv,
): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      [...args],
      {
        timeout: 4_500,
        windowsHide: true,
        ...(env ? { env } : {}),
      },
      (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      },
    )
  })
}

/**
 * Dispatches a native OS notification from the Host process on macOS, Windows, or Linux.
 *
 * @param request - Notification content, urgency, and deduplication identifier.
 * @param options - Optional platform override and command runner for tests.
 * @returns Delivery status and platform identifier.
 */
export async function dispatchHostSystemNotification(
  request: XPeachSystemNotificationRequest,
  options: XPeachSystemNotificationOptions = {},
): Promise<XPeachSystemNotificationResult> {
  const platform = options.platform ?? process.platform
  const runCommand = options.runCommand ?? defaultRunCommand

  const id = sanitizeNotificationText(request.id, 160)
  const title = sanitizeNotificationText(request.title, 120)
  const subtitle = sanitizeNotificationText(request.subtitle, 120)
  const body = sanitizeNotificationText(request.body, 280)

  if (!title || !body) {
    return { delivered: false, platform, reason: 'empty_payload' }
  }

  if (!rememberNotificationId(id)) {
    return { delivered: false, platform, reason: 'duplicate' }
  }

  const combinedTitle = subtitle ? `${title} · ${subtitle}` : title

  try {
    if (platform === 'darwin') {
      const soundName = request.silent ? '' : request.urgent ? 'Ping' : 'Glass'
      await runCommand('/usr/bin/osascript', [
        '-e',
        MACOS_NOTIFICATION_SCRIPT,
        '--',
        title,
        subtitle,
        body,
        soundName,
      ])
      return { delivered: true, platform }
    }

    if (platform === 'linux') {
      const urgency = request.urgent ? 'critical' : 'normal'
      const expireTime = request.urgent ? '15000' : '7000'
      await runCommand('notify-send', [
        '--app-name=XPeach Harness',
        `--urgency=${urgency}`,
        `--expire-time=${expireTime}`,
        combinedTitle,
        body,
      ])
      return { delivered: true, platform }
    }

    if (platform === 'win32') {
      await runCommand(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-WindowStyle',
          'Hidden',
          '-EncodedCommand',
          WINDOWS_ENCODED_COMMAND,
        ],
        {
          ...process.env,
          XPH_NOTIFY_TITLE: combinedTitle,
          XPH_NOTIFY_BODY: body,
        },
      )
      return { delivered: true, platform }
    }

    return { delivered: false, platform, reason: 'unsupported_platform' }
  } catch (err) {
    return {
      delivered: false,
      platform,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}
