/** XPeach MCP Server control center: STDIO and Streamable HTTP servers, multi-select batch ops, and JSON import. */
import { type JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Modal } from '@xpeach/xph-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type { XPeachMcpItem, XPeachMcpSaveRequest, XPeachMcpSnapshot, XPeachOps } from './ops.ts'
import { XPeachMark, XPeachMcpIcon } from './brand.tsx'
import css from './xpeach.module.css'

export { XPeachMcpIcon }

/** Props injected into the XPeach MCP main panel. */
export type XPeachMcpProps = PropsLocale<'xpeach.account'> & InjectFace<Pick<
  XPeachOps,
  | 'mcpList'
  | 'mcpToggle'
  | 'mcpBatchToggle'
  | 'mcpSave'
  | 'mcpDelete'
  | 'mcpBatchDelete'
  | 'importAssets'
>>

type FilterId = 'all' | 'stdio' | 'http' | 'enabled' | 'disabled'
type ModalMode = 'form' | 'json'

interface McpDraft {
  readonly id?: string
  readonly serverName: string
  readonly transportType: 'stdio' | 'streamable-http'
  readonly command: string
  readonly argsRaw: string
  readonly envRaw: string
  readonly url: string
  readonly headersRaw: string
  readonly disabled: boolean
}

const FILTER_IDS: readonly FilterId[] = ['all', 'stdio', 'http', 'enabled', 'disabled']

function shortenPath(raw: string): string {
  return raw.replace(/^\/Users\/[^/]+/u, '~').replace(/^\/home\/[^/]+/u, '~')
}

function parseArgsInput(raw: string): string[] {
  const trimmed = raw.trim()
  if (trimmed === '') return []
  if (trimmed.includes('\n')) {
    return trimmed.split(/\r?\n/u).map(s => s.trim()).filter(Boolean)
  }
  return trimmed.split(/\s+/u).filter(Boolean)
}

function parseKeyValLines(raw: string, separator: '=' | ':'): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf(separator)
    if (idx <= 0) continue
    const k = trimmed.slice(0, idx).trim()
    const v = trimmed.slice(idx + 1).trim()
    if (k !== '') out[k] = v
  }
  return out
}

function formatKeyValLines(rec: Readonly<Record<string, string>> | undefined, sep: '=' | ': '): string {
  if (rec === undefined) return ''
  return Object.entries(rec).map(([k, v]) => `${k}${sep}${v}`).join('\n')
}

function parseMcpJsonSnippet(raw: string, fallbackName: string): McpDraft | null {
  try {
    const parsedValue: unknown = JSON.parse(raw)
    if (typeof parsedValue !== 'object' || parsedValue === null || Array.isArray(parsedValue)) return null
    const parsed = parsedValue as Record<string, unknown>

    let candidateName = fallbackName.trim()
    let spec: Record<string, unknown> = parsed

    const rawContainer = parsed['mcpServers'] ?? parsed['servers']
    if (typeof rawContainer === 'object' && rawContainer !== null && !Array.isArray(rawContainer)) {
      const container = rawContainer as Record<string, unknown>
      const firstEntry = Object.entries(container)[0]
      if (firstEntry === undefined) return null
      candidateName = firstEntry[0]
      if (typeof firstEntry[1] !== 'object' || firstEntry[1] === null) return null
      spec = firstEntry[1] as Record<string, unknown>
    } else if (typeof parsed['command'] !== 'string' && typeof parsed['url'] !== 'string') {
      const firstEntry = Object.entries(parsed)[0]
      if (
        firstEntry !== undefined
        && typeof firstEntry[1] === 'object'
        && firstEntry[1] !== null
        && !Array.isArray(firstEntry[1])
      ) {
        const inner = firstEntry[1] as Record<string, unknown>
        if (typeof inner['command'] === 'string' || typeof inner['url'] === 'string') {
          candidateName = firstEntry[0]
          spec = inner
        }
      }
    }

    const command = typeof spec['command'] === 'string' ? spec['command'].trim() : ''
    const url = typeof spec['url'] === 'string'
      ? spec['url'].trim()
      : typeof spec['httpUrl'] === 'string'
        ? spec['httpUrl'].trim()
        : ''
    if (command === '' && url === '') return null

    const transportType: 'stdio' | 'streamable-http' = url !== '' && command === '' ? 'streamable-http' : 'stdio'
    const argsList = Array.isArray(spec['args'])
      ? spec['args'].filter((a): a is string => typeof a === 'string')
      : []
    const envObj: Record<string, string> = {}
    if (typeof spec['env'] === 'object' && spec['env'] !== null && !Array.isArray(spec['env'])) {
      for (const [k, v] of Object.entries(spec['env'] as Record<string, unknown>)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          envObj[k] = String(v)
        }
      }
    }
    const headersObj: Record<string, string> = {}
    if (typeof spec['headers'] === 'object' && spec['headers'] !== null && !Array.isArray(spec['headers'])) {
      for (const [k, v] of Object.entries(spec['headers'] as Record<string, unknown>)) {
        if (typeof v === 'string') headersObj[k] = v
      }
    }

    return {
      serverName: candidateName || 'mcp-server',
      transportType,
      command,
      argsRaw: argsList.join('\n'),
      envRaw: formatKeyValLines(envObj, '='),
      url,
      headersRaw: formatKeyValLines(headersObj, ': '),
      disabled: spec['disabled'] === true,
    }
  } catch (_jsonErr) {
    return null
  }
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
 * Render the XPeach MCP Server management page.
 * @param props - locale translator and injected XPeach operations.
 * @returns the MCP control center element.
 */
