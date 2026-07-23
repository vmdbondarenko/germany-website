import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// All homepage section overrides (with items). Missing sections simply fall back
// to the code defaults in lib/home-content.ts on the public site.
export async function GET() {
  const sections = await prisma.homeSection.findMany({
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(sections)
}

// Upsert one section (identified by its stable string id) and replace its items.
export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const id: string = body.id
  if (!id) return NextResponse.json({ error: 'Missing section id' }, { status: 400 })

  const scalar = {
    eyebrowDe: body.eyebrowDe || null,
    eyebrowEn: body.eyebrowEn || null,
    headingDe: body.headingDe || null,
    headingEn: body.headingEn || null,
    descriptionDe: body.descriptionDe || null,
    descriptionEn: body.descriptionEn || null,
    imageUrl: body.imageUrl || null,
    imageUrl2: body.imageUrl2 || null,
    primaryCtaLabelDe: body.primaryCtaLabelDe || null,
    primaryCtaLabelEn: body.primaryCtaLabelEn || null,
    primaryCtaHref: body.primaryCtaHref || null,
    secondaryCtaLabelDe: body.secondaryCtaLabelDe || null,
    secondaryCtaLabelEn: body.secondaryCtaLabelEn || null,
    secondaryCtaHref: body.secondaryCtaHref || null,
    enabled: body.enabled ?? true,
    order: body.order ?? 0,
  }

  type ItemInput = {
    icon?: string
    titleDe?: string
    titleEn?: string
    descriptionDe?: string
    descriptionEn?: string
  }
  const items: ItemInput[] = Array.isArray(body.items) ? body.items : []

  await prisma.$transaction([
    prisma.homeSection.upsert({
      where: { id },
      update: scalar,
      create: { id, ...scalar },
    }),
    prisma.homeSectionItem.deleteMany({ where: { sectionId: id } }),
    ...(items.length
      ? [
          prisma.homeSectionItem.createMany({
            data: items.map((it, i) => ({
              sectionId: id,
              icon: it.icon || null,
              titleDe: it.titleDe || null,
              titleEn: it.titleEn || null,
              descriptionDe: it.descriptionDe || null,
              descriptionEn: it.descriptionEn || null,
              order: i,
            })),
          }),
        ]
      : []),
  ])

  const saved = await prisma.homeSection.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(saved)
}
