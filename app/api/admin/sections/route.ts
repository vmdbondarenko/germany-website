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

  const sections = await prisma.projectSection.findMany({
    where: { projectId },
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(sections)
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const section = await prisma.projectSection.upsert({
    where: {
      projectId_type: { projectId: body.projectId, type: body.type },
    },
    update: {
      label: body.label,
      heading: body.heading,
      description: body.description,
      imageUrl: body.imageUrl,
      imageUrl2: body.imageUrl2,
      mapUrl: body.mapUrl,
      enabled: body.enabled,
      order: body.order,
    },
    create: body,
    include: { items: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(section)
}
