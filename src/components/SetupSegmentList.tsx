import { useEffect, useRef, type CSSProperties } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DurationInput } from './DurationInput'
import type { ProgramItem, RuntimePhase } from '../domain/types'
import { useLocale } from '../i18n/useLocale'
import { usePlannedSegmentSchedule } from '../hooks/usePlannedSegmentSchedule'
import { ProgramTimeline, ProgramTimelineRow } from './ProgramTimeline'
import type { StageTheme } from '../lib/displayTheme'

export type DraftItem = ProgramItem & { id: string }

type SetupSegmentListProps = {
  items: DraftItem[]
  eventDate?: string
  plannedStartTime?: string
  autoFocusId: string | null
  onAutoFocusDone: () => void
  liveIndex?: number | null
  livePhase?: RuntimePhase | null
  liveDotTheme?: StageTheme | null
  reorderDisabled?: boolean
  reorderDisabledTitle?: string
  onReorder: (params: { items: DraftItem[]; fromIndex: number; toIndex: number }) => void
  onUpdate: (id: string, patch: Partial<DraftItem>) => void
  onRemove: (id: string, index: number) => void
}

function reorderItems(items: DraftItem[], activeId: string, overId: string) {
  const fromIndex = items.findIndex((x) => x.id === activeId)
  const toIndex = items.findIndex((x) => x.id === overId)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return null
  }
  return {
    items: arrayMove(items, fromIndex, toIndex).map((x, i) => ({ ...x, order: i + 1 })),
    fromIndex,
    toIndex,
  }
}

type SortableRowProps = {
  item: DraftItem
  autoFocus: boolean
  isLive: boolean
  livePhase: RuntimePhase | null
  liveDotTheme: StageTheme | null
  rowIndex: number
  reorderDisabled: boolean
  reorderDisabledTitle: string | undefined
  timelineEnabled: boolean
  onUpdate: (id: string, patch: Partial<DraftItem>) => void
  onRemove: (id: string, index: number) => void
  onAutoFocusDone: () => void
}

function SortableRow({
  item,
  autoFocus,
  isLive,
  livePhase,
  liveDotTheme,
  rowIndex,
  reorderDisabled,
  reorderDisabledTitle,
  timelineEnabled,
  onUpdate,
  onRemove,
  onAutoFocusDone,
}: SortableRowProps) {
  const { t } = useLocale()
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: reorderDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (!autoFocus) return
    const el = nameInputRef.current
    if (!el) return
    el.focus()
    el.select()
    onAutoFocusDone()
  }, [autoFocus, onAutoFocusDone])

  const pulse = isLive && livePhase === 'running'
  const liveDotStyle: CSSProperties | undefined =
    isLive && liveDotTheme
      ? {
          ['--live-dot-accent' as string]: liveDotTheme.accent,
          ['--live-dot-glow' as string]: liveDotTheme.glow,
        }
      : undefined

  const rowClass = [
    'segmentRow',
    timelineEnabled ? 'setupTimelineCard' : '',
    isLive ? 'segmentRowLive setupTimelineCardLive' : '',
    isDragging ? 'segmentRowDragging' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={rowClass}
      aria-current={isLive ? 'step' : undefined}
    >
      <div
        className="dragHandle segmentColHandle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label={t('setupSegment.dragHandle')}
        title={reorderDisabled ? reorderDisabledTitle : undefined}
      >
        {isLive ? (
          <span
            className={`segmentLiveDot${pulse ? ' segmentLiveDotPulse' : ''}`}
            style={liveDotStyle}
            role="img"
            aria-label={t('setupSegment.liveNow')}
          />
        ) : null}
        ⋮⋮
      </div>
      <div className="field segmentColName" onClick={(e) => e.stopPropagation()}>
        <input
          ref={nameInputRef}
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          aria-label={t('setupSegment.itemName')}
        />
      </div>
      <div className="field segmentColLeader" onClick={(e) => e.stopPropagation()}>
        <input
          value={item.leaderName}
          onChange={(e) => onUpdate(item.id, { leaderName: e.target.value })}
          aria-label={t('setupSegment.leaderSpeaker')}
        />
      </div>
      <div className="segmentColDuration" onClick={(e) => e.stopPropagation()}>
        <DurationInput
          valueSec={item.durationSec}
          onChangeSec={(durationSec) => onUpdate(item.id, { durationSec })}
        />
      </div>
      <div className="field segmentColLights" onClick={(e) => e.stopPropagation()}>
        <input
          value={item.roomLights ?? ''}
          onChange={(e) => onUpdate(item.id, { roomLights: e.target.value })}
          placeholder={t('setupSegment.roomLightsPlaceholder')}
          aria-label={t('setupSegment.roomLightsAria')}
        />
      </div>
      <div className="field segmentColMedia" onClick={(e) => e.stopPropagation()}>
        <input
          value={item.mediaNote ?? ''}
          onChange={(e) => onUpdate(item.id, { mediaNote: e.target.value })}
          placeholder={t('setupSegment.mediaPlaceholder')}
          aria-label={t('setupSegment.mediaAria')}
        />
      </div>
      <button
        className="btnDanger segmentRowDelete segmentColDelete"
        type="button"
        disabled={isLive && livePhase === 'running'}
        title={isLive && livePhase === 'running' ? t('setupSegment.deleteBlockedRunning') : undefined}
        onClick={(e) => {
          e.stopPropagation()
          onRemove(item.id, rowIndex)
        }}
      >
        {t('common.delete')}
      </button>
    </div>
  )
}

