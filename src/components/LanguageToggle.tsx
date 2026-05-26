import { useLocale } from '../i18n/useLocale'
import type { AppLocale } from '../i18n/types'

const options: AppLocale[] = ['en', 'th']

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div className="languageToggle" role="group" aria-label={t('language.label')}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`languageToggleBtn${locale === option ? ' languageToggleBtnActive' : ''}`}
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
        >
          {t(`language.${option}`)}
        </button>
      ))}
    </div>
  )
}
