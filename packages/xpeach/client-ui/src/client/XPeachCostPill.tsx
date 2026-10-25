/**
 * Composer-dock session cost pill: live per-session spend beside the native
 * turn-usage pill, wearing the same trigger chrome and stat-dialog skin
 * (menu surface, elevation-prominent, icon title + hairline + right-aligned
 * dl rows). 🍑 is the site's own denomination — one 🍑 = 500000 quota.
 * Rates come from the site's pricing catalog joined with the group discount
 * our token actually paid on its last call — the same math the relay bills.
 */
import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconDatabaseOutlineRegular, useAnchoredPosition, useDismissOnOutsidePointer } from '@xpeach/xph-client-ui-primitives'
import type { InjectFace, PropsLocale } from '@xpeach/xph-client-ui-slots'
import type { XPeachBillingRate } from './ops.ts'
import css from './xpeach.module.css'

interface TokenUsageBuckets {
  readonly uncachedInputTokens: number
  readonly cacheReadTokens: number
  readonly cacheWriteTokens: number
  readonly outputTokens: number
}

interface ModelSelectionValue {
  readonly lastUsed?: { readonly provider?: string; readonly model?: string } | null
  readonly next?: { readonly provider?: string; readonly model?: string } | null
  readonly pending?: { readonly provider?: string; readonly model?: string } | null
}

/** Props the dock slot hands every pill plus our injected billing-rate op. */
export type XPeachCostPillProps = InjectFace<{
  readonly useProjection: (key: string) => unknown
  readonly billingRate: (model: string) => Promise<XPeachBillingRate | { error: string } | undefined>
}> & PropsLocale<'xpeach.account'>

/** New API's billed-quota math, mirrored: weighted tokens × ratios. */
function quotaOf(usage: TokenUsageBuckets, rate: XPeachBillingRate): number {
  const weighted = usage.uncachedInputTokens
    + usage.cacheReadTokens * rate.cacheRatio
    + usage.cacheWriteTokens * rate.cacheRatio
    + usage.outputTokens * rate.completionRatio
  return weighted * rate.modelRatio * rate.groupRatio
}

const MEASURE_STYLE = { visibility: 'hidden' } as const

/** Live session cost pill mounted in the composer dock. */
export const XPeachCostPill = memo(function XPeachCostPill({ t, useProjection, billingRate }: XPeachCostPillProps) {
  const usage = useProjection('tokenUsage') as TokenUsageBuckets | undefined
  const selection = useProjection('modelSelection') as ModelSelectionValue | undefined
  const model = selection?.lastUsed?.model ?? selection?.next?.model ?? selection?.pending?.model
  const [rate, setRate] = useState<XPeachBillingRate | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const pos = useAnchoredPosition({ open, anchorRef: rootRef, panelRef, side: 'top', gap: 6, margin: 12 })
  useDismissOnOutsidePointer(rootRef, open, setOpen, panelRef)
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('keydown', esc) }
  }, [open])
  useEffect(() => {
    if (model === undefined) return
    let alive = true
    void billingRate(model).then((next) => {
      if (alive && next !== undefined && !('error' in next)) setRate(next)
    })
    return () => { alive = false }
  }, [model, billingRate])
  if (usage === undefined || rate === undefined) return null
  if (usage.outputTokens === 0 && usage.uncachedInputTokens === 0) return null
  // per-bucket billed 🍑: weighted tokens × ratios ÷ the 500k-quota 🍑
  const per = (weighted: number): number => weighted * rate.modelRatio * rate.groupRatio / 500000
  const rows = [
    { k: 'cost.in', n: usage.uncachedInputTokens, usd: per(usage.uncachedInputTokens) },
    { k: 'cost.cacheRead', n: usage.cacheReadTokens, usd: per(usage.cacheReadTokens * rate.cacheRatio) },
    { k: 'cost.cacheWrite', n: usage.cacheWriteTokens, usd: per(usage.cacheWriteTokens * rate.cacheRatio) },
    { k: 'cost.out', n: usage.outputTokens, usd: per(usage.outputTokens * rate.completionRatio) },
  ]
  const usd = quotaOf(usage, rate) / 500000
  if (usd <= 0) return null
  const fmtP = (v: number): string => v === 0 ? '0' : v < 0.0005 ? '<0.001' : v < 0.01 ? v.toFixed(4) : v < 1 ? v.toFixed(3) : v.toFixed(2)
  const fmtN = (n: number): string => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n)
  const label = '≈ ' + fmtP(usd) + '\u{1F351}'
  return (
    <span ref={rootRef} className={css.costPillWrap} data-xpeach-cost>
      <button type="button" className={css.costPill} aria-haspopup="dialog" aria-expanded={open}
        onClick={() => { setOpen(v => !v) }}>
        <IconDatabaseOutlineRegular />
        <span className={css.costPillLabel}>{label}</span>
      </button>
      {open && createPortal(
        <div ref={panelRef} className={css.costPop} role="dialog" aria-label={t('cost.title')}
          style={pos ?? MEASURE_STYLE}>
          <div className={css.costPopHead}>
            <span className={css.costPopHeadLabel}>
              <IconDatabaseOutlineRegular />
              {t('cost.title')}
            </span>
            <span className={css.costPopHeadValue}>{fmtP(usd)}{'\u{1F351}'}</span>
          </div>
          <div className={css.costPopRule} aria-hidden />
          <dl className={css.costPopRows}>
            {rows.filter(r => r.n > 0).map(r => (
              <span key={r.k} style={{ display: 'contents' }}>
                <dt>{t(r.k as 'cost.in')}</dt>
                <dd>{t('unit.tok', { n: fmtN(r.n) })} · {fmtP(r.usd)}{'\u{1F351}'}</dd>
              </span>
            ))}
            <span style={{ display: 'contents' }}>
              <dt>{t('cost.model')}</dt><dd className={css.costPopRoute}>{model ?? ''}</dd>
            </span>
            <span style={{ display: 'contents' }}>
              <dt>{t('cost.groupRatio')}</dt><dd>×{rate.groupRatio}</dd>
            </span>
          </dl>
        </div>, document.body)}
    </span>
  )
})
