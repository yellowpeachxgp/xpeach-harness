/** XPeach user-controllable request and gateway preference rows in General Settings. */
import { type JSX, useEffect, useState } from 'react'
import { Button, Switch } from '@xpeach/xph-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import {
  readNotificationPreferences,
  subscribeNotificationPreferences,
  triggerTestSystemNotification,
  writeNotificationPreferences,
} from './notifications.ts'
import type {
  XPeachOps,
  XPeachReleaseChannel,
  XPeachUpdateCheckResult,
} from './ops.ts'
import css from './xpeach.module.css'

const RELEASE_CHANNELS: readonly XPeachReleaseChannel[] = ['least', 'beta', 'alpha']

interface DesktopUpdatePresentation {
  readonly phase: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'installing' | 'ready' | 'error'
  readonly version?: string
  readonly percent?: number
  readonly failure?: string
}

interface DesktopUpdatesBridge {
  readonly status?: () => Promise<DesktopUpdatePresentation>
  readonly open?: () => Promise<void>
  readonly subscribe?: (listener: (state: DesktopUpdatePresentation) => void) => () => void
}

function getDesktopUpdatesBridge(): DesktopUpdatesBridge | undefined {
  return (globalThis as typeof globalThis & {
    dshDesktop?: { updates?: DesktopUpdatesBridge }
  }).dshDesktop?.updates
}

/** Props for the reusable {@link UpdateChannelPreferenceRow} control. */
export interface UpdateChannelPreferenceRowProps {
  readonly t: PropsLocale<'xpeach.account'>['t']
  readonly updateChannelStatus?: XPeachOps['updateChannelStatus'] | undefined
  readonly setUpdateChannel?: XPeachOps['setUpdateChannel'] | undefined
  readonly checkUpdate?: XPeachOps['checkUpdate'] | undefined
}

/**
 * Render the 3-way release update channel selector (`least`, `beta`, `alpha`),
 * compatibility hint, auto-check switch, check-for-updates trigger, and live Desktop update status banner.
 * @param props - locale translator and optional update-channel operations.
 * @returns the release update channel row and status banner.
 */
