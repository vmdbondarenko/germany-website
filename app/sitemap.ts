import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const baseUrl = 'https://www.jednopietrowawarszawa.pl'

// Generated on each request so newly published investments/articles appear
// without a rebuild.
export const dynamic = 'force-dynamic'

/** Absolutise an image URL on the canonical host (Blob URLs are already absolute). */
function abs(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

/** Unique, absolute image URLs (drops empties). */
function imageUrls(...urls: (string | null | undefined)[]): string[] {
  return Array.from(new Set(urls.filter((u): u is string => !!u).map(abs)))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public routes. Add new top-level pages here.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/inwestycje`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/aktualnosci`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/lokalizacja`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const [projects, posts, locations] = await Promise.all([
    // Mirror the /inwestycje list visibility filter.
    prisma.project.findMany({
      where: { status: { not: 'archived' } },
      select: {
        slug: true,
        updatedAt: true,
        imageUrl: true,
        galleryImages: { select: { src: true }, orderBy: { order: 'asc' } },
        cityLocation: { select: { slug: true } },
      },
    }),
    // Mirror the /aktualnosci list visibility filter.
    prisma.newsPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, coverImageUrl: true },
    }),
    // City landing pages (/domy-pod-warszawa, …).
    prisma.location.findMany({ select: { slug: true, updatedAt: true }, orderBy: { order: 'asc' } }),
  ])

  const locationRoutes: MetadataRoute.Sitemap = locations.map((l) => ({
    url: `${baseUrl}/${l.slug}`,
    lastModified: l.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // NOTE: Next's sitemap `images` field is URL-only — it emits
  // <image:image><image:loc> entries without <image:title>/<image:caption>
  // (those tags aren't supported by MetadataRoute.Sitemap). Image titles remain
  // covered by alt text and the ImageObject JSON-LD (#17 step B). Revisit with a
  // custom XML route if image titles/captions are wanted in the sitemap too.
  // Each project lists only its canonical URL: the city path when a location is
  // assigned (the legacy /inwestycje/{slug} 308-redirects there), else the
  // legacy path while it's still unassigned.
  const investmentRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: p.cityLocation
      ? `${baseUrl}/${p.cityLocation.slug}/${p.slug}`
      : `${baseUrl}/inwestycje/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
    images: imageUrls(p.imageUrl, ...p.galleryImages.map((g) => g.src)),
  }))

  const articleRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${baseUrl}/aktualnosci/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.5,
    images: imageUrls(p.coverImageUrl),
  }))

  return [...staticRoutes, ...locationRoutes, ...investmentRoutes, ...articleRoutes]
}
