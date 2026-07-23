import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

type MapKind = 'project' | 'planview' | 'stageview'

function mapKeyFields(mapKind: MapKind, mapId: string) {
  if (mapKind === 'project') return { projectId: mapId, planViewId: null, stageViewId: null }
  if (mapKind === 'planview') return { projectId: null, planViewId: mapId, stageViewId: null }
  return { projectId: null, planViewId: null, stageViewId: mapId }
}

function uniqueWhere(unitId: string, mapKind: MapKind, mapId: string) {
  if (mapKind === 'project') return { unitId_projectId: { unitId, projectId: mapId } }
  if (mapKind === 'planview') return { unitId_planViewId: { unitId, planViewId: mapId } }
  return { unitId_stageViewId: { unitId, stageViewId: mapId } }
}

// Upsert a dot override for (unit, map).
// Body: { unitId, mapKind, mapId, dotX, dotY }
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const { unitId, mapKind, mapId, dotX, dotY } = body
  if (!unitId || !mapKind || !mapId || typeof dotX !== 'number' || typeof dotY !== 'number') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (mapKind !== 'project' && mapKind !== 'planview' && mapKind !== 'stageview') {
    return NextResponse.json({ error: 'Invalid mapKind' }, { status: 400 })
  }

  const keys = mapKeyFields(mapKind, mapId)
  const override = await prisma.unitDotOverride.upsert({
    where: uniqueWhere(unitId, mapKind, mapId),
    create: { unitId, ...keys, dotX, dotY },
    update: { dotX, dotY },
  })
  return NextResponse.json(override)
}

// Delete a dot override for (unit, map).
// Query: ?unitId=...&mapKind=...&mapId=...
export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(request.url)
  const unitId = url.searchParams.get('unitId')
  const mapKind = url.searchParams.get('mapKind') as MapKind | null
  const mapId = url.searchParams.get('mapId')
  if (!unitId || !mapKind || !mapId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }
  if (mapKind !== 'project' && mapKind !== 'planview' && mapKind !== 'stageview') {
    return NextResponse.json({ error: 'Invalid mapKind' }, { status: 400 })
  }
  await prisma.unitDotOverride.deleteMany({
    where: { unitId, ...mapKeyFields(mapKind, mapId) },
  })
  return NextResponse.json({ success: true })
}
