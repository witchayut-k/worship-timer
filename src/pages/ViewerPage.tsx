import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { StageCircleDisplay } from '../components/StageCircleDisplay'
import type { ProgramItem, RuntimePhase, WorshipEvent } from '../domain/types'
import { resolveEventSettings } from '../domain/types'
import { computeRemainingSec } from '../domain/time'
import { getStageTheme } from '../lib/displayTheme'
import { hasFirebaseConfig } from '../lib/firebase'
import { decodeLocalPayload } from '../lib/localPayload'
import { subscribeLocalRuntime } from '../lib/localSync'
import { watchEvent, watchProgramItems, watchRuntimeState } from '../lib/firestoreRepo'

export function ViewerPage() {
  const { eventId = '' } = useParams()
  return <ViewerPageInner key={eventId} eventId={eventId} />
}

function ViewerPageInner({ eventId }: { eventId: string }) {
  const [searchParams] = useSearchParams()
  const kiosk = searchParams.get('kiosk') === '1'

  const local = useMemo(() => decodeLocalPayload(eventId), [eventId])

  const [title, setTitle] = useState(() => local?.event.title ?? 'Worship Timer')
  const [eventMeta, setEventMeta] = useState<WorshipEvent | null>(() => local?.event ?? null)
  const [items, setItems] = useState<ProgramItem[]>(() => local?.items ?? [])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<RuntimePhase>('stopped')
  const [baseRemainingSec, setBaseRemainingSec] = useState(() => items[0]?.durationSec ?? 0)
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null)

  const nowMs = useNowMs(200)
  const remainingSec = computeRemainingSec({
    phase: phase === 'running' ? 'running' : phase === 'paused' ? 'paused' : 'stopped',
    startedAtMs,
    remainingSec: baseRemainingSec,
    nowMs,
  })

  const settings = resolveEventSettings(eventMeta)
  const stageTheme = getStageTheme({ remainingSec, settings })

  const current = items[currentIndex] ?? null
  const next = currentIndex + 1 < items.length ? items[currentIndex + 1] : null

  const isCloud = !eventId.startsWith('local-')
  const cloudReady = isCloud && hasFirebaseConfig()
  const isLocal = eventId.startsWith('local-')

  useEffect(() => {
    if (!cloudReady) return
    const unsubEvent = watchEvent(eventId, (ev) => {
      if (!ev) return
      setTitle(ev.title)
      setEventMeta(ev)
    })
    const unsubItems = watchProgramItems(eventId, (it) => {
      setItems(it)
    })
    const unsubState = watchRuntimeState(eventId, (s) => {
      if (!s) return
      setCurrentIndex(s.currentIndex)
      setPhase(s.phase)
      setBaseRemainingSec(s.remainingSec)
      setStartedAtMs(s.startedAtMs)
    })
    return () => {
      unsubEvent()
      unsubItems()
      unsubState()
    }
  }, [eventId, cloudReady])

  useEffect(() => {
    if (!isLocal) return
    return subscribeLocalRuntime(eventId, (s) => {
      setCurrentIndex(s.currentIndex)
      setPhase(s.phase)
      setBaseRemainingSec(s.remainingSec)
      setStartedAtMs(s.startedAtMs)
    })
  }, [eventId, isLocal])

  useEffect(() => {
    if (!kiosk) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        void document.documentElement.requestFullscreen?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [kiosk])

  return (
    <div className={`viewer ${kiosk ? 'kiosk' : ''}`}>
      {!kiosk ? (
        <div className="viewerTop">
          <div className="viewerTitle">{title}</div>
          <div className="viewerLinks">
            <Link className="topNavLink" to={`/start/${eventId}`}>
              Controller
            </Link>
            <button
              className="topNavLink"
              type="button"
              onClick={() => void document.documentElement.requestFullscreen?.()}
            >
              Fullscreen
            </button>
          </div>
        </div>
      ) : null}

      <div className="viewerMain">
        {current ? (
          <StageCircleDisplay
            remainingSec={remainingSec}
            durationSec={current.durationSec}
            currentName={current.name}
            currentLeader={current.leaderName}
            nextName={next?.name ?? null}
            nextLeader={next?.leaderName ?? null}
            theme={stageTheme}
          />
        ) : (
          <div className="stageEmpty muted">ไม่พบรายการโปรแกรม</div>
        )}
      </div>

      {!kiosk ? (
        <div className="viewerFooter muted">
          {isLocal
            ? 'Local demo: เปิด Controller ในอีกแท็บเพื่อ sync realtime'
            : 'Realtime ผ่าน Firebase — เปิด Controller เพื่อควบคุม'}
          {isCloud && !hasFirebaseConfig() ? ' · ต้องตั้งค่า Firebase สำหรับ cloud' : ''}
        </div>
      ) : (
        <div className="viewerFooter muted">กด F เพื่อ fullscreen</div>
      )}
    </div>
  )
}

function useNowMs(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
