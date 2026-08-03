/**
 * Phase 1 content seed — copy the CURRENT public-site defaults into the database
 * so they become editable in /admin/home and /admin/about, WITHOUT changing the
 * public appearance or any URLs.
 *
 * Zero-drift: all copy is imported from lib/content-defaults.ts — the SAME module
 * the live site renders from (lib/home-content.ts, components/about.tsx). There is
 * nothing to keep in sync by hand.
 *
 * SAFETY
 *  - Dry run by default: prints the full plan, touches NOTHING, needs no DB.
 *  - --apply writes to the DB (needs .env.local with POSTGRES_PRISMA_URL).
 *  - Never deletes projects/units/etc. Only creates the home/about rows.
 *  - Existing rows are SKIPPED (to protect admin edits) unless --force is given.
 *  - Both DE and EN are seeded for every HomeSectionItem — required, because
 *    getHomeContent() has NO code fallback for item EN once a section has DB items.
 *  - Does NOT seed UpcomingInvestment / NewCity: empty on the live site, so seeding
 *    them would ADD cards and change the appearance.
 *
 * USAGE
 *   Dry run:   npx tsx scripts/seed-home-content.ts
 *   Apply:     npx dotenv-cli -e .env.local -- npx tsx scripts/seed-home-content.ts --apply
 *   Overwrite: ... --apply --force
 *
 * Seeds home/about HomeSections, the AboutSection, and TeamMember rows (all
 * idempotent; existing rows are skipped unless --force).
 */
import {
  t,
  type LocalizedText,
  type LocalizedItem,
  DEFAULT_HERO,
  HERO_PRIMARY_HREF,
  HERO_SECONDARY_HREF,
  DEFAULT_PROCESS,
  DEFAULT_DISTINGUISHES,
  DEFAULT_SERVICES,
  DEFAULT_INTERIOR,
  DEFAULT_BUYING,
  DEFAULT_COMPANY_NAME,
  DEFAULT_ABOUT_DESCRIPTION,
  DEFAULT_ABOUT_PHOTOS,
  DEFAULT_STATS,
  DEFAULT_VALUES,
  DEFAULT_BAUWEISE,
  DEFAULT_UPCOMING,
  DEFAULT_NEW_CITIES,
  DEFAULT_TEAM,
  DEFAULT_TEAM_MEMBERS,
  DEFAULT_SINCE_FOUNDING,
} from '../lib/content-defaults'

const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')

type SectionDef = {
  id: string
  order: number
  eyebrow?: LocalizedText
  heading?: LocalizedText
  description?: LocalizedText
  primaryCta?: { label: LocalizedText; href: string }
  secondaryCta?: { label: LocalizedText; href: string }
  items?: LocalizedItem[]
}

