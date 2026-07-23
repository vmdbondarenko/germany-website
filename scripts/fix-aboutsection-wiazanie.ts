/**
 * Idempotent, single-field fix: AboutSection(id="main").description
 * "stylu Bawarskiego wiązania" -> "stylu Wiązania Bawarskiego" (approved capital-W).
 * Dry-run by default; pass --apply to write. Re-runnable (skips if already fixed).
 *   npx tsx --env-file=.env.local scripts/fix-aboutsection-wiazanie.ts          (dry-run)
 *   npx tsx --env-file=.env.local scripts/fix-aboutsection-wiazanie.ts --apply
 */
import { prisma } from '@/lib/prisma'
const APPLY = process.argv.includes('--apply')
const FROM = 'stylu Bawarskiego wiązania'
const TO   = 'stylu Wiązania Bawarskiego'
function ctx(s:string, sub:string){ const i=s.indexOf(sub); return i<0?'(not found)':'…'+s.slice(Math.max(0,i-50),i+sub.length+45).replace(/\s+/g,' ')+'…' }
async function main(){
  const row = await prisma.aboutSection.findUnique({ where:{ id:'main' }, select:{ id:true, description:true } })
  console.log(`\n=== ${APPLY?'APPLY':'DRY-RUN'} — AboutSection(main).description ===`)
  if(!row){ console.log('  row id="main" not found'); await prisma.$disconnect(); return }
  const d=row.description ?? ''
  if(!d.includes(FROM)){
    console.log(`  SKIP — "${FROM}" not present (already updated: ${d.includes(TO)})`)
    await prisma.$disconnect(); return
  }
  const occ=d.split(FROM).length-1
  const next=d.replace(FROM,TO)
  console.log(`  occurrences: ${occ}  | other 'bawarsk' in field: ${(d.match(/bawarsk/gi)||[]).length-occ}`)
  console.log(`  before: ${ctx(d,FROM)}`)
  console.log(`  after : ${ctx(next,TO)}`)
  if(APPLY){ await prisma.aboutSection.update({ where:{ id:'main' }, data:{ description: next } }); console.log('  ✓ written') }
  await prisma.$disconnect()
}
main().catch(e=>{console.error(e);process.exit(1)})
