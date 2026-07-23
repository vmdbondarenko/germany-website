import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { slugify } from '@/lib/slugify'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const post = await prisma.newsPost.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

type BlockInput = {
  type: 'paragraph' | 'image'
  content?: string | null
  imageUrl?: string | null
}

async function uniqueSlug(base: string, ignoreId: string): Promise<string> {
  let slug = base || 'wpis'
  let i = 2
  while (true) {
    const existing = await prisma.newsPost.findUnique({ where: { slug } })
    if (!existing || existing.id === ignoreId) return slug
    slug = `${base}-${i++}`
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()
  const existing = await prisma.newsPost.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const slug = body.slug
    ? await uniqueSlug(slugify(body.slug), id)
    : existing.slug

  const publishedAt = body.publishedAt
    ? new Date(body.publishedAt)
    : body.published && !existing.publishedAt
      ? new Date()
      : existing.publishedAt

  const blocks: BlockInput[] | undefined = Array.isArray(body.blocks) ? body.blocks : undefined

  const post = await prisma.$transaction(async (tx) => {
    const updated = await tx.newsPost.update({
      where: { id },
      data: {
        slug,
        title: body.title,
        description: body.description ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        published: body.published ?? false,
        publishedAt,
      },
    })

    if (blocks) {
      await tx.newsBlock.deleteMany({ where: { newsPostId: id } })
      if (blocks.length) {
        await tx.newsBlock.createMany({
          data: blocks.map((b, idx) => ({
            newsPostId: id,
            type: b.type,
            content: b.content ?? null,
            imageUrl: b.imageUrl ?? null,
            order: idx,
          })),
        })
      }
    }

    return tx.newsPost.findUnique({
      where: { id: updated.id },
      include: { blocks: { orderBy: { order: 'asc' } } },
    })
  })

  return NextResponse.json(post)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await prisma.newsPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
