/**
 * One-time injection of Bawarski Wawer units (lokale) from the developer's
 * xlsx (source: ~/Downloads/JEDNOPIĘTROWY WAWER sp. z o. o. Bawarski Wawer
 * completed table 17 June NEW .xlsx — the corrected file; the first file had
 * Typ C/D areas swapped).
 *
 * 4 units mapping onto the existing HouseTypes Typ A–D (see
 * scripts/inject-wawer-house-types.ts). Labels are the developer's "numeracja
 * robocza" working numbers (1–4). Polygons are not drawn yet — units are created
 * with placeholder svgElementId matching the admin's `sanitizeId(label)`
 * convention (see admin-plan-editor.tsx#106), so they stay hidden on the public
 * site until an admin draws the polygon.
 *
 * The project has no Company linked (companyId stays null, matching the project).
 * Each unit links to its HouseType (resolved by name at runtime).
 * All extras are "nie dotyczy" → fullPrice = price.
 *
 * Notes on source data:
 *   - Typ B area forced to 99.06 (xlsx had 99.07; matches Typ A and HouseType.totalArea) per user.
 *   - Garden areas were "ok. N" in xlsx → stored as exact numbers (90 / 150 / 450).
 *
 * Idempotent: re-running skips units whose (projectId, svgElementId) already
 * exists. Re-creating PriceHistory is skipped if any exists for the unit.
 *
 * Usage:
 *   npx tsx scripts/inject-wawer-units.ts            # dry run (default)
 *   npx tsx scripts/inject-wawer-units.ts --apply    # actually write
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

function sanitizeId(label: string) {
  return 'unit-' + label.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

type WawerUnit = {
  label: string            // developer "numeracja robocza" working number
  typeName: string         // HouseType.name to link
  building: string
  lokal: string
  rooms: number
  area: number
  gardenArea: number | null
  floor: string
  floors: number
  status: 'available' | 'reserved' | 'sold'
  price: number | null
  description?: string     // optional override; defaults to "Budynek X, Lokal Y"
}

// Source rows (17 June NEW file). Garden "ok. N" stored as exact N.
const UNITS: WawerUnit[] = [
  { label: '1', typeName: 'Typ B', building: '2', lokal: '2', rooms: 4, area: 99.06, gardenArea: 450, floor: 'dom parterowy z użytkowym poddaszem', floors: 2, status: 'available', price: 1_485_000 },
  { label: '2', typeName: 'Typ A', building: '2', lokal: '1', rooms: 4, area: 99.06, gardenArea:  90, floor: 'dom parterowy z użytkowym poddaszem', floors: 2, status: 'available', price: 1_259_000 },
  { label: '3', typeName: 'Typ C', building: '1', lokal: '1', rooms: 3, area: 53.09, gardenArea: 150, floor: 'parter',                              floors: 1, status: 'available', price:   850_000 },
  { label: '4', typeName: 'Typ D', building: '1', lokal: '2', rooms: 3, area: 52.54, gardenArea: 150, floor: 'piętro, częściowo parter — wiatrołap na parterze', floors: 2, status: 'available', price:   850_000,
    description: 'Budynek 1, Lokal 2; Lokal położony głównie na piętrze; do lokalu należy również wiatrołap o powierzchni 1,13 m² znajdujący się na parterze.' },
]

async function main() {
  const project = await prisma.project.findUnique({ where: { id: PROJECT_ID }, select: { id: true, name: true, slug: true } })
  if (!project) throw new Error(`Project not found: ${PROJECT_ID}`)

  // Resolve house types by name
  const typeNames = [...new Set(UNITS.map(u => u.typeName))]
  const types = await prisma.houseType.findMany({
    where: { projectId: PROJECT_ID, name: { in: typeNames } },
    select: { id: true, name: true },
  })
  const typeIdByName = new Map(types.map(t => [t.name, t.id]))
  const missing = typeNames.filter(n => !typeIdByName.has(n))
  if (missing.length) throw new Error(`HouseType(s) not found for project: ${missing.join(', ')}. Run inject-wawer-house-types.ts first.`)

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Project: ${project.name} (${project.slug})`)
  console.log(`House types: ${types.map(t => `${t.name}=${t.id}`).join(', ')}`)
  console.log(`Planned units: ${UNITS.length} (labels ${UNITS.map(u => u.label).join(', ')})`)
  console.log('')

  let created = 0, skipped = 0
  for (const u of UNITS) {
    const svgElementId = sanitizeId(u.label) // → "unit-1" etc.
    const description = u.description ?? `Budynek ${u.building}, Lokal ${u.lokal}`

    const existing = await prisma.unit.findUnique({
      where: { projectId_svgElementId: { projectId: PROJECT_ID, svgElementId } },
      select: { id: true, label: true },
    })
    if (existing) {
      console.log(`  SKIP  ${u.label.padStart(2)}  (already exists: id=${existing.id})`)
      skipped++
      continue
    }

    const data = {
      projectId: PROJECT_ID,
      companyId: null,
      houseTypeId: typeIdByName.get(u.typeName)!,
      svgElementId,
      label: u.label,
      status: u.status,
      buildingLabel: u.building,
      floor: u.floor,
      floors: u.floors,
      rooms: u.rooms,
      area: u.area,
      gardenArea: u.gardenArea,
      price: u.price,
      fullPrice: u.price,
      description,
    }

    if (!APPLY) {
      const pps = data.price && data.area ? (data.price / data.area).toFixed(2) : '—'
      console.log(`  PLAN  ${u.label.padStart(2)}  ${u.typeName}  B${u.building}/L${u.lokal} ${u.area}m² ogr.${u.gardenArea ?? '—'}m² ${u.price?.toLocaleString('pl-PL') ?? '—'} zł (${pps}/m²) ${u.status.padEnd(9)} → ${u.floor} (${u.floors}p)`)
    } else {
      const unit = await prisma.unit.create({ data })
      if (unit.price) {
        const pricePerSqm = unit.area && unit.area > 0 ? unit.price / unit.area : null
        await prisma.priceHistory.create({
          data: { unitId: unit.id, totalPrice: unit.price, pricePerSqm },
        })
      }
      console.log(`  ✓     ${u.label.padStart(2)}  created id=${unit.id} (${u.typeName})`)
    }
    created++
  }

  console.log('')
  console.log(`${APPLY ? 'Created' : 'Would create'}: ${created}   Skipped (already exist): ${skipped}`)
  if (!APPLY) console.log('\nRe-run with --apply to write to the database.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
