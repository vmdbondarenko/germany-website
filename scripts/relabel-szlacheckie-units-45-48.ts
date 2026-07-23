/**
 * Option-B label swap (Osiedle Szlacheckie) for the Etap VII Bawaria Development
 * block: permute the visible numbering 45/46/47/48 WITHOUT moving any
 * physical-house data. Each Unit row keeps its svgElementId, houseType, area,
 * price, layout, description, status and PriceHistory — only `label` changes.
 *
 * Requested permutation (on the labels as they are today):
 *   45 → 48,  46 → 47,  47 → 46,  48 → 45
 * i.e. two independent swaps: 45↔48 and 46↔47.
 *
 * The mapping is anchored to the stable svgElementId (which never moves), so a
 * re-run is detected and skipped rather than swapping back:
 *
 *   svgElementId   from → to    houseType / physical position
 *   ------------   ---------    -----------------------------
 *   unit-45        45  → 48     M09 / Budynek 1, Lokal 1
 *   unit-46        46  → 47     M10 / Budynek 1, Lokal 2
 *   unit-47        48  → 45     M11 / Budynek 2, Lokal 1
 *   unit-48        47  → 46     M12 / Budynek 2, Lokal 2
 *
 * Description text (which encodes the physical "Budynek X, Lokal Y" location) is
 * NOT updated — it correctly describes the physical position, which doesn't move.
 *
 * Also rewrites the cached data-label attribute on stage-view polygons that
 * reference the renamed units (lookup is by data-unit-id; data-label is only a
 * display hint for the admin editor).
 *
 * Idempotency: if every unit already holds its target label, the run is a no-op.
 * If the state is neither fully pre-swap nor fully post-swap, it throws rather
 * than guessing. Safe to re-run.
 *
 * Permutation is applied inside a single transaction with a temp-label parking
 * phase, so no unique constraint on (projectId, label) can trip mid-swap.
 *
 * Usage:
 *   npx tsx scripts/relabel-szlacheckie-units-45-48.ts            # dry run
 *   npx tsx scripts/relabel-szlacheckie-units-45-48.ts --apply
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

// Mapping anchored to the stable svgElementId: { from = expected current label,
// to = target label }. `from` is only used to validate we're in the expected
// pre-swap state; the rename itself is driven by svgElementId → to.
const MAP: Array<{ svgElementId: string; from: string; to: string }> = [
  { svgElementId: 'unit-45', from: '45', to: '48' },
  { svgElementId: 'unit-46', from: '46', to: '47' },
  { svgElementId: 'unit-47', from: '48', to: '45' },
  { svgElementId: 'unit-48', from: '47', to: '46' },
]

async function main() {
  const project = await prisma.project.findUnique({
    where: { slug: PROJECT_SLUG },
    select: { id: true, name: true },
  })
  if (!project) throw new Error(`Project "${PROJECT_SLUG}" not found`)

  const svgIds = MAP.map(m => m.svgElementId)
  const units = await prisma.unit.findMany({
    where: { projectId: project.id, svgElementId: { in: svgIds } },
    select: { id: true, label: true, svgElementId: true, description: true, houseType: { select: { name: true } } },
  })
  const bySvg = new Map(units.map(u => [u.svgElementId, u]))

  for (const m of MAP) {
    if (!bySvg.get(m.svgElementId)) throw new Error(`Unit with svgElementId "${m.svgElementId}" not found in project`)
  }

  console.log(`Project: ${project.name}`)
  console.log(`Mode:    ${APPLY ? 'APPLY' : 'DRY-RUN (re-run with --apply to write)'}\n`)

  // Determine state: fully pre-swap (all at `from`), fully applied (all at `to`),
  // or inconsistent.
  const atFrom = MAP.every(m => bySvg.get(m.svgElementId)!.label === m.from)
  const atTo = MAP.every(m => bySvg.get(m.svgElementId)!.label === m.to)

  for (const m of MAP) {
    const u = bySvg.get(m.svgElementId)!
    console.log(`  ${m.svgElementId} (id=${u.id}, ${u.houseType?.name}, "${u.description}")  label "${u.label}" → "${m.to}"`)
  }

  if (atTo) {
    console.log(`\n✓ Already applied — every unit holds its target label. No-op.`)
    return
  }
  if (!atFrom) {
    const actual = MAP.map(m => `${m.svgElementId}="${bySvg.get(m.svgElementId)!.label}"`).join(', ')
    throw new Error(
      `Unexpected state — not fully pre-swap and not fully applied.\n` +
      `Expected current labels: ${MAP.map(m => `${m.svgElementId}="${m.from}"`).join(', ')}\n` +
      `Actual:                  ${actual}\n` +
      `Refusing to guess; reconcile manually.`
    )
  }

  if (!APPLY) {
    console.log(`\nDry-run only — re-run with --apply to write.`)
    console.log(`Planned label renames: ${MAP.length}, polygon data-label rewrites: up to ${MAP.length} (× number of stage views).`)
    return
  }

  // ── APPLY: permutation via temp-label parking inside one transaction ──
  const ts = Date.now()
  await prisma.$transaction(async (tx) => {
    // Phase 1: park every affected unit under a unique temp label.
    for (const m of MAP) {
      await tx.unit.update({
        where: { id: bySvg.get(m.svgElementId)!.id },
        data: { label: `__swap_${m.svgElementId}_${ts}` },
      })
    }
    // Phase 2: assign each unit its target label.
    for (const m of MAP) {
      await tx.unit.update({
        where: { id: bySvg.get(m.svgElementId)!.id },
        data: { label: m.to },
      })
    }
  })
  for (const m of MAP) console.log(`  ✓ ${m.svgElementId}: "${m.from}" → "${m.to}"`)

  // ── Rewrite data-label on stage-view polygons to match new unit labels ──
  const labelByUnitId = new Map(MAP.map(m => [bySvg.get(m.svgElementId)!.id, m.to]))
  const stages = await prisma.stage.findMany({
    where: { projectId: project.id },
    select: { id: true, name: true, stageViews: { select: { id: true, name: true, svgContent: true } } },
  })

  let viewsUpdated = 0
  let polysFixed = 0
  for (const stage of stages) {
    for (const view of stage.stageViews) {
      if (!view.svgContent) continue
      let changed = false
      const next = view.svgContent.replace(/<polygon\b([^>]*?)\/?>/g, (match, attrs: string) => {
        const idMatch = attrs.match(/data-unit-id="([^"]+)"/)
        if (!idMatch) return match
        const newLabel = labelByUnitId.get(idMatch[1])
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
  console.log(`\nDone.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
