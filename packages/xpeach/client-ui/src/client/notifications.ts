/**
 * Cross-platform task & interaction notification orchestrator for XPeach Harness.
 *
 * Bridges session lifecycle events (`completed`, `error`) and interactive
 *composer states (`approval`, `question`, `plan-review`) to:
 * 1. Native Desktop notifications (Electron `Notification`, Dock bounce/badge on
 *    macOS, WinRT Toast + taskbar flash on Windows, libnotify urgency on Linux);
 * 2. Host-side native OS notifications (`osascript` / PowerShell Toast /
 *    `notify-send`) when running in Web/CLI mode;
 * 3. Browser Web Notifications and an in-app floating notification banner with
 *    one-click session jump.
 * @module
 */

import type { XPeachKey } from './locales.ts'

/** Notification category for a session lifecycle or interaction event. */
export type XPeachTaskNotificationKind =
  | 'completed'
  | 'approval'
  | 'question'
  | 'plan-review'
  | 'error'

/** User-configurable notification preferences persisted in `localStorage`. */
export interface XPeachNotificationPreferences {
  readonly enabled: boolean
  readonly sound: boolean
}

/** Formatted, localized notification item ready for OS and in-app display. */
export interface XPeachTaskNotificationItem {
  readonly id: string
  readonly sessionId: string
  readonly kind: XPeachTaskNotificationKind
  readonly badge: string
  readonly title: string
  readonly subtitle: string
  readonly body: string
  readonly actionLabel: string
  readonly urgent: boolean
  readonly createdAt: number
}

/** Translator callback signature for the `xpeach.account` locale namespace. */
export type XPeachTranslateFn = (
  key: XPeachKey,
  params?: Readonly<Record<string, string | number>>,
) => string

/** Minimal question option shape projected from `PendingQuestion`. */
export interface NotificationQuestionOptionLike {
  readonly label: string
  readonly description?: string | undefined
}

/** Minimal question item shape projected from `PendingQuestion`. */
export interface NotificationQuestionItemLike {
  readonly id: string
  readonly question: string
  readonly detail?: string | undefined
  readonly options?: readonly NotificationQuestionOptionLike[] | undefined
}

/** Input parameters for formatting a tool approval notification. */
export interface FormatApprovalNotificationInput {
  readonly sessionId: string
  readonly sessionTitle?: string | null | undefined
  readonly cwd?: string | null | undefined
  readonly key: string
  readonly toolName: string
  readonly reason?: string | undefined
  readonly displayReasonText?: string | undefined
  readonly t: XPeachTranslateFn
}

/** Input parameters for formatting a user question or plan-review notification. */
export interface FormatQuestionNotificationInput {
  readonly sessionId: string
  readonly sessionTitle?: string | null | undefined
  readonly cwd?: string | null | undefined
  readonly key: string
  readonly kind: 'question' | 'plan-review'
  readonly questions: readonly NotificationQuestionItemLike[]
  readonly t: XPeachTranslateFn
}

/** Input parameters for formatting a task completion notification. */
export interface FormatCompletionNotificationInput {
  readonly sessionId: string
  readonly sessionTitle?: string | null | undefined
  readonly cwd?: string | null | undefined
  readonly durationMs?: number | undefined
  readonly t: XPeachTranslateFn
}

/** Input parameters for formatting a task error notification. */
export interface FormatErrorNotificationInput {
  readonly sessionId: string
  readonly sessionTitle?: string | null | undefined
  readonly cwd?: string | null | undefined
  readonly message?: string | undefined
  readonly t: XPeachTranslateFn
}

/** Desktop notification bridge exposed on `window.dshDesktop.notifications`. */
interface DesktopNotificationsWindowBridge {
  readonly notify: (payload: {
    readonly id: string
    readonly sessionId: string
    readonly kind: XPeachTaskNotificationKind
    readonly title: string
    readonly subtitle?: string | undefined
    readonly body: string
    readonly urgent?: boolean | undefined
    readonly silent?: boolean | undefined
  }) => Promise<{ readonly shown: boolean; readonly reason?: string | undefined }>
  readonly subscribeClick: (listener: (payload: { readonly id: string; readonly sessionId: string }) => void) => () => void
}

const PREF_ENABLED_KEY = 'xpeach.notifications.enabled'
const PREF_SOUND_KEY = 'xpeach.notifications.sound'
const MAX_VISIBLE_BANNERS = 3
const MAX_DELIVERED_IDS = 160

