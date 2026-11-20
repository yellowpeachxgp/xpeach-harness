/**
 * XPeach Prompt & Upstream Gateway Request Inspector: exposes and allows live
 * customization of outbound HTTP headers, request body JSON, system prompt
 * sections, pre-step implicit injections, runtime contexts, and tool schemas.
 */
import { type JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Modal } from '@xpeach/xph-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type {
  XPeachCustomGatewayHeader,
  XPeachGatewayInspectorRequest,
  XPeachGatewayInspectorSnapshot,
  XPeachInspectedContextBlock,
  XPeachInspectedPromptSection,
  XPeachInspectedToolItem,
  XPeachOps,
  XPeachPromptOverridesConfig,
  XPeachWireProtocol,
} from './ops.ts'
import { XPeachMark, XPeachPromptIcon } from './brand.tsx'
import css from './xpeach.module.css'

export { XPeachPromptIcon }

/** Props injected into the XPeach Prompt & Gateway Inspector main panel. */
export type XPeachPromptInspectorProps = PropsLocale<'xpeach.account'> & InjectFace<Pick<
  XPeachOps,
  'gatewayInspectorSnapshot' | 'gatewayInspectorSave'
>>

type InspectorTab = 'wire' | 'system' | 'implicit' | 'tools' | 'headers'
type WireMode = 'assembled' | 'captured'

const REASONING_LEVELS = ['minimal', 'low', 'medium', 'high', 'xhigh'] as const
const CACHE_LEVELS = ['none', 'short', 'long'] as const
const HTTP_POST = ['P', 'O', 'S', 'T'].join('')

const EMPTY_CONFIG: XPeachPromptOverridesConfig = {
  disabledSections: [],
  sectionOverrides: {},
  customSections: [],
  disabledContexts: [],
  contextOverrides: {},
  customContexts: [],
  disabledImplicitInjectors: [],
  customPreStepInjections: [],
  disabledTools: [],
  toolDescriptionOverrides: {},
  customHeaders: [],
  conversationTracking: true,
  reasoningEffort: 'default',
  cacheRetention: 'default',
  temperature: null,
  maxTokens: null,
}

const CheckSvg = (): JSX.Element => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.2 6.2L4.8 8.8L9.8 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SearchSvg = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10.6 10.6L13.8 13.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

/**
 * Render the XPeach Prompt & Upstream Gateway Request Inspector studio.
 * @param props - locale translator and injected XPeach operations.
 * @returns the prompt and gateway studio element.
 */
