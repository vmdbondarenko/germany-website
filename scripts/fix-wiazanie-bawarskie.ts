/**
 * One-time, idempotent, CURATED fixes for the "Wiązanie Bawarskie" SEO cleanup.
 * Only the 8 exact fields below are touched. Each edit is a precise substring
 * replace (anchored on the surrounding words) so proper names — Bawarski Wawer,
 * Nowa Bawaria, Bawarski Zakątek, etc. — are never affected. Re-runnable: if the
 * "before" substring is absent (already fixed), the row is skipped.
 *
 * Usage:  npx tsx --env-file=.env.local scripts/fix-wiazanie-bawarskie.ts          (dry-run)
 *         npx tsx --env-file=.env.local scripts/fix-wiazanie-bawarskie.ts --apply  (write)
 */
import { prisma } from '@/lib/prisma'

const APPLY = process.argv.includes('--apply')

type Target =
  | { kind: 'project'; slug: string; field: 'description' }
  | { kind: 'section'; slug: string; type: string; field: 'description' }

type Edit = { target: Target; from: string; to: string }

const EDITS: Edit[] = [
  // --- brand-style phrases -> "Wiązanie Bawarskie" (correct grammatical case) ---
  { target: { kind: 'project', slug: 'osiedle-szlacheckie', field: 'description' },
    from: 'w stylu bawarskim', to: 'w stylu Wiązania Bawarskiego' },
  { target: { kind: 'section', slug: 'osiedle-kwitnace', type: 'o_inwestycji', field: 'description' },
    from: 'w stylu bawarskim', to: 'w stylu Wiązania Bawarskiego' },
  { target: { kind: 'section', slug: 'poludniowa-bawaria', type: 'o_inwestycji', field: 'description' },
    from: 'w stylu bawarskim', to: 'w stylu Wiązania Bawarskiego' },
  { target: { kind: 'section', slug: 'nowa-bawaria-schema', type: 'o_inwestycji', field: 'description' },
    from: 'bawarskiego wiązania', to: 'Wiązania Bawarskiego' },
  { target: { kind: 'section', slug: 'bawarski-zakatek', type: 'o_inwestycji', field: 'description' },
    from: 'w stylu bawarskim', to: 'w stylu Wiązania Bawarskiego' },
  { target: { kind: 'section', slug: 'bawarski-wawer', type: 'o_inwestycji', field: 'description' },
    from: 'inspirowaną stylem bawarskim', to: 'inspirowaną Wiązaniem Bawarskim' },
  // NOTE: the two earlier "domow"→"domów" candidates (pierwszy-krakowski.dom,
  // dziesiaty-bawarski.udogodnienia) were FALSE POSITIVES — the DB already
  // stores the correct "domową"; the audit's \b matched inside that word. They
  // are intentionally excluded so a correct word is never corrupted.
]

function ctx(s: string, sub: string, pad = 45): string {
  const i = s.indexOf(sub)
  if (i < 0) return '(substring not found)'
  return '…' + s.slice(Math.max(0, i - pad), i + sub.length + pad).replace(/\s+/g, ' ') + '…'
}

async function load(t: Target): Promise<{ id: string; value: string } | null> {
  if (t.kind === 'project') {
    const p = await prisma.project.findUnique({ where: { slug: t.slug }, select: { id: true, description: true } })
    return p ? { id: p.id, value: p.description ?? '' } : null
  }
  const sec = await prisma.projectSection.findFirst({
    where: { type: t.type, project: { slug: t.slug } },
    select: { id: true, description: true },
  })
  return sec ? { id: sec.id, value: sec.description ?? '' } : null
}

async function write(t: Target, id: string, value: string) {
  if (t.kind === 'project') await prisma.project.update({ where: { id }, data: { description: value } })
  else await prisma.projectSection.update({ where: { id }, data: { description: value } })
}

async function main() {
  console.log(`\n=== ${APPLY ? 'APPLY' : 'DRY-RUN'} — Wiązanie Bawarskie DB cleanup (6 fields) ===\n`)
  let changed = 0, skipped = 0, missing = 0
  for (const e of EDITS) {
    const t = e.target
    const label = `${t.slug} · ${t.kind === 'section' ? t.type + '.' : ''}${t.field}`
    const row = await load(t)
    if (!row) { console.log(`MISSING  ${label} — row not found`); missing++; continue }

    // Guard: only replace the FIRST occurrence and only when the exact "from" is present.
    if (!row.value.includes(e.from)) {
      // already fixed? show whether the target text is present
      const done = row.value.includes(e.to)
      console.log(`SKIP     ${label} — "${e.from}" not present${done ? ' (already updated)' : ''}`)
      skipped++; continue
    }
    const idx = row.value.indexOf(e.from)
    const next = row.value.slice(0, idx) + e.to + row.value.slice(idx + e.from.length)

    console.log(`CHANGE   ${label}`)
    console.log(`  before: ${ctx(row.value, e.from)}`)
    console.log(`  after : ${ctx(next, e.to)}`)
    if (APPLY) { await write(t, row.id, next); console.log('  ✓ written') }
    changed++
  }
  console.log(`\n${APPLY ? 'Applied' : 'Would change'}: ${changed} · Skipped: ${skipped} · Missing: ${missing}\n`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
