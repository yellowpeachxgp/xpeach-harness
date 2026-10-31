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
  XPeachNetworkSnapshot,
  XPeachOps,
  XPeachReleaseChannel,
  XPeachSettingsNamespaceItem,
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
  const [currentVersion, setCurrentVersion] = useState('0.0.23-alpha')
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

  const runCheck = (targetChannel: XPeachReleaseChannel): void => {
    setCheckError(null)
    if (checkUpdate === undefined) return
    setCheckBusy(true)
    void checkUpdate({ channel: targetChannel, force: true })
      .then((res) => {
        if ('error' in res) {
          setCheckError(res.error)
          setCheckResult(null)
          return
        }
        setCheckResult(res)
        setCurrentVersion(res.currentVersion)
        setChannel(res.subscribedChannel)
      })
      .finally(() => { setCheckBusy(false) })
  }

  const selectChannel = (choice: XPeachReleaseChannel): void => {
    setChannel(choice)
    setCheckError(null)
    if (setUpdateChannel !== undefined) {
      setChannelBusy(true)
      void setUpdateChannel({ channel: choice })
        .then((res) => {
          if ('error' in res) {
            setCheckError(res.error)
            return
          }
          setCurrentVersion(res.currentVersion)
          setAutoCheck(res.autoCheckUpdate)
        })
        .finally(() => { setChannelBusy(false) })
    }
    runCheck(choice)
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
          <span className={css.updateCurrentBadge}>
            {t('prefs.updateChannel.currentBadge', { version: currentVersion })}
          </span>
        </div>
        <Button
          variant="outline"
          disabled={checkBusy}
          onClick={() => { runCheck(channel) }}
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
          onChange={(next) => {
            setAutoCheck(next)
            if (setUpdateChannel === undefined) return
            setChannelBusy(true)
            void setUpdateChannel({ autoCheckUpdate: next })
              .then((res) => { if ('error' in res) setCheckError(res.error) })
              .finally(() => { setChannelBusy(false) })
          }}
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
 * Render XPeach request and gateway controls in General Settings
 * (`X-Session` headers, wire protocol, catalog auto-sync, and route selection).
 * @param props - localized copy and injected XPeach operations.
 * @returns the General Settings preference rows.
 */
export function GeneralPreferencesRow({
  t,
  trackingState,
  setTracking,
  protocolPreference,
  setProtocolPreference,
  autoSyncModels,
  setAutoSyncModels,
  syncModels,
  networkStatus,
  networkAuto,
  networkRoute,
  describeSettings,
  mutateSettings,
  updateChannelStatus,
  setUpdateChannel,
  checkUpdate,
  sendSystemNotification,
}: GeneralPreferencesRowProps): JSX.Element {
  const [tracking, setTrackingOn] = useState(true)
  const [trackingBusy, setTrackingBusy] = useState(false)
  const [protocol, setProtocol] = useState<'compatible' | 'native' | 'auto'>('compatible')
  const [protocolBusy, setProtocolBusy] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const [autoSyncBusy, setAutoSyncBusy] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncCount, setSyncCount] = useState<number | null>(null)
  const [netSnap, setNetSnap] = useState<XPeachNetworkSnapshot | null>(null)
  const [netBusy, setNetBusy] = useState(false)
  const [namespaces, setNamespaces] = useState<readonly XPeachSettingsNamespaceItem[]>([])
  const [modBusy, setModBusy] = useState<string | null>(null)
  const [notifyPrefs, setNotifyPrefs] = useState(() => readNotificationPreferences())
  const [testNotifySent, setTestNotifySent] = useState(false)

  useEffect(() => subscribeNotificationPreferences(() => {
    setNotifyPrefs(readNotificationPreferences())
  }), [])

  useEffect(() => {
    let live = true
    void trackingState().then((value) => { if (live) setTrackingOn(value) })
    void protocolPreference().then((value) => { if (live) setProtocol(value) })
    if (autoSyncModels !== undefined) {
      void autoSyncModels().then((value) => { if (live) setAutoSync(value) })
    }
    void networkStatus().then((res) => {
      if (live && !('error' in res)) setNetSnap(res)
    })
    if (describeSettings !== undefined) {
      void describeSettings().then((res) => {
        if (live && !('error' in res)) setNamespaces(res)
      })
    }
    return () => { live = false }
  }, [trackingState, protocolPreference, autoSyncModels, networkStatus, describeSettings])

  const readNsBool = (ns: string, field: string, fallback: boolean): boolean => {
    const view = namespaces.find(item => item.ns === ns)
    const raw = view?.value[field]
    return typeof raw === 'boolean' ? raw : fallback
  }

  const toggleNsBool = (ns: string, field: string, next: boolean): void => {
    if (mutateSettings === undefined) return
    const view = namespaces.find(item => item.ns === ns)
    setModBusy(ns)
    void mutateSettings(ns, [{ op: 'set', path: [field], value: next }], view?.revision)
      .then((res) => {
        if (!('error' in res)) {
          setNamespaces(prev => (
            prev.some(item => item.ns === res.ns)
              ? prev.map(item => (item.ns === res.ns ? res : item))
              : [...prev, res]
          ))
        }
      })
      .finally(() => { setModBusy(null) })
  }

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

      <div className={css.prefRow}>
        <div className={css.prefRowText}>
          <div className={css.prefTitle}>{t('prefs.xsession.title')}</div>
          <div className={css.prefDesc}>{t('prefs.xsession.desc')}</div>
        </div>
        <Switch
          checked={tracking}
          disabled={trackingBusy}
          label={t('prefs.xsession.title')}
          onChange={(next) => {
            setTrackingOn(next)
            setTrackingBusy(true)
            void setTracking(next).finally(() => { setTrackingBusy(false) })
          }}
        />
      </div>

      <div className={css.prefRow}>
        <div className={css.prefRowText}>
          <div className={css.prefTitle}>{t('prefs.protocol.title')}</div>
          <div className={css.prefDesc}>{t('prefs.protocol.desc')}</div>
        </div>
        <div className={css.prefSegGroup} role="group" aria-label={t('prefs.protocol.title')}>
          {(['compatible', 'auto', 'native'] as const).map(choice => (
            <button
              key={choice}
              type="button"
              disabled={protocolBusy}
              aria-pressed={protocol === choice}
              className={protocol === choice ? css.prefSegBtnOn : css.prefSegBtn}
              onClick={() => {
                if (protocol === choice) return
                setProtocol(choice)
                setProtocolBusy(true)
                void setProtocolPreference(choice).finally(() => { setProtocolBusy(false) })
              }}
            >
              {t(`protocol.${choice}`)}
            </button>
          ))}
        </div>
      </div>

      <div className={css.prefRow}>
        <div className={css.prefRowText}>
          <div className={css.prefTitle}>{t('prefs.autosync.title')}</div>
          <div className={css.prefDesc}>{t('prefs.autosync.desc')}</div>
        </div>
        <div className={css.prefControlGroup}>
          <Button
            variant="outline"
            disabled={syncBusy}
            onClick={() => {
              setSyncBusy(true)
              setSyncCount(null)
              void syncModels().then((res) => {
                if (!('error' in res) && res.ok) setSyncCount(res.count)
              }).finally(() => { setSyncBusy(false) })
            }}
          >
            {syncBusy
              ? t('prefs.autosync.syncing')
              : syncCount !== null
                ? t('prefs.autosync.synced', { n: syncCount })
                : t('prefs.autosync.syncNow')}
          </Button>
          <Switch
            checked={autoSync}
            disabled={autoSyncBusy}
            label={t('prefs.autosync.title')}
            onChange={(next) => {
              setAutoSync(next)
              if (setAutoSyncModels === undefined) return
              setAutoSyncBusy(true)
              void setAutoSyncModels(next).finally(() => { setAutoSyncBusy(false) })
            }}
          />
        </div>
      </div>

      <div className={css.prefRow}>
        <div className={css.prefRowText}>
          <div className={css.prefTitle}>{t('prefs.network.title')}</div>
          <div className={css.prefDesc}>{t('prefs.network.desc')}</div>
        </div>
        <div className={css.prefControlGroup}>
          {netSnap !== null && netSnap.probes.length > 0 && (
            <select
              className={css.prefSelect}
              aria-label={t('network.current')}
              disabled={netBusy}
              value={netSnap.active}
              onChange={(event) => {
                const url = event.target.value
                setNetBusy(true)
                void networkRoute(url).then((res) => {
                  if (!('error' in res)) setNetSnap(res)
                }).finally(() => { setNetBusy(false) })
              }}
            >
              {netSnap.probes.map(probe => (
                <option key={probe.id} value={probe.url}>
                  {probe.latencyMs !== undefined
                    ? `${probe.label} · ${t('unit.ms', { n: probe.latencyMs })}`
                    : probe.label}
                </option>
              ))}
            </select>
          )}
          <Switch
            checked={netSnap?.auto ?? true}
            disabled={netBusy}
            label={t('prefs.network.title')}
            onChange={(next) => {
              setNetBusy(true)
              void networkAuto(next).then((res) => {
                if (!('error' in res)) setNetSnap(res)
              }).finally(() => { setNetBusy(false) })
            }}
          />
        </div>
      </div>

      {mutateSettings !== undefined && (
        <>
          <div className={css.prefRow}>
            <div className={css.prefRowText}>
              <div className={css.prefTitle}>{t('modules.subagent.modelSel.title')}</div>
              <div className={css.prefDesc}>{t('modules.subagent.modelSel.desc')}</div>
            </div>
            <Switch
              checked={readNsBool('subagent-model-selection-settings', 'enabled', false)}
              disabled={modBusy === 'subagent-model-selection-settings'}
              label={t('modules.subagent.modelSel.title')}
              onChange={(next) => { toggleNsBool('subagent-model-selection-settings', 'enabled', next) }}
            />
          </div>

          <div className={css.prefRow}>
            <div className={css.prefRowText}>
              <div className={css.prefTitle}>{t('modules.gateway.sessionLog.title')}</div>
              <div className={css.prefDesc}>{t('modules.gateway.sessionLog.desc')}</div>
            </div>
            <Switch
              checked={readNsBool('session-log-deepseek', 'enabled', true)}
              disabled={modBusy === 'session-log-deepseek'}
              label={t('modules.gateway.sessionLog.title')}
              onChange={(next) => { toggleNsBool('session-log-deepseek', 'enabled', next) }}
            />
          </div>

          <div className={css.prefRow}>
            <div className={css.prefRowText}>
              <div className={css.prefTitle}>{t('modules.gateway.analytics.title')}</div>
              <div className={css.prefDesc}>{t('modules.gateway.analytics.desc')}</div>
            </div>
            <Switch
              checked={readNsBool('product-analytics', 'enabled', true)}
              disabled={modBusy === 'product-analytics'}
              label={t('modules.gateway.analytics.title')}
              onChange={(next) => { toggleNsBool('product-analytics', 'enabled', next) }}
            />
          </div>
        </>
      )}
    </div>
  )
}
