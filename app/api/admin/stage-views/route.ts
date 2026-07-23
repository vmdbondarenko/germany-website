import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const view = await prisma.stageView.create({
    data: {
      stageId: body.stageId,
      name: body.name,
      imageUrl: body.imageUrl || null,
      order: body.order ?? 0,
    },
  })
  return NextResponse.json(view, { status: 201 })
}
