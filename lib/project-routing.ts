import { prisma } from '@/lib/prisma'

type ResolvedProject = {
  slug: string
  cityLocation: { slug: string } | null
}

/** The single canonical URL for a project: city path when assigned, else legacy. */
export function projectCanonicalPath(p: ResolvedProject): string {
  return p.cityLocation ? `/${p.cityLocation.slug}/${p.slug}` : `/projekte/${p.slug}`
}

/**
 * Resolve an incoming slug to a project by its current slug first, then by a
 * historical slug alias (set when a slug is renamed in admin). Returns null when
 * nothing matches. Used by /projekte/[slug] and /[citySlug]/[slug] so renamed
 * projects keep their old URLs alive via a 308 to the current canonical.
 */
export async function resolveProjectBySlug(slug: string): Promise<ResolvedProject | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { slug: true, cityLocation: { select: { slug: true } } },
  })
  if (project) return project

  const alias = await prisma.projectSlugAlias.findUnique({
    where: { slug },
    select: { project: { select: { slug: true, cityLocation: { select: { slug: true } } } } },
  })
  return alias?.project ?? null
}
