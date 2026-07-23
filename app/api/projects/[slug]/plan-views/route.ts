import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      planViews: {
        select: {
          id: true, name: true, imageUrl: true, svgContent: true, order: true, northAngle: true,
          dotOverrides: { select: { unitId: true, dotX: true, dotY: true } },
        },
        orderBy: { order: 'asc' },
      },
    },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project.planViews)
}
