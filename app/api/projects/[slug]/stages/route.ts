import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      stages: {
        where: { published: true },
        include: {
          stageViews: {
            orderBy: { order: 'asc' },
            include: {
              dotOverrides: { select: { unitId: true, dotX: true, dotY: true } },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project.stages)
}
