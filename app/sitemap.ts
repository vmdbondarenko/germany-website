import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

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

/**
 * A sitemap entry for `path` (German, prefix-free) that also declares the
 * English (`/en`) alternate via hreflang.
 */
function entry(
  path: string,
  opts: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>,
): MetadataRoute.Sitemap[number] {
  const p = path === '/' ? '' : path
  return {
    url: `${baseUrl}${path}`,
    alternates: { languages: { de: `${baseUrl}${path}`, en: `${baseUrl}/en${p}` } },
    ...opts,
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    entry('/', { lastModified: now, changeFrequency: 'weekly', priority: 1 }),
    entry('/projekte', { lastModified: now, changeFrequency: 'weekly', priority: 0.9 }),
    entry('/aktuelles', { lastModified: now, changeFrequency: 'weekly', priority: 0.7 }),
    entry('/standort', { lastModified: now, changeFrequency: 'monthly', priority: 0.6 }),
    entry('/impressum', { lastModified: now, changeFrequency: 'yearly', priority: 0.2 }),
    entry('/datenschutz', { lastModified: now, changeFrequency: 'yearly', priority: 0.2 }),
  ]

  const [projects, posts, locations] = await Promise.all([
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
    prisma.newsPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, coverImageUrl: true },
    }),
    prisma.location.findMany({ select: { slug: true, updatedAt: true }, orderBy: { order: 'asc' } }),
  ])

  const locationRoutes: MetadataRoute.Sitemap = locations.map((l) =>
    entry(`/${l.slug}`, { lastModified: l.updatedAt, changeFrequency: 'weekly', priority: 0.7 }),
  )

  const investmentRoutes: MetadataRoute.Sitemap = projects.map((p) =>
    entry(p.cityLocation ? `/${p.cityLocation.slug}/${p.slug}` : `/projekte/${p.slug}`, {
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: imageUrls(p.imageUrl, ...p.galleryImages.map((g) => g.src)),
    }),
  )

  const articleRoutes: MetadataRoute.Sitemap = posts.map((p) =>
    entry(`/aktuelles/${p.slug}`, {
      lastModified: p.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.5,
      images: imageUrls(p.coverImageUrl),
    }),
  )

  return [...staticRoutes, ...locationRoutes, ...investmentRoutes, ...articleRoutes]
}
