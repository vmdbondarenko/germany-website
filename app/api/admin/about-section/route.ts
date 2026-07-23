import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  const section = await prisma.aboutSection.findUnique({ where: { id: 'main' } })
  return NextResponse.json(section)
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const section = await prisma.aboutSection.upsert({
    where: { id: 'main' },
    update: { companyName: body.companyName, description: body.description, photos: body.photos ?? [] },
    create: { id: 'main', companyName: body.companyName, description: body.description, photos: body.photos ?? [] },
  })
  return NextResponse.json(section)
}
