import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ControlShell } from '../components/ControlShell'
import { DurationInput } from '../components/DurationInput'
import { EventLinks } from '../components/EventLinks'
import type { ProgramItem, WorshipEvent } from '../domain/types'
import { resolveEventSettings } from '../domain/types'
import { formatSignedMMSS } from '../domain/time'
import { getTimerThemeClasses } from '../lib/displayTheme'
import { hasFirebaseConfig } from '../lib/firebase'
import { isOfflineEventId, resolveEventPayload } from '../lib/eventSource'
import { publishLocalRuntime } from '../lib/localSync'
import { watchEvent, watchProgramItems, watchRuntimeState, writeRuntimeState } from '../lib/firestoreRepo'
import { deriveLocalDisplay, initialRuntimeState, reduceRuntimeState } from '../lib/runtimeEngine'

export function StartPage() {
  const { eventId = '' } = useParams()
  return <StartPageInner key={eventId} eventId={eventId} />
}

function StartPageInner({ eventId }: { eventId: string }) {
  const local = useMemo(() => resolveEventPayload(eventId), [eventId])

  const [title, setTitle] = useState(() => local?.event.title ?? 'Worship Timer')
  const [eventMeta, setEventMeta] = useState<WorshipEvent | null>(() => local?.event ?? null)
  const [items, setItems] = useState<ProgramItem[]>(() => local?.items ?? [])

  const [state, dispatch] = useReducer(reduceRuntimeState, initialRuntimeState({ items }))
  const nowMs = useNowMs(state.phase === 'running' ? 200 : 1000)
  const display = deriveLocalDisplay({ state, nowMs })
  const settings = resolveEventSettings(eventMeta)
  const timerClass = getTimerThemeClasses({ remainingSec: display.remainingSec, settings })

  const current = items[state.currentIndex] ?? null
  const prev = state.currentIndex > 0 ? items[state.currentIndex - 1] : null
  const next = state.currentIndex + 1 < items.length ? items[state.currentIndex + 1] : null

  const timeText = formatSignedMMSS(display.remainingSec)

  const isCloud = !isOfflineEventId(eventId)
  const cloudReady = isCloud && hasFirebaseConfig()
  const isLocal = isOfflineEventId(eventId)

  const hydratingRef = useRef(false)

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
      hydratingRef.current = true
      dispatch({ type: 'hydrate', state: s })
      queueMicrotask(() => {
        hydratingRef.current = false
      })
    })
    return () => {
      unsubEvent()
      unsubItems()
      unsubState()
    }
  }, [eventId, cloudReady])

  useEffect(() => {
    if (!cloudReady) return
    if (!items.length) return
    const nextInitial = initialRuntimeState({ items })
    void writeRuntimeState(eventId, nextInitial).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, cloudReady])

  useEffect(() => {
    if (!cloudReady) return
    if (hydratingRef.current) return
    void writeRuntimeState(eventId, state).catch(() => {})
  }, [eventId, cloudReady, state])

  useEffect(() => {
    if (!isLocal) return
    publishLocalRuntime(eventId, state)
  }, [eventId, isLocal, state])

  const start = () => {
    if (!current) return
    dispatch({ type: 'start', nowMs: Date.now() })
  }

  const pause = () => {
    if (state.phase !== 'running') return
    dispatch({ type: 'pause', nowMs: Date.now() })
  }

  const resetCurrent = () => {
    if (!current) return
    dispatch({ type: 'resetCurrent', nowMs: Date.now(), items })
  }

  const jumpTo = (idx: number) => {
    dispatch({ type: 'jumpTo', nowMs: Date.now(), index: idx, items })
  }

  const adjustSec = (delta: number) => {
    dispatch({ type: 'adjust', nowMs: Date.now(), deltaSec: delta })
  }

  const updateCurrentDuration = (newSec: number) => {
    if (!current) return
    setItems((prevItems) =>
      prevItems.map((it, idx) =>
        idx === state.currentIndex ? { ...it, durationSec: Math.max(0, Math.trunc(newSec || 0)) } : it,
      ),
    )
    dispatch({ type: 'setRemaining', nowMs: Date.now(), remainingSec: Math.max(0, Math.trunc(newSec || 0)) })
  }

  return (
    <ControlShell activeNav="control" eventId={eventId} eventTitle={title}>
      <div className="controlContent">
        {isCloud && !hasFirebaseConfig() ? (
          <div className="card">
            <h1 className="pageTitle">Cloud mode ต้องตั้งค่า Firebase</h1>
            <div className="muted">
              สร้างไฟล์ <code>.env.local</code> จาก <code>.env.example</code> แล้วเติมค่า Firebase config
              จากนั้นรีเฟรชหน้า หรือใช้ <Link to="/setup">Local Demo</Link> ได้ทันที
            </div>
          </div>
        ) : null}

        <section className="card">
          <div className="cardHeader">
            <h2 className="cardTitle">ลิงก์แยกจอ</h2>
          </div>
          <EventLinks eventId={eventId} />
        </section>

        {!current ? (
          <div className="card">
            <h1 className="pageTitle">Start</h1>
            <div className="muted">
              ไม่พบรายการโปรแกรม — กลับไปที่ <Link to="/setup">Setup</Link>
            </div>
          </div>
        ) : (
          <>
            <section className={`timerCard ${timerClass}`}>
              <div className="timerMeta">
                <div className="metaLine">
                  <span className="metaKey">Prev</span>
                  <span className="metaVal">
                    {prev ? `${prev.name}${prev.leaderName ? ` — ${prev.leaderName}` : ''}` : '-'}
                  </span>
                </div>
                <div className="metaLine">
                  <span className="metaKey">Current</span>
                  <span className="metaVal">
                    <b>{current.name}</b>
                    {current.leaderName ? <span className="muted"> — {current.leaderName}</span> : null}
                  </span>
                </div>
                <div className="metaLine">
                  <span className="metaKey">Next</span>
                  <span className="metaVal">
                    {next ? `${next.name}${next.leaderName ? ` — ${next.leaderName}` : ''}` : '-'}
                  </span>
                </div>
              </div>

              <div className="timerValue" aria-label="timer">
                {timeText}
              </div>

              <div className="controls">
                <button
                  className="btnGhost"
                  type="button"
                  onClick={() => jumpTo(state.currentIndex - 1)}
                  disabled={state.currentIndex === 0}
                >
                  ◀ Prev
                </button>

                {state.phase !== 'running' ? (
                  <button className="btnPrimary" type="button" onClick={start}>
                    Start
                  </button>
                ) : (
                  <button className="btn" type="button" onClick={pause}>
                    Pause
                  </button>
                )}

                <button
                  className="btnGhost"
                  type="button"
                  onClick={() => jumpTo(state.currentIndex + 1)}
                  disabled={state.currentIndex + 1 >= items.length}
                >
                  Next ▶
                </button>
              </div>

              <div className="controls">
                <button className="btn" type="button" onClick={resetCurrent}>
                  Reset
                </button>
                <div className="pillGroup">
                  <button className="btnGhost" type="button" onClick={() => adjustSec(-60)}>
                    -60s
                  </button>
                  <button className="btnGhost" type="button" onClick={() => adjustSec(-10)}>
                    -10s
                  </button>
                  <button className="btnGhost" type="button" onClick={() => adjustSec(+10)}>
                    +10s
                  </button>
                  <button className="btnGhost" type="button" onClick={() => adjustSec(+60)}>
                    +60s
                  </button>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <h2 className="cardTitle">แก้เวลาโปรแกรมปัจจุบัน</h2>
                <div className="muted">การแก้ตรงนี้จะตั้งเวลาใหม่และหยุด (กด Start เมื่อพร้อม)</div>
              </div>
              <DurationInput valueSec={current.durationSec} onChangeSec={updateCurrentDuration} />
            </section>

            <section className="card">
              <div className="cardHeader">
                <h2 className="cardTitle">รายการทั้งหมด</h2>
              </div>
              <div className="list">
                {items.map((it, idx) => (
                  <button
                    key={`${it.order}-${it.name}`}
                    type="button"
                    className={`listPick ${idx === state.currentIndex ? 'active' : ''}`}
                    onClick={() => jumpTo(idx)}
                  >
                    <div className="listPickTitle">
                      {it.order}. {it.name}
                    </div>
                    <div className="muted">{it.leaderName || '-'}</div>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </ControlShell>
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
