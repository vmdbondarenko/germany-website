'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, MapPin, Home, Ruler, Trees, Phone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { schemeAlt } from '@/lib/seo/image-alt'

interface Unit {
  id: string
  svgElementId: string
  label: string
  status: 'available' | 'reserved' | 'sold'
  stage: string | null
  area: number | null
  gardenArea: number | null
  floor: string | null
  rooms: number | null
  floors: number | null
  price: number | null
  description: string | null
  houseType: {
    id: string
    name: string
    totalArea: number | null
  } | null
}

interface SchemaData {
  svgContent: string | null
  planImageUrl: string | null
  units: Unit[]
}

interface InvestmentSchemaViewerProps {
  slug: string
  projectName: string
}

const STATUS_COLOR: Record<string, string> = {
  available: '#86efac',
  reserved: '#fde047',
  sold: '#f87171',
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Verfügbar',
  reserved: 'Reserviert',
  sold: 'Verkauft',
}

function centroid(pts: { x: number; y: number }[]) {
  let sx = 0, sy = 0
  for (const p of pts) { sx += p.x; sy += p.y }
  return { x: sx / pts.length, y: sy / pts.length }
}

function parseSvgPolygons(svgContent: string): { id: string; points: { x: number; y: number }[] }[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgContent, 'image/svg+xml')
  const polygons = doc.querySelectorAll('polygon')
  const result: { id: string; points: { x: number; y: number }[] }[] = []

  polygons.forEach(poly => {
    const id = poly.getAttribute('data-id') || poly.getAttribute('id') || ''
    const pointsStr = poly.getAttribute('points') || ''
    const points = pointsStr.split(/\s+/).filter(Boolean).map(p => {
      const [x, y] = p.split(',').map(Number)
      return { x, y }
    }).filter(p => !isNaN(p.x) && !isNaN(p.y))

    if (id && points.length >= 3) {
      result.push({ id, points })
    }
  })

  return result
}

