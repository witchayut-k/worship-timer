import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { hasFirebaseConfig } from '../lib/firebase'
import {
  acknowledgeDirectCloudSave,
  enqueueWorkspaceSync,
  flushWorkspaceSync,
  getWorkspaceSyncSnapshot,
  subscribeWorkspaceSync,
  type WorkspaceSyncSnapshot,
} from '../lib/workspaceCloudSync'
import { writeWorkspaceDraft, readWorkspaceDraft } from '../lib/workspaceDraftStore'
import {
  WorkspaceSyncContext,
  type PersistDraftParams,
  type WorkspaceSyncContextValue,
} from './workspaceSyncContext'

type Props = {
  eventId: string
  children: ReactNode
}

export function WorkspaceSyncProvider({ eventId, children }: Props) {
  const { uid } = useAuth()
  const cloudEnabled = hasFirebaseConfig() && Boolean(uid)
  const [snapshot, setSnapshot] = useState<WorkspaceSyncSnapshot>(() =>
    getWorkspaceSyncSnapshot(eventId),
  )
  const lastDraftRef = useRef<PersistDraftParams | null>(null)

  useEffect(() => {
    return subscribeWorkspaceSync(eventId, setSnapshot)
  }, [eventId])

  useEffect(() => {
    const local = readWorkspaceDraft(eventId)
    if (!local) return
    acknowledgeDirectCloudSave(eventId, local.revision, cloudEnabled)
  }, [cloudEnabled, eventId])

  const persistDraft = useCallback(
    (params: PersistDraftParams) => {
      const record = writeWorkspaceDraft(eventId, {
        event: params.event,
        items: params.items,
      })
      lastDraftRef.current = params

      enqueueWorkspaceSync(
        eventId,
        {
          event: params.event,
          items: params.items,
          revision: record.revision,
        },
        {
          touchRuntime: params.touchRuntime,
          initialState: params.initialState,
        },
        cloudEnabled,
      )
    },
    [cloudEnabled, eventId],
  )

  const flushCloud = useCallback(async () => {
    if (!cloudEnabled) {
      return getWorkspaceSyncSnapshot(eventId)
    }
    return flushWorkspaceSync(eventId)
  }, [cloudEnabled, eventId])

  const retrySync = useCallback(() => {
    const last = lastDraftRef.current
    if (!last || !cloudEnabled) return
    const record = writeWorkspaceDraft(eventId, {
      event: last.event,
      items: last.items,
    })
    enqueueWorkspaceSync(
      eventId,
      {
        event: last.event,
        items: last.items,
        revision: record.revision,
      },
      {
        touchRuntime: last.touchRuntime,
        initialState: last.initialState,
      },
      cloudEnabled,
    )
  }, [cloudEnabled, eventId])

  const value = useMemo<WorkspaceSyncContextValue>(
    () => ({
      eventId,
      cloudEnabled,
      snapshot,
      status: snapshot.status,
      persistDraft,
      flushCloud,
      retrySync,
    }),
    [cloudEnabled, eventId, flushCloud, persistDraft, retrySync, snapshot],
  )

  return (
    <WorkspaceSyncContext.Provider value={value}>{children}</WorkspaceSyncContext.Provider>
  )
}

export function useWorkspaceSync(): WorkspaceSyncContextValue {
  const ctx = useContext(WorkspaceSyncContext)
  if (!ctx) {
    throw new Error('useWorkspaceSync must be used within WorkspaceSyncProvider')
  }
  return ctx
}

export function useOptionalWorkspaceSync(): WorkspaceSyncContextValue | null {
  return useContext(WorkspaceSyncContext)
}
