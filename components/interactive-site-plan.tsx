'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

type Unit = {
  id: string
  svgElementId: string
  label: string
  status: string
  area: number | null
  rooms: number | null
  floors: number | null
  price: number | null
  description: string | null
}

type ProjectData = {
  svgContent: string | null
  units: Unit[]
}

const STATUS_CONFIG = {
  available: {
    label: 'Dostępna',
    fill: '#22c55e',
    stroke: '#16a34a',
    bg: 'bg-green-100',
    text: 'text-green-800',
  },
  reserved: {
    label: 'Rezerwacja',
    fill: '#eab308',
    stroke: '#ca8a04',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
  },
  sold: {
    label: 'Sprzedana',
    fill: '#ef4444',
    stroke: '#dc2626',
    bg: 'bg-red-100',
    text: 'text-red-800',
  },
}

type StatusKey = keyof typeof STATUS_CONFIG

function formatPrice(price: number | null): string {
  if (!price) return 'Cena na zapytanie'
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(price)
}

export function InteractiveSitePlan({ slug }: { slug: string }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; unit: Unit } | null>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${slug}/units`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  const getUnitForElement = useCallback(
    (elementId: string) => data?.units.find((u) => u.svgElementId === elementId),
    [data]
  )

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as SVGElement
      const id = target.id || (target.parentElement as SVGElement | null)?.id
      if (!id) return
      const unit = getUnitForElement(id)
      if (unit) {
        setSelectedUnit((prev) => (prev?.id === unit.id ? null : unit))
      }
    },
    [getUnitForElement]
  )

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as SVGElement
      const id = target.id || (target.parentElement as SVGElement | null)?.id
      if (!id) {
        setHoveredUnit(null)
        setTooltip(null)
        return
      }
      const unit = getUnitForElement(id)
      if (unit) {
        setHoveredUnit(unit.svgElementId)
        const rect = svgContainerRef.current?.getBoundingClientRect()
        if (rect) {
          setTooltip({
            x: e.clientX - rect.left + 10,
            y: e.clientY - rect.top - 10,
            unit,
          })
        }
      } else {
        setHoveredUnit(null)
        setTooltip(null)
      }
    },
    [getUnitForElement]
  )

  const coloredSvg = useCallback((): string => {
    if (!data?.svgContent) return ''

    const styles = data.units
      .map((unit) => {
        const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
        const isFiltered = filter !== null && filter !== unit.status
        const isHovered = hoveredUnit === unit.svgElementId
        const isSelected = selectedUnit?.id === unit.id

        const fill = isFiltered ? '#e5e7eb' : cfg.fill
        const opacity = isFiltered ? '0.3' : isSelected ? '1' : isHovered ? '0.85' : '0.7'
        const strokeWidth = isSelected || isHovered ? '3' : '1.5'
        const stroke = isFiltered ? '#9ca3af' : cfg.stroke

        return `#${CSS.escape(unit.svgElementId)} { fill: ${fill}; fill-opacity: ${opacity}; stroke: ${stroke}; stroke-width: ${strokeWidth}px; cursor: pointer; transition: fill 0.15s, fill-opacity 0.15s; }`
      })
      .join('\n')

    const styleBlock = `<style>${styles}</style>`
    // Inject style block right after the opening <svg ...> tag
    return data.svgContent
      .replace(/(<svg[^>]*>)/, `$1${styleBlock}`)
      .replace(/<svg([^>]*)>/, `<svg$1 style="width:100%;height:auto">`)
  }, [data, filter, hoveredUnit, selectedUnit])

  const filteredUnits = data?.units.filter((u) => !filter || u.status === filter) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Ładowanie planu...</div>
      </div>
    )
  }

  if (!data?.svgContent) {
    return (
      <div className="text-center py-20 text-gray-400">
        Plan zagospodarowania nie jest jeszcze dostępny.
      </div>
    )
  }

  const counts = {
    available: data.units.filter((u) => u.status === 'available').length,
    reserved: data.units.filter((u) => u.status === 'reserved').length,
    sold: data.units.filter((u) => u.status === 'sold').length,
  }

  return (
    <div className="w-full">
      {/* Legend & Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={filter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(null)}
          style={filter === null ? { backgroundColor: '#6E2E2A' } : {}}
        >
          Wszystkie ({data.units.length})
        </Button>
        {(Object.entries(STATUS_CONFIG) as [StatusKey, (typeof STATUS_CONFIG)[StatusKey]][]).map(
          ([status, cfg]) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filter === status ? null : status)}
              style={
                filter === status
                  ? { backgroundColor: cfg.fill, borderColor: cfg.stroke, color: '#fff' }
                  : { borderColor: cfg.fill, color: cfg.stroke }
              }
            >
              <span
                className="w-2 h-2 rounded-full mr-1.5 inline-block"
                style={{ backgroundColor: cfg.fill }}
              />
              {cfg.label} ({counts[status as keyof typeof counts]})
            </Button>
          )
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* SVG Map */}
        <div className="flex-1 relative">
          <div
            ref={svgContainerRef}
            className="relative border rounded-xl overflow-hidden bg-gray-50"
            onClick={handleSvgClick}
            onMouseMove={handleSvgMouseMove}
            onMouseLeave={() => {
              setHoveredUnit(null)
              setTooltip(null)
            }}
            dangerouslySetInnerHTML={{ __html: coloredSvg() }}
            style={{ width: '100%' }}
          />

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none text-sm"
              style={{ left: tooltip.x, top: tooltip.y, maxWidth: 200 }}
            >
              <div className="font-semibold">{tooltip.unit.label}</div>
              {tooltip.unit.area && (
                <div className="text-gray-500">{tooltip.unit.area} m²</div>
              )}
              {tooltip.unit.rooms && (
                <div className="text-gray-500">{tooltip.unit.rooms} pok.</div>
              )}
              <div
                className={`mt-1 text-xs font-medium ${
                  STATUS_CONFIG[tooltip.unit.status as StatusKey]?.text || ''
                }`}
              >
                {STATUS_CONFIG[tooltip.unit.status as StatusKey]?.label ||
                  tooltip.unit.status}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 flex flex-col gap-3">
          {/* Selected unit detail */}
          {selectedUnit && (
            <div className="border-2 rounded-xl p-4" style={{ borderColor: '#6E2E2A' }}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-serif font-semibold">{selectedUnit.label}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    STATUS_CONFIG[selectedUnit.status as StatusKey]?.bg
                  } ${STATUS_CONFIG[selectedUnit.status as StatusKey]?.text}`}
                >
                  {STATUS_CONFIG[selectedUnit.status as StatusKey]?.label}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm mb-4">
                {selectedUnit.area && (
                  <>
                    <dt className="text-gray-500">Powierzchnia</dt>
                    <dd className="font-medium">{selectedUnit.area} m²</dd>
                  </>
                )}
                {selectedUnit.rooms && (
                  <>
                    <dt className="text-gray-500">Pokoje</dt>
                    <dd className="font-medium">{selectedUnit.rooms}</dd>
                  </>
                )}
                {selectedUnit.floors && (
                  <>
                    <dt className="text-gray-500">Piętra</dt>
                    <dd className="font-medium">{selectedUnit.floors}</dd>
                  </>
                )}
                {selectedUnit.price && selectedUnit.status !== 'sold' && (
                  <>
                    <dt className="text-gray-500">Cena</dt>
                    <dd className="font-medium text-base" style={{ color: '#6E2E2A' }}>
                      {formatPrice(selectedUnit.price)}
                    </dd>
                  </>
                )}
              </dl>
              {selectedUnit.description && (
                <p className="text-sm text-gray-600 mb-4">{selectedUnit.description}</p>
              )}
              {selectedUnit.status === 'available' && (
                <a
                  href={`mailto:kontakt@jednopietrowawarszawa.pl?subject=Zapytanie o działkę ${selectedUnit.label}`}
                >
                  <Button className="w-full" style={{ backgroundColor: '#6E2E2A' }}>
                    <Mail className="h-4 w-4 mr-2" />
                    Zapytaj o tę działkę
                  </Button>
                </a>
              )}
            </div>
          )}

          {/* Unit list */}
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-700">
                {filter
                  ? `${STATUS_CONFIG[filter as StatusKey]?.label} (${filteredUnits.length})`
                  : `Wszystkie działki (${filteredUnits.length})`}
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y">
              {filteredUnits.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                  Brak działek
                </div>
              ) : (
                filteredUnits.map((unit) => {
                  const cfg =
                    STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
                  return (
                    <button
                      key={unit.id}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        selectedUnit?.id === unit.id ? 'bg-amber-50' : ''
                      }`}
                      onClick={() =>
                        setSelectedUnit((prev) =>
                          prev?.id === unit.id ? null : unit
                        )
                      }
                    >
                      <div>
                        <span className="font-medium text-sm">{unit.label}</span>
                        {unit.area && (
                          <span className="ml-2 text-xs text-gray-500">
                            {unit.area} m²
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unit.price && unit.status !== 'sold' && (
                          <span className="text-xs text-gray-600">
                            {formatPrice(unit.price)}
                          </span>
                        )}
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cfg.fill }}
                        />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
