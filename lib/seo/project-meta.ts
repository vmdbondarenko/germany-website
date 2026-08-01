import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { pick } from '@/lib/i18n-content'
import type { Locale } from '@/i18n/routing'

/**
 * Build the <title>/<meta>/canonical for an investment page. Shared by the
 * legacy /projekte/[slug] route and the city /[citySlug]/[slug] route so both
 * URLs render identical metadata — only the canonical differs. `canonicalPath`
 * is the project's canonical URL (city path when assigned, else /projekte/...).
 * Title/description resolve per active locale (German default, English override).
 */
export async function buildProjectMetadata(slug: string, canonicalPath: string): Promise<Metadata> {
  const locale = (await getLocale()) as Locale
  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      name: true,
      heroSubtitle: true,
      heroSubtitleEn: true,
      description: true,
      descriptionEn: true,
      imageUrl: true,
    },
  })

  const languages = { de: canonicalPath, en: `/en${canonicalPath}` }
  if (!project) return { alternates: { canonical: canonicalPath, languages } }

  const pageTitle = project.name
  const description =
    pick(project.description, project.descriptionEn, locale) ??
    pick(project.heroSubtitle, project.heroSubtitleEn, locale) ??
    undefined
  const images = project.imageUrl ? [project.imageUrl] : undefined

  return {
    title: pageTitle,
    description,
    alternates: { canonical: canonicalPath, languages },
    openGraph: {
      title: pageTitle,
      description,
      url: canonicalPath,
      type: 'website',
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      ...(images ? { images } : {}),
    },
  }
}
