import type { ReactNode } from 'react'
import type { LiveMessage } from '../../domain/types'
import { StageLiveMessageBar } from '../StageLiveMessageBar'

type Props = {
  activeMessage?: LiveMessage | null
  children: ReactNode
}

export function StageDisplayShell({ activeMessage, children }: Props) {
  return (
    <div className="stageShell">
      {activeMessage ? (
        <StageLiveMessageBar key={activeMessage.sentAtMs} message={activeMessage} />
      ) : null}
      <div className="stageShellBody">{children}</div>
    </div>
  )
}
