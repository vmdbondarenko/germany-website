import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  await prisma.unit.deleteMany({ where: { projectId: id } })
  await prisma.houseType.deleteMany({ where: { projectId: id } })
  await prisma.project.update({
    where: { id },
    data: { svgContent: null, planImageUrl: null },
  })

  return NextResponse.json({ success: true })
}
