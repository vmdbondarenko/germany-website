import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { PROJECT_COPY } from '@/lib/seo/landing-copy'

/**
 * Build the <title>/<meta>/canonical for an investment page. Shared by the
 * legacy /inwestycje/[slug] route and the city /[citySlug]/[slug] route so both
 * URLs render identical metadata — only the canonical differs. `canonicalPath`
 * is the project's canonical URL (city path when assigned, else /inwestycje/...).
 */
export async function buildProjectMetadata(slug: string, canonicalPath: string): Promise<Metadata> {
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { name: true, heroSubtitle: true, imageUrl: true },
  })

  if (!project) return { alternates: { canonical: canonicalPath } }

  // Authored SEO copy (spreadsheet) wins when present; otherwise fall back to
  // the project name / hero subtitle.
  const copy = PROJECT_COPY[slug]
  const pageTitle = copy?.title ?? `${project.name} | Jednopiętrowa Warszawa`
  const description = copy?.description ?? project.heroSubtitle ?? undefined
  const images = project.imageUrl ? [project.imageUrl] : undefined

  return {
    title: pageTitle,
    description,
    alternates: { canonical: canonicalPath },
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
