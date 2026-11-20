/** XPeach Skill library and global AGENTS.md rules control center with multi-select batch operations. */
import { type JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Modal } from '@xpeach/xph-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type { XPeachOps, XPeachSkillItem, XPeachSkillsSnapshot } from './ops.ts'
import { XPeachMark, XPeachSkillsIcon } from './brand.tsx'
import css from './xpeach.module.css'

export { XPeachSkillsIcon }

/** Props injected into the XPeach Skills main panel. */
export type XPeachSkillsProps = PropsLocale<'xpeach.account'> & InjectFace<Pick<
  XPeachOps,
  | 'skillsList'
  | 'skillToggle'
  | 'skillBatchToggle'
  | 'skillSave'
  | 'skillDelete'
  | 'skillBatchDelete'
  | 'rulesSave'
  | 'importAssets'
>>

type Mode = 'library' | 'rules'
type FilterId = 'all' | 'user' | 'agents' | 'project' | 'enabled' | 'disabled'

interface SkillDraft {
  readonly dirName?: string
  readonly name: string
  readonly desc: string
  readonly when: string
  readonly body: string
}

const FILTER_IDS: readonly FilterId[] = ['all', 'user', 'agents', 'project', 'enabled', 'disabled']

function extractMarkdownBody(raw: string): string {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/u.exec(raw)
  return match !== null ? (match[1] ?? '').trim() : raw
}

function normalizeSkillSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '')
}

