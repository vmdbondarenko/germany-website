import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; viewId: string }> }
) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { viewId } = await params
  const body = await request.json()
  const view = await prisma.planView.update({
    where: { id: viewId },
    data: body,
  })
  return NextResponse.json(view)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; viewId: string }> }
) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { viewId } = await params
  await prisma.planView.delete({ where: { id: viewId } })
  return NextResponse.json({ success: true })
}
