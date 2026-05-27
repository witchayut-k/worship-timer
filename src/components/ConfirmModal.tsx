import { useEffect, useRef } from 'react'
import { useLocale } from '../i18n/useLocale'

type ConfirmModalProps = {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmModalProps) {
  const { t } = useLocale()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = 'confirm-modal-title'

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
      <div className="modalCard" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modalHeader">
          <h2 id={titleId} className="modalTitle">
            {title}
          </h2>
          <button
            className="btnGhost modalClose"
            type="button"
            onClick={onCancel}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </header>

        <div className="modalBody">
          <p>{body}</p>
        </div>

        <footer className="modalFooter">
          <button ref={cancelRef} className="btnPrimary" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button
            className={variant === 'danger' ? 'btnDanger' : 'btn'}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}
