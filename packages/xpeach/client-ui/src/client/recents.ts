/**
 * Recently used models, most-recent first.
 *
 * The catalogue carries every route the site offers, which is long enough that
 * returning to the model used a minute ago means scrolling past twenty others.
 * A short recents list answers that without a second picker.
 *
 * Stored in localStorage beside the other client-side preferences: a corrupt or
 * absent entry reads as empty, and a failed write never blocks the switch that
 * caused it.
 */

/** How many entries the list keeps. */
export const RECENTS_LIMIT = 8

/** One remembered route. */
export interface RecentModel {
  readonly provider: string
  readonly model: string
}

const KEY = 'xph.model-recents'

/**
 * Narrow one parsed array element.
 * @param value - candidate element.
 * @returns the entry, or undefined when it is not a usable route.
 */
function asRecent(value: unknown): RecentModel | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const record = value as Record<string, unknown>
  return typeof record.provider === 'string' && record.provider !== ''
    && typeof record.model === 'string' && record.model !== ''
    ? { provider: record.provider, model: record.model }
    : undefined
}

/**
 * Read the list.
 * @returns remembered routes, most recent first.
 */
export function readRecents(): RecentModel[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(asRecent).filter((item): item is RecentModel => item !== undefined).slice(0, RECENTS_LIMIT)
  } catch {
    // Unavailable storage or malformed JSON has no usable list.
    return []
  }
}

/**
 * Put one route at the front, deduped and capped.
 * @param recents - existing list.
 * @param next - the route just used.
 * @returns the reordered list.
 */
export function promoteRecent(recents: readonly RecentModel[], next: RecentModel): RecentModel[] {
  const rest = recents.filter(item => !(item.provider === next.provider && item.model === next.model))
  return [next, ...rest].slice(0, RECENTS_LIMIT)
}

/**
 * Remember one route.
 * @param provider - route provider key.
 * @param model - model id.
 * @returns the list after the write.
 */
export function rememberModel(provider: string, model: string): RecentModel[] {
  const next = promoteRecent(readRecents(), { provider, model })
  if (typeof localStorage === 'undefined') return next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // A full or unavailable store simply forgets this pick.
  }
  return next
}
