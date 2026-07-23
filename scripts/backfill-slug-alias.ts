/**
 * Backfills a ProjectSlugAlias for a project that was renamed BEFORE alias
 * recording existed (so its old URL 404s). Idempotent — re-running upserts.
 *
 * Usage:
 *   npx tsx scripts/backfill-slug-alias.ts <oldSlug> <currentSlug>
 *   e.g. npx tsx scripts/backfill-slug-alias.ts osiedle-szlacheckie dawidy-bankowe
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

if (!process.env.POSTGRES_PRISMA_URL) {
  try {
    for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) {
        let v = m[2].trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        if (!process.env[m[1].trim()]) process.env[m[1].trim()] = v
      }
    }
  } catch {}
}

const prisma = new PrismaClient()
const [oldSlug, currentSlug] = process.argv.slice(2)

async function main() {
  if (!oldSlug || !currentSlug) throw new Error('Usage: backfill-slug-alias.ts <oldSlug> <currentSlug>')

  const project = await prisma.project.findUnique({ where: { slug: currentSlug }, select: { id: true, name: true } })
  if (!project) throw new Error(`No project with current slug "${currentSlug}"`)

  await prisma.projectSlugAlias.deleteMany({ where: { slug: currentSlug } })
  await prisma.projectSlugAlias.upsert({
    where: { slug: oldSlug },
    update: { projectId: project.id },
    create: { slug: oldSlug, projectId: project.id },
  })
  console.log(`✓ alias "${oldSlug}" → "${currentSlug}" (${project.name})`)
}

main()
  .catch((e) => { console.error(e.message ?? e); process.exit(1) })
  .finally(() => prisma.$disconnect())
