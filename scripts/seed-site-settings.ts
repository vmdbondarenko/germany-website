/**
 * Seed the SiteSettings singleton (id "main") from the current company values in
 * lib/contact-info.ts, so the company contact + legal data becomes editable in
 * /admin/settings without changing the public appearance (the resolver already
 * falls back to these same values).
 *
 * SAFETY
 *  - Dry run by default: prints the plan, no DB, no writes.
 *  - --apply writes (needs .env.local with POSTGRES_PRISMA_URL).
 *  - Non-destructive: creates the single row; skips it if it already exists
 *    (protects admin edits) unless --force is given.
 *  - Touches ONLY SiteSettings. Never runs prisma/seed.ts or any other model.
 *
 * USAGE
 *   Dry run:   npx tsx scripts/seed-site-settings.ts
 *   Apply:     npx dotenv-cli -e .env.local -- npx tsx scripts/seed-site-settings.ts --apply
 *   Overwrite: ... --apply --force
 */
import { company, headquarters } from '../lib/contact-info'

const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')

const DATA = {
  companyName: company.name,
  managingDirector: company.managingDirector,
  phone: company.phone,
  email: company.email,
  street: company.street,
  postalCode: company.postalCode,
  city: company.city,
  country: company.countryName, // display form ("Deutschland")
  registerCourt: company.registerCourt,
  registrationNumber: company.registrationNumber,
  vatId: company.vatId || null, // "" (pending) → null; never invented
  mapEmbedSrc: headquarters.mapEmbedSrc,
  mapHref: headquarters.mapHref,
  instagramUrl: null as string | null,
  youtubeUrl: null as string | null,
  facebookUrl: null as string | null,
  linkedinUrl: null as string | null,
  logoUrl: null as string | null,
}

function printPlan() {
  console.log('\n=== SiteSettings (id "main") ===')
  for (const [k, v] of Object.entries(DATA)) {
    console.log(`  ${k.padEnd(20)}: ${v === null ? '(null)' : v}`)
  }
  console.log('\nOnly the SiteSettings singleton is written. No other tables are touched.')
}

async function apply() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const existing = await prisma.siteSettings.findUnique({ where: { id: 'main' } })
    if (existing && !FORCE) {
      console.log('skip   SiteSettings main (exists) — use --force to overwrite')
      console.log('\nDONE — created 0, updated 0, skipped 1')
      return
    }
    await prisma.siteSettings.upsert({ where: { id: 'main' }, create: { id: 'main', ...DATA }, update: DATA })
    console.log(existing ? 'update SiteSettings main' : 'create SiteSettings main')
    console.log(`\nDONE — created ${existing ? 0 : 1}, updated ${existing ? 1 : 0}, skipped 0`)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log(APPLY ? '=== APPLY MODE (writing to DB) ===' : '=== DRY RUN (no writes) ===')
  console.log(`flags: ${[APPLY && 'apply', FORCE && 'force'].filter(Boolean).join(', ') || '(none)'}`)
  printPlan()
  if (!APPLY) { console.log('\nDry run only — re-run with --apply to write. Existing row is skipped unless --force.'); return }
  await apply()
}

main().catch((e) => { console.error(e); process.exit(1) })
