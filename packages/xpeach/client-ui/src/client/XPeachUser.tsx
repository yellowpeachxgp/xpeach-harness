/**
 * User-scope segment: profile card, own token list, redemption top-up, and the
 * Stripe/NowPayments pay shortcut — all gated on the site session cookie
 * (Settings → XPeach). When unbound it renders a guide card instead of errors.
 */
import { type JSX, useCallback, useEffect, useState } from 'react'
import type { XPeachOnboardingScan, XPeachOps, XPeachUserSelfRow, XPeachUserTokenRow } from './ops.ts'
import type { XPeachTabProps } from './XPeachTab.tsx'
import { MacosInstallerCard } from './XPeachProfile.tsx'
import { SOURCE_META } from './XPeachOnboarding.tsx'
import css from './xpeach.module.css'
import { EditDrawer, DrawerField } from './XPeachDrawer.tsx'
import { SITE } from './fmt.ts'

const fmtQuota = (q: number): string => (q / 500000).toFixed(2) + '\u{1F351}'

/** DeepSeek Harness & local agent conversation import card (read-only on source,
 * always reachable — also when the site session is unbound). */
function ImportDeepseekCard({ t, run, onboardingScan, importConversations }: {
  t: XPeachTabProps['t']
  run: XPeachOps['importDeepseek']
  onboardingScan?: XPeachOps['onboardingScan'] | undefined
  importConversations?: XPeachOps['importConversations'] | undefined
}): JSX.Element {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [scan, setScan] = useState<XPeachOnboardingScan | undefined>(undefined)
  const [picked, setPicked] = useState<readonly string[]>([])

  useEffect(() => {
    if (onboardingScan === undefined) return
    let live = true
    void onboardingScan().then((res) => {
      if (!live || 'error' in res) return
      setScan(res)
      setPicked(res.sources.filter(s => s.found).map(s => s.id))
    })
    return () => { live = false }
  }, [onboardingScan])

  const go = async (): Promise<void> => {
    setBusy(true); setMsg(null); setErr(null)
    const r = await run()
    setBusy(false)
    if ('error' in r) { setErr(r.error); return }
    setMsg(t('data.imported', { sessions: String(r.imported), files: String(r.files), skipped: String(r.skipped) }))
  }

  const goSources = async (): Promise<void> => {
    if (importConversations === undefined || picked.length === 0) return
    setBusy(true); setMsg(null); setErr(null)
    const r = await importConversations([...picked])
    setBusy(false)
    if ('error' in r) { setErr(r.error); return }
    const imported = r.reduce((sum, item) => sum + item.imported, 0)
    const skipped = r.reduce((sum, item) => sum + item.skipped, 0)
    setMsg(t('data.importedSources', { n: String(imported), skipped: String(skipped) }))
  }

  const foundSources = scan?.sources.filter(s => s.found) ?? []

  return (
    <section className={css.dailyBox}>
      <p className={css.sparkTitle}>{t('data.localSourcesTitle')}</p>
      <p className={css.bindHint}>{t('data.localSourcesHint')}</p>
      {foundSources.length > 0 && (
        <div className={css.onbCards}>
          {foundSources.map((source) => {
            const meta = SOURCE_META[source.id] ?? { icon: '💬', key: 'onb.src.chatgpt' }
            const on = picked.includes(source.id)
            return (
              <button key={source.id} type="button" className={css.onbCard} data-on={on}
                onClick={() => { setPicked(prev => on ? prev.filter(id => id !== source.id) : [...prev, source.id]) }}>
                <span className={css.onbCardIcon}>{meta.icon}</span>
                <span className={css.onbCardBody}>
                  <span className={css.onbCardTitle}>{source.label}</span>
                  <span className={css.onbCardDesc}>{t(meta.key as never)}</span>
                  <span className={css.onbCardCount}>{t('onboard.threads', { n: String(source.threads) })}</span>
                </span>
                <span className={css.onbCheck} data-on={on}>{on ? '✓' : ''}</span>
              </button>
            )
          })}
        </div>
      )}
      <div className={css.bindRow}>
        {foundSources.length > 0 && importConversations !== undefined && (
          <button type="button" className={css.bindButton} disabled={busy || picked.length === 0} onClick={() => { void goSources() }}>
            {busy ? t('data.working') : t('data.importSelected')}
          </button>
        )}
        <button type="button" className={foundSources.length > 0 ? css.bindGhost : css.bindButton} disabled={busy} onClick={() => { void go() }}>
          {busy ? t('data.working') : t('data.import')}
        </button>
      </div>
      {msg !== null && <p className={css.bindHint}>{msg}</p>}
      {err !== null && <p className={css.bindError}>{err}</p>}
    </section>
  )
}