const preferenceListeners = new Set<() => void>()
const bannerListeners = new Set<() => void>()
const bannerTimers = new Map<string, ReturnType<typeof setTimeout>>()
const deliveredNotificationIds = new Set<string>()
let memoryPreferences: XPeachNotificationPreferences = { enabled: true, sound: true }
let activeBanners: readonly XPeachTaskNotificationItem[] = []
let sessionNavigator: ((sessionId: string) => void) | null = null

/**
 * Reads the persisted notification preferences from `localStorage`.
 *
 * @returns Current notification enabled and sound flags (both default to `true`).
 */
export function readNotificationPreferences(): XPeachNotificationPreferences {
  try {
    if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
      return memoryPreferences
    }
    const rawEnabled = localStorage.getItem(PREF_ENABLED_KEY)
    const rawSound = localStorage.getItem(PREF_SOUND_KEY)
    return {
      enabled: rawEnabled === null ? memoryPreferences.enabled : rawEnabled !== '0' && rawEnabled !== 'false',
      sound: rawSound === null ? memoryPreferences.sound : rawSound !== '0' && rawSound !== 'false',
    }
  } catch (_err) {
    return memoryPreferences
  }
}

/**
 * Updates and persists notification preferences in `localStorage`.
 *
 * @param patch - Partial preference fields to update.
 * @returns Updated notification preferences snapshot.
 */
export function writeNotificationPreferences(
  patch: Partial<XPeachNotificationPreferences>,
): XPeachNotificationPreferences {
  const current = readNotificationPreferences()
  const next: XPeachNotificationPreferences = {
    enabled: patch.enabled ?? current.enabled,
    sound: patch.sound ?? current.sound,
  }
  memoryPreferences = next
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(PREF_ENABLED_KEY, next.enabled ? '1' : '0')
      localStorage.setItem(PREF_SOUND_KEY, next.sound ? '1' : '0')
    }
  } catch (_err) {
    // Ignore storage quota errors in restricted webviews.
  }
  for (const listener of preferenceListeners) {
    listener()
  }
  return next
}

/**
 * Subscribes to changes in user notification preferences.
 *
 * @param listener - Callback invoked whenever preferences change.
 * @returns Unsubscribe disposer.
 */
export function subscribeNotificationPreferences(listener: () => void): () => void {
  preferenceListeners.add(listener)
  return () => {
    preferenceListeners.delete(listener)
  }
}

function emitBannerChange(): void {
  for (const listener of bannerListeners) {
    listener()
  }
}

/**
 * Returns the currently visible in-app floating notification banners.
 *
 * @returns Ordered list of active notification items (newest first).
 */
export function getActiveNotificationBanners(): readonly XPeachTaskNotificationItem[] {
  return activeBanners
}

/**
 * Subscribes to changes in the in-app floating notification banner list.
 *
 * @param listener - Callback invoked when banners are added or dismissed.
 * @returns Unsubscribe disposer.
 */
export function subscribeNotificationBanners(listener: () => void): () => void {
  bannerListeners.add(listener)
  return () => {
    bannerListeners.delete(listener)
  }
}

/**
 * Dismisses one in-app notification banner by its id.
 *
 * @param id - Notification identifier to dismiss.
 */
export function dismissNotificationBanner(id: string): void {
  const timer = bannerTimers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    bannerTimers.delete(id)
  }
  const next = activeBanners.filter(item => item.id !== id)
  if (next.length !== activeBanners.length) {
    activeBanners = next
    emitBannerChange()
  }
}

/**
 * Dismisses any pending-interaction notification banners belonging to a session.
 *
 * @param sessionId - Session identifier whose pending interaction settled.
 */
export function clearSessionInteractionBanners(sessionId: string): void {
  const toRemove = activeBanners.filter(
    item =>
      item.sessionId === sessionId
      && (item.kind === 'approval' || item.kind === 'question' || item.kind === 'plan-review'),
  )
  for (const item of toRemove) {
    dismissNotificationBanner(item.id)
  }
}

/**
 * Clears all active in-app notification banners and deduplication history for tests.
 */
export function resetNotificationStateForTests(): void {
  for (const timer of bannerTimers.values()) {
    clearTimeout(timer)
  }
  bannerTimers.clear()
  deliveredNotificationIds.clear()
  activeBanners = []
  emitBannerChange()
}

/**
 * Navigates to the session associated with a notification and dismisses its banner.
 *
 * @param item - Notification item whose session should be opened.
 */
export function openNotificationSession(item: Pick<XPeachTaskNotificationItem, 'id' | 'sessionId'>): void {
  dismissNotificationBanner(item.id)
  if (item.sessionId && sessionNavigator !== null) {
    sessionNavigator(item.sessionId)
  }
}

