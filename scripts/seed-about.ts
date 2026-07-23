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

async function main() {
  const existingInvestments = await prisma.upcomingInvestment.count()
  if (existingInvestments === 0) {
    await prisma.upcomingInvestment.createMany({
      data: [
        { title: 'Kaszów, okolice Krakowa', description: 'Działka już zakupiona, a projekt aktualnie jest w trakcie realizacji!', status: 'W przygotowaniu', statusColor: '#5A2A1C', order: 0 },
        { title: 'Jastrzębie, okolice Warszawy', description: 'Niedługo rozpocznie się budowa bliźniaka niedaleko Piaseczna.', status: 'Start wkrótce', statusColor: '#6E2E2A', order: 1 },
        { title: 'Baku', description: 'Budowa dwóch domów wolnostojących już się rozpoczęła. Budujemy też drugą inwestycję z własnym basenem w okolicach Baku.', status: 'W realizacji', statusColor: '#3E1718', order: 2 },
      ],
    })
    console.log('Seeded 3 upcoming investments')
  } else {
    console.log(`Skipped — ${existingInvestments} investments already exist`)
  }

  const existingCities = await prisma.newCity.count()
  if (existingCities === 0) {
    await prisma.newCity.createMany({
      data: [
        { city: 'KRAKÓW', date: 'od 10.01.2026', order: 0 },
        { city: 'NIEMCY', date: 'od 01.10.2026', order: 1 },
      ],
    })
    console.log('Seeded 2 new cities')
  } else {
    console.log(`Skipped — ${existingCities} cities already exist`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
