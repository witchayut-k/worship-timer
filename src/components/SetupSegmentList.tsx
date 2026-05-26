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

export type DraftItem = ProgramItem & { id: string }

type SetupSegmentListProps = {
  items: DraftItem[]
  selectedId: string | null
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
  isLive: boolean
  leaderNames: string[]
  onSelect: (id: string) => void
  onUpdate: (id: string, patch: Partial<DraftItem>) => void
  onRemove: (id: string) => void
  onLeaderCommit: (name: string) => void
}

function SortableRow({
  item,
  selected,
  isLive,
  leaderNames,
  onSelect,
  onUpdate,
  onRemove,
  onLeaderCommit,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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
        aria-label="ลากเพื่อเรียงลำดับ"
      >
        ⋮⋮
      </div>
      <div className="field segmentColName" onClick={(e) => e.stopPropagation()}>
        <input
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          aria-label="ชื่อรายการ"
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
          placeholder="ไฟในห้อง"
          aria-label="ไฟในห้องประชุม"
        />
      </div>
      <div className="field segmentColMedia" onClick={(e) => e.stopPropagation()}>
        <input
          value={item.mediaNote ?? ''}
          onChange={(e) => onUpdate(item.id, { mediaNote: e.target.value })}
          placeholder="มีเดีย"
          aria-label="มีเดีย"
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
        ลบ
      </button>
    </div>
  )
}

export function SetupSegmentList({
  items,
  selectedId,
  liveIndex = null,
  leaderNames,
  onSelect,
  onReorder,
  onUpdate,
  onRemove,
  onLeaderCommit,
}: SetupSegmentListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(reorderItems(items, String(active.id), String(over.id)))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="segmentTable">
        <div className="segmentTableHead" aria-hidden>
          <span />
          <span>ชื่อรายการ</span>
          <span>ผู้นำ / ผู้พูด</span>
          <span>ระยะเวลา</span>
          <span>ไฟ</span>
          <span>มีเดีย</span>
          <span />
        </div>
        <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
          {items.map((it, idx) => (
            <SortableRow
              key={it.id}
              item={it}
              selected={selectedId === it.id}
              isLive={liveIndex != null && idx === liveIndex}
              leaderNames={leaderNames}
              onSelect={onSelect}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onLeaderCommit={onLeaderCommit}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  )
}