function pushNotificationBanner(item: XPeachTaskNotificationItem): void {
  const existingTimer = bannerTimers.get(item.id)
  if (existingTimer !== undefined) {
    clearTimeout(existingTimer)
    bannerTimers.delete(item.id)
  }
  const filtered = activeBanners.filter(
    existing => existing.id !== item.id && !(existing.sessionId === item.sessionId && existing.kind === item.kind),
  )
  activeBanners = [item, ...filtered].slice(0, MAX_VISIBLE_BANNERS)
  const ttlMs = item.urgent ? 16_000 : 7_500
  const timer = setTimeout(() => {
    bannerTimers.delete(item.id)
    dismissNotificationBanner(item.id)
  }, ttlMs)
  bannerTimers.set(item.id, timer)
  emitBannerChange()
}

function compactText(raw: string | null | undefined, maxChars: number): string {
  if (typeof raw !== 'string') return ''
  const singleLine = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (singleLine.length <= maxChars) return singleLine
  return `${singleLine.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`
}

function extractWorkspaceBasename(cwd: string | null | undefined): string {
  if (typeof cwd !== 'string' || !cwd.trim()) return ''
  const normalized = cwd.trim().replace(/[\\/]+$/, '')
  const segments = normalized.split(/[\\/]/)
  return segments[segments.length - 1] ?? ''
}

/**
 * Builds a clean `workspace · sessionTitle` subtitle for notifications.
 *
 * @param sessionTitle - Human-readable session title.
 * @param cwd - Optional session working directory path.
 * @param fallback - Optional fallback label when both title and cwd are empty.
 * @returns Formatted subtitle string.
 */
export function formatWorkspaceSessionSubtitle(
  sessionTitle: string | null | undefined,
  cwd: string | null | undefined,
  fallback = '',
): string {
  const workspace = extractWorkspaceBasename(cwd)
  const title = compactText(sessionTitle, 44)
  if (workspace && title && workspace.toLowerCase() !== title.toLowerCase()) {
    return `${workspace} · ${title}`
  }
  return title || workspace || fallback
}

/**
 * Formats an elapsed millisecond duration into a concise human-readable label.
 *
 * @param durationMs - Elapsed duration in milliseconds.
 * @param t - Locale translator function.
 * @returns Formatted duration label (e.g. `18s` or `2m 15s`).
 */
export function formatNotificationDuration(
  durationMs: number | undefined,
  t: XPeachTranslateFn,
): string {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 1_000) {
    return ''
  }
  const totalSeconds = Math.max(1, Math.round(durationMs / 1_000))
  if (totalSeconds < 60) {
    return t('profile.dur.s', { s: totalSeconds })
  }
  const totalMinutes = Math.floor(totalSeconds / 60)
  const remSeconds = totalSeconds % 60
  if (totalMinutes < 60) {
    return t('profile.dur.ms', { m: totalMinutes, s: remSeconds })
  }
  const hours = Math.floor(totalMinutes / 60)
  const remMinutes = totalMinutes % 60
  return t('profile.dur.hm', { h: hours, m: remMinutes })
}

/**
 * Translates an internal tool identifier into a concise, localized label.
 *
 * @param toolName - Raw tool name (e.g. `bash`, `write_file`, `mcp__github__create_issue`).
 * @param t - Locale translator function.
 * @returns Human-friendly localized tool name.
 */
export function formatToolDisplayName(toolName: string, t: XPeachTranslateFn): string {
  const normalized = toolName.trim().toLowerCase()
  if (normalized === 'bash' || normalized === 'shell' || normalized === 'run_command' || normalized === 'terminal') {
    return t('notify.tool.bash')
  }
  if (normalized === 'write_file' || normalized === 'create_file') {
    return t('notify.tool.writeFile')
  }
  if (normalized === 'edit_file' || normalized === 'multi_edit' || normalized === 'apply_patch') {
    return t('notify.tool.editFile')
  }
  if (normalized === 'read_file' || normalized === 'list_dir' || normalized === 'glob' || normalized === 'grep') {
    return t('notify.tool.readFile')
  }
  if (normalized === 'web_search' || normalized === 'search_web') {
    return t('notify.tool.webSearch')
  }
  if (normalized === 'web_fetch' || normalized === 'fetch_url') {
    return t('notify.tool.webFetch')
  }
  if (normalized.startsWith('browser')) {
    return t('notify.tool.browser')
  }
  if (normalized.startsWith('computer')) {
    return t('notify.tool.computer')
  }
  if (normalized.startsWith('mcp__') || normalized.startsWith('mcp_')) {
    const parts = toolName.replace(/^mcp_+/, '').split(/__|:/)
    const cleanName = parts.filter(Boolean).slice(0, 2).join(' · ') || toolName
    return t('notify.tool.mcp', { name: cleanName })
  }
  return t('notify.tool.generic', { name: toolName })
}

