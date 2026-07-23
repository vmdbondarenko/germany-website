import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated, hasRole } from '@/lib/auth'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const companies = await prisma.company.findMany({
    include: { projects: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(companies)
}

export async function POST(request: Request) {
  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()

  if (!body.name?.trim()) return NextResponse.json({ error: 'Nazwa jest wymagana' }, { status: 400 })
  if (!body.slug?.trim()) return NextResponse.json({ error: 'Slug jest wymagany' }, { status: 400 })
  if (!body.nip?.trim()) return NextResponse.json({ error: 'NIP jest wymagany' }, { status: 400 })
  if (!body.regon?.trim()) return NextResponse.json({ error: 'REGON jest wymagany' }, { status: 400 })

  try {
    const company = await prisma.company.create({
      data: {
        name: body.name,
        slug: body.slug,
        legalForm: body.legalForm || null,
        nip: body.nip,
        krs: body.krs || null,
        ceidg: body.ceidg || null,
        regon: body.regon,
        addrVoivodeship: body.addrVoivodeship || null,
        addrCounty: body.addrCounty || null,
        addrMunicipality: body.addrMunicipality || null,
        addrCity: body.addrCity || null,
        addrStreet: body.addrStreet || null,
        addrBuildingNr: body.addrBuildingNr || null,
        addrUnitNr: body.addrUnitNr || null,
        addrPostalCode: body.addrPostalCode || null,
        salesVoivodeship: body.salesVoivodeship || null,
        salesCounty: body.salesCounty || null,
        salesMunicipality: body.salesMunicipality || null,
        salesCity: body.salesCity || null,
        salesStreet: body.salesStreet || null,
        salesBuildingNr: body.salesBuildingNr || null,
        salesUnitNr: body.salesUnitNr || null,
        salesPostalCode: body.salesPostalCode || null,
        salesAdditional: body.salesAdditional || null,
        salesContact: body.salesContact || null,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        contactFax: body.contactFax || null,
        contactPerson: body.contactPerson || null,
        websiteUrl: body.websiteUrl || null,
      },
    })
    return NextResponse.json(company)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Unique constraint') && msg.includes('slug')) {
      return NextResponse.json({ error: 'Firma z takim slugiem już istnieje' }, { status: 400 })
    }
    console.error('Company create error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
