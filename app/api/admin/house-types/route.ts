import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const houseType = await prisma.houseType.create({
    data: body,
    include: { floorPlans: { include: { rooms: true } } },
  })
  return NextResponse.json(houseType, { status: 201 })
}
