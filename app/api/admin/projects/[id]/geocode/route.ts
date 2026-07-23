import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { geocodeAddress, buildProjectAddress } from '@/lib/geocode'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  const body = (await request.json().catch(() => ({}))) as {
    address?: string
    overrides?: {
      investStreet?: string | null
      investBuildingNr?: string | null
      investPostalCode?: string | null
      investCity?: string | null
      investVoivodeship?: string | null
      location?: string | null
    }
  }

  let address = body.address?.trim() || ''
  if (!address) {
    const existing = await prisma.project.findUnique({
      where: { id },
      select: {
        investVoivodeship: true, investCity: true, investStreet: true,
        investBuildingNr: true, investPostalCode: true, location: true,
      },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    address = buildProjectAddress({ ...existing, ...(body.overrides || {}) })
  }

  if (!address) {
    return NextResponse.json({ error: 'Brak adresu do geokodowania' }, { status: 400 })
  }

  const result = await geocodeAddress(address)
  if (!result.ok) {
    const status = result.status === 'REQUEST_DENIED' || result.reason.includes('nie jest ustawiony') ? 500 : 422
    return NextResponse.json(
      { error: `${result.reason} (adres: ${address})` },
      { status }
    )
  }

  return NextResponse.json({ lat: result.lat, lng: result.lng, address: result.formatted || address })
}
