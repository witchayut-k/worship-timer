import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { StageDisplayTemplate } from '../domain/types'
import type { StageTheme } from '../lib/displayTheme'
import { useLocale } from '../i18n/useLocale'
import { getOutputLinks, type OutputLinkKind } from '../lib/outputLinks'
import { getStagePreviewImageSrc } from '../lib/stagePreviewImages'
import { MonitorIcon } from './SetupIcons'

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

function CrewTabThumb() {
  return (
    <div className="outputLinksTabThumb outputLinksTabThumbCrew" aria-hidden>
      <span className="outputLinksTabThumbCrewHero" />
      <div className="outputLinksTabThumbCrewCards">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

function CrewPreviewMock() {
  return (
    <div className="outputLinksCrewMock" aria-hidden>
      <div className="outputLinksCrewMockDone">Done · Welcome</div>
      <div className="outputLinksCrewMockHero">
        <div className="outputLinksCrewMockHeroTop">
          <span className="outputLinksCrewMockLive">LIVE</span>
          <span className="outputLinksCrewMockHost">Sarah M.</span>
        </div>
        <div className="outputLinksCrewMockHeroMain">
          <div className="outputLinksCrewMockHeroInfo">
            <span className="outputLinksCrewMockTitle">Worship Set</span>
            <span className="outputLinksCrewMockLeader">Lead: Sarah M.</span>
          </div>
          <div className="outputLinksCrewMockTimerBlock">
            <span className="outputLinksCrewMockLabel">Remaining</span>
            <span className="outputLinksCrewMockTimer">04:23</span>
          </div>
        </div>
        <div className="outputLinksCrewMockProgress">
          <span className="outputLinksCrewMockProgressFill" />
        </div>
      </div>
      <div className="outputLinksCrewMockUpcoming">
        <div className="outputLinksCrewMockCard">
          <span className="outputLinksCrewMockCardLabel">Up next</span>
          <span className="outputLinksCrewMockCardTitle">Prayer</span>
          <div className="outputLinksCrewMockCardCues">
            <span className="outputLinksCrewMockCue outputLinksCrewMockCueLighting">Dim house</span>
            <span className="outputLinksCrewMockCue outputLinksCrewMockCueMedia">Hymn slide</span>
          </div>
        </div>
        <div className="outputLinksCrewMockCard">
          <span className="outputLinksCrewMockCardLabel">Then</span>
          <span className="outputLinksCrewMockCardTitle">Sermon</span>
          <div className="outputLinksCrewMockCardCues">
            <span className="outputLinksCrewMockCue outputLinksCrewMockCueMedia">Intro vid</span>
          </div>
        </div>
      </div>
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

function StagePreviewImage({ stageTemplate }: { stageTemplate: StageDisplayTemplate }) {
  const { t } = useLocale()
  const alt =
    stageTemplate === 'minimal'
      ? t('setupAside.templateMinimal')
      : stageTemplate === 'bar'
        ? t('setupAside.templateBar')
        : t('setupAside.templateCircle')

  return (
    <div className="outputLinksPreviewFrame outputLinksPreviewFrameImage">
      <img
        className="outputLinksPreviewImage"
        src={getStagePreviewImageSrc(stageTemplate)}
        alt={alt}
      />
    </div>
  )
}

export function OutputLinksModal({
  open,
  onClose,
  eventId,
  stageTemplate,
  remainingSec: _remainingSec,
  durationSec: _durationSec,
  currentName: _currentName,
  currentLeader: _currentLeader,
  nextName: _nextName,
  nextLeader: _nextLeader,
  theme: _theme,
  paused: _paused,
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
    { kind: 'stage', label: t('modal.stageTab'), thumb: <StageTabThumb /> },
    { kind: 'crew', label: t('modal.crewTab'), thumb: <CrewTabThumb /> },
    { kind: 'controller', label: t('modal.controllerTab'), thumb: <ControllerTabThumb /> },
  ]

  const previewLabel =
    activeTab === 'stage'
      ? t('modal.stagePreview')
      : activeTab === 'crew'
        ? t('modal.crewPreview')
        : t('modal.controllerPreview')

  const infoTitle =
    activeTab === 'stage'
      ? t('modal.stageTab')
      : activeTab === 'crew'
        ? t('modal.crewTab')
        : t('modal.controllerTab')

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
            <div className="outputLinksPreviewLabel">{previewLabel}</div>
            {activeTab === 'stage' ? (
              <StagePreviewImage stageTemplate={stageTemplate} />
            ) : (
              <div className="outputLinksPreviewFrame outputLinksPreviewFrameMock">
                {activeTab === 'crew' ? <CrewPreviewMock /> : <ControllerPreviewMock />}
              </div>
            )}
          </div>

          <div className="outputLinksInfoCol">
            <h3 className="outputLinksInfoTitle">{infoTitle}</h3>
            {activeTab === 'controller' ? (
              <p className="outputLinksInfoText">{t('modal.controllerDesc')}</p>
            ) : activeTab === 'crew' ? (
              <p className="outputLinksInfoText">{t('modal.crewDesc')}</p>
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