/**
 * Render the user account segment inside the XPeach console.
 * @param props - locale translator and user account operations.
 * @returns the user segment element.
 */
export function XPeachUser({
  t, sessionBound, userSelf, userTokens, userTopup, stripeAmount, stripePay,
  userTokenCreate, userTokenUpdate, userTokenDelete, userSelfEdit, userAff, userTokenKey, importDeepseek,
  onboardingScan, importConversations, macosInstallerStatus, macosInstallerAction,
}: {
  readonly t: XPeachTabProps['t']
  readonly sessionBound: XPeachOps['sessionBound']
  readonly userSelf: XPeachOps['userSelf']
  readonly userTokens: XPeachOps['userTokens']
  readonly userTopup: XPeachOps['userTopup']
  readonly stripeAmount: XPeachOps['stripeAmount']
  readonly stripePay: XPeachOps['stripePay']
  readonly userTokenCreate: XPeachOps['userTokenCreate']
  readonly userTokenUpdate: XPeachOps['userTokenUpdate']
  readonly userTokenDelete: XPeachOps['userTokenDelete']
  readonly userSelfEdit: XPeachOps['userSelfEdit']
  readonly userAff: XPeachOps['userAff']
  readonly userTokenKey: XPeachOps['userTokenKey']
  readonly importDeepseek: XPeachOps['importDeepseek']
  readonly onboardingScan?: XPeachOps['onboardingScan'] | undefined
  readonly importConversations?: XPeachOps['importConversations'] | undefined
  readonly macosInstallerStatus?: XPeachOps['macosInstallerStatus'] | undefined
  readonly macosInstallerAction?: XPeachOps['macosInstallerAction'] | undefined
}): JSX.Element {
  const [me, setMe] = useState<XPeachUserSelfRow | { error: string } | undefined>(undefined)
  const [tokens, setTokens] = useState<{ items: readonly XPeachUserTokenRow[]; total: number } | { error: string } | undefined>(undefined)
  const [code, setCode] = useState('')
  const [codeBusy, setCodeBusy] = useState(false)
  const [codeMsg, setCodeMsg] = useState<string | null>(null)
  const [amount, setAmount] = useState('20')
  const [method, setMethod] = useState('stripe')
  const [payBusy, setPayBusy] = useState(false)
  const [payPreview, setPayPreview] = useState<string | null>(null)
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const [payErr, setPayErr] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editDraft, setEditDraft] = useState<Record<string, string>>({})
  const [editMsg, setEditMsg] = useState<string | null>(null)
  const [tokOpen, setTokOpen] = useState(false)
  const [tokDraft, setTokDraft] = useState({ name: '', quota: '', unlimited: true, group: '' })
  const [tokMsg, setTokMsg] = useState<string | null>(null)
  const [aff, setAff] = useState<Record<string, unknown> | { error: string } | undefined>(undefined)

  const reload = useCallback((): void => {
    void userSelf().then(setMe)
    void userTokens(0).then(setTokens)
    void userAff().then(setAff)
  }, [userSelf, userTokens, userAff])

  useEffect(() => {
    let live = true
    void sessionBound().then((v) => {
      if (!live) return
      // The Access Token is the login state; reads work without a session.
      void v
      reload()
    })
    return () => { live = false }
  }, [sessionBound, reload])

  if (me !== undefined && 'error' in me) {
    return (
      <>
        <div className={css.emptyState}>
          <span className={css.emptyMark} aria-hidden="true">🍑</span>
          <p className={css.sparkTitle}>{t('user.needSession')}</p>
          <p className={css.bindHint}>{t('user.needSessionHint')}</p>
        </div>
        <MacosInstallerCard t={t} macosInstallerStatus={macosInstallerStatus} macosInstallerAction={macosInstallerAction} />
        <ImportDeepseekCard t={t} run={importDeepseek} onboardingScan={onboardingScan} importConversations={importConversations} />
      </>
    )
  }

  const doTopup = async (): Promise<void> => {
    setCodeBusy(true); setCodeMsg(null)
    const err = await userTopup(code.trim())
    setCodeBusy(false)
    if (err !== null) { setCodeMsg(err); return }
    setCode(''); setCodeMsg(t('user.topupOk')); reload()
  }
  const doPreview = async (): Promise<void> => {
    setPayBusy(true); setPayErr(null); setPayUrl(null)
    const r = await stripeAmount(Number(amount))
    setPayBusy(false)
    if ('error' in r) { setPayErr(r.error); return }
    setPayPreview(r.money)
  }
  const doEditSave = async (): Promise<void> => {
    setEditMsg(null)
    const payload: Record<string, unknown> = {}
    if (editDraft['display_name'] !== undefined && editDraft['display_name'].trim() !== '') payload['display_name'] = editDraft['display_name'].trim()
    if (editDraft['username'] !== undefined && editDraft['username'].trim() !== '') payload['username'] = editDraft['username'].trim()
    if (editDraft['email'] !== undefined && editDraft['email'].trim() !== '') payload['email'] = editDraft['email'].trim()
    if (editDraft['password'] !== undefined && editDraft['password'].trim() !== '') payload['password'] = editDraft['password']
    if (editDraft['aff_code'] !== undefined && editDraft['aff_code'].trim() !== '') payload['aff_code'] = editDraft['aff_code'].trim()
    const err = await userSelfEdit(payload)
    setEditMsg(err ?? t('user.savedOk'))
    if (err === null) { setEditOpen(false); reload() }
  }
  const doTokCreate = async (): Promise<void> => {
    setTokMsg(null)
    const payload: Record<string, unknown> = {
      name: tokDraft.name.trim() || 'console-token',
      expired_time: -1,
      unlimited_quota: tokDraft.unlimited,
      model_limits_enabled: false,
    }
    if (!tokDraft.unlimited && tokDraft.quota !== '') payload['remain_quota'] = Number(tokDraft.quota) * 500000
    if (tokDraft.group !== '') payload['group'] = tokDraft.group
    const err = await userTokenCreate(payload)
    setTokMsg(err ?? t('user.tokCreated'))
    if (err === null) { setTokOpen(false); setTokDraft({ name: '', quota: '', unlimited: true, group: '' }); reload() }
  }
  const doTokToggle = async (id: number, status: number): Promise<void> => {
    setTokMsg(null)
    const err = await userTokenUpdate(id, { status: status === 1 ? 2 : 1 })
    setTokMsg(err ?? null)
    reload()
  }
  const doTokDelete = async (id: number): Promise<void> => {
    if (!window.confirm(t('user.tokDelConfirm'))) return
    setTokMsg(null)
    const err = await userTokenDelete(id)
    setTokMsg(err ?? null)
    reload()
  }
  const [reveal, setReveal] = useState<Record<number, string>>({})
  const doReveal = async (id: number): Promise<void> => {
    const r = await userTokenKey(id)
    if (typeof r === 'string' && r !== '') setReveal(prev => ({ ...prev, [id]: r }))
  }
  const doPay = async (): Promise<void> => {
    setPayBusy(true); setPayErr(null); setPayUrl(null)
    const r = await stripePay(Number(amount), method)
    setPayBusy(false)
    if ('error' in r) { setPayErr(r.error); return }
    setPayUrl(r.url)
    if (r.url.length > 0) window.open(r.url, 'xpeach-pay', 'width=560,height=780')
  }

  return (
    <>
      {/* profile card */}
      <section className={css.dailyBox}>
        <p className={css.sparkTitle}>{t('user.profile')}</p>
        {me !== undefined && 'error' in me && <p className={css.bindError}>{String(me.error)}</p>}
        {me !== undefined && !('error' in me) && (
          <dl className={css.usageGrid}>
            <div className={css.usageCell}><dt>{t('user.name')}</dt><dd>{me.display_name ?? me.username ?? '—'}</dd></div>
            <div className={css.usageCell}><dt>{t('user.email')}</dt><dd>{me.email ?? '—'}</dd></div>
            <div className={css.usageCell}><dt>{t('user.group')}</dt><dd>{me.group ?? '—'}</dd></div>
            <div className={css.usageCell}><dt>{t('user.quota')}</dt><dd>{me.quota !== undefined ? fmtQuota(me.quota) : '—'}</dd></div>
            <div className={css.usageCell}><dt>{t('user.used')}</dt><dd>{me.used_quota !== undefined ? fmtQuota(me.used_quota) : '—'}</dd></div>
          </dl>
        )}
        <button type="button" className={css.bindGhost} onClick={() => {
          setEditOpen(v => !v)
          if (me !== undefined && !('error' in me)) setEditDraft({ display_name: me.display_name ?? '', username: me.username ?? '', email: me.email ?? '', password: '', aff_code: me.aff_code ?? '' })
        }}>{editOpen ? t('market.tryClose') : t('user.editProfile')}</button>
        {editOpen && (
          <EditDrawer
            actions={<button type="button" className={css.bindButton} onClick={() => { void doEditSave() }}>{t('admin.save')}</button>}>
            {(['display_name', 'username', 'email', 'password', 'aff_code'] as const).map(f => (
              <DrawerField key={f} label={t(('user.ef.' + f) as 'user.ef.username')}>
                <input className={css.bindInput} type={f === 'password' ? 'password' : 'text'} value={editDraft[f] ?? ''}
                  placeholder={f === 'password' ? t('user.ef.passwordPh') : undefined}
                  onChange={(e) => { setEditDraft({ ...editDraft, [f]: e.target.value }) }} />
              </DrawerField>
            ))}
          </EditDrawer>
        )}
        {editMsg !== null && <p className={css.bindHint}>{editMsg}</p>}
      </section>

      {/* my tokens */}
      <section className={css.dailyBox}>
        <p className={css.sparkTitle}>{t('user.tokens')}{tokens !== undefined && !('error' in tokens) ? ` · ${tokens.total}` : ''}</p>
        {tokens !== undefined && 'error' in tokens && <p className={css.bindError}>{tokens.error}</p>}
        {tokens !== undefined && !('error' in tokens) && (
          <>
            <div className={css.bindRow}>
              <button type="button" className={css.bindGhost} onClick={() => { setTokOpen(v => !v) }}>
                {tokOpen ? t('market.tryClose') : t('user.newToken')}
              </button>
              {tokMsg !== null && <span className={css.bindHint}>{tokMsg}</span>}
            </div>
            {tokOpen && (
              <div className={css.chEdit}>
                <label className={css.chField}>
                  <span>{t('user.tname')}</span>
                  <input
                    className={css.bindInput}
                    value={tokDraft.name}
                    onChange={(e) => { setTokDraft({ ...tokDraft, name: e.target.value }) }}
                  />
                </label>
                <label className={css.chField}>
                  <span>{t('user.tgroup')}</span>
                  <input
                    className={css.bindInput}
                    placeholder={t('user.tgroupPh')}
                    value={tokDraft.group}
                    onChange={(e) => { setTokDraft({ ...tokDraft, group: e.target.value }) }}
                  />
                </label>
                <label className={css.chField}>
                  <span>{t('user.tquotaPeach')}</span>
                  <input
                    className={css.bindInput}
                    type="number"
                    disabled={tokDraft.unlimited}
                    value={tokDraft.quota}
                    onChange={(e) => { setTokDraft({ ...tokDraft, quota: e.target.value }) }}
                  />
                </label>
                <label className={css.chField}><span>{t('user.tUnlimited')}</span>
                  <input
                    type="checkbox"
                    checked={tokDraft.unlimited}
                    onChange={(e) => { setTokDraft({ ...tokDraft, unlimited: e.target.checked }) }}
                  />
                </label>
                <div className={css.bindRow}>
                  <button type="button" className={css.bindButton} onClick={() => { void doTokCreate() }}>{t('admin.codeMake')}</button>
                </div>
              </div>
            )}
            <table className={css.logTable}>
              <thead>
                <tr>
                  <th>{t('user.tname')}</th>
                  <th>{t('user.tkey')}</th>
                  <th>{t('user.tgroup')}</th>
                  <th>{t('user.tquota')}</th>
                  <th>{t('user.tstatus')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tokens.items.map(tk => (
                  <tr key={tk.id}>
                    <td>{tk.name}</td>
                    <td><code className={css.keyMask}>{reveal[tk.id] ?? tk.key ?? tk.key_prefix ?? '—'}</code>
                      {reveal[tk.id] === undefined && (
                        <button type="button" className={css.rowAct} onClick={() => { void doReveal(tk.id) }}>👁</button>
                      )}
                    </td>
                    <td>{tk.group ?? '—'}</td>
                    <td>{tk.unlimited_quota === true ? t('usage.unlimited') : fmtQuota(tk.remain_quota ?? 0)}</td>
                    <td>{tk.status === 1 ? t('user.statusOn') : t('user.statusOff')}</td>
                    <td>
                      <button type="button" className={css.rowAct} onClick={() => { void doTokToggle(tk.id, tk.status) }}>
                        {tk.status === 1 ? t('admin.chOff') : t('admin.chEnable')}
                      </button>
                      <button type="button" className={css.rowAct} onClick={() => { void doTokDelete(tk.id) }}>{t('admin.del')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* redemption top-up */}
      <section className={css.dailyBox}>
        <p className={css.sparkTitle}>{t('user.topup')}</p>
        <div className={css.bindRow}>
          <input className={css.bindInput} type="text" placeholder={t('user.codePh')}
            value={code} onChange={(e) => { setCode(e.target.value) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !codeBusy) void doTopup() }} />
          <button type="button" className={css.bindButton} disabled={codeBusy || code.trim().length < 8}
            onClick={() => { void doTopup() }}>{codeBusy ? t('bind.working') : t('user.redeem')}</button>
        </div>
        {codeMsg !== null && <p className={css.bindHint}>{codeMsg}</p>}
      </section>

      {/* Stripe / payment shortcut */}
      <section className={css.dailyBox}>
        <p className={css.sparkTitle}>{t('user.pay')}</p>
        <div className={css.bindRow}>
          <select
            className={css.bindInput}
            value={method}
            onChange={(e) => { setMethod(e.target.value); setPayPreview(null); setPayUrl(null) }}
          >
            <option value="stripe">{t('user.payStripeUsd')}</option>
            <option value="stripe-cny">{t('user.payStripeCny')}</option>
            <option value="nowpayments">{t('user.payNow')}</option>
          </select>
          <input className={css.bindInput} type="number" min={1} value={amount}
            onChange={(e) => { setAmount(e.target.value); setPayPreview(null); setPayUrl(null) }} />
          <button type="button" className={css.bindGhost} disabled={payBusy} onClick={() => { void doPreview() }}>{t('user.preview')}</button>
          <button type="button" className={css.bindButton} disabled={payBusy || Number(amount) <= 0} onClick={() => { void doPay() }}>
            {payBusy ? t('bind.working') : t('user.goPay')}
          </button>
        </div>
        {payPreview !== null && <p className={css.bindHint}>{t('user.payPreview', { money: payPreview })}</p>}
        {payUrl !== null && <p className={css.bindHint}>{t('user.payOpened')} <a href={payUrl} target="_blank" rel="noreferrer">{payUrl}</a></p>}
        {payErr !== null && <p className={css.bindError}>{payErr}</p>}
      </section>

      {/* 邀请推广 */}
      <section className={css.dailyBox}>
        <p className={css.sparkTitle}>{t('user.aff')}</p>
        {aff !== undefined && 'error' in aff && typeof aff.error === 'string' && <p className={css.bindError}>{aff.error}</p>}
        {aff !== undefined && !('error' in aff) && (
          <>
            <dl className={css.usageGrid}>
              <div className={css.usageCell}>
                <dt>{t('user.affCode')}</dt>
                <dd><code>{typeof aff['aff_code'] === 'string' ? aff['aff_code'] : '—'}</code></dd>
              </div>
              <div className={css.usageCell}><dt>{t('user.affQuota')}</dt><dd>{typeof aff['quota'] === 'number' ? fmtQuota(aff['quota']) : '—'}</dd></div>
            </dl>
            {typeof aff['aff_code'] === 'string' && aff['aff_code'] !== '' && (
              <div className={css.bindRow}>
                <code className={css.keyMask}>{`${SITE.register}?${new URLSearchParams({ aff: aff['aff_code'] }).toString()}`}</code>
                <button type="button" className={css.bindGhost} onClick={() => {
                  const affCode = typeof aff['aff_code'] === 'string' ? aff['aff_code'] : ''
                  void navigator.clipboard.writeText(`${SITE.register}?${new URLSearchParams({ aff: affCode }).toString()}`)
                  setEditMsg(t('bind.copied'))
                }}>{t('bind.copyApi')}</button>
              </div>
            )}
          </>
        )}
      </section>
      <MacosInstallerCard t={t} macosInstallerStatus={macosInstallerStatus} macosInstallerAction={macosInstallerAction} />
      <ImportDeepseekCard t={t} run={importDeepseek} onboardingScan={onboardingScan} importConversations={importConversations} />
    </>
  )
}
