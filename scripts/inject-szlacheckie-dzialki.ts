/**
 * One-time injection of Osiedle Szlacheckie działki from 3 xlsx files
 * (Etap V/VI/VII). Labels start at 29 (28 already exist). Polygons are not
 * drawn yet — units are created with placeholder svgElementId matching the
 * admin's `sanitizeId(label)` convention (see admin-plan-editor.tsx#106).
 *
 * Idempotent: re-running skips units whose (projectId, svgElementId) already
 * exists. Re-creating PriceHistory is skipped if any exists for the unit.
 *
 * Usage:
 *   npx tsx scripts/inject-szlacheckie-dzialki.ts            # dry run (default)
 *   npx tsx scripts/inject-szlacheckie-dzialki.ts --apply    # actually write
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
const COMPANY_IDS = {
  szlacheckaBawaria: 'cmp41pqzu0000a4snyjed1hpm',
  // Looked up by slug at runtime:
  bawariaDevelopment: '',
  jednopietrowaPolska: '',
}

function sanitizeId(label: string) {
  return 'unit-' + label.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

type Dz = {
  num: number
  companyKey: keyof typeof COMPANY_IDS
  building: string
  lokal: string
  rooms: number
  area: number
  gardenArea: number | null
  floor: string
  floors: number
  status: 'available' | 'reserved' | 'sold'
  price: number | null
  cadastral: string
}

// Etap V — Szlachecka Bawaria sp. z o.o. (8 units)
// All ~85 m², 5 rooms, parter + użytkowe poddasze (2 floors), cadastral 44/20, 44/21
const ETAP_V: Dz[] = [
  { num: 29, companyKey: 'szlacheckaBawaria', building: '1', lokal: '1', rooms: 5, area: 85, gardenArea: 159, floor: 'parter + użytkowe poddasze', floors: 2, status: 'reserved',  price: 1_050_000, cadastral: 'dz. nr ew. 44/20, 44/21' },
  { num: 30, companyKey: 'szlacheckaBawaria', building: '1', lokal: '2', rooms: 5, area: 85, gardenArea:  53, floor: 'parter + użytkowe poddasze', floors: 2, status: 'reserved',  price:   980_000, cadastral: 'dz. nr ew. 44/20, 44/21' },
  { num: 31, companyKey: 'szlacheckaBawaria', building: '2', lokal: '1', rooms: 5, area: 85, gardenArea: 195, floor: 'parter + użytkowe poddasze', floors: 2, status: 'reserved',  price: 1_050_000, cadastral: 'dz. nr ew. 44/20, 44/21' },
  { num: 32, companyKey: 'szlacheckaBawaria', building: '2', lokal: '2', rooms: 5, area: 85, gardenArea:  53, floor: 'parter + użytkowe poddasze', floors: 2, status: 'reserved',  price:   980_000, cadastral: 'dz. nr ew. 44/20, 44/21' },
  { num: 33, companyKey: 'szlacheckaBawaria', building: '3', lokal: '1', rooms: 5, area: 85, gardenArea: 202, floor: 'parter + użytkowe poddasze', floors: 2, status: 'available', price: 1_080_000, cadastral: 'dz. nr ew. 44/20, 44/21' },
  { num: 34, companyKey: 'szlacheckaBawaria', building: '3', lokal: '2', rooms: 5, area: 85, gardenArea:  37, floor: 'parter + użytkowe poddasze', floors: 2, status: 'available', price:   980_000, cadastral: 'dz. nr ew. 44/20, 44/21' },
  { num: 35, companyKey: 'szlacheckaBawaria', building: '4', lokal: '1', rooms: 5, area: 85, gardenArea: 199, floor: 'parter + użytkowe poddasze', floors: 2, status: 'available', price: 1_080_000, cadastral: 'dz. nr ew. 44/20, 44/21' },
  { num: 36, companyKey: 'szlacheckaBawaria', building: '4', lokal: '2', rooms: 5, area: 85, gardenArea:  37, floor: 'parter + użytkowe poddasze', floors: 2, status: 'available', price:   980_000, cadastral: 'dz. nr ew. 44/20, 44/21' },
]

// Etap VI — Jednopiętrowa Polska sp. z o.o. (8 units)
// B1+B2: 5 rooms ~85 m², parter+poddasze. B3+B4: 3 rooms ~55 m², split (lok 1 parter, lok 2 piętro).
const ETAP_VI: Dz[] = [
  { num: 37, companyKey: 'jednopietrowaPolska', building: '1', lokal: '1', rooms: 5, area: 85.16, gardenArea: 165, floor: 'parterowy + użytkowe poddasze', floors: 2, status: 'available', price: 1_050_000, cadastral: 'dz. nr ew. 44/22, 44/23, 44/24' },
  { num: 38, companyKey: 'jednopietrowaPolska', building: '1', lokal: '2', rooms: 5, area: 85.31, gardenArea:  41, floor: 'parterowy + użytkowe poddasze', floors: 2, status: 'available', price:   980_000, cadastral: 'dz. nr ew. 44/22, 44/25, 44/26' },
  { num: 39, companyKey: 'jednopietrowaPolska', building: '2', lokal: '1', rooms: 5, area: 85.16, gardenArea: 175, floor: 'parterowy + użytkowe poddasze', floors: 2, status: 'available', price: 1_050_000, cadastral: 'dz. nr ew. 44/22, 44/27, 44/28' },
  { num: 40, companyKey: 'jednopietrowaPolska', building: '2', lokal: '2', rooms: 5, area: 85.31, gardenArea:  41, floor: 'parterowy + użytkowe poddasze', floors: 2, status: 'available', price:   980_000, cadastral: 'dz. nr ew. 44/22, 44/29, 44/30' },
  { num: 41, companyKey: 'jednopietrowaPolska', building: '3', lokal: '1', rooms: 3, area: 54.73, gardenArea: 110, floor: 'parter',                         floors: 1, status: 'available', price:   775_000, cadastral: 'dz. nr ew. 44/22, 44/31, 44/32' },
  { num: 42, companyKey: 'jednopietrowaPolska', building: '3', lokal: '2', rooms: 3, area: 55.68, gardenArea: 192, floor: 'piętro + nie użytkowe poddasze', floors: 2, status: 'available', price:   775_000, cadastral: 'dz. nr ew. 44/22, 44/33, 44/34' },
  { num: 43, companyKey: 'jednopietrowaPolska', building: '4', lokal: '1', rooms: 3, area: 54.73, gardenArea: 110, floor: 'parter',                         floors: 1, status: 'available', price:   775_000, cadastral: 'dz. nr ew. 44/22, 44/35, 44/36' },
  { num: 44, companyKey: 'jednopietrowaPolska', building: '4', lokal: '2', rooms: 3, area: 55.68, gardenArea: 170, floor: 'piętro + nie użytkowe poddasze', floors: 2, status: 'available', price:   775_000, cadastral: 'dz. nr ew. 44/22, 44/37, 44/38' },
]

// Etap VII — Bawaria Development sp. z o.o. (4 units)
// All parter + użytkowe poddasze (2 floors), 4 rooms (per user — only L1 row had it explicit)
const ETAP_VII: Dz[] = [
  { num: 45, companyKey: 'bawariaDevelopment', building: '1', lokal: '1', rooms: 4, area: 110.31, gardenArea: 330, floor: 'parter + użytkowe poddasze', floors: 2, status: 'reserved',  price: 1_290_000, cadastral: 'dz. nr ew. 44/24' },
  { num: 46, companyKey: 'bawariaDevelopment', building: '1', lokal: '2', rooms: 4, area: 107.45, gardenArea:  48, floor: 'parter + użytkowe poddasze', floors: 2, status: 'available', price: 1_095_000, cadastral: 'dz. nr ew. 44/24' },
  { num: 47, companyKey: 'bawariaDevelopment', building: '2', lokal: '1', rooms: 4, area: 110.31, gardenArea: 452, floor: 'parter + użytkowe poddasze', floors: 2, status: 'reserved',  price: 1_080_000, cadastral: 'dz. nr ew. 44/24' },
  { num: 48, companyKey: 'bawariaDevelopment', building: '2', lokal: '2', rooms: 4, area: 107.45, gardenArea:  59, floor: 'parter + użytkowe poddasze', floors: 2, status: 'reserved',  price: 1_080_000, cadastral: 'dz. nr ew. 44/24' },
]

const ALL: Dz[] = [...ETAP_V, ...ETAP_VI, ...ETAP_VII]

async function main() {
  // Resolve the two non-Szlachecka company IDs by slug
  const cos = await prisma.company.findMany({
    where: { slug: { in: ['bawaria-development-sp-z-o-o', 'jednopietrowa-polska-sp-z-o-o'] } },
    select: { id: true, slug: true },
  })
  for (const c of cos) {
    if (c.slug === 'bawaria-development-sp-z-o-o') COMPANY_IDS.bawariaDevelopment = c.id
    if (c.slug === 'jednopietrowa-polska-sp-z-o-o') COMPANY_IDS.jednopietrowaPolska = c.id
  }
  // Sanity-check Szlachecka by ID
  const szl = await prisma.company.findUnique({ where: { id: COMPANY_IDS.szlacheckaBawaria }, select: { id: true, name: true } })
  if (!szl) throw new Error(`Szlachecka Bawaria company not found by ID ${COMPANY_IDS.szlacheckaBawaria}`)
  if (!COMPANY_IDS.bawariaDevelopment) throw new Error('bawaria-development-sp-z-o-o not found')
  if (!COMPANY_IDS.jednopietrowaPolska) throw new Error('jednopietrowa-polska-sp-z-o-o not found')

  const project = await prisma.project.findUnique({ where: { id: PROJECT_ID }, select: { id: true, name: true, slug: true } })
  if (!project) throw new Error(`Project not found: ${PROJECT_ID}`)

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Project: ${project.name} (${project.slug})`)
  console.log(`Companies:`)
  console.log(`  szlacheckaBawaria  = ${szl.name} (${COMPANY_IDS.szlacheckaBawaria})`)
  console.log(`  bawariaDevelopment = ${COMPANY_IDS.bawariaDevelopment}`)
  console.log(`  jednopietrowaPolska= ${COMPANY_IDS.jednopietrowaPolska}`)
  console.log(`Planned units: ${ALL.length} (labels ${ALL[0].num}..${ALL[ALL.length - 1].num})`)
  console.log('')

  let created = 0, skipped = 0
  for (const d of ALL) {
    const label = String(d.num)
    const svgElementId = sanitizeId(label) // → "unit-29" etc.
    const description = `Budynek ${d.building}, Lokal ${d.lokal}; ${d.cadastral}`

    const existing = await prisma.unit.findUnique({
      where: { projectId_svgElementId: { projectId: PROJECT_ID, svgElementId } },
      select: { id: true, label: true },
    })
    if (existing) {
      console.log(`  SKIP  ${label.padStart(3)}  (already exists: id=${existing.id})`)
      skipped++
      continue
    }

    const data = {
      projectId: PROJECT_ID,
      companyId: COMPANY_IDS[d.companyKey],
      svgElementId,
      label,
      status: d.status,
      buildingLabel: d.building,
      floor: d.floor,
      floors: d.floors,
      rooms: d.rooms,
      area: d.area,
      gardenArea: d.gardenArea,
      price: d.price,
      fullPrice: d.price,
      description,
    }

    if (!APPLY) {
      console.log(`  PLAN  ${label.padStart(3)}  B${d.building}/L${d.lokal} ${d.area}m² ogr.${d.gardenArea ?? '—'}m² ${d.price?.toLocaleString('pl-PL') ?? '—'} zł  ${d.status.padEnd(9)} (${d.companyKey})`)
    } else {
      const unit = await prisma.unit.create({ data })
      if (unit.price) {
        const pricePerSqm = unit.area && unit.area > 0 ? unit.price / unit.area : null
        await prisma.priceHistory.create({
          data: { unitId: unit.id, totalPrice: unit.price, pricePerSqm },
        })
      }
      console.log(`  ✓     ${label.padStart(3)}  created id=${unit.id}`)
    }
    created++
  }

  console.log('')
  console.log(`${APPLY ? 'Created' : 'Would create'}: ${created}   Skipped (already exist): ${skipped}`)
  if (!APPLY) console.log('\nRe-run with --apply to write to the database.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
