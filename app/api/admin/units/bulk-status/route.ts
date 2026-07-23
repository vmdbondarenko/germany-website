import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { ids, status } = await request.json()
  await prisma.unit.updateMany({
    where: { id: { in: ids } },
    data: { status },
  })
  return NextResponse.json({ success: true })
}
