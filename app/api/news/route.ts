import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const posts = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(posts)
}
