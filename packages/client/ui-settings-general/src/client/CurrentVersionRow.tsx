/** Installed release version and inline update controls in General Settings for Web and Desktop. */
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { IconDownloadOutlineRegular, IconLoadingOutlineRegular, Switch } from '@xpeach/xph-client-ui-primitives'
import type { ObservableSnapshot } from '@xpeach/xph-client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@xpeach/xph-client-ui-slots'
import type { DesktopUpdatePresentation, DesktopUpdateView } from '../types.ts'
import { desktopUpdateFailureCopy } from './DesktopUpdateIndicator.tsx'
import css from './CurrentVersionRow.module.css'

const AUTO_UPDATE_STORAGE_KEY = 'xpeach.desktop.autoCheckUpdate'

const BUSY_PHASES: ReadonlySet<DesktopUpdatePresentation['phase']> = new Set([
  'checking', 'downloading', 'verifying', 'installing',
])

/** Optional Desktop update carrier injected when running inside the Electron shell. */
export interface CurrentVersionRowInjected {
  hooks: { desktopUpdate: ObservableSnapshot<DesktopUpdateView> }
  openDesktopUpdate(): void
  refreshDesktopUpdate?(): void
}

/** Props accepted by {@link CurrentVersionRow}. */
export type CurrentVersionRowProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'settings'>
  & Partial<InjectFace<CurrentVersionRowInjected>>

function readAutoUpdatePreference(): boolean {
  try {
    return globalThis.localStorage.getItem(AUTO_UPDATE_STORAGE_KEY) !== '0'
  } catch (_storageError) {
    return true
  }
}

function writeAutoUpdatePreference(enabled: boolean): void {
  try {
    globalThis.localStorage.setItem(AUTO_UPDATE_STORAGE_KEY, enabled ? '1' : '0')
  } catch (_storageError) {
    // Ignore private-mode or sandboxed storage restrictions.
  }
}

/**
 * Render the version embedded by the client build alongside Desktop update controls when available.
 * @param props - runtime share, localized copy, and optional Desktop update carrier.
 * @returns the current release row (plus inline update check and auto-update controls on Desktop),
 * or nothing when build metadata is absent.
 */
export function CurrentVersionRow({
  t, useDesktopUpdate, openDesktopUpdate, refreshDesktopUpdate,
}: CurrentVersionRowProps) {
  const version = process.env.DSH_CLIENT_VERSION
  const [autoUpdate, setAutoUpdate] = useState<boolean>(() => readAutoUpdatePreference())

  useEffect(() => {
    if (autoUpdate && refreshDesktopUpdate !== undefined) {
      refreshDesktopUpdate()
    }
  }, [autoUpdate, refreshDesktopUpdate])

  if (version === undefined) return null
  if (useDesktopUpdate === undefined || openDesktopUpdate === undefined) {
    return <div className={css.row}>{t('general.currentVersion', { version })}</div>
  }

  const { presentation: state, failed, opening } = useDesktopUpdate(value => value)
  const phase = state?.phase ?? 'idle'
  const busy = opening || (state !== undefined && BUSY_PHASES.has(state.phase))
  const isError = failed || phase === 'error'
  const isActionHighlight = phase === 'available' || phase === 'ready'

  let badgeLabel = t('general.updateUpToDate')
  let badgeTone: 'neutral' | 'brand' | 'error' = 'neutral'
  if (isError) {
    badgeLabel = desktopUpdateFailureCopy(state?.failure, t, 'check')
    badgeTone = 'error'
  } else if (opening || phase === 'checking') {
    badgeLabel = t('desktop.update.checking')
    badgeTone = 'brand'
  } else if (phase === 'available') {
    badgeLabel = t('general.updateAvailableBadge', { version: state?.version ?? '' })
    badgeTone = 'brand'
  } else if (phase === 'downloading') {
    badgeLabel = t('desktop.update.progress', { percent: state?.percent ?? 0 })
    badgeTone = 'brand'
  } else if (phase === 'verifying') {
    badgeLabel = t('desktop.update.verifying')
    badgeTone = 'brand'
  } else if (phase === 'installing') {
    badgeLabel = t('desktop.update.installing')
    badgeTone = 'brand'
  } else if (phase === 'ready') {
    badgeLabel = t('desktop.update.ready')
    badgeTone = 'brand'
  }

  let buttonLabel = t('general.checkUpdate')
  if (isError) {
    buttonLabel = t('desktop.update.retry')
  } else if (opening || phase === 'checking') {
    buttonLabel = t('desktop.update.checking')
  } else if (phase === 'available') {
    buttonLabel = t('general.updateDownloadNow')
  } else if (phase === 'downloading') {
    buttonLabel = t('desktop.update.progress', { percent: state?.percent ?? 0 })
  } else if (phase === 'verifying') {
    buttonLabel = t('desktop.update.verifying')
  } else if (phase === 'installing') {
    buttonLabel = t('desktop.update.installing')
  } else if (phase === 'ready') {
    buttonLabel = t('desktop.update.ready')
  }

  return (
    <div className={css.desktopContainer}>
      <div className={css.autoUpdateRow}>
        <div className={css.autoUpdateText}>
          <div className={css.title}>{t('general.autoUpdate.title')}</div>
          <div className={css.description}>{t('general.autoUpdate.description')}</div>
        </div>
        <Switch
          checked={autoUpdate}
          label={t('general.autoUpdate.title')}
          onChange={(next) => {
            setAutoUpdate(next)
            writeAutoUpdatePreference(next)
            if (next) refreshDesktopUpdate?.()
          }}
        />
      </div>
      <div className={css.versionBar}>
        <div className={css.versionInfo}>
          <span className={css.versionText}>{t('general.currentVersion', { version })}</span>
          <span className={clsx(
            css.statusBadge,
            badgeTone === 'brand' && css.statusBadgeBrand,
            badgeTone === 'error' && css.statusBadgeError,
          )}>
            { badgeLabel }
          </span>
        </div>
        <button
          type="button"
          className={clsx(css.updateButton, isActionHighlight && css.updateButtonPrimary)}
          disabled={busy}
          onClick={() => { if (!busy) openDesktopUpdate() }}
        >
          {busy
            ? <IconLoadingOutlineRegular className={css.spinner} size={14} />
            : <IconDownloadOutlineRegular size={14} />}
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  )
}