export function XPeachMcpPage({
  t, mcpList, mcpToggle, mcpBatchToggle, mcpSave, mcpDelete, mcpBatchDelete, importAssets,
}: XPeachMcpProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<XPeachMcpSnapshot | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const [expandedTools, setExpandedTools] = useState<ReadonlySet<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [modalDraft, setModalDraft] = useState<McpDraft | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>('form')
  const [jsonInput, setJsonInput] = useState('')
  const [jsonErr, setJsonErr] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<XPeachMcpItem | null>(null)
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false)

  const reload = useCallback((): void => {
    setLoading(true)
    void mcpList().then((snap) => {
      setSnapshot(snap)
      setLoading(false)
    }).catch((cause: unknown) => {
      setErr(cause instanceof Error ? cause.message : String(cause))
      setLoading(false)
    })
  }, [mcpList])

  useEffect(() => {
    reload()
  }, [reload])

  const servers = snapshot?.servers ?? []
  const enabledCount = useMemo(() => servers.filter(s => !s.disabled).length, [servers])
  const totalTools = useMemo(() => servers.reduce((acc, s) => acc + s.toolCount, 0), [servers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return servers.filter((item) => {
      if (filter === 'stdio' && item.transportType !== 'stdio') return false
      if (filter === 'http' && item.transportType !== 'streamable-http') return false
      if (filter === 'enabled' && item.disabled) return false
      if (filter === 'disabled' && !item.disabled) return false
      if (q === '') return true
      return (
        item.serverName.toLowerCase().includes(q)
        || (item.command?.toLowerCase().includes(q) ?? false)
        || (item.url?.toLowerCase().includes(q) ?? false)
        || item.tools.some(tool => tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q))
      )
    })
  }, [servers, filter, query])

  const allFilteredSelected = filtered.length > 0 && filtered.every(item => selectedIds.has(item.id))
  const selectedItems = useMemo(
    () => servers.filter(item => selectedIds.has(item.id)),
    [servers, selectedIds],
  )

  const toggleSelectOne = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllFiltered = (): void => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const item of filtered) next.delete(item.id)
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const item of filtered) next.add(item.id)
        return next
      })
    }
  }

  const invertFilteredSelection = (): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const item of filtered) {
        if (next.has(item.id)) next.delete(item.id)
        else next.add(item.id)
      }
      return next
    })
  }

  const toggleExpandTools = (id: string): void => {
    setExpandedTools((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const doSyncLocal = async (): Promise<void> => {
    setBusy(true); setBanner(null); setErr(null)
    try {
      const res = await importAssets({ mcp: true, skills: false, prompts: false })
      if ('error' in res) {
        setErr(res.error)
      } else {
        const snap = await mcpList()
        setSnapshot(snap)
        setBanner(t('mcp.act.synced', { n: String(res.mcp) }))
      }
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const doToggle = async (item: XPeachMcpItem): Promise<void> => {
    setErr(null)
    try {
      const snap = await mcpToggle({ id: item.id, enabled: item.disabled })
      setSnapshot(snap)
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const doBatchToggle = async (enabled: boolean): Promise<void> => {
    if (selectedItems.length === 0) return
    setBusy(true); setErr(null); setBanner(null)
    try {
      if (mcpBatchToggle !== undefined) {
        const snap = await mcpBatchToggle({ ids: selectedItems.map(i => i.id), enabled })
        setSnapshot(snap)
      } else {
        let latest: XPeachMcpSnapshot | undefined
        for (const item of selectedItems) {
          latest = await mcpToggle({ id: item.id, enabled })
        }
        if (latest !== undefined) setSnapshot(latest)
      }
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const doBatchDelete = async (): Promise<void> => {
    setConfirmBatchDelete(false)
    if (selectedItems.length === 0) return
    setBusy(true); setErr(null); setBanner(null)
    try {
      if (mcpBatchDelete !== undefined) {
        const snap = await mcpBatchDelete({ ids: selectedItems.map(i => i.id) })
        setSnapshot(snap)
      } else {
        let latest: XPeachMcpSnapshot | undefined
        for (const item of selectedItems) {
          latest = await mcpDelete({ id: item.id })
        }
        if (latest !== undefined) setSnapshot(latest)
      }
      setSelectedIds(new Set())
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const doDelete = async (item: XPeachMcpItem): Promise<void> => {
    setConfirmDelete(null)
    setBusy(true); setErr(null); setBanner(null)
    try {
      const snap = await mcpDelete({ id: item.id })
      setSnapshot(snap)
      setSelectedIds((prev) => {
        if (!prev.has(item.id)) return prev
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const openAddModal = (): void => {
    setModalMode('form')
    setJsonInput('')
    setJsonErr(null)
    setModalDraft({
      serverName: '',
      transportType: 'stdio',
      command: '',
      argsRaw: '',
      envRaw: '',
      url: '',
      headersRaw: '',
      disabled: false,
    })
  }

  const openEditModal = (item: XPeachMcpItem): void => {
    setModalMode('form')
    setJsonInput('')
    setJsonErr(null)
    setModalDraft({
      id: item.id,
      serverName: item.serverName,
      transportType: item.transportType,
      command: item.command ?? '',
      argsRaw: (item.args ?? []).join('\n'),
      envRaw: formatKeyValLines(item.env, '='),
      url: item.url ?? '',
      headersRaw: formatKeyValLines(item.headers, ': '),
      disabled: item.disabled,
    })
  }

  const applyJsonToDraft = (): McpDraft | null => {
    if (modalDraft === null) return null
    const parsed = parseMcpJsonSnippet(jsonInput, modalDraft.serverName)
    if (parsed === null) {
      setJsonErr(t('mcp.modal.jsonError'))
      return null
    }
    const merged: McpDraft = {
      ...(modalDraft.id !== undefined ? { id: modalDraft.id } : {}),
      ...parsed,
    }
    setJsonErr(null)
    setModalDraft(merged)
    setModalMode('form')
    return merged
  }

  const doSaveServer = async (): Promise<void> => {
    if (modalDraft === null) return
    const activeDraft = modalMode === 'json' ? applyJsonToDraft() : modalDraft
    if (activeDraft === null) return

    const cleanName = activeDraft.serverName.trim()
    if (cleanName === '') return
    if (activeDraft.transportType === 'stdio' && activeDraft.command.trim() === '') return
    if (activeDraft.transportType === 'streamable-http' && activeDraft.url.trim() === '') return

    const req: XPeachMcpSaveRequest = activeDraft.transportType === 'streamable-http'
      ? {
        ...(activeDraft.id !== undefined ? { id: activeDraft.id } : {}),
        serverName: cleanName,
        transportType: 'streamable-http',
        url: activeDraft.url.trim(),
        headers: parseKeyValLines(activeDraft.headersRaw, ':'),
        disabled: activeDraft.disabled,
      }
      : {
        ...(activeDraft.id !== undefined ? { id: activeDraft.id } : {}),
        serverName: cleanName,
        transportType: 'stdio',
        command: activeDraft.command.trim(),
        args: parseArgsInput(activeDraft.argsRaw),
        env: parseKeyValLines(activeDraft.envRaw, '='),
        disabled: activeDraft.disabled,
      }

    setBusy(true); setErr(null); setBanner(null)
    try {
      const snap = await mcpSave(req)
      setSnapshot(snap)
      setModalDraft(null)
      setBanner(t('mcp.modal.saved'))
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const canSaveModal = useMemo(() => {
    if (modalDraft === null) return false
    if (modalMode === 'json') return jsonInput.trim() !== ''
    if (modalDraft.serverName.trim() === '') return false
    return modalDraft.transportType === 'streamable-http'
      ? modalDraft.url.trim() !== ''
      : modalDraft.command.trim() !== ''
  }, [modalDraft, modalMode, jsonInput])

  return (
    <div className={css.tabRoot}>
      <header className={css.tabHead} data-window-drag>
        <div className={css.pageHeadText}>
          <h2 className={css.pageTitle}>{t('mcp.title')}</h2>
          <p className={css.pageIntro}>
            <span>{t('mcp.subtitle')}</span>
            {snapshot?.patchPath !== undefined && snapshot.patchPath !== '' && (
              <code className={css.keyMask} title={snapshot.patchPath}>{shortenPath(snapshot.patchPath)}</code>
            )}
          </p>
        </div>
        <div className={css.ctrlHeadActions}>
          <button
            type="button"
            className={css.bindGhost}
            disabled={busy}
            onClick={() => { void doSyncLocal() }}
          >
            {busy ? t('mcp.act.syncing') : t('mcp.act.sync')}
          </button>
          <button
            type="button"
            className={css.bindButton}
            disabled={busy}
            onClick={openAddModal}
          >
            {t('mcp.act.add')}
          </button>
          <button
            type="button"
            className={css.iconButton}
            onClick={reload}
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
          <dt>{t('mcp.stat.total')}</dt>
          <dd>{servers.length}</dd>
        </div>
        <div className={css.usageCell}>
          <dt>{t('mcp.stat.active')}</dt>
          <dd>{enabledCount}</dd>
        </div>
        <div className={css.usageCell}>
          <dt>{t('mcp.stat.tools')}</dt>
          <dd>{totalTools}</dd>
        </div>
      </dl>

      {banner !== null && <p className={css.ctrlBannerOk}>{banner}</p>}
      {err !== null && <p className={css.bindError}>{err}</p>}

      <div className={css.ctrlToolbar}>
        <div className={css.ctrlFilterGroup}>
          {FILTER_IDS.map(fid => (
            <button
              key={fid}
              type="button"
              className={filter === fid ? css.groupChipOn : css.groupPickChip}
              onClick={() => { setFilter(fid) }}
            >
              {t(('mcp.filter.' + fid) as 'mcp.filter.all')}
            </button>
          ))}
        </div>

        <div className={css.ctrlSearchRow} style={{ flex: '1 1 320px' }}>
          <div className={css.ctrlSearchBox}>
            <span className={css.ctrlSearchIcon}><SearchSvg /></span>
            <input
              className={css.ctrlSearchInput}
              value={query}
              placeholder={t('mcp.searchPh')}
              onChange={(e) => { setQuery(e.target.value) }}
            />
            {query.length > 0 && (
              <button
                type="button"
                className={css.ctrlSearchClear}
                aria-label={t('ctrl.searchClear')}
                onClick={() => { setQuery('') }}
              >
                ×
              </button>
            )}
          </div>
          {filtered.length > 0 && (
            <>
              <button
                type="button"
                className={allFilteredSelected ? css.groupChipOn : css.groupPickChip}
                disabled={busy}
                onClick={toggleSelectAllFiltered}
              >
                {allFilteredSelected
                  ? t('ctrl.unselectAll')
                  : t('ctrl.selectAll', { n: String(filtered.length) })}
              </button>
              <button
                type="button"
                className={css.groupPickChip}
                disabled={busy}
                onClick={invertFilteredSelection}
              >
                {t('ctrl.invertSelect')}
              </button>
            </>
          )}
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className={css.ctrlBatchBar}>
          <div className={css.ctrlBatchLeft}>
            <span className={css.ctrlBatchCount}>
              {t('ctrl.selectedCount', { n: String(selectedItems.length) })}
            </span>
            <button
              type="button"
              className={css.marketBtn}
              disabled={busy}
              onClick={() => { setSelectedIds(new Set()) }}
            >
              {t('ctrl.unselectAll')}
            </button>
          </div>
          <div className={css.ctrlBatchRight}>
            <button
              type="button"
              className={css.bindGhost}
              disabled={busy}
              onClick={() => { void doBatchToggle(true) }}
            >
              {t('ctrl.batchEnable')}
            </button>
            <button
              type="button"
              className={css.bindGhost}
              disabled={busy}
              onClick={() => { void doBatchToggle(false) }}
            >
              {t('ctrl.batchDisable')}
            </button>
            <button
              type="button"
              className={css.ctrlBtnDanger}
              disabled={busy}
              onClick={() => { setConfirmBatchDelete(true) }}
            >
              {t('ctrl.batchDelete')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={css.skelWrap} aria-busy="true" aria-label={t('status.loading')}>
          <div className={css.ctrlCardGrid}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={css.skelCard}>
                <i className={css.skelLine} style={{ width: '40%' }} />
                <i className={css.skelLine} style={{ width: '80%' }} />
                <i className={css.skelLine} style={{ width: '55%' }} />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className={css.emptyState}>
          <span className={css.emptyMark} aria-hidden="true"><XPeachMark size={26} /></span>
          <p className={css.sparkTitle}>{t('mcp.empty.title')}</p>
          <p className={css.bindHint}>{t('mcp.empty.hint')}</p>
        </div>
      ) : (
        <div className={css.ctrlCardGrid}>
          {filtered.map((item) => {
            const isOpen = expandedTools.has(item.id)
            const isSelected = selectedIds.has(item.id)
            const cmdPreview = item.transportType === 'streamable-http'
              ? (item.url ?? '—')
              : [item.command ?? '', ...(item.args ?? [])].filter(Boolean).join(' ')
            const envKeys = Object.keys(item.env ?? {})
            const headerKeys = Object.keys(item.headers ?? {})

            return (
              <article
                key={item.id}
                className={css.ctrlCard}
                data-disabled={item.disabled}
                data-selected={isSelected}
              >
                <div className={css.ctrlCardHead}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={t('ctrl.selectItem', { name: item.serverName })}
                    className={css.ctrlCheckBtn}
                    data-checked={isSelected}
                    onClick={() => { toggleSelectOne(item.id) }}
                  >
                    {isSelected && <CheckSvg />}
                  </button>
                  <code className={css.ctrlCardTitle}>{item.serverName}</code>
                  <span className={css.ctrlBadge}>
                    {item.transportType === 'streamable-http' ? t('mcp.transport.http') : t('mcp.transport.stdio')}
                  </span>
                  <span className={item.disabled ? css.ctrlStatusOff : css.ctrlStatusOn} style={{ marginLeft: 0 }}>
                    {item.status === 'active'
                      ? t('mcp.status.active', { n: String(item.toolCount) })
                      : item.status === 'disabled'
                        ? t('mcp.status.disabled')
                        : t('mcp.status.configured')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!item.disabled}
                    aria-label={item.disabled ? t('mcp.card.enable') : t('mcp.card.disable')}
                    className={css.ctrlToggleSwitch}
                    data-on={!item.disabled}
                    disabled={busy}
                    onClick={() => { void doToggle(item) }}
                  >
                    <span className={css.ctrlToggleThumb} />
                  </button>
                </div>

                <div className={css.ctrlCodeBlock}>
                  <span className={css.ctrlCodeLabel}>
                    {item.transportType === 'streamable-http' ? t('mcp.card.url') : t('mcp.card.command')}
                  </span>
                  <code className={css.ctrlCodeText} title={cmdPreview}>{cmdPreview || '—'}</code>
                </div>

                {envKeys.length > 0 && (
                  <div className={css.ctrlMetaChips}>
                    <span className={css.ctrlCodeLabel}>{t('mcp.card.env')}:</span>
                    {envKeys.map(k => (
                      <code key={k} className={css.keyMask}>{k}=•••</code>
                    ))}
                  </div>
                )}

                {headerKeys.length > 0 && (
                  <div className={css.ctrlMetaChips}>
                    <span className={css.ctrlCodeLabel}>{t('mcp.card.headers')}:</span>
                    {headerKeys.map(k => (
                      <code key={k} className={css.keyMask}>{k}: •••</code>
                    ))}
                  </div>
                )}

                {isOpen && (
                  <div className={css.ctrlToolDrawer}>
                    {item.tools.length === 0 ? (
                      <p className={css.bindHint}>{t('mcp.card.noTools')}</p>
                    ) : (
                      <ul className={css.ctrlToolList}>
                        {item.tools.map(tool => (
                          <li key={tool.name} className={css.ctrlToolRow}>
                            <code className={css.ctrlToolName}>{tool.name}</code>
                            {tool.description !== '' && (
                              <span className={css.ctrlToolDesc}>{tool.description}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className={css.ctrlCardFoot}>
                  <button
                    type="button"
                    className={css.groupPickChip}
                    onClick={() => { toggleExpandTools(item.id) }}
                  >
                    {t('mcp.card.toolsToggle', { n: String(item.toolCount) })}
                  </button>

                  <div className={css.ctrlCardActs}>
                    <button
                      type="button"
                      className={css.marketBtn}
                      disabled={busy}
                      onClick={() => { void doToggle(item) }}
                    >
                      {item.disabled ? t('mcp.card.enable') : t('mcp.card.disable')}
                    </button>
                    <button
                      type="button"
                      className={css.marketBtn}
                      onClick={() => { openEditModal(item) }}
                    >
                      {t('mcp.card.edit')}
                    </button>
                    <button
                      type="button"
                      className={css.ctrlBtnDanger}
                      disabled={busy}
                      onClick={() => { setConfirmDelete(item) }}
                    >
                      {t('mcp.card.delete')}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={modalDraft !== null}
        onClose={() => { if (!busy) setModalDraft(null) }}
        title={modalDraft?.id !== undefined
          ? t('mcp.modal.editTitle', { name: modalDraft.serverName })
          : t('mcp.modal.addTitle')}
        closeLabel={t('notice.dismiss')}
        footer={modalDraft !== null ? (
          <>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => { setModalDraft(null) }}
            >
              {t('mcp.modal.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={busy || !canSaveModal}
              onClick={() => { void doSaveServer() }}
            >
              {busy ? t('mcp.modal.saving') : t('mcp.modal.save')}
            </Button>
          </>
        ) : undefined}
      >
        {modalDraft !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <nav className={css.segRow}>
              <button
                type="button"
                className={modalMode === 'form' ? css.segOn : css.segOff}
                onClick={() => { setModalMode('form') }}
              >
                {t('mcp.modal.modeForm')}
              </button>
              <button
                type="button"
                className={modalMode === 'json' ? css.segOn : css.segOff}
                onClick={() => { setModalMode('json') }}
              >
                {t('mcp.modal.modeJson')}
              </button>
            </nav>

            {modalMode === 'json' ? (
              <>
                <label className={css.chField}>
                  <span>{t('mcp.modal.jsonLabel')}</span>
                  <span className={css.onbHint}>{t('mcp.modal.jsonHint')}</span>
                  <textarea
                    data-modal-autofocus
                    className={css.ctrlModalTextarea}
                    rows={10}
                    value={jsonInput}
                    placeholder={t('mcp.modal.jsonPh')}
                    onChange={(e) => { setJsonInput(e.target.value); setJsonErr(null) }}
                  />
                </label>
                {jsonErr !== null && <p className={css.bindError}>{jsonErr}</p>}
                <div className={css.bindRow}>
                  <Button
                    variant="outline"
                    disabled={jsonInput.trim() === ''}
                    onClick={() => { applyJsonToDraft() }}
                  >
                    {t('mcp.modal.jsonParseBtn')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <label className={css.chField}>
                  <span>{t('mcp.modal.name')}</span>
                  <input
                    data-modal-autofocus
                    className={css.bindInput}
                    value={modalDraft.serverName}
                    placeholder={t('mcp.modal.namePh')}
                    onChange={(e) => { setModalDraft({ ...modalDraft, serverName: e.target.value }) }}
                  />
                </label>

                <label className={css.chField}>
                  <span>{t('mcp.modal.transport')}</span>
                  <select
                    className={css.bindInput}
                    value={modalDraft.transportType}
                    onChange={(e) => {
                      const next = e.target.value === 'streamable-http' ? 'streamable-http' : 'stdio'
                      setModalDraft({ ...modalDraft, transportType: next })
                    }}
                  >
                    <option value="stdio">{t('mcp.modal.transportStdio')}</option>
                    <option value="streamable-http">{t('mcp.modal.transportHttp')}</option>
                  </select>
                </label>

                {modalDraft.transportType === 'stdio' ? (
                  <>
                    <label className={css.chField}>
                      <span>{t('mcp.modal.command')}</span>
                      <input
                        className={css.bindInput}
                        value={modalDraft.command}
                        placeholder={t('mcp.modal.commandPh')}
                        onChange={(e) => { setModalDraft({ ...modalDraft, command: e.target.value }) }}
                      />
                    </label>
                    <label className={css.chField}>
                      <span>{t('mcp.modal.args')}</span>
                      <textarea
                        className={css.ctrlModalTextarea}
                        rows={4}
                        value={modalDraft.argsRaw}
                        placeholder={t('mcp.modal.argsPh')}
                        onChange={(e) => { setModalDraft({ ...modalDraft, argsRaw: e.target.value }) }}
                      />
                    </label>
                    <label className={css.chField}>
                      <span>{t('mcp.modal.env')}</span>
                      <textarea
                        className={css.ctrlModalTextarea}
                        rows={3}
                        value={modalDraft.envRaw}
                        placeholder={t('mcp.modal.envPh')}
                        onChange={(e) => { setModalDraft({ ...modalDraft, envRaw: e.target.value }) }}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className={css.chField}>
                      <span>{t('mcp.modal.url')}</span>
                      <input
                        className={css.bindInput}
                        value={modalDraft.url}
                        placeholder={t('mcp.modal.urlPh')}
                        onChange={(e) => { setModalDraft({ ...modalDraft, url: e.target.value }) }}
                      />
                    </label>
                    <label className={css.chField}>
                      <span>{t('mcp.modal.headers')}</span>
                      <textarea
                        className={css.ctrlModalTextarea}
                        rows={3}
                        value={modalDraft.headersRaw}
                        placeholder={t('mcp.modal.headersPh')}
                        onChange={(e) => { setModalDraft({ ...modalDraft, headersRaw: e.target.value }) }}
                      />
                    </label>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {confirmDelete !== null && (
        <Modal
          open
          onClose={() => { if (!busy) setConfirmDelete(null) }}
          title={t('mcp.card.delete')}
          description={t('mcp.card.deleteConfirm', { name: confirmDelete.serverName })}
          closeLabel={t('notice.dismiss')}
          footer={(
            <>
              <Button variant="outline" disabled={busy} onClick={() => { setConfirmDelete(null) }}>
                {t('mcp.modal.cancel')}
              </Button>
              <Button
                variant="outline"
                className={css.btnDanger}
                disabled={busy}
                onClick={() => { void doDelete(confirmDelete) }}
              >
                {t('mcp.card.delete')}
              </Button>
            </>
          )}
        />
      )}

      {confirmBatchDelete && (
        <Modal
          open
          onClose={() => { if (!busy) setConfirmBatchDelete(false) }}
          title={t('ctrl.batchDelete')}
          description={t('ctrl.batchDeleteConfirm', { n: String(selectedItems.length) })}
          closeLabel={t('notice.dismiss')}
          footer={(
            <>
              <Button variant="outline" disabled={busy} onClick={() => { setConfirmBatchDelete(false) }}>
                {t('mcp.modal.cancel')}
              </Button>
              <Button
                variant="outline"
                className={css.btnDanger}
                disabled={busy}
                onClick={() => { void doBatchDelete() }}
              >
                {t('ctrl.batchDelete')}
              </Button>
            </>
          )}
        />
      )}
    </div>
  )
}
