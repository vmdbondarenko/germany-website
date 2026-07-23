import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; viewId: string }> }
) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { viewId } = await params
  const { svgContent } = await request.json()
  const view = await prisma.planView.update({
    where: { id: viewId },
    data: { svgContent },
  })
  return NextResponse.json(view)
}
