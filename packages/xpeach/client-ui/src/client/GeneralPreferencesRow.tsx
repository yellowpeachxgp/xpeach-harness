/** XPeach user-controllable request and gateway preference rows in General Settings. */
import { type JSX, useEffect, useState } from 'react'
import { Button, Switch } from '@xpeach/xph-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type { XPeachNetworkSnapshot, XPeachOps, XPeachSettingsNamespaceItem } from './ops.ts'
import css from './xpeach.module.css'

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