// Derived entirely from the shared defaults — see lib/content-defaults.ts.
// getHomeContent() only reads these DB-backed fields per section:
//   hero → eyebrow/heading/description/CTAs; process/distinguishes/services →
//   heading/description/items; interior → heading/description; buying, buying-help,
//   investor → heading only (their other fields are always code-driven).
const SECTIONS: SectionDef[] = [
  { id: 'hero', order: 0, eyebrow: DEFAULT_HERO.eyebrow, heading: DEFAULT_HERO.title, description: DEFAULT_HERO.subtitle, primaryCta: { label: DEFAULT_HERO.primaryCta, href: HERO_PRIMARY_HREF }, secondaryCta: { label: DEFAULT_HERO.secondaryCta, href: HERO_SECONDARY_HREF } },
  { id: 'process', order: 1, heading: DEFAULT_PROCESS.heading, description: DEFAULT_PROCESS.description, items: DEFAULT_PROCESS.items },
  { id: 'distinguishes', order: 2, eyebrow: DEFAULT_DISTINGUISHES.eyebrow, heading: DEFAULT_DISTINGUISHES.heading, description: DEFAULT_DISTINGUISHES.description, items: DEFAULT_DISTINGUISHES.items },
  { id: 'services', order: 3, heading: DEFAULT_SERVICES.heading, description: DEFAULT_SERVICES.description, items: DEFAULT_SERVICES.items },
  { id: 'interior', order: 4, heading: DEFAULT_INTERIOR.heading, description: DEFAULT_INTERIOR.description },
  { id: 'buying', order: 5, heading: DEFAULT_BUYING.heading },
  { id: 'buying-help', order: 6, heading: DEFAULT_BUYING.helpHeading },
  { id: 'investor', order: 7, heading: DEFAULT_BUYING.investor.heading },
  // Phase 2 Group A — About-page blocks (getAboutContent reads these ids).
  { id: 'stats', order: 8, items: DEFAULT_STATS.map((s) => ({ icon: '', title: t(s.value, s.value), description: s.label })) },
  { id: 'values', order: 9, eyebrow: DEFAULT_VALUES.eyebrow, heading: DEFAULT_VALUES.heading, items: DEFAULT_VALUES.cards.map((c) => ({ icon: '', title: c.title, description: c.description })) },
  { id: 'bauweise', order: 10, heading: DEFAULT_BAUWEISE.heading, description: { de: DEFAULT_BAUWEISE.paragraphs.map((p) => p.de).join('\n\n'), en: DEFAULT_BAUWEISE.paragraphs.map((p) => p.en).join('\n\n') }, primaryCta: { label: DEFAULT_BAUWEISE.ctaLabel, href: DEFAULT_BAUWEISE.ctaHref } },
  { id: 'upcoming', order: 11, heading: DEFAULT_UPCOMING.line1, eyebrow: DEFAULT_UPCOMING.line2, description: DEFAULT_UPCOMING.subtitle },
  { id: 'new-cities', order: 12, heading: DEFAULT_NEW_CITIES.heading, description: DEFAULT_NEW_CITIES.subtitle, items: [{ icon: '', title: DEFAULT_NEW_CITIES.noteTitle, description: DEFAULT_NEW_CITIES.noteText }] },
  { id: 'team', order: 13, heading: DEFAULT_TEAM.heading, description: DEFAULT_TEAM.description },
  { id: 'since-founding', order: 14, heading: DEFAULT_SINCE_FOUNDING.heading, items: DEFAULT_SINCE_FOUNDING.periods.map((p) => ({ icon: '', title: p.title, description: p.description })) },
]

const ABOUT = { id: 'main', companyName: DEFAULT_COMPANY_NAME, description: DEFAULT_ABOUT_DESCRIPTION, photos: DEFAULT_ABOUT_PHOTOS }

// Team members mirror the shared single source (components/team.tsx fallback).
const TEAM = DEFAULT_TEAM_MEMBERS

function trunc(s: string, n = 80) { return s.length > n ? s.slice(0, n) + '…' : s }

function printPlan() {
  console.log('\n=== HomeSection / HomeSectionItem ===')
  for (const s of SECTIONS) {
    const fields = [s.eyebrow && 'eyebrow', s.heading && 'heading', s.description && 'description', s.primaryCta && 'primaryCta', s.secondaryCta && 'secondaryCta'].filter(Boolean)
    console.log(`\n• ${s.id} (order ${s.order}) — ${fields.join(', ') || '(no text fields)'}${s.items ? `, ${s.items.length} items` : ''}`)
    if (s.heading) console.log(`    heading  DE: ${s.heading.de}\n             EN: ${s.heading.en}`)
    if (s.description) console.log(`    desc     DE: ${trunc(s.description.de)}\n             EN: ${trunc(s.description.en)}`)
    s.items?.forEach((it, i) => console.log(`    item[${i}] ${it.icon}  DE: ${it.title.de} | EN: ${it.title.en}`))
  }
  console.log('\n=== AboutSection (id "main") ===')
  console.log(`  companyName: ${ABOUT.companyName}`)
  console.log(`  description: ${ABOUT.description.split('\n\n').length} paragraphs (${ABOUT.description.length} chars)`)
  console.log(`  photos: ${ABOUT.photos.length} → ${ABOUT.photos.join(', ')}`)
  console.log(`\n=== TeamMember ===  ${TEAM.length} rows (${TEAM.map((m) => m.name).join(', ')})`)
  console.log('\n=== NOT seeded (would change appearance) ===')
  console.log('  UpcomingInvestment, NewCity — empty on the live site; seeding would add cards.')
}

