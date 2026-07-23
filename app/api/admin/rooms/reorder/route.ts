import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// Updates the `Room.number` values of a floor's rooms in a single transaction
// so partial failures can't leave duplicate or skipped numbers. Two modes:
//
//   { orderedIds: string[] }        → renumber 1..N to match the given order
//                                     (the explicit "Przenumeruj 1…N" button).
//   { assignments: {id, number}[] } → write the exact numbers provided, touching
//                                     only those rooms (used by the up/down
//                                     arrows, which swap just the two adjacent
//                                     rooms' numbers and leave the rest alone).
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => null) as
    | { orderedIds?: unknown; assignments?: unknown }
    | null

  // Explicit per-room number assignments.
  if (body && Array.isArray(body.assignments)) {
    const assignments = body.assignments as unknown[]
    const valid = assignments.every(
      (a) =>
        a != null &&
        typeof (a as { id?: unknown }).id === 'string' &&
        ((a as { number?: unknown }).number === null ||
          typeof (a as { number?: unknown }).number === 'number')
    )
    if (!valid) {
      return NextResponse.json(
        { error: 'assignments must be {id: string, number: number | null}[]' },
        { status: 400 }
      )
    }
    if (assignments.length === 0) return NextResponse.json({ success: true, updated: 0 })
    const typed = assignments as { id: string; number: number | null }[]
    await prisma.$transaction(
      typed.map((a) => prisma.room.update({ where: { id: a.id }, data: { number: a.number } }))
    )
    return NextResponse.json({ success: true, updated: typed.length })
  }

  // Renumber 1..N to match the provided order.
  const orderedIds = body?.orderedIds
  if (!Array.isArray(orderedIds) || orderedIds.some(id => typeof id !== 'string')) {
    return NextResponse.json({ error: 'orderedIds must be an array of strings' }, { status: 400 })
  }
  if (orderedIds.length === 0) return NextResponse.json({ success: true, updated: 0 })

  await prisma.$transaction(
    (orderedIds as string[]).map((id, idx) =>
      prisma.room.update({ where: { id }, data: { number: idx + 1 } })
    )
  )
  return NextResponse.json({ success: true, updated: orderedIds.length })
}
