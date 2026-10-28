/**
 * One-shot localStorage migration: legacy `dsh.*` keys → `xph.*`.
 * Copies each known key when the new name is absent and removes nothing —
 * a user re-opening the stock build keeps its own data intact.
 */
const RENAMED_KEYS: readonly [string, string][] = [
  ['dsh.conversation.contentWidth', 'xph.conversation.contentWidth'],
  ['dsh.conversation', 'xph.conversation'],
  ['dsh.open-in-app.choice', 'xph.open-in-app.choice'],
  ['dsh.plugin-manager.install-registry', 'xph.plugin-manager.install-registry'],
  ['dsh.schedule.recent-time-zones.v1', 'xph.schedule.recent-time-zones.v1'],
  ['dsh.sidebar-browser.v1', 'xph.sidebar-browser.v1'],
  ['dsh.sidebar-right.v1', 'xph.sidebar-right.v1'],
  ['dsh.trajectory.duration', 'xph.trajectory.duration'],
  ['dsh.trajectory.jsonStringWrapping', 'xph.trajectory.jsonStringWrapping'],
  ['dsh.user-questions.drafts.v1', 'xph.user-questions.drafts.v1'],
  ['dsh.sessions.current', 'xph.sessions.current'],
  ['dsh.workspace.view.v5', 'xph.workspace.view.v5'],
  ['dsh.keybindings.v1', 'xph.keybindings.v1'],
]
const PREFIXED: readonly [string, string][] = [
  ['dsh.schedule.task-tab.v1.', 'xph.schedule.task-tab.v1.'],
  ['dsh.conversation.', 'xph.conversation.'],
  ['dsh.sidebar-right.v1.', 'xph.sidebar-right.v1.'],
]

export function migrateLegacyStorageKeys(): void {
  try {
    for (const [from, to] of RENAMED_KEYS) {
      const v = localStorage.getItem(from)
      if (v !== null && localStorage.getItem(to) === null) localStorage.setItem(to, v)
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k === null) continue
      for (const [fromP, toP] of PREFIXED) {
        if (k.startsWith(fromP)) {
          const to = toP + k.slice(fromP.length)
          const current = localStorage.getItem(k)
          if (current !== null && localStorage.getItem(to) === null) localStorage.setItem(to, current)
        }
      }
    }
  } catch { /* storage may be unavailable in private contexts */ }
}
