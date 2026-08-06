"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps"
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { MapGate } from "@/components/map-gate"

export type CityConfig = {
  name: string
  slug: string
  centerLat: number
  centerLng: number
  zoom: number
}

export type ProjectPoint = {
  id: string
  name: string
  slug: string
  citySlug: string
  href: string
  lat: number | null
  lng: number | null
  address: string | null
  imageUrl: string | null
  location: string
  heroSubtitle: string | null
  description: string | null
  status: string
  availableCount: number
  totalCount: number
  keyFeatures: { title: string; subtitle: string | null }[]
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Im Verkauf", color: "#16a34a" },
  planned: { label: "Demnächst", color: "#666" },
  completed: { label: "Abgeschlossen", color: "#9ca3af" },
}

export function CityMap({
  apiKey,
  mapId,
  cities,
  points,
  lockedCitySlug,
}: {
  apiKey: string | null
  mapId?: string
  cities: CityConfig[]
  points: ProjectPoint[]
  /** When set, hide the city tabs and lock the map+list to this one city. */
  lockedCitySlug?: string
}) {
  const initialCity = lockedCitySlug ?? cities[0]?.slug ?? ""
  const [activeCity, setActiveCity] = useState<string>(initialCity)
  const [openId, setOpenId] = useState<string | null>(null)

  const activeConfig = cities.find((c) => c.slug === activeCity)
  const filtered = points.filter((p) => p.citySlug === activeCity)
  const markers = filtered.filter((p) => p.lat != null && p.lng != null)
  const center = activeConfig
    ? { lat: activeConfig.centerLat, lng: activeConfig.centerLng }
    : { lat: 52.0693, lng: 19.4803 }
  const zoom = activeConfig?.zoom ?? 11
  const cityLabel = activeConfig?.name ?? ""

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(false)

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return
    setShowLeftButton(container.scrollLeft > 0)
    setShowRightButton(container.scrollLeft < container.scrollWidth - container.clientWidth - 10)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    container.addEventListener("scroll", checkScroll)
    checkScroll()
    return () => container.removeEventListener("scroll", checkScroll)
  }, [filtered.length])

  // Reset scroll + recompute arrow state when city changes
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    container.scrollTo({ left: 0, behavior: "auto" })
    checkScroll()
  }, [activeCity])

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return
    container.scrollBy({ left: direction === "left" ? -340 : 340, behavior: "smooth" })
  }

  const showTabs = !lockedCitySlug && cities.length > 1

  return (
    <>
      {/* City tabs */}
      {showTabs && (
        <div className="flex gap-2 mb-8 flex-wrap">
          {cities.map((city) => {
            const count = points.filter((p) => p.citySlug === city.slug).length
            return (
              <button
                key={city.slug}
                onClick={() => {
                  setActiveCity(city.slug)
                  setOpenId(null)
                }}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCity === city.slug
                    ? "text-white shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={activeCity === city.slug ? { backgroundColor: "rgba(74, 42, 42, 0.85)" } : undefined}
              >
                {city.name}
                {count > 0 && (
                  <span className="ml-2 opacity-70 text-xs">({count})</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Map */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm bg-muted"
        style={{ height: "60vh", minHeight: 400 }}
      >
        {apiKey ? (
          <MapGate className="absolute inset-0">
          <APIProvider apiKey={apiKey}>
            <Map
              key={activeCity}
              mapId={mapId}
              defaultCenter={center}
              defaultZoom={zoom}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
            >
              {markers.map((p) => (
                <AdvancedMarker
                  key={p.id}
                  position={{ lat: p.lat as number, lng: p.lng as number }}
                  onClick={() => setOpenId(p.id)}
                  title={p.name}
                />
              ))}
              {openId && (() => {
                const p = markers.find((x) => x.id === openId)
                if (!p) return null
                return (
                  <InfoWindow
                    position={{ lat: p.lat as number, lng: p.lng as number }}
                    onCloseClick={() => setOpenId(null)}
                    pixelOffset={[0, -40]}
                  >
                    <div className="p-1 min-w-[180px]">
                      <p className="font-serif font-semibold text-base mb-1" style={{ color: "#3E1718" }}>
                        {p.name}
                      </p>
                      {p.address && (
                        <p className="text-xs text-muted-foreground mb-2">{p.address}</p>
                      )}
                      <Link
                        href={p.href}
                        className="text-xs font-medium underline"
                        style={{ color: "#6E2E2A" }}
                      >
                        Projekt ansehen →
                      </Link>
                    </div>
                  </InfoWindow>
                )
              })()}
            </Map>
          </APIProvider>
          </MapGate>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">
                Die Karte wird nach Hinzufügen des Google-Maps-API-Schlüssels angezeigt
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Setzen Sie NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in den Umgebungsvariablen
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Project list for active city */}
      {filtered.length > 0 ? (
        <div className="relative mt-12">
          {showLeftButton && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-border/20"
              aria-label="Vorheriges Projekt"
            >
              <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7 text-[#3E1718]" />
            </button>
          )}
          {showRightButton && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-border/20"
              aria-label="Nächstes Projekt"
            >
              <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7 text-[#3E1718]" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filtered.map((p) => {
              const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.active
              return (
                <Link
                  key={p.id}
                  href={p.href}
                  className="flex-shrink-0 w-[85vw] sm:w-[360px] lg:w-[380px] group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                        Kein Bild
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span
                        className="text-[11px] font-medium px-3 py-1.5 rounded-full shadow-sm"
                        style={{
                          backgroundColor: statusInfo.color,
                          color: "rgba(255, 255, 255, 0.95)",
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3
                      className="font-serif text-xl font-semibold mb-1"
                      style={{ color: "#3E1718" }}
                    >
                      {p.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.location}
                    </p>

                    <p
                      className="text-xs font-medium mb-4"
                      style={{ color: "#5A2A1C" }}
                    >
                      Verfügbar: {p.availableCount} / {p.totalCount}
                    </p>

                    {p.keyFeatures.length > 0 ? (
                      <ul className="mb-6 flex-grow space-y-1.5">
                        {p.keyFeatures.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#6E2E2A" }} />
                            <span>
                              <span className="font-medium" style={{ color: "#3E1718" }}>{f.title}</span>
                              {f.subtitle && <span className="text-muted-foreground"> — {f.subtitle}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : p.description ? (
                      <p className="text-sm text-muted-foreground mb-6 flex-grow line-clamp-3">
                        {p.description}
                      </p>
                    ) : null}

                    <span
                      className="inline-block w-full text-center text-sm font-medium px-5 py-3 rounded-lg transition-all duration-300 group-hover:opacity-90 mt-auto"
                      style={{
                        backgroundColor: "#6E2E2A",
                        color: "rgba(255, 255, 255, 0.95)",
                      }}
                    >
                      Projekt ansehen
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground text-sm">
          Keine Projekte im Verkauf{cityLabel ? ` für: ${cityLabel}` : ""}.
        </p>
      )}
    </>
  )
}
