import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  const items = await prisma.location.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { projects: true } } },
  })
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const item = await prisma.location.create({
    data: {
      name: body.name ?? '',
      nameEn: body.nameEn || null,
      slug: body.slug ?? '',
      order: body.order ?? 0,
      centerLat: body.centerLat ?? null,
      centerLng: body.centerLng ?? null,
      zoom: body.zoom ?? null,
    },
  })
  return NextResponse.json(item, { status: 201 })
}
