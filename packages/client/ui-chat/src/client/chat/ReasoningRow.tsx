/** Assistant reasoning disclosure, independent of Tool-call presentation. */
import { memo, useMemo } from 'react'
import { DisclosureRow, IconThinkOutlineRegular, TextShimmer } from '@xpeach/xph-client-ui-primitives'
import type { PropsRenderSlots } from '@xpeach/xph-client-ui-slots'
import type { ChatViewSlotProps, UseDisclosure, UsePresentation } from '../contract/slots.ts'
import a11yCss from './accessibility.module.css'
import css from './ReasoningRow.module.css'

const THINK_ICON = <IconThinkOutlineRegular size={14} />

function firstLine(text: string): string {
  const newline = text.indexOf('\n')
  return newline === -1 ? text : text.slice(0, newline)
}

function isBlankLineBetweenNewlines(text: string, start: number, newlineIndex: number): boolean {
  const end = newlineIndex > start && text.charCodeAt(newlineIndex - 1) === 13 ? newlineIndex - 1 : newlineIndex
  for (let index = start; index < end; index += 1) {
    const code = text.charCodeAt(index)
    if (code !== 9 && code !== 32) return false
  }
  return true
}

function latestCompletedParagraphFirstLine(text: string): string {
  let cursor = text.length
  while (true) {
    let scan = cursor
    let paragraphStart = 0
    const paragraphEnd = cursor
    let foundSeparator = false
    while (scan > 0) {
      const nl = text.lastIndexOf('\n', scan - 1)
      if (nl <= 0) break
      const prevNl = text.lastIndexOf('\n', nl - 1)
      if (prevNl !== -1 && isBlankLineBetweenNewlines(text, prevNl + 1, nl)) {
        let sepFirstNl = prevNl
        while (sepFirstNl > 0) {
          const earlierNl = text.lastIndexOf('\n', sepFirstNl - 1)
          if (earlierNl === -1 || !isBlankLineBetweenNewlines(text, earlierNl + 1, sepFirstNl)) break
          sepFirstNl = earlierNl
        }
        paragraphStart = nl + 1
        cursor = sepFirstNl
        foundSeparator = true
        break
      }
      scan = nl
    }
    const firstNl = text.indexOf('\n', paragraphStart)
    if (firstNl !== -1 && firstNl <= paragraphEnd) {
      const candidate = text.slice(paragraphStart, firstNl).trim()
      if (candidate !== '') return candidate
    }
    if (!foundSeparator) return ''
  }
}

/**
 * Render one assistant reasoning block collapsed until the reader opens it. The
 * collapsed summary omits double-asterisk markers; expanded content renders
 * the complete Markdown with secondary typography. A streaming preview advances
 * when a paragraph's first line completes. Mode changes toggle CSS display without unmounting
 * collapsed summaries.
 * @param props.text - complete or streaming reasoning text.
 * @param props.running - whether this block is the streaming tail.
 * @param props.usePresentation - live display-policy selector for this reasoning row.
 * @param props.useDisclosure - independent open state with enclosing-Turn resets.
 * @param props.renderSlot - framework renderer for the standard reasoning Body Slot.
 * @param props.t - conversation locale seat for the disclosure and running status.
 * @returns the reasoning disclosure.
 */
export const ReasoningRow = memo(function ReasoningRow({
  text, running, textInteractionSource = false, usePresentation, useDisclosure, renderSlot, t,
}: {
  text: string
  running: boolean
  textInteractionSource?: boolean
  useDisclosure: UseDisclosure
  usePresentation: UsePresentation
  t: ChatViewSlotProps['t']
} & Pick<PropsRenderSlots<'conversation.chat.reasoning.body'>, 'renderSlot'>) {
  const { expanded, toggle } = useDisclosure()
  const summaryText = running ? latestCompletedParagraphFirstLine(text) : firstLine(text)
  const summary = useMemo(() => summaryText.replaceAll('**', ''), [summaryText])
  const preview = usePresentation(policy => !expanded && summary !== ''
    && (running || policy.settledReasoningPreview))
  const collapsedContent = useMemo(() => (
    <>
      <span className={css.separator} data-shimmer-decoration aria-hidden />
      <span className={css.summary} data-streaming={running || undefined}>
        <span className={css.summaryText}>
          <TextShimmer>{summary}</TextShimmer>
        </span>
      </span>
    </>
  ), [running, summary])
  const content = useMemo(() => expanded ? (
    <div className={css.thinkBody} data-text-interaction-source={textInteractionSource && !running ? '' : undefined}>
      {renderSlot('conversation.chat.reasoning.body', { text, running })}
    </div>
  ) : undefined, [expanded, renderSlot, running, text, textInteractionSource])

  return (
    <div
      className={css.root}
      data-variant="think"
      data-state={running ? 'running' : 'ok'}
      data-expanded={expanded || undefined}
      data-preview={preview || undefined}
    >
      {running && <span className={a11yCss.visuallyHidden}>{t('row.running')}</span>}
      <DisclosureRow
        rowClassName={css.row}
        leadingClassName={css.leading}
        titleClassName={css.title}
        icon={THINK_ICON}
        title={t('message.think')}
        running={running}
        open={expanded}
        expandable
        expandOnRowClick
        onToggle={toggle}
        collapsedContent={collapsedContent}
      >
        {content}
      </DisclosureRow>
    </div>
  )
})
