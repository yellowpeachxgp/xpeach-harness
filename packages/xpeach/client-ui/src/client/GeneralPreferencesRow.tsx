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

/** Props for the reusable {@link UpdateChannelPreferenceRow} control. */
export interface UpdateChannelPreferenceRowProps {
  readonly t: PropsLocale<'xpeach.account'>['t']
  readonly updateChannelStatus?: XPeachOps['updateChannelStatus'] | undefined
  readonly setUpdateChannel?: XPeachOps['setUpdateChannel'] | undefined
  readonly checkUpdate?: XPeachOps['checkUpdate'] | undefined
}

/**
 * Render the 3-way release update channel selector (`least`, `beta`, `alpha`),
 * compatibility hint, auto-check switch, check-for-updates trigger, and result banner.
 * @param props - locale translator and optional update-channel operations.
 * @returns the release update channel row and status banner.
 */
export function UpdateChannelPreferenceRow({
  t,
  updateChannelStatus,
  setUpdateChannel,
  checkUpdate,
}: UpdateChannelPreferenceRowProps): JSX.Element {
  const [channel, setChannel] = useState<XPeachReleaseChannel>('least')
  const [currentVersion, setCurrentVersion] = useState('')
  const [autoCheck, setAutoCheck] = useState(true)
  const [channelBusy, setChannelBusy] = useState(false)
  const [checkBusy, setCheckBusy] = useState(false)
  const [checkResult, setCheckResult] = useState<XPeachUpdateCheckResult | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)

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

  const runCheck = async (targetChannel: XPeachReleaseChannel): Promise<void> => {
    setCheckError(null)
    if (checkUpdate === undefined) return
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
    if (setUpdateChannel === undefined) return
    setChannelBusy(true)
    void setUpdateChannel({ autoCheckUpdate: next })
      .then((res) => { if ('error' in res) setCheckError(res.error) })
      .finally(() => { setChannelBusy(false) })
  }

  const openDownload = (): void => {
    const desktopOpen = (globalThis as typeof globalThis & {
      dshDesktop?: { updates?: { open?: () => Promise<void> } }
    }).dshDesktop?.updates?.open
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
          disabled={checkBusy}
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
        <p className={css.bindError}>{checkError}</p>
      )}

      {checkResult !== null && (
        <div
          className={checkResult.updateAvailable ? css.updateStatusBannerAvailable : css.updateStatusBanner}
          data-available={checkResult.updateAvailable ? 'true' : 'false'}
        >
          <div className={css.updateBannerHead}>
            {checkResult.updateAvailable
              ? (
                <>
                  <span className={css.updateBannerAvailable}>
                    {t('prefs.updateChannel.available', {
                      version: checkResult.targetVersion ?? checkResult.currentVersion,
                      channel: checkResult.targetChannel ?? checkResult.subscribedChannel,
                    })}
                  </span>
                  <Button variant="primary" onClick={openDownload}>
                    {t('prefs.updateChannel.downloadBtn')}
                  </Button>
                </>
              )
              : (
                <span className={css.updateBannerOk}>
                  ✓ {t('prefs.updateChannel.upToDate')} · {t('prefs.updateChannel.currentBadge', { version: checkResult.currentVersion })}
                </span>
              )}
          </div>
          {checkResult.updateAvailable
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