/**
 * Formats a tool approval request into a beautified notification item.
 *
 * @param input - Approval notification fields and translator.
 * @returns Beautified notification item.
 */
export function formatApprovalNotification(
  input: FormatApprovalNotificationInput,
): XPeachTaskNotificationItem {
  const { sessionId, sessionTitle, cwd, key, toolName, reason, displayReasonText, t } = input
  const friendlyTool = formatToolDisplayName(toolName, t)
  const subtitle = formatWorkspaceSessionSubtitle(sessionTitle, cwd, t('brand.title'))
  const rawReason = compactText(displayReasonText || reason, 150)
  const body = rawReason || t('notify.body.approvalFallback', { tool: friendlyTool })
  return {
    id: `approval:${sessionId}:${key}`,
    sessionId,
    kind: 'approval',
    badge: t('notify.badge.approval'),
    title: t('notify.title.approval', { tool: friendlyTool }),
    subtitle,
    body,
    actionLabel: t('notify.action.handleNow'),
    urgent: true,
    createdAt: Date.now(),
  }
}

/**
 * Formats a user question or plan-review request into a beautified notification item.
 *
 * @param input - Question or plan-review notification fields and translator.
 * @returns Beautified notification item.
 */
export function formatQuestionNotification(
  input: FormatQuestionNotificationInput,
): XPeachTaskNotificationItem {
  const { sessionId, sessionTitle, cwd, key, kind, questions, t } = input
  const subtitle = formatWorkspaceSessionSubtitle(sessionTitle, cwd, t('brand.title'))
  const firstQuestion = questions[0]

  if (kind === 'plan-review') {
    const detailPreview = compactText(firstQuestion?.detail || firstQuestion?.question, 150)
    return {
      id: `plan-review:${sessionId}:${key}`,
      sessionId,
      kind: 'plan-review',
      badge: t('notify.badge.planReview'),
      title: t('notify.title.planReview'),
      subtitle,
      body: detailPreview || t('notify.body.planReviewFallback'),
      actionLabel: t('notify.action.reviewPlan'),
      urgent: true,
      createdAt: Date.now(),
    }
  }

  const count = questions.length
  const title = count > 1
    ? t('notify.title.questionMulti', { count })
    : t('notify.title.question')
  const questionText = compactText(firstQuestion?.question, 100)
  const optionLabels = (firstQuestion?.options ?? [])
    .map(opt => compactText(opt.label, 28))
    .filter(Boolean)
    .slice(0, 3)

  let body = t('notify.body.questionFallback')
  if (questionText && optionLabels.length > 0) {
    body = t('notify.body.questionOptions', {
      question: questionText,
      options: optionLabels.join(' / '),
    })
  } else if (questionText) {
    body = questionText
  }

  return {
    id: `question:${sessionId}:${key}`,
    sessionId,
    kind: 'question',
    badge: t('notify.badge.question'),
    title,
    subtitle,
    body,
    actionLabel: t('notify.action.handleNow'),
    urgent: true,
    createdAt: Date.now(),
  }
}

/**
 * Formats a task completion event into a beautified notification item.
 *
 * @param input - Completion notification fields and translator.
 * @returns Beautified notification item.
 */
export function formatCompletionNotification(
  input: FormatCompletionNotificationInput,
): XPeachTaskNotificationItem {
  const { sessionId, sessionTitle, cwd, durationMs, t } = input
  const subtitle = formatWorkspaceSessionSubtitle(sessionTitle, cwd, t('brand.title'))
  const cleanSession = compactText(sessionTitle, 48) || extractWorkspaceBasename(cwd) || t('brand.title')
  const durationLabel = formatNotificationDuration(durationMs, t)
  const body = durationLabel
    ? t('notify.body.completedWithDuration', { session: cleanSession, duration: durationLabel })
    : t('notify.body.completed', { session: cleanSession })

  return {
    id: `completed:${sessionId}:${Date.now()}`,
    sessionId,
    kind: 'completed',
    badge: t('notify.badge.completed'),
    title: t('notify.title.completed'),
    subtitle,
    body,
    actionLabel: t('notify.action.viewResult'),
    urgent: false,
    createdAt: Date.now(),
  }
}

