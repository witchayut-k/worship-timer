import { useEffect, useRef, useState, type ReactNode } from 'react'
import { getStageLayoutDimensions } from '../config/stageTemplates.config'
import type { StageDisplayTemplate } from '../domain/types'
import { useStageDisplayScale } from '../hooks/useStageDisplayScale'
import type { StageTheme } from '../lib/displayTheme'
import { StageDisplay } from './StageDisplay'
import { useLocale } from '../i18n/useLocale'
import { getOutputLinks, type OutputLinkKind } from '../lib/outputLinks'

type Props = {
  open: boolean
  onClose: () => void
  eventId: string
  stageTemplate: StageDisplayTemplate
  remainingSec: number
  durationSec: number
  currentName: string
  currentLeader: string
  nextName: string | null
  nextLeader: string | null
  theme: StageTheme
  paused?: boolean
}

function MonitorIcon() {
  return (
    <svg
      className="controlTopActionIcon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  )
}

function ControllerTabThumb() {
  return (
    <div className="outputLinksTabThumb outputLinksTabThumbController" aria-hidden>
      <div className="outputLinksTabThumbTimer">10:00</div>
      <div className="outputLinksTabThumbBtns">
        <span />
        <span />
      </div>
    </div>
  )
}

function StageTabThumb() {
  return (
    <div className="outputLinksTabThumb outputLinksTabThumbStage" aria-hidden>
      <div className="outputLinksTabThumbRing" />
      <div className="outputLinksTabThumbTime">10:00</div>
    </div>
  )
}

function ControllerPreviewMock() {
  return (
    <div className="outputLinksControllerMock" aria-hidden>
      <div className="outputLinksControllerMockTimer">10:00</div>
      <div className="outputLinksControllerMockMeta">
        <span>Prev — Welcome</span>
        <span>Current — Worship</span>
        <span>Next — Message</span>
      </div>
      <div className="outputLinksControllerMockControls">
        <span className="outputLinksControllerMockBtn outputLinksControllerMockBtnPrimary">
          Start
        </span>
        <span className="outputLinksControllerMockBtn">Pause</span>
        <span className="outputLinksControllerMockBtn">Next</span>
      </div>
    </div>
  )
}

function StagePreviewFrame({
  stageTemplate,
  remainingSec,
  durationSec,
  currentName,
  currentLeader,
  nextName,
  nextLeader,
  theme,
  paused,
}: Omit<Props, 'open' | 'onClose' | 'eventId'>) {
  const { width, height } = getStageLayoutDimensions(stageTemplate)
  const { frameRef, scaleRef, displayRef } = useStageDisplayScale(width, height, [
    remainingSec,
    currentName,
    currentLeader,
    nextName,
    nextLeader,
    durationSec,
    stageTemplate,
  ])

  return (
    <div className="outputLinksPreviewFrame" ref={frameRef}>
      <div className="outputLinksPreviewScale" ref={scaleRef}>
        <div ref={displayRef} className="outputLinksPreviewDisplayWrap">
          <StageDisplay
            template={stageTemplate}
            remainingSec={remainingSec}
            durationSec={durationSec}
            currentName={currentName}
            currentLeader={currentLeader}
            nextName={nextName}
            nextLeader={nextLeader}
            theme={theme}
            paused={paused}
          />
        </div>
      </div>
    </div>
  )
}

export function OutputLinksModal({
  open,
  onClose,
  eventId,
  stageTemplate,
  remainingSec,
  durationSec,
  currentName,
  currentLeader,
  nextName,
  nextLeader,
  theme,
  paused = false,
}: Props) {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = useState<OutputLinkKind>('stage')
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const links = getOutputLinks(eventId)
  const activeLink = links.find((l) => l.kind === activeTab) ?? links[0]

  useEffect(() => {
    if (!open) return
    setActiveTab('stage')
    setCopied(false)
    closeRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const close = () => {
    setCopied(false)
    onClose()
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(activeLink.url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const openLink = () => {
    window.open(activeLink.path, '_blank', 'noopener,noreferrer')
  }

  const tabs: { kind: OutputLinkKind; label: string; thumb: ReactNode }[] = [
    { kind: 'controller', label: t('modal.controllerTab'), thumb: <ControllerTabThumb /> },
    { kind: 'stage', label: t('modal.stageTab'), thumb: <StageTabThumb /> },
  ]

  return (
    <div
      className="modalOverlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        className="modalCard modalCardWide outputLinksModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="output-links-title"
      >
        <header className="modalHeader">
          <h2 id="output-links-title" className="modalTitle outputLinksModalTitle">
            <MonitorIcon />
            {t('modal.outputLinksTitle')}
          </h2>
          <button
            ref={closeRef}
            className="btnGhost modalClose"
            type="button"
            onClick={close}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </header>

        <div className="outputLinksTabs" role="tablist" aria-label={t('modal.outputTypes')}>
          {tabs.map((tab) => (
            <button
              key={tab.kind}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.kind}
              className={`outputLinksTab ${activeTab === tab.kind ? 'outputLinksTabActive' : ''}`}
              onClick={() => {
                setCopied(false)
                setActiveTab(tab.kind)
              }}
            >
              {tab.thumb}
              <span className="outputLinksTabLabel">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="modalBody outputLinksBody">
          <div className="outputLinksPreviewCol">
            <div className="outputLinksPreviewLabel">
              {activeTab === 'stage' ? t('modal.stagePreview') : t('modal.controllerPreview')}
            </div>
            {activeTab === 'stage' ? (
              <StagePreviewFrame
                stageTemplate={stageTemplate}
                remainingSec={remainingSec}
                durationSec={durationSec}
                currentName={currentName}
                currentLeader={currentLeader}
                nextName={nextName}
                nextLeader={nextLeader}
                theme={theme}
                paused={paused}
              />
            ) : (
              <div className="outputLinksPreviewFrame outputLinksPreviewFrameMock">
                <ControllerPreviewMock />
              </div>
            )}
          </div>

          <div className="outputLinksInfoCol">
            <h3 className="outputLinksInfoTitle">
              {activeTab === 'controller' ? t('modal.controllerTab') : t('modal.stageTab')}
            </h3>
            {activeTab === 'controller' ? (
              <p className="outputLinksInfoText">{t('modal.controllerDesc')}</p>
            ) : (
              <>
                <p className="outputLinksInfoText">{t('modal.stageDesc')}</p>
                <button className="btnPrimary btnSm" type="button" onClick={openLink}>
                  {t('control.openFullscreen')}
                </button>
              </>
            )}
            <div className="outputLinksPath">
              <span className="outputLinksPathLabel">{t('common.path')}</span>
              <code>{activeLink.path}</code>
            </div>
          </div>
        </div>

        <footer className="outputLinksFooter">
          <div className="outputLinksUrlBar">
            <input
              className="outputLinksUrlInput"
              type="text"
              readOnly
              value={activeLink.url}
              aria-label="Output link URL"
            />
            <button className="btnGhost" type="button" onClick={copyUrl}>
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <button className="outputLinksOpenLink btnGhost" type="button" onClick={openLink}>
            {t('common.openLink')}
          </button>
        </footer>
      </div>
    </div>
  )
}

export { MonitorIcon }
