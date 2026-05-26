import { useState } from 'react'
import { useLocale } from '../i18n/useLocale'
import { getOutputLinks, type OutputLinkKind } from '../lib/outputLinks'

type Props = {
  eventId: string
  showOpenStage?: boolean
}

export function EventLinks({ eventId, showOpenStage = true }: Props) {
  const { t } = useLocale()
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

  const linkLabel = (kind: OutputLinkKind) =>
    kind === 'controller' ? t('modal.controllerTab') : t('modal.stageTab')

  return (
    <div className="linkGrid">
      {links.map((link) => (
        <div key={link.kind} className="linkRow">
          <div>
            <div className="linkLabel">{linkLabel(link.kind)}</div>
            <code className="linkUrl">{link.path}</code>
          </div>
          <div className="linkActions">
            <button className="btnGhost" type="button" onClick={() => copy(link.kind, link.url)}>
              {copied === link.kind ? t('common.copied') : t('common.copy')}
            </button>
            {showOpenStage && link.kind === 'stage' ? (
              <button className="btnPrimary" type="button" onClick={openStage}>
                {t('control.openStage')}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
