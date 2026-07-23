import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated, hasRole } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      units: {
        select: {
          id: true, label: true, buildingLabel: true, status: true,
          area: true, price: true,
          project: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ projectId: 'asc' }, { buildingLabel: 'asc' }, { label: 'asc' }],
      },
    },
  })
  if (!company) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(company)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json()

  // Handle unit linking if unitIds provided
  if (Array.isArray(body.unitIds)) {
    // Unlink units currently assigned to this company but not in new list
    const forceIds: string[] = Array.isArray(body.forceUnitIds) ? body.forceUnitIds : []
    const allNewIds = [...new Set([...body.unitIds, ...forceIds])]

    await prisma.unit.updateMany({
      where: { companyId: id, id: { notIn: allNewIds } },
      data: { companyId: null },
    })
    // Link regular units (only if unassigned or already ours)
    if (body.unitIds.length > 0) {
      await prisma.unit.updateMany({
        where: {
          id: { in: body.unitIds },
          OR: [{ companyId: null }, { companyId: id }],
        },
        data: { companyId: id },
      })
    }
    // Force-assign units regardless of current company (project takeover)
    if (forceIds.length > 0) {
      await prisma.unit.updateMany({
        where: { id: { in: forceIds } },
        data: { companyId: id },
      })
    }
  }

  const company = await prisma.company.update({
    where: { id },
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
    include: {
      units: {
        select: {
          id: true, label: true, buildingLabel: true, status: true,
          area: true, price: true,
          project: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ projectId: 'asc' }, { buildingLabel: 'asc' }, { label: 'asc' }],
      },
    },
  })

  return NextResponse.json(company)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  await prisma.company.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
