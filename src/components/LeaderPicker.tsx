import { useLocale } from '../i18n/useLocale'

type Props = {
  value: string
  leaderNames: string[]
  listId: string
  hideLabel?: boolean
  onChange: (name: string) => void
  onCommit?: (name: string) => void
}

export function LeaderPicker({ value, leaderNames, listId, hideLabel, onChange, onCommit }: Props) {
  const { t } = useLocale()

  return (
    <label className="field">
      {hideLabel ? null : <div className="label">{t('leaderPicker.label')}</div>}
      <input
        list={listId}
        value={value}
        placeholder={t('leaderPicker.placeholder')}
        aria-label={hideLabel ? t('leaderPicker.ariaLeader') : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onCommit?.(value)}
      />
      <datalist id={listId}>
        {leaderNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </label>
  )
}
