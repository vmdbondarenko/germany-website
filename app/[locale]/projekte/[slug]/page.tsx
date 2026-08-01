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
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await resolveProjectBySlug(slug)
  const canonical = project ? projectCanonicalPath(project) : `/projekte/${slug}`
  return buildProjectMetadata(project?.slug ?? slug, canonical)
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Resolve by current slug or a historical alias (renamed projects). Redirect
  // (308) to the canonical URL whenever it differs from the requested one:
  // a renamed slug, or a project that now has a city. Unassigned projects on
  // their current slug render here.
  const project = await resolveProjectBySlug(slug)
  if (!project) notFound()

  const canonical = projectCanonicalPath(project)
  if (canonical !== `/projekte/${slug}`) permanentRedirect(canonical)

  const cities = await loadHeaderCities()
  return <ProjectDetail slug={project.slug} canonicalPath={canonical} cities={cities} />
}
