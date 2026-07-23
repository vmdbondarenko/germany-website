/**
 * READ-ONLY audit. For every HouseType, compares the stored `totalArea` against
 * the computed sum of its room areas (the value the site will now display).
 * Reports every discrepancy and which units inherit the new value, so we can
 * decide what to do before merging. Writes nothing.
 *
 * Usage: npx tsx scripts/audit-type-area-vs-rooms.ts
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { typeArea, floorArea } from '../lib/house-type-area'

if (!process.env.POSTGRES_PRISMA_URL) {
  try {
    for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) {
        const v = m[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[m[1].trim()]) process.env[m[1].trim()] = v
      }
    }
  } catch {}
}

const prisma = new PrismaClient()

// Tolerance for "matches" — anything below this is treated as float noise.
const EPS = 0.005

function fmt(n: number | null): string {
  return n == null ? '—' : n.toFixed(2)
}

async function main() {
  const types = await prisma.houseType.findMany({
    include: {
      project: { select: { slug: true } },
      floorPlans: {
        include: { rooms: { select: { name: true, area: true } } },
        orderBy: { createdAt: 'asc' },
      },
      units: { select: { label: true, status: true }, orderBy: { label: 'asc' } },
    },
    orderBy: [{ projectId: 'asc' }, { name: 'asc' }],
  })

  let okCount = 0
  const mismatches: typeof types = []
  const noRooms: typeof types = []

  for (const t of types) {
    const computed = typeArea(t.floorPlans)
    const hasRooms = t.floorPlans.some((f) => f.rooms.some((r) => r.area != null))
    if (!hasRooms) {
      noRooms.push(t)
      continue
    }
    if (t.totalArea != null && computed != null && Math.abs(t.totalArea - computed) < EPS) {
      okCount++
    } else {
      mismatches.push(t)
    }
  }

  console.log('='.repeat(90))
  console.log(`AUDIT: stored HouseType.totalArea  vs  computed sum of room areas`)
  console.log(`Total types: ${types.length}  |  ✓ match: ${okCount}  |  ✗ differ: ${mismatches.length}  |  no room data: ${noRooms.length}`)
  console.log('='.repeat(90))

  if (mismatches.length) {
    console.log('\n✗ DISCREPANCIES (stored → computed) — these change on the live site:\n')
    for (const t of mismatches) {
      const computed = typeArea(t.floorPlans)
      const delta = t.totalArea != null && computed != null ? computed - t.totalArea : null
      console.log(
        `[${t.project.slug}] ${t.name}: ${fmt(t.totalArea)} → ${fmt(computed)} m²` +
          (delta != null ? `  (${delta > 0 ? '+' : ''}${delta.toFixed(2)})` : '') +
          (t.units.length ? `   units: ${t.units.map((u) => u.label).join(', ')}` : '   (no units)')
      )
      // Per-floor breakdown so we can see where the difference comes from.
      for (const f of t.floorPlans) {
        const roomList = f.rooms
          .map((r) => `${r.name}${r.area != null ? ` ${r.area}` : ' (—)'}`)
          .join(', ')
        console.log(`        ${f.name}: ${fmt(floorArea(f.rooms))} m²  [${roomList || 'no rooms'}]`)
      }
      console.log('')
    }
  }

  if (noRooms.length) {
    console.log('\n⚠ TYPES WITH NO ROOM AREAS (computed = blank; stored value shown for context):\n')
    for (const t of noRooms) {
      console.log(
        `[${t.project.slug}] ${t.name}: stored ${fmt(t.totalArea)} m²` +
          (t.units.length ? `   units: ${t.units.map((u) => u.label).join(', ')}` : '   (no units)')
      )
    }
  }

  console.log('\nDone (read-only — nothing written).')
}

main().finally(() => prisma.$disconnect())