export function UpdateChannelPreferenceRow({
  t,
  updateChannelStatus,
  setUpdateChannel,
  checkUpdate,
}: UpdateChannelPreferenceRowProps): JSX.Element {
  const [channel, setChannel] = useState<XPeachReleaseChannel>('beta')
  const [currentVersion, setCurrentVersion] = useState('')
  const [autoCheck, setAutoCheck] = useState(true)
  const [channelBusy, setChannelBusy] = useState(false)
  const [checkBusy, setCheckBusy] = useState(false)
  const [checkResult, setCheckResult] = useState<XPeachUpdateCheckResult | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [desktopUpdate, setDesktopUpdate] = useState<DesktopUpdatePresentation | null>(null)

  useEffect(() => {
    if (updateChannelStatus === undefined) return
    let live = true
    void updateChannelStatus().then((res) => {
      if (!live || 'error' in res) return
      setChannel(res.subscribedChannel)
      setCurrentVersion(res.currentVersion)
      setAutoCheck(res.autoCheckUpdate)
    })
    return () => { live = false }
  }, [updateChannelStatus])

  useEffect(() => {
    const bridge = getDesktopUpdatesBridge()
    if (bridge === undefined) return
    let live = true
    if (typeof bridge.status === 'function') {
      void bridge.status().then((state) => {
        if (live) setDesktopUpdate(state)
      }).catch(() => {})
    }
    const unsubscribe = typeof bridge.subscribe === 'function'
      ? bridge.subscribe((state) => { if (live) setDesktopUpdate(state) })
      : undefined
    return () => {
      live = false
      unsubscribe?.()
    }
  }, [])

  const syncDesktopUpdater = (): void => {
    const bridge = getDesktopUpdatesBridge()
    if (typeof bridge?.status !== 'function') return
    void bridge.status().then((state) => {
      setDesktopUpdate(state)
    }).catch(() => {})
  }

  const runCheck = async (targetChannel: XPeachReleaseChannel): Promise<void> => {
    setCheckError(null)
    syncDesktopUpdater()
    if (checkUpdate === undefined) {
      const desktopOpen = getDesktopUpdatesBridge()?.open
      if (typeof desktopOpen === 'function') void desktopOpen()
      return
    }
    setCheckBusy(true)
    try {
      const res = await checkUpdate({ channel: targetChannel, force: true })
      if ('error' in res) {
        setCheckError(res.error)
        setCheckResult(null)
        return
      }
      setCheckResult(res)
      setCurrentVersion(res.currentVersion)
      setChannel(res.subscribedChannel)
    } finally {
      setCheckBusy(false)
    }
  }

  const selectChannel = (choice: XPeachReleaseChannel): void => {
    const previousChannel = channel
    setChannel(choice)
    setCheckError(null)
    void (async () => {
      if (setUpdateChannel !== undefined) {
        setChannelBusy(true)
        try {
          const res = await setUpdateChannel({ channel: choice })
          if ('error' in res) {
            setChannel(previousChannel)
            setCheckError(res.error)
            return
          }
          setCurrentVersion(res.currentVersion)
          setAutoCheck(res.autoCheckUpdate)
        } finally {
          setChannelBusy(false)
        }
      }
      syncDesktopUpdater()
      await runCheck(choice)
    })()
  }

  const toggleAutoCheck = (next: boolean): void => {
    setAutoCheck(next)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('xpeach.desktop.autoCheckUpdate', String(next))
        window.dispatchEvent(new Event('xpeach:auto-update-change'))
      }
    } catch (_storageError) {
      // Ignore private-mode or sandboxed storage restrictions.
    }
    if (setUpdateChannel === undefined) {
      syncDesktopUpdater()
      return
    }
    setChannelBusy(true)
    void setUpdateChannel({ autoCheckUpdate: next })
      .then((res) => {
        if ('error' in res) setCheckError(res.error)
        else syncDesktopUpdater()
      })
      .finally(() => { setChannelBusy(false) })
  }

  const openDownload = (): void => {
    const desktopOpen = getDesktopUpdatesBridge()?.open
    if (typeof desktopOpen === 'function') {
      void desktopOpen()
      return
    }
    if (
      checkResult?.releaseUrl !== undefined
      && checkResult.releaseUrl.startsWith('https://github.com/')
      && typeof window !== 'undefined'
    ) {
      window.open(checkResult.releaseUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const desktopBridge = getDesktopUpdatesBridge()
  const desktopPhase = desktopUpdate?.phase
  const desktopActive = desktopPhase !== undefined && desktopPhase !== 'idle'
  const desktopBusy = desktopPhase === 'downloading' || desktopPhase === 'verifying' || desktopPhase === 'installing' || desktopPhase === 'checking'
  const effectiveAvailable = (checkResult?.updateAvailable === true)
    || (desktopPhase === 'available' || desktopPhase === 'downloading' || desktopPhase === 'verifying' || desktopPhase === 'ready' || desktopPhase === 'installing')
  const effectiveVersion = desktopUpdate?.version ?? checkResult?.targetVersion ?? currentVersion
  const effectiveChannel = checkResult?.targetChannel ?? checkResult?.subscribedChannel ?? channel
  const showBanner = checkResult !== null || desktopActive

  const renderBannerContent = (): JSX.Element => {
    if (desktopPhase === 'downloading') {
      return (
        <>
          <span className={css.updateBannerAvailable}>
            {t('prefs.updateChannel.downloading', {
              version: effectiveVersion,
              percent: String(desktopUpdate?.percent ?? 0),
            })}
          </span>
          <Button variant="primary" disabled>
            {`${String(desktopUpdate?.percent ?? 0)}%`}
          </Button>
        </>
      )
    }
    if (desktopPhase === 'verifying') {
      return (
        <span className={css.updateBannerAvailable}>
          {t('prefs.updateChannel.verifying')}
        </span>
      )
    }
    if (desktopPhase === 'installing') {
      return (
        <span className={css.updateBannerAvailable}>
          {t('prefs.updateChannel.installing')}
        </span>
      )
    }
    if (desktopPhase === 'ready') {
      return (
        <>
          <span className={css.updateBannerAvailable}>
            {t('prefs.updateChannel.ready', { version: effectiveVersion })}
          </span>
          <Button variant="primary" onClick={openDownload}>
            {t('prefs.updateChannel.installBtn')}
          </Button>
        </>
      )
    }
    if (desktopPhase === 'error' && checkResult?.updateAvailable !== true) {
      return (
        <>
          <span className={css.updateBannerAvailable}>
            {t('prefs.updateChannel.available', {
              version: effectiveVersion,
              channel: effectiveChannel,
            })}
          </span>
          <Button variant="primary" onClick={openDownload}>
            {t('prefs.updateChannel.retryBtn')}
          </Button>
        </>
      )
    }
    if (effectiveAvailable) {
      return (
        <>
          <span className={css.updateBannerAvailable}>
            {t('prefs.updateChannel.available', {
              version: effectiveVersion,
              channel: effectiveChannel,
            })}
          </span>
          <Button variant="primary" onClick={openDownload}>
            {t('prefs.updateChannel.downloadBtn')}
          </Button>
        </>
      )
    }
    return (
      <span className={css.updateBannerOk}>
        ✓ {t('prefs.updateChannel.upToDate')} · {t('prefs.updateChannel.currentBadge', { version: checkResult?.currentVersion ?? currentVersion })}
      </span>
    )
  }

  return (
    <div className={css.updateChannelBlock}>
      <div className={css.updateHeaderRow}>
        <div className={css.updateTitleRow}>
          <span className={css.prefTitle}>{t('prefs.updateChannel.title')}</span>
          {currentVersion !== '' && (
            <span className={css.updateCurrentBadge}>
              {t('prefs.updateChannel.currentBadge', { version: currentVersion })}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          disabled={checkBusy || desktopBusy}
          onClick={() => { void runCheck(channel) }}
        >
          {checkBusy ? t('prefs.updateChannel.checking') : t('prefs.updateChannel.checkBtn')}
        </Button>
      </div>

      <div className={css.updateChannelGrid} role="group" aria-label={t('prefs.updateChannel.title')}>
        {RELEASE_CHANNELS.map(choice => (
          <button
            key={choice}
            type="button"
            disabled={channelBusy}
            aria-pressed={channel === choice}
            data-channel={choice}
            className={channel === choice ? css.updateChannelCardOn : css.updateChannelCard}
            onClick={() => { selectChannel(choice) }}
          >
            <span className={css.updateCardTop}>
              <span className={css.updateCardName}>{t(`prefs.updateChannel.${choice}`)}</span>
              <code className={css.updateCardTag}>{choice}</code>
            </span>
            <span className={css.updateCardDesc}>{t(`prefs.updateChannel.compatHint.${choice}`)}</span>
          </button>
        ))}
      </div>

      <div className={css.updateAutoRow}>
        <span className={css.prefTitle}>{t('prefs.updateChannel.autoCheck')}</span>
        <Switch
          checked={autoCheck}
          disabled={channelBusy}
          label={t('prefs.updateChannel.autoCheck')}
          onChange={toggleAutoCheck}
        />
      </div>

      {checkError !== null && (
        <div className={css.updateBannerHead}>
          <p className={css.bindError}>{checkError}</p>
          {typeof desktopBridge?.open === 'function' && (
            <Button variant="outline" onClick={openDownload}>
              {t('prefs.updateChannel.desktopCheckBtn')}
            </Button>
          )}
        </div>
      )}

      {showBanner && (
        <div
          className={effectiveAvailable ? css.updateStatusBannerAvailable : css.updateStatusBanner}
          data-available={effectiveAvailable ? 'true' : 'false'}
        >
          <div className={css.updateBannerHead}>
            {renderBannerContent()}
          </div>
          {checkResult?.updateAvailable === true
            && checkResult.releaseNotes !== undefined
            && checkResult.releaseNotes.trim() !== '' && (
            <details className={css.updateReleaseNotes} open>
              <summary className={css.updateReleaseNotesSummary}>
                {t('prefs.updateChannel.releaseNotes')}
              </summary>
              <pre className={css.updateReleaseNotesBody}>{checkResult.releaseNotes}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

/** Operations injected into {@link GeneralPreferencesRow}. */
export type GeneralPreferencesInjected = Pick<
  XPeachOps,
  | 'trackingState'
  | 'setTracking'
  | 'protocolPreference'
  | 'setProtocolPreference'
  | 'autoSyncModels'
  | 'setAutoSyncModels'
  | 'syncModels'
  | 'networkStatus'
  | 'networkAuto'
  | 'networkRoute'
  | 'describeSettings'
  | 'mutateSettings'
  | 'updateChannelStatus'
  | 'setUpdateChannel'
  | 'checkUpdate'
  | 'sendSystemNotification'
>

/** Composed props of {@link GeneralPreferencesRow}. */
export type GeneralPreferencesRowProps =
  PropsLocale<'xpeach.account'>
  & InjectFace<GeneralPreferencesInjected>

/**
 * Render XPeach update-channel and system-notification controls in General Settings.
 * @param props - localized copy and injected XPeach operations.
 * @returns the General Settings preference rows.
 */
export function GeneralPreferencesRow({
  t,
  updateChannelStatus,
  setUpdateChannel,
  checkUpdate,
  sendSystemNotification,
}: GeneralPreferencesRowProps): JSX.Element {
  const [notifyPrefs, setNotifyPrefs] = useState(() => readNotificationPreferences())
  const [testNotifySent, setTestNotifySent] = useState(false)

  useEffect(() => subscribeNotificationPreferences(() => {
    setNotifyPrefs(readNotificationPreferences())
  }), [])

  return (
    <div className={css.prefStack}>
      <UpdateChannelPreferenceRow
        t={t}
        updateChannelStatus={updateChannelStatus}
        setUpdateChannel={setUpdateChannel}
        checkUpdate={checkUpdate}
      />

      <div className={css.prefRow}>
        <div className={css.prefRowText}>
          <div className={css.prefTitle}>{t('prefs.notify.title')}</div>
          <div className={css.prefDesc}>{t('prefs.notify.desc')}</div>
        </div>
        <div className={css.prefActionRow}>
          <label className={css.notifySoundToggle}>
            <input
              type="checkbox"
              checked={notifyPrefs.sound}
              disabled={!notifyPrefs.enabled}
              onChange={(e) => {
                setNotifyPrefs(writeNotificationPreferences({ sound: e.target.checked }))
              }}
            />
            <span>{t('prefs.notify.sound')}</span>
          </label>
          <Button
            variant="outline"
            onClick={() => {
              setTestNotifySent(true)
              void triggerTestSystemNotification(t, sendSystemNotification)
              setTimeout(() => { setTestNotifySent(false) }, 1_800)
            }}
          >
            {testNotifySent ? t('prefs.notify.testSent') : t('prefs.notify.testBtn')}
          </Button>
          <Switch
            checked={notifyPrefs.enabled}
            label={t('prefs.notify.title')}
            onChange={(next) => {
              setNotifyPrefs(writeNotificationPreferences({ enabled: next }))
            }}
          />
        </div>
      </div>
    </div>
  )
}
