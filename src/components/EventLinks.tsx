import { useState } from 'react'

type Props = {
  eventId: string
  showOpenStage?: boolean
}

export function EventLinks({ eventId, showOpenStage = true }: Props) {
  const [copied, setCopied] = useState<'controller' | 'stage' | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const controllerPath = `/start/${eventId}`
  const stagePath = `/view/${eventId}?kiosk=1`
  const controllerUrl = `${origin}${controllerPath}`
  const stageUrl = `${origin}${stagePath}`

  const copy = async (which: 'controller' | 'stage', url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(which)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      // ignore
    }
  }

  const openStage = () => {
    window.open(stagePath, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="linkGrid">
      <div className="linkRow">
        <div>
          <div className="linkLabel">Controller</div>
          <code className="linkUrl">{controllerPath}</code>
        </div>
        <div className="linkActions">
          <button className="btnGhost" type="button" onClick={() => copy('controller', controllerUrl)}>
            {copied === 'controller' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="linkRow">
        <div>
          <div className="linkLabel">Stage display</div>
          <code className="linkUrl">{stagePath}</code>
        </div>
        <div className="linkActions">
          <button className="btnGhost" type="button" onClick={() => copy('stage', stageUrl)}>
            {copied === 'stage' ? 'Copied' : 'Copy'}
          </button>
          {showOpenStage ? (
            <button className="btnPrimary" type="button" onClick={openStage}>
              เปิดจอเวที
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
