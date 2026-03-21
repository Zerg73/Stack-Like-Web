import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN.json'
import enUS from './en-US.json'

// 支持的语言列表
export const SUPPORTED_LOCALES = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' }
] as const

export type LocaleCode = typeof SUPPORTED_LOCALES[number]['code']

// 获取存储的语言或浏览器语言
function getInitialLocale(): LocaleCode {
  // 优先从 localStorage 获取
  const stored = localStorage.getItem('locale')
  if (stored && SUPPORTED_LOCALES.some(l => l.code === stored)) {
    return stored as LocaleCode
  }

  // 尝试匹配浏览器语言
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  if (browserLang.startsWith('en')) {
    return 'en-US'
  }

  // 默认中文
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getInitialLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n
