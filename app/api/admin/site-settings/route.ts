import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// Company contact + legal identity singleton (id "main"). Admin-only; the
// /api/admin/* prefix is already gated in proxy.ts, and PUT re-checks the
// session. No environment variables or secrets are read or exposed here.

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } })
  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const s = (v: unknown) => {
    const t = typeof v === 'string' ? v.trim() : ''
    return t.length > 0 ? t : null
  }
  const fields = {
    companyName: s(body.companyName),
    managingDirector: s(body.managingDirector),
    phone: s(body.phone),
    email: s(body.email),
    street: s(body.street),
    postalCode: s(body.postalCode),
    city: s(body.city),
    country: s(body.country),
    registerCourt: s(body.registerCourt),
    registrationNumber: s(body.registrationNumber),
    vatId: s(body.vatId),
    mapEmbedSrc: s(body.mapEmbedSrc),
    mapHref: s(body.mapHref),
    instagramUrl: s(body.instagramUrl),
    youtubeUrl: s(body.youtubeUrl),
    facebookUrl: s(body.facebookUrl),
    linkedinUrl: s(body.linkedinUrl),
    logoUrl: s(body.logoUrl),
    showLanguageSwitcher: typeof body.showLanguageSwitcher === 'boolean' ? body.showLanguageSwitcher : true,
    showLocationsNav: typeof body.showLocationsNav === 'boolean' ? body.showLocationsNav : true,
    showCompletedNav: typeof body.showCompletedNav === 'boolean' ? body.showCompletedNav : true,
  }
  const settings = await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: fields,
    create: { id: 'main', ...fields },
  })
  return NextResponse.json(settings)
}
