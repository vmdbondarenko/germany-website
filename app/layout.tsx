import type { Metadata } from 'next'
import Script from 'next/script'
import { Playfair_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { GoogleTagManager } from '@next/third-parties/google'
import { CookieConsent } from '@/components/cookie-consent'
import { Ringostat } from '@/components/ringostat'
import { JsonLd, organizationSchema } from '@/lib/seo/json-ld'
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

export const metadata: Metadata = {
  metadataBase: new URL('https://www.jednopietrowawarszawa.pl'),
  title: 'Jednopiętrowa Warszawa | Deweloper Nieruchomości',
  description: 'Firma deweloperska, która na rynku nieruchomości z sukcesami działa od ponad 10 lat. Specjalizujemy się w budowie domów w stylu Wiązania Bawarskiego.',
  openGraph: {
    title: 'Firma z 10 letnim doświadczeniem! | Jednopiętrowa Warszawa',
    description: 'Firma deweloperska, która na rynku nieruchomości z sukcesami działa od ponad 10 lat. Specjalizujemy się w budowie domów w stylu Wiązania Bawarskiego.',
    images: [{ url: '/images/hero-main.jpg', width: 1200, height: 630, alt: 'Jednopiętrowa Warszawa - zdjęcie główne' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Firma z 10 letnim doświadczeniem! | Jednopiętrowa Warszawa',
    description: 'Firma deweloperska, która na rynku nieruchomości z sukcesami działa od ponad 10 lat. Specjalizujemy się w budowie domów w stylu Wiązania Bawarskiego.',
    images: [{ url: '/images/hero-main.jpg', alt: 'Jednopiętrowa Warszawa - zdjęcie główne' }],
  },
  icons: {
    icon: '/images/logo-blocks.png',
    apple: '/images/logo-blocks.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl" className={`${playfair.variable} ${inter.variable}`}>
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
        <JsonLd schema={organizationSchema()} />
        {children}
        <CookieConsent />
        <Ringostat />
        <Analytics />
      </body>
    </html>
  )
}
