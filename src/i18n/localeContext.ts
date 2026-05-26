import { createContext } from 'react'
import type { AppLocale, MessageParams } from './types'

export type LocaleContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  t: (key: string, params?: MessageParams) => string
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)
