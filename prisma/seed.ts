import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// A simple SVG with 12 numbered plots
const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#f0f0f0"/>
  <!-- Road -->
  <rect x="0" y="260" width="800" height="80" fill="#d4d0c8" rx="0"/>
  <text x="400" y="308" text-anchor="middle" fill="#888" font-size="14" font-family="Arial">ul. Szlachecka</text>

  <!-- Top row: 6 plots -->
  <rect id="A1" x="20" y="20" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="75" y="135" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">A1</text>

  <rect id="A2" x="145" y="20" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="200" y="135" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">A2</text>

  <rect id="A3" x="270" y="20" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="325" y="135" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">A3</text>

  <rect id="A4" x="395" y="20" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="450" y="135" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">A4</text>

  <rect id="A5" x="520" y="20" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="575" y="135" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">A5</text>

  <rect id="A6" x="645" y="20" width="135" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="712" y="135" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">A6</text>

  <!-- Bottom row: 6 plots -->
  <rect id="B1" x="20" y="360" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="75" y="475" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">B1</text>

  <rect id="B2" x="145" y="360" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="200" y="475" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">B2</text>

  <rect id="B3" x="270" y="360" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="325" y="475" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">B3</text>

  <rect id="B4" x="395" y="360" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="450" y="475" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">B4</text>

  <rect id="B5" x="520" y="360" width="110" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="575" y="475" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">B5</text>

  <rect id="B6" x="645" y="360" width="135" height="220" fill="#94a3b8" stroke="#fff" stroke-width="2" rx="4" cursor="pointer"/>
  <text x="712" y="475" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold" pointer-events="none">B6</text>
</svg>`

async function main() {
  console.log('Seeding database...')

  // Clean up existing seed data
  await prisma.unit.deleteMany({})
  await prisma.project.deleteMany({})

  const project = await prisma.project.create({
    data: {
      name: 'Osiedle Szlacheckie',
      slug: 'osiedle-szlacheckie-plan',
      location: 'Warszawa, ul. Szlachecka',
      description:
        'Ekskluzywne osiedle domów jednorodzinnych w stylu bawarskim. 12 działek w dwóch rzędach, każda z własnym ogrodem.',
      status: 'active',
      svgContent: SAMPLE_SVG,
      units: {
        create: [
          { svgElementId: 'A1', label: 'A1', status: 'sold', area: 156.0, rooms: 5, floors: 2, price: 895000, description: 'Dom narożny z dużym ogrodem' },
          { svgElementId: 'A2', label: 'A2', status: 'sold', area: 148.5, rooms: 5, floors: 2, price: 875000, description: 'Dom środkowy, gotowy do odbioru' },
          { svgElementId: 'A3', label: 'A3', status: 'reserved', area: 148.5, rooms: 5, floors: 2, price: 875000, description: 'Dom środkowy, w trakcie wykończenia' },
          { svgElementId: 'A4', label: 'A4', status: 'available', area: 152.0, rooms: 5, floors: 2, price: 885000, description: 'Dom z widokiem na park' },
          { svgElementId: 'A5', label: 'A5', status: 'available', area: 148.5, rooms: 5, floors: 2, price: 879000, description: 'Dom środkowy, etap I' },
          { svgElementId: 'A6', label: 'A6', status: 'available', area: 165.0, rooms: 6, floors: 2, price: 950000, description: 'Dom narożny z garażem dwustanowiskowym' },
          { svgElementId: 'B1', label: 'B1', status: 'available', area: 156.0, rooms: 5, floors: 2, price: 895000, description: 'Dom narożny, II etap' },
          { svgElementId: 'B2', label: 'B2', status: 'available', area: 148.5, rooms: 4, floors: 2, price: 855000, description: 'Dom środkowy, kompaktowy układ' },
          { svgElementId: 'B3', label: 'B3', status: 'reserved', area: 148.5, rooms: 5, floors: 2, price: 870000, description: 'Dom środkowy, rezerwacja notarialna' },
          { svgElementId: 'B4', label: 'B4', status: 'available', area: 152.0, rooms: 5, floors: 2, price: 885000, description: 'Dom z ogrodem południowym' },
          { svgElementId: 'B5', label: 'B5', status: 'available', area: 148.5, rooms: 5, floors: 2, price: 869000, description: 'Dom środkowy, atrakcyjna cena' },
          { svgElementId: 'B6', label: 'B6', status: 'sold', area: 168.0, rooms: 6, floors: 2, price: 975000, description: 'Dom narożny premium, sprzedany' },
        ],
      },
    },
  })

  console.log(`Created project: ${project.name} (${project.id})`)
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
