/**
 * Adds the "Pierwszy Krakowski" project (belonging to Jednopiętrowy Kraków
 * sp. z o. o.) with 2 placeholder units so the daily-generated CSV matches
 * the WordPress version of mieszkania-jednopietrowy-krakow-sp-z-o-o-*.csv,
 * which carries these two rows with no prices.
 *
 * Project is created with `published: false` so it does NOT appear on the
 * public website — CSV generation does not filter by that flag.
 *
 * Idempotent: upserts the project and skips units that already exist.
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

if (process.env.POSTGRES_PRISMA_URL && !process.env.POSTGRES_PRISMA_URL.includes('pool_timeout=')) {
  const sep = process.env.POSTGRES_PRISMA_URL.includes('?') ? '&' : '?'
  process.env.POSTGRES_PRISMA_URL += `${sep}connection_limit=1&pool_timeout=300`
}

const prisma = new PrismaClient()

const COMPANY_SLUG = 'jednopietrowy-krakow-sp-z-o-o'
const PROJECT_SLUG = 'pierwszy-krakowski'

async function main() {
  const company = await prisma.company.findUnique({ where: { slug: COMPANY_SLUG } })
  if (!company) throw new Error(`Company not found: ${COMPANY_SLUG}`)
  console.log(`Company: ${company.name} (${company.id})`)

  // Values mirror the WP CSV placeholder row exactly (cols 30–37, 45–59)
  const projectData = {
    name: 'Pierwszy Krakowski',
    slug: PROJECT_SLUG,
    location: 'Janowice',
    companyId: company.id,
    published: false,
    investVoivodeship: 'Małopolskie',
    investCounty: null,
    investMunicipality: null,
    investCity: 'Janowice',
    investStreet: 'Janowice',
    investBuildingNr: null,
    investPostalCode: null,
    propertyType: 'Mieszkanie',
    prospektUrl: 'https://jednopietrowawarszawa.pl/',
  }

  const project = await prisma.project.upsert({
    where: { slug: PROJECT_SLUG },
    create: projectData,
    update: projectData,
  })
  console.log(`Project upserted: ${project.name} (${project.id}), published=${project.published}`)

  const unitCommon = {
    projectId: project.id,
    companyId: company.id,
    status: 'available',
    area: null as number | null,
    price: null as number | null,
    fullPrice: null as number | null,
    partsType: 'lokal/ogródek/miejsca parkingowe',
    partsLabel: 'lokal/ogródek/miejsca parkingowe',
    rightsDesc:
      'Prawo do wyłącznego korzystania z ogródka i miejsc postojowych/Prawo do korzystania z części wspólnych',
  }

  let created = 0
  let skipped = 0
  for (const label of ['1', '2']) {
    const svgElementId = `unit-${label}`
    const existing = await prisma.unit.findUnique({
      where: { projectId_svgElementId: { projectId: project.id, svgElementId } },
    })
    if (existing) { skipped++; continue }

    await prisma.unit.create({
      data: { ...unitCommon, svgElementId, label },
    })
    created++
  }

  console.log(`Units: ${created} created, ${skipped} already existed`)
  console.log('\nDone. Tomorrow\'s cron will include these rows in the CSV.')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
