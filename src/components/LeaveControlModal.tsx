import { useEffect, useRef } from 'react'

type LeaveControlModalProps = {
  open: boolean
  title: string
  onGoToServices: () => void
  onEndControl: () => void
  onCancel: () => void
}

export function LeaveControlModal({
  open,
  title,
  onGoToServices,
  onEndControl,
  onCancel,
}: LeaveControlModalProps) {
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
            ออกจากหน้าควบคุม?
          </h2>
          <button className="btnGhost modalClose" type="button" onClick={onCancel} aria-label="ปิด">
            ✕
          </button>
        </header>

        <div className="modalBody">
          <p>
            กำลังควบคุม «{title}» — Timer และจอ Stage ยังทำงานอยู่
            คุณสามารถกลับมาควบคุมได้จากรายการ
          </p>
        </div>

        <footer className="modalFooter">
          <button ref={cancelRef} className="btnPrimary" type="button" onClick={onCancel}>
            ยกเลิก
          </button>
          <button className="btn" type="button" onClick={onGoToServices}>
            ไปรายการนมัสการ
          </button>
          <button className="btnDanger" type="button" onClick={onEndControl}>
            จบการควบคุม
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
            สลับห้องควบคุม?
          </h2>
          <button className="btnGhost modalClose" type="button" onClick={onCancel} aria-label="ปิด">
            ✕
          </button>
        </header>

        <div className="modalBody">
          <p>
            สลับจาก «{fromTitle}» ไป «{toTitle}»?
          </p>
        </div>

        <footer className="modalFooter">
          <button ref={cancelRef} className="btnPrimary" type="button" onClick={onCancel}>
            ยกเลิก
          </button>
          <button className="btnGhost" type="button" onClick={onConfirm}>
            สลับห้องควบคุม
          </button>
        </footer>
      </div>
    </div>
  )
}
