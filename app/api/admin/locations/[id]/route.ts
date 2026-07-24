import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

const numOrNull = (v: unknown) => (v === null || v === '' || v === undefined ? null : Number(v))

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.nameEn !== undefined) data.nameEn = body.nameEn || null
  if (body.slug !== undefined) data.slug = body.slug
  if (body.order !== undefined) data.order = Number(body.order) || 0
  if (body.centerLat !== undefined) data.centerLat = numOrNull(body.centerLat)
  if (body.centerLng !== undefined) data.centerLng = numOrNull(body.centerLng)
  if (body.zoom !== undefined) data.zoom = numOrNull(body.zoom)

  const item = await prisma.location.update({ where: { id }, data })
  return NextResponse.json(item)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  // Project.cityLocationId is onDelete: SetNull — assigned projects simply
  // revert to being served at /inwestycje/{slug}.
  await prisma.location.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
