import { prisma } from "@/lib/prisma"
import type { ProjectPoint, CityConfig } from "@/components/lokalizacja/city-map"

// Fallback map center (Poland) when a location has no override and none of its
// projects have coordinates yet.
const DEFAULT_CENTER = { lat: 52.0693, lng: 19.4803 }

function parseCoordsFromMapUrl(url: string | null | undefined): { lat: number; lng: number } | null {
  if (!url) return null
  const normalized = url.match(/^https?:\/\//) ? url : `https://${url}`
  const placeMatches = [...normalized.matchAll(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/g)]
  if (placeMatches.length > 0) {
    const last = placeMatches[placeMatches.length - 1]
    return { lat: Number(last[1]), lng: Number(last[2]) }
  }
  const atMatch = normalized.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) }
  const qMatch = normalized.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) return { lat: Number(qMatch[1]), lng: Number(qMatch[2]) }
  return null
}

/**
 * Cities (from admin-managed Locations) + their assigned, published projects as
 * map points. City grouping is now explicit via `project.cityLocation` (no more
 * coordinate guessing). A project appears in its city's card list even without
 * coordinates; only points with coordinates get a map marker.
 */
export async function loadLokalizacjaData(): Promise<{ cities: CityConfig[]; points: ProjectPoint[] }> {
  const [locations, projects] = await Promise.all([
    prisma.location.findMany({ orderBy: { order: "asc" } }),
    prisma.project.findMany({
      where: { status: "active", published: true, cityLocationId: { not: null } },
      select: {
        id: true,
        name: true,
        slug: true,
        location: true,
        investCity: true,
        investStreet: true,
        investBuildingNr: true,
        imageUrl: true,
        heroSubtitle: true,
        description: true,
        status: true,
        latitude: true,
        longitude: true,
        cityLocation: { select: { slug: true } },
        sections: {
          where: { type: { in: ["lokalizacja", "key_features"] } },
          select: { type: true, mapUrl: true, enabled: true, items: { select: { title: true, subtitle: true }, orderBy: { order: "asc" } } },
        },
        units: { select: { status: true } },
      },
    }),
  ])

  const points: ProjectPoint[] = projects.map((p) => {
    const lokalizacjaSection = p.sections.find((s) => s.type === "lokalizacja")
    const coords =
      p.latitude != null && p.longitude != null
        ? { lat: p.latitude, lng: p.longitude }
        : parseCoordsFromMapUrl(lokalizacjaSection?.mapUrl)
    const streetLine = [p.investStreet, p.investBuildingNr].filter(Boolean).join(" ")
    const address = streetLine || p.investCity || p.location || null
    const keyFeaturesSection = p.sections.find((s) => s.type === "key_features" && s.enabled)
    const citySlug = p.cityLocation!.slug
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      citySlug,
      href: `/${citySlug}/${p.slug}`,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      address,
      imageUrl: p.imageUrl,
      location: p.location,
      heroSubtitle: p.heroSubtitle,
      description: p.description,
      status: p.status,
      availableCount: p.units.filter((u) => u.status === "available").length,
      totalCount: p.units.length,
      keyFeatures: keyFeaturesSection?.items ?? [],
    }
  })

  const cities: CityConfig[] = locations.map((loc) => {
    const cityPoints = points.filter((pt) => pt.citySlug === loc.slug && pt.lat != null && pt.lng != null)
    let center = DEFAULT_CENTER
    if (loc.centerLat != null && loc.centerLng != null) {
      center = { lat: loc.centerLat, lng: loc.centerLng }
    } else if (cityPoints.length > 0) {
      center = {
        lat: cityPoints.reduce((s, pt) => s + (pt.lat as number), 0) / cityPoints.length,
        lng: cityPoints.reduce((s, pt) => s + (pt.lng as number), 0) / cityPoints.length,
      }
    }
    return { name: loc.name, slug: loc.slug, centerLat: center.lat, centerLng: center.lng, zoom: loc.zoom ?? 11 }
  })

  return { cities, points }
}
