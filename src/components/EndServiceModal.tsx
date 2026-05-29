import { useEffect, useRef } from 'react'
import { useLocale } from '../i18n/useLocale'

type EndServiceModalProps = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function EndServiceModal({ open, onConfirm, onCancel }: EndServiceModalProps) {
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
        aria-labelledby="end-service-title"
      >
        <header className="modalHeader">
          <h2 id="end-service-title" className="modalTitle">
            {t('modal.endServiceTitle')}
          </h2>
          <button className="btnGhost modalClose" type="button" onClick={onCancel} aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        <div className="modalBody">
          <p>{t('modal.endServiceBody')}</p>
        </div>

        <footer className="modalFooter">
          <button ref={cancelRef} className="btnPrimary" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className="btnDanger" type="button" onClick={onConfirm}>
            {t('control.endService')}
          </button>
        </footer>
      </div>
    </div>
  )
}
