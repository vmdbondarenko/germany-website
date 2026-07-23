import { prisma } from '@/lib/prisma'
import { UnitsManager } from './units-manager'
import { typeArea } from '@/lib/house-type-area'

export const dynamic = 'force-dynamic'

export default async function AdminUnitsPage() {
  const rows = await prisma.unit.findMany({
    select: {
      id: true,
      label: true,
      buildingLabel: true,
      svgElementId: true,
      status: true,
      stage: true,
      area: true,
      gardenArea: true,
      floor: true,
      rooms: true,
      floors: true,
      price: true,
      fullPrice: true,
      parkingPrice: true,
      storagePrice: true,
      rightsPrice: true,
      otherPrice: true,
      partsType: true,
      partsLabel: true,
      roomsType: true,
      roomsLabel: true,
      rightsDesc: true,
      otherDesc: true,
      description: true,
      project: { select: { id: true, name: true, slug: true } },
      company: { select: { id: true, name: true } },
      // Size is the sum of the type's room areas — computed here, never the
      // stored column. Needed to show the right value on this read-only field.
      houseType: { select: { floorPlans: { select: { rooms: { select: { area: true } } } } } },
    },
    orderBy: [
      { projectId: 'asc' },
      { buildingLabel: 'asc' },
      { label: 'asc' },
    ],
  })

  const units = rows.map(({ houseType, ...u }) => ({
    ...u,
    area: houseType ? typeArea(houseType.floorPlans) : null,
  }))

  return <UnitsManager initialUnits={units} />
}
