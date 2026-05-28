import type { StageDisplayTemplate } from '../domain/types'
import { useLocale } from '../i18n/useLocale'

const TEMPLATES: StageDisplayTemplate[] = ['circle', 'minimal', 'bar']

function StageTemplateThumb({ template }: { template: StageDisplayTemplate }) {
  if (template === 'minimal') {
    return (
      <div className="stageTemplateThumb stageTemplateThumbMinimal" aria-hidden>
        <span className="stageTemplateThumbTimer">10:00</span>
        <span className="stageTemplateThumbBar" />
      </div>
    )
  }
  if (template === 'bar') {
    return (
      <div className="stageTemplateThumb stageTemplateThumbBar" aria-hidden>
        <span className="stageTemplateThumbTimer stageTemplateThumbTimerSm">10:00</span>
        <span className="stageTemplateThumbBar stageTemplateThumbBarWide" />
        <span className="stageTemplateThumbCols">
          <span />
          <span />
        </span>
      </div>
    )
  }
  return (
    <div className="stageTemplateThumb stageTemplateThumbCircle" aria-hidden>
      <span className="stageTemplateThumbRing" />
      <span className="stageTemplateThumbTimer stageTemplateThumbTimerSm">10:00</span>
    </div>
  )
}

type Props = {
  value: StageDisplayTemplate
  onChange: (template: StageDisplayTemplate) => void
}

export function SetupStageTemplatePicker({ value, onChange }: Props) {
  const { t } = useLocale()

  const labelKey = (template: StageDisplayTemplate) => {
    if (template === 'minimal') return 'setupAside.templateMinimal'
    if (template === 'bar') return 'setupAside.templateBar'
    return 'setupAside.templateCircle'
  }

  const descKey = (template: StageDisplayTemplate) => {
    if (template === 'minimal') return 'setupAside.templateMinimalDesc'
    if (template === 'bar') return 'setupAside.templateBarDesc'
    return 'setupAside.templateCircleDesc'
  }

  return (
    <div className="stageTemplateGrid" role="radiogroup" aria-label={t('setupAside.stageDisplay')}>
      {TEMPLATES.map((template) => {
        const selected = value === template
        return (
          <button
            key={template}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`stageTemplateOption${selected ? ' stageTemplateOptionSelected' : ''}`}
            onClick={() => onChange(template)}
          >
            <StageTemplateThumb template={template} />
            <span className="stageTemplateOptionText">
              <span className="stageTemplateOptionLabel">{t(labelKey(template))}</span>
              <span className="stageTemplateOptionDesc">{t(descKey(template))}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