async function apply() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  let created = 0, updated = 0, skipped = 0, items = 0
  try {
    for (const s of SECTIONS) {
      const existing = await prisma.homeSection.findUnique({ where: { id: s.id } })
      if (existing && !FORCE) { skipped++; console.log(`skip   HomeSection ${s.id} (exists)`); continue }
      const data = {
        order: s.order, enabled: true,
        eyebrowDe: s.eyebrow?.de ?? null, eyebrowEn: s.eyebrow?.en ?? null,
        headingDe: s.heading?.de ?? null, headingEn: s.heading?.en ?? null,
        descriptionDe: s.description?.de ?? null, descriptionEn: s.description?.en ?? null,
        primaryCtaLabelDe: s.primaryCta?.label.de ?? null, primaryCtaLabelEn: s.primaryCta?.label.en ?? null,
        primaryCtaHref: s.primaryCta?.href ?? null,
        secondaryCtaLabelDe: s.secondaryCta?.label.de ?? null, secondaryCtaLabelEn: s.secondaryCta?.label.en ?? null,
        secondaryCtaHref: s.secondaryCta?.href ?? null,
      }
      await prisma.homeSection.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data })
      existing ? (updated++, console.log(`update HomeSection ${s.id}`)) : (created++, console.log(`create HomeSection ${s.id}`))
      if (s.items) {
        await prisma.homeSectionItem.deleteMany({ where: { sectionId: s.id } })
        for (let i = 0; i < s.items.length; i++) {
          const it = s.items[i]
          await prisma.homeSectionItem.create({ data: { sectionId: s.id, icon: it.icon, titleDe: it.title.de, titleEn: it.title.en, descriptionDe: it.description.de, descriptionEn: it.description.en, order: i } })
          items++
        }
      }
    }
    const aboutExists = await prisma.aboutSection.findUnique({ where: { id: ABOUT.id } })
    if (aboutExists && !FORCE) { skipped++; console.log('skip   AboutSection main (exists)') }
    else {
      const data = { companyName: ABOUT.companyName, description: ABOUT.description, photos: ABOUT.photos }
      await prisma.aboutSection.upsert({ where: { id: ABOUT.id }, create: { id: ABOUT.id, ...data }, update: data })
      aboutExists ? updated++ : created++
      console.log(`${aboutExists ? 'update' : 'create'} AboutSection main`)
    }
    const teamCount = await prisma.teamMember.count()
    if (teamCount > 0 && !FORCE) {
      skipped++
      console.log(`skip   TeamMember (${teamCount} rows exist)`)
    } else {
      for (const m of TEAM) {
        await prisma.teamMember.create({ data: { name: m.name, role: m.role.de, roleEn: m.role.en, image: m.image, order: m.order } })
        created++
      }
      console.log(`create ${TEAM.length} TeamMember rows`)
    }
    console.log(`\nDONE — created ${created}, updated ${updated}, skipped ${skipped}, items ${items}`)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log(APPLY ? '=== APPLY MODE (writing to DB) ===' : '=== DRY RUN (no writes) ===')
  console.log(`flags: ${[APPLY && 'apply', FORCE && 'force'].filter(Boolean).join(', ') || '(none)'}`)
  printPlan()
  if (!APPLY) { console.log('\nDry run only — re-run with --apply to write. Existing rows are skipped unless --force.'); return }
  await apply()
}

main().catch((e) => { console.error(e); process.exit(1) })
