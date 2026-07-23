/**
 * Swap two unit references on stage view polygons for a project.
 *
 * Each polygon on a StageView's svgContent has `data-unit-id` pointing to a
 * Unit row, and the displayed label comes from that Unit (via `data-label`).
 * So reassigning the pointer moves the label *and all unit data with it*
 * (price, area, house type / floor plans, history) from one polygon to
 * another — without touching any Unit / PriceHistory / HouseType records.
 *
 * Use this to correct visual mislabelling like "29-30-32-31" → "29-30-31-32"
 * on the etap maps without re-drawing polygons in admin.
 *
 * ⚠️  NOT idempotent: running --apply twice swaps the labels back. Always
 * run dry-run first, eyeball the planned swaps, then --apply once.
 *
 * Usage:
 *   npx tsx scripts/swap-szlacheckie-stage-polygons.ts            # dry-run
 *   npx tsx scripts/swap-szlacheckie-stage-polygons.ts --apply
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

const PROJECT_SLUG = 'osiedle-szlacheckie'

// Pairs of unit labels whose polygon references should be swapped wherever
// both polygons appear together on the same stage view. Edit this list to
// add/remove pairs (e.g. Etap VII 47↔48 if that block is also mislabelled).
const PAIRS: Array<[string, string]> = [
  ['31', '32'], // Etap V   · Szlachecka Bawaria · Bud 2
  ['35', '36'], // Etap V   · Szlachecka Bawaria · Bud 4
  ['39', '40'], // Etap VI  · Jednopiętrowa Polska · Bud 2
  ['47', '48'], // Etap VII · Bawaria Development · Bud 2
]

type UnitLite = { id: string; label: string }

function swapPolygonRefs(svg: string, a: UnitLite, b: UnitLite): { svg: string; swapped: boolean } {
  let foundA = false
  let foundB = false
  const next = svg.replace(/<polygon\b([^>]*?)\/?>/g, (match, attrs: string) => {
    const idMatch = attrs.match(/data-unit-id="([^"]+)"/)
    if (!idMatch) return match
    const uid = idMatch[1]
    if (uid === a.id) {
      foundA = true
      return match
        .replace(/data-unit-id="[^"]+"/, `data-unit-id="${b.id}"`)
        .replace(/data-label="[^"]*"/, `data-label="${b.label}"`)
    }
    if (uid === b.id) {
      foundB = true
      return match
        .replace(/data-unit-id="[^"]+"/, `data-unit-id="${a.id}"`)
        .replace(/data-label="[^"]*"/, `data-label="${a.label}"`)
    }
    return match
  })
  return { svg: next, swapped: foundA && foundB }
}

async function main() {
  const project = await prisma.project.findUnique({
    where: { slug: PROJECT_SLUG },
    select: {
      id: true,
      name: true,
      units: { select: { id: true, label: true } },
      stages: {
        orderBy: { order: 'asc' },
        select: {
          id: true, name: true,
          stageViews: {
            orderBy: { order: 'asc' },
            select: { id: true, name: true, svgContent: true },
          },
        },
      },
    },
  })
  if (!project) throw new Error(`Project "${PROJECT_SLUG}" not found`)

  const byLabel = new Map(project.units.map(u => [u.label, u]))
  const resolved = PAIRS.map(([la, lb]) => {
    const a = byLabel.get(la)
    const b = byLabel.get(lb)
    if (!a) throw new Error(`Unit with label "${la}" not found in project`)
    if (!b) throw new Error(`Unit with label "${lb}" not found in project`)
    return { a, b, labels: [la, lb] as [string, string] }
  })

  console.log(`Project:  ${project.name}`)
  console.log(`Mode:     ${APPLY ? 'APPLY' : 'DRY-RUN (re-run with --apply to write)'}`)
  console.log(`Pairs:    ${PAIRS.map(p => p.join('↔')).join(', ')}\n`)
  console.warn('⚠️  Not idempotent — running --apply twice swaps the labels back.\n')

  let totalSwaps = 0
  let totalWrites = 0

  for (const stage of project.stages) {
    for (const view of stage.stageViews) {
      if (!view.svgContent) continue
      let svg = view.svgContent
      const performed: string[] = []

      for (const { a, b, labels } of resolved) {
        const r = swapPolygonRefs(svg, a, b)
        if (!r.swapped) continue
        svg = r.svg
        performed.push(`${labels[0]}↔${labels[1]}`)
        totalSwaps++
      }

      if (performed.length === 0) continue
      console.log(`  Etap "${stage.name}" · Widok "${view.name}" → ${performed.join(', ')}`)
      if (APPLY) {
        await prisma.stageView.update({
          where: { id: view.id },
          data: { svgContent: svg },
        })
        totalWrites++
      }
    }
  }

  console.log(`\nSwaps planned:           ${totalSwaps}`)
  console.log(`Stage views ${APPLY ? 'updated' : 'that would update'}: ${APPLY ? totalWrites : '(dry-run)'}`)
  if (totalSwaps === 0) {
    console.log('\nNo matching polygon pairs found on any stage view — nothing to do.')
    console.log('Check that both labels of each pair exist on the same stage view.')
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
