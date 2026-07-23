/**
 * One-time injection of Osiedle Szlacheckie HouseTypes M05–M08
 * (source: ~/Downloads/Types Dawidy III/apartment building M05-M08.pdf).
 *
 * Unlike M01–M04 (2-floor townhouses), M05–M08 are single-floor flats:
 *   M05 = Bud.3 / lokal 1 / parter  (55.86 m², 6 rooms)
 *   M06 = Bud.3 / lokal 2 / piętro  (55.68 m², 4 rooms)
 *   M07 = Bud.4 / lokal 1 / parter  (55.86 m², 6 rooms — identical to M05)
 *   M08 = Bud.4 / lokal 2 / piętro  (55.68 m², 4 rooms — identical to M06)
 *
 * The PDF's "Posadzka" column (gres/panele) has no field in the Room
 * schema and is dropped. PDF "Nr" (0.1, 1.1, …) is replaced by the
 * schema's sequential 1-based `number` per floor — matches M01–M04.
 *
 * Idempotent: re-running skips types whose (projectId, name) already
 * exists. Floor plans and rooms are only created when their parent type
 * was just created (so partially-edited types are never clobbered).
 *
 * Until a type is attached to at least one Unit, it is hidden from the
 * public website (see app/api/projects/[slug]/units/route.ts filter).
 *
 * Usage:
 *   npx tsx scripts/inject-szlacheckie-house-types-m05-m08.ts            # dry run (default)
 *   npx tsx scripts/inject-szlacheckie-house-types-m05-m08.ts --apply    # actually write
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

// Shared layouts. Parter is identical for M05 and M07; Piętro for M06 and M08.
const PARTER_FLAT: FloorDef = {
  name: 'Parter',
  area: 55.86,
  rooms: [
    { name: 'Hol',             area:  1.13 },
    { name: 'Wiatrołap',       area:  3.95 },
    { name: 'Łazienka',        area:  5.13 },
    { name: 'Salon z kuchnią', area: 26.33 },
    { name: 'Pokój',           area:  8.79 },
    { name: 'Pokój',           area: 10.53 },
  ],
}

const PIETRO_FLAT: FloorDef = {
  name: 'Piętro',
  area: 55.68,
  rooms: [
    { name: 'Salon z kuchnią', area: 28.43 },
    { name: 'Łazienka',        area:  5.87 },
    { name: 'Pokój',           area: 10.13 },
    { name: 'Pokój',           area: 11.25 },
  ],
}

const TYPES: TypeDef[] = [
  { name: 'M05', totalArea: 55.86, floors: [PARTER_FLAT] },
  { name: 'M06', totalArea: 55.68, floors: [PIETRO_FLAT] },
  { name: 'M07', totalArea: 55.86, floors: [PARTER_FLAT] },
  { name: 'M08', totalArea: 55.68, floors: [PIETRO_FLAT] },
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
      console.log(`  PLAN  ${t.name}  ${t.totalArea} m²  ${t.floors.length} floor / ${roomCount} rooms`)
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
