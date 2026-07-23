import { defineRouting } from 'next-intl/routing'

// German is the default (served without a URL prefix at `/`), English is the
// switchable second locale (served under `/en`). Admin, /api, robots and
// sitemap live outside this routing (see proxy.ts) and are not localized.
export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]