export function SetupSegmentList({
  items,
  eventDate,
  plannedStartTime,
  autoFocusId,
  onAutoFocusDone,
  liveIndex = null,
  livePhase = null,
  liveDotTheme = null,
  reorderDisabled = false,
  reorderDisabledTitle,
  onReorder,
  onUpdate,
  onRemove,
}: SetupSegmentListProps) {
  const { t } = useLocale()
  const schedule = usePlannedSegmentSchedule(items, eventDate, plannedStartTime)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    if (reorderDisabled) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const reordered = reorderItems(items, String(active.id), String(over.id))
    if (!reordered) return
    onReorder(reordered)
  }

  if (!items.length) {
    return <p className="setupEmptyProgram">{t('setup.emptyProgram')}</p>
  }

  const renderRow = (it: DraftItem, idx: number) => {
    const isLive = liveIndex != null && idx === liveIndex
    const rowState =
      liveIndex != null
        ? idx < liveIndex
          ? 'past'
          : idx === liveIndex
            ? 'current'
            : 'upcoming'
        : 'upcoming'
    const plannedRow = schedule.enabled ? schedule.rows[idx] : null

    const sortable = (
      <SortableRow
        item={it}
        autoFocus={it.id === autoFocusId}
        isLive={isLive}
        livePhase={livePhase}
        liveDotTheme={liveDotTheme}
        rowIndex={idx}
        reorderDisabled={reorderDisabled}
        reorderDisabledTitle={reorderDisabledTitle}
        timelineEnabled={schedule.enabled}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onAutoFocusDone={onAutoFocusDone}
      />
    )

    if (!schedule.enabled) {
      return <div key={it.id}>{sortable}</div>
    }

    return (
      <ProgramTimelineRow
        key={it.id}
        rowState={rowState}
        startLabel={plannedRow?.startLabel ?? null}
        endLabel={plannedRow?.endLabel ?? null}
        className="setupTimelineRow"
      >
        {sortable}
      </ProgramTimelineRow>
    )
  }

  const listBody = (
    <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
      {items.map((it, idx) => renderRow(it, idx))}
    </SortableContext>
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      {schedule.enabled ? (
        <ProgramTimeline className="setupTimeline">{listBody}</ProgramTimeline>
      ) : (
        <div className="segmentTable">
          <div className="segmentTableHead" aria-hidden>
            <span />
            <span>{t('setupSegment.colName')}</span>
            <span>{t('setupSegment.colLeader')}</span>
            <span>{t('setupSegment.colDuration')}</span>
            <span>{t('setupSegment.colLights')}</span>
            <span>{t('setupSegment.colMedia')}</span>
            <span />
          </div>
          {listBody}
        </div>
      )}
    </DndContext>
  )
}