/**
 * Formats a session error event into a beautified notification item.
 *
 * @param input - Error notification fields and translator.
 * @returns Beautified notification item.
 */
export function formatErrorNotification(
  input: FormatErrorNotificationInput,
): XPeachTaskNotificationItem {
  const { sessionId, sessionTitle, cwd, message, t } = input
  const subtitle = formatWorkspaceSessionSubtitle(sessionTitle, cwd, t('brand.title'))
  const cleanSession = compactText(sessionTitle, 44) || extractWorkspaceBasename(cwd) || t('brand.title')
  const cleanMessage = compactText(message, 150)
  return {
    id: `error:${sessionId}:${Date.now()}`,
    sessionId,
    kind: 'error',
    badge: t('notify.badge.error'),
    title: t('notify.title.error'),
    subtitle,
    body: cleanMessage || t('notify.body.errorFallback', { session: cleanSession }),
    actionLabel: t('notify.action.viewResult'),
    urgent: true,
    createdAt: Date.now(),
  }
}

/**
 * Plays a gentle synthesized Web Audio API chime matching the notification kind.
 *
 * @param kind - Notification category determining chime pitch and cadence.
 */
export function playNotificationChime(kind: XPeachTaskNotificationKind): void {
  try {
    if (typeof window === 'undefined') return
    const AudioCtx = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (typeof AudioCtx !== 'function') return

    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const notes =
      kind === 'completed'
        ? [
          { freq: 523.25, start: 0, dur: 0.11 },
          { freq: 659.25, start: 0.09, dur: 0.18 },
        ]
        : kind === 'error'
          ? [
            { freq: 440, start: 0, dur: 0.12 },
            { freq: 349.23, start: 0.11, dur: 0.2 },
          ]
          : [
            { freq: 587.33, start: 0, dur: 0.1 },
            { freq: 880, start: 0.09, dur: 0.18 },
          ]

    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(note.freq, now + note.start)
      gain.gain.setValueAtTime(0.0001, now + note.start)
      gain.gain.exponentialRampToValueAtTime(0.065, now + note.start + 0.018)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + note.start)
      osc.stop(now + note.start + note.dur + 0.02)
    }

    setTimeout(() => {
      void ctx.close().catch(() => {})
    }, 450)
  } catch (_err) {
    // Audio playback is best-effort when autoplay policy blocks synthesis.
  }
}

function getDesktopNotificationsBridge(): DesktopNotificationsWindowBridge | undefined {
  const desktop = (globalThis as {
    dshDesktop?: { notifications?: DesktopNotificationsWindowBridge }
  }).dshDesktop
  return desktop?.notifications
}

function rememberDeliveredId(id: string): boolean {
  if (deliveredNotificationIds.has(id)) return false
  deliveredNotificationIds.add(id)
  if (deliveredNotificationIds.size > MAX_DELIVERED_IDS) {
    const oldest = deliveredNotificationIds.values().next().value
    if (oldest !== undefined) deliveredNotificationIds.delete(oldest)
  }
  return true
}

/** Options for dispatching a formatted notification item. */
export interface DispatchTaskNotificationOptions {
  readonly showInAppBanner?: boolean | undefined
  readonly force?: boolean | undefined
  readonly sendHostNotification?: ((req: {
    id: string
    kind: XPeachTaskNotificationKind
    title: string
    subtitle?: string | undefined
    body: string
    urgent?: boolean | undefined
    silent?: boolean | undefined
  }) => Promise<unknown>) | undefined
}

/**
 * Dispatches a formatted notification item across Desktop IPC, Host OS fallback,
 * Web Notification API, and the in-app floating overlay.
 *
 * @param item - Formatted notification item.
 * @param options - Delivery options and Host RPC callback.
 */
