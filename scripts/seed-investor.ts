/**
 * Migrate the "Über das Unternehmen / Wer wir sind" (investor) homepage section
 * into admin-managed DB fields, using the CURRENT public content as the source
 * of truth. The public content is the shared default DEFAULT_BUYING.investor
 * (the section rendered from it while the DB fields were empty), so we copy those
 * exact DE/EN values into the HomeSection "investor" row. No content is
 * duplicated — everything is read from the single source in lib/content-defaults.ts.
 *
 * getHomeContent() already prefers these DB fields over the code defaults, so
 * after this runs the public section reads from the DB (defaults remain only as a
 * safety fallback) and /admin/home shows the populated values.
 *
 * The section has no list items — the right-hand logo is a static asset — so any
 * items (e.g. the previously-seeded colour swatches) are removed.
 *
 * Idempotent + targeted: upserts ONLY the investor row and clears ONLY its
 * items. Touches no other section or data. No --force needed.
 *
 * Dry run:  npx tsx scripts/seed-investor.ts
 * Apply:    npx dotenv-cli -e .env.local -- npx tsx scripts/seed-investor.ts --apply
 */
import { DEFAULT_BUYING } from '../lib/content-defaults'

const APPLY = process.argv.includes('--apply')
const INV = DEFAULT_BUYING.investor

// Field mapping (mirrors lib/home-content.ts getHomeContent().buying.investor):
//   eyebrow → eyebrow, heading → heading, small label → secondaryCtaLabel,
//   body → description (paragraphs joined by blank line), button → primaryCta.
const data = {
  order: 7,
  enabled: true,
  eyebrowDe: INV.eyebrow.de,
  eyebrowEn: INV.eyebrow.en,
  headingDe: INV.heading.de,
  headingEn: INV.heading.en,
  descriptionDe: INV.paragraphs.map((p) => p.de).join('\n\n'),
  descriptionEn: INV.paragraphs.map((p) => p.en).join('\n\n'),
  secondaryCtaLabelDe: INV.experienceBadge.de,
  secondaryCtaLabelEn: INV.experienceBadge.en,
  primaryCtaLabelDe: INV.ctaLabel.de,
  primaryCtaLabelEn: INV.ctaLabel.en,
  primaryCtaHref: INV.ctaHref,
}

function printPlan() {
  console.log('HomeSection "investor" ← current public content:')
  console.log(`  eyebrow  DE: ${data.eyebrowDe}   | EN: ${data.eyebrowEn}`)
  console.log(`  heading  DE: ${data.headingDe}   | EN: ${data.headingEn}`)
  console.log(`  label    DE: ${data.secondaryCtaLabelDe} | EN: ${data.secondaryCtaLabelEn}`)
  console.log(`  body     DE: ${data.descriptionDe.slice(0, 70)}…`)
  console.log(`           EN: ${data.descriptionEn.slice(0, 70)}…`)
  console.log(`  button   DE: ${data.primaryCtaLabelDe} | EN: ${data.primaryCtaLabelEn} | link: ${data.primaryCtaHref}`)
  console.log('  items:   none (section has no list items; the logo is a static asset)')
}

async function apply() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    await prisma.homeSection.upsert({
      where: { id: 'investor' },
      create: { id: 'investor', ...data },
      update: data,
    })
    // The section has no list items (the right-hand logo is a static asset).
    // Remove any (e.g. the previously-seeded swatch items) so state matches code.
    const removed = await prisma.homeSectionItem.deleteMany({ where: { sectionId: 'investor' } })
    console.log(`DONE — investor text fields upserted; ${removed.count} stale item(s) removed.`)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log(APPLY ? '=== APPLY MODE (writing to DB) ===' : '=== DRY RUN (no writes) ===')
  printPlan()
  if (!APPLY) {
    console.log('\nDry run only — re-run with --apply to write. Idempotent; only the investor section is touched.')
    return
  }
  await apply()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
