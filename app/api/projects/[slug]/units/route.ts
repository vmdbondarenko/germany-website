import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withDerivedAreas } from '@/lib/house-type-area'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        units: {
          include: {
            houseType: true,
            priceHistory: {
              orderBy: { date: 'asc' },
              select: {
                id: true, date: true,
                totalPrice: true, pricePerSqm: true,
                parkingPrice: true, storagePrice: true, rightsPrice: true, otherPrice: true,
              },
            },
          },
        },
        houseTypes: {
          // Hide types with no attached units from the public site;
          // they only become visible once an admin links them to a Działka.
          where: { units: { some: {} } },
          include: {
            floorPlans: {
              include: { rooms: { orderBy: [{ number: 'asc' }, { createdAt: 'asc' }] } },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        dotOverrides: {
          where: { projectId: { not: null } },
          select: { unitId: true, dotX: true, dotY: true },
        },
      },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Unit/type size is always the sum of the type's room areas — computed here
    // at read time, never stored. Derive each type's floor/total areas, then
    // sync every unit's area to its type (no type → no area).
    const houseTypes = project.houseTypes.map(withDerivedAreas)
    const typeAreaById = new Map(houseTypes.map((t) => [t.id, t.totalArea]))
    const units = project.units.map((u) => ({
      ...u,
      area: u.houseTypeId != null ? typeAreaById.get(u.houseTypeId) ?? null : null,
      houseType: u.houseType
        ? { ...u.houseType, totalArea: typeAreaById.get(u.houseType.id) ?? u.houseType.totalArea }
        : u.houseType,
    }))

    return NextResponse.json({
      svgContent: project.svgContent,
      planImageUrl: project.planImageUrl,
      northAngle: project.northAngle,
      units,
      houseTypes,
      dotOverrides: project.dotOverrides,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 })
  }
}
