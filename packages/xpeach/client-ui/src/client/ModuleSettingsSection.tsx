/** Comprehensive feature module configuration panel for Settings. */
import { type JSX, type ReactNode, useCallback, useEffect, useState } from 'react'
import { Button, Switch } from '@xpeach/xph-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type {
  XPeachNetworkSnapshot,
  XPeachOps,
  XPeachSettingsMutationOp,
  XPeachSettingsNamespaceItem,
} from './ops.ts'
import css from './xpeach.module.css'

function ModuleCard({ title, children }: { readonly title: string; readonly children: ReactNode }): JSX.Element {
  return (
    <section className={css.card}>
      <h4 className={css.cardTitle}>{title}</h4>
      {children}
    </section>
  )
}

/** Operations injected into {@link ModuleSettingsSection} and {@link ModuleSettingsTab}. */
export type ModuleSettingsInjected = Pick<
  XPeachOps,
  | 'describeSettings'
  | 'mutateSettings'
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
>

/** Composed props of {@link ModuleSettingsSection}. */
export type ModuleSettingsSectionProps =
  PropsLocale<'xpeach.account'>
  & InjectFace<ModuleSettingsInjected>

type ModuleCategory = 'all' | 'engine' | 'shell' | 'subagent' | 'web' | 'ui' | 'gateway'

const PARALLEL_CHIPS: readonly number[] = [1, 4, 8, 16, 32]
const SHELL_TIMEOUT_CHIPS: readonly number[] = [30_000, 60_000, 120_000, 300_000]
const SHELL_MAX_TIMEOUT_CHIPS: readonly number[] = [300_000, 600_000, 1_200_000, 1_800_000]
const SHELL_OUTPUT_CHIPS: readonly number[] = [32_000, 64_000, 128_000, 256_000]
const SHELL_SPILL_CHIPS: readonly number[] = [5_242_880, 10_485_760, 20_971_520, 52_428_800]
const SHELL_GRACE_CHIPS: readonly number[] = [2_000, 5_000, 10_000, 15_000]
const SUBAGENT_DEPTH_CHIPS: readonly number[] = [0, 1, 2, 3, 5]
const SUBAGENT_ACTIVE_CHIPS: readonly number[] = [2, 4, 8, 16, 32]
const WEB_COUNT_CHIPS: readonly number[] = [5, 10, 20, 30, 50]
const WEB_MAX_USES_CHIPS: readonly number[] = [3, 5, 10, 20]
const WEB_MAX_TOKENS_CHIPS: readonly number[] = [2_048, 4_096, 8_192, 16_384]
const FONT_SIZE_CHIPS: readonly number[] = [12, 13, 14, 15, 16]
const GATEWAY_TIMEOUT_CHIPS: readonly number[] = [10_000, 15_000, 30_000, 60_000]

function findNs(
  items: readonly XPeachSettingsNamespaceItem[],
  candidates: readonly string[],
): XPeachSettingsNamespaceItem | undefined {
  for (const name of candidates) {
    const found = items.find(item => item.ns === name)
    if (found !== undefined) return found
  }
  return undefined
}

function readNum(
  view: XPeachSettingsNamespaceItem | undefined,
  field: string,
  fallback: number,
): number {
  const raw = view?.value[field]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback
}

function readBaseNum(
  view: XPeachSettingsNamespaceItem | undefined,
  field: string,
  fallback: number,
): number {
  const raw = view?.base?.[field]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback
}

function readBool(
  view: XPeachSettingsNamespaceItem | undefined,
  field: string,
  fallback: boolean,
): boolean {
  const raw = view?.value[field]
  return typeof raw === 'boolean' ? raw : fallback
}

function readStr(
  view: XPeachSettingsNamespaceItem | undefined,
  field: string,
  fallback: string,
): string {
  const raw = view?.value[field]
  return typeof raw === 'string' ? raw : fallback
}

function hasUserOverride(
  view: XPeachSettingsNamespaceItem | undefined,
  field: string,
): boolean {
  return view?.user !== undefined && Object.prototype.hasOwnProperty.call(view.user, field) && view.user[field] !== undefined
}

interface NumberRowProps {
  readonly title: string
  readonly desc: string
  readonly value: number
  readonly baseValue: number
  readonly customized: boolean
  readonly min: number
  readonly max?: number
  readonly step?: number
  readonly chips?: readonly number[]
  readonly formatChip?: (val: number) => string
  readonly busy: boolean
  readonly applyLabel: string
  readonly resetLabel: string
  readonly customizedLabel: string
  readonly defaultBadgeLabel: string
  readonly onApply: (val: number) => void
  readonly onReset: () => void
}

