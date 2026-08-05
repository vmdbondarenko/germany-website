import { defineRouting } from 'next-intl/routing'

// German is the default (served without a URL prefix at `/`), English is the
// switchable second locale (served under `/en`). Admin, /api, robots and
// sitemap live outside this routing (see proxy.ts) and are not localized.
export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'as-needed',
  // German is the consistent default: the root `/` always serves German and is
  // never auto-redirected to `/en` by browser language. English stays fully
  // available at `/en` (direct URLs + the language switcher when enabled). This
  // guarantees the admin "hide language switcher" setting leaves visitors on the
  // German version at the root.
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]
