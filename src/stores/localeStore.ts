import { defineStore } from 'pinia'
import { computed } from 'vue'
import i18n, { SUPPORTED_LOCALES, type LocaleCode } from '@/locales'

export const useLocaleStore = defineStore('locale', () => {
  // 获取 i18n 实例的 locale
  const locale = computed({
    get: () => i18n.global.locale.value,
    set: (value: LocaleCode) => {
      i18n.global.locale.value = value
    }
  })

  // 当前语言名称
  const localeName = computed(() => {
    const found = SUPPORTED_LOCALES.find(l => l.code === locale.value)
    return found?.name ?? locale.value
  })

  // 切换语言
  function setLocale(newLocale: LocaleCode): void {
    locale.value = newLocale
    // 持久化到 localStorage
    localStorage.setItem('locale', newLocale)
    // 更新 HTML lang 属性
    document.documentElement.lang = newLocale
  }

  // 切换到下一个语言
  function toggleLocale(): void {
    const currentIndex = SUPPORTED_LOCALES.findIndex(l => l.code === locale.value)
    const nextIndex = (currentIndex + 1) % SUPPORTED_LOCALES.length
    setLocale(SUPPORTED_LOCALES[nextIndex].code)
  }

  return {
    locale,
    localeName,
    supportedLocales: SUPPORTED_LOCALES,
    setLocale,
    toggleLocale
  }
})
