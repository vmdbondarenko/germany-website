import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const views = await prisma.planView.findMany({
    where: { projectId: id },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(views)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { name, imageUrl, order } = await request.json()
  const view = await prisma.planView.create({
    data: { projectId: id, name, imageUrl: imageUrl || null, order: order ?? 0 },
  })
  return NextResponse.json(view)
}
