"use client"

import { useState, useMemo } from "react"
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from "@vis.gl/react-google-maps"
import { MapPin } from "lucide-react"
import { SectionIcon } from "./icon-map"
import { extractLatLng } from "./extract-lat-lng"

export type LocationItem = {
  id: string
  icon: string | null
  title: string
  subtitle: string | null
  description: string | null
  mapUrl: string | null
}

type Props = {
  apiKey: string | null
  mapId?: string
  projectName: string
  projectLat: number | null
  projectLng: number | null
  items: LocationItem[]
}

function normalizeHref(url: string): string {
  return url.match(/^https?:\/\//) ? url : `https://${url}`
}

export function ProjectLocationMap({ apiKey, mapId, projectName, projectLat, projectLng, items }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  const pins = useMemo(
    () =>
      items
        .map((it) => ({ item: it, coords: extractLatLng(it.mapUrl) }))
        .filter((p): p is { item: LocationItem; coords: { lat: number; lng: number } } => p.coords != null),
    [items]
  )

  const PROJECT_ID = "__project__"
  const center = projectLat != null && projectLng != null ? { lat: projectLat, lng: projectLng } : null

  if (!apiKey || !center) {
    return null
  }

  const openItem = openId && openId !== PROJECT_ID ? pins.find((p) => p.item.id === openId)?.item : null
  const openItemCoords = openId && openId !== PROJECT_ID ? pins.find((p) => p.item.id === openId)?.coords : null

  // Compute bounds so the project + all item pins are visible on first render.
  // Add a small margin so markers aren't flush against the viewport edge.
  const bounds = (() => {
    if (pins.length === 0) return null
    const lats = [center.lat, ...pins.map((p) => p.coords.lat)]
    const lngs = [center.lng, ...pins.map((p) => p.coords.lng)]
    const padLat = 0.015
    const padLng = 0.025
    return {
      north: Math.max(...lats) + padLat,
      south: Math.min(...lats) - padLat,
      east: Math.max(...lngs) + padLng,
      west: Math.min(...lngs) - padLng,
    }
  })()

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-border/60 shadow-sm bg-muted"
      style={{ minHeight: 360, height: "55vh" }}
    >
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={mapId}
          {...(bounds
            ? { defaultBounds: bounds }
            : { defaultCenter: center, defaultZoom: 14 })}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          <AdvancedMarker
            position={center}
            onClick={() => setOpenId(PROJECT_ID)}
            title={projectName}
          >
            <Pin background="#6E2E2A" borderColor="#3E1718" glyphColor="#ffffff" scale={1.2} />
          </AdvancedMarker>

          {pins.map(({ item, coords }) => (
            <AdvancedMarker
              key={item.id}
              position={coords}
              onClick={() => setOpenId(item.id)}
              title={item.title}
            >
              <div
                className="flex items-center justify-center rounded-full shadow-md"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#ffffff",
                  border: "2px solid #6E2E2A",
                }}
              >
                <SectionIcon
                  name={item.icon || "MapPin"}
                  className="w-4 h-4"
                  style={{ color: "#6E2E2A" }}
                />
              </div>
            </AdvancedMarker>
          ))}

          {openId === PROJECT_ID && (
            <InfoWindow position={center} onCloseClick={() => setOpenId(null)} pixelOffset={[0, -40]}>
              <div className="p-1 min-w-[160px]">
                <p className="font-serif font-semibold text-sm" style={{ color: "#3E1718" }}>
                  {projectName}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Projektstandort</p>
              </div>
            </InfoWindow>
          )}

          {openItem && openItemCoords && (
            <InfoWindow position={openItemCoords} onCloseClick={() => setOpenId(null)} pixelOffset={[0, -40]}>
              <div className="p-1 min-w-[180px] max-w-[240px]">
                <div className="flex items-start gap-2">
                  <SectionIcon
                    name={openItem.icon || "MapPin"}
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "#6E2E2A" }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-tight" style={{ color: "#3E1718" }}>
                      {openItem.title}
                    </p>
                    {openItem.subtitle && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{openItem.subtitle}</p>
                    )}
                    {openItem.description && (
                      <p className="text-[11px] text-muted-foreground mt-1">{openItem.description}</p>
                    )}
                    {openItem.mapUrl && (
                      <a
                        href={normalizeHref(openItem.mapUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium underline"
                        style={{ color: "#6E2E2A" }}
                      >
                        <MapPin className="h-3 w-3" />
                        In Google Maps öffnen
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  )
}
