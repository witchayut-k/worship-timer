import { useEffect, useRef } from 'react'
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
import { LeaderPicker } from './LeaderPicker'
import type { ProgramItem } from '../domain/types'
import { useLocale } from '../i18n/useLocale'

export type DraftItem = ProgramItem & { id: string }

type SetupSegmentListProps = {
  items: DraftItem[]
  selectedId: string | null
  autoFocusId: string | null
  onAutoFocusDone: () => void
  liveIndex?: number | null
  leaderNames: string[]
  onSelect: (id: string) => void
  onReorder: (items: DraftItem[]) => void
  onUpdate: (id: string, patch: Partial<DraftItem>) => void
  onRemove: (id: string) => void
  onLeaderCommit: (name: string) => void
}

function reorderItems(items: DraftItem[], activeId: string, overId: string): DraftItem[] {
  const oldIndex = items.findIndex((x) => x.id === activeId)
  const newIndex = items.findIndex((x) => x.id === overId)
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return items
  return arrayMove(items, oldIndex, newIndex).map((x, i) => ({ ...x, order: i + 1 }))
}

type SortableRowProps = {
  item: DraftItem
  selected: boolean
  autoFocus: boolean
  isLive: boolean
  leaderNames: string[]
  onSelect: (id: string) => void
  onUpdate: (id: string, patch: Partial<DraftItem>) => void
  onRemove: (id: string) => void
  onLeaderCommit: (name: string) => void
  onAutoFocusDone: () => void
}

function SortableRow({
  item,
  selected,
  autoFocus,
  isLive,
  leaderNames,
  onSelect,
  onUpdate,
  onRemove,
  onLeaderCommit,
  onAutoFocusDone,
}: SortableRowProps) {
  const { t } = useLocale()
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (!autoFocus) return
    const el = nameInputRef.current
    if (!el) return
    // Focus + select so user can immediately type over the default name.
    el.focus()
    el.select()
    onAutoFocusDone()
  }, [autoFocus, onAutoFocusDone])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`segmentRow ${selected ? 'segmentRowSelected' : ''} ${isLive ? 'segmentRowLive' : ''} ${isDragging ? 'segmentRowDragging' : ''}`}
      onClick={() => onSelect(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(item.id)
        }
      }}
    >
      <div
        className="dragHandle segmentColHandle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label={t('setupSegment.dragHandle')}
      >
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
      <div className="segmentColLeader" onClick={(e) => e.stopPropagation()}>
        <LeaderPicker
          listId={`leaders-${item.id}`}
          value={item.leaderName}
          leaderNames={leaderNames}
          hideLabel
          onChange={(name) => onUpdate(item.id, { leaderName: name })}
          onCommit={onLeaderCommit}
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
        onClick={(e) => {
          e.stopPropagation()
          onRemove(item.id)
        }}
      >
        {t('common.delete')}
      </button>
    </div>
  )
}

export function SetupSegmentList({
  items,
  selectedId,
  autoFocusId,
  onAutoFocusDone,
  liveIndex = null,
  leaderNames,
  onSelect,
  onReorder,
  onUpdate,
  onRemove,
  onLeaderCommit,
}: SetupSegmentListProps) {
  const { t } = useLocale()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(reorderItems(items, String(active.id), String(over.id)))
  }

  if (!items.length) {
    return <p className="setupEmptyProgram">{t('setup.emptyProgram')}</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
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
        <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
          {items.map((it, idx) => (
            <SortableRow
              key={it.id}
              item={it}
              selected={selectedId === it.id}
              autoFocus={it.id === autoFocusId}
              isLive={liveIndex != null && idx === liveIndex}
              leaderNames={leaderNames}
              onSelect={onSelect}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onLeaderCommit={onLeaderCommit}
              onAutoFocusDone={onAutoFocusDone}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  )
}
