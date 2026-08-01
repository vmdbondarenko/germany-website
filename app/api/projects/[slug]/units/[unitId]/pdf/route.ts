import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import sharp from 'sharp'
import React from 'react'
import { UnitPdfDocument, type UnitPdfData } from '@/lib/pdf/unit-pdf-template'
import { typeArea, floorArea } from '@/lib/house-type-area'
import { primaryContact, company } from '@/lib/contact-info'

// Phone shown in the generated PDF. Comes from lib/contact-info.ts (single
// source of truth — the German HQ number).
function pdfPhoneForCity(_citySlug: string | null | undefined): string {
  return primaryContact.phone
}

async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) {
      console.warn(`PDF image fetch failed: ${url} → ${res.status}`)
      return null
    }
    const contentType = res.headers.get('content-type') || 'image/png'
    let buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.byteLength === 0) {
      console.warn(`PDF image empty: ${url}`)
      return null
    }

    // react-pdf only supports JPEG and PNG — convert anything else (webp, avif, etc.)
    if (!contentType.includes('jpeg') && !contentType.includes('png')) {
      const pngBuf = await sharp(buffer).png().toBuffer()
      const base64 = pngBuf.toString('base64')
      return `data:image/png;base64,${base64}`
    }

    const base64 = buffer.toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch (err) {
    console.warn(`PDF image error: ${url}`, err)
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; unitId: string }> }
) {
  const { slug, unitId } = await params

  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        sections: {
          where: { type: 'key_features', enabled: true },
          include: { items: { orderBy: { order: 'asc' } } },
        },
        galleryImages: { orderBy: { order: 'asc' }, take: 6 },
        // The investment's assigned city drives the PDF contact phone.
        cityLocation: { select: { slug: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const unit = await prisma.unit.findFirst({
      where: { id: unitId, projectId: project.id },
      include: {
        company: true,
        houseType: {
          include: {
            floorPlans: {
              include: { rooms: { orderBy: { number: 'asc' } } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    if (!unit.houseType || unit.houseType.floorPlans.length === 0) {
      return NextResponse.json(
        { error: 'Unit has no house type or floor plans assigned' },
        { status: 400 }
      )
    }

    const keyFeaturesSection = project.sections[0]
    const keyFeatures = keyFeaturesSection?.items.slice(0, 4).map(item => ({
      title: item.title,
      subtitle: item.subtitle,
    })) ?? []

    const galleryImages = project.galleryImages.map(img => ({
      src: img.src,
      label: img.label || '',
    }))

    // Build company address string
    let companyAddress: string | null = null
    if (unit.company) {
      const c = unit.company
      // Unit number belongs with the building number, not after the city.
      const buildingPart = [c.salesBuildingNr, c.salesUnitNr].filter(Boolean).join('/')
      const parts = [c.salesStreet, buildingPart, c.salesCity].filter(Boolean)
      if (parts.length > 0) {
        companyAddress = parts.join(', ')
      }
    }

    // Pre-fetch all images as base64 data URIs for reliable PDF rendering
    const allImageUrls: string[] = []
    for (const fp of unit.houseType.floorPlans) {
      if (fp.image3dUrl) allImageUrls.push(fp.image3dUrl)
      if (fp.image2dUrl) allImageUrls.push(fp.image2dUrl)
    }
    for (const img of project.galleryImages) {
      allImageUrls.push(img.src)
    }

    const imageCache = new Map<string, string | null>()
    const fetched = await Promise.all(allImageUrls.map(url => fetchImageAsDataUri(url)))
    allImageUrls.forEach((url, i) => imageCache.set(url, fetched[i]))

    const pdfData: UnitPdfData = {
      projectName: project.name,
      unitLabel: unit.label,
      // Size is always the sum of the type's room areas — computed, never stored.
      totalArea: typeArea(unit.houseType.floorPlans),
      rooms: unit.rooms,
      price: unit.price == null ? null : unit.price
        + (unit.parkingPrice ?? 0)
        + (unit.storagePrice ?? 0)
        + (unit.rightsPrice ?? 0)
        + (unit.otherPrice ?? 0),
      houseTypeName: unit.houseType.name,
      floorPlans: unit.houseType.floorPlans.map(fp => ({
        name: fp.name,
        area: floorArea(fp.rooms),
        // Only pass images that were successfully converted to data URIs
        image3dUrl: fp.image3dUrl ? (imageCache.get(fp.image3dUrl) ?? null) : null,
        image2dUrl: fp.image2dUrl ? (imageCache.get(fp.image2dUrl) ?? null) : null,
        rooms: fp.rooms.map((r, i) => ({
          number: r.number ?? i + 1,
          name: r.name,
          area: r.area,
        })),
      })),
      keyFeatures,
      galleryImages: galleryImages
        .map(img => ({
          src: imageCache.get(img.src) ?? null,
          label: img.label,
        }))
        .filter((img): img is { src: string; label: string } => img.src !== null),
      // Fall back to the German HQ company data when a unit has no linked Company.
      companyName: unit.company?.name ?? company.name,
      companyWebsite: unit.company?.websiteUrl ?? null,
      companyEmail: unit.company?.contactEmail ?? project.contactEmail ?? company.email,
      companyPhone: pdfPhoneForCity(project.cityLocation?.slug),
      companyAddress: companyAddress ?? company.addressOneLine,
    }

    const buffer = await renderToBuffer(
      React.createElement(UnitPdfDocument, { data: pdfData }) as any
    )

    const filename = `${project.slug}_${unit.label.replace(/\s+/g, '-')}.pdf`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
