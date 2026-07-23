import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

// Pre-render both locales at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  // Enable static rendering for this locale.
  setRequestLocale(locale)

  // Messages come from i18n/request.ts; the provider exposes them to Client
  // Components under this segment. The <html>/<body> shell lives in the root
  // layout (app/layout.tsx), which sets <html lang> from the active locale.
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>
}
