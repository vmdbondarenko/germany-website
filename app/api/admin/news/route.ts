import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { slugify } from '@/lib/slugify'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const posts = await prisma.newsPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(posts)
}

async function makeUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = base || 'wpis'
  let i = 2
  while (true) {
    const existing = await prisma.newsPost.findUnique({ where: { slug } })
    if (!existing || existing.id === ignoreId) return slug
    slug = `${base}-${i++}`
  }
}

type BlockInput = {
  type: 'paragraph' | 'image'
  content?: string | null
  imageUrl?: string | null
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const baseSlug = body.slug ? slugify(body.slug) : slugify(body.title || '')
  const slug = await makeUniqueSlug(baseSlug)

  const publishedAt = body.publishedAt
    ? new Date(body.publishedAt)
    : body.published
      ? new Date()
      : null

  const blocks: BlockInput[] = Array.isArray(body.blocks) ? body.blocks : []

  const post = await prisma.newsPost.create({
    data: {
      slug,
      title: body.title,
      description: body.description ?? null,
      coverImageUrl: body.coverImageUrl ?? null,
      published: body.published ?? false,
      publishedAt,
      blocks: {
        create: blocks.map((b, idx) => ({
          type: b.type,
          content: b.content ?? null,
          imageUrl: b.imageUrl ?? null,
          order: idx,
        })),
      },
    },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(post, { status: 201 })
}
