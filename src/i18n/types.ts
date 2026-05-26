export type AppLocale = 'en' | 'th'

export const LOCALE_STORAGE_KEY = 'worship-timer:locale'

export const DEFAULT_LOCALE: AppLocale = 'en'

export type MessageParams = Record<string, string | number>
