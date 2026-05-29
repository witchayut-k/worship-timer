import type { LiveMessage } from '../domain/types'

type Props = {
  message: LiveMessage
}

export function StageLiveMessageOverlay({ message }: Props) {
  return (
    <div className="viewerLiveMessage" role="status" aria-live="polite">
      <p className="viewerLiveMessageText">{message.text}</p>
    </div>
  )
}
