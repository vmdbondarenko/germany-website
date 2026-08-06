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

// NOTE: Locale-specific titles/descriptions and the production metadataBase are
// set per-page and finalized in the SEO localization phase. This is a neutral
// default so nothing ships hardcoded Polish copy.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
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
