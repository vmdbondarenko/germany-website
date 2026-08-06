import type { Metadata } from 'next'
import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { Playfair_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CookieConsent } from '@/components/cookie-consent'
import { JsonLd, organizationSchema } from '@/lib/seo/json-ld'
import { getSiteSettings } from '@/lib/site-settings'
import { SiteSettingsProvider } from '@/components/site-settings-provider'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ["latin", "latin-ext"],
  variable: '--font-sans',
  display: 'swap',
});

// metadataBase resolves the relative canonical / Open Graph / hreflang URLs set
// per page. It defaults to the German production domain so absolute URLs are
// correct even when NEXT_PUBLIC_BASE_URL is not set in the environment; the env
// var still overrides it (e.g. for preview deployments).
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.peberlin-gmbh.de'),
  icons: {
    icon: '/images/logo-blocks.png',
    apple: '/images/logo-blocks.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()
  const siteSettings = await getSiteSettings()
  return (
    <html lang={locale} className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteSettingsProvider value={siteSettings}>
            <JsonLd schema={organizationSchema(siteSettings)} />
            {children}
            <CookieConsent />
            <Analytics />
          </SiteSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
