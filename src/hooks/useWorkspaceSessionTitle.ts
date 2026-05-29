import { useMemo } from 'react'
import { useOptionalEventSession } from './useEventSession'

/** Title for the session bar inside EventWorkspace (avoids empty flash on Setup remount). */
export function useWorkspaceSessionTitle(
  explicitTitle: string | undefined,
  untitledLabel: string,
): string {
  const session = useOptionalEventSession()

  return useMemo(() => {
    const fromProps = explicitTitle?.trim()
    if (fromProps) return fromProps

    if (!session) return untitledLabel

    if (session.hasSetupDraft()) {
      const fromDraft = session.ensureSetupDraft().title.trim()
      if (fromDraft) return fromDraft
    }

    const fromEvent = session.event?.title?.trim()
    if (fromEvent) return fromEvent

    return untitledLabel
  }, [explicitTitle, session, untitledLabel])
}
