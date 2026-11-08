/** Shared model fields and actions for both adapter catalog editors. */

import { useState, type DragEvent, type ReactNode } from 'react'
import {
  IconChevronDownOutlineRegular, IconChevronRightOutlineRegular, IconTrashOutlineRegular,
} from '@xpeach/xph-client-ui-primitives'
import type { DeepSeekModelDraft } from './DeepSeekModelsEditor.tsx'
import type { ModelsKey } from './locales.ts'
import { ModelInputTypes } from './ModelInputTypes.tsx'
import { ModelReasoningEfforts } from './ModelReasoningEfforts.tsx'
import styles from './ModelsSection.module.css'

/** A capacity's editable text and adapter-specific inherited hint. */
interface CapacityInput {
  value: string
  placeholder: string
  onChange: (value: string) => void
  onBlur?: () => void
}

/** Adapter-owned data and actions for one model row. */
interface ModelRowProps {
  model: DeepSeekModelDraft
  position: number
  inputField: 'inputModalities' | 'input'
  inputFallback?: readonly string[] | undefined
  inputLoading?: boolean
  /** Levels the row's `reasoningEfforts` may declare; absent or empty shows no reasoning control. */
  reasoningLevels?: readonly string[] | undefined
  expanded: boolean
  disabled: boolean
  /** Move this row to another position; omission hides the drag affordance. */
  onReorder?: ((from: number, to: number) => void) | undefined
  /** Total rows, so the last one cannot be dragged past the end. */
  rowCount?: number | undefined
  /** Index the editor is currently dragging, shared by every row. */
  dragFrom?: number | null | undefined
  onDragStart?: ((index: number) => void) | undefined
  onDragEnd?: (() => void) | undefined
  t: (key: ModelsKey) => string
  contextWindow: CapacityInput
  maxTokens: CapacityInput
  onFieldChange: (field: 'id' | 'name', value: string | undefined) => void
  onIdBlur?: (value: string) => void
  onChange: (model: DeepSeekModelDraft) => void
  onToggle: () => void
  onRemove: () => void
}

/**
 * Render model fields with the display name in the expanded area of narrow rows.
 * @param props - drafted fields and their owning editor's actions.
 * @returns one expandable model entry.
 */
export function ModelRow(props: ModelRowProps): ReactNode {
  const { model, position, t, disabled } = props
  const onReorder = props.onReorder
  const dragFrom = props.dragFrom
  const [dropTarget, setDropTarget] = useState(false)
  const blockInputDrag = (event: DragEvent<HTMLInputElement>): void => {
    event.stopPropagation()
    event.preventDefault()
  }
  const modelField = (field: 'id' | 'name') => (
    <label className={`${styles['modelField']} ${field === 'name' ? styles['modelName'] : ''}`}>
      {field === 'name'
        ? <span className={`${styles['modelFieldLabel']} ${styles['modelNameLabel']}`}>{t('modelName')}</span>
        : null}
      <input
        className={styles['input']}
        type="text"
        draggable={!disabled && onReorder !== undefined}
        onDragStart={blockInputDrag}
        value={typeof model[field] === 'string' ? model[field] : ''}
        placeholder={t(field === 'id' ? 'modelId' : 'modelName')}
        aria-label={`${t(field === 'id' ? 'modelId' : 'modelName')} ${String(position)}`}
        disabled={disabled}
        onFocus={field === 'name' && !props.expanded ? props.onToggle : undefined}
        onChange={(event) => {
          const value = event.target.value
          props.onFieldChange(field, field === 'name' && value === '' ? undefined : value)
        }}
        onBlur={field === 'id' ? event => props.onIdBlur?.(event.target.value) : undefined}
      />
    </label>
  )
  const drag = onReorder === undefined || props.onDragStart === undefined
    ? {}
    : {
      draggable: !disabled,
      onDragStart: (event: DragEvent<HTMLDivElement>) => {
        if (event.target instanceof HTMLInputElement
          || (document.activeElement instanceof HTMLInputElement && event.currentTarget.contains(document.activeElement))) {
          event.preventDefault()
          return
        }
        props.onDragStart?.(position - 1)
        event.dataTransfer.effectAllowed = 'move'
        // Firefox only starts a drag when some data is set.
        event.dataTransfer.setData('text/plain', String(position - 1))
      },
      onDragOver: (event: DragEvent<HTMLDivElement>) => {
        if (dragFrom === undefined || dragFrom === null) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setDropTarget(true)
      },
      onDragLeave: (event: DragEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(false)
      },
      onDrop: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setDropTarget(false)
        if (dragFrom !== undefined && dragFrom !== null) onReorder(dragFrom, position - 1)
      },
      onDragEnd: () => { setDropTarget(false); props.onDragEnd?.() },
    }
  return (
    <div
      className={dropTarget ? `${styles['modelEntry']} ${styles['modelEntryDrop']}` : styles['modelEntry']}
      data-drag-handle={onReorder === undefined ? undefined : 'model-row'}
      {...drag}
    >
      <div className={styles['modelRow']} data-expanded={props.expanded || undefined}>
        {modelField('id')}
        <button
          type="button"
          className={styles['iconButton']}
          aria-label={`${t('modelAdvanced')} ${String(position)}`}
          aria-expanded={props.expanded}
          title={t('modelAdvanced')}
          onClick={(event) => { event.currentTarget.focus(); props.onToggle() }}
        >
          {props.expanded ? <IconChevronDownOutlineRegular /> : <IconChevronRightOutlineRegular />}
        </button>
        <button
          type="button"
          className={`${styles['iconButton']} ${styles['iconButtonDanger']}`}
          aria-label={`${t('removeModel')} ${String(position)}`}
          title={t('removeModel')}
          disabled={disabled}
          onClick={props.onRemove}
        >
          <IconTrashOutlineRegular size={14} />
        </button>
        {modelField('name')}
        {props.expanded
          ? (
            <div className={styles['modelAdvanced']}>
              {(['contextWindow', 'maxTokens'] as const).map(field => (
                <label className={styles['modelField']} key={field}>
                  <span className={styles['modelFieldLabel']}>{t(field)}</span>
                  <input
                    className={styles['input']}
                    type="text"
                    inputMode="numeric"
                    draggable={!disabled && onReorder !== undefined}
                    onDragStart={blockInputDrag}
                    value={props[field].value}
                    placeholder={props[field].placeholder}
                    aria-label={`${t(field)} ${String(position)}`}
                    disabled={disabled}
                    onChange={(event) => { props[field].onChange(event.target.value) }}
                    onBlur={props[field].onBlur}
                  />
                </label>
              ))}
              <ModelInputTypes
                model={model} field={props.inputField} position={position}
                fallback={props.inputFallback} disabled={disabled || props.inputLoading === true} t={t} onChange={props.onChange}
              />
              {props.reasoningLevels !== undefined && props.reasoningLevels.length > 0
                ? (
                  <ModelReasoningEfforts
                    model={model} levels={props.reasoningLevels} position={position} disabled={disabled} t={t} onChange={props.onChange}
                  />
                )
                : null}
            </div>
          )
          : null}
      </div>
    </div>
  )
}
