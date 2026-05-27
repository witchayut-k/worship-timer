import { useEffect, useRef } from 'react'
import { usePlan } from '../context/PlanProvider'
import { useLocale } from '../i18n/useLocale'

type LeaveControlModalProps = {
  open: boolean
  title: string
  leaveDestinationKey?: 'modal.goToServices' | 'modal.goToSetup'
  onGoToServices: () => void
  onEndControl: () => void
  onCancel: () => void
}

export function LeaveControlModal({
  open,
  title,
  leaveDestinationKey = 'modal.goToServices',
  onGoToServices,
  onEndControl,
  onCancel,
}: LeaveControlModalProps) {
  const { t } = useLocale()
  const { isFree } = usePlan()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="modalOverlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-control-title"
      >
        <header className="modalHeader">
          <h2 id="leave-control-title" className="modalTitle">
            {t('modal.leaveTitle')}
          </h2>
          <button className="btnGhost modalClose" type="button" onClick={onCancel} aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        <div className="modalBody">
          <p>{t(isFree ? 'modal.leaveBodyFree' : 'modal.leaveBody', { title })}</p>
        </div>

        <footer className="modalFooter">
          <button ref={cancelRef} className="btnPrimary" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className="btn" type="button" onClick={onGoToServices}>
            {t(leaveDestinationKey)}
          </button>
          <button className="btnDanger" type="button" onClick={onEndControl}>
            {t('modal.endControl')}
          </button>
        </footer>
      </div>
    </div>
  )
}

type SwitchControlModalProps = {
  open: boolean
  fromTitle: string
  toTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export function SwitchControlModal({
  open,
  fromTitle,
  toTitle,
  onConfirm,
  onCancel,
}: SwitchControlModalProps) {
  const { t } = useLocale()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="modalOverlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="switch-control-title"
      >
        <header className="modalHeader">
          <h2 id="switch-control-title" className="modalTitle">
            {t('modal.switchTitle')}
          </h2>
          <button className="btnGhost modalClose" type="button" onClick={onCancel} aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        <div className="modalBody">
          <p>{t('modal.switchBody', { from: fromTitle, to: toTitle })}</p>
        </div>

        <footer className="modalFooter">
          <button ref={cancelRef} className="btnPrimary" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className="btnGhost" type="button" onClick={onConfirm}>
            {t('modal.switchConfirm')}
          </button>
        </footer>
      </div>
    </div>
  )
}