export async function dispatchTaskNotification(
  item: XPeachTaskNotificationItem,
  options: DispatchTaskNotificationOptions = {},
): Promise<void> {
  const prefs = readNotificationPreferences()
  if (!prefs.enabled && !options.force) return
  if (!options.force && !rememberDeliveredId(item.id)) return

  if (options.showInAppBanner !== false) {
    pushNotificationBanner(item)
  }

  const desktopBridge = getDesktopNotificationsBridge()
  if (desktopBridge !== undefined) {
    if (prefs.sound && typeof document !== 'undefined' && document.hasFocus()) {
      playNotificationChime(item.kind)
    }
    try {
      await desktopBridge.notify({
        id: item.id,
        sessionId: item.sessionId,
        kind: item.kind,
        title: item.title,
        subtitle: item.subtitle,
        body: item.body,
        urgent: item.urgent,
        silent: !prefs.sound,
      })
      return
    } catch (_err) {
      // Fall through to Host/Web notification if desktop IPC fails.
    }
  }

  if (prefs.sound) {
    playNotificationChime(item.kind)
  }

  let shownByBrowser = false
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (window.Notification.permission === 'default' && options.force) {
        await window.Notification.requestPermission().catch(() => 'default')
      }
      if (window.Notification.permission === 'granted') {
        const combinedTitle = item.subtitle ? `${item.title} · ${item.subtitle}` : item.title
        const browserNotif = new window.Notification(combinedTitle, {
          body: item.body,
          tag: item.id,
          requireInteraction: item.urgent,
          silent: !prefs.sound,
        })
        browserNotif.onclick = () => {
          window.focus()
          openNotificationSession(item)
          browserNotif.close()
        }
        shownByBrowser = true
      }
    } catch (_err) {
      shownByBrowser = false
    }
  }

  if (!shownByBrowser && options.sendHostNotification !== undefined) {
    await options.sendHostNotification({
      id: item.id,
      kind: item.kind,
      title: item.title,
      subtitle: item.subtitle,
      body: item.body,
      urgent: item.urgent,
      silent: !prefs.sound,
    }).catch(() => {})
  }
}

/**
 * Triggers a preview notification from the Settings panel so the user can test
 * both the native OS popup and the in-app banner.
 *
 * @param t - Locale translator function.
 * @param sendHostNotification - Optional Host OS notification RPC callback.
 */
export async function triggerTestSystemNotification(
  t: XPeachTranslateFn,
  sendHostNotification?: DispatchTaskNotificationOptions['sendHostNotification'],
): Promise<void> {
  const item: XPeachTaskNotificationItem = {
    id: `test-notify:${Date.now()}`,
    sessionId: '',
    kind: 'completed',
    badge: t('notify.badge.completed'),
    title: t('notify.test.title'),
    subtitle: t('notify.test.subtitle'),
    body: t('notify.test.body'),
    actionLabel: t('notify.action.dismiss'),
    urgent: false,
    createdAt: Date.now(),
  }
  await dispatchTaskNotification(item, {
    force: true,
    showInAppBanner: true,
    sendHostNotification,
  })
}

/** Structural contract for a pending interaction on `uiSession.sessionStatus`. */
interface PendingInteractionLike {
  readonly kind: 'approval' | 'question' | 'plan-review'
  readonly key: string
  readonly toolName?: string | undefined
  readonly reason?: string | undefined
  readonly displayReason?: { readonly en: string; readonly [locale: string]: string } | undefined
  readonly questions?: readonly NotificationQuestionItemLike[] | undefined
  readonly review?: readonly unknown[] | undefined
}

/** Structural contract for a session status entry in `uiSession.sessionStatus`. */
interface SessionStatusEntryLike {
  readonly running: boolean
  readonly pendingInteraction: PendingInteractionLike | undefined
}

/** Structural contract for a session summary entry in `sessions.list`. */
interface SessionSummaryEntryLike {
  readonly id: string
  readonly displayTitle?: string | null | undefined
  readonly title?: string | null | undefined
  readonly cwd?: string | null | undefined
  readonly origin?: string | undefined
  readonly running?: boolean | undefined
  readonly retainedBy?: { readonly mainView?: number | undefined } | undefined
}

/** Structural contract for the client context consumed by {@link installTaskNotificationMonitor}. */
export interface NotificationMonitorContextLike {
  readonly get: (name: string) => unknown
  readonly on: (event: string, listener: (...args: unknown[]) => void) => () => void
  readonly locale: {
    readonly bind: (ns: 'xpeach.account') => XPeachTranslateFn
    readonly resolveText: (text: { readonly en: string; readonly [locale: string]: string }) => string
  }
  readonly layout: {
    readonly getSnapshot?: () => { readonly activePanel: string | null }
    readonly selectPanel: (panel: null) => void
  }
  readonly remote: {
    readonly $on: (event: string, listener: (...args: never[]) => void) => () => void
  }
}

/**
 * Installs the session lifecycle and pending-interaction notification monitor.
 *
 * @param ctx - Client context providing `locale`, `layout`, `remote`, and services.
 * @param sendHostNotification - Host RPC callback for OS notifications in Web mode.
 * @returns Cleanup disposer removing all subscriptions and active banners.
 */
