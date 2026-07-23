/**
 * One-time injection of Osiedle Szlacheckie HouseTypes M09–M12
 * (source: ~/Downloads/Types Dawidy III/with garages M09-M12 .pdf).
 *
 * Each type is a 2-floor townhouse with a built-in garage (Bud.1 / Bud.2):
 *   M09 = Bud.1 / lok.1  (110.31 m², Parter 62.81 + Piętro 47.50)
 *   M10 = Bud.1 / lok.2  (110.17 m², Parter 62.67 + Piętro 47.50)
 *   M11 = Bud.2 / lok.1  (110.31 m² — identical to M09)
 *   M12 = Bud.2 / lok.2  (110.17 m² — identical to M10)
 *
 * Parter differs slightly between lok.1 and lok.2 (Pom. gosp., Łazienka,
 * Salon+kuchnia). Piętro is identical across all four — shared as PIETRO.
 *
 * Idempotent: re-running skips types whose (projectId, name) already
 * exists. Floor plans and rooms are only created when their parent type
 * was just created (so partially-edited types are never clobbered).
 *
 * Until a type is attached to at least one Unit, it is hidden from the
 * public website (see app/api/projects/[slug]/units/route.ts filter).
 *
 * Usage:
 *   npx tsx scripts/inject-szlacheckie-house-types-m09-m12.ts            # dry run (default)
 *   npx tsx scripts/inject-szlacheckie-house-types-m09-m12.ts --apply    # actually write
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

const PROJECT_ID = 'cmmxfgv1i0000pqbi34hu5d7p' // Osiedle Szlacheckie

type RoomDef = { name: string; area: number }
type FloorDef = { name: string; area: number; rooms: RoomDef[] }
type TypeDef = { name: string; totalArea: number; floors: FloorDef[] }

// Parter shared by M09 and M11 (lok.1 layout).
const PARTER_L1: FloorDef = {
  name: 'Parter',
  area: 62.81,
  rooms: [
    { name: 'Wiatrołap',       area:  3.46 },
    { name: 'Hol',             area:  4.23 },
    { name: 'Pom. gosp.',      area:  2.00 },
    { name: 'Garaż',           area: 16.47 },
    { name: 'Łazienka',        area:  3.10 },
    { name: 'Salon + kuchnia', area: 33.55 },
  ],
}

// Parter shared by M10 and M12 (lok.2 layout — slightly smaller).
const PARTER_L2: FloorDef = {
  name: 'Parter',
  area: 62.67,
  rooms: [
    { name: 'Wiatrołap',       area:  3.46 },
    { name: 'Hol',             area:  4.23 },
    { name: 'Pom. gosp.',      area:  1.96 },
    { name: 'Garaż',           area: 16.47 },
    { name: 'Łazienka',        area:  3.04 },
    { name: 'Salon + kuchnia', area: 33.51 },
  ],
}

// Piętro identical for all four types.
const PIETRO: FloorDef = {
  name: 'Piętro',
  area: 47.50,
  rooms: [
    { name: 'Pokój',     area: 17.17 },
    { name: 'Garderoba', area:  2.18 },
    { name: 'Łazienka',  area:  2.58 },
    { name: 'Hol',       area:  2.24 },
    { name: 'Łazienka',  area:  3.07 },
    { name: 'Pokój',     area:  9.54 },
    { name: 'Pokój',     area: 10.72 },
  ],
}

const TYPES: TypeDef[] = [
  { name: 'M09', totalArea: 110.31, floors: [PARTER_L1, PIETRO] },
  { name: 'M10', totalArea: 110.17, floors: [PARTER_L2, PIETRO] },
  { name: 'M11', totalArea: 110.31, floors: [PARTER_L1, PIETRO] },
  { name: 'M12', totalArea: 110.17, floors: [PARTER_L2, PIETRO] },
]

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: PROJECT_ID },
    select: { id: true, name: true, slug: true },
  })
  if (!project) throw new Error(`Project not found: ${PROJECT_ID}`)

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Project: ${project.name} (${project.slug})`)
  console.log(`Planned types: ${TYPES.map(t => t.name).join(', ')}`)
  console.log('')

  const existing = await prisma.houseType.findMany({
    where: { projectId: PROJECT_ID, name: { in: TYPES.map(t => t.name) } },
    select: { id: true, name: true },
  })
  const existingByName = new Map(existing.map(e => [e.name, e.id]))

  let created = 0, skipped = 0
  for (const t of TYPES) {
    const existingId = existingByName.get(t.name)
    if (existingId) {
      console.log(`  SKIP  ${t.name}  (already exists: id=${existingId})`)
      skipped++
      continue
    }

    const roomCount = t.floors.reduce((s, f) => s + f.rooms.length, 0)
    if (!APPLY) {
      console.log(`  PLAN  ${t.name}  ${t.totalArea} m²  ${t.floors.length} floors / ${roomCount} rooms`)
      for (const f of t.floors) {
        console.log(`        └── ${f.name} (${f.area} m², ${f.rooms.length} rooms)`)
      }
    } else {
      const ht = await prisma.houseType.create({
        data: {
          projectId: PROJECT_ID,
          name: t.name,
          totalArea: t.totalArea,
        },
      })
      for (const f of t.floors) {
        const fp = await prisma.floorPlan.create({
          data: { houseTypeId: ht.id, name: f.name, area: f.area },
        })
        let n = 1
        for (const r of f.rooms) {
          await prisma.room.create({
            data: { floorPlanId: fp.id, name: r.name, area: r.area, number: n++ },
          })
        }
      }
      console.log(`  ✓     ${t.name}  created id=${ht.id} (+${t.floors.length} floors, +${roomCount} rooms)`)
    }
    created++
  }

  console.log('')
  console.log(`${APPLY ? 'Created' : 'Would create'}: ${created}   Skipped (already exist): ${skipped}`)
  if (!APPLY) console.log('\nRe-run with --apply to write to the database.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
