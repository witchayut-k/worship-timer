import type { RuntimeState } from '../domain/types'

function channelName(eventId: string): string {
  return `worship-timer:${eventId}`
}

export function publishLocalRuntime(eventId: string, state: RuntimeState): void {
  if (!eventId.startsWith('local-')) return
  const ch = new BroadcastChannel(channelName(eventId))
  ch.postMessage({ type: 'runtime', state })
  ch.close()
}

export function subscribeLocalRuntime(
  eventId: string,
  cb: (state: RuntimeState) => void,
): () => void {
  if (!eventId.startsWith('local-')) return () => {}
  const ch = new BroadcastChannel(channelName(eventId))
  ch.onmessage = (e: MessageEvent<{ type?: string; state?: RuntimeState }>) => {
    if (e.data?.type === 'runtime' && e.data.state) cb(e.data.state)
  }
  return () => ch.close()
}
