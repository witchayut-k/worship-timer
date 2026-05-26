import { en, type Messages } from './en'
import { th } from './th'
export type { ImportWarning } from '../domain/spreadsheetImport'
import type { ImportWarning } from '../domain/spreadsheetImport'
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type AppLocale,
  type MessageParams,
} from './types'

const catalogs: Record<AppLocale, Messages> = { en, th }

export function toIntlLocale(locale: AppLocale): 'en-US' | 'th-TH' {
  return locale === 'th' ? 'th-TH' : 'en-US'
}

export function getStoredLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (raw === 'en' || raw === 'th') return raw
  } catch {
    // ignore private mode
  }
  return DEFAULT_LOCALE
}

function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function translate(
  key: string,
  locale: AppLocale = getStoredLocale(),
  params?: MessageParams,
): string {
  const template = getNestedValue(catalogs[locale], key) ?? getNestedValue(catalogs.en, key) ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    return value == null ? `{${name}}` : String(value)
  })
}


export function translateImportWarning(warning: ImportWarning, locale: AppLocale): string {
  const { key, ...params } = warning
  return translate(`import.warning.${key}`, locale, params)
}
