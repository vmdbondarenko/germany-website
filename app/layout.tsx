import type { Metadata } from 'next'
import Script from 'next/script'
import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { Playfair_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { GoogleTagManager } from '@next/third-parties/google'
import { CookieConsent } from '@/components/cookie-consent'
import { Ringostat } from '@/components/ringostat'
import { JsonLd, organizationSchema } from '@/lib/seo/json-ld'
import { getSiteSettings } from '@/lib/site-settings'
import { SiteSettingsProvider } from '@/components/site-settings-provider'
import './globals.css'

const gtmId = process.env.NEXT_PUBLIC_GTM_ID

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
      {/* Google Consent Mode v2 — defaults to denied BEFORE GTM loads.
          Runs ahead of the GTM container (afterInteractive) so no analytics/
          marketing tags fire until the user grants consent. */}
      <Script id="consent-mode-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          try {
            if (document.cookie.indexOf('cookie_consent=granted') !== -1) {
              gtag('consent', 'update', {
                ad_storage: 'granted',
                analytics_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted'
              });
            }
          } catch (e) {}
        `}
      </Script>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteSettingsProvider value={siteSettings}>
            <JsonLd schema={organizationSchema(siteSettings)} />
            {children}
            <CookieConsent />
            <Ringostat />
            <Analytics />
          </SiteSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
