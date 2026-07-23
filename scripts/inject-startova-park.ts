/**
 * One-time, idempotent import for "Startova Park" (Kębłowice / Wrocław).
 * Source files (hard-coded below for auditability, not read at runtime):
 *   - "Wroclavia Development (STARTOVA PARK) completed table (1).xlsx"  (units)
 *   - "StartovaPark_Keblowice_Typy_1A_4B.pdf"                           (house types)
 *
 * Does three idempotent things:
 *   1. Project setup: link to Wroclavia Development, set invest address fields,
 *      propertyType, status=active. (Does NOT publish — published stays as-is.)
 *   2. 8 HouseTypes (Typ 1A–4B) with Parter + Poddasze floor plans + rooms.
 *   3. 8 Units (działki) linked to their HouseType, with initial PriceHistory.
 *
 * Re-runnable: existing house types (by name) and units (by svgElementId) are
 * skipped; the project update only writes changed fields.
 *
 *   npx tsx --env-file=.env.local scripts/inject-startova-park.ts          (dry-run)
 *   npx tsx --env-file=.env.local scripts/inject-startova-park.ts --apply
 */
import { prisma } from '@/lib/prisma'

const APPLY = process.argv.includes('--apply')
const PROJECT_ID = 'cmqgizfzj00006p0l8ejzuvho' // Startova Park (slug "keblowice")
const COMPANY_SLUG = 'wroclavia-development-sp-z-o-o'
const DZIALKA = 'dz. nr ew. 20/228, 20/229'