function NumberSettingRow({
  title,
  desc,
  value,
  baseValue,
  customized,
  min,
  max,
  step = 1,
  chips,
  formatChip,
  busy,
  applyLabel,
  resetLabel,
  customizedLabel,
  defaultBadgeLabel,
  onApply,
  onReset,
}: NumberRowProps): JSX.Element {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const parsed = Number(draft.trim())
  const valid = draft.trim() !== '' && Number.isInteger(parsed) && parsed >= min && (max === undefined || parsed <= max)
  const changed = valid && parsed !== value

  return (
    <div className={css.prefRow}>
      <div className={css.prefRowText}>
        <div className={css.modTitleRow}>
          <span className={css.prefTitle}>{title}</span>
          <span className={css.modBadgeDefault}>{defaultBadgeLabel}</span>
          {customized && <span className={css.modBadgeCustom}>{customizedLabel}</span>}
        </div>
        <div className={css.prefDesc}>{desc}</div>
      </div>
      <div className={css.modInputWrap}>
        <div className={css.modInputRow}>
          <input
            type="number"
            className={css.modNumberInput}
            aria-label={title}
            min={min}
            max={max}
            step={step}
            disabled={busy}
            value={draft}
            onChange={(event) => { setDraft(event.target.value) }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && changed) {
                onApply(parsed)
              }
            }}
          />
          {changed && (
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => { onApply(parsed) }}
            >
              {applyLabel}
            </Button>
          )}
          {(customized || value !== baseValue) && (
            <button
              type="button"
              className={css.modResetBtn}
              disabled={busy}
              onClick={onReset}
            >
              {resetLabel}
            </button>
          )}
        </div>
        {chips !== undefined && chips.length > 0 && (
          <div className={css.modPresetChips}>
            {chips.map(chipVal => (
              <button
                key={chipVal}
                type="button"
                disabled={busy}
                className={value === chipVal ? css.modPresetChipOn : css.modPresetChip}
                onClick={() => {
                  setDraft(String(chipVal))
                  if (chipVal !== value) onApply(chipVal)
                }}
              >
                {formatChip === undefined ? String(chipVal) : formatChip(chipVal)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface TextRowProps {
  readonly title: string
  readonly desc: string
  readonly placeholder: string
  readonly value: string
  readonly customized: boolean
  readonly busy: boolean
  readonly applyLabel: string
  readonly resetLabel: string
  readonly customizedLabel: string
  readonly onApply: (val: string) => void
  readonly onReset: () => void
}

function TextSettingRow({
  title,
  desc,
  placeholder,
  value,
  customized,
  busy,
  applyLabel,
  resetLabel,
  customizedLabel,
  onApply,
  onReset,
}: TextRowProps): JSX.Element {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const trimmed = draft.trim()
  const changed = trimmed !== value

  return (
    <div className={css.prefRow}>
      <div className={css.prefRowText}>
        <div className={css.modTitleRow}>
          <span className={css.prefTitle}>{title}</span>
          {customized && <span className={css.modBadgeCustom}>{customizedLabel}</span>}
        </div>
        <div className={css.prefDesc}>{desc}</div>
      </div>
      <div className={css.modInputWrap}>
        <div className={css.modInputRow}>
          <input
            type="text"
            className={css.modTextInput}
            aria-label={title}
            placeholder={placeholder}
            disabled={busy}
            value={draft}
            onChange={(event) => { setDraft(event.target.value) }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && changed) {
                if (trimmed === '') onReset()
                else onApply(trimmed)
              }
            }}
          />
          {changed && (
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => {
                if (trimmed === '') onReset()
                else onApply(trimmed)
              }}
            >
              {applyLabel}
            </Button>
          )}
          {(customized || value !== '') && (
            <button
              type="button"
              className={css.modResetBtn}
              disabled={busy}
              onClick={() => {
                setDraft('')
                onReset()
              }}
            >
              {resetLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Shared body of the Feature Module settings panel.
 * @param props - localized copy and injected settings/gateway operations.
 * @returns the interactive feature module cards.
 */
export function ModuleSettingsBody({
  t,
  describeSettings,
  mutateSettings,
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
}: PropsLocale<'xpeach.account'> & ModuleSettingsInjected): JSX.Element {
  const [category, setCategory] = useState<ModuleCategory>('all')
  const [namespaces, setNamespaces] = useState<readonly XPeachSettingsNamespaceItem[]>([])
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [savedStamp, setSavedStamp] = useState(false)
  const [tracking, setTrackingOn] = useState(true)
  const [protocol, setProtocol] = useState<'compatible' | 'native' | 'auto'>('compatible')
  const [autoSync, setAutoSync] = useState(true)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncCount, setSyncCount] = useState<number | null>(null)
  const [netSnap, setNetSnap] = useState<XPeachNetworkSnapshot | null>(null)

  const reloadAll = useCallback(async () => {
    if (describeSettings !== undefined) {
      const res = await describeSettings()
      if (!('error' in res)) setNamespaces(res)
    }
    const [trk, proto, net] = await Promise.all([
      trackingState(),
      protocolPreference(),
      networkStatus(),
    ])
    setTrackingOn(trk)
    setProtocol(proto)
    if (!('error' in net)) setNetSnap(net)
    if (autoSyncModels !== undefined) {
      const syncVal = await autoSyncModels()
      setAutoSync(syncVal)
    }
  }, [describeSettings, trackingState, protocolPreference, networkStatus, autoSyncModels])

  useEffect(() => {
    void reloadAll()
  }, [reloadAll])

  const flashSaved = (): void => {
    setSavedStamp(true)
    setTimeout(() => { setSavedStamp(false) }, 1600)
  }

  const mutateNs = async (
    key: string,
    targetCandidates: readonly string[],
    ops: readonly XPeachSettingsMutationOp[],
  ): Promise<void> => {
    if (mutateSettings === undefined) return
    setBusyKey(key)
    try {
      const matched = namespaces.filter(item => targetCandidates.includes(item.ns))
      const targets = matched.length > 0
        ? matched
        : [{ ns: targetCandidates[0] ?? '', value: {}, revision: undefined as number | undefined }]
      for (const target of targets) {
        if (target.ns === '') continue
        const res = await mutateSettings(target.ns, ops, target.revision)
        if (!('error' in res)) {
          setNamespaces((prev) => {
            const exists = prev.some(item => item.ns === res.ns)
            return exists
              ? prev.map(item => (item.ns === res.ns ? res : item))
              : [...prev, res]
          })
        }
      }
      flashSaved()
    } finally {
      setBusyKey(null)
    }
  }

  const agentLoopNs = findNs(namespaces, ['agent-loop'])
  const permissionNs = findNs(namespaces, ['permission'])
  const presetNs = findNs(namespaces, ['agent-preset-registry'])
  const devToolsNs = findNs(namespaces, ['ui-settings'])
  const shellNs = findNs(namespaces, ['bash-sandbox', 'pwsh-sandbox'])
  const subagentNs = findNs(namespaces, ['subagent'])
  const subagentModelNs = findNs(namespaces, ['subagent-model-selection-settings'])
  const webNs = findNs(namespaces, ['web'])
  const webApiNs = findNs(namespaces, ['web-deepseek-api'])
  const webOfficialNs = findNs(namespaces, ['web-search-deepseek'])
  const uiChatNs = findNs(namespaces, ['ui-chat'])
  const uiConvNs = findNs(namespaces, ['ui-conversation'])
  const uiThemeNs = findNs(namespaces, ['ui-theme'])
  const xpeachNs = findNs(namespaces, ['xpeach-account', 'xpeach'])
  const sessionLogNs = findNs(namespaces, ['session-log-deepseek'])
  const analyticsNs = findNs(namespaces, ['product-analytics'])

  const categories: readonly { readonly id: ModuleCategory; readonly label: string }[] = [
    { id: 'all', label: t('modules.cat.all') },
    { id: 'engine', label: t('modules.cat.engine') },
    { id: 'shell', label: t('modules.cat.shell') },
    { id: 'subagent', label: t('modules.cat.subagent') },
    { id: 'web', label: t('modules.cat.web') },
    { id: 'ui', label: t('modules.cat.ui') },
    { id: 'gateway', label: t('modules.cat.gateway') },
  ]

  const showEngine = category === 'all' || category === 'engine'
  const showShell = category === 'all' || category === 'shell'
  const showSubagent = category === 'all' || category === 'subagent'
  const showWeb = category === 'all' || category === 'web'
  const showUi = category === 'all' || category === 'ui'
  const showGateway = category === 'all' || category === 'gateway'

  const currentPermission = readStr(permissionNs, 'defaultPreset', 'workspace-write')
  const currentPreset = readStr(presetNs, 'selectedDefault', 'standard')
  const currentSearchProvider = readStr(webNs, 'searchProvider', 'deepseek-official')
  const currentTranscript = readStr(uiChatNs, 'transcriptView', 'standard')
  const currentCollapse = readStr(uiChatNs, 'collapseTiming', 'completion')
  const currentPerf = readStr(uiChatNs, 'performanceUsage', 'compact')
  const currentLink = readStr(uiChatNs, 'linkOpening', 'sidebar')
  const currentBusyEnter = readStr(uiConvNs, 'busyEnter', 'queue')
  const currentThemePref = readStr(uiThemeNs, 'preference', 'system')

  return (
    <div>
      <div className={css.modFilterBar}>
        <div className={css.modFilterPills} role="tablist" aria-label={t('modules.title')}>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={category === cat.id}
              className={category === cat.id ? css.modFilterPillOn : css.modFilterPill}
              onClick={() => { setCategory(cat.id) }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className={css.prefControlGroup}>
          {savedStamp && <span className={css.modBadgeCustom}>{t('modules.saved')}</span>}
          <Button
            variant="outline"
            disabled={busyKey !== null}
            onClick={() => { void reloadAll() }}
          >
            {t('modules.act.refresh')}
          </Button>
        </div>
      </div>

      <div className={css.modSectionStack}>
        {showEngine && (
          <ModuleCard title={t('modules.engine.title')}>
            <p className={css.modCardDesc}>{t('modules.engine.desc')}</p>
            <div className={css.prefStack}>
              <NumberSettingRow
                title={t('modules.engine.parallel.title')}
                desc={t('modules.engine.parallel.desc')}
                value={readNum(agentLoopNs, 'maxParallelToolCalls', 8)}
                baseValue={readBaseNum(agentLoopNs, 'maxParallelToolCalls', 8)}
                customized={hasUserOverride(agentLoopNs, 'maxParallelToolCalls')}
                min={1}
                max={64}
                chips={PARALLEL_CHIPS}
                busy={busyKey === 'engine.parallel'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(agentLoopNs, 'maxParallelToolCalls', 8) })}
                onApply={(val) => {
                  void mutateNs('engine.parallel', ['agent-loop'], [{ op: 'set', path: ['maxParallelToolCalls'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('engine.parallel', ['agent-loop'], [{ op: 'unset', path: ['maxParallelToolCalls'] }])
                }}
              />

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.engine.permission.title')}</span>
                    {hasUserOverride(permissionNs, 'defaultPreset') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.engine.permission.desc')}</div>
                </div>
                <div className={css.prefSegGroup} role="group" aria-label={t('modules.engine.permission.title')}>
                  {([
                    { id: 'read-only', label: t('modules.engine.permission.readonly') },
                    { id: 'workspace-write', label: t('modules.engine.permission.workspace') },
                    { id: 'danger-full-access', label: t('modules.engine.permission.full') },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busyKey === 'engine.permission'}
                      aria-pressed={currentPermission === opt.id}
                      className={currentPermission === opt.id ? css.prefSegBtnOn : css.prefSegBtn}
                      onClick={() => {
                        if (currentPermission === opt.id) return
                        void mutateNs('engine.permission', ['permission'], [{ op: 'set', path: ['defaultPreset'], value: opt.id }])
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.engine.preset.title')}</span>
                    {hasUserOverride(presetNs, 'selectedDefault') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.engine.preset.desc')}</div>
                </div>
                <div className={css.prefSegGroup} role="group" aria-label={t('modules.engine.preset.title')}>
                  {([
                    { id: 'standard', label: t('modules.engine.preset.standard') },
                    { id: 'ptc', label: t('modules.engine.preset.ptc') },
                    { id: 'minimal', label: t('modules.engine.preset.minimal') },
                    { id: 'cordis', label: t('modules.engine.preset.cordis') },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busyKey === 'engine.preset'}
                      aria-pressed={currentPreset === opt.id}
                      className={currentPreset === opt.id ? css.prefSegBtnOn : css.prefSegBtn}
                      onClick={() => {
                        if (currentPreset === opt.id) return
                        void mutateNs('engine.preset', ['agent-preset-registry'], [{ op: 'set', path: ['selectedDefault'], value: opt.id }])
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.engine.devtools.title')}</span>
                    {hasUserOverride(devToolsNs, 'enabled') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.engine.devtools.desc')}</div>
                </div>
                <Switch
                  checked={readBool(devToolsNs, 'enabled', false)}
                  disabled={busyKey === 'engine.devtools'}
                  label={t('modules.engine.devtools.title')}
                  onChange={(next) => {
                    void mutateNs('engine.devtools', ['ui-settings'], [{ op: 'set', path: ['enabled'], value: next }])
                  }}
                />
              </div>
            </div>
          </ModuleCard>
        )}

        {showShell && (
          <ModuleCard title={t('modules.shell.title')}>
            <p className={css.modCardDesc}>{t('modules.shell.desc')}</p>
            <div className={css.prefStack}>
              <NumberSettingRow
                title={t('modules.shell.timeout.title')}
                desc={t('modules.shell.timeout.desc')}
                value={readNum(shellNs, 'timeoutMs', 60_000)}
                baseValue={readBaseNum(shellNs, 'timeoutMs', 60_000)}
                customized={hasUserOverride(shellNs, 'timeoutMs')}
                min={1_000}
                step={1_000}
                chips={SHELL_TIMEOUT_CHIPS}
                formatChip={val => t('unit.s', { n: Math.round(val / 1_000) })}
                busy={busyKey === 'shell.timeout'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(shellNs, 'timeoutMs', 60_000) })}
                onApply={(val) => {
                  void mutateNs('shell.timeout', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'set', path: ['timeoutMs'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('shell.timeout', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'unset', path: ['timeoutMs'] }])
                }}
              />

              <NumberSettingRow
                title={t('modules.shell.maxTimeout.title')}
                desc={t('modules.shell.maxTimeout.desc')}
                value={readNum(shellNs, 'maxTimeoutMs', 600_000)}
                baseValue={readBaseNum(shellNs, 'maxTimeoutMs', 600_000)}
                customized={hasUserOverride(shellNs, 'maxTimeoutMs')}
                min={5_000}
                step={10_000}
                chips={SHELL_MAX_TIMEOUT_CHIPS}
                formatChip={val => t('modules.unit.min', { n: Math.round(val / 60_000) })}
                busy={busyKey === 'shell.maxTimeout'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(shellNs, 'maxTimeoutMs', 600_000) })}
                onApply={(val) => {
                  void mutateNs('shell.maxTimeout', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'set', path: ['maxTimeoutMs'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('shell.maxTimeout', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'unset', path: ['maxTimeoutMs'] }])
                }}
              />

              <NumberSettingRow
                title={t('modules.shell.maxOutput.title')}
                desc={t('modules.shell.maxOutput.desc')}
                value={readNum(shellNs, 'maxOutputBytes', 64_000)}
                baseValue={readBaseNum(shellNs, 'maxOutputBytes', 64_000)}
                customized={hasUserOverride(shellNs, 'maxOutputBytes')}
                min={1_024}
                step={1_024}
                chips={SHELL_OUTPUT_CHIPS}
                formatChip={val => t('modules.unit.kb', { n: Math.round(val / 1_000) })}
                busy={busyKey === 'shell.maxOutput'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(shellNs, 'maxOutputBytes', 64_000) })}
                onApply={(val) => {
                  void mutateNs('shell.maxOutput', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'set', path: ['maxOutputBytes'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('shell.maxOutput', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'unset', path: ['maxOutputBytes'] }])
                }}
              />

              <NumberSettingRow
                title={t('modules.shell.maxSpill.title')}
                desc={t('modules.shell.maxSpill.desc')}
                value={readNum(shellNs, 'maxSpillBytes', 10_485_760)}
                baseValue={readBaseNum(shellNs, 'maxSpillBytes', 10_485_760)}
                customized={hasUserOverride(shellNs, 'maxSpillBytes')}
                min={65_536}
                step={1_048_576}
                chips={SHELL_SPILL_CHIPS}
                formatChip={val => t('modules.unit.mb', { n: Math.round(val / 1_048_576) })}
                busy={busyKey === 'shell.maxSpill'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(shellNs, 'maxSpillBytes', 10_485_760) })}
                onApply={(val) => {
                  void mutateNs('shell.maxSpill', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'set', path: ['maxSpillBytes'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('shell.maxSpill', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'unset', path: ['maxSpillBytes'] }])
                }}
              />

              <NumberSettingRow
                title={t('modules.shell.grace.title')}
                desc={t('modules.shell.grace.desc')}
                value={readNum(shellNs, 'graceMs', 5_000)}
                baseValue={readBaseNum(shellNs, 'graceMs', 5_000)}
                customized={hasUserOverride(shellNs, 'graceMs')}
                min={500}
                step={500}
                chips={SHELL_GRACE_CHIPS}
                formatChip={val => t('unit.s', { n: Math.round(val / 1_000) })}
                busy={busyKey === 'shell.grace'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(shellNs, 'graceMs', 5_000) })}
                onApply={(val) => {
                  void mutateNs('shell.grace', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'set', path: ['graceMs'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('shell.grace', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'unset', path: ['graceMs'] }])
                }}
              />

              <TextSettingRow
                title={t('modules.shell.cwd.title')}
                desc={t('modules.shell.cwd.desc')}
                placeholder={t('modules.shell.cwd.ph')}
                value={readStr(shellNs, 'cwd', '')}
                customized={hasUserOverride(shellNs, 'cwd')}
                busy={busyKey === 'shell.cwd'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                onApply={(val) => {
                  void mutateNs('shell.cwd', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'set', path: ['cwd'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('shell.cwd', ['bash-sandbox', 'pwsh-sandbox'], [{ op: 'unset', path: ['cwd'] }])
                }}
              />
            </div>
          </ModuleCard>
        )}

        {showSubagent && (
          <ModuleCard title={t('modules.subagent.title')}>
            <p className={css.modCardDesc}>{t('modules.subagent.desc')}</p>
            <div className={css.prefStack}>
              <NumberSettingRow
                title={t('modules.subagent.maxDepth.title')}
                desc={t('modules.subagent.maxDepth.desc')}
                value={readNum(subagentNs, 'maxDepth', 1)}
                baseValue={readBaseNum(subagentNs, 'maxDepth', 1)}
                customized={hasUserOverride(subagentNs, 'maxDepth')}
                min={0}
                max={10}
                chips={SUBAGENT_DEPTH_CHIPS}
                busy={busyKey === 'subagent.maxDepth'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(subagentNs, 'maxDepth', 1) })}
                onApply={(val) => {
                  void mutateNs('subagent.maxDepth', ['subagent'], [{ op: 'set', path: ['maxDepth'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('subagent.maxDepth', ['subagent'], [{ op: 'unset', path: ['maxDepth'] }])
                }}
              />

              <NumberSettingRow
                title={t('modules.subagent.maxActive.title')}
                desc={t('modules.subagent.maxActive.desc')}
                value={readNum(subagentNs, 'maxActiveSubagents', 8)}
                baseValue={readBaseNum(subagentNs, 'maxActiveSubagents', 8)}
                customized={hasUserOverride(subagentNs, 'maxActiveSubagents')}
                min={1}
                max={64}
                chips={SUBAGENT_ACTIVE_CHIPS}
                busy={busyKey === 'subagent.maxActive'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(subagentNs, 'maxActiveSubagents', 8) })}
                onApply={(val) => {
                  void mutateNs('subagent.maxActive', ['subagent'], [{ op: 'set', path: ['maxActiveSubagents'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('subagent.maxActive', ['subagent'], [{ op: 'unset', path: ['maxActiveSubagents'] }])
                }}
              />

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.subagent.modelSel.title')}</span>
                    {hasUserOverride(subagentModelNs, 'enabled') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.subagent.modelSel.desc')}</div>
                </div>
                <Switch
                  checked={readBool(subagentModelNs, 'enabled', false)}
                  disabled={busyKey === 'subagent.modelSel'}
                  label={t('modules.subagent.modelSel.title')}
                  onChange={(next) => {
                    void mutateNs('subagent.modelSel', ['subagent-model-selection-settings'], [{ op: 'set', path: ['enabled'], value: next }])
                  }}
                />
              </div>
            </div>
          </ModuleCard>
        )}

        {showWeb && (
          <ModuleCard title={t('modules.web.title')}>
            <p className={css.modCardDesc}>{t('modules.web.desc')}</p>
            <div className={css.prefStack}>
              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.web.provider.title')}</span>
                    {hasUserOverride(webNs, 'searchProvider') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.web.provider.desc')}</div>
                </div>
                <div className={css.prefSegGroup} role="group" aria-label={t('modules.web.provider.title')}>
                  <button
                    type="button"
                    disabled={busyKey === 'web.provider'}
                    aria-pressed={currentSearchProvider === 'deepseek-official'}
                    className={currentSearchProvider === 'deepseek-official' ? css.prefSegBtnOn : css.prefSegBtn}
                    onClick={() => {
                      if (currentSearchProvider === 'deepseek-official') return
                      void mutateNs('web.provider', ['web'], [
                        { op: 'set', path: ['searchProvider'], value: 'deepseek-official' },
                        { op: 'set', path: ['fetchProvider'], value: 'http' },
                      ])
                    }}
                  >
                    {t('modules.web.provider.official')}
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === 'web.provider'}
                    aria-pressed={currentSearchProvider === 'deepseek-search-api'}
                    className={currentSearchProvider === 'deepseek-search-api' ? css.prefSegBtnOn : css.prefSegBtn}
                    onClick={() => {
                      if (currentSearchProvider === 'deepseek-search-api') return
                      void mutateNs('web.provider', ['web'], [
                        { op: 'set', path: ['searchProvider'], value: 'deepseek-search-api' },
                        { op: 'set', path: ['fetchProvider'], value: 'deepseek-fetch-api' },
                      ])
                    }}
                  >
                    {t('modules.web.provider.api')}
                  </button>
                </div>
              </div>

              <NumberSettingRow
                title={t('modules.web.count.title')}
                desc={t('modules.web.count.desc')}
                value={readNum(webApiNs, 'count', 10)}
                baseValue={readBaseNum(webApiNs, 'count', 10)}
                customized={hasUserOverride(webApiNs, 'count')}
                min={1}
                max={50}
                chips={WEB_COUNT_CHIPS}
                busy={busyKey === 'web.count'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(webApiNs, 'count', 10) })}
                onApply={(val) => {
                  void mutateNs('web.count', ['web-deepseek-api'], [{ op: 'set', path: ['count'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('web.count', ['web-deepseek-api'], [{ op: 'unset', path: ['count'] }])
                }}
              />

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.web.question.title')}</span>
                    {hasUserOverride(webApiNs, 'sendOriginalQuestion') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.web.question.desc')}</div>
                </div>
                <Switch
                  checked={readBool(webApiNs, 'sendOriginalQuestion', true)}
                  disabled={busyKey === 'web.question'}
                  label={t('modules.web.question.title')}
                  onChange={(next) => {
                    void mutateNs('web.question', ['web-deepseek-api'], [{ op: 'set', path: ['sendOriginalQuestion'], value: next }])
                  }}
                />
              </div>

              <NumberSettingRow
                title={t('modules.web.maxUses.title')}
                desc={t('modules.web.maxUses.desc')}
                value={readNum(webOfficialNs, 'maxUses', 5)}
                baseValue={readBaseNum(webOfficialNs, 'maxUses', 5)}
                customized={hasUserOverride(webOfficialNs, 'maxUses')}
                min={1}
                max={50}
                chips={WEB_MAX_USES_CHIPS}
                busy={busyKey === 'web.maxUses'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(webOfficialNs, 'maxUses', 5) })}
                onApply={(val) => {
                  void mutateNs('web.maxUses', ['web-search-deepseek'], [{ op: 'set', path: ['maxUses'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('web.maxUses', ['web-search-deepseek'], [{ op: 'unset', path: ['maxUses'] }])
                }}
              />

              <NumberSettingRow
                title={t('modules.web.maxTokens.title')}
                desc={t('modules.web.maxTokens.desc')}
                value={readNum(webOfficialNs, 'maxTokens', 4_096)}
                baseValue={readBaseNum(webOfficialNs, 'maxTokens', 4_096)}
                customized={hasUserOverride(webOfficialNs, 'maxTokens')}
                min={256}
                step={512}
                chips={WEB_MAX_TOKENS_CHIPS}
                busy={busyKey === 'web.maxTokens'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(webOfficialNs, 'maxTokens', 4_096) })}
                onApply={(val) => {
                  void mutateNs('web.maxTokens', ['web-search-deepseek'], [{ op: 'set', path: ['maxTokens'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('web.maxTokens', ['web-search-deepseek'], [{ op: 'unset', path: ['maxTokens'] }])
                }}
              />

              <TextSettingRow
                title={t('modules.web.baseUrl.title')}
                desc={t('modules.web.baseUrl.desc')}
                placeholder={t('modules.web.baseUrl.ph')}
                value={readStr(webApiNs ?? webOfficialNs, 'baseURL', '')}
                customized={hasUserOverride(webApiNs, 'baseURL') || hasUserOverride(webOfficialNs, 'baseURL')}
                busy={busyKey === 'web.baseUrl'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                onApply={(val) => {
                  void mutateNs('web.baseUrl', ['web-deepseek-api', 'web-search-deepseek'], [{ op: 'set', path: ['baseURL'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('web.baseUrl', ['web-deepseek-api', 'web-search-deepseek'], [{ op: 'unset', path: ['baseURL'] }])
                }}
              />
            </div>
          </ModuleCard>
        )}

        {showUi && (
          <ModuleCard title={t('modules.ui.title')}>
            <p className={css.modCardDesc}>{t('modules.ui.desc')}</p>
            <div className={css.prefStack}>
              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.ui.transcript.title')}</span>
                    {hasUserOverride(uiChatNs, 'transcriptView') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.ui.transcript.desc')}</div>
                </div>
                <div className={css.prefSegGroup} role="group" aria-label={t('modules.ui.transcript.title')}>
                  {([
                    { id: 'compact', label: t('modules.ui.transcript.compact') },
                    { id: 'standard', label: t('modules.ui.transcript.standard') },
                    { id: 'detailed', label: t('modules.ui.transcript.detailed') },
                    { id: 'verbose', label: t('modules.ui.transcript.verbose') },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busyKey === 'ui.transcript'}
                      aria-pressed={currentTranscript === opt.id}
                      className={currentTranscript === opt.id ? css.prefSegBtnOn : css.prefSegBtn}
                      onClick={() => {
                        if (currentTranscript === opt.id) return
                        void mutateNs('ui.transcript', ['ui-chat'], [{ op: 'set', path: ['transcriptView'], value: opt.id }])
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.ui.collapse.title')}</span>
                    {hasUserOverride(uiChatNs, 'collapseTiming') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.ui.collapse.desc')}</div>
                </div>
                <div className={css.prefSegGroup} role="group" aria-label={t('modules.ui.collapse.title')}>
                  {([
                    { id: 'completion', label: t('modules.ui.collapse.completion') },
                    { id: 'next-input', label: t('modules.ui.collapse.nextInput') },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busyKey === 'ui.collapse'}
                      aria-pressed={currentCollapse === opt.id}
                      className={currentCollapse === opt.id ? css.prefSegBtnOn : css.prefSegBtn}
                      onClick={() => {
                        if (currentCollapse === opt.id) return
                        void mutateNs('ui.collapse', ['ui-chat'], [{ op: 'set', path: ['collapseTiming'], value: opt.id }])
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.ui.perf.title')}</span>
                    {hasUserOverride(uiChatNs, 'performanceUsage') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.ui.perf.desc')}</div>
                </div>
                <div className={css.prefSegGroup} role="group" aria-label={t('modules.ui.perf.title')}>
                  {([
                    { id: 'compact', label: t('modules.ui.perf.compact') },
                    { id: 'detailed', label: t('modules.ui.perf.detailed') },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busyKey === 'ui.perf'}
                      aria-pressed={currentPerf === opt.id}
                      className={currentPerf === opt.id ? css.prefSegBtnOn : css.prefSegBtn}
                      onClick={() => {
                        if (currentPerf === opt.id) return
                        void mutateNs('ui.perf', ['ui-chat'], [{ op: 'set', path: ['performanceUsage'], value: opt.id }])
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.ui.link.title')}</span>
                    {hasUserOverride(uiChatNs, 'linkOpening') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.ui.link.desc')}</div>
                </div>
                <div className={css.prefSegGroup} role="group" aria-label={t('modules.ui.link.title')}>
                  {([
                    { id: 'sidebar', label: t('modules.ui.link.sidebar') },
                    { id: 'new-tab', label: t('modules.ui.link.newTab') },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busyKey === 'ui.link'}
                      aria-pressed={currentLink === opt.id}
                      className={currentLink === opt.id ? css.prefSegBtnOn : css.prefSegBtn}
                      onClick={() => {
                        if (currentLink === opt.id) return
                        void mutateNs('ui.link', ['ui-chat'], [{ op: 'set', path: ['linkOpening'], value: opt.id }])
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.ui.busyEnter.title')}</span>
                    {hasUserOverride(uiConvNs, 'busyEnter') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.ui.busyEnter.desc')}</div>
                </div>
                <div className={css.prefSegGroup} role="group" aria-label={t('modules.ui.busyEnter.title')}>
                  {([
                    { id: 'queue', label: t('modules.ui.busyEnter.queue') },
                    { id: 'steer', label: t('modules.ui.busyEnter.steer') },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busyKey === 'ui.busyEnter'}
                      aria-pressed={currentBusyEnter === opt.id}
                      className={currentBusyEnter === opt.id ? css.prefSegBtnOn : css.prefSegBtn}
                      onClick={() => {
                        if (currentBusyEnter === opt.id) return
                        void mutateNs('ui.busyEnter', ['ui-conversation'], [{ op: 'set', path: ['busyEnter'], value: opt.id }])
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.ui.theme.title')}</span>
                    {hasUserOverride(uiThemeNs, 'preference') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.ui.theme.desc')}</div>
                </div>
                <div className={css.prefSegGroup} role="group" aria-label={t('modules.ui.theme.title')}>
                  {([
                    { id: 'system', label: t('modules.ui.theme.system') },
                    { id: 'light', label: t('modules.ui.theme.light') },
                    { id: 'dark', label: t('modules.ui.theme.dark') },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busyKey === 'ui.theme'}
                      aria-pressed={currentThemePref === opt.id}
                      className={currentThemePref === opt.id ? css.prefSegBtnOn : css.prefSegBtn}
                      onClick={() => {
                        if (currentThemePref === opt.id) return
                        void mutateNs('ui.theme', ['ui-theme'], [{ op: 'set', path: ['preference'], value: opt.id }])
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <NumberSettingRow
                title={t('modules.ui.fontSize.title')}
                desc={t('modules.ui.fontSize.desc')}
                value={readNum(uiThemeNs, 'fontSize', 14)}
                baseValue={readBaseNum(uiThemeNs, 'fontSize', 14)}
                customized={hasUserOverride(uiThemeNs, 'fontSize')}
                min={10}
                max={24}
                chips={FONT_SIZE_CHIPS}
                formatChip={val => t('modules.unit.px', { n: val })}
                busy={busyKey === 'ui.fontSize'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(uiThemeNs, 'fontSize', 14) })}
                onApply={(val) => {
                  void mutateNs('ui.fontSize', ['ui-theme'], [{ op: 'set', path: ['fontSize'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('ui.fontSize', ['ui-theme'], [{ op: 'unset', path: ['fontSize'] }])
                }}
              />

              <NumberSettingRow
                title={t('modules.ui.codeFontSize.title')}
                desc={t('modules.ui.codeFontSize.desc')}
                value={readNum(uiThemeNs, 'codeFontSize', 13)}
                baseValue={readBaseNum(uiThemeNs, 'codeFontSize', 13)}
                customized={hasUserOverride(uiThemeNs, 'codeFontSize')}
                min={10}
                max={24}
                chips={FONT_SIZE_CHIPS}
                formatChip={val => t('modules.unit.px', { n: val })}
                busy={busyKey === 'ui.codeFontSize'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(uiThemeNs, 'codeFontSize', 13) })}
                onApply={(val) => {
                  void mutateNs('ui.codeFontSize', ['ui-theme'], [{ op: 'set', path: ['codeFontSize'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('ui.codeFontSize', ['ui-theme'], [{ op: 'unset', path: ['codeFontSize'] }])
                }}
              />

              <NumberSettingRow
                title={t('modules.ui.termFontSize.title')}
                desc={t('modules.ui.termFontSize.desc')}
                value={readNum(uiThemeNs, 'terminalFontSize', 13)}
                baseValue={readBaseNum(uiThemeNs, 'terminalFontSize', 13)}
                customized={hasUserOverride(uiThemeNs, 'terminalFontSize')}
                min={10}
                max={24}
                chips={FONT_SIZE_CHIPS}
                formatChip={val => t('modules.unit.px', { n: val })}
                busy={busyKey === 'ui.termFontSize'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(uiThemeNs, 'terminalFontSize', 13) })}
                onApply={(val) => {
                  void mutateNs('ui.termFontSize', ['ui-theme'], [{ op: 'set', path: ['terminalFontSize'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('ui.termFontSize', ['ui-theme'], [{ op: 'unset', path: ['terminalFontSize'] }])
                }}
              />
            </div>
          </ModuleCard>
        )}

        {showGateway && (
          <ModuleCard title={t('modules.gateway.title')}>
            <p className={css.modCardDesc}>{t('modules.gateway.desc')}</p>
            <div className={css.prefStack}>
              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.prefTitle}>{t('prefs.xsession.title')}</div>
                  <div className={css.prefDesc}>{t('prefs.xsession.desc')}</div>
                </div>
                <Switch
                  checked={tracking}
                  disabled={busyKey === 'gw.tracking'}
                  label={t('prefs.xsession.title')}
                  onChange={(next) => {
                    setTrackingOn(next)
                    setBusyKey('gw.tracking')
                    void setTracking(next).finally(() => {
                      setBusyKey(null)
                      flashSaved()
                    })
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
                      disabled={busyKey === 'gw.protocol'}
                      aria-pressed={protocol === choice}
                      className={protocol === choice ? css.prefSegBtnOn : css.prefSegBtn}
                      onClick={() => {
                        if (protocol === choice) return
                        setProtocol(choice)
                        setBusyKey('gw.protocol')
                        void setProtocolPreference(choice).finally(() => {
                          setBusyKey(null)
                          flashSaved()
                        })
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
                    disabled={busyKey === 'gw.autosync'}
                    label={t('prefs.autosync.title')}
                    onChange={(next) => {
                      setAutoSync(next)
                      if (setAutoSyncModels === undefined) return
                      setBusyKey('gw.autosync')
                      void setAutoSyncModels(next).finally(() => {
                        setBusyKey(null)
                        flashSaved()
                      })
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
                      disabled={busyKey === 'gw.network'}
                      value={netSnap.active}
                      onChange={(event) => {
                        const url = event.target.value
                        setBusyKey('gw.network')
                        void networkRoute(url).then((res) => {
                          if (!('error' in res)) setNetSnap(res)
                        }).finally(() => {
                          setBusyKey(null)
                          flashSaved()
                        })
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
                    disabled={busyKey === 'gw.network'}
                    label={t('prefs.network.title')}
                    onChange={(next) => {
                      setBusyKey('gw.network')
                      void networkAuto(next).then((res) => {
                        if (!('error' in res)) setNetSnap(res)
                      }).finally(() => {
                        setBusyKey(null)
                        flashSaved()
                      })
                    }}
                  />
                </div>
              </div>

              <NumberSettingRow
                title={t('modules.gateway.timeout.title')}
                desc={t('modules.gateway.timeout.desc')}
                value={readNum(xpeachNs, 'timeoutMs', 15_000)}
                baseValue={readBaseNum(xpeachNs, 'timeoutMs', 15_000)}
                customized={hasUserOverride(xpeachNs, 'timeoutMs')}
                min={3_000}
                step={1_000}
                chips={GATEWAY_TIMEOUT_CHIPS}
                formatChip={val => t('unit.s', { n: Math.round(val / 1_000) })}
                busy={busyKey === 'gw.timeout'}
                applyLabel={t('modules.act.apply')}
                resetLabel={t('modules.act.reset')}
                customizedLabel={t('modules.badge.customized')}
                defaultBadgeLabel={t('modules.badge.default', { val: readBaseNum(xpeachNs, 'timeoutMs', 15_000) })}
                onApply={(val) => {
                  void mutateNs('gw.timeout', ['xpeach-account', 'xpeach'], [{ op: 'set', path: ['timeoutMs'], value: val }])
                }}
                onReset={() => {
                  void mutateNs('gw.timeout', ['xpeach-account', 'xpeach'], [{ op: 'unset', path: ['timeoutMs'] }])
                }}
              />

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.gateway.sessionLog.title')}</span>
                    {hasUserOverride(sessionLogNs, 'enabled') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.gateway.sessionLog.desc')}</div>
                </div>
                <Switch
                  checked={readBool(sessionLogNs, 'enabled', true)}
                  disabled={busyKey === 'gw.sessionLog'}
                  label={t('modules.gateway.sessionLog.title')}
                  onChange={(next) => {
                    void mutateNs('gw.sessionLog', ['session-log-deepseek'], [{ op: 'set', path: ['enabled'], value: next }])
                  }}
                />
              </div>

              <div className={css.prefRow}>
                <div className={css.prefRowText}>
                  <div className={css.modTitleRow}>
                    <span className={css.prefTitle}>{t('modules.gateway.analytics.title')}</span>
                    {hasUserOverride(analyticsNs, 'enabled') && (
                      <span className={css.modBadgeCustom}>{t('modules.badge.customized')}</span>
                    )}
                  </div>
                  <div className={css.prefDesc}>{t('modules.gateway.analytics.desc')}</div>
                </div>
                <Switch
                  checked={readBool(analyticsNs, 'enabled', true)}
                  disabled={busyKey === 'gw.analytics'}
                  label={t('modules.gateway.analytics.title')}
                  onChange={(next) => {
                    void mutateNs('gw.analytics', ['product-analytics'], [{ op: 'set', path: ['enabled'], value: next }])
                  }}
                />
              </div>
            </div>
          </ModuleCard>
        )}
      </div>
    </div>
  )
}

/**
 * Render the standalone `功能模块` (`Feature Modules`) section in Settings.
 * @param props - localized copy and injected operations.
 * @returns the Settings section element.
 */
export function ModuleSettingsSection(props: ModuleSettingsSectionProps): JSX.Element {
  const { t } = props
  return (
    <section>
      <header className={css.cardHead}>
        <div className={css.cardHeadText}>
          <h3 className={css.cardTitle}>{t('modules.title')}</h3>
          <p className={css.cardDesc}>{t('modules.description')}</p>
        </div>
      </header>
      <ModuleSettingsBody {...props} />
    </section>
  )
}

/**
 * Render the `模块参数配置` (`Module Settings`) tab inside `设置 → 内置插件`.
 * @param props - localized copy and injected operations.
 * @returns the tab body element.
 */
export function ModuleSettingsTab(
  props: PropsLocale<'xpeach.account'> & InjectFace<ModuleSettingsInjected>,
): JSX.Element {
  return <ModuleSettingsBody {...props} />
}
