import { useState } from 'react'
import { getOutputLinks, type OutputLinkKind } from '../lib/outputLinks'

type Props = {
  eventId: string
  showOpenStage?: boolean
}

export function EventLinks({ eventId, showOpenStage = true }: Props) {
  const [copied, setCopied] = useState<OutputLinkKind | null>(null)
  const links = getOutputLinks(eventId)
  const stageLink = links.find((l) => l.kind === 'stage')!

  const copy = async (which: OutputLinkKind, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(which)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      // ignore
    }
  }

  const openStage = () => {
    window.open(stageLink.path, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="linkGrid">
      {links.map((link) => (
        <div key={link.kind} className="linkRow">
          <div>
            <div className="linkLabel">{link.label}</div>
            <code className="linkUrl">{link.path}</code>
          </div>
          <div className="linkActions">
            <button className="btnGhost" type="button" onClick={() => copy(link.kind, link.url)}>
              {copied === link.kind ? 'Copied' : 'Copy'}
            </button>
            {showOpenStage && link.kind === 'stage' ? (
              <button className="btnPrimary" type="button" onClick={openStage}>
                เปิดจอเวที
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
