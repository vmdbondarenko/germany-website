import type { Locale } from "@/i18n/routing"

// For DB content we store the default-locale (German) value in the original
// column and an optional English override in a parallel `<field>En` column.
// `pick` returns the English value when the active locale is English and an
// override exists, otherwise the German/base value.
//
// Overloaded so the return type follows the base column: a non-null base yields
// a non-null result (the En override being null just means "fall back").
export function pick(base: string, en: string | null, locale: Locale): string
export function pick(base: string | null, en: string | null, locale: Locale): string | null
export function pick(base: string | null, en: string | null, locale: Locale): string | null {
  if (locale === "en" && en != null && en.trim() !== "") return en
  return base
}