export function XPeachPromptInspectorPage({
  t, gatewayInspectorSnapshot, gatewayInspectorSave,
}: XPeachPromptInspectorProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<XPeachGatewayInspectorSnapshot | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [tab, setTab] = useState<InspectorTab>('wire')
  const [wireMode, setWireMode] = useState<WireMode>('assembled')
  const [selectedCaptureId, setSelectedCaptureId] = useState<string>('')

  const [protocol, setProtocol] = useState<XPeachWireProtocol | undefined>(undefined)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [samplePrompt, setSamplePrompt] = useState<string>('')

  // Multi-select state for System Sections, Implicit Injectors, and Tools
  const [selectedSections, setSelectedSections] = useState<ReadonlySet<string>>(new Set())
  const [selectedImplicit, setSelectedImplicit] = useState<ReadonlySet<string>>(new Set())
  const [selectedTools, setSelectedTools] = useState<ReadonlySet<string>>(new Set())
  const [toolQuery, setToolQuery] = useState<string>('')
  const [expandedSchemas, setExpandedSchemas] = useState<ReadonlySet<string>>(new Set())

  // Inline editors & creation modals
  const [editingSection, setEditingSection] = useState<{ readonly name: string; readonly text: string } | null>(null)
  const [editingContext, setEditingContext] = useState<{ readonly name: string; readonly text: string } | null>(null)
  const [editingTool, setEditingTool] = useState<{ readonly name: string; readonly desc: string } | null>(null)

  const [newSectionModal, setNewSectionModal] = useState<{ name: string; order: string; text: string } | null>(null)
  const [newImplicitModal, setNewImplicitModal] = useState<{
    kind: 'pre-step' | 'context'
    draftTitle: string
    placement: 'before-user' | 'after-user'
    text: string
  } | null>(null)

  // Header & sampling draft state synced with snapshot.config
  const [headersDraft, setHeadersDraft] = useState<XPeachCustomGatewayHeader[]>([])
  const [trackingDraft, setTrackingDraft] = useState(true)
  const [reasoningDraft, setReasoningDraft] = useState<XPeachPromptOverridesConfig['reasoningEffort']>('default')
  const [cacheDraft, setCacheDraft] = useState<XPeachPromptOverridesConfig['cacheRetention']>('default')
  const [tempDraft, setTempDraft] = useState<string>('')
  const [maxTokDraft, setMaxTokDraft] = useState<string>('')

  const previewReq = useMemo((): XPeachGatewayInspectorRequest => ({
    ...(protocol !== undefined ? { protocol } : {}),
    ...(selectedModel.trim().length > 0 ? { model: selectedModel.trim() } : {}),
    ...(selectedSessionId.trim().length > 0 ? { sessionId: selectedSessionId.trim() } : {}),
    ...(samplePrompt.trim().length > 0 ? { sampleUserMessage: samplePrompt.trim() } : {}),
  }), [protocol, selectedModel, selectedSessionId, samplePrompt])

  const syncDraftsFromConfig = useCallback((cfg: XPeachPromptOverridesConfig): void => {
    setHeadersDraft([...cfg.customHeaders])
    setTrackingDraft(cfg.conversationTracking)
    setReasoningDraft(cfg.reasoningEffort)
    setCacheDraft(cfg.cacheRetention)
    setTempDraft(cfg.temperature !== null ? String(cfg.temperature) : '')
    setMaxTokDraft(cfg.maxTokens !== null ? String(cfg.maxTokens) : '')
  }, [])

  const loadSnapshot = useCallback((req: XPeachGatewayInspectorRequest): void => {
    if (gatewayInspectorSnapshot === undefined) {
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    void gatewayInspectorSnapshot(req).then((snap) => {
      setSnapshot(snap)
      syncDraftsFromConfig(snap.config)
      if (snap.capturedRequests[0] !== undefined && selectedCaptureId === '') {
        setSelectedCaptureId(snap.capturedRequests[0].id)
      }
      setLoading(false)
    }).catch((cause: unknown) => {
      setErr(cause instanceof Error ? cause.message : String(cause))
      setLoading(false)
    })
  }, [gatewayInspectorSnapshot, selectedCaptureId, syncDraftsFromConfig])

  useEffect(() => {
    loadSnapshot(previewReq)
  }, [loadSnapshot, previewReq])

  const persistConfig = async (nextConfig: XPeachPromptOverridesConfig, showSavedBanner = true): Promise<void> => {
    if (gatewayInspectorSave === undefined) return
    setBusy(true); setErr(null)
    if (showSavedBanner) setBanner(null)
    try {
      const snap = await gatewayInspectorSave({ config: nextConfig, preview: previewReq })
      setSnapshot(snap)
      syncDraftsFromConfig(snap.config)
      if (showSavedBanner) setBanner(t('prompts.savedBanner'))
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const cfg = snapshot?.config ?? EMPTY_CONFIG
  const sections = snapshot?.sections ?? []
  const contexts = snapshot?.contexts ?? []
  const implicitItems = snapshot?.implicitInjections ?? []
  const tools = snapshot?.tools ?? []
  const captures = snapshot?.capturedRequests ?? []

  const filteredTools = useMemo(() => {
    const q = toolQuery.trim().toLowerCase()
    if (q === '') return tools
    return tools.filter(item =>
      item.name.toLowerCase().includes(q)
      || item.effectiveDescription.toLowerCase().includes(q))
  }, [tools, toolQuery])

  const activeCapture = useMemo(
    () => captures.find(c => c.id === selectedCaptureId) ?? captures[0],
    [captures, selectedCaptureId],
  )

  const copyText = (text: string): void => {
    if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
      void navigator.clipboard.writeText(text).then(() => {
        setBanner(t('prompts.wire.copied'))
      }).catch(() => {})
    }
  }

  // ─── Section Actions ───
  const toggleSectionEnabled = (sec: XPeachInspectedPromptSection): void => {
    if (sec.isCustom && sec.customId !== undefined) {
      const customSections = cfg.customSections.map(c =>
        c.id === sec.customId ? { ...c, enabled: !c.enabled } : c)
      void persistConfig({ ...cfg, customSections }, false)
      return
    }
    const nextDisabled = new Set(cfg.disabledSections)
    if (sec.enabled) nextDisabled.add(sec.name)
    else nextDisabled.delete(sec.name)
    void persistConfig({ ...cfg, disabledSections: [...nextDisabled] }, false)
  }

  const batchToggleSections = (enabled: boolean): void => {
    if (selectedSections.size === 0) return
    const nextDisabled = new Set(cfg.disabledSections)
    const customSections = cfg.customSections.map((c) => {
      if (!selectedSections.has(c.name)) return c
      return { ...c, enabled }
    })
    for (const sec of sections) {
      if (sec.isCustom || !selectedSections.has(sec.name)) continue
      if (enabled) nextDisabled.delete(sec.name)
      else nextDisabled.add(sec.name)
    }
    void persistConfig({ ...cfg, disabledSections: [...nextDisabled], customSections })
  }

  const saveSectionOverride = (): void => {
    if (editingSection === null) return
    const target = sections.find(s => s.name === editingSection.name)
    if (target?.isCustom && target.customId !== undefined) {
      const customSections = cfg.customSections.map(c =>
        c.id === target.customId ? { ...c, text: editingSection.text } : c)
      setEditingSection(null)
      void persistConfig({ ...cfg, customSections })
      return
    }
    const nextOverrides = { ...cfg.sectionOverrides, [editingSection.name]: editingSection.text }
    setEditingSection(null)
    void persistConfig({ ...cfg, sectionOverrides: nextOverrides })
  }

  const resetSectionOverride = (name: string): void => {
    const { [name]: _removed, ...rest } = cfg.sectionOverrides
    void persistConfig({ ...cfg, sectionOverrides: rest })
  }

  const deleteCustomSection = (customId: string): void => {
    const customSections = cfg.customSections.filter(c => c.id !== customId)
    void persistConfig({ ...cfg, customSections })
  }

  // ─── Implicit & Runtime Context Actions ───
  const toggleImplicitEnabled = (id: string, isCustom?: boolean): void => {
    if (isCustom === true) {
      const customPreStepInjections = cfg.customPreStepInjections.map(c =>
        c.id === id ? { ...c, enabled: !c.enabled } : c)
      void persistConfig({ ...cfg, customPreStepInjections }, false)
      return
    }
    const nextDisabled = new Set(cfg.disabledImplicitInjectors)
    if (nextDisabled.has(id)) nextDisabled.delete(id)
    else nextDisabled.add(id)
    void persistConfig({ ...cfg, disabledImplicitInjectors: [...nextDisabled] }, false)
  }

  const batchToggleImplicit = (enabled: boolean): void => {
    if (selectedImplicit.size === 0) return
    const nextDisabled = new Set(cfg.disabledImplicitInjectors)
    const customPreStepInjections = cfg.customPreStepInjections.map(c =>
      selectedImplicit.has(c.id) ? { ...c, enabled } : c)
    for (const item of implicitItems) {
      if (item.isCustom === true || !selectedImplicit.has(item.id)) continue
      if (enabled) nextDisabled.delete(item.id)
      else nextDisabled.add(item.id)
    }
    void persistConfig({ ...cfg, disabledImplicitInjectors: [...nextDisabled], customPreStepInjections })
  }

  const toggleContextEnabled = (block: XPeachInspectedContextBlock): void => {
    if (block.required) return
    if (block.isCustom && block.customId !== undefined) {
      const customContexts = cfg.customContexts.map(c =>
        c.id === block.customId ? { ...c, enabled: !c.enabled } : c)
      void persistConfig({ ...cfg, customContexts }, false)
      return
    }
    const nextDisabled = new Set(cfg.disabledContexts)
    if (block.enabled) nextDisabled.add(block.name)
    else nextDisabled.delete(block.name)
    void persistConfig({ ...cfg, disabledContexts: [...nextDisabled] }, false)
  }

  const saveContextOverride = (): void => {
    if (editingContext === null) return
    const target = contexts.find(c => c.name === editingContext.name)
    if (target?.isCustom && target.customId !== undefined) {
      const customContexts = cfg.customContexts.map(c =>
        c.id === target.customId ? { ...c, text: editingContext.text } : c)
      setEditingContext(null)
      void persistConfig({ ...cfg, customContexts })
      return
    }
    const nextOverrides = { ...cfg.contextOverrides, [editingContext.name]: editingContext.text }
    setEditingContext(null)
    void persistConfig({ ...cfg, contextOverrides: nextOverrides })
  }

  // ─── Tool Schema Actions ───
  const toggleToolEnabled = (tool: XPeachInspectedToolItem): void => {
    const nextDisabled = new Set(cfg.disabledTools)
    if (tool.enabled) nextDisabled.add(tool.name)
    else nextDisabled.delete(tool.name)
    void persistConfig({ ...cfg, disabledTools: [...nextDisabled] }, false)
  }

  const batchToggleTools = (enabled: boolean): void => {
    if (selectedTools.size === 0) return
    const nextDisabled = new Set(cfg.disabledTools)
    for (const name of selectedTools) {
      if (enabled) nextDisabled.delete(name)
      else nextDisabled.add(name)
    }
    void persistConfig({ ...cfg, disabledTools: [...nextDisabled] })
  }

  const saveToolDescription = (): void => {
    if (editingTool === null) return
    const nextOverrides = { ...cfg.toolDescriptionOverrides, [editingTool.name]: editingTool.desc }
    setEditingTool(null)
    void persistConfig({ ...cfg, toolDescriptionOverrides: nextOverrides })
  }

  const resetToolDescription = (name: string): void => {
    const { [name]: _removed, ...rest } = cfg.toolDescriptionOverrides
    void persistConfig({ ...cfg, toolDescriptionOverrides: rest })
  }

  // ─── Headers & Sampling Params Save ───
  const applyGatewayParams = (): void => {
    const parsedTemp = tempDraft.trim() === '' ? null : Number(tempDraft)
    const parsedMax = maxTokDraft.trim() === '' ? null : Number(maxTokDraft)
    void persistConfig({
      ...cfg,
      customHeaders: headersDraft.filter(h => h.key.trim().length > 0),
      conversationTracking: trackingDraft,
      reasoningEffort: reasoningDraft,
      cacheRetention: cacheDraft,
      temperature: parsedTemp !== null && Number.isFinite(parsedTemp) ? parsedTemp : null,
      maxTokens: parsedMax !== null && Number.isFinite(parsedMax) && parsedMax >= 1 ? Math.floor(parsedMax) : null,
    })
  }

  const activeHeaders = wireMode === 'captured' && activeCapture !== undefined
    ? activeCapture.headers
    : (snapshot?.headers ?? [])
  const activeBodyJson = wireMode === 'captured' && activeCapture !== undefined
    ? activeCapture.bodyJson
    : (snapshot?.requestBodyJson ?? '{}')
  const activeEndpointUrl = wireMode === 'captured' && activeCapture !== undefined
    ? activeCapture.url
    : (snapshot?.endpointUrl ?? 'https://fast.xpeach.codes/v1/chat/completions')

  const allSectionsSelected = sections.length > 0 && sections.every(s => selectedSections.has(s.name))
  const allImplicitSelected = implicitItems.length > 0 && implicitItems.every(i => selectedImplicit.has(i.id))
  const allToolsSelected = filteredTools.length > 0 && filteredTools.every(item => selectedTools.has(item.name))

  return (
    <div className={css.tabRoot}>
      <header className={css.tabHead} data-window-drag>
        <div className={css.pageHeadText}>
          <h2 className={css.pageTitle}>{t('prompts.title')}</h2>
          <p className={css.pageIntro}>{t('prompts.subtitle')}</p>
        </div>
        <div className={css.ctrlHeadActions}>
          <button
            type="button"
            className={css.bindGhost}
            disabled={busy}
            onClick={() => {
              setNewImplicitModal({ kind: 'pre-step', draftTitle: '', placement: 'after-user', text: '' })
            }}
          >
            {t('prompts.imp.addPreStep')}
          </button>
          <button
            type="button"
            className={css.bindButton}
            disabled={busy}
            onClick={() => {
              setNewSectionModal({ name: 'custom:instructions', order: '10150', text: '' })
            }}
          >
            {t('prompts.sec.addCustom')}
          </button>
          <button
            type="button"
            className={css.iconButton}
            onClick={() => { loadSnapshot(previewReq) }}
            title={t('pill.refresh')}
            aria-label={t('pill.refreshAria')}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89M13.5 1.5v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <dl className={css.usageGrid}>
        <div className={css.usageCell}>
          <dt>{t('prompts.stat.system')}</dt>
          <dd>{t('prompts.tokensUnit', { n: String(snapshot?.stats.systemTokens ?? 0) })}</dd>
        </div>
        <div className={css.usageCell}>
          <dt>{t('prompts.stat.context')}</dt>
          <dd>{t('prompts.tokensUnit', { n: String(snapshot?.stats.contextTokens ?? 0) })}</dd>
        </div>
        <div className={css.usageCell}>
          <dt>{t('prompts.stat.implicit')}</dt>
          <dd>{t('prompts.tokensUnit', { n: String(snapshot?.stats.implicitTokens ?? 0) })}</dd>
        </div>
        <div className={css.usageCell}>
          <dt>{t('prompts.stat.tools', { n: String(tools.filter(x => x.enabled).length) })}</dt>
          <dd>{t('prompts.tokensUnit', { n: String(snapshot?.stats.toolTokens ?? 0) })}</dd>
        </div>
        <div className={css.usageCell}>
          <dt>{t('prompts.stat.total')}</dt>
          <dd>{t('prompts.tokensUnit', { n: String(snapshot?.stats.totalEstTokens ?? 0) })}</dd>
        </div>
      </dl>

      {banner !== null && <p className={css.ctrlBannerOk}>{banner}</p>}
      {err !== null && <p className={css.bindError}>{err}</p>}

      <section className={css.promptEndpointCard}>
        <div className={css.promptEndpointTop}>
          <code className={css.promptMethodBadge}>{snapshot?.method ?? HTTP_POST}</code>
          <code className={css.promptUrlCode} title={activeEndpointUrl}>{activeEndpointUrl}</code>
          <button
            type="button"
            className={css.bindGhost}
            onClick={() => { copyText(activeBodyJson) }}
          >
            {t('prompts.wire.copyJson')}
          </button>
          {snapshot !== undefined && wireMode === 'assembled' && (
            <button
              type="button"
              className={css.bindGhost}
              onClick={() => { copyText(snapshot.curlPreview) }}
            >
              {t('prompts.wire.copyCurl')}
            </button>
          )}
        </div>

        <div className={css.promptControlsRow}>
          <label className={css.chField}>
            <span>{t('mcp.modal.transport')}</span>
            <select
              className={css.promptSelect}
              value={protocol ?? snapshot?.protocol ?? 'openai-completions'}
              onChange={(e) => {
                const v = e.target.value as XPeachWireProtocol
                setProtocol(v)
              }}
            >
              <option value="openai-completions">{t('prompts.proto.chat')}</option>
              <option value="openai-responses">{t('prompts.proto.responses')}</option>
              <option value="anthropic-messages">{t('prompts.proto.anthropic')}</option>
            </select>
          </label>

          <label className={css.chField}>
            <span>{t('logs.model')}</span>
            <select
              className={css.promptSelect}
              value={selectedModel || snapshot?.model || ''}
              onChange={(e) => { setSelectedModel(e.target.value) }}
            >
              {(snapshot?.availableModels ?? []).length === 0 && (
                <option value={snapshot?.model ?? 'swe-2-max'}>{snapshot?.model ?? 'swe-2-max'}</option>
              )}
              {(snapshot?.availableModels ?? []).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label className={css.chField}>
            <span>{t('prompts.session.synthetic')}</span>
            <select
              className={css.promptSelect}
              value={selectedSessionId}
              onChange={(e) => { setSelectedSessionId(e.target.value) }}
            >
              <option value="">{t('prompts.session.synthetic')}</option>
              {(snapshot?.recentSessions ?? []).map(sess => (
                <option key={sess.id} value={sess.id}>
                  {(sess.title ?? sess.cwd ?? sess.id).slice(0, 38)}
                </option>
              ))}
            </select>
          </label>

          {selectedSessionId === '' && (
            <label className={css.chField}>
              <span>{t('prompts.sampleLabel')}</span>
              <input
                className={css.promptSelect}
                value={samplePrompt}
                placeholder={t('prompts.samplePh')}
                onChange={(e) => { setSamplePrompt(e.target.value) }}
              />
            </label>
          )}
        </div>
      </section>

      <div className={css.ctrlToolbar}>
        <nav className={css.segRow}>
          <button
            type="button"
            className={tab === 'wire' ? css.segOn : css.segOff}
            onClick={() => { setTab('wire') }}
          >
            {t('prompts.tab.wire')}
          </button>
          <button
            type="button"
            className={tab === 'system' ? css.segOn : css.segOff}
            onClick={() => { setTab('system') }}
          >
            {t('prompts.tab.system', { n: String(sections.length) })}
          </button>
          <button
            type="button"
            className={tab === 'implicit' ? css.segOn : css.segOff}
            onClick={() => { setTab('implicit') }}
          >
            {t('prompts.tab.implicit', { n: String(implicitItems.length + contexts.length) })}
          </button>
          <button
            type="button"
            className={tab === 'tools' ? css.segOn : css.segOff}
            onClick={() => { setTab('tools') }}
          >
            {t('prompts.tab.tools', { n: String(tools.length) })}
          </button>
          <button
            type="button"
            className={tab === 'headers' ? css.segOn : css.segOff}
            onClick={() => { setTab('headers') }}
          >
            {t('prompts.tab.headers')}
          </button>
        </nav>

        {tab === 'wire' && (
          <div className={css.ctrlFilterGroup}>
            <button
              type="button"
              className={wireMode === 'assembled' ? css.groupChipOn : css.groupPickChip}
              onClick={() => { setWireMode('assembled') }}
            >
              {t('prompts.wire.assembled')}
            </button>
            <button
              type="button"
              className={wireMode === 'captured' ? css.groupChipOn : css.groupPickChip}
              onClick={() => { setWireMode('captured') }}
            >
              {t('prompts.wire.captured', { n: String(captures.length) })}
            </button>
          </div>
        )}
      </div>

      {loading && snapshot === undefined ? (
        <div className={css.skelWrap} aria-busy="true" aria-label={t('status.loading')}>
          <div className={css.ctrlCardGrid}>
            <div className={css.skelCard}>
              <i className={css.skelLine} style={{ width: '50%' }} />
              <i className={css.skelLine} style={{ width: '90%' }} />
              <i className={css.skelLine} style={{ width: '75%' }} />
            </div>
            <div className={css.skelCard}>
              <i className={css.skelLine} style={{ width: '40%' }} />
              <i className={css.skelLine} style={{ width: '85%' }} />
              <i className={css.skelLine} style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ─── TAB 1: Full Upstream Wire Payload ─── */}
          {tab === 'wire' && (
            <>
              {wireMode === 'captured' && captures.length > 0 && (
                <div className={css.promptCaptureList}>
                  {captures.map((cap) => {
                    const chipText = [
                      cap.model,
                      new Date(cap.timestamp).toLocaleTimeString(),
                      t('prompts.tokensUnit', { n: String(cap.estTotalTokens) }),
                    ].join(' / ')
                    return (
                      <button
                        key={cap.id}
                        type="button"
                        className={activeCapture?.id === cap.id ? css.groupChipOn : css.groupPickChip}
                        onClick={() => { setSelectedCaptureId(cap.id) }}
                      >
                        {chipText}
                      </button>
                    )
                  })}
                </div>
              )}

              {wireMode === 'captured' && captures.length === 0 ? (
                <div className={css.emptyState}>
                  <span className={css.emptyMark} aria-hidden="true"><XPeachMark size={26} /></span>
                  <p className={css.bindHint}>{t('prompts.wire.noCaptures')}</p>
                </div>
              ) : (
                <div className={css.promptWireGrid}>
                  <div className={css.promptPane}>
                    <div className={css.promptPaneHead}>
                      <h3 className={css.sparkTitle}>
                        {t('prompts.wire.headersTitle', { n: String(activeHeaders.filter(h => h.enabled).length) })}
                      </h3>
                      <button
                        type="button"
                        className={css.marketBtn}
                        onClick={() => { setTab('headers') }}
                      >
                        {t('prompts.sec.editBtn')}
                      </button>
                    </div>
                    <ul className={css.promptHeaderList}>
                      {activeHeaders.map((h, i) => (
                        <li key={`${h.name}-${String(i)}`} className={css.promptHeaderItem} data-disabled={!h.enabled}>
                          <div className={css.promptHeaderTop}>
                            <code className={css.promptHeaderKey}>{h.name}</code>
                            <span className={css.ctrlBadge}>{h.source}</span>
                          </div>
                          <code className={css.promptHeaderVal}>{h.value}</code>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={css.promptPane}>
                    <div className={css.promptPaneHead}>
                      <h3 className={css.sparkTitle}>{t('prompts.wire.bodyTitle')}</h3>
                      <button
                        type="button"
                        className={css.marketBtn}
                        onClick={() => { copyText(activeBodyJson) }}
                      >
                        {t('prompts.wire.copyJson')}
                      </button>
                    </div>
                    <pre className={css.promptCodePre}>{activeBodyJson}</pre>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── TAB 2: System Prompt Sections ─── */}
          {tab === 'system' && (
            <>
              <div className={css.ctrlSearchRow}>
                <button
                  type="button"
                  className={allSectionsSelected ? css.groupChipOn : css.groupPickChip}
                  disabled={busy}
                  onClick={() => {
                    if (allSectionsSelected) setSelectedSections(new Set())
                    else setSelectedSections(new Set(sections.map(s => s.name)))
                  }}
                >
                  {allSectionsSelected
                    ? t('ctrl.unselectAll')
                    : t('ctrl.selectAll', { n: String(sections.length) })}
                </button>
                {selectedSections.size > 0 && (
                  <>
                    <span className={css.ctrlBatchCount}>
                      {t('ctrl.selectedCount', { n: String(selectedSections.size) })}
                    </span>
                    <button type="button" className={css.bindGhost} disabled={busy} onClick={() => { batchToggleSections(true) }}>
                      {t('ctrl.batchEnable')}
                    </button>
                    <button type="button" className={css.bindGhost} disabled={busy} onClick={() => { batchToggleSections(false) }}>
                      {t('ctrl.batchDisable')}
                    </button>
                  </>
                )}
              </div>

              <div className={css.promptBlockStack}>
                {sections.map((sec) => {
                  const isSel = selectedSections.has(sec.name)
                  const isEditing = editingSection?.name === sec.name
                  return (
                    <article
                      key={sec.name}
                      className={css.promptBlockCard}
                      data-disabled={!sec.enabled}
                      data-selected={isSel}
                    >
                      <div className={css.promptBlockHead}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isSel}
                          aria-label={t('ctrl.selectItem', { name: sec.name })}
                          className={css.ctrlCheckBtn}
                          data-checked={isSel}
                          onClick={() => {
                            setSelectedSections((prev) => {
                              const next = new Set(prev)
                              if (next.has(sec.name)) next.delete(sec.name)
                              else next.add(sec.name)
                              return next
                            })
                          }}
                        >
                          {isSel && <CheckSvg />}
                        </button>
                        <code className={css.ctrlCardTitle}>{sec.name}</code>
                        <span className={css.ctrlBadge}>{t('prompts.sec.orderLabel', { n: String(sec.order) })}</span>
                        {sec.overridden && <span className={css.ctrlBadgeWarn}>{t('prompts.sec.overridden')}</span>}
                        {sec.isCustom && <span className={css.ctrlStatusOn} style={{ marginLeft: 0 }}>{t('prompts.sec.customBadge')}</span>}
                        <span className={css.promptTokBadge}>{t('prompts.tokensUnit', { n: String(sec.estTokens) })}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={sec.enabled}
                          aria-label={sec.name}
                          className={css.ctrlToggleSwitch}
                          data-on={sec.enabled}
                          disabled={busy}
                          onClick={() => { toggleSectionEnabled(sec) }}
                        >
                          <span className={css.ctrlToggleThumb} />
                        </button>
                      </div>

                      {isEditing ? (
                        <>
                          <textarea
                            className={css.ctrlRulesEditor}
                            rows={8}
                            value={editingSection.text}
                            onChange={(e) => { setEditingSection({ name: sec.name, text: e.target.value }) }}
                          />
                          <div className={css.ctrlRulesFoot}>
                            <button type="button" className={css.bindGhost} onClick={() => { setEditingSection(null) }}>
                              {t('skills.modal.cancel')}
                            </button>
                            <button type="button" className={css.bindButton} disabled={busy} onClick={saveSectionOverride}>
                              {t('prompts.sec.saveOverride')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <pre className={css.promptCodePre}>{sec.effectiveText || '—'}</pre>
                      )}

                      <div className={css.ctrlCardFoot}>
                        <span className={css.ctrlPath}>{sec.category}</span>
                        <div className={css.ctrlCardActs}>
                          <button
                            type="button"
                            className={css.marketBtn}
                            onClick={() => { setEditingSection({ name: sec.name, text: sec.effectiveText }) }}
                          >
                            {t('prompts.sec.editBtn')}
                          </button>
                          {sec.overridden && (
                            <button
                              type="button"
                              className={css.marketBtn}
                              disabled={busy}
                              onClick={() => { resetSectionOverride(sec.name) }}
                            >
                              {t('prompts.sec.resetBtn')}
                            </button>
                          )}
                          {sec.isCustom && sec.customId !== undefined && (() => {
                            const cid = sec.customId
                            return (
                              <button
                                type="button"
                                className={css.ctrlBtnDanger}
                                disabled={busy}
                                onClick={() => { deleteCustomSection(cid) }}
                              >
                                {t('skills.card.delete')}
                              </button>
                            )
                          })()}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {/* ─── TAB 3: Implicit Pre-Step Injections & Runtime Context ─── */}
          {tab === 'implicit' && (
            <>
              <div className={css.promptPane}>
                <div className={css.promptPaneHead}>
                  <div>
                    <h3 className={css.sparkTitle}>{t('prompts.imp.preStepTitle')}</h3>
                    <p className={css.bindHint}>{t('prompts.imp.preStepHint')}</p>
                  </div>
                  <div className={css.ctrlBatchRight}>
                    <button
                      type="button"
                      className={allImplicitSelected ? css.groupChipOn : css.groupPickChip}
                      onClick={() => {
                        if (allImplicitSelected) setSelectedImplicit(new Set())
                        else setSelectedImplicit(new Set(implicitItems.map(i => i.id)))
                      }}
                    >
                      {allImplicitSelected ? t('ctrl.unselectAll') : t('ctrl.selectAll', { n: String(implicitItems.length) })}
                    </button>
                    {selectedImplicit.size > 0 && (
                      <>
                        <button type="button" className={css.bindGhost} disabled={busy} onClick={() => { batchToggleImplicit(true) }}>
                          {t('ctrl.batchEnable')}
                        </button>
                        <button type="button" className={css.bindGhost} disabled={busy} onClick={() => { batchToggleImplicit(false) }}>
                          {t('ctrl.batchDisable')}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className={css.bindButton}
                      onClick={() => {
                        setNewImplicitModal({ kind: 'pre-step', draftTitle: '', placement: 'after-user', text: '' })
                      }}
                    >
                      {t('prompts.imp.addPreStep')}
                    </button>
                  </div>
                </div>

                <div className={css.promptBlockStack}>
                  {implicitItems.map((item) => {
                    const isSel = selectedImplicit.has(item.id)
                    return (
                      <article
                        key={item.id}
                        className={css.promptBlockCard}
                        data-disabled={!item.enabled}
                        data-selected={isSel}
                      >
                        <div className={css.promptBlockHead}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isSel}
                            aria-label={t('ctrl.selectItem', { name: item.label })}
                            className={css.ctrlCheckBtn}
                            data-checked={isSel}
                            onClick={() => {
                              setSelectedImplicit((prev) => {
                                const next = new Set(prev)
                                if (next.has(item.id)) next.delete(item.id)
                                else next.add(item.id)
                                return next
                              })
                            }}
                          >
                            {isSel && <CheckSvg />}
                          </button>
                          <strong style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</strong>
                          <code className={css.keyMask}>{item.sourceKind}</code>
                          {item.placement !== undefined && (
                            <span className={css.ctrlBadge}>
                              {item.placement === 'before-user' ? t('prompts.imp.beforeUser') : t('prompts.imp.afterUser')}
                            </span>
                          )}
                          <span className={css.promptTokBadge}>{t('prompts.tokensUnit', { n: String(item.estTokens) })}</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.enabled}
                            aria-label={item.label}
                            className={css.ctrlToggleSwitch}
                            data-on={item.enabled}
                            disabled={busy || !item.toggleable}
                            onClick={() => { toggleImplicitEnabled(item.id, item.isCustom) }}
                          >
                            <span className={css.ctrlToggleThumb} />
                          </button>
                        </div>
                        <pre className={css.promptCodePre}>{item.previewText}</pre>
                        {item.isCustom === true && (
                          <div className={css.ctrlCardFoot}>
                            <span />
                            <button
                              type="button"
                              className={css.ctrlBtnDanger}
                              disabled={busy}
                              onClick={() => {
                                const customPreStepInjections = cfg.customPreStepInjections.filter(c => c.id !== item.id)
                                void persistConfig({ ...cfg, customPreStepInjections })
                              }}
                            >
                              {t('skills.card.delete')}
                            </button>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>

              <div className={css.promptPane}>
                <div className={css.promptPaneHead}>
                  <div>
                    <h3 className={css.sparkTitle}>{t('prompts.imp.runtimeTitle')}</h3>
                    <p className={css.bindHint}>{t('prompts.imp.runtimeHint')}</p>
                  </div>
                  <button
                    type="button"
                    className={css.bindGhost}
                    onClick={() => {
                      setNewImplicitModal({ kind: 'context', draftTitle: '', placement: 'after-user', text: '' })
                    }}
                  >
                    {t('prompts.imp.addContext')}
                  </button>
                </div>

                <div className={css.promptBlockStack}>
                  {contexts.map((block) => {
                    const isEditing = editingContext?.name === block.name
                    return (
                      <article key={block.name} className={css.promptBlockCard} data-disabled={!block.enabled}>
                        <div className={css.promptBlockHead}>
                          <code className={css.ctrlCardTitle}>{block.name}</code>
                          {block.required && <span className={css.ctrlBadgeWarn}>{t('prompts.imp.requiredBadge')}</span>}
                          {block.overridden && <span className={css.ctrlBadge}>{t('prompts.sec.overridden')}</span>}
                          <span className={css.promptTokBadge}>{t('prompts.tokensUnit', { n: String(block.estTokens) })}</span>
                          {!block.required && (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={block.enabled}
                              aria-label={block.name}
                              className={css.ctrlToggleSwitch}
                              data-on={block.enabled}
                              disabled={busy}
                              onClick={() => { toggleContextEnabled(block) }}
                            >
                              <span className={css.ctrlToggleThumb} />
                            </button>
                          )}
                        </div>
                        {isEditing ? (
                          <>
                            <textarea
                              className={css.ctrlRulesEditor}
                              rows={5}
                              value={editingContext.text}
                              onChange={(e) => { setEditingContext({ name: block.name, text: e.target.value }) }}
                            />
                            <div className={css.ctrlRulesFoot}>
                              <button type="button" className={css.bindGhost} onClick={() => { setEditingContext(null) }}>
                                {t('skills.modal.cancel')}
                              </button>
                              <button type="button" className={css.bindButton} disabled={busy} onClick={saveContextOverride}>
                                {t('prompts.sec.saveOverride')}
                              </button>
                            </div>
                          </>
                        ) : (
                          <pre className={css.promptCodePre}>{block.effectiveText}</pre>
                        )}
                        <div className={css.ctrlCardFoot}>
                          <span />
                          <div className={css.ctrlCardActs}>
                            <button
                              type="button"
                              className={css.marketBtn}
                              onClick={() => { setEditingContext({ name: block.name, text: block.effectiveText }) }}
                            >
                              {t('prompts.sec.editBtn')}
                            </button>
                            {block.overridden && (
                              <button
                                type="button"
                                className={css.marketBtn}
                                onClick={() => {
                                  const { [block.name]: _r, ...rest } = cfg.contextOverrides
                                  void persistConfig({ ...cfg, contextOverrides: rest })
                                }}
                              >
                                {t('prompts.sec.resetBtn')}
                              </button>
                            )}
                            {block.isCustom && block.customId !== undefined && (
                              <button
                                type="button"
                                className={css.ctrlBtnDanger}
                                onClick={() => {
                                  const customContexts = cfg.customContexts.filter(c => c.id !== block.customId)
                                  void persistConfig({ ...cfg, customContexts })
                                }}
                              >
                                {t('skills.card.delete')}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ─── TAB 4: Tool Schemas ─── */}
          {tab === 'tools' && (
            <>
              <div className={css.ctrlSearchRow}>
                <div className={css.ctrlSearchBox}>
                  <span className={css.ctrlSearchIcon}><SearchSvg /></span>
                  <input
                    className={css.ctrlSearchInput}
                    value={toolQuery}
                    placeholder={t('prompts.tools.searchPh')}
                    onChange={(e) => { setToolQuery(e.target.value) }}
                  />
                  {toolQuery.length > 0 && (
                    <button
                      type="button"
                      className={css.ctrlSearchClear}
                      aria-label={t('ctrl.searchClear')}
                      onClick={() => { setToolQuery('') }}
                    >
                      ×
                    </button>
                  )}
                </div>
                {filteredTools.length > 0 && (
                  <button
                    type="button"
                    className={allToolsSelected ? css.groupChipOn : css.groupPickChip}
                    onClick={() => {
                      if (allToolsSelected) setSelectedTools(new Set())
                      else setSelectedTools(new Set(filteredTools.map(x => x.name)))
                    }}
                  >
                    {allToolsSelected ? t('ctrl.unselectAll') : t('ctrl.selectAll', { n: String(filteredTools.length) })}
                  </button>
                )}
              </div>

              {selectedTools.size > 0 && (
                <div className={css.ctrlBatchBar}>
                  <div className={css.ctrlBatchLeft}>
                    <span className={css.ctrlBatchCount}>
                      {t('ctrl.selectedCount', { n: String(selectedTools.size) })}
                    </span>
                    <button type="button" className={css.marketBtn} onClick={() => { setSelectedTools(new Set()) }}>
                      {t('ctrl.unselectAll')}
                    </button>
                  </div>
                  <div className={css.ctrlBatchRight}>
                    <button type="button" className={css.bindGhost} disabled={busy} onClick={() => { batchToggleTools(true) }}>
                      {t('ctrl.batchEnable')}
                    </button>
                    <button type="button" className={css.bindGhost} disabled={busy} onClick={() => { batchToggleTools(false) }}>
                      {t('ctrl.batchDisable')}
                    </button>
                  </div>
                </div>
              )}

              <div className={css.ctrlCardGrid}>
                {filteredTools.map((tool) => {
                  const isSel = selectedTools.has(tool.name)
                  const schemaOpen = expandedSchemas.has(tool.name)
                  const isEditing = editingTool?.name === tool.name
                  return (
                    <article
                      key={tool.name}
                      className={css.ctrlCard}
                      data-disabled={!tool.enabled}
                      data-selected={isSel}
                    >
                      <div className={css.ctrlCardHead}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isSel}
                          aria-label={t('ctrl.selectItem', { name: tool.name })}
                          className={css.ctrlCheckBtn}
                          data-checked={isSel}
                          onClick={() => {
                            setSelectedTools((prev) => {
                              const next = new Set(prev)
                              if (next.has(tool.name)) next.delete(tool.name)
                              else next.add(tool.name)
                              return next
                            })
                          }}
                        >
                          {isSel && <CheckSvg />}
                        </button>
                        <code className={css.ctrlCardTitle}>{tool.name}</code>
                        <span className={css.ctrlBadge}>{tool.source}</span>
                        {tool.overridden && <span className={css.ctrlBadgeWarn}>{t('prompts.sec.overridden')}</span>}
                        <span className={css.promptTokBadge}>{t('prompts.tokensUnit', { n: String(tool.estTokens) })}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={tool.enabled}
                          aria-label={tool.name}
                          className={css.ctrlToggleSwitch}
                          data-on={tool.enabled}
                          disabled={busy}
                          onClick={() => { toggleToolEnabled(tool) }}
                        >
                          <span className={css.ctrlToggleThumb} />
                        </button>
                      </div>

                      {isEditing ? (
                        <>
                          <textarea
                            className={css.ctrlModalTextarea}
                            rows={5}
                            value={editingTool.desc}
                            onChange={(e) => { setEditingTool({ name: tool.name, desc: e.target.value }) }}
                          />
                          <div className={css.ctrlRulesFoot}>
                            <button type="button" className={css.bindGhost} onClick={() => { setEditingTool(null) }}>
                              {t('skills.modal.cancel')}
                            </button>
                            <button type="button" className={css.bindButton} disabled={busy} onClick={saveToolDescription}>
                              {t('prompts.sec.saveOverride')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className={css.ctrlCardDesc}>{tool.effectiveDescription || '—'}</p>
                      )}

                      {schemaOpen && (
                        <pre className={css.promptCodePre}>
                          {JSON.stringify(tool.parameters, null, 2)}
                        </pre>
                      )}

                      <div className={css.ctrlCardFoot}>
                        <button
                          type="button"
                          className={css.groupPickChip}
                          onClick={() => {
                            setExpandedSchemas((prev) => {
                              const next = new Set(prev)
                              if (next.has(tool.name)) next.delete(tool.name)
                              else next.add(tool.name)
                              return next
                            })
                          }}
                        >
                          {t('prompts.tools.schemaToggle')}
                        </button>
                        <div className={css.ctrlCardActs}>
                          <button
                            type="button"
                            className={css.marketBtn}
                            onClick={() => { setEditingTool({ name: tool.name, desc: tool.effectiveDescription }) }}
                          >
                            {t('prompts.tools.editDesc')}
                          </button>
                          {tool.overridden && (
                            <button
                              type="button"
                              className={css.marketBtn}
                              disabled={busy}
                              onClick={() => { resetToolDescription(tool.name) }}
                            >
                              {t('prompts.sec.resetBtn')}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {/* ─── TAB 5: Upstream HTTP Headers & Sampling Overrides ─── */}
          {tab === 'headers' && (
            <div className={css.promptBlockStack}>
              <div className={css.promptPane}>
                <div className={css.promptPaneHead}>
                  <div>
                    <h3 className={css.sparkTitle}>{t('prompts.headers.trackingTitle')}</h3>
                    <p className={css.bindHint}>{t('prompts.headers.trackingDesc')}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={trackingDraft}
                    aria-label={t('prompts.headers.trackingTitle')}
                    className={css.ctrlToggleSwitch}
                    data-on={trackingDraft}
                    onClick={() => { setTrackingDraft(v => !v) }}
                  >
                    <span className={css.ctrlToggleThumb} />
                  </button>
                </div>
              </div>

              <div className={css.promptPane}>
                <div className={css.promptPaneHead}>
                  <h3 className={css.sparkTitle}>{t('prompts.headers.customTitle')}</h3>
                  <button
                    type="button"
                    className={css.bindGhost}
                    onClick={() => {
                      setHeadersDraft(prev => [...prev, { key: '', value: '', enabled: true }])
                    }}
                  >
                    {t('prompts.headers.addHeader')}
                  </button>
                </div>

                {headersDraft.map((row, idx) => (
                  <div key={idx} className={css.promptHeaderEditRow}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={row.enabled}
                      aria-label={row.key || t('prompts.headers.addHeader')}
                      className={css.ctrlToggleSwitch}
                      style={{ marginLeft: 0 }}
                      data-on={row.enabled}
                      onClick={() => {
                        setHeadersDraft(prev => prev.map((item, i) => (i === idx ? { ...item, enabled: !item.enabled } : item)))
                      }}
                    >
                      <span className={css.ctrlToggleThumb} />
                    </button>
                    <input
                      className={css.bindInput}
                      value={row.key}
                      placeholder={t('prompts.headers.keyPh')}
                      onChange={(e) => {
                        const v = e.target.value
                        setHeadersDraft(prev => prev.map((item, i) => (i === idx ? { ...item, key: v } : item)))
                      }}
                    />
                    <input
                      className={css.bindInput}
                      value={row.value}
                      placeholder={t('prompts.headers.valPh')}
                      onChange={(e) => {
                        const v = e.target.value
                        setHeadersDraft(prev => prev.map((item, i) => (i === idx ? { ...item, value: v } : item)))
                      }}
                    />
                    <button
                      type="button"
                      className={css.ctrlBtnDanger}
                      onClick={() => {
                        setHeadersDraft(prev => prev.filter((_, i) => i !== idx))
                      }}
                    >
                      {t('skills.card.delete')}
                    </button>
                  </div>
                ))}
              </div>

              <div className={css.promptPane}>
                <h3 className={css.sparkTitle}>{t('prompts.headers.paramsTitle')}</h3>
                <div className={css.promptParamGrid}>
                  <label className={css.chField}>
                    <span>{t('prompts.headers.reasoning')}</span>
                    <select
                      className={css.promptSelect}
                      value={reasoningDraft}
                      onChange={(e) => {
                        setReasoningDraft(e.target.value as XPeachPromptOverridesConfig['reasoningEffort'])
                      }}
                    >
                      <option value="default">{t('fontPack.preset.system.name')}</option>
                      <option value="off">{t('skills.card.disable')}</option>
                      {REASONING_LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </label>

                  <label className={css.chField}>
                    <span>{t('prompts.headers.cache')}</span>
                    <select
                      className={css.promptSelect}
                      value={cacheDraft}
                      onChange={(e) => {
                        setCacheDraft(e.target.value as XPeachPromptOverridesConfig['cacheRetention'])
                      }}
                    >
                      <option value="default">{t('fontPack.preset.system.name')}</option>
                      {CACHE_LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </label>

                  <label className={css.chField}>
                    <span>{t('prompts.headers.temperature')}</span>
                    <input
                      className={css.promptSelect}
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={tempDraft}
                      placeholder={t('fontPack.preset.system.name')}
                      onChange={(e) => { setTempDraft(e.target.value) }}
                    />
                  </label>

                  <label className={css.chField}>
                    <span>{t('prompts.headers.maxTokens')}</span>
                    <input
                      className={css.promptSelect}
                      type="number"
                      step="1024"
                      min="256"
                      value={maxTokDraft}
                      placeholder="32768"
                      onChange={(e) => { setMaxTokDraft(e.target.value) }}
                    />
                  </label>
                </div>

                <div className={css.ctrlRulesFoot}>
                  <button
                    type="button"
                    className={css.ctrlBtnDanger}
                    disabled={busy}
                    onClick={() => { void persistConfig(EMPTY_CONFIG) }}
                  >
                    {t('prompts.headers.resetAll')}
                  </button>
                  <button
                    type="button"
                    className={css.bindButton}
                    disabled={busy}
                    onClick={applyGatewayParams}
                  >
                    {t('prompts.headers.saveAll')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Add Custom System Prompt Section */}
      <Modal
        open={newSectionModal !== null}
        onClose={() => { if (!busy) setNewSectionModal(null) }}
        title={t('prompts.sec.addCustom')}
        closeLabel={t('notice.dismiss')}
        footer={newSectionModal !== null ? (
          <>
            <Button variant="outline" disabled={busy} onClick={() => { setNewSectionModal(null) }}>
              {t('skills.modal.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={busy || newSectionModal.name.trim() === '' || newSectionModal.text.trim() === ''}
              onClick={() => {
                const parsedOrder = Number(newSectionModal.order)
                const nextCustom = [
                  ...cfg.customSections,
                  {
                    id: `csec-${String(Date.now())}`,
                    name: newSectionModal.name.trim(),
                    order: Number.isFinite(parsedOrder) ? parsedOrder : 10150,
                    text: newSectionModal.text,
                    enabled: true,
                  },
                ]
                setNewSectionModal(null)
                void persistConfig({ ...cfg, customSections: nextCustom })
              }}
            >
              {t('skills.modal.save')}
            </Button>
          </>
        ) : undefined}
      >
        {newSectionModal !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label className={css.chField}>
              <span>{t('skills.modal.name')}</span>
              <input
                data-modal-autofocus
                className={css.bindInput}
                value={newSectionModal.name}
                placeholder={t('prompts.sec.namePh')}
                onChange={(e) => { setNewSectionModal({ ...newSectionModal, name: e.target.value }) }}
              />
            </label>
            <label className={css.chField}>
              <span>{t('prompts.sec.orderLabel', { n: newSectionModal.order })}</span>
              <input
                className={css.bindInput}
                type="number"
                value={newSectionModal.order}
                onChange={(e) => { setNewSectionModal({ ...newSectionModal, order: e.target.value }) }}
              />
            </label>
            <label className={css.chField}>
              <span>{t('skills.modal.body')}</span>
              <textarea
                className={css.ctrlModalTextarea}
                rows={8}
                value={newSectionModal.text}
                placeholder={t('prompts.sec.textPh')}
                onChange={(e) => { setNewSectionModal({ ...newSectionModal, text: e.target.value }) }}
              />
            </label>
          </div>
        )}
      </Modal>

      {/* Modal: Add Custom Pre-Step Implicit Injection or Runtime Context */}
      <Modal
        open={newImplicitModal !== null}
        onClose={() => { if (!busy) setNewImplicitModal(null) }}
        title={newImplicitModal?.kind === 'context' ? t('prompts.imp.addContext') : t('prompts.imp.addPreStep')}
        closeLabel={t('notice.dismiss')}
        footer={newImplicitModal !== null ? (
          <>
            <Button variant="outline" disabled={busy} onClick={() => { setNewImplicitModal(null) }}>
              {t('skills.modal.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={busy || newImplicitModal.draftTitle.trim() === '' || newImplicitModal.text.trim() === ''}
              onClick={() => {
                if (newImplicitModal.kind === 'context') {
                  const nextContexts = [
                    ...cfg.customContexts,
                    {
                      id: `cctx-${String(Date.now())}`,
                      name: newImplicitModal.draftTitle.trim(),
                      order: 250,
                      text: newImplicitModal.text,
                      enabled: true,
                    },
                  ]
                  setNewImplicitModal(null)
                  void persistConfig({ ...cfg, customContexts: nextContexts })
                } else {
                  const nextInj = [
                    ...cfg.customPreStepInjections,
                    {
                      id: `cinj-${String(Date.now())}`,
                      label: newImplicitModal.draftTitle.trim(),
                      placement: newImplicitModal.placement,
                      text: newImplicitModal.text,
                      enabled: true,
                    },
                  ]
                  setNewImplicitModal(null)
                  void persistConfig({ ...cfg, customPreStepInjections: nextInj })
                }
              }}
            >
              {t('skills.modal.save')}
            </Button>
          </>
        ) : undefined}
      >
        {newImplicitModal !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label className={css.chField}>
              <span>{t('skills.modal.name')}</span>
              <input
                data-modal-autofocus
                className={css.bindInput}
                value={newImplicitModal.draftTitle}
                placeholder={t('prompts.imp.labelPh')}
                onChange={(e) => { setNewImplicitModal({ ...newImplicitModal, draftTitle: e.target.value }) }}
              />
            </label>
            {newImplicitModal.kind === 'pre-step' && (
              <label className={css.chField}>
                <span>{t('prompts.imp.afterUser')}</span>
                <select
                  className={css.bindInput}
                  value={newImplicitModal.placement}
                  onChange={(e) => {
                    const p = e.target.value === 'before-user' ? 'before-user' : 'after-user'
                    setNewImplicitModal({ ...newImplicitModal, placement: p })
                  }}
                >
                  <option value="before-user">{t('prompts.imp.beforeUser')}</option>
                  <option value="after-user">{t('prompts.imp.afterUser')}</option>
                </select>
              </label>
            )}
            <label className={css.chField}>
              <span>{t('skills.modal.body')}</span>
              <textarea
                className={css.ctrlModalTextarea}
                rows={8}
                value={newImplicitModal.text}
                placeholder={t('prompts.imp.textPh')}
                onChange={(e) => { setNewImplicitModal({ ...newImplicitModal, text: e.target.value }) }}
              />
            </label>
          </div>
        )}
      </Modal>
    </div>
  )
}
