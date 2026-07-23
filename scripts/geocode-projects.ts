import { prisma } from '../lib/prisma'
import { geocodeAddress, buildProjectAddress } from '../lib/geocode'

async function main() {
  const onlyMissing = !process.argv.includes('--all')
  const projects = await prisma.project.findMany({
    where: onlyMissing ? { OR: [{ latitude: null }, { longitude: null }] } : {},
    select: {
      id: true, name: true, location: true,
      investVoivodeship: true, investCity: true, investStreet: true,
      investBuildingNr: true, investPostalCode: true,
    },
  })

  console.log(`Geocoding ${projects.length} project(s)...`)
  for (const p of projects) {
    const address = buildProjectAddress(p)
    if (!address) {
      console.log(`skip ${p.name} — no address`)
      continue
    }
    const result = await geocodeAddress(address)
    if (!result.ok) {
      console.log(`fail ${p.name} — "${address}" — ${result.reason}`)
      continue
    }
    await prisma.project.update({
      where: { id: p.id },
      data: { latitude: result.lat, longitude: result.lng },
    })
    console.log(`ok   ${p.name} → ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`)
    await new Promise(r => setTimeout(r, 120))
  }
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