function sanitizeId(label: string) {
  return 'unit-' + label.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

type RoomDef = { name: string; area: number }
type Floor = { name: string; area: number; rooms: RoomDef[] }

// Two shared layouts (PDF). Areas are the "Użytkowa" values.
const LAYOUT_A: Floor[] = [
  { name: 'Parter', area: 61.3, rooms: [
    { name: 'wiatrołap', area: 3.5 }, { name: 'garaż', area: 17.5 }, { name: 'pom. tech.', area: 2.4 },
    { name: 'WC', area: 2.6 }, { name: 'korytarz', area: 6.7 }, { name: 'salon z aneksem kuch.', area: 28.6 },
  ] },
  { name: 'Poddasze', area: 50.3, rooms: [
    { name: 'korytarz', area: 5.2 }, { name: 'pokój', area: 8.5 }, { name: 'pokój', area: 8.6 },
    { name: 'łazienka', area: 4.3 }, { name: 'pokój', area: 9.7 }, { name: 'sypialnia', area: 11.5 }, { name: 'garderoba', area: 2.5 },
  ] },
]
const LAYOUT_B: Floor[] = [
  { name: 'Parter', area: 63.0, rooms: [
    { name: 'wiatrołap', area: 4.5 }, { name: 'pokój', area: 9.4 }, { name: 'pom. tech.', area: 3.2 },
    { name: 'WC', area: 3.7 }, { name: 'korytarz', area: 3.9 }, { name: 'salon z aneksem kuch.', area: 38.3 },
  ] },
  { name: 'Poddasze', area: 50.4, rooms: [
    { name: 'korytarz', area: 5.4 }, { name: 'pokój', area: 8.5 }, { name: 'pokój', area: 8.7 },
    { name: 'łazienka', area: 4.3 }, { name: 'pokój', area: 9.8 }, { name: 'sypialnia', area: 10.9 }, { name: 'garderoba', area: 2.8 },
  ] },
]

const TYPES: { name: string; totalArea: number; layout: Floor[] }[] = [
  { name: 'Typ 1A', totalArea: 111.6, layout: LAYOUT_A },
  { name: 'Typ 1B', totalArea: 111.6, layout: LAYOUT_A },
  { name: 'Typ 2A', totalArea: 111.6, layout: LAYOUT_A },
  { name: 'Typ 2B', totalArea: 111.6, layout: LAYOUT_A },
  { name: 'Typ 3A', totalArea: 113.4, layout: LAYOUT_B },
  { name: 'Typ 3B', totalArea: 111.6, layout: LAYOUT_A },
  { name: 'Typ 4A', totalArea: 113.4, layout: LAYOUT_B },
  { name: 'Typ 4B', totalArea: 111.6, layout: LAYOUT_A },
]

const PARTS_AB = 'lokal / ogród / miejsce parkingowe / garaż (w bryle budynku)'
const PARTS_3A4A = 'Lokal / ogród / miejsca parkingowe'
const RIGHTS = 'Prawo do wyłącznego korzystania z ogródka i miejsc postojowych/Prawo do korzystania z części wspólnych'

// label = "numeracja robocza" (the working plot number on the site plan)
const UNITS: { label: string; type: string; building: string; lokal: string; area: number; garden: number; price: number; parts: string }[] = [
  { label: '6', type: 'Typ 1A', building: '1', lokal: 'A', area: 111.6, garden: 111.7, price: 940000, parts: PARTS_AB },
  { label: '5', type: 'Typ 1B', building: '1', lokal: 'B', area: 111.6, garden: 137.2, price: 960000, parts: PARTS_AB },
  { label: '1', type: 'Typ 2A', building: '2', lokal: 'A', area: 111.6, garden: 138.9, price: 960000, parts: PARTS_AB },
  { label: '2', type: 'Typ 2B', building: '2', lokal: 'B', area: 111.6, garden: 112.6, price: 940000, parts: PARTS_AB },
  { label: '4', type: 'Typ 3A', building: '3', lokal: 'A', area: 113.4, garden: 174.5, price: 975000, parts: PARTS_3A4A },
  { label: '3', type: 'Typ 3B', building: '3', lokal: 'B', area: 111.6, garden: 114.5, price: 940000, parts: PARTS_AB },
  { label: '8', type: 'Typ 4A', building: '4', lokal: 'A', area: 113.4, garden: 183.5, price: 975000, parts: PARTS_3A4A },
  { label: '7', type: 'Typ 4B', building: '4', lokal: 'B', area: 111.6, garden: 111.3, price: 940000, parts: PARTS_AB },
]

const PROJECT_FIELDS = {
  status: 'active',
  propertyType: 'Dom jednorodzinny',
  investVoivodeship: 'dolnośląskie',
  investCounty: 'wrocławski',
  investMunicipality: 'Kąty Wrocławskie',
  investCity: 'Kębłowice',
  investStreet: 'Startowa',
  investPostalCode: '55-080',
} as const

function round2(n: number) { return Math.round(n * 100) / 100 }

async function main() {
  console.log(`\n=== ${APPLY ? 'APPLY' : 'DRY-RUN'} — inject Startova Park ===\n`)

  // sanity: room sums == totalArea
  for (const t of TYPES) {
    const sum = round2(t.layout.reduce((n, f) => n + f.rooms.reduce((m, r) => m + r.area, 0), 0))
    const ok = Math.abs(sum - t.totalArea) < 0.011
    if (!ok) throw new Error(`SANITY FAIL ${t.name}: rooms sum ${sum} != totalArea ${t.totalArea}`)
  }
  console.log('sanity: room areas sum to totalArea for all 8 types ✓\n')

  const project = await prisma.project.findUnique({ where: { id: PROJECT_ID },
    select: { id: true, name: true, slug: true, companyId: true, status: true, published: true, propertyType: true,
      investCity: true, investStreet: true, investPostalCode: true, investVoivodeship: true, investCounty: true, investMunicipality: true } })
  if (!project) throw new Error(`Project ${PROJECT_ID} not found`)
  const company = await prisma.company.findUnique({ where: { slug: COMPANY_SLUG }, select: { id: true, name: true } })
  if (!company) throw new Error(`Company ${COMPANY_SLUG} not found`)
  console.log(`project: "${project.name.trim()}" (slug ${project.slug}, published=${project.published})`)
  console.log(`company: ${company.name}\n`)

  // 1) project setup (idempotent)
  const update: Record<string, unknown> = {}
  if (project.companyId !== company.id) update.companyId = company.id
  for (const [k, v] of Object.entries(PROJECT_FIELDS)) {
    if ((project as Record<string, unknown>)[k] !== v) update[k] = v
  }
  console.log('1) PROJECT SETUP')
  if (Object.keys(update).length === 0) console.log('   (no change — already set)')
  else { for (const [k, v] of Object.entries(update)) console.log(`   set ${k} = ${JSON.stringify(v)}`)
    if (APPLY) { await prisma.project.update({ where: { id: PROJECT_ID }, data: update }); console.log('   ✓ written') } }

  // 2) house types
  console.log('\n2) HOUSE TYPES')
  const typeIdByName = new Map<string, string>()
  for (const t of TYPES) {
    const existing = await prisma.houseType.findFirst({ where: { projectId: PROJECT_ID, name: t.name }, select: { id: true } })
    if (existing) { typeIdByName.set(t.name, existing.id); console.log(`   SKIP ${t.name} (exists)`); continue }
    const floorSummary = t.layout.map((f) => `${f.name} ${f.area}m²/${f.rooms.length}r`).join(', ')
    console.log(`   CREATE ${t.name} (totalArea ${t.totalArea}) — ${floorSummary}`)
    if (APPLY) {
      const ht = await prisma.houseType.create({ data: { projectId: PROJECT_ID, name: t.name, totalArea: t.totalArea } })
      for (const f of t.layout) {
        const fp = await prisma.floorPlan.create({ data: { houseTypeId: ht.id, name: f.name, area: f.area } })
        await prisma.room.createMany({ data: f.rooms.map((r, i) => ({ floorPlanId: fp.id, number: i + 1, name: r.name, area: r.area })) })
      }
      typeIdByName.set(t.name, ht.id); console.log('     ✓ written')
    }
  }

  // 3) units + price history
  console.log('\n3) UNITS (działki)')
  for (const u of UNITS) {
    const svgElementId = sanitizeId(u.label)
    const existing = await prisma.unit.findUnique({ where: { projectId_svgElementId: { projectId: PROJECT_ID, svgElementId } }, select: { id: true } })
    if (existing) { console.log(`   SKIP label ${u.label} (${svgElementId} exists)`); continue }
    const htId = typeIdByName.get(u.type) ?? null
    const description = `Budynek ${u.building}, Lokal ${u.lokal}; ${DZIALKA}`
    console.log(`   CREATE label ${u.label} | ${u.type} | bud ${u.building} lok ${u.lokal} | ${u.area}m² ogród ${u.garden}m² | ${u.price.toLocaleString('pl-PL')} zł | houseType=${htId ? 'linked' : '(dry-run/no-id)'}`)
    if (APPLY) {
      const unit = await prisma.unit.create({ data: {
        projectId: PROJECT_ID, svgElementId, label: u.label, status: 'available',
        area: u.area, gardenArea: u.garden, floor: 'parter i użytkowe poddasze', rooms: 5, floors: 2,
        buildingLabel: u.building, price: u.price, fullPrice: u.price, description,
        partsType: u.parts, partsLabel: u.parts, rightsDesc: RIGHTS,
        houseTypeId: htId,
      } })
      await prisma.priceHistory.create({ data: { unitId: unit.id, pricePerSqm: u.area > 0 ? u.price / u.area : null, totalPrice: u.price, fullPrice: u.price } })
      console.log('     ✓ written (+ PriceHistory)')
    }
  }

  console.log(`\nNote: project.published is left = ${project.published} (publish manually in admin when ready).`)
  console.log(`Note: units have NO polygons yet — draw them in the plan editor so they appear on the public site.\n`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
