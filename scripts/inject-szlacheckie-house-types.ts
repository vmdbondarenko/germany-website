/**
 * One-time injection of Osiedle Szlacheckie HouseTypes M01–M04
 * (source: ~/Downloads/wyciag_typy_M01_M04_fixed.pdf).
 *
 * All four types share an identical functional layout — 84.37 m² total,
 * Parter (47.86 m², 5 rooms) + Piętro (36.51 m², 7 rooms). Four distinct
 * type records are created so each lokal can be attached to its own type
 * later (the PDF maps M01=B1/L1, M02=B2/L2, M03=B3/L1, M04=B4/L2).
 *
 * Idempotent: re-running skips types whose (projectId, name) already
 * exists. Floor plans and rooms are only created when their parent type
 * was just created (so partially-edited types are never clobbered).
 *
 * Until a type is attached to at least one Unit, it is hidden from the
 * public website (see app/api/projects/[slug]/units/route.ts filter).
 *
 * Usage:
 *   npx tsx scripts/inject-szlacheckie-house-types.ts            # dry run (default)
 *   npx tsx scripts/inject-szlacheckie-house-types.ts --apply    # actually write
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

// Shared layout (identical for M01–M04 per the PDF).
const PARTER: FloorDef = {
  name: 'Parter',
  area: 47.86,
  rooms: [
    { name: 'Wiatrołap',         area:  4.37 },
    { name: 'Pom. gospodarcze',  area:  2.92 },
    { name: 'Łazienka',          area:  3.20 },
    { name: 'Gabinet',           area: 12.37 },
    { name: 'Salon z kuchnią',   area: 25.00 },
  ],
}

const PIETRO: FloorDef = {
  name: 'Piętro',
  area: 36.51,
  rooms: [
    { name: 'Pokój master', area: 12.69 },
    { name: 'Garderoba',    area:  1.60 },
    { name: 'Łazienka',     area:  2.46 },
    { name: 'Łazienka',     area:  2.44 },
    { name: 'Łazienka',     area:  2.46 },
    { name: 'Pokój',        area:  6.66 },
    { name: 'Pokój',        area:  8.20 },
  ],
}

const TYPES: TypeDef[] = ['M01', 'M02', 'M03', 'M04'].map(name => ({
  name,
  totalArea: 84.37,
  floors: [PARTER, PIETRO],
}))

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
