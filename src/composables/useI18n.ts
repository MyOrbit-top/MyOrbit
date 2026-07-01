// ============================================
// MyOrbit - i18n System
// ============================================

import { ref } from 'vue'
import en from '@/i18n/en.json'
import zhCN from '@/i18n/zh-CN.json'

export type Locale = 'en' | 'zh-CN'
type Messages = Record<string, any>

const messages: Record<Locale, Messages> = {
  'en': en,
  'zh-CN': zhCN,
}

const currentLocale = ref<Locale>(
  (localStorage.getItem('myorbit-locale') as Locale) || 'en'
)

const localeNames: Record<Locale, string> = {
  'en': 'English',
  'zh-CN': '中文',
}

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key]
    }
    return path // fallback to key path
  }, obj)
}

function t(key: string, params?: Record<string, string | number>): string {
  const msg = getNestedValue(messages[currentLocale.value], key)
  if (!msg || typeof msg !== 'string') return key

  if (params) {
    return msg.replace(/\{(\w+)\}/g, (_, k) => String(params[k] || `{${k}}`))
  }
  return msg
}

function setLocale(locale: Locale) {
  currentLocale.value = locale
  localStorage.setItem('myorbit-locale', locale)
}

function getLocale(): Locale {
  return currentLocale.value
}

function getLocaleName(locale?: Locale): string {
  return localeNames[locale || currentLocale.value] || 'Unknown'
}

function getAvailableLocales(): { code: Locale; name: string }[] {
  return (Object.keys(localeNames) as Locale[]).map((code) => ({
    code,
    name: localeNames[code],
  }))
}

export function useI18n() {
  return {
    t,
    setLocale,
    getLocale,
    getLocaleName,
    getAvailableLocales,
    currentLocale,
  }
}
