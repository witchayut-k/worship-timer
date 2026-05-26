import { useEffect, useMemo, useState } from 'react'
import { formatSecToMmSs } from '../domain/time'
import {
  parseSpreadsheetTsv,
  type ParsedProgramRow,
} from '../domain/spreadsheetImport'

export type SpreadsheetImportMode = 'replace' | 'append'

type SpreadsheetImportModalProps = {
  open: boolean
  onClose: () => void
  onImport: (rows: ParsedProgramRow[], mode: SpreadsheetImportMode) => void
}

export function SpreadsheetImportModal({ open, onClose, onImport }: SpreadsheetImportModalProps) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<SpreadsheetImportMode>('replace')
  const [clipboardError, setClipboardError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setText('')
    setMode('replace')
    setClipboardError(null)
  }, [open])

  const parsed = useMemo(() => parseSpreadsheetTsv(text), [text])

  const onPasteFromClipboard = async () => {
    setClipboardError(null)
    try {
      const clip = await navigator.clipboard.readText()
      if (!clip.trim()) {
        setClipboardError('คลิปบอร์ดว่าง — copy ตารางจาก Excel หรือ Google Sheets ก่อน')
        return
      }
      setText(clip)
    } catch {
      setClipboardError('อ่านคลิปบอร์ดไม่ได้ — วางข้อมูลในช่องด้านล่างแทน (Ctrl+V)')
    }
  }

  const onConfirm = () => {
    if (!parsed.rows.length) return
    onImport(parsed.rows, mode)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="modalOverlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modalCard" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
        <header className="modalHeader">
          <h2 id="import-modal-title" className="modalTitle">
            นำเข้าจากตาราง
          </h2>
          <button className="btnGhost modalClose" type="button" onClick={onClose} aria-label="ปิด">
            ✕
          </button>
        </header>

        <div className="modalBody stack">
          <p className="muted modalHint">
            เลือกช่วงตารางใน Excel หรือ Google Sheets แล้ว Copy (Ctrl+C / Cmd+C) จากนั้นวางที่นี่
          </p>

          <div className="modalActionsRow">
            <button className="btn" type="button" onClick={() => void onPasteFromClipboard()}>
              วางจากคลิปบอร์ด
            </button>
          </div>
          {clipboardError ? <p className="saveNotice saveNoticeError">{clipboardError}</p> : null}

          <label className="field">
            <div className="label">ข้อมูลตาราง (วางด้วย Ctrl+V)</div>
            <textarea
              className="importTextarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="วางข้อมูลที่ copy จากตารางที่นี่…"
              rows={6}
              spellCheck={false}
            />
          </label>

          {text.trim() ? (
            <section className="importPreview">
              <div className="importPreviewHead">
                <span className="importPreviewTitle">
                  ตัวอย่าง ({parsed.rows.length} รายการ
                  {parsed.skipped > 0 ? `, ข้าม ${parsed.skipped} แถว` : ''})
                </span>
              </div>
              {parsed.rows.length > 0 ? (
                <div className="importPreviewTableWrap">
                  <table className="importPreviewTable">
                    <thead>
                      <tr>
                        <th>รายการ</th>
                        <th>ผู้นำ</th>
                        <th>เวลา</th>
                        <th>ไฟ</th>
                        <th>มีเดีย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.map((row, i) => (
                        <tr key={`${row.name}-${i}`}>
                          <td>{row.name}</td>
                          <td>{row.leaderName || '—'}</td>
                          <td className="timeMono">{formatSecToMmSs(row.durationSec)}</td>
                          <td>{row.roomLights || '—'}</td>
                          <td>{row.mediaNote || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">ยังไม่พบรายการที่นำเข้าได้</p>
              )}
              {parsed.warnings.length > 0 ? (
                <ul className="importWarnings">
                  {parsed.warnings.map((w, i) => (
                    <li key={`${w}-${i}`}>{w}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <fieldset className="importModeFieldset">
            <legend className="label">เมื่อนำเข้า</legend>
            <label className="importModeOption">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />
              แทนที่รายการทั้งหมด
            </label>
            <label className="importModeOption">
              <input
                type="radio"
                name="importMode"
                value="append"
                checked={mode === 'append'}
                onChange={() => setMode('append')}
              />
              ต่อท้ายรายการเดิม
            </label>
          </fieldset>
        </div>

        <footer className="modalFooter">
          <button className="btnGhost" type="button" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            className="btnPrimary"
            type="button"
            disabled={!parsed.rows.length}
            onClick={onConfirm}
          >
            นำเข้า {parsed.rows.length > 0 ? `(${parsed.rows.length})` : ''}
          </button>
        </footer>
      </div>
    </div>
  )
}
