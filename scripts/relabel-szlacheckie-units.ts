/**
 * Rename Unit.label for affected pairs on Osiedle Szlacheckie so the visible
 * numbering on the etap map becomes sequential (29-30-31-32 …) without
 * moving any physical-house data. Each Unit row keeps its houseType, area,
 * price, layout, description, status, history — only `label` changes.
 *
 * Effect after running:
 *   - The unit currently labelled "31" (M04 / Bud 2 Lokal 1 / 1 050 000 zł)
 *     becomes label "32".
 *   - The unit currently labelled "32" (M03 / Bud 2 Lokal 2 /   980 000 zł)
 *     becomes label "31".
 *   - …same swap for pairs 35↔36, 39↔40, 47↔48.
 *
 * As a result, the lower-numbered label on the public map will now point to
 * the Lokal 2 / M03-or-M12 unit. Description text (which encodes the
 * physical "Budynek X, Lokal Y" location) is NOT updated — it correctly
 * describes the physical position which doesn't change.
 *
 * Also rewrites the cached data-label attribute on stage view polygons
 * referencing renamed units (lookup is by data-unit-id; data-label is just
 * a hint for the admin editor).
 *
 * Idempotency: detects already-renamed state by checking whether the unit
 * currently holding the lower label has description containing "Lokal 2".
 * If so, skips the pair. Safe to re-run.
 *
 * Three-phase rename inside a single transaction so any unique constraint
 * on (projectId, label) — if one exists — cannot trip during the swap.
 *
 * Usage:
 *   npx tsx scripts/relabel-szlacheckie-units.ts            # dry run
 *   npx tsx scripts/relabel-szlacheckie-units.ts --apply
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

// Each pair is [low, high] — after the rename, `low` will sit on the unit
// that used to be `high` (Lokal 2 / M03-or-M12 / cheaper), and `high` on the
// unit that used to be `low` (Lokal 1 / M04-or-M11 / pricier).
const PAIRS: Array<[string, string]> = [
  ['31', '32'], // Etap V   · Szlachecka Bawaria · Bud 2
  ['35', '36'], // Etap V   · Szlachecka Bawaria · Bud 4
  ['39', '40'], // Etap VI  · Jednopiętrowa Polska · Bud 2
  ['47', '48'], // Etap VII · Bawaria Development · Bud 2
]

async function main() {
  const project = await prisma.project.findUnique({
    where: { slug: PROJECT_SLUG },
    select: { id: true, name: true },
  })
  if (!project) throw new Error(`Project "${PROJECT_SLUG}" not found`)

  const labels = [...new Set(PAIRS.flat())]
  const units = await prisma.unit.findMany({
    where: { projectId: project.id, label: { in: labels } },
    select: { id: true, label: true, description: true, houseType: { select: { name: true } } },
  })
  const byLabel = new Map(units.map(u => [u.label, u]))

  // Validate every pair has both units present.
  for (const [a, b] of PAIRS) {
    if (!byLabel.get(a)) throw new Error(`Unit with label "${a}" not found in project`)
    if (!byLabel.get(b)) throw new Error(`Unit with label "${b}" not found in project`)
  }

  console.log(`Project: ${project.name}`)
  console.log(`Mode:    ${APPLY ? 'APPLY' : 'DRY-RUN (re-run with --apply to write)'}`)
  console.log(`Pairs:   ${PAIRS.map(([a, b]) => `${a}↔${b}`).join(', ')}\n`)

  type PlannedSwap = { low: string; high: string; lowUnitId: string; highUnitId: string }
  const planned: PlannedSwap[] = []
  const skipped: string[] = []

  for (const [low, high] of PAIRS) {
    const uLow = byLabel.get(low)!
    const uHigh = byLabel.get(high)!
    const lowDesc = uLow.description ?? ''

    if (lowDesc.includes('Lokal 2')) {
      skipped.push(`${low}↔${high} (already renamed: unit labelled "${low}" already at Lokal 2)`)
      continue
    }

    console.log(`  Plan ${low}↔${high}:`)
    console.log(`    Unit ${low} (id=${uLow.id}, ${uLow.houseType?.name}, "${uLow.description}") → label "${high}"`)
    console.log(`    Unit ${high} (id=${uHigh.id}, ${uHigh.houseType?.name}, "${uHigh.description}") → label "${low}"`)
    planned.push({ low, high, lowUnitId: uLow.id, highUnitId: uHigh.id })
  }

  if (skipped.length) {
    console.log(`\nSkipped (already renamed): ${skipped.length}`)
    for (const s of skipped) console.log(`  - ${s}`)
  }

  if (!APPLY) {
    console.log(`\nDry-run only — re-run with --apply to write.`)
    console.log(`Planned label renames: ${planned.length}, polygon data-label rewrites: ${planned.length * 2} (× number of stage views)`)
    return
  }

  // ── APPLY ──
  for (const p of planned) {
    const tmpLow = `__swap_${p.low}_${p.high}_${Date.now()}`
    await prisma.$transaction(async (tx) => {
      // 3-phase swap (tmp parking) → safe regardless of any unique constraint on label.
      await tx.unit.update({ where: { id: p.lowUnitId }, data: { label: tmpLow } })
      await tx.unit.update({ where: { id: p.highUnitId }, data: { label: p.low } })
      await tx.unit.update({ where: { id: p.lowUnitId }, data: { label: p.high } })
    })
    console.log(`  ✓ Swapped labels ${p.low}↔${p.high}`)
  }

  // ── Rewrite data-label on stage view polygons to match new unit labels ──
  if (planned.length) {
    const renamedIds = new Set<string>()
    for (const p of planned) { renamedIds.add(p.lowUnitId); renamedIds.add(p.highUnitId) }

    const stages = await prisma.stage.findMany({
      where: { projectId: project.id },
      select: { id: true, name: true, stageViews: { select: { id: true, name: true, svgContent: true } } },
    })

    // Fresh labels (post-swap) for the renamed units.
    const fresh = await prisma.unit.findMany({
      where: { id: { in: [...renamedIds] } },
      select: { id: true, label: true },
    })
    const labelByUnitId = new Map(fresh.map(u => [u.id, u.label]))

    let viewsUpdated = 0
    let polysFixed = 0
    for (const stage of stages) {
      for (const view of stage.stageViews) {
        if (!view.svgContent) continue
        let changed = false
        const next = view.svgContent.replace(/<polygon\b([^>]*?)\/?>/g, (match, attrs: string) => {
          const idMatch = attrs.match(/data-unit-id="([^"]+)"/)
          if (!idMatch) return match
          const uid = idMatch[1]
          const newLabel = labelByUnitId.get(uid)
          if (!newLabel) return match
          const labelMatch = attrs.match(/data-label="([^"]*)"/)
          if (!labelMatch || labelMatch[1] === newLabel) return match
          changed = true
          polysFixed++
          return match.replace(/data-label="[^"]*"/, `data-label="${newLabel}"`)
        })
        if (!changed) continue
        await prisma.stageView.update({ where: { id: view.id }, data: { svgContent: next } })
        viewsUpdated++
        console.log(`  ✓ Updated data-label cache on ${stage.name} / ${view.name}`)
      }
    }
    console.log(`\nStage views updated: ${viewsUpdated}, polygon data-label rewrites: ${polysFixed}`)
  }

  console.log(`\nDone. Pairs renamed: ${planned.length}, skipped: ${skipped.length}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
