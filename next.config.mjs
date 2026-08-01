import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Allow the Next.js image optimizer to fetch DB-stored images from Vercel
    // Blob. Wildcard subdomain so it survives Blob store / hostname changes.
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
  // Permanent (301) redirects from the old Polish public URLs to the German
  // slugs. Covers both the default (de, prefix-free) and the /en locale. The
  // `:slug*` variants forward any sub-path (e.g. project/article slugs); the
  // bare entries cover the listing pages themselves.
  async redirects() {
    return [
      { source: '/inwestycje', destination: '/projekte', statusCode: 301 },
      { source: '/inwestycje/:slug*', destination: '/projekte/:slug*', statusCode: 301 },
      { source: '/aktualnosci', destination: '/aktuelles', statusCode: 301 },
      { source: '/aktualnosci/:slug*', destination: '/aktuelles/:slug*', statusCode: 301 },
      { source: '/lokalizacja', destination: '/standort', statusCode: 301 },
      { source: '/en/inwestycje', destination: '/en/projekte', statusCode: 301 },
      { source: '/en/inwestycje/:slug*', destination: '/en/projekte/:slug*', statusCode: 301 },
      { source: '/en/aktualnosci', destination: '/en/aktuelles', statusCode: 301 },
      { source: '/en/aktualnosci/:slug*', destination: '/en/aktuelles/:slug*', statusCode: 301 },
      { source: '/en/lokalizacja', destination: '/en/standort', statusCode: 301 },
    ]
  },
}

export default withNextIntl(nextConfig)
