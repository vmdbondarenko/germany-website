import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { geocodeAddress, buildProjectAddress } from '@/lib/geocode'
import { typeArea, floorArea } from '@/lib/house-type-area'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      units: { orderBy: { label: 'asc' } },
      houseTypes: {
        include: {
          floorPlans: {
            include: { rooms: { orderBy: [{ number: 'asc' }, { createdAt: 'asc' }] } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      sections: {
        include: { items: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
      galleryImages: { orderBy: { order: 'asc' } },
      documents: { orderBy: { order: 'asc' } },
      stages: {
        include: {
          stageViews: {
            orderBy: { order: 'asc' },
            include: {
              dotOverrides: { select: { unitId: true, dotX: true, dotY: true } },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      planViews: {
        orderBy: { order: 'asc' },
        include: {
          dotOverrides: { select: { unitId: true, dotX: true, dotY: true } },
        },
      },
      dotOverrides: {
        where: { projectId: { not: null } },
        select: { unitId: true, dotX: true, dotY: true },
      },
    },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Unit/type size is always the sum of the type's room areas — computed here
  // at read time, never stored. Fill in floor/type areas and sync each unit's
  // area to its type so the admin UI matches the public site.
  const typeAreaById = new Map(project.houseTypes.map((t) => [t.id, typeArea(t.floorPlans)]))
  const serialized = {
    ...project,
    houseTypes: project.houseTypes.map((t) => ({
      ...t,
      totalArea: typeAreaById.get(t.id) ?? null,
      floorPlans: t.floorPlans.map((f) => ({ ...f, area: floorArea(f.rooms) })),
    })),
    units: project.units.map((u) => ({
      ...u,
      area: u.houseTypeId != null ? typeAreaById.get(u.houseTypeId) ?? null : null,
    })),
  }
  return NextResponse.json(serialized)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()

  // Whitelist allowed fields to prevent overwriting relations
  const {
    name, slug, location, description, svgContent, imageUrl, planImageUrl,
    status, published, heroSubtitle, contactPhone, contactEmail, contactAddress,
    companyId,
    investVoivodeship, investCounty, investMunicipality, investCity,
    investStreet, investBuildingNr, investPostalCode,
    propertyType, prospektUrl, additionalInfo,
    latitude, longitude, northAngle,
    cityLocationId,
    // English overrides
    locationEn, descriptionEn, heroSubtitleEn, additionalInfoEn,
  } = body

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (slug !== undefined) data.slug = slug
  if (location !== undefined) data.location = location
  if (locationEn !== undefined) data.locationEn = locationEn || null
  if (description !== undefined) data.description = description || null
  if (descriptionEn !== undefined) data.descriptionEn = descriptionEn || null
  if (svgContent !== undefined) data.svgContent = svgContent
  if (imageUrl !== undefined) data.imageUrl = imageUrl
  if (planImageUrl !== undefined) data.planImageUrl = planImageUrl
  if (status !== undefined) data.status = status
  if (published !== undefined) data.published = published
  if (heroSubtitle !== undefined) data.heroSubtitle = heroSubtitle || null
  if (heroSubtitleEn !== undefined) data.heroSubtitleEn = heroSubtitleEn || null
  if (contactPhone !== undefined) data.contactPhone = contactPhone || null
  if (contactEmail !== undefined) data.contactEmail = contactEmail || null
  if (contactAddress !== undefined) data.contactAddress = contactAddress || null
  if (companyId !== undefined) data.companyId = companyId || null
  if (cityLocationId !== undefined) data.cityLocationId = cityLocationId || null
  if (investVoivodeship !== undefined) data.investVoivodeship = investVoivodeship || null
  if (investCounty !== undefined) data.investCounty = investCounty || null
  if (investMunicipality !== undefined) data.investMunicipality = investMunicipality || null
  if (investCity !== undefined) data.investCity = investCity || null
  if (investStreet !== undefined) data.investStreet = investStreet || null
  if (investBuildingNr !== undefined) data.investBuildingNr = investBuildingNr || null
  if (investPostalCode !== undefined) data.investPostalCode = investPostalCode || null
  if (propertyType !== undefined) data.propertyType = propertyType || null
  if (prospektUrl !== undefined) data.prospektUrl = prospektUrl || null
  if (additionalInfo !== undefined) data.additionalInfo = additionalInfo || null
  if (additionalInfoEn !== undefined) data.additionalInfoEn = additionalInfoEn || null
  if (latitude !== undefined) {
    data.latitude = latitude === null || latitude === '' ? null : Number(latitude)
  }
  if (longitude !== undefined) {
    data.longitude = longitude === null || longitude === '' ? null : Number(longitude)
  }
  if (northAngle !== undefined) {
    data.northAngle = northAngle === null || northAngle === '' ? null : Math.round(Number(northAngle))
  }

  const latProvided = 'latitude' in body && data.latitude != null
  const lngProvided = 'longitude' in body && data.longitude != null
  const addressFields = [
    'investVoivodeship', 'investCity', 'investStreet',
    'investBuildingNr', 'investPostalCode', 'location',
  ] as const
  const addressChanged = addressFields.some(f => f in body)

  // Only auto-geocode when address changed AND the client didn't pass explicit
  // coordinates in this request AND the project doesn't already have them.
  // Manual values in the admin always win.
  if (addressChanged && !latProvided && !lngProvided) {
    const existing = await prisma.project.findUnique({
      where: { id },
      select: {
        investVoivodeship: true, investCity: true, investStreet: true,
        investBuildingNr: true, investPostalCode: true, location: true,
        latitude: true, longitude: true,
      },
    })
    if (existing?.latitude == null || existing?.longitude == null) {
      const merged = { ...existing, ...data } as Parameters<typeof buildProjectAddress>[0]
      const address = buildProjectAddress(merged)
      const result = await geocodeAddress(address)
      if (result.ok) {
        data.latitude = result.lat
        data.longitude = result.lng
      }
    }
  }

  // Detect a slug rename so we can preserve the old URL via a redirect alias.
  let oldSlug: string | null = null
  if (slug !== undefined) {
    const current = await prisma.project.findUnique({ where: { id }, select: { slug: true } })
    if (current && current.slug !== slug) oldSlug = current.slug
  }

  const project = await prisma.project.update({ where: { id }, data })

  if (oldSlug) {
    // The new slug may itself have been a historical alias — free it first.
    await prisma.projectSlugAlias.deleteMany({ where: { slug: project.slug } })
    // Record the old slug → this project so /inwestycje/{old} and /{city}/{old}
    // keep 308-redirecting to the current canonical. Upsert covers re-renames.
    await prisma.projectSlugAlias.upsert({
      where: { slug: oldSlug },
      update: { projectId: project.id },
      create: { slug: oldSlug, projectId: project.id },
    })
  }

  return NextResponse.json(project)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
