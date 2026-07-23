/**
 * Seeds the 3 city Locations and assigns the migration set of projects to them.
 * Locations get an SEO landing page at /{slug}; assigned projects move their
 * canonical URL to /{slug}/{project-slug} (legacy /inwestycje/{slug} 308s there).
 *
 * Idempotent: locations are upserted by slug; project assignment matches by
 * exact project name and is re-applied each run. Projects not yet in the DB are
 * reported, so it's safe to re-run as they get added later.
 *
 * Usage:
 *   npx tsx scripts/seed-locations.ts            # dry run (default)
 *   npx tsx scripts/seed-locations.ts --apply    # actually write
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

if (!process.env.POSTGRES_PRISMA_URL) {
  try {
    const envContent = readFileSync('.env.local', 'utf-8')
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let val = match[2].trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
    }
  } catch {}
}

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

type Loc = { slug: string; name: string; order: number; projects: string[] }

const LOCATIONS: Loc[] = [
  {
    slug: 'domy-pod-warszawa',
    name: 'Domy pod Warszawą',
    order: 0,
    projects: ['Osiedle Szlacheckie', 'Dziesiąty Bawarski', 'Osiedle przy Marmurowej'],
  },
  {
    slug: 'domy-pod-wroclawiem',
    name: 'Domy pod Wrocławiem',
    order: 1,
    projects: ['Południowa Bawaria', 'Bawarska Przestrzeń', 'Bawarski Zakątek'],
  },
  {
    slug: 'domy-pod-krakowem',
    name: 'Domy pod Krakowem',
    order: 2,
    projects: ['Bawarskie Wzgórze', 'Pierwszy Krakowski'],
  },
]

async function main() {
  console.log(`\n=== seed-locations (${APPLY ? 'APPLY' : 'DRY RUN'}) ===\n`)

  for (const loc of LOCATIONS) {
    const existing = await prisma.location.findUnique({ where: { slug: loc.slug } })
    console.log(`${existing ? '✓ exists' : '+ create'}  ${loc.slug}  "${loc.name}"`)

    let locationId = existing?.id ?? '(dry-run)'
    if (APPLY) {
      const saved = await prisma.location.upsert({
        where: { slug: loc.slug },
        update: { name: loc.name, order: loc.order },
        create: { slug: loc.slug, name: loc.name, order: loc.order },
      })
      locationId = saved.id
    }

    for (const name of loc.projects) {
      const project = await prisma.project.findFirst({ where: { name }, select: { id: true, name: true, cityLocationId: true } })
      if (!project) {
        console.log(`    ⚠ NOT IN DB: "${name}" — assign later`)
        continue
      }
      const already = project.cityLocationId === existing?.id && existing != null
      if (already) {
        console.log(`    = already assigned: "${name}"`)
        continue
      }
      console.log(`    → assign "${name}" → ${loc.slug}`)
      if (APPLY) {
        await prisma.project.update({ where: { id: project.id }, data: { cityLocationId: locationId } })
      }
    }
    console.log('')
  }

  if (!APPLY) console.log('Dry run only — re-run with --apply to write.\n')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