export function installTaskNotificationMonitor(
  ctx: NotificationMonitorContextLike,
  sendHostNotification?: DispatchTaskNotificationOptions['sendHostNotification'],
): () => void {
  const undo: Array<() => void> = []
  const t = ctx.locale.bind('xpeach.account')

  const getSessionsService = (): {
    list: {
      getSnapshot: () => { readonly byId: Readonly<Record<string, SessionSummaryEntryLike>> }
      subscribe: (cb: () => void) => () => void
    }
  } | undefined =>
    ctx.get('sessions') as {
      list: {
        getSnapshot: () => { readonly byId: Readonly<Record<string, SessionSummaryEntryLike>> }
        subscribe: (cb: () => void) => () => void
      }
    } | undefined

  const getUiSessionService = (): {
    sessionStatus: {
      getSnapshot: () => ReadonlyMap<string, SessionStatusEntryLike>
      subscribe: (cb: () => void) => () => void
    }
  } | undefined =>
    ctx.get('uiSession') as {
      sessionStatus: {
        getSnapshot: () => ReadonlyMap<string, SessionStatusEntryLike>
        subscribe: (cb: () => void) => () => void
      }
    } | undefined

  const getUiWorkspaceService = (): {
    openSession: (sessionId: string) => void
  } | undefined =>
    ctx.get('uiWorkspace') as {
      openSession: (sessionId: string) => void
    } | undefined

  sessionNavigator = (sessionId: string) => {
    if (!sessionId) return
    const workspace = getUiWorkspaceService()
    if (workspace !== undefined) {
      workspace.openSession(sessionId)
    } else {
      ctx.layout.selectPanel(null)
    }
  }
  undo.push(() => {
    sessionNavigator = null
  })

  const desktopBridge = getDesktopNotificationsBridge()
  if (desktopBridge !== undefined) {
    undo.push(
      desktopBridge.subscribeClick(({ sessionId }) => {
        if (sessionId && sessionNavigator !== null) {
          sessionNavigator(sessionId)
        }
      }),
    )
  }

  const lookupSessionMeta = (
    sessionId: string,
  ): {
    title: string | undefined
    cwd: string | undefined
    isSubagent: boolean
    isMainViewActive: boolean
  } => {
    const byId = getSessionsService()?.list.getSnapshot().byId
    const summary = byId?.[sessionId]
    const title = (summary?.displayTitle ?? summary?.title ?? undefined) || undefined
    const cwd = summary?.cwd ?? undefined
    const isSubagent = summary?.origin === 'subagent'
    const isMainViewActive = (summary?.retainedBy?.mainView ?? 0) > 0
    return { title, cwd, isSubagent, isMainViewActive }
  }

  const isUserLookingAtSession = (isMainViewActive: boolean): boolean => {
    const windowFocused = typeof document !== 'undefined' ? document.hasFocus() && !document.hidden : true
    const activePanel = ctx.layout.getSnapshot?.().activePanel ?? null
    return windowFocused && activePanel === null && isMainViewActive
  }

  const runningBySession = new Map<string, boolean>()
  const turnStartedAtBySession = new Map<string, number>()
  const lastPendingKeyBySession = new Map<string, string | undefined>()
  const recentErrorAtBySession = new Map<string, number>()
  let statusSubscribed = false
  let seededInitialStatus = false

  const syncFromUiSession = (): void => {
    const uiSession = getUiSessionService()
    if (uiSession === undefined) return
    const snapshot = uiSession.sessionStatus.getSnapshot()

    if (!seededInitialStatus) {
      seededInitialStatus = true
      for (const [sessionId, status] of snapshot.entries()) {
        runningBySession.set(sessionId, status.running)
        if (status.running) {
          turnStartedAtBySession.set(sessionId, Date.now())
        }
        const pending = status.pendingInteraction
        if (pending !== undefined && pending.review === undefined) {
          lastPendingKeyBySession.set(sessionId, `${pending.kind}:${pending.key}`)
        }
      }
      return
    }

    for (const [sessionId, status] of snapshot.entries()) {
      const meta = lookupSessionMeta(sessionId)
      const prevRunning = runningBySession.get(sessionId) ?? false
      if (!prevRunning && status.running) {
        turnStartedAtBySession.set(sessionId, Date.now())
      }
      runningBySession.set(sessionId, status.running)

      const pending = status.pendingInteraction
      const pendingSignature =
        pending !== undefined && pending.review === undefined
          ? `${pending.kind}:${pending.key}`
          : undefined
      const prevPendingSignature = lastPendingKeyBySession.get(sessionId)

      if (pendingSignature === undefined && prevPendingSignature !== undefined) {
        lastPendingKeyBySession.delete(sessionId)
        clearSessionInteractionBanners(sessionId)
      } else if (pending !== undefined && pendingSignature !== undefined && pendingSignature !== prevPendingSignature) {
        lastPendingKeyBySession.set(sessionId, pendingSignature)
        const lookingAtSession = isUserLookingAtSession(meta.isMainViewActive)
        if (pending.kind === 'approval') {
          const displayReasonText =
            pending.displayReason !== undefined
              ? ctx.locale.resolveText(pending.displayReason)
              : undefined
          const item = formatApprovalNotification({
            sessionId,
            sessionTitle: meta.title,
            cwd: meta.cwd,
            key: pending.key,
            toolName: pending.toolName ?? 'tool',
            reason: pending.reason,
            displayReasonText,
            t,
          })
          void dispatchTaskNotification(item, {
            showInAppBanner: !lookingAtSession,
            sendHostNotification,
          })
        } else {
          const item = formatQuestionNotification({
            sessionId,
            sessionTitle: meta.title,
            cwd: meta.cwd,
            key: pending.key,
            kind: pending.kind,
            questions: pending.questions ?? [],
            t,
          })
          void dispatchTaskNotification(item, {
            showInAppBanner: !lookingAtSession,
            sendHostNotification,
          })
        }
      }

      if (prevRunning && !status.running && pendingSignature === undefined && !meta.isSubagent) {
        const lastErrAt = recentErrorAtBySession.get(sessionId) ?? 0
        if (Date.now() - lastErrAt > 2_500) {
          const startedAt = turnStartedAtBySession.get(sessionId)
          const durationMs = startedAt !== undefined ? Math.max(0, Date.now() - startedAt) : undefined
          turnStartedAtBySession.delete(sessionId)
          const lookingAtSession = isUserLookingAtSession(meta.isMainViewActive)
          const item = formatCompletionNotification({
            sessionId,
            sessionTitle: meta.title,
            cwd: meta.cwd,
            durationMs,
            t,
          })
          void dispatchTaskNotification(item, {
            showInAppBanner: !lookingAtSession,
            sendHostNotification,
          })
        }
      }
    }
  }

  const tryAttachUiSession = (): void => {
    if (statusSubscribed) return
    const uiSession = getUiSessionService()
    if (uiSession === undefined) return
    statusSubscribed = true
    syncFromUiSession()
    undo.push(uiSession.sessionStatus.subscribe(syncFromUiSession))
  }

  tryAttachUiSession()
  undo.push(
    ctx.on('internal/service', (name) => {
      if (name === 'uiSession' || name === 'sessions') {
        tryAttachUiSession()
      }
    }),
  )

  undo.push(
    ctx.remote.$on('api-session/status', ((sessionId: string, running: boolean) => {
      if (statusSubscribed) return
      const meta = lookupSessionMeta(sessionId)
      const prevRunning = runningBySession.get(sessionId) ?? false
      runningBySession.set(sessionId, running)
      if (!prevRunning && running) {
        turnStartedAtBySession.set(sessionId, Date.now())
        return
      }
      if (prevRunning && !running && !meta.isSubagent) {
        const lastErrAt = recentErrorAtBySession.get(sessionId) ?? 0
        if (Date.now() - lastErrAt <= 2_500) return
        const startedAt = turnStartedAtBySession.get(sessionId)
        const durationMs = startedAt !== undefined ? Math.max(0, Date.now() - startedAt) : undefined
        turnStartedAtBySession.delete(sessionId)
        const lookingAtSession = isUserLookingAtSession(meta.isMainViewActive)
        const item = formatCompletionNotification({
          sessionId,
          sessionTitle: meta.title,
          cwd: meta.cwd,
          durationMs,
          t,
        })
        void dispatchTaskNotification(item, {
          showInAppBanner: !lookingAtSession,
          sendHostNotification,
        })
      }
    }) as (...args: never[]) => void),
  )

  undo.push(
    ctx.remote.$on('api-session/error', ((sessionId: string, message: string) => {
      recentErrorAtBySession.set(sessionId, Date.now())
      const meta = lookupSessionMeta(sessionId)
      if (meta.isSubagent) return
      const lookingAtSession = isUserLookingAtSession(meta.isMainViewActive)
      const item = formatErrorNotification({
        sessionId,
        sessionTitle: meta.title,
        cwd: meta.cwd,
        message,
        t,
      })
      void dispatchTaskNotification(item, {
        showInAppBanner: !lookingAtSession,
        sendHostNotification,
      })
    }) as (...args: never[]) => void),
  )

  return () => {
    for (const fn of undo.reverse()) {
      fn()
    }
  }
}
