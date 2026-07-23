import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Return all units with project and company info, for assignment UI
  const units = await prisma.unit.findMany({
    select: {
      id: true, label: true, buildingLabel: true, status: true,
      area: true, price: true, companyId: true,
      project: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: [{ projectId: 'asc' }, { buildingLabel: 'asc' }, { label: 'asc' }],
  })
  return NextResponse.json(units)
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()

  // Auto-compute fullPrice from components
  if (body.price != null) {
    body.fullPrice = body.price + (body.parkingPrice ?? 0) + (body.storagePrice ?? 0) + (body.rightsPrice ?? 0) + (body.otherPrice ?? 0)
  }

  const unit = await prisma.unit.create({ data: body })

  // Create initial PriceHistory if unit has a price
  if (unit.price) {
    const pricePerSqm = unit.area && unit.area > 0 ? unit.price / unit.area : null
    await prisma.priceHistory.create({
      data: {
        unitId: unit.id,
        pricePerSqm,
        totalPrice: unit.price,
        parkingPrice: unit.parkingPrice,
        storagePrice: unit.storagePrice,
      },
    })
  }

  return NextResponse.json(unit, { status: 201 })
}
