import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated, hasRole } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()

  // Check if price-related fields changed for PriceHistory tracking
  const existing = await prisma.unit.findUnique({ where: { id } })

  // Auto-compute fullPrice from components — merge incoming body with existing values
  const price        = body.price        !== undefined ? body.price        : existing?.price
  const parkingPrice = body.parkingPrice !== undefined ? body.parkingPrice : existing?.parkingPrice
  const storagePrice = body.storagePrice !== undefined ? body.storagePrice : existing?.storagePrice
  const rightsPrice  = body.rightsPrice  !== undefined ? body.rightsPrice  : existing?.rightsPrice
  const otherPrice   = body.otherPrice   !== undefined ? body.otherPrice   : existing?.otherPrice
  if (price != null) {
    body.fullPrice = price + (parkingPrice ?? 0) + (storagePrice ?? 0) + (rightsPrice ?? 0) + (otherPrice ?? 0)
  }

  const unit = await prisma.unit.update({ where: { id }, data: body })

  if (existing && (
    body.price !== undefined && body.price !== existing.price ||
    body.fullPrice !== undefined && body.fullPrice !== existing.fullPrice ||
    body.parkingPrice !== undefined && body.parkingPrice !== existing.parkingPrice ||
    body.storagePrice !== undefined && body.storagePrice !== existing.storagePrice ||
    body.rightsPrice !== undefined && body.rightsPrice !== existing.rightsPrice ||
    body.otherPrice !== undefined && body.otherPrice !== existing.otherPrice
  )) {
    const pricePerSqm = unit.price && unit.area && unit.area > 0
      ? unit.price / unit.area
      : null
    await prisma.priceHistory.create({
      data: {
        unitId: id,
        pricePerSqm,
        totalPrice: unit.price,
        fullPrice: unit.fullPrice,
        parkingPrice: unit.parkingPrice,
        storagePrice: unit.storagePrice,
        rightsPrice: unit.rightsPrice,
        otherPrice: unit.otherPrice,
      },
    })
  }

  return NextResponse.json(unit)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  await prisma.unit.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
