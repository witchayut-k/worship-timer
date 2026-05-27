import { useMemo, useState } from 'react'
import { useLocale } from '../i18n/useLocale'
import { formatSecToMmSs } from '../domain/time'
import {
  parseSpreadsheetTsv,
  type ParsedProgramRow,
} from '../domain/spreadsheetImport'
import {
  buildImportTemplateTsv,
  type ImportTemplateRow,
} from '../domain/spreadsheetImportTemplate'
import { translateImportWarning } from '../i18n/translate'

export type SpreadsheetImportMode = 'replace' | 'append'

type ImportModalTab = 'template' | 'import'

type SpreadsheetImportModalProps = {
  open: boolean
  onClose: () => void
  onImport: (rows: ParsedProgramRow[], mode: SpreadsheetImportMode) => void
}

export function SpreadsheetImportModal({ open, onClose, onImport }: SpreadsheetImportModalProps) {
  if (!open) return null
  return <SpreadsheetImportModalInner onClose={onClose} onImport={onImport} />
}

function SpreadsheetImportModalInner({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: (rows: ParsedProgramRow[], mode: SpreadsheetImportMode) => void
}) {
  const { t, locale } = useLocale()
  const [text, setText] = useState('')
  const [mode, setMode] = useState<SpreadsheetImportMode>('append')
  const [clipboardError, setClipboardError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ImportModalTab>('import')
  const [templateCopied, setTemplateCopied] = useState(false)
  const [templateCopyError, setTemplateCopyError] = useState<string | null>(null)

  const parsed = useMemo(() => parseSpreadsheetTsv(text), [text])

  const templateHeaders = useMemo(
    (): [string, string, string, string, string] => [
      t('import.colItem'),
      t('import.colLeader'),
      t('import.colTime'),
      t('import.colLights'),
      t('import.colMedia'),
    ],
    [t],
  )

  const templateSampleRows = useMemo((): ImportTemplateRow[] => {
    return [
      {
        item: t('import.templateSample1Item'),
        leader: t('import.templateSample1Leader'),
        duration: t('import.templateSample1Duration'),
        lights: t('import.templateSample1Lights'),
        media: t('import.templateSample1Media'),
      },
      {
        item: t('import.templateSample2Item'),
        leader: t('import.templateSample2Leader'),
        duration: t('import.templateSample2Duration'),
        lights: t('import.templateSample2Lights'),
        media: t('import.templateSample2Media'),
      },
    ]
  }, [t])

  const displayCell = (value: string) => (value.trim() ? value : '—')

  const templateTsv = useMemo(
    () => buildImportTemplateTsv(templateHeaders, templateSampleRows),
    [templateHeaders, templateSampleRows],
  )

  const onCopyTemplate = async () => {
    setTemplateCopyError(null)
    setTemplateCopied(false)
    try {
      await navigator.clipboard.writeText(templateTsv)
      setTemplateCopied(true)
      setActiveTab('import')
    } catch {
      setTemplateCopyError(t('import.templateCopyFailed'))
    }
  }

  const onPasteFromClipboard = async () => {
    setClipboardError(null)
    try {
      const clip = await navigator.clipboard.readText()
      if (!clip.trim()) {
        setClipboardError(t('import.clipboardEmpty'))
        return
      }
      setText(clip)
    } catch {
      setClipboardError(t('import.clipboardDenied'))
    }
  }

  const onConfirm = () => {
    if (!parsed.rows.length) return
    onImport(parsed.rows, mode)
    onClose()
  }

  const previewSkipped =
    parsed.skipped > 0 ? t('import.previewSkipped', { count: parsed.skipped }) : ''

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
            {t('import.title')}
          </h2>
          <button className="btnGhost modalClose" type="button" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        <div className="importModalTabs" role="tablist" aria-label={t('import.tabsAriaLabel')}>
          <button
            type="button"
            role="tab"
            id="import-tab-import"
            aria-selected={activeTab === 'import'}
            aria-controls="import-panel-import"
            className={`importModalTab ${activeTab === 'import' ? 'importModalTabActive' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            {t('import.tabImport')}
          </button>
          <button
            type="button"
            role="tab"
            id="import-tab-template"
            aria-selected={activeTab === 'template'}
            aria-controls="import-panel-template"
            className={`importModalTab ${activeTab === 'template' ? 'importModalTabActive' : ''}`}
            onClick={() => setActiveTab('template')}
          >
            {t('import.tabTemplate')}
          </button>
        </div>

        <div className="modalBody stack">
          <div
            id="import-panel-import"
            role="tabpanel"
            aria-labelledby="import-tab-import"
            hidden={activeTab !== 'import'}
            className="importModalPanel"
          >
            <p className="muted modalHint">{t('import.hint')}</p>

            <div className="modalActionsRow">
              <button className="btn" type="button" onClick={() => void onPasteFromClipboard()}>
                {t('import.pasteClipboard')}
              </button>
            </div>
            {clipboardError ? <p className="saveNotice saveNoticeError">{clipboardError}</p> : null}

            <label className="field">
              <div className="label">{t('import.tableData')}</div>
              <textarea
                className="importTextarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('import.textareaPlaceholder')}
                rows={6}
                spellCheck={false}
              />
            </label>

            {text.trim() ? (
              <section className="importPreview">
                <div className="importPreviewHead">
                  <span className="importPreviewTitle">
                    {t('import.preview', {
                      count: parsed.rows.length,
                      skipped: previewSkipped,
                    })}
                  </span>
                </div>
                {parsed.rows.length > 0 ? (
                  <div className="importPreviewTableWrap">
                    <table className="importPreviewTable">
                      <thead>
                        <tr>
                          <th>{t('import.colItem')}</th>
                          <th>{t('import.colLeader')}</th>
                          <th>{t('import.colTime')}</th>
                          <th>{t('import.colLights')}</th>
                          <th>{t('import.colMedia')}</th>
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
                  <p className="muted">{t('import.noImportableRows')}</p>
                )}
                {parsed.warnings.length > 0 ? (
                  <ul className="importWarnings">
                    {parsed.warnings.map((w, i) => (
                      <li key={`${w.key}-${i}`}>{translateImportWarning(w, locale)}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}

            <fieldset className="importModeFieldset">
              <legend className="label">{t('import.onImport')}</legend>
              <label className="importModeOption">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={mode === 'append'}
                  onChange={() => setMode('append')}
                />
                {t('import.append')}
              </label>
              <label className="importModeOption">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                />
                {t('import.replaceAll')}
              </label>
            </fieldset>
          </div>

          <div
            id="import-panel-template"
            role="tabpanel"
            aria-labelledby="import-tab-template"
            hidden={activeTab !== 'template'}
            className="importModalPanel"
          >
            <section className="importTemplate">
              <div className="importTemplateActions">
                <button className="btn" type="button" onClick={() => void onCopyTemplate()}>
                  {templateCopied ? t('import.templateCopied') : t('import.copyTemplate')}
                </button>
              </div>
              <p className="muted importTemplateHint">{t('import.templateHint')}</p>
              {templateCopyError ? (
                <p className="saveNotice saveNoticeError">{templateCopyError}</p>
              ) : null}
              <div className="importPreviewTableWrap">
                <table className="importPreviewTable importTemplateTable">
                  <thead>
                    <tr>
                      {templateHeaders.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {templateSampleRows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.item}</td>
                        <td>{displayCell(row.leader)}</td>
                        <td className="timeMono">{row.duration}</td>
                        <td>{row.lights}</td>
                        <td>{displayCell(row.media)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="importTemplateNote muted">{t('import.templateDurationNote')}</p>
            </section>
          </div>
        </div>

        <footer className="modalFooter">
          <button className="btnGhost" type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="btnPrimary"
            type="button"
            disabled={!parsed.rows.length}
            onClick={onConfirm}
          >
            {t('import.importBtn')} {parsed.rows.length > 0 ? `(${parsed.rows.length})` : ''}
          </button>
        </footer>
      </div>
    </div>
  )
}
