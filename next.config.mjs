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
}

export default nextConfig
