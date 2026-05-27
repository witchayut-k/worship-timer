import { useEffect, useMemo, useState } from 'react'
import type { ProgramItem, RuntimePhase, WorshipEvent } from '../domain/types'
import { computeRemainingSec } from '../domain/time'
import { hasFirebaseConfig } from '../lib/firebase'
import { isOfflineEventId, resolveEventPayload } from '../lib/eventSource'
import { subscribeLocalRuntime } from '../lib/localSync'
import { watchEvent, watchProgramItems, watchRuntimeState } from '../lib/firestoreRepo'
import { useLocale } from '../i18n/useLocale'

export function useEventLiveSync(eventId: string) {
  const { t } = useLocale()
  const local = useMemo(() => resolveEventPayload(eventId), [eventId])

  const [title, setTitle] = useState(() => local?.event.title ?? '')
  const [eventMeta, setEventMeta] = useState<WorshipEvent | null>(() => local?.event ?? null)
  const [items, setItems] = useState<ProgramItem[]>(() => local?.items ?? [])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<RuntimePhase>('stopped')
  const [baseRemainingSec, setBaseRemainingSec] = useState(() => local?.items[0]?.durationSec ?? 0)
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null)
  const [blackout, setBlackout] = useState(false)
  const [manualFlashUntilMs, setManualFlashUntilMs] = useState<number | null>(null)

  const nowMs = useNowMs(200)
  const remainingSec = computeRemainingSec({
    phase: phase === 'running' ? 'running' : phase === 'paused' ? 'paused' : 'stopped',
    startedAtMs,
    remainingSec: baseRemainingSec,
    nowMs,
  })

  const isCloud = !isOfflineEventId(eventId)
  const cloudReady = isCloud && hasFirebaseConfig()
  const isLocal = isOfflineEventId(eventId)
  const displayTitle = title.trim() || t('event.untitled')

  const current = items[currentIndex] ?? null
  const next = currentIndex + 1 < items.length ? items[currentIndex + 1] : null

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
      setBlackout(s.blackout ?? false)
      setManualFlashUntilMs(s.manualFlashUntilMs ?? null)
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
      setBlackout(s.blackout ?? false)
      setManualFlashUntilMs(s.manualFlashUntilMs ?? null)
    })
  }, [eventId, isLocal])

  return {
    title,
    eventMeta,
    items,
    currentIndex,
    phase,
    remainingSec,
    blackout,
    manualFlashUntilMs,
    nowMs,
    isCloud,
    cloudReady,
    isLocal,
    displayTitle,
    current,
    next,
  }
}

function useNowMs(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
