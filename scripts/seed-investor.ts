/**
 * Migrate the "Über das Unternehmen / Wer wir sind" (investor) homepage section
 * into admin-managed DB fields, using the CURRENT public content as the source
 * of truth. The public content is the shared default DEFAULT_BUYING.investor
 * (the section rendered from it while the DB fields were empty), so we copy those
 * exact DE/EN values into the HomeSection "investor" row and its four swatch
 * items. No content is duplicated — everything is read from the single source in
 * lib/content-defaults.ts.
 *
 * getHomeContent() already prefers these DB fields over the code defaults, so
 * after this runs the public section reads from the DB (defaults remain only as a
 * safety fallback) and /admin/home shows the populated values.
 *
 * Idempotent + targeted: upserts ONLY the investor row and replaces ONLY its
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
//   body → description (paragraphs joined by blank line), button → primaryCta,
//   four colours → HomeSectionItem.titleDe (one per swatch).
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
const swatches = INV.swatches

function printPlan() {
  console.log('HomeSection "investor" ← current public content:')
  console.log(`  eyebrow  DE: ${data.eyebrowDe}   | EN: ${data.eyebrowEn}`)
  console.log(`  heading  DE: ${data.headingDe}   | EN: ${data.headingEn}`)
  console.log(`  label    DE: ${data.secondaryCtaLabelDe} | EN: ${data.secondaryCtaLabelEn}`)
  console.log(`  body     DE: ${data.descriptionDe.slice(0, 70)}…`)
  console.log(`           EN: ${data.descriptionEn.slice(0, 70)}…`)
  console.log(`  button   DE: ${data.primaryCtaLabelDe} | EN: ${data.primaryCtaLabelEn} | link: ${data.primaryCtaHref}`)
  console.log(`  swatches: ${swatches.join(', ')}`)
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
    await prisma.homeSectionItem.deleteMany({ where: { sectionId: 'investor' } })
    for (let i = 0; i < swatches.length; i++) {
      await prisma.homeSectionItem.create({
        data: { sectionId: 'investor', kind: 'swatch', titleDe: swatches[i], order: i },
      })
    }
    const saved = await prisma.homeSection.findUnique({ where: { id: 'investor' }, include: { items: true } })
    console.log(`DONE — investor row updated; ${saved?.items.length ?? 0} swatch items written.`)
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
