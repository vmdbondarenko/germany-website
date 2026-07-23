import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// Renumbers a stage's views to match the provided id order. The client sends
// the desired order; we write 0..N-1 into `StageView.order` inside a single
// transaction so partial failures can't leave the stage with duplicate or
// skipped order values. Existing data is not otherwise touched — svgContent,
// imageUrl, dotOverrides, etc. all stay bound to their stageViewId.
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await request.json().catch(() => null)) as { orderedIds?: unknown } | null
  const orderedIds = body?.orderedIds
  if (!Array.isArray(orderedIds) || orderedIds.some(id => typeof id !== 'string')) {
    return NextResponse.json({ error: 'orderedIds must be an array of strings' }, { status: 400 })
  }
  if (orderedIds.length === 0) return NextResponse.json({ success: true, updated: 0 })

  await prisma.$transaction(
    (orderedIds as string[]).map((id, idx) =>
      prisma.stageView.update({ where: { id }, data: { order: idx } })
    )
  )
  return NextResponse.json({ success: true, updated: orderedIds.length })
}
