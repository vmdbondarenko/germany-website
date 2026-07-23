import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const projects = await prisma.project.findMany({
    include: {
      units: { select: { status: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const project = await prisma.project.create({ data: body })
  return NextResponse.json(project, { status: 201 })
}