export function InvestmentSchemaViewer({ slug, projectName }: InvestmentSchemaViewerProps) {
  const [data, setData] = useState<SchemaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [hoveredUnit, setHoveredUnit] = useState<Unit | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [polygons, setPolygons] = useState<{ id: string; points: { x: number; y: number }[] }[]>([])

  const isPanning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/projects/${slug}/units`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setData(json)

        if (json.svgContent) {
          setPolygons(parseSvgPolygons(json.svgContent))
        }
      } catch (e) {
        console.error(e)
        setError('Schema konnte nicht geladen werden')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  useEffect(() => {
    if (!data?.planImageUrl) return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = data.planImageUrl
  }, [data?.planImageUrl])

  const fitImage = useCallback(() => {
    if (!containerRef.current || !imgSize) return
    const rect = containerRef.current.getBoundingClientRect()
    const scaleX = (rect.width - 40) / imgSize.w
    const scaleY = (rect.height - 40) / imgSize.h
    const scale = Math.min(scaleX, scaleY, 1)
    setZoom(scale)
    setPan({
      x: (rect.width - imgSize.w * scale) / 2,
      y: (rect.height - imgSize.h * scale) / 2,
    })
  }, [imgSize])

  useEffect(() => {
    if (imgSize) fitImage()
  }, [imgSize, fitImage])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    const nz = Math.min(Math.max(zoom * factor, 0.1), 5)
    const ratio = nz / zoom
    setZoom(nz)
    setPan(p => ({
      x: mx - ratio * (mx - p.x),
      y: my - ratio * (my - p.y),
    }))
  }, [zoom])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault()
      isPanning.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      lastMouse.current = { x: e.clientX, y: e.clientY }
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
    }
  }, [])

  const onMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  const zoomAround = useCallback((factor: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const nz = Math.min(Math.max(zoom * factor, 0.1), 5)
    const ratio = nz / zoom
    setZoom(nz)
    setPan(p => ({
      x: cx - ratio * (cx - p.x),
      y: cy - ratio * (cy - p.y),
    }))
  }, [zoom])

  const getUnitForPolygon = useCallback((polyId: string) => {
    if (!data) return null
    return data.units.find(u => u.svgElementId === polyId) || null
  }, [data])

  const iz = 1 / zoom

  if (loading) {
    return (
      <section className="py-16 lg:py-24 bg-[#faf9f7]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse text-[#6E2E2A]">Schema wird geladen …</div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !data?.planImageUrl) {
    return null
  }

  return (
    <section className="py-16 lg:py-24 bg-[#faf9f7]">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4"
            style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)', color: '#6E2E2A' }}
          >
            Plan Osiedla
          </span>
          <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-[#3E1718] mb-4">
            Projektschema
          </h2>
          <p className="text-[#3E1718]/70 max-w-2xl mx-auto">
            Klicken Sie auf ein Grundstück, um Details zu sehen. Halten Sie die Umschalttaste gedrückt und ziehen Sie, oder nutzen Sie das Mausrad, um den Plan zu vergrößern/verkleinern.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {Object.entries(STATUS_LABEL).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: STATUS_COLOR[key] }}
              />
              <span className="text-sm text-[#3E1718]/80">{label}</span>
            </div>
          ))}
        </div>

        {/* Schema Viewer */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#6E2E2A]/10">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#faf9f7] border-b border-[#6E2E2A]/10">
            <span className="text-sm font-medium text-[#3E1718]">{projectName}</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => zoomAround(1.25)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[#3E1718]/60 tabular-nums w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => zoomAround(0.8)}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={fitImage} title="Dopasuj">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex">
            <div
              ref={containerRef}
              className="flex-1 relative overflow-hidden bg-[#e8e8e8] select-none"
              style={{
                height: '500px',
                cursor: isPanning.current ? 'grabbing' : 'grab'
              }}
              onWheel={onWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <div
                style={{
                  position: 'absolute',
                  transformOrigin: '0 0',
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              >
                {data.planImageUrl && imgSize && (
                  <>
                    <img
                      src={data.planImageUrl}
                      alt={schemeAlt(projectName, data.planImageUrl)}
                      width={imgSize.w}
                      height={imgSize.h}
                      style={{ display: 'block', width: imgSize.w, height: imgSize.h, maxWidth: 'none' }}
                      draggable={false}
                    />
                    <svg
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: imgSize.w,
                        height: imgSize.h,
                        overflow: 'visible',
                      }}
                    >
                      {polygons.map(poly => {
                        const unit = getUnitForPolygon(poly.id)
                        if (!unit) return null

                        const pts = poly.points.map(p => `${p.x},${p.y}`).join(' ')
                        const color = STATUS_COLOR[unit.status] || '#888'
                        const isHovered = hoveredUnit?.id === unit.id
                        const isSelected = selectedUnit?.id === unit.id
                        const opacity = (isHovered || isSelected) ? 0.55 : 0.45
                        const c = centroid(poly.points)

                        return (
                          <g
                            key={poly.id}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredUnit(unit)}
                            onMouseLeave={() => setHoveredUnit(null)}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedUnit(unit)
                            }}
                          >
                            <polygon
                              points={pts}
                              fill={color}
                              fillOpacity={opacity}
                              stroke="none"
                            />
                            <text
                              x={c.x}
                              y={c.y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize={13 * iz}
                              fontWeight="700"
                              fill="#fff"
                              stroke="rgba(0,0,0,0.6)"
                              strokeWidth={3 * iz}
                              paintOrder="stroke"
                              style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}
                            >
                              {unit.label}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </>
                )}
              </div>

              {/* Hover tooltip */}
              {hoveredUnit && !selectedUnit && (
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm pointer-events-none">
                  <div className="font-semibold text-[#3E1718]">{hoveredUnit.label}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[hoveredUnit.status] }}
                    />
                    <span className="text-[#3E1718]/70">{STATUS_LABEL[hoveredUnit.status]}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected unit details sidebar */}
            {selectedUnit && (
              <div className="w-80 bg-white border-l border-[#6E2E2A]/10 flex flex-col">
                <div className="px-4 py-3 border-b border-[#6E2E2A]/10 flex items-center justify-between bg-[#faf9f7]">
                  <span className="font-semibold text-[#3E1718]">{selectedUnit.label}</span>
                  <button
                    onClick={() => setSelectedUnit(null)}
                    className="text-[#3E1718]/50 hover:text-[#3E1718] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: STATUS_COLOR[selectedUnit.status] }}
                    >
                      {STATUS_LABEL[selectedUnit.status]}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedUnit.houseType && (
                      <div className="flex items-start gap-3">
                        <Home className="h-5 w-5 text-[#6E2E2A] mt-0.5" />
                        <div>
                          <div className="text-xs text-[#3E1718]/50 uppercase tracking-wide">Typ domu</div>
                          <div className="font-medium text-[#3E1718]">{selectedUnit.houseType.name}</div>
                        </div>
                      </div>
                    )}

                    {selectedUnit.area && (
                      <div className="flex items-start gap-3">
                        <Ruler className="h-5 w-5 text-[#6E2E2A] mt-0.5" />
                        <div>
                          <div className="text-xs text-[#3E1718]/50 uppercase tracking-wide">Fläche</div>
                          <div className="font-medium text-[#3E1718]">{selectedUnit.area} m²</div>
                        </div>
                      </div>
                    )}

                    {selectedUnit.gardenArea && (
                      <div className="flex items-start gap-3">
                        <Trees className="h-5 w-5 text-[#6E2E2A] mt-0.5" />
                        <div>
                          <div className="text-xs text-[#3E1718]/50 uppercase tracking-wide">Garten</div>
                          <div className="font-medium text-[#3E1718]">{selectedUnit.gardenArea} m²</div>
                        </div>
                      </div>
                    )}

                    {selectedUnit.rooms && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-[#6E2E2A] mt-0.5" />
                        <div>
                          <div className="text-xs text-[#3E1718]/50 uppercase tracking-wide">Zimmer</div>
                          <div className="font-medium text-[#3E1718]">{selectedUnit.rooms}</div>
                        </div>
                      </div>
                    )}

                    {selectedUnit.floors && (
                      <div className="flex items-start gap-3">
                        <Home className="h-5 w-5 text-[#6E2E2A] mt-0.5" />
                        <div>
                          <div className="text-xs text-[#3E1718]/50 uppercase tracking-wide">Etagen</div>
                          <div className="font-medium text-[#3E1718]">{selectedUnit.floors}</div>
                        </div>
                      </div>
                    )}

                    {selectedUnit.price && selectedUnit.status === 'available' && (
                      <div className="pt-2 border-t border-[#6E2E2A]/10">
                        <div className="text-xs text-[#3E1718]/50 uppercase tracking-wide mb-1">Preis</div>
                        <div className="text-2xl font-semibold text-[#6E2E2A]">
                          {selectedUnit.price.toLocaleString('pl-PL')} PLN
                        </div>
                      </div>
                    )}

                    {selectedUnit.description && (
                      <div className="pt-2 border-t border-[#6E2E2A]/10">
                        <div className="text-xs text-[#3E1718]/50 uppercase tracking-wide mb-1">Opis</div>
                        <div className="text-sm text-[#3E1718]/80">{selectedUnit.description}</div>
                      </div>
                    )}
                  </div>

                  {selectedUnit.status === 'available' && (
                    <div className="pt-4">
                      <Link
                        href="/#kontakt"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
                        style={{ backgroundColor: '#6E2E2A' }}
                      >
                        <Phone className="h-4 w-4" />
                        Dieses Grundstück anfragen
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
