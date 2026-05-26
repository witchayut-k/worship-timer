import { Link } from 'react-router-dom'
import type { ProgramItem, RuntimePhase } from '../domain/types'
import { formatSecToMmSs, formatSignedMMSS } from '../domain/time'

type Props = {
  eventId: string
  items: ProgramItem[]
  currentIndex: number
  phase: RuntimePhase
  displayRemainingSec: number
  onJumpTo: (index: number) => void
}

export function ProgramSchedulePanel({
  eventId,
  items,
  currentIndex,
  phase,
  displayRemainingSec,
  onJumpTo,
}: Props) {
  return (
    <section className="programSchedule" aria-label="ตารางโปรแกรม">
      <div className="programScheduleHeader">
        <h2 className="programScheduleTitle">ตารางโปรแกรม</h2>
        <Link className="btnGhost btnSm" to={`/setup/${eventId}`}>
          แก้ไขโปรแกรม
        </Link>
      </div>

      <div className="programScheduleList">
        {items.map((it, idx) => {
          const isCurrent = idx === currentIndex
          const isRunning = isCurrent && phase === 'running'
          const isPaused = isCurrent && phase === 'paused'

          return (
            <button
              key={`${it.order}-${it.name}-${idx}`}
              type="button"
              className={`listPick programSchedulePick ${isCurrent ? 'active' : ''}`}
              onClick={() => onJumpTo(idx)}
            >
              <div className="programScheduleRowTop">
                <div className="listPickTitle">
                  {it.order}. {it.name}
                </div>
                {isRunning ? (
                  <span className="scheduleBadge scheduleBadgeActive">Active</span>
                ) : isPaused ? (
                  <span className="scheduleBadge scheduleBadgePaused">Paused</span>
                ) : null}
              </div>
              <div className="programScheduleRowMeta">
                <span className="muted">{it.leaderName || '—'}</span>
                {isCurrent ? (
                  <span className="timeMono programScheduleTime">
                    {formatSignedMMSS(displayRemainingSec)}
                  </span>
                ) : (
                  <span className="timeMono muted">{formatSecToMmSs(it.durationSec)}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
