/**
 * One-time injection of Bawarski Wawer HouseTypes A–D
 * (source: ~/Downloads/WAWER_Typy_A_D_fixed (1).pdf).
 *
 * Inwestycja WAWER — dwa budynki mieszkalne jednorodzinne dwulokalowe
 * w zabudowie bliźniaczej (2 budynki, 4 lokale):
 *   Typ A = Budynek 2 / lokal 1 — 99.06 m² (Parter 53.52 + Piętro 45.54)
 *   Typ B = Budynek 2 / lokal 2 — 99.06 m² (identyczny z Typ A)
 *   Typ C = Budynek 1 / lokal 1 — 53.09 m² (Parter only)
 *   Typ D = Budynek 1 / lokal 2 — 52.54 m² (Parter 1.13 + Piętro 51.41)
 *
 * Idempotent: re-running skips types whose (projectId, name) already
 * exists. Floor plans and rooms are only created when their parent type
 * was just created (so partially-edited types are never clobbered).
 *
 * Until a type is attached to at least one Unit, it is hidden from the
 * public website (see app/api/projects/[slug]/units/route.ts filter).
 * Bawarski Wawer currently has 0 units — these types stay admin-only
 * until units are created and linked.
 *
 * Usage:
 *   npx tsx scripts/inject-wawer-house-types.ts            # dry run (default)
 *   npx tsx scripts/inject-wawer-house-types.ts --apply    # actually write
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

const PROJECT_ID = 'cmqf7gr1o0000nd57xxtsmvjz' // Bawarski Wawer

type RoomDef = { name: string; area: number }
type FloorDef = { name: string; area: number; rooms: RoomDef[] }
type TypeDef = { name: string; totalArea: number; floors: FloorDef[] }

// Shared layout — Typ A (Bud.2/lok.1) and Typ B (Bud.2/lok.2) are identical.
const PARTER_AB: FloorDef = {
  name: 'Parter',
  area: 53.52,
  rooms: [
    { name: 'Wiatrołap',        area:  3.41 },
    { name: 'Hol',              area:  4.22 },
    { name: 'Pom. gospodarcze', area:  1.94 },
    { name: 'Garaż',            area: 15.95 },
    { name: 'Łazienka',         area:  3.00 },
    { name: 'Salon z kuchnią',  area: 25.00 },
  ],
}

const PIETRO_AB: FloorDef = {
  name: 'Piętro',
  area: 45.54,
  rooms: [
    { name: 'Pokój',     area: 18.73 },
    { name: 'Garderoba', area:  2.50 },
    { name: 'Łazienka',  area:  2.95 },
    { name: 'Hol',       area:  2.24 },
    { name: 'Łazienka',  area:  3.52 },
    { name: 'Pokój',     area:  6.78 },
    { name: 'Pokój',     area:  8.82 },
  ],
}

const TYPES: TypeDef[] = [
  { name: 'Typ A', totalArea: 99.06, floors: [PARTER_AB, PIETRO_AB] },
  { name: 'Typ B', totalArea: 99.06, floors: [PARTER_AB, PIETRO_AB] },
  {
    name: 'Typ C',
    totalArea: 53.09,
    floors: [
      {
        name: 'Parter',
        area: 53.09,
        rooms: [
          { name: 'Wiatrołap',       area:  3.86 },
          { name: 'Łazienka',        area:  5.00 },
          { name: 'Salon z kuchnią', area: 25.76 },
          { name: 'Pokój',           area:  8.65 },
          { name: 'Pokój',           area:  9.82 },
        ],
      },
    ],
  },
  {
    name: 'Typ D',
    totalArea: 52.54,
    floors: [
      {
        name: 'Parter',
        area: 1.13,
        rooms: [
          { name: 'Wiatrołap', area: 1.13 },
        ],
      },
      {
        name: 'Piętro',
        area: 51.41,
        rooms: [
          { name: 'Salon z kuchnią', area: 26.31 },
          { name: 'Łazienka',        area:  5.55 },
          { name: 'Pokój',           area:  9.72 },
          { name: 'Pokój',           area:  9.83 },
        ],
      },
    ],
  },
]

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: PROJECT_ID },
    select: { id: true, name: true, slug: true },
  })
  if (!project) throw new Error(`Project not found: ${PROJECT_ID}`)

  // Sanity check: room areas per type must sum to the stated total area.
  for (const t of TYPES) {
    const sum = t.floors.reduce((s, f) => s + f.rooms.reduce((x, r) => x + r.area, 0), 0)
    if (Math.abs(sum - t.totalArea) > 0.01) {
      throw new Error(`${t.name}: room areas sum to ${sum.toFixed(2)} but totalArea is ${t.totalArea}`)
    }
  }

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
