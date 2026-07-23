/**
 * Correct M01–M12 HouseTypes and link units 29–48 for Osiedle Szlacheckie.
 *
 * Source: ~/Downloads/typy_planow_M01_M12_correct.pdf (the screenshot-based
 * corrected mapping). Replaces the earlier room/floor data inferred from
 * incomplete PDFs and fills in the previously-missing Unit.houseTypeId.
 *
 * Operations per run (all idempotent, dry-run by default):
 *   1. For each M01–M12: ensure HouseType exists, replace its FloorPlans
 *      and Rooms with the corrected layout, update totalArea.
 *   2. For each unit 29–48: set houseTypeId to the assigned M-type if not
 *      already pointing there.
 *
 * The replacement uses delete-then-create on FloorPlan (rooms cascade).
 * Units retain everything else — only houseTypeId is touched.
 *
 * Usage:
 *   npx tsx scripts/sync-szlacheckie-types-m01-m12.ts            # dry run
 *   npx tsx scripts/sync-szlacheckie-types-m01-m12.ts --apply    # write
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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
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

// ---- Shared floor definitions (PDF: identical room lists per the screenshot) ----

const PARTER_M01_M04: FloorDef = {
  name: 'Parter',
  area: 48.71, // 4.32+2.82+3.20+12.37+26.00
  rooms: [
    { name: 'Wiatrołap',       area:  4.32 },
    { name: 'Hol',             area:  2.82 },
    { name: 'Łazienka',        area:  3.20 },
    { name: 'Gabinet',         area: 12.37 },
    { name: 'Salon + kuchnia', area: 26.00 },
  ],
}

const PARTER_M02_M03: FloorDef = {
  name: 'Parter',
  area: 48.86, // 4.37+2.82+3.26+12.37+26.04
  rooms: [
    { name: 'Wiatrołap',       area:  4.37 },
    { name: 'Hol',             area:  2.82 },
    { name: 'Łazienka',        area:  3.26 },
    { name: 'Gabinet',         area: 12.37 },
    { name: 'Salon + kuchnia', area: 26.04 },
  ],
}

const PIETRO_M01_M04: FloorDef = {
  name: 'Piętro',
  area: 36.45, // 12.69+1.65+2.46+2.24+2.48+6.65+8.28
  rooms: [
    { name: 'Pokój',    area: 12.69 },
    { name: 'Garderoba', area:  1.65 },
    { name: 'Łazienka', area:  2.46 },
    { name: 'Hol',      area:  2.24 },
    { name: 'Łazienka', area:  2.48 },
    { name: 'Pokój',    area:  6.65 },
    { name: 'Pokój',    area:  8.28 },
  ],
}

const PARTER_M05_M07: FloorDef = {
  name: 'Parter',
  area: 55.86,
  rooms: [
    { name: 'Hol',             area:  1.13 },
    { name: 'Wiatrołap',       area:  3.95 },
    { name: 'Łazienka',        area:  5.13 },
    { name: 'Salon + kuchnia', area: 26.33 },
    { name: 'Pokój',           area:  8.79 },
    { name: 'Pokój',           area: 10.53 },
  ],
}

const PIETRO_M06_M08: FloorDef = {
  name: 'Piętro',
  area: 55.68,
  rooms: [
    { name: 'Salon + kuchnia', area: 28.43 },
    { name: 'Łazienka',        area:  5.87 },
    { name: 'Pokój',           area: 10.13 },
    { name: 'Pokój',           area: 11.25 },
  ],
}

const PARTER_M09_M11: FloorDef = {
  name: 'Parter',
  area: 62.81,
  rooms: [
    { name: 'Wiatrołap',         area:  3.46 },
    { name: 'Hol',               area:  4.23 },
    { name: 'Pom. gospodarcze',  area:  2.00 },
    { name: 'Garaż',             area: 16.47 },
    { name: 'Łazienka',          area:  3.10 },
    { name: 'Salon + kuchnia',   area: 33.55 },
  ],
}

const PARTER_M10_M12: FloorDef = {
  name: 'Parter',
  area: 62.67,
  rooms: [
    { name: 'Wiatrołap',         area:  3.46 },
    { name: 'Hol',               area:  4.23 },
    { name: 'Pom. gospodarcze',  area:  1.96 },
    { name: 'Garaż',             area: 16.47 },
    { name: 'Łazienka',          area:  3.04 },
    { name: 'Salon + kuchnia',   area: 33.51 },
  ],
}

const PIETRO_M09_M12: FloorDef = {
  name: 'Piętro',
  area: 47.50,
  rooms: [
    { name: 'Pokój',    area: 17.17 },
    { name: 'Garderoba', area:  2.18 },
    { name: 'Łazienka', area:  2.58 },
    { name: 'Hol',      area:  2.24 },
    { name: 'Łazienka', area:  3.07 },
    { name: 'Pokój',    area:  9.54 },
    { name: 'Pokój',    area: 10.72 },
  ],
}

const TYPES: TypeDef[] = [
  { name: 'M01', totalArea:  85.16, floors: [PARTER_M01_M04, PIETRO_M01_M04] },
  { name: 'M02', totalArea:  85.31, floors: [PARTER_M02_M03, PIETRO_M01_M04] },
  { name: 'M03', totalArea:  85.31, floors: [PARTER_M02_M03, PIETRO_M01_M04] },
  { name: 'M04', totalArea:  85.16, floors: [PARTER_M01_M04, PIETRO_M01_M04] },
  { name: 'M05', totalArea:  55.86, floors: [PARTER_M05_M07] },
  { name: 'M06', totalArea:  55.68, floors: [PIETRO_M06_M08] },
  { name: 'M07', totalArea:  55.86, floors: [PARTER_M05_M07] },
  { name: 'M08', totalArea:  55.68, floors: [PIETRO_M06_M08] },
  { name: 'M09', totalArea: 110.31, floors: [PARTER_M09_M11, PIETRO_M09_M12] },
  { name: 'M10', totalArea: 110.17, floors: [PARTER_M10_M12, PIETRO_M09_M12] },
  { name: 'M11', totalArea: 110.31, floors: [PARTER_M09_M11, PIETRO_M09_M12] },
  { name: 'M12', totalArea: 110.17, floors: [PARTER_M10_M12, PIETRO_M09_M12] },
]

const UNIT_TYPE_MAP: Record<string, string> = {
  '29': 'M01', '30': 'M02', '31': 'M04', '32': 'M03',
  '33': 'M01', '34': 'M02', '35': 'M04', '36': 'M03',
  '37': 'M01', '38': 'M02', '39': 'M04', '40': 'M03',
  '41': 'M05', '42': 'M06', '43': 'M07', '44': 'M08',
  '45': 'M09', '46': 'M10', '47': 'M11', '48': 'M12',
}

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: PROJECT_ID },
    select: { id: true, name: true, slug: true },
  })
  if (!project) throw new Error(`Project not found: ${PROJECT_ID}`)

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Project: ${project.name} (${project.slug})`)
  console.log('')

  // ---------- Part 1: rewrite HouseTypes ----------
  console.log('--- HouseTypes M01–M12 ---')
  const typeIdByName = new Map<string, string>()
  for (const t of TYPES) {
    const existing = await prisma.houseType.findFirst({
      where: { projectId: PROJECT_ID, name: t.name },
      include: { floorPlans: { include: { rooms: true } } },
    })

    const roomCount = t.floors.reduce((s, f) => s + f.rooms.length, 0)
    const action = existing ? 'REPLACE' : 'CREATE'

    if (!APPLY) {
      const oldFP = existing?.floorPlans.length ?? 0
      const oldRooms = existing?.floorPlans.reduce((s, f) => s + f.rooms.length, 0) ?? 0
      const oldArea = existing?.totalArea ?? null
      console.log(`  ${action.padEnd(7)} ${t.name}  totalArea: ${oldArea} → ${t.totalArea}  floors: ${oldFP}→${t.floors.length}  rooms: ${oldRooms}→${roomCount}`)
      if (existing) typeIdByName.set(t.name, existing.id)
      continue
    }

    let typeId: string
    if (existing) {
      // Delete child FloorPlans (cascades to Rooms), then update totalArea.
      await prisma.floorPlan.deleteMany({ where: { houseTypeId: existing.id } })
      await prisma.houseType.update({ where: { id: existing.id }, data: { totalArea: t.totalArea } })
      typeId = existing.id
    } else {
      const ht = await prisma.houseType.create({
        data: { projectId: PROJECT_ID, name: t.name, totalArea: t.totalArea },
      })
      typeId = ht.id
    }

    for (const f of t.floors) {
      const fp = await prisma.floorPlan.create({
        data: { houseTypeId: typeId, name: f.name, area: f.area },
      })
      let n = 1
      for (const r of f.rooms) {
        await prisma.room.create({
          data: { floorPlanId: fp.id, name: r.name, area: r.area, number: n++ },
        })
      }
    }
    typeIdByName.set(t.name, typeId)
    console.log(`  ✓ ${action.padEnd(7)} ${t.name}  totalArea=${t.totalArea}  +${t.floors.length} floors, +${roomCount} rooms  id=${typeId}`)
  }

  // ---------- Part 2: link units to types ----------
  console.log('')
  console.log('--- Unit → HouseType links (units 29–48) ---')
  const labels = Object.keys(UNIT_TYPE_MAP)
  const units = await prisma.unit.findMany({
    where: { projectId: PROJECT_ID, label: { in: labels } },
    select: { id: true, label: true, houseTypeId: true },
  })
  const unitByLabel = new Map(units.map(u => [u.label, u]))

  // For dry-run we also need to know type IDs; fetch existing ones again if not in map.
  if (!APPLY) {
    const existingTypes = await prisma.houseType.findMany({
      where: { projectId: PROJECT_ID, name: { in: TYPES.map(t => t.name) } },
      select: { id: true, name: true },
    })
    for (const et of existingTypes) typeIdByName.set(et.name, et.id)
  }

  let linked = 0, alreadyOk = 0, missingUnit = 0
  for (const [label, typeName] of Object.entries(UNIT_TYPE_MAP)) {
    const u = unitByLabel.get(label)
    if (!u) {
      console.log(`  MISSING  unit label=${label}  (not in DB — skipping)`)
      missingUnit++
      continue
    }
    const wantedTypeId = typeIdByName.get(typeName)
    if (!wantedTypeId) {
      console.log(`  WAIT     unit ${label} → ${typeName}  (type id not yet created — would resolve on apply)`)
      continue
    }
    if (u.houseTypeId === wantedTypeId) {
      console.log(`  OK       unit ${label} → ${typeName}  (already linked)`)
      alreadyOk++
      continue
    }

    if (!APPLY) {
      console.log(`  PLAN     unit ${label} → ${typeName}  (current=${u.houseTypeId ?? 'NULL'})`)
    } else {
      await prisma.unit.update({ where: { id: u.id }, data: { houseTypeId: wantedTypeId } })
      console.log(`  ✓ LINK   unit ${label} → ${typeName}`)
    }
    linked++
  }

  console.log('')
  console.log(`Summary: ${APPLY ? 'updated' : 'would update'} ${TYPES.length} types · ${APPLY ? 'linked' : 'would link'} ${linked} units · already linked: ${alreadyOk} · missing units: ${missingUnit}`)
  if (!APPLY) console.log('\nRe-run with --apply to write to the database.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
