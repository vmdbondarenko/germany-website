import Image from "next/image"
import { SectionIcon } from "./icon-map"
import { MapPin } from "lucide-react"
import { ProjectLocationMap } from "./project-location-map"
import { MapGate } from "@/components/map-gate"
import { extractLatLng } from "./extract-lat-lng"
import { resolveAlt, sectionAlt } from "@/lib/seo/image-alt"

type SectionItemData = {
  id: string
  icon: string | null
  title: string
  subtitle: string | null
  description: string | null
  mapUrl?: string | null
}

type SectionData = {
  label: string | null
  heading: string | null
  description: string | null
  imageUrl: string | null
  imageUrl2: string | null
  mapUrl: string | null
  items: SectionItemData[]
}

type ProjectMapContext = {
  name: string
  lat: number | null
  lng: number | null
  apiKey: string | null
  mapId?: string
}

function extractMapQuery(url: string): string {
  try {
    const normalized = url.match(/^https?:\/\//) ? url : `https://${url}`
    // Handle formats: ?q=lat,lng / @lat,lng / place/name/@lat,lng
    const qMatch = normalized.match(/[?&]q=([^&]+)/)
    if (qMatch) return decodeURIComponent(qMatch[1])
    const atMatch = normalized.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (atMatch) return `${atMatch[1]},${atMatch[2]}`
    const placeMatch = normalized.match(/place\/([^/@]+)/)
    if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
    // Fallback: use the full URL as query — Google will resolve it
    return normalized
  } catch {
    return url
  }
}

function LocationItemsGrid({ items }: { items: SectionItemData[] }) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        const coords = extractLatLng(item.mapUrl)
        const mapHref = item.mapUrl
          ? (item.mapUrl.match(/^https?:\/\//) ? item.mapUrl : `https://${item.mapUrl}`)
          : null
        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50"
          >
            <SectionIcon
              name={item.icon || "MapPin"}
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: "#6E2E2A" }}
            />
            <div className="min-w-0">
              <p className="font-medium text-sm" style={{ color: "#3E1718" }}>
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              )}
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              )}
              {mapHref && (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium underline"
                  style={{ color: "#6E2E2A" }}
                  title={coords ? "Widoczny jako pinezka na mapie" : undefined}
                >
                  <MapPin className="h-3 w-3" />
                  In Google Maps öffnen
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MapContent({ section, projectMap, hideItems = false }: { section: SectionData; projectMap?: ProjectMapContext; hideItems?: boolean }) {
  const hasItems = section.items.length > 0
  const mapUrl = section.mapUrl

  // If the project doesn't have explicit lat/lng saved, try to derive them from
  // the section's own mapUrl (same URL that powers the iframe embed). This lets
  // the pin map show without admin needing to fill extra fields.
  const sectionCoords = extractLatLng(mapUrl)
  const resolvedLat = projectMap?.lat ?? sectionCoords?.lat ?? null
  const resolvedLng = projectMap?.lng ?? sectionCoords?.lng ?? null

  // Prefer the interactive project pin map when we have API key + coords
  const canUsePinMap =
    projectMap != null &&
    projectMap.apiKey != null &&
    resolvedLat != null &&
    resolvedLng != null

  if (!mapUrl && !hasItems && !canUsePinMap) return null

  return (
    <div className="space-y-6">
      {canUsePinMap ? (
        <ProjectLocationMap
          apiKey={projectMap!.apiKey}
          mapId={projectMap!.mapId}
          projectName={projectMap!.name}
          projectLat={resolvedLat}
          projectLng={resolvedLng}
          items={section.items.map((i) => ({
            id: i.id,
            icon: i.icon,
            title: i.title,
            subtitle: i.subtitle,
            description: i.description,
            mapUrl: i.mapUrl ?? null,
          }))}
        />
      ) : mapUrl ? (() => {
        const query = extractMapQuery(mapUrl)
        const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
        const mapHref = mapUrl.match(/^https?:\/\//) ? mapUrl : `https://${mapUrl}`
        return (
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden relative" style={{ minHeight: '300px' }}>
            <MapGate className="absolute inset-0">
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 z-10 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 text-sm font-medium"
              style={{ color: "#3E1718" }}
            >
              <MapPin className="h-4 w-4" style={{ color: "#6E2E2A" }} />
              In Google Maps öffnen
            </a>
            <iframe
              src={embedSrc}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '300px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa lokalizacji"
              className="absolute inset-0"
            />
            </MapGate>
          </div>
        )
      })() : null}

      {!hideItems && hasItems && <LocationItemsGrid items={section.items} />}
    </div>
  )
}

export function DynamicTwoColumnSection({
  section,
  imagePosition = "right",
  dualImage = false,
  showCta = false,
  mapRight = false,
  projectMap,
}: {
  section: SectionData
  imagePosition?: "left" | "right"
  dualImage?: boolean
  showCta?: boolean
  mapRight?: boolean
  projectMap?: ProjectMapContext
}) {
  const hasImage = section.imageUrl
  const hasItems = section.items.length > 0

  // Alternate the soft radial accent corner so adjacent sections have gentle rhythm
  const accentTopLeft = imagePosition === "right"
  const LayeredBg = () => (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F4] via-[#FAF9F7] to-[#F5F2EF]" />
      <div
        className="absolute w-1/2 h-full opacity-[0.035] pointer-events-none"
        style={{
          ...(accentTopLeft
            ? { top: 0, left: 0, background: "radial-gradient(ellipse at 0% 0%, #6E2E2A 0%, transparent 70%)" }
            : { bottom: 0, right: 0, background: "radial-gradient(ellipse at 100% 100%, #6E2E2A 0%, transparent 70%)" }),
        }}
      />
    </>
  )

  // Lokalizacja layout: label+heading full-width, then description left / map+items right
  if (mapRight) {
    return (
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <LayeredBg />
        <div className="container mx-auto px-4 lg:px-8 relative">
          {/* Label + heading span full width */}
          {(section.label || section.heading) && (
            <div className="mb-8">
              {section.label && (
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4"
                  style={{ backgroundColor: "rgba(110,46,42,0.1)", color: "#6E2E2A" }}
                >
                  {section.label}
                </span>
              )}
              {section.heading && (
                <h2
                  className="font-serif text-3xl lg:text-4xl font-semibold"
                  style={{ color: "#3E1718" }}
                >
                  {section.heading}
                </h2>
              )}
            </div>
          )}

          {/* Description + items left, map right */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="space-y-8">
              {section.description && (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.description}
                </p>
              )}
              <LocationItemsGrid items={section.items} />
            </div>
            <MapContent section={section} projectMap={projectMap} hideItems />
          </div>
        </div>
      </section>
    )
  }

  const textContent = (
    <div className={imagePosition === "left" ? "order-1 lg:order-2" : ""}>
      {section.label && (
        <span
          className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4"
          style={{
            backgroundColor: "rgba(110,46,42,0.1)",
            color: "#6E2E2A",
          }}
        >
          {section.label}
        </span>
      )}
      {section.heading && (
        <h2
          className="font-serif text-3xl lg:text-4xl font-semibold mb-6"
          style={{ color: "#3E1718" }}
        >
          {section.heading}
        </h2>
      )}
      {section.description && (
        <p className="text-muted-foreground mb-6 leading-relaxed whitespace-pre-line">
          {section.description}
        </p>
      )}

      {section.mapUrl && (() => {
        const query = extractMapQuery(section.mapUrl)
        const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
        const mapHref = section.mapUrl.match(/^https?:\/\//) ? section.mapUrl : `https://${section.mapUrl}`
        return (
          <div className="mb-8">
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden relative" style={{ minHeight: '300px' }}>
              <MapGate className="absolute inset-0">
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-4 z-10 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 text-sm font-medium"
                style={{ color: "#3E1718" }}
              >
                <MapPin className="h-4 w-4" style={{ color: "#6E2E2A" }} />
                In Google Maps öffnen
              </a>
              <iframe
                src={embedSrc}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '300px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa lokalizacji"
                className="absolute inset-0"
              />
              </MapGate>
            </div>
          </div>
        )
      })()}

      {hasItems && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {section.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50"
            >
              <SectionIcon
                name={item.icon || "MapPin"}
                className="w-5 h-5 mt-0.5"
                style={{ color: "#6E2E2A" }}
              />
              <div>
                <p
                  className="font-medium text-sm"
                  style={{ color: "#3E1718" }}
                >
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                )}
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCta && (
        <a
          href="#kontakt"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors mt-6"
          style={{ backgroundColor: "#6E2E2A", color: "white" }}
        >
          Napisz do nas
        </a>
      )}
    </div>
  )

  const imageContent = dualImage ? (
    <div
      className={`grid grid-cols-2 gap-4 ${imagePosition === "left" ? "order-2 lg:order-1" : ""}`}
    >
      {section.imageUrl && (
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
          <Image
            src={section.imageUrl}
            alt={resolveAlt(section.heading, sectionAlt(section.label ?? "", section.imageUrl))}
            fill
            className="object-cover"
          />
        </div>
      )}
      {section.imageUrl2 && (
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden mt-8">
          <Image
            src={section.imageUrl2}
            alt={resolveAlt(section.heading, sectionAlt(section.label ?? "", section.imageUrl2))}
            fill
            className="object-cover"
          />
        </div>
      )}
    </div>
  ) : hasImage ? (
    <div
      className={`relative aspect-[4/3] rounded-xl overflow-hidden ${imagePosition === "left" ? "order-2 lg:order-1" : ""}`}
    >
      <Image
        src={section.imageUrl!}
        alt={resolveAlt(section.heading, sectionAlt(section.label ?? "", section.imageUrl!))}
        fill
        className="object-cover"
      />
    </div>
  ) : null

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      <LayeredBg />
      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {imagePosition === "left" ? (
            <>
              {imageContent}
              {textContent}
            </>
          ) : (
            <>
              {textContent}
              {imageContent}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
