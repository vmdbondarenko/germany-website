import { notFound, permanentRedirect } from 'next/navigation'
import { ProjectDetail } from '@/components/project-detail'
import { buildProjectMetadata } from '@/lib/seo/project-meta'
import { loadHeaderCities } from '@/lib/locations'
import { resolveProjectBySlug, projectCanonicalPath } from '@/lib/project-routing'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string; slug: string }>
}): Promise<Metadata> {
  const { citySlug, slug } = await params
  const project = await resolveProjectBySlug(slug)
  const canonical = project ? projectCanonicalPath(project) : `/${citySlug}/${slug}`
  return buildProjectMetadata(project?.slug ?? slug, canonical)
}

export default async function CityProjectPage({
  params,
}: {
  params: Promise<{ citySlug: string; slug: string }>
}) {
  const { citySlug, slug } = await params

  // Resolve by current slug or historical alias. Redirect (308) to the canonical
  // whenever it differs from the requested path: a renamed slug, the wrong city
  // in the URL, or a project with no city (canonical lives at /inwestycje/...).
  const project = await resolveProjectBySlug(slug)
  if (!project) notFound()

  const canonical = projectCanonicalPath(project)
  if (canonical !== `/${citySlug}/${slug}`) permanentRedirect(canonical)

  const cities = await loadHeaderCities()
  return <ProjectDetail slug={project.slug} canonicalPath={canonical} cities={cities} />
}