function shortenPath(raw: string): string {
  return raw.replace(/^\/Users\/[^/]+/u, '~').replace(/^\/home\/[^/]+/u, '~')
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
 * Render the XPeach Skills & Global Rules management page.
 * @param props - locale translator and injected XPeach operations.
 * @returns the skills control center element.
 */
export function XPeachSkillsPage({
  t, skillsList, skillToggle, skillBatchToggle, skillSave, skillDelete, skillBatchDelete, rulesSave, importAssets,
}: XPeachSkillsProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<XPeachSkillsSnapshot | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('library')
  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [rulesDraft, setRulesDraft] = useState('')
  const [modalDraft, setModalDraft] = useState<SkillDraft | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<XPeachSkillItem | null>(null)
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false)

  const reload = useCallback((): void => {
    setLoading(true)
    void skillsList().then((snap) => {
      setSnapshot(snap)
      setRulesDraft(snap.rulesContent)
      setLoading(false)
    }).catch((cause: unknown) => {
      setErr(cause instanceof Error ? cause.message : String(cause))
      setLoading(false)
    })
  }, [skillsList])

  useEffect(() => {
    reload()
  }, [reload])

  const skills = snapshot?.skills ?? []
  const enabledCount = useMemo(() => skills.filter(s => s.enabled).length, [skills])
  const hasRules = (snapshot?.rulesContent.trim().length ?? 0) > 0

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return skills.filter((item) => {
      if (filter === 'user' && item.source !== 'user') return false
      if (filter === 'agents' && item.source !== 'agents') return false
      if (filter === 'project' && item.source !== 'project') return false
      if (filter === 'enabled' && !item.enabled) return false
      if (filter === 'disabled' && item.enabled) return false
      if (q === '') return true
      return (
        item.name.toLowerCase().includes(q)
        || item.description.toLowerCase().includes(q)
        || (item.whenToUse?.toLowerCase().includes(q) ?? false)
        || item.dirName.toLowerCase().includes(q)
      )
    })
  }, [skills, filter, query])

  const allFilteredSelected = filtered.length > 0 && filtered.every(item => selectedIds.has(item.id))
  const selectedItems = useMemo(
    () => skills.filter(item => selectedIds.has(item.id)),
    [skills, selectedIds],
  )
  const selectedUserItems = useMemo(
    () => selectedItems.filter(item => item.source === 'user'),
    [selectedItems],
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

  const doImportLocal = async (): Promise<void> => {
    setBusy(true); setBanner(null); setErr(null)
    try {
      const res = await importAssets({ mcp: false, skills: true, prompts: true })
      if ('error' in res) {
        setErr(res.error)
      } else {
        const snap = await skillsList()
        setSnapshot(snap)
        setRulesDraft(snap.rulesContent)
        setBanner(t('skills.act.imported', { skills: String(res.skills), prompts: String(res.prompts) }))
      }
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const doToggle = async (item: XPeachSkillItem): Promise<void> => {
    setErr(null)
    try {
      const snap = await skillToggle({
        dirName: item.dirName,
        name: item.name,
        enabled: !item.enabled,
      })
      setSnapshot(snap)
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const doBatchToggle = async (enabled: boolean): Promise<void> => {
    if (selectedItems.length === 0) return
    setBusy(true); setErr(null); setBanner(null)
    try {
      if (skillBatchToggle !== undefined) {
        const snap = await skillBatchToggle({
          items: selectedItems.map(item => ({ dirName: item.dirName, name: item.name })),
          enabled,
        })
        setSnapshot(snap)
      } else {
        let latest: XPeachSkillsSnapshot | undefined
        for (const item of selectedItems) {
          latest = await skillToggle({ dirName: item.dirName, name: item.name, enabled })
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
    if (selectedUserItems.length === 0) return
    setBusy(true); setErr(null); setBanner(null)
    try {
      if (skillBatchDelete !== undefined) {
        const snap = await skillBatchDelete({ dirNames: selectedUserItems.map(i => i.dirName) })
        setSnapshot(snap)
      } else {
        let latest: XPeachSkillsSnapshot | undefined
        for (const item of selectedUserItems) {
          latest = await skillDelete({ dirName: item.dirName })
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

  const doDelete = async (item: XPeachSkillItem): Promise<void> => {
    setConfirmDelete(null)
    setBusy(true); setErr(null); setBanner(null)
    try {
      const snap = await skillDelete({ dirName: item.dirName })
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

  const doSaveRules = async (): Promise<void> => {
    setBusy(true); setErr(null); setBanner(null)
    try {
      const snap = await rulesSave({ content: rulesDraft })
      setSnapshot(snap)
      setRulesDraft(snap.rulesContent)
      setBanner(t('skills.rules.saved'))
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const doSaveSkill = async (): Promise<void> => {
    if (modalDraft === null) return
    const slug = normalizeSkillSlug(modalDraft.name)
    if (slug === '' || modalDraft.desc.trim() === '') return
    setBusy(true); setErr(null); setBanner(null)
    try {
      const snap = await skillSave({
        ...(modalDraft.dirName !== undefined ? { dirName: modalDraft.dirName } : {}),
        name: slug,
        description: modalDraft.desc.trim(),
        ...(modalDraft.when.trim() !== '' ? { whenToUse: modalDraft.when.trim() } : {}),
        content: modalDraft.body,
      })
      setSnapshot(snap)
      setModalDraft(null)
      setBanner(t('skills.modal.saved'))
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const openNewModal = (): void => {
    setModalDraft({ name: '', desc: '', when: '', body: '' })
  }

  const openEditModal = (item: XPeachSkillItem): void => {
    setModalDraft({
      dirName: item.dirName,
      name: item.name,
      desc: item.description,
      when: item.whenToUse ?? '',
      body: extractMarkdownBody(item.content),
    })
  }

  return (
    <div className={css.tabRoot}>
      <header className={css.tabHead} data-window-drag>
        <div className={css.pageHeadText}>
          <h2 className={css.pageTitle}>{t('skills.title')}</h2>
          <p className={css.pageIntro}>{t('skills.subtitle')}</p>
        </div>
        <div className={css.ctrlHeadActions}>
          <button
            type="button"
            className={css.bindGhost}
            disabled={busy}
            onClick={() => { void doImportLocal() }}
          >
            {busy ? t('skills.act.importing') : t('skills.act.import')}
          </button>
          <button
            type="button"
            className={css.bindButton}
            disabled={busy}
            onClick={openNewModal}
          >
            {t('skills.act.new')}
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
          <dt>{t('skills.stat.total')}</dt>
          <dd>{skills.length}</dd>
        </div>
        <div className={css.usageCell}>
          <dt>{t('skills.stat.enabled')}</dt>
          <dd>{enabledCount}</dd>
        </div>
        <div className={css.usageCell}>
          <dt>{t('skills.stat.rules')}</dt>
          <dd>{hasRules ? t('skills.stat.rulesConfigured') : t('skills.stat.rulesEmpty')}</dd>
        </div>
      </dl>

      {banner !== null && <p className={css.ctrlBannerOk}>{banner}</p>}
      {err !== null && <p className={css.bindError}>{err}</p>}

      <div className={css.ctrlToolbar}>
        <nav className={css.segRow}>
          <button
            type="button"
            className={mode === 'library' ? css.segOn : css.segOff}
            onClick={() => { setMode('library') }}
          >
            {t('skills.tab.library', { n: String(skills.length) })}
          </button>
          <button
            type="button"
            className={mode === 'rules' ? css.segOn : css.segOff}
            onClick={() => { setMode('rules') }}
          >
            {t('skills.tab.rules')}
          </button>
        </nav>

        {mode === 'library' && (
          <div className={css.ctrlFilterGroup}>
            {FILTER_IDS.map(fid => (
              <button
                key={fid}
                type="button"
                className={filter === fid ? css.groupChipOn : css.groupPickChip}
                onClick={() => { setFilter(fid) }}
              >
                {t(('skills.filter.' + fid) as 'skills.filter.all')}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === 'library' && (
        <>
          <div className={css.ctrlSearchRow}>
            <div className={css.ctrlSearchBox}>
              <span className={css.ctrlSearchIcon}><SearchSvg /></span>
              <input
                className={css.ctrlSearchInput}
                value={query}
                placeholder={t('skills.searchPh')}
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
                {selectedUserItems.length > 0 && (
                  <button
                    type="button"
                    className={css.ctrlBtnDanger}
                    disabled={busy}
                    onClick={() => { setConfirmBatchDelete(true) }}
                  >
                    {t('ctrl.batchDelete')}
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className={css.skelWrap} aria-busy="true" aria-label={t('status.loading')}>
              <div className={css.ctrlCardGrid}>
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className={css.skelCard}>
                    <i className={css.skelLine} style={{ width: '45%' }} />
                    <i className={css.skelLine} style={{ width: '85%' }} />
                    <i className={css.skelLine} style={{ width: '60%' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={css.emptyState}>
              <span className={css.emptyMark} aria-hidden="true"><XPeachMark size={26} /></span>
              <p className={css.sparkTitle}>{t('skills.empty.title')}</p>
              <p className={css.bindHint}>{t('skills.empty.hint')}</p>
            </div>
          ) : (
            <div className={css.ctrlCardGrid}>
              {filtered.map((item) => {
                const srcKey = ('skills.src.' + item.source) as 'skills.src.user'
                const isSelected = selectedIds.has(item.id)
                return (
                  <article
                    key={item.id}
                    className={css.ctrlCard}
                    data-disabled={!item.enabled}
                    data-selected={isSelected}
                  >
                    <div className={css.ctrlCardHead}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={t('ctrl.selectItem', { name: item.name })}
                        className={css.ctrlCheckBtn}
                        data-checked={isSelected}
                        onClick={() => { toggleSelectOne(item.id) }}
                      >
                        {isSelected && <CheckSvg />}
                      </button>
                      <code className={css.ctrlCardTitle}>{item.name}</code>
                      <span className={css.ctrlBadge}>{t(srcKey)}</span>
                      {!item.valid && (
                        <span className={css.ctrlBadgeWarn} title={item.reason}>
                          {t('skills.state.invalid')}
                        </span>
                      )}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.enabled}
                        aria-label={item.enabled ? t('skills.card.disable') : t('skills.card.enable')}
                        className={css.ctrlToggleSwitch}
                        data-on={item.enabled}
                        disabled={busy}
                        onClick={() => { void doToggle(item) }}
                      >
                        <span className={css.ctrlToggleThumb} />
                      </button>
                    </div>

                    <p className={css.ctrlCardDesc}>{item.description || '—'}</p>

                    {item.whenToUse !== undefined && item.whenToUse !== '' && (
                      <p className={css.ctrlCardHint}>
                        <b>{t('skills.whenToUse')}</b>
                        {item.whenToUse}
                      </p>
                    )}

                    <div className={css.ctrlCardFoot}>
                      <code className={css.ctrlPath} title={item.path}>{shortenPath(item.path)}</code>
                      <div className={css.ctrlCardActs}>
                        <button
                          type="button"
                          className={css.marketBtn}
                          disabled={busy}
                          onClick={() => { void doToggle(item) }}
                        >
                          {item.enabled ? t('skills.card.disable') : t('skills.card.enable')}
                        </button>
                        <button
                          type="button"
                          className={css.marketBtn}
                          onClick={() => { openEditModal(item) }}
                        >
                          {t('skills.card.edit')}
                        </button>
                        {item.source === 'user' && (
                          <button
                            type="button"
                            className={css.ctrlBtnDanger}
                            disabled={busy}
                            onClick={() => { setConfirmDelete(item) }}
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
          )}
        </>
      )}

      {mode === 'rules' && (
        <section className={css.ctrlRulesBox}>
          <div className={css.ctrlRulesHead}>
            <div>
              <h3 className={css.sparkTitle}>{t('skills.rules.title')}</h3>
              <p className={css.bindHint}>{t('skills.rules.hint')}</p>
            </div>
            {snapshot?.rulesPath !== undefined && snapshot.rulesPath !== '' && (
              <code className={css.keyMask} title={snapshot.rulesPath}>{shortenPath(snapshot.rulesPath)}</code>
            )}
          </div>
          <textarea
            className={css.ctrlRulesEditor}
            rows={18}
            value={rulesDraft}
            placeholder={t('skills.rules.placeholder')}
            onChange={(e) => { setRulesDraft(e.target.value) }}
          />
          <div className={css.ctrlRulesFoot}>
            <button
              type="button"
              className={css.bindButton}
              disabled={busy}
              onClick={() => { void doSaveRules() }}
            >
              {busy ? t('skills.rules.saving') : t('skills.rules.save')}
            </button>
          </div>
        </section>
      )}

      <Modal
        open={modalDraft !== null}
        onClose={() => { if (!busy) setModalDraft(null) }}
        title={modalDraft?.dirName !== undefined
          ? t('skills.modal.editTitle', { name: modalDraft.name })
          : t('skills.modal.newTitle')}
        closeLabel={t('notice.dismiss')}
        footer={modalDraft !== null ? (
          <>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => { setModalDraft(null) }}
            >
              {t('skills.modal.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={busy || normalizeSkillSlug(modalDraft.name) === '' || modalDraft.desc.trim() === ''}
              onClick={() => { void doSaveSkill() }}
            >
              {busy ? t('skills.modal.saving') : t('skills.modal.save')}
            </Button>
          </>
        ) : undefined}
      >
        {modalDraft !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label className={css.chField}>
              <span>{t('skills.modal.name')}</span>
              <input
                data-modal-autofocus
                className={css.bindInput}
                value={modalDraft.name}
                placeholder={t('skills.modal.namePh')}
                onChange={(e) => { setModalDraft({ ...modalDraft, name: e.target.value }) }}
              />
              {normalizeSkillSlug(modalDraft.name) !== '' && (
                <span className={css.onbHint}>
                  {t('skills.modal.normalized', { name: normalizeSkillSlug(modalDraft.name) })}
                </span>
              )}
            </label>

            <label className={css.chField}>
              <span>{t('skills.modal.desc')}</span>
              <input
                className={css.bindInput}
                value={modalDraft.desc}
                placeholder={t('skills.modal.descPh')}
                onChange={(e) => { setModalDraft({ ...modalDraft, desc: e.target.value }) }}
              />
            </label>

            <label className={css.chField}>
              <span>{t('skills.modal.when')}</span>
              <input
                className={css.bindInput}
                value={modalDraft.when}
                placeholder={t('skills.modal.whenPh')}
                onChange={(e) => { setModalDraft({ ...modalDraft, when: e.target.value }) }}
              />
            </label>

            <label className={css.chField}>
              <span>{t('skills.modal.body')}</span>
              <textarea
                className={css.ctrlModalTextarea}
                rows={12}
                value={modalDraft.body}
                placeholder={t('skills.modal.bodyPh')}
                onChange={(e) => { setModalDraft({ ...modalDraft, body: e.target.value }) }}
              />
            </label>
          </div>
        )}
      </Modal>

      {confirmDelete !== null && (
        <Modal
          open
          onClose={() => { if (!busy) setConfirmDelete(null) }}
          title={t('skills.card.delete')}
          description={t('skills.card.deleteConfirm', { name: confirmDelete.name })}
          closeLabel={t('notice.dismiss')}
          footer={(
            <>
              <Button variant="outline" disabled={busy} onClick={() => { setConfirmDelete(null) }}>
                {t('skills.modal.cancel')}
              </Button>
              <Button
                variant="outline"
                className={css.btnDanger}
                disabled={busy}
                onClick={() => { void doDelete(confirmDelete) }}
              >
                {t('skills.card.delete')}
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
          description={t('ctrl.batchDeleteConfirm', { n: String(selectedUserItems.length) })}
          closeLabel={t('notice.dismiss')}
          footer={(
            <>
              <Button variant="outline" disabled={busy} onClick={() => { setConfirmBatchDelete(false) }}>
                {t('skills.modal.cancel')}
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
