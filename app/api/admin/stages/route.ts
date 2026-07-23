import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const stages = await prisma.stage.findMany({
    where: { projectId },
    include: { stageViews: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(stages)
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const stage = await prisma.stage.create({
    data: {
      projectId: body.projectId,
      svgElementId: body.svgElementId,
      name: body.name,
      order: body.order ?? 0,
    },
    include: { stageViews: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(stage, { status: 201 })
}
