/** XPeach Skill library and global AGENTS.md rules control center. */
import { type JSX, useCallback, useEffect, useMemo, useState } from 'react'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type { XPeachOps, XPeachSkillItem, XPeachSkillsSnapshot } from './ops.ts'
import { XPeachMark } from './brand.tsx'
import css from './xpeach.module.css'

/** Props injected into the XPeach Skills main panel. */
export type XPeachSkillsProps = PropsLocale<'xpeach.account'> & InjectFace<XPeachOps>

type Mode = 'library' | 'rules'
type FilterId = 'all' | 'user' | 'agents' | 'enabled'

interface SkillDraft {
  readonly dirName?: string
  readonly name: string
  readonly desc: string
  readonly when: string
  readonly body: string
}

const FILTER_IDS: readonly FilterId[] = ['all', 'user', 'agents', 'enabled']

/** Strip YAML frontmatter from SKILL.md so the editor shows the clean Markdown body. */
function extractMarkdownBody(raw: string) {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/u.exec(raw)
  return match !== null ? (match[1] ?? '').trim() : raw
}

/** Normalize a skill name into lowercase kebab-case directory/identifier format. */
function normalizeSkillSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '')
}

/**
 * Decorative sidebar icon for the XPeach Skills panel.
 * @param props - sidebar icon size.
 * @returns SVG element.
 */
export function XPeachSkillsIcon({ size = 18 }: { readonly size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.25 4.25A1.75 1.75 0 0 1 5 2.5h5.25a1.5 1.5 0 0 1 1.5 1.5v10.25a.75.75 0 0 1-.75.75H5a1.75 1.75 0 0 1-1.75-1.75V4.25Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M6 6h3.5M6 8.75h2.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M14 5.5l.65 1.6 1.6.65-1.6.65L14 10l-.65-1.6-1.6-.65 1.6-.65L14 5.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * Render the XPeach Skills & Global Rules management page.
 * @param props - locale translator and injected XPeach operations.
 * @returns the skills control center element.
 */
export function XPeachSkillsPage({
  t, skillsList, skillToggle, skillSave, skillDelete, rulesSave, importAssets,
}: XPeachSkillsProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<XPeachSkillsSnapshot | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('library')
  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [rulesDraft, setRulesDraft] = useState('')
  const [modalDraft, setModalDraft] = useState<SkillDraft | null>(null)

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
      if (filter === 'enabled' && !item.enabled) return false
      if (q === '') return true
      return (
        item.name.toLowerCase().includes(q)
        || item.description.toLowerCase().includes(q)
        || (item.whenToUse?.toLowerCase().includes(q) ?? false)
        || item.dirName.toLowerCase().includes(q)
      )
    })
  }, [skills, filter, query])

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

  const doDelete = async (item: XPeachSkillItem): Promise<void> => {
    if (!window.confirm(t('skills.card.deleteConfirm', { name: item.name }))) return
    setBusy(true); setErr(null); setBanner(null)
    try {
      const snap = await skillDelete({ dirName: item.dirName })
      setSnapshot(snap)
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
      <header className={css.tabHead}>
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
          <input
            className={css.marketSearch}
            value={query}
            placeholder={t('skills.searchPh')}
            onChange={(e) => { setQuery(e.target.value) }}
          />

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
                return (
                  <article key={item.id} className={css.ctrlCard} data-disabled={!item.enabled}>
                    <div className={css.ctrlCardHead}>
                      <code className={css.ctrlCardTitle}>{item.name}</code>
                      <span className={css.ctrlBadge}>{t(srcKey)}</span>
                      {!item.valid && (
                        <span className={css.ctrlBadgeWarn} title={item.reason}>
                          {t('skills.state.invalid')}
                        </span>
                      )}
                      <span className={item.enabled ? css.ctrlStatusOn : css.ctrlStatusOff}>
                        {item.enabled ? t('skills.state.enabled') : t('skills.state.disabled')}
                      </span>
                    </div>

                    <p className={css.ctrlCardDesc}>{item.description || '—'}</p>

                    {item.whenToUse !== undefined && item.whenToUse !== '' && (
                      <p className={css.ctrlCardHint}>
                        <b>{t('skills.whenToUse')}</b>
                        {item.whenToUse}
                      </p>
                    )}

                    <div className={css.ctrlCardFoot}>
                      <code className={css.ctrlPath} title={item.path}>{item.path}</code>
                      <div className={css.ctrlCardActs}>
                        <button
                          type="button"
                          className={css.marketBtn}
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
                            onClick={() => { void doDelete(item) }}
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
              <code className={css.keyMask}>{snapshot.rulesPath}</code>
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

      {modalDraft !== null && (
        <div
          className={css.ctrlModalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label={modalDraft.dirName !== undefined
            ? t('skills.modal.editTitle', { name: modalDraft.name })
            : t('skills.modal.newTitle')}
          onClick={() => { if (!busy) setModalDraft(null) }}
        >
          <div className={css.ctrlModalCard} onClick={(e) => { e.stopPropagation() }}>
            <header className={css.ctrlModalHead}>
              <h3>
                {modalDraft.dirName !== undefined
                  ? t('skills.modal.editTitle', { name: modalDraft.name })
                  : t('skills.modal.newTitle')}
              </h3>
              <button
                type="button"
                className={css.iconButton}
                onClick={() => { setModalDraft(null) }}
                aria-label={t('notice.dismiss')}
              >
                ✕
              </button>
            </header>

            <label className={css.chField}>
              <span>{t('skills.modal.name')}</span>
              <input
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

            <footer className={css.ctrlModalFoot}>
              <button
                type="button"
                className={css.bindGhost}
                disabled={busy}
                onClick={() => { setModalDraft(null) }}
              >
                {t('skills.modal.cancel')}
              </button>
              <button
                type="button"
                className={css.bindButton}
                disabled={busy || normalizeSkillSlug(modalDraft.name) === '' || modalDraft.desc.trim() === ''}
                onClick={() => { void doSaveSkill() }}
              >
                {busy ? t('skills.modal.saving') : t('skills.modal.save')}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
