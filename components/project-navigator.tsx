'use client'

import { Fragment, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Mail, ArrowUpDown, ArrowUp, ArrowDown, X, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, FileDown, History } from 'lucide-react'
import { ContactModal } from '@/components/contact-modal'
import { PdfModal } from '@/components/pdf-modal'
import { PriceHistoryModal } from '@/components/price-history-modal'
import { resolveAlt, houseTypeAlt, sitePlanAlt } from '@/lib/seo/image-alt'

// Plan/floor images are admin-supplied (no dimensions stored in the DB), so we
// stamp the loaded bitmap's intrinsic size onto the element to give it explicit
// width/height. CSS (w-full/h-full/object-contain inside aspect-ratio
// containers) still governs the rendered size, so layout is unchanged.
function applyIntrinsicSize(e: { currentTarget: HTMLImageElement }) {
  const img = e.currentTarget
  if (img.naturalWidth && img.naturalHeight) {
    img.width = img.naturalWidth
    img.height = img.naturalHeight
  }
}

type Room = { id: string; name: string; area: number | null; number: number | null }
type FloorPlan = {
  id: string; name: string; area: number | null
  image3dUrl: string | null; image2dUrl: string | null; rooms: Room[]
}
type HouseType = {
  id: string; name: string; totalArea: number | null; floorPlans: FloorPlan[]
}
type PriceHistoryEntry = {
  id: string; date: string; totalPrice: number | null; pricePerSqm: number | null
  parkingPrice: number | null; storagePrice: number | null
  rightsPrice: number | null; otherPrice: number | null
}
type Unit = {
  id: string; svgElementId: string; label: string; status: string
  stage: string | null; area: number | null; gardenArea: number | null
  floor: string | null; rooms: number | null; floors: number | null
  price: number | null; description: string | null
  parkingPrice: number | null; storagePrice: number | null
  rightsPrice: number | null; otherPrice: number | null
  houseType: HouseType | null
  priceHistory?: PriceHistoryEntry[]
  updatedAt?: string | null
}

// Per-unit PDF URL with a content-versioned cache buster. The CDN keys its
// cache on the URL, so when a unit's data changes the new timestamp produces
// a fresh URL and the stale PDF is bypassed automatically.
function pdfUrl(slug: string, unit: { id: string; updatedAt?: string | null }): string {
  const ts = unit.updatedAt ? new Date(unit.updatedAt).getTime() : null
  const base = `/api/projects/${slug}/units/${unit.id}/pdf`
  return ts ? `${base}?v=${ts}` : base
}
type DotOverride = { unitId: string; dotX: number; dotY: number }
type ProjectData = {
  svgContent: string | null; planImageUrl: string | null
  northAngle: number | null
  units: Unit[]; houseTypes: HouseType[]
  dotOverrides: DotOverride[]
}

type PlanViewItem = {
  id: string; name: string; imageUrl: string | null; svgContent: string | null; order: number
  northAngle: number | null
  dotOverrides: DotOverride[]
}

type StageView = {
  id: string; stageId: string; name: string; imageUrl: string | null; svgContent: string | null; order: number
  northAngle: number | null
  dotOverrides: DotOverride[]
}
type Stage = {
  id: string; projectId: string; svgElementId: string; name: string; order: number; stageViews: StageView[]
}

const STATUS_CONFIG = {
  available: { label: 'Dostępna', fill: '#86efac', stroke: '#86efac', bg: 'bg-green-100', text: 'text-green-800' },
  reserved: { label: 'Rezerwacja', fill: '#fde047', stroke: '#fde047', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  sold: { label: 'Sprzedana', fill: '#f87171', stroke: '#f87171', bg: 'bg-red-100', text: 'text-red-800' },
}
type StatusKey = keyof typeof STATUS_CONFIG

// Pole-of-inaccessibility ("polylabel") — finds the point inside a polygon
// that is furthest from any edge. Works well for concave/L-shaped footprints
// where a centroid can land off-center or even outside the polygon.
type Pt = [number, number]

function pointToSegmentDistSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  let dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  let t = 0
  if (lenSq > 0) {
    t = ((px - ax) * dx + (py - ay) * dy) / lenSq
    if (t > 1) t = 1
    else if (t < 0) t = 0
  }
  dx = ax + t * dx - px
  dy = ay + t * dy - py
  return dx * dx + dy * dy
}

// Signed distance: positive inside polygon, negative outside.
function pointToPolygonDist(x: number, y: number, poly: Pt[]): number {
  let inside = false
  let minDistSq = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) {
      inside = !inside
    }
    const d = pointToSegmentDistSq(x, y, a[0], a[1], b[0], b[1])
    if (d < minDistSq) minDistSq = d
  }
  const dist = Math.sqrt(minDistSq)
  return inside ? dist : -dist
}

type Cell = { x: number; y: number; h: number; d: number; max: number }
function makeCell(x: number, y: number, h: number, poly: Pt[]): Cell {
  const d = pointToPolygonDist(x, y, poly)
  return { x, y, h, d, max: d + h * Math.SQRT2 }
}

function polylabel(poly: Pt[], precision = 1): Pt {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of poly) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  const w = maxX - minX, h = maxY - minY
  const cellSize = Math.min(w, h)
  if (cellSize === 0) return [minX, minY]
  let cell = cellSize / 2

  // Priority queue: cells with highest potential distance first.
  const queue: Cell[] = []
  const push = (c: Cell) => {
    let i = queue.length
    queue.push(c)
    while (i > 0) {
      const p = (i - 1) >> 1
      if (queue[p].max >= queue[i].max) break
      ;[queue[p], queue[i]] = [queue[i], queue[p]]
      i = p
    }
  }
  const pop = (): Cell => {
    const top = queue[0]
    const last = queue.pop()!
    if (queue.length > 0) {
      queue[0] = last
      let i = 0
      const n = queue.length
      for (;;) {
        const l = 2 * i + 1, r = l + 1
        let best = i
        if (l < n && queue[l].max > queue[best].max) best = l
        if (r < n && queue[r].max > queue[best].max) best = r
        if (best === i) break
        ;[queue[i], queue[best]] = [queue[best], queue[i]]
        i = best
      }
    }
    return top
  }

  // Seed with a grid covering the bbox, and the centroid as a baseline.
  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      push(makeCell(x + cell, y + cell, cell, poly))
    }
  }

  let sx = 0, sy = 0
  for (const [x, y] of poly) { sx += x; sy += y }
  let best = makeCell(sx / poly.length, sy / poly.length, 0, poly)
  const bboxCell = makeCell(minX + w / 2, minY + h / 2, 0, poly)
  if (bboxCell.d > best.d) best = bboxCell

  while (queue.length) {
    const c = pop()
    if (c.d > best.d) best = c
    if (c.max - best.d <= precision) continue
    cell = c.h / 2
    push(makeCell(c.x - cell, c.y - cell, cell, poly))
    push(makeCell(c.x + cell, c.y - cell, cell, poly))
    push(makeCell(c.x - cell, c.y + cell, cell, poly))
    push(makeCell(c.x + cell, c.y + cell, cell, poly))
  }
  return [best.x, best.y]
}

function buildStatusDots(
  svgContent: string,
  units: Unit[],
  filteredIds: Set<string>,
  match: 'id' | 'data-unit-id',
  overrides: Map<string, { dotX: number; dotY: number }>
): string {
  const vbm = svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const w = vbm ? parseFloat(vbm[1]) : 1000
  const h = vbm ? parseFloat(vbm[2]) : 1000
  const r = Math.max(4, Math.sqrt(w * w + h * h) * 0.006)
  const precision = Math.max(0.5, Math.min(w, h) * 0.002)

  const polyRe = /<polygon\b([^>]*?)\/?>/g
  const dots: string[] = []
  let m: RegExpExecArray | null
  while ((m = polyRe.exec(svgContent)) !== null) {
    const attrs = m[1]
    const keyRe = match === 'id' ? /\bid="([^"]+)"/ : /\bdata-unit-id="([^"]+)"/
    const keyMatch = attrs.match(keyRe)
    if (!keyMatch) continue
    const key = keyMatch[1]
    const unit = match === 'id'
      ? units.find(u => u.svgElementId === key)
      : units.find(u => u.id === key)
    if (!unit) continue
    if (!filteredIds.has(unit.id)) continue
    let cx: number, cy: number
    const ov = overrides.get(unit.id)
    if (ov) {
      cx = ov.dotX
      cy = ov.dotY
    } else {
      const ptsMatch = attrs.match(/\bpoints="([^"]+)"/)
      if (!ptsMatch) continue
      const nums = ptsMatch[1].trim().split(/[\s,]+/).map(Number).filter(n => !Number.isNaN(n))
      if (nums.length < 6) continue
      const poly: Pt[] = []
      for (let i = 0; i + 1 < nums.length; i += 2) poly.push([nums[i], nums[i + 1]])
      ;[cx, cy] = polylabel(poly, precision)
    }
    const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
    dots.push(
      `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${cfg.fill}" fill-opacity="0.55" stroke="${cfg.fill}" stroke-opacity="0.75" stroke-width="${(r * 0.12).toFixed(2)}" />`
    )
  }
  if (dots.length === 0) return ''
  return `<g pointer-events="none">${dots.join('')}</g>`
}

function buildStageLabels(
  svgContent: string,
  stages: { svgElementId: string; name: string }[]
): string {
  if (!stages.length) return ''
  const vbm = svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const w = vbm ? parseFloat(vbm[1]) : 1000
  const h = vbm ? parseFloat(vbm[2]) : 1000
  const fontSize = Math.max(16, Math.sqrt(w * w + h * h) * 0.018)
  const strokeW = Math.max(1.5, fontSize * 0.22)
  const precision = Math.max(0.5, Math.min(w, h) * 0.002)

  const byId = new Map(stages.map(s => [s.svgElementId, s.name]))
  const labels: string[] = []

  const polyRe = /<polygon\b([^>]*?)\/?>/g
  let m: RegExpExecArray | null
  while ((m = polyRe.exec(svgContent)) !== null) {
    const attrs = m[1]
    const idMatch = attrs.match(/\bid="([^"]+)"/)
    if (!idMatch) continue
    const name = byId.get(idMatch[1])
    if (!name) continue
    const ptsMatch = attrs.match(/\bpoints="([^"]+)"/)
    if (!ptsMatch) continue
    const nums = ptsMatch[1].trim().split(/[\s,]+/).map(Number).filter(n => !Number.isNaN(n))
    if (nums.length < 6) continue
    const poly: Pt[] = []
    for (let i = 0; i + 1 < nums.length; i += 2) poly.push([nums[i], nums[i + 1]])
    const [cx, cy] = polylabel(poly, precision)
    const escaped = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    labels.push(
      `<text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize.toFixed(2)}" font-weight="700" fill="#ffffff" stroke="rgba(0,0,0,0.6)" stroke-width="${strokeW.toFixed(2)}" stroke-linejoin="round" paint-order="stroke fill" style="font-family:Inter,sans-serif">${escaped}</text>`
    )
  }
  if (!labels.length) return ''
  return `<g pointer-events="none">${labels.join('')}</g>`
}

function injectBeforeSvgClose(svgString: string, fragment: string): string {
  if (!fragment) return svgString
  return svgString.replace(/<\/svg>\s*$/i, `${fragment}</svg>`)
}

// Small compass overlay. `angle` is the rotation in degrees — 0 means north
// is up. Positioned absolute on the right edge, vertically centered, to clear
// the top-right prev/next arrows and the bottom-right PDF card.
function NorthCompass({ angle }: { angle: number | null }) {
  if (angle == null) return null
  return (
    <div
      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center rounded-full shadow-md"
      style={{
        width: 43,
        height: 43,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(4px)',
      }}
      aria-hidden="true"
    >
      <svg
        width="34"
        height="34"
        viewBox="-20 -20 40 40"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <circle cx="0" cy="0" r="17" style={{ fill: 'none', stroke: '#6E2E2A', strokeWidth: 0.8, opacity: 0.4 }} />
        <polygon points="0,-15 4,0 0,2 -4,0" style={{ fill: '#B22222', fillOpacity: 1, stroke: 'none', pointerEvents: 'none' }} />
        <polygon points="0,15 4,0 0,-2 -4,0" style={{ fill: '#3E1718', fillOpacity: 0.6, stroke: 'none', pointerEvents: 'none' }} />
        <text x="0" y="-16" textAnchor="middle" style={{ fontSize: 6, fontWeight: 'bold', fill: '#3E1718', dominantBaseline: 'auto' }}>N</text>
      </svg>
    </div>
  )
}

function fmt(price: number | null) {
  if (!price) return 'Na zapytanie'
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(price)
}

// Full price shown to buyers = base price + optional extras (parking/storage/
// rights/other) when the developer prices them separately.
function fullPriceOf(u: Pick<Unit, 'price' | 'parkingPrice' | 'storagePrice' | 'rightsPrice' | 'otherPrice'>): number | null {
  if (u.price == null) return null
  return u.price
    + (u.parkingPrice ?? 0)
    + (u.storagePrice ?? 0)
    + (u.rightsPrice ?? 0)
    + (u.otherPrice ?? 0)
}

// Non-zero extras bundled into the full price, labelled for display.
function priceExtras(u: Pick<Unit, 'parkingPrice' | 'storagePrice' | 'rightsPrice' | 'otherPrice'>): { label: string; amount: number }[] {
  const out: { label: string; amount: number }[] = []
  if (u.parkingPrice) out.push({ label: 'parking', amount: u.parkingPrice })
  if (u.storagePrice) out.push({ label: 'komórka lokatorska', amount: u.storagePrice })
  if (u.rightsPrice)  out.push({ label: 'prawa do nieruchomości', amount: u.rightsPrice })
  if (u.otherPrice)   out.push({ label: 'ogródek', amount: u.otherPrice })
  return out
}

function extrasLine(u: Pick<Unit, 'parkingPrice' | 'storagePrice' | 'rightsPrice' | 'otherPrice'>): string | null {
  const ex = priceExtras(u)
  if (ex.length === 0) return null
  const hasParking = ex.some(e => e.label === 'parking')
  const others = ex.filter(e => e.label !== 'parking')
  const parts: string[] = []
  if (hasParking) parts.push('Parking jest zawarty w cenie')
  if (others.length > 0) {
    parts.push('w tym ' + others.map(e => `${e.label} ${new Intl.NumberFormat('pl-PL').format(e.amount)} zł`).join(', '))
  }
  return parts.join('; ')
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fullPriceOfHistory(h: PriceHistoryEntry): number | null {
  if (h.totalPrice == null) return null
  return h.totalPrice + (h.parkingPrice ?? 0) + (h.storagePrice ?? 0) + (h.rightsPrice ?? 0) + (h.otherPrice ?? 0)
}

// Omnibus directive: if the current price is a reduction (lower than any price
// applied during the prior 30 days), the lowest price from that window must be
// displayed alongside the reduced price.
function lowest30DayPrice(unit: Unit): number | null {
  const currentFull = fullPriceOf(unit)
  if (currentFull == null || !unit.priceHistory || unit.priceHistory.length === 0) return null
  const history = [...unit.priceHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const current = history[history.length - 1]
  const currentTime = new Date(current.date).getTime()
  const windowStart = currentTime - 30 * 24 * 60 * 60 * 1000
  const priorFulls = history.slice(0, -1)
    .filter(h => new Date(h.date).getTime() >= windowStart)
    .map(h => fullPriceOfHistory(h))
    .filter((v): v is number => v != null)
  if (priorFulls.length === 0) return null
  const min = Math.min(...priorFulls)
  return min > currentFull ? min : null
}

type SortKey = 'label' | 'area' | 'gardenArea' | 'rooms' | 'price' | 'pricePerM2' | 'status'
type SortDir = 'asc' | 'desc'

export function ProjectNavigator({ slug, projectName }: { slug: string; projectName?: string }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [planViews, setPlanViews] = useState<PlanViewItem[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [activeStageId, setActiveStageId] = useState<string | null>(null)
  const [activeStageViewId, setActiveStageViewId] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; unit: Unit } | null>(null)
  const [stageTooltip, setStageTooltip] = useState<{ x: number; y: number; stage: Stage } | null>(null)
  const [activeStage, setActiveStage] = useState<string>('all')
  const [floorView, setFloorView] = useState<'3d' | '2d'>('3d')
  const [contactModal, setContactModal] = useState<{ open: boolean; subject: string }>({ open: false, subject: '' })
  const [pdfModal, setPdfModal] = useState<{ open: boolean; url: string; title: string }>({ open: false, url: '', title: '' })
  const openPdf = useCallback((url: string, title: string) => {
    // Mobile browsers render embedded PDF iframes as single-page horizontal-scroll,
    // so open the file directly in the system viewer where multi-page navigation works.
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      setPdfModal({ open: true, url, title })
    }
  }, [])
  const [historyModal, setHistoryModal] = useState<{ open: boolean; unit: Unit | null }>({ open: false, unit: null })
  const [activeHouseTypeIndex, setActiveHouseTypeIndex] = useState(0)
  const [activeFloor, setActiveFloor] = useState(0)
  const svgRef = useRef<HTMLDivElement>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRooms, setFilterRooms] = useState<string>('all')
  const [filterAreaMin, setFilterAreaMin] = useState('')
  const [filterAreaMax, setFilterAreaMax] = useState('')
  const [filterGardenMin, setFilterGardenMin] = useState('')
  const [filterGardenMax, setFilterGardenMax] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('label')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const hasStages = stages.length > 0

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${slug}/units`).then(r => r.json()),
      fetch(`/api/projects/${slug}/plan-views`).then(r => r.json()).catch(() => []),
      fetch(`/api/projects/${slug}/stages`).then(r => r.json()).catch(() => []),
    ]).then(([unitData, views, stagesData]) => {
      if (unitData && Array.isArray(unitData.units)) {
        setData(unitData)
      } else {
        setData({ svgContent: null, planImageUrl: null, northAngle: null, units: [], houseTypes: [], dotOverrides: [] })
      }
      setPlanViews(Array.isArray(views) ? views : [])
      setStages(Array.isArray(stagesData) ? stagesData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  // Derived: the active stage object
  const currentStage = useMemo(() => stages.find(s => s.id === activeStageId) ?? null, [stages, activeStageId])

  // Only show działki that have a polygon drawn for them in any SVG (main
  // plan, additional plan views, or stage views). Polygons reference units via
  // either id="<svgElementId>" (main plan) or data-unit-id="<unit.id>".
  const displayUnits = useMemo(() => {
    if (!data) return []
    const svgs: string[] = []
    if (data.svgContent) svgs.push(data.svgContent)
    for (const pv of planViews) if (pv.svgContent) svgs.push(pv.svgContent)
    for (const st of stages) for (const sv of st.stageViews) if (sv.svgContent) svgs.push(sv.svgContent)
    const polyIds = new Set<string>()
    const polyDataUnitIds = new Set<string>()
    const polyRe = /<polygon\b([^>]*?)\/?>/g
    for (const svg of svgs) {
      let m: RegExpExecArray | null
      polyRe.lastIndex = 0
      while ((m = polyRe.exec(svg)) !== null) {
        const attrs = m[1]
        const idMatch = attrs.match(/\bid="([^"]+)"/)
        if (idMatch) polyIds.add(idMatch[1])
        const dataMatch = attrs.match(/\bdata-unit-id="([^"]+)"/)
        if (dataMatch) polyDataUnitIds.add(dataMatch[1])
      }
    }
    return data.units.filter(u => polyIds.has(u.svgElementId) || polyDataUnitIds.has(u.id))
  }, [data, planViews, stages])

  const stageFilterOptions = useMemo(() => {
    const s = new Set(displayUnits.map((u) => u.stage).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [displayUnits])

  const roomOptions = useMemo(() => {
    const r = new Set(displayUnits.map((u) => u.rooms).filter(Boolean) as number[])
    return Array.from(r).sort((a, b) => a - b)
  }, [displayUnits])

  const filteredUnits = useMemo(() => {
    return displayUnits.filter((u) => {
      if (activeStage !== 'all' && u.stage !== activeStage) return false
      if (filterStatus !== 'all' && u.status !== filterStatus) return false
      if (filterRooms !== 'all' && String(u.rooms) !== filterRooms) return false
      if (filterAreaMin && (u.area ?? 0) < parseFloat(filterAreaMin)) return false
      if (filterAreaMax && (u.area ?? Infinity) > parseFloat(filterAreaMax)) return false
      if (filterGardenMin && (u.gardenArea ?? 0) < parseFloat(filterGardenMin)) return false
      if (filterGardenMax && (u.gardenArea ?? Infinity) > parseFloat(filterGardenMax)) return false
      return true
    })
  }, [displayUnits, activeStage, filterStatus, filterRooms, filterAreaMin, filterAreaMax, filterGardenMin, filterGardenMax])

  const sortedUnits = useMemo(() => {
    return [...filteredUnits].sort((a, b) => {
      let av: string | number
      let bv: string | number
      if (sortKey === 'pricePerM2') {
        av = (a.price != null && a.area) ? a.price / a.area : 0
        bv = (b.price != null && b.area) ? b.price / b.area : 0
      } else if (sortKey === 'price') {
        av = fullPriceOf(a) ?? 0
        bv = fullPriceOf(b) ?? 0
      } else {
        av = (a[sortKey] as string | number) ?? ''
        bv = (b[sortKey] as string | number) ?? ''
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv, 'pl') : bv.localeCompare(av, 'pl')
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [filteredUnits, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" style={{ color: '#6E2E2A' }} />
      : <ArrowDown className="h-3 w-3 ml-1" style={{ color: '#6E2E2A' }} />
  }

  const getUnit = useCallback((id: string) => data?.units.find((u) => u.svgElementId === id), [data])

  // ── Main plan SVG: colors units (no-stage, no-planViews fallback) ──
  const coloredSvg = useCallback((): string => {
    if (!data?.svgContent) return ''
    const filteredIds = new Set(filteredUnits.map((u) => u.svgElementId))

    const styles = data.units.map((unit) => {
      const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
      const isFiltered = !filteredIds.has(unit.svgElementId)
      const isHovered = hoveredUnit === unit.svgElementId
      const isSelected = selectedUnit?.id === unit.id

      let fill: string, fillOpacity: string, stroke: string, sw: string
      if (isFiltered) {
        fill = 'transparent'; fillOpacity = '0'; stroke = 'transparent'; sw = '0'
      } else if (isSelected) {
        fill = cfg.fill; fillOpacity = '0.45'; stroke = 'none'; sw = '0'
      } else if (isHovered) {
        fill = cfg.fill; fillOpacity = '0.4'; stroke = 'none'; sw = '0'
      } else {
        fill = 'transparent'; fillOpacity = '0'; stroke = 'none'; sw = '0'
      }
      return `#${CSS.escape(unit.svgElementId)} { fill: ${fill}; fill-opacity: ${fillOpacity}; stroke: ${stroke}; stroke-width: ${sw}px; cursor: pointer; pointer-events: all; transition: fill 0.15s, fill-opacity 0.15s; }`
    }).join('\n')

    const vbMatch = data.svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    const imgTag = data.planImageUrl && vbMatch
      ? `<image href="${data.planImageUrl}" x="0" y="0" width="${vbMatch[1]}" height="${vbMatch[2]}" preserveAspectRatio="xMidYMid meet"/>`
      : ''

    const filteredUnitIds = new Set(filteredUnits.map(u => u.id))
    const overrides = new Map((data.dotOverrides ?? []).map(o => [o.unitId, { dotX: o.dotX, dotY: o.dotY }]))
    const dots = buildStatusDots(data.svgContent, data.units, filteredUnitIds, 'id', overrides)
    const withStyle = data.svgContent
      .replace(/(<svg[^>]*>)/, `$1<style>${styles}</style>${imgTag}`)
      .replace(/<svg([^>]*)>/, `<svg$1 style="width:100%;height:100%;display:block">`)
    return injectBeforeSvgClose(withStyle, dots)
  }, [data, filteredUnits, hoveredUnit, selectedUnit])

  // ── Main plan SVG: navigational polygons (no-stage, has planViews → polygons scroll to views) ──
  const coloredNavigationSvg = useCallback((): string => {
    if (!data?.svgContent) return ''
    const navColor = '#6E2E2A'
    const styles = `polygon { fill: ${navColor}; fill-opacity: 0.4; stroke: none; cursor: pointer; transition: fill-opacity 0.15s; }
polygon:hover { fill-opacity: 0.45; }`

    const vbMatch = data.svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    const imgTag = data.planImageUrl && vbMatch
      ? `<image href="${data.planImageUrl}" x="0" y="0" width="${vbMatch[1]}" height="${vbMatch[2]}" preserveAspectRatio="xMidYMid meet"/>`
      : ''

    return data.svgContent
      .replace(/(<svg[^>]*>)/, `$1<style>${styles}</style>${imgTag}`)
      .replace(/<svg([^>]*)>/, `<svg$1 style="width:100%;height:100%;display:block">`)
  }, [data])

  // ── Main plan SVG: colors stage polygons (stage mode) ──
  const coloredStagePlanSvg = useCallback((): string => {
    if (!data?.svgContent) return ''
    const stageColor = '#6E2E2A'
    const stageIds = new Set(stages.map(s => s.svgElementId))

    // Hover brightening is expressed as a pure CSS :hover rule rather than baked
    // into the string from `hoveredStage`. Baking it in would change the SVG
    // markup on every hover, forcing React to re-inject the whole innerHTML and
    // recreate the embedded background <image> — which re-decodes the bitmap and
    // produces a visible flash. That flash only shows on touch devices, where the
    // synthetic mouse-enter fires at tap time (desktop sets hover during pointer
    // movement, well before the click).
    const styles = Array.from(stageIds).map(svgId => {
      const eid = CSS.escape(svgId)
      return `#${eid} { fill: ${stageColor}; fill-opacity: 0.4; stroke: none; cursor: pointer; transition: fill 0.15s, fill-opacity 0.15s; }
#${eid}:hover { fill-opacity: 0.45; }`
    }).join('\n')

    // Hide non-stage polygons
    const hideOther = `polygon:not(${Array.from(stageIds).map(id => `#${CSS.escape(id)}`).join(',')}) { fill: transparent; fill-opacity: 0; stroke: transparent; pointer-events: none; }`

    const vbMatch = data.svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    const imgTag = data.planImageUrl && vbMatch
      ? `<image href="${data.planImageUrl}" x="0" y="0" width="${vbMatch[1]}" height="${vbMatch[2]}" preserveAspectRatio="xMidYMid meet"/>`
      : ''

    const labels = buildStageLabels(data.svgContent, stages)
    const withStyle = data.svgContent
      .replace(/(<svg[^>]*>)/, `$1<style>${styles}\n${hideOther}</style>${imgTag}`)
      .replace(/<svg([^>]*)>/, `<svg$1 style="width:100%;height:100%;display:block">`)
    return injectBeforeSvgClose(withStyle, labels)
  }, [data, stages])

  // ── Stage view SVG: colors unit polygons ──
  const coloredStageViewSvg = useCallback((sv: StageView): string => {
    if (!sv.svgContent) return ''
    const vbMatch = sv.svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    const imgTag = sv.imageUrl && vbMatch
      ? `<image href="${sv.imageUrl}" x="0" y="0" width="${vbMatch[1]}" height="${vbMatch[2]}" preserveAspectRatio="xMidYMid meet"/>`
      : ''
    const baseStyle = `polygon { fill: transparent; fill-opacity: 0; stroke: transparent; cursor: pointer; pointer-events: all; transition: fill 0.15s, fill-opacity 0.15s; }`
    const unitStyles = (data?.units ?? []).map(unit => {
      const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
      const eid = CSS.escape(unit.id)
      if (selectedUnit?.id === unit.id) {
        return `polygon[data-unit-id="${eid}"] { fill: ${cfg.fill}; fill-opacity: 0.45; stroke: none; }`
      }
      return `polygon[data-unit-id="${eid}"]:hover { fill: ${cfg.fill}; fill-opacity: 0.4; stroke: none; }`
    }).join('\n')
    const filteredUnitIds = new Set(filteredUnits.map(u => u.id))
    const overrides = new Map((sv.dotOverrides ?? []).map(o => [o.unitId, { dotX: o.dotX, dotY: o.dotY }]))
    const dots = buildStatusDots(sv.svgContent, data?.units ?? [], filteredUnitIds, 'data-unit-id', overrides)
    const withStyle = sv.svgContent
      .replace(/(<svg[^>]*>)/, `$1<style>${baseStyle}\n${unitStyles}</style>${imgTag}`)
      .replace(/<svg([^>]*)>/, `<svg$1 style="width:100%;height:100%;display:block">`)
    return injectBeforeSvgClose(withStyle, dots)
  }, [data, selectedUnit, filteredUnits])

  // ── Plan view SVG: navigational (stage mode — polygons navigate to stages) ──
  const coloredViewNavigationSvg = useCallback((pv: PlanViewItem): string => {
    if (!pv.svgContent) return ''
    const navColor = '#6E2E2A'
    const vbMatch = pv.svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    const imgTag = pv.imageUrl && vbMatch
      ? `<image href="${pv.imageUrl}" x="0" y="0" width="${vbMatch[1]}" height="${vbMatch[2]}" preserveAspectRatio="xMidYMid meet"/>`
      : ''
    const styles = `polygon { fill: ${navColor}; fill-opacity: 0.4; stroke: none; cursor: pointer; transition: fill-opacity 0.15s; }
polygon:hover { fill-opacity: 0.45; }`
    return pv.svgContent
      .replace(/(<svg[^>]*>)/, `$1<style>${styles}</style>${imgTag}`)
      .replace(/<svg([^>]*)>/, `<svg$1 style="width:100%;height:100%;display:block">`)
  }, [])

  // ── Plan view SVG (no-stage mode, existing) ──
  const coloredViewSvg = useCallback((pv: PlanViewItem): string => {
    if (!pv.svgContent) return ''
    const vbMatch = pv.svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    const imgTag = pv.imageUrl && vbMatch
      ? `<image href="${pv.imageUrl}" x="0" y="0" width="${vbMatch[1]}" height="${vbMatch[2]}" preserveAspectRatio="xMidYMid meet"/>`
      : ''
    const baseStyle = `polygon { fill: transparent; fill-opacity: 0; stroke: transparent; cursor: pointer; pointer-events: all; transition: fill 0.15s, fill-opacity 0.15s; }`
    const unitStyles = (data?.units ?? []).map(unit => {
      const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
      const eid = CSS.escape(unit.id)
      if (selectedUnit?.id === unit.id) {
        return `polygon[data-unit-id="${eid}"] { fill: ${cfg.fill}; fill-opacity: 0.45; stroke: none; }`
      }
      return `polygon[data-unit-id="${eid}"]:hover { fill: ${cfg.fill}; fill-opacity: 0.4; stroke: none; }`
    }).join('\n')
    const filteredUnitIds = new Set(filteredUnits.map(u => u.id))
    const overrides = new Map((pv.dotOverrides ?? []).map(o => [o.unitId, { dotX: o.dotX, dotY: o.dotY }]))
    const dots = buildStatusDots(pv.svgContent, data?.units ?? [], filteredUnitIds, 'data-unit-id', overrides)
    const withStyle = pv.svgContent
      .replace(/(<svg[^>]*>)/, `$1<style>${baseStyle}\n${unitStyles}</style>${imgTag}`)
      .replace(/<svg([^>]*)>/, `<svg$1 style="width:100%;height:100%;display:block">`)
    return injectBeforeSvgClose(withStyle, dots)
  }, [data, selectedUnit, filteredUnits])

  const activeView = planViews.find(v => v.id === activeViewId) ?? null
  const activeStageView = currentStage?.stageViews.find(v => v.id === activeStageViewId) ?? currentStage?.stageViews[0] ?? null

  // Stable aspect ratio per mode — prevents layout jump when user navigates
  // between views whose viewBoxes have different W/H. We pick the min ratio
  // (tallest image) so every view fits inside via preserveAspectRatio meet.
  const parseSvgAspect = (svg?: string | null): number | null => {
    if (!svg) return null
    const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    if (!m) return null
    const w = parseFloat(m[1]); const h = parseFloat(m[2])
    return w > 0 && h > 0 ? w / h : null
  }
  const defaultMapAspect = useMemo(() => {
    const ratios: number[] = []
    const r = parseSvgAspect(data?.svgContent); if (r) ratios.push(r)
    for (const pv of planViews) { const rr = parseSvgAspect(pv.svgContent); if (rr) ratios.push(rr) }
    return ratios.length ? Math.min(...ratios) : null
  }, [data?.svgContent, planViews])
  const stageMapAspect = useMemo(() => {
    if (!currentStage) return null
    const ratios: number[] = []
    for (const sv of currentStage.stageViews) { const rr = parseSvgAspect(sv.svgContent); if (rr) ratios.push(rr) }
    return ratios.length ? Math.min(...ratios) : null
  }, [currentStage])

  // Resolve which map's north angle to display. Stage view > plan view > project main plan.
  const activeNorthAngle: number | null = activeStageView?.northAngle
    ?? activeView?.northAngle
    ?? data?.northAngle
    ?? null

  // Memoized SVG HTML strings. Hover tooltip state updates re-render the component on
  // every mousemove; without stable references React replaces innerHTML each frame and
  // the CSS :hover highlight flickers.
  const mainSvgHtml = useMemo(() => coloredSvg(), [coloredSvg])
  const stagePlanHtml = useMemo(() => coloredStagePlanSvg(), [coloredStagePlanSvg])
  const viewSvgHtml = useMemo(() => (activeView ? coloredViewSvg(activeView) : ''), [coloredViewSvg, activeView])
  const viewNavHtml = useMemo(() => (activeView ? coloredViewNavigationSvg(activeView) : ''), [coloredViewNavigationSvg, activeView])
  const stageViewHtml = useMemo(() => (activeStageView ? coloredStageViewSvg(activeStageView) : ''), [coloredStageViewSvg, activeStageView])

  // Animation state for smooth view transitions
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)

  // ── View navigation for NO-STAGE mode (existing plan views) ──
  const allViews = useMemo(() => {
    const mainPlan = { id: null as string | null, name: 'Plan główny' }
    return [mainPlan, ...planViews.map(pv => ({ id: pv.id, name: pv.name }))]
  }, [planViews])

  const currentViewIndex = useMemo(() => {
    return allViews.findIndex(v => v.id === activeViewId)
  }, [allViews, activeViewId])

  const goToPrevView = useCallback(() => {
    if (!isAnimating && allViews.length > 1) {
      setIsAnimating(true)
      setSlideDirection('right')
      setTimeout(() => {
        const prevIndex = currentViewIndex > 0 ? currentViewIndex - 1 : allViews.length - 1
        setActiveViewId(allViews[prevIndex].id)
        setTimeout(() => { setIsAnimating(false); setSlideDirection(null) }, 300)
      }, 150)
    }
  }, [currentViewIndex, allViews, isAnimating])

  const goToNextView = useCallback(() => {
    if (!isAnimating && allViews.length > 1) {
      setIsAnimating(true)
      setSlideDirection('left')
      setTimeout(() => {
        const nextIndex = currentViewIndex < allViews.length - 1 ? currentViewIndex + 1 : 0
        setActiveViewId(allViews[nextIndex].id)
        setTimeout(() => { setIsAnimating(false); setSlideDirection(null) }, 300)
      }, 150)
    }
  }, [currentViewIndex, allViews, isAnimating])

  // ── View navigation for STAGE mode (stage views) ──
  const stageViewsList = useMemo(() => currentStage?.stageViews ?? [], [currentStage])

  const currentStageViewIndex = useMemo(() => {
    if (!activeStageView) return 0
    return stageViewsList.findIndex(v => v.id === activeStageView.id)
  }, [stageViewsList, activeStageView])

  const goToPrevStageView = useCallback(() => {
    if (!isAnimating && stageViewsList.length > 1) {
      setIsAnimating(true)
      setSlideDirection('right')
      setTimeout(() => {
        const prevIndex = currentStageViewIndex > 0 ? currentStageViewIndex - 1 : stageViewsList.length - 1
        setActiveStageViewId(stageViewsList[prevIndex].id)
        setTimeout(() => { setIsAnimating(false); setSlideDirection(null) }, 300)
      }, 150)
    }
  }, [currentStageViewIndex, stageViewsList, isAnimating])

  const goToNextStageView = useCallback(() => {
    if (!isAnimating && stageViewsList.length > 1) {
      setIsAnimating(true)
      setSlideDirection('left')
      setTimeout(() => {
        const nextIndex = currentStageViewIndex < stageViewsList.length - 1 ? currentStageViewIndex + 1 : 0
        setActiveStageViewId(stageViewsList[nextIndex].id)
        setTimeout(() => { setIsAnimating(false); setSlideDirection(null) }, 300)
      }, 150)
    }
  }, [currentStageViewIndex, stageViewsList, isAnimating])

  const showViewNavigation = planViews.length > 0
  const showStageViewNavigation = hasStages && activeStageId && stageViewsList.length > 1

  // ── Click handlers ──
  // No-stage, no plan views: direct unit interaction on main plan
  const handleSvgClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const id = (e.target as SVGElement).id || ((e.target as SVGElement).parentElement as SVGElement | null)?.id
    if (!id) return
    const unit = getUnit(id)
    if (unit) setSelectedUnit((p) => p?.id === unit.id ? null : unit)
  }, [getUnit])

  // No-stage, has plan views: clicking main plan polygon scrolls to first plan view (Dodatkowe widoki)
  const handleNavigationPlanClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as SVGElement
    if (el.tagName !== 'polygon' && el.parentElement?.tagName !== 'polygon') return
    if (planViews.length > 0) {
      setActiveViewId(planViews[0].id)
      setSelectedUnit(null)
    }
  }, [planViews])

  // Main plan click in stage mode: enter the stage
  const handleStagePlanClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as SVGElement
    const id = el.id || (el.parentElement as SVGElement | null)?.id
    if (!id) return
    const stage = stages.find(s => s.svgElementId === id)
    if (stage) {
      setActiveStageId(stage.id)
      setActiveStageViewId(stage.stageViews[0]?.id ?? null)
      setSelectedUnit(null)
      setStageTooltip(null)
    }
  }, [stages])

  const handleStagePlanMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as SVGElement
    const id = el.id || (el.parentElement as SVGElement | null)?.id
    if (!id) { setStageTooltip(null); return }
    const stage = stages.find(s => s.svgElementId === id)
    if (stage) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) setStageTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 8, stage })
    } else { setStageTooltip(null) }
  }, [stages])

  const handleViewSvgClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as Element
    const unitId = el.getAttribute?.('data-unit-id')
    if (!unitId) return
    const unit = data?.units.find(u => u.id === unitId)
    if (unit) setSelectedUnit(p => p?.id === unit.id ? null : unit)
  }, [data])

  const handleStageViewMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as Element
    const unitId = el.getAttribute?.('data-unit-id')
    if (!unitId) {
      setHoveredUnit((prev) => (prev == null ? prev : null))
      setTooltip((prev) => (prev == null ? prev : null))
      return
    }
    const unit = data?.units.find(u => u.id === unitId)
    if (unit) {
      setHoveredUnit((prev) => (prev === unit.id ? prev : unit.id))
      setTooltip((prev) => (prev && prev.unit.id === unit.id ? prev : { x: 0, y: 0, unit }))
    } else {
      setHoveredUnit((prev) => (prev == null ? prev : null))
      setTooltip((prev) => (prev == null ? prev : null))
    }
  }, [data])

  // Plan view click in stage mode. Prefer direct stage reference (data-stage-id).
  // Fall back to data-unit-id → unit.stage for legacy polygons.
  const handleViewStageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as Element
    const stageId = el.getAttribute?.('data-stage-id')
    let stage: Stage | undefined
    if (stageId) {
      stage = stages.find(s => s.id === stageId)
    } else {
      const unitId = el.getAttribute?.('data-unit-id')
      if (!unitId) return
      const unit = data?.units.find(u => u.id === unitId)
      if (!unit?.stage) return
      stage = stages.find(s => s.name === unit.stage || s.svgElementId === unit.stage)
    }
    if (stage) {
      setActiveStageId(stage.id)
      setActiveStageViewId(stage.stageViews[0]?.id ?? null)
      setActiveViewId(null)
      setSelectedUnit(null)
      setStageTooltip(null)
    }
  }, [data, stages])

  // Plan view hover in stage mode: show stage tooltip (mirrors main plan stage tooltip).
  const handleViewStageMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as Element
    const stageId = el.getAttribute?.('data-stage-id')
    if (!stageId) { setStageTooltip(null); return }
    const stage = stages.find(s => s.id === stageId)
    if (stage) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) setStageTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 8, stage })
    } else { setStageTooltip(null) }
  }, [stages])

  const handleSvgMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const id = (e.target as SVGElement).id || ((e.target as SVGElement).parentElement as SVGElement | null)?.id
    if (!id) { setHoveredUnit(null); setTooltip(null); return }
    const unit = getUnit(id)
    if (unit) {
      setHoveredUnit(unit.svgElementId)
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 8, unit })
    } else { setHoveredUnit(null); setTooltip(null) }
  }, [getUnit])

  const goBackToMainPlan = useCallback(() => {
    setActiveStageId(null)
    setActiveStageViewId(null)
    setSelectedUnit(null)
  }, [])

  const clearFilters = () => {
    setFilterStatus('all'); setFilterRooms('all')
    setFilterAreaMin(''); setFilterAreaMax('')
    setFilterGardenMin(''); setFilterGardenMax('')
  }

  const hasFilters = filterStatus !== 'all' || filterRooms !== 'all' || !!filterAreaMin || !!filterAreaMax || !!filterGardenMin || !!filterGardenMax

  const counts = useMemo(() => ({
    available: displayUnits.filter((u) => u.status === 'available').length,
    reserved: displayUnits.filter((u) => u.status === 'reserved').length,
    sold: displayUnits.filter((u) => u.status === 'sold').length,
  }), [displayUnits])

  if (loading) return (
    <div className="py-20 text-center">
      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-secondary/50 border border-border/40">
        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#6E2E2A', borderTopColor: 'transparent' }} />
        <span className="text-sm font-medium" style={{ color: '#3E1718' }}>Ładowanie...</span>
      </div>
    </div>
  )
  if (!data) return (
    <div className="py-20 text-center">
      <p className="text-base" style={{ color: '#3E1718', opacity: 0.6 }}>Błąd ładowania danych.</p>
    </div>
  )

  // ═══════════════════════════════════════
  // STAGE MODE: viewing a specific stage
  // ═══════════════════════════════════════
  if (hasStages && activeStageId && currentStage) {
    return (
      <div className="w-full space-y-6">
        {/* Stage views */}
        <div className="max-w-[74rem] mx-auto space-y-5">
          {/* Status legend, Filter button, and Stage navigation */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 order-2 sm:order-1">
              {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(([s, cfg]) => (
                <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.fill }} />
                  {cfg.label}: {counts[s as keyof typeof counts]}
                </span>
              ))}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)', color: '#6E2E2A' }}
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span>Filtry</span>
                {hasFilters && (
                  <span className="px-1.5 py-0.5 text-xs text-white rounded-full font-medium" style={{ backgroundColor: '#6E2E2A' }}>
                    {filteredUnits.length}/{displayUnits.length}
                  </span>
                )}
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 order-1 sm:order-2">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="inline-flex sm:hidden items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)', color: '#6E2E2A' }}
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span>Filtry</span>
                {hasFilters && (
                  <span className="px-1.5 py-0.5 text-xs text-white rounded-full font-medium" style={{ backgroundColor: '#6E2E2A' }}>
                    {filteredUnits.length}/{displayUnits.length}
                  </span>
                )}
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={goBackToMainPlan}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border border-border/60 hover:bg-secondary/50"
                style={{ color: '#3E1718' }}
              >
                Osiedle
              </button>
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => {
                    setActiveStageId(stage.id)
                    setActiveStageViewId(stage.stageViews[0]?.id ?? null)
                    setSelectedUnit(null)
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${stage.id === activeStageId ? '' : 'border border-border/60 hover:bg-secondary/50'}`}
                  style={stage.id === activeStageId ? { backgroundColor: 'rgba(110, 46, 42, 0.1)', color: '#6E2E2A' } : { color: '#3E1718' }}
                >
                  {stage.name}
                </button>
              ))}
            </div>
          </div>
          {filtersOpen && <FilterPanel {...{ filterStatus, setFilterStatus, filterRooms, setFilterRooms, roomOptions, filterAreaMin, setFilterAreaMin, filterAreaMax, setFilterAreaMax, filterGardenMin, setFilterGardenMin, filterGardenMax, setFilterGardenMax, hasFilters, clearFilters, filteredUnits, totalCount: displayUnits.length }} />}

          <div className="relative">
            <NorthCompass angle={activeNorthAngle} />
            {activeStageView?.svgContent ? (
              <div
                className={`border border-border/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out ${
                  isAnimating
                    ? slideDirection === 'left' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
                    : 'opacity-100 translate-x-0'
                }`}
                style={stageMapAspect ? { aspectRatio: stageMapAspect } : undefined}
                onClick={handleViewSvgClick}
                onMouseMove={handleStageViewMove}
                onMouseLeave={() => { setHoveredUnit(null); setTooltip(null) }}
                dangerouslySetInnerHTML={{ __html: stageViewHtml }}
              />
            ) : activeStageView?.imageUrl ? (
              <div
                className="border border-border/60 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center bg-secondary/10"
                style={stageMapAspect ? { aspectRatio: stageMapAspect } : undefined}
              >
                <img src={activeStageView.imageUrl} alt={resolveAlt(activeStageView.name, sitePlanAlt(projectName ?? '', activeStageView.imageUrl ?? ''))} onLoad={applyIntrinsicSize} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="border border-border/60 rounded-2xl p-16 text-center bg-secondary/30">
                <p className="text-base" style={{ color: '#3E1718', opacity: 0.6 }}>Brak widoku dla tego etapu.</p>
              </div>
            )}

            {(selectedUnit || tooltip) && <UnitTooltip unit={selectedUnit ?? tooltip!.unit} onPdfClick={selectedUnit?.houseType ? () => openPdf(pdfUrl(slug, selectedUnit), [projectName, selectedUnit.label].filter(Boolean).join(' — ')) : undefined} className="hidden sm:block" />}

            {/* Stage view navigation arrows */}
            {showStageViewNavigation && (
              <>
                <button
                  onClick={goToPrevStageView}
                  className="absolute left-2 top-2 sm:left-3 sm:top-4 z-20 flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all shadow-sm text-white cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: 'rgba(62, 23, 24, 0.7)' }}
                  aria-label="Poprzedni widok"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={goToNextStageView}
                  className="absolute right-2 top-2 sm:right-3 sm:top-4 z-20 flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all shadow-sm text-white cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: 'rgba(62, 23, 24, 0.7)' }}
                  aria-label="Następny widok"
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </button>
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-white text-[11px] sm:text-sm font-medium shadow-sm" style={{ backgroundColor: 'rgba(62, 23, 24, 0.8)' }}>
                  <span>{activeStageView?.name}</span>
                  <span className="text-white/70">({currentStageViewIndex + 1}/{stageViewsList.length})</span>
                </div>
              </>
            )}
          </div>

          {/* Mobile-only: unit tooltip below image */}
          {(selectedUnit || tooltip) && (
            <UnitTooltip
              unit={selectedUnit ?? tooltip!.unit}
              onPdfClick={selectedUnit?.houseType ? () => openPdf(pdfUrl(slug, selectedUnit), [projectName, selectedUnit.label].filter(Boolean).join(' — ')) : undefined}
              variant="inline"
              className="sm:hidden"
            />
          )}

          {/* Unit table */}
          <UnitTable {...{ sortedUnits, selectedUnit, setSelectedUnit, handleSort, SortIcon, projectName, slug, onContactClick: (subject: string) => setContactModal({ open: true, subject }), onPdfClick: (u: Unit) => openPdf(pdfUrl(slug, u), [projectName, u.label].filter(Boolean).join(' — ')), onHistoryClick: (u: Unit) => setHistoryModal({ open: true, unit: u }) }} />

          {selectedUnit && <UnitDetailCard unit={selectedUnit} onClose={() => setSelectedUnit(null)} onContactClick={() => setContactModal({ open: true, subject: [projectName, selectedUnit.label].filter(Boolean).join(' — ') })} onPdfClick={() => openPdf(pdfUrl(slug, selectedUnit), [projectName, selectedUnit.label].filter(Boolean).join(' — '))} />}
        </div>

        {/* Visualization disclaimers — after the schema, before house types */}
        <VisualizationFootnotes />

        {/* House Types */}
        <HouseTypesCarousel data={data} activeHouseTypeIndex={activeHouseTypeIndex} setActiveHouseTypeIndex={setActiveHouseTypeIndex} activeFloor={activeFloor} setActiveFloor={setActiveFloor} floorView={floorView} setFloorView={setFloorView} projectName={projectName} />
      <ContactModal isOpen={contactModal.open} onClose={() => setContactModal({ open: false, subject: '' })} subject={contactModal.subject} />
      <PdfModal isOpen={pdfModal.open} onClose={() => setPdfModal({ open: false, url: '', title: '' })} pdfUrl={pdfModal.url} title={pdfModal.title} />
      <PriceHistoryModal
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, unit: null })}
        title={[projectName, historyModal.unit?.label].filter(Boolean).join(' — ')}
        area={historyModal.unit?.area ?? null}
        currentPrice={historyModal.unit?.price ?? null}
        currentExtras={historyModal.unit ? {
          parkingPrice: historyModal.unit.parkingPrice,
          storagePrice: historyModal.unit.storagePrice,
          rightsPrice: historyModal.unit.rightsPrice,
          otherPrice: historyModal.unit.otherPrice,
        } : undefined}
        history={historyModal.unit?.priceHistory ?? []}
      />
      </div>
    )
  }

  // ═══════════════════════════════════════
  // DEFAULT MODE: main plan (with or without stages)
  // ═══════════════════════════════════════
  return (
    <div className="w-full space-y-6">
      {/* Stage filter tabs (only in no-stage mode when units have stage field) */}
      {!hasStages && stageFilterOptions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveStage('all')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeStage === 'all' ? 'text-white shadow-sm' : 'border border-border/60 hover:bg-secondary/50'}`}
            style={activeStage === 'all' ? { backgroundColor: '#6E2E2A' } : { color: '#3E1718' }}
          >
            Wszystkie etapy
          </button>
          {stageFilterOptions.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStage(s)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeStage === s ? 'text-white shadow-sm' : 'border border-border/60 hover:bg-secondary/50'}`}
              style={activeStage === s ? { backgroundColor: '#6E2E2A' } : { color: '#3E1718' }}
            >
              Etap {s}
            </button>
          ))}
        </div>
      )}

      {!hasStages && planViews.length > 0 && !activeView && (
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: '#6E2E2A' }}>
            Kliknij na obszar na planie lub użyj strzałek, aby zobaczyć działki
          </p>
        </div>
      )}

      {/* MAP VIEW */}
      <div className="max-w-[74rem] mx-auto space-y-5">
        {/* Status legend, Filter button, and Stage navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(([s, cfg]) => (
              <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.fill }} />
                {cfg.label}: {counts[s as keyof typeof counts]}
              </span>
            ))}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)', color: '#6E2E2A' }}
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Filtry</span>
              {hasFilters && (
                <span className="px-1.5 py-0.5 text-xs text-white rounded-full font-medium" style={{ backgroundColor: '#6E2E2A' }}>
                  {filteredUnits.length}/{displayUnits.length}
                </span>
              )}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {hasStages && !activeStageId && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)', color: '#6E2E2A' }}
                disabled
              >
                Osiedle
              </button>
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => {
                    setActiveStageId(stage.id)
                    setActiveStageViewId(stage.stageViews[0]?.id ?? null)
                    setSelectedUnit(null)
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border border-border/60 hover:bg-secondary/50"
                  style={{ color: '#3E1718' }}
                >
                  {stage.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {filtersOpen && <FilterPanel {...{ filterStatus, setFilterStatus, filterRooms, setFilterRooms, roomOptions, filterAreaMin, setFilterAreaMin, filterAreaMax, setFilterAreaMax, filterGardenMin, setFilterGardenMin, filterGardenMax, setFilterGardenMax, hasFilters, clearFilters, filteredUnits, totalCount: displayUnits.length }} />}

        <div className="relative">
            <NorthCompass angle={activeNorthAngle} />
            {activeView ? (
              hasStages ? (
                /* Stage mode + plan view: navigational polygons → click to enter stage */
                viewNavHtml ? (
                  <>
                    <div
                      ref={svgRef}
                      className={`border border-border/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out ${
                        isAnimating
                          ? slideDirection === 'left' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
                          : 'opacity-100 translate-x-0'
                      }`}
                      style={defaultMapAspect ? { aspectRatio: defaultMapAspect } : undefined}
                      onClick={handleViewStageClick}
                      onMouseMove={handleViewStageMove}
                      onMouseLeave={() => { setStageTooltip(null) }}
                      dangerouslySetInnerHTML={{ __html: viewNavHtml }}
                    />
                    {stageTooltip && (
                      <div
                        className="absolute bottom-4 left-4 z-10 pointer-events-none rounded-xl shadow-xl p-4 text-sm min-w-[160px]"
                        style={{ backgroundColor: 'rgba(62, 23, 24, 0.93)' }}
                      >
                        <div className="font-serif font-semibold text-base text-white">{stageTooltip.stage.name}</div>
                        <div className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          {stageTooltip.stage.stageViews.length} {stageTooltip.stage.stageViews.length === 1 ? 'widok' : 'widoków'}
                        </div>
                        <div className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Kliknij aby zobaczyć
                        </div>
                      </div>
                    )}
                  </>
                ) : activeView.imageUrl ? (
                  <div
                    className={`border border-border/60 rounded-2xl overflow-hidden shadow-sm bg-secondary/10 transition-all duration-300 ease-out ${
                      isAnimating
                        ? slideDirection === 'left' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
                        : 'opacity-100 translate-x-0'
                    }`}
                    style={defaultMapAspect ? { aspectRatio: defaultMapAspect } : undefined}
                  >
                    <img src={activeView.imageUrl} alt={resolveAlt(activeView.name, sitePlanAlt(projectName ?? '', activeView.imageUrl ?? ''))} onLoad={applyIntrinsicSize} className="block w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-2xl p-16 text-center bg-secondary/30">
                    <p className="text-base" style={{ color: '#3E1718', opacity: 0.6 }}>Brak zawartości dla tego widoku.</p>
                  </div>
                )
              ) : (
                /* No-stage mode: showing a plan view (Dodatkowe widoki) with Działki polygons */
                viewSvgHtml ? (
                  <>
                    <div
                      className={`border border-border/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out ${
                        isAnimating
                          ? slideDirection === 'left' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
                          : 'opacity-100 translate-x-0'
                      }`}
                      style={defaultMapAspect ? { aspectRatio: defaultMapAspect } : undefined}
                      onClick={handleViewSvgClick}
                      onMouseMove={handleStageViewMove}
                      onMouseLeave={() => { setHoveredUnit(null); setTooltip(null) }}
                      dangerouslySetInnerHTML={{ __html: viewSvgHtml }}
                    />
                    {(selectedUnit || tooltip) && <UnitTooltip unit={selectedUnit ?? tooltip!.unit} onPdfClick={selectedUnit?.houseType ? () => openPdf(pdfUrl(slug, selectedUnit), [projectName, selectedUnit.label].filter(Boolean).join(' — ')) : undefined} className="hidden sm:block" />}
                  </>
                ) : activeView.imageUrl ? (
                  <div
                    className={`border border-border/60 rounded-2xl overflow-hidden shadow-sm bg-secondary/10 transition-all duration-300 ease-out ${
                      isAnimating
                        ? slideDirection === 'left' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
                        : 'opacity-100 translate-x-0'
                    }`}
                    style={defaultMapAspect ? { aspectRatio: defaultMapAspect } : undefined}
                  >
                    <img src={activeView.imageUrl} alt={resolveAlt(activeView.name, sitePlanAlt(projectName ?? '', activeView.imageUrl ?? ''))} onLoad={applyIntrinsicSize} className="block w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-2xl p-16 text-center bg-secondary/30">
                    <p className="text-base" style={{ color: '#3E1718', opacity: 0.6 }}>Brak zawartości dla tego widoku.</p>
                  </div>
                )
              )
            ) : hasStages ? (
              /* Stage mode: main plan with stage polygons */
              data.svgContent ? (
                <>
                  <div
                    ref={svgRef}
                    className={`border border-border/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out ${
                      isAnimating
                        ? slideDirection === 'left' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
                        : 'opacity-100 translate-x-0'
                    }`}
                    style={defaultMapAspect ? { aspectRatio: defaultMapAspect } : undefined}
                    onClick={handleStagePlanClick}
                    onMouseMove={handleStagePlanMove}
                    onMouseLeave={() => { setStageTooltip(null) }}
                    dangerouslySetInnerHTML={{ __html: stagePlanHtml }}
                  />
                  {stageTooltip && (
                    <div
                      className="absolute bottom-4 left-4 z-10 pointer-events-none rounded-xl shadow-xl p-4 text-sm min-w-[160px]"
                      style={{ backgroundColor: 'rgba(62, 23, 24, 0.93)' }}
                    >
                      <div className="font-serif font-semibold text-base text-white">{stageTooltip.stage.name}</div>
                      <div className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {stageTooltip.stage.stageViews.length} {stageTooltip.stage.stageViews.length === 1 ? 'widok' : 'widoków'}
                      </div>
                      <div className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Kliknij aby zobaczyć
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="border border-border/60 rounded-2xl p-16 text-center bg-secondary/30">
                  <p className="text-base" style={{ color: '#3E1718', opacity: 0.6 }}>Plan zagospodarowania nie jest jeszcze dostępny.</p>
                </div>
              )
            ) : data.svgContent ? (
              /* No-stage: main plan has direct Działki interaction */
              <>
                <div
                  ref={svgRef}
                  className={`border border-border/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out ${
                    isAnimating
                      ? slideDirection === 'left' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
                      : 'opacity-100 translate-x-0'
                  }`}
                  style={defaultMapAspect ? { aspectRatio: defaultMapAspect } : undefined}
                  onClick={handleSvgClick}
                  onMouseMove={handleSvgMove}
                  onMouseLeave={() => { setHoveredUnit(null); setTooltip(null) }}
                  dangerouslySetInnerHTML={{ __html: mainSvgHtml }}
                />
                {(selectedUnit || tooltip) && <UnitTooltip unit={selectedUnit ?? tooltip!.unit} onPdfClick={selectedUnit?.houseType ? () => openPdf(pdfUrl(slug, selectedUnit), [projectName, selectedUnit.label].filter(Boolean).join(' — ')) : undefined} className="hidden sm:block" />}
              </>
            ) : (
              <div className="border border-border/60 rounded-2xl p-16 text-center bg-secondary/30">
                <p className="text-base" style={{ color: '#3E1718', opacity: 0.6 }}>Plan zagospodarowania nie jest jeszcze dostępny.</p>
              </div>
            )}

            {/* Navigation arrows for no-stage plan views */}
            {showViewNavigation && (
              <>
                <button
                  onClick={goToPrevView}
                  className="absolute left-2 top-2 sm:left-3 sm:top-4 z-20 flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all shadow-sm text-white cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: 'rgba(62, 23, 24, 0.7)' }}
                  aria-label="Poprzedni widok"
                  title={allViews[(currentViewIndex > 0 ? currentViewIndex - 1 : allViews.length - 1)]?.name}
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={goToNextView}
                  className="absolute right-2 top-2 sm:right-3 sm:top-4 z-20 flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all shadow-sm text-white cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: 'rgba(62, 23, 24, 0.7)' }}
                  aria-label="Następny widok"
                  title={allViews[(currentViewIndex < allViews.length - 1 ? currentViewIndex + 1 : 0)]?.name}
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </button>
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-white text-[11px] sm:text-sm font-medium shadow-sm" style={{ backgroundColor: 'rgba(62, 23, 24, 0.8)' }}>
                  <span>{allViews[currentViewIndex]?.name}</span>
                  <span className="text-white/70">({currentViewIndex + 1}/{allViews.length})</span>
                </div>
              </>
            )}
          </div>

          {/* Mobile-only: unit tooltip below image */}
          {(selectedUnit || tooltip) && (
            <UnitTooltip
              unit={selectedUnit ?? tooltip!.unit}
              onPdfClick={selectedUnit?.houseType ? () => openPdf(pdfUrl(slug, selectedUnit), [projectName, selectedUnit.label].filter(Boolean).join(' — ')) : undefined}
              variant="inline"
              className="sm:hidden"
            />
          )}

          {/* Unit table */}
          <UnitTable {...{ sortedUnits, selectedUnit, setSelectedUnit, handleSort, SortIcon, projectName, slug, onContactClick: (subject: string) => setContactModal({ open: true, subject }), onPdfClick: (u: Unit) => openPdf(pdfUrl(slug, u), [projectName, u.label].filter(Boolean).join(' — ')), onHistoryClick: (u: Unit) => setHistoryModal({ open: true, unit: u }) }} />
          {selectedUnit && <UnitDetailCard unit={selectedUnit} onClose={() => setSelectedUnit(null)} onContactClick={() => setContactModal({ open: true, subject: [projectName, selectedUnit.label].filter(Boolean).join(' — ') })} onPdfClick={() => openPdf(pdfUrl(slug, selectedUnit), [projectName, selectedUnit.label].filter(Boolean).join(' — '))} />}
      </div>

      {/* Visualization disclaimers — after the schema, before house types */}
      <VisualizationFootnotes />

      {/* House Types Section */}
      <HouseTypesCarousel data={data} activeHouseTypeIndex={activeHouseTypeIndex} setActiveHouseTypeIndex={setActiveHouseTypeIndex} activeFloor={activeFloor} setActiveFloor={setActiveFloor} floorView={floorView} setFloorView={setFloorView} projectName={projectName} />
      <ContactModal isOpen={contactModal.open} onClose={() => setContactModal({ open: false, subject: '' })} subject={contactModal.subject} />
      <PdfModal isOpen={pdfModal.open} onClose={() => setPdfModal({ open: false, url: '', title: '' })} pdfUrl={pdfModal.url} title={pdfModal.title} />
      <PriceHistoryModal
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, unit: null })}
        title={[projectName, historyModal.unit?.label].filter(Boolean).join(' — ')}
        area={historyModal.unit?.area ?? null}
        currentPrice={historyModal.unit?.price ?? null}
        currentExtras={historyModal.unit ? {
          parkingPrice: historyModal.unit.parkingPrice,
          storagePrice: historyModal.unit.storagePrice,
          rightsPrice: historyModal.unit.rightsPrice,
          otherPrice: historyModal.unit.otherPrice,
        } : undefined}
        history={historyModal.unit?.priceHistory ?? []}
      />
    </div>
  )
}

// ═══ Extracted sub-components ═══

function UnitTooltip({ unit, onPdfClick, variant = 'overlay', className = '' }: { unit: Unit; onPdfClick?: () => void; variant?: 'overlay' | 'inline'; className?: string }) {
  const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
  const canShowPdf = !!onPdfClick && !!unit.houseType
  const outer = variant === 'overlay'
    ? 'absolute bottom-4 right-4 z-10 rounded-2xl shadow-2xl p-5 min-w-[200px] max-w-[240px]'
    : 'rounded-2xl shadow-lg p-4 w-full'
  return (
    <div
      className={`${outer} ${canShowPdf ? '' : 'pointer-events-none'} ${className}`}
      style={{ backgroundColor: 'rgba(62, 23, 24, 0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="font-serif font-bold text-lg text-white">{unit.label}</div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${cfg.bg} ${cfg.text}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.fill }} />
          {cfg.label}
        </div>
      </div>
      <div className="space-y-1.5 mb-3">
        {unit.area != null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Powierzchnia</span>
            <span className="text-sm font-semibold text-white">{unit.area} m²</span>
          </div>
        )}
        {unit.gardenArea != null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Ogród</span>
            <span className="text-sm font-semibold text-white">{unit.gardenArea} m²</span>
          </div>
        )}
        {unit.rooms != null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Pokoje</span>
            <span className="text-sm font-semibold text-white">{unit.rooms}</span>
          </div>
        )}
        {unit.floors != null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Kondygnacje</span>
            <span className="text-sm font-semibold text-white">{unit.floors}</span>
          </div>
        )}
        {unit.price != null && (
          <div className="pt-1 mt-1 border-t border-white/10">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Cena</span>
              <span className="text-sm font-bold text-white">
                {unit.status === 'sold' ? '—' : fmt(fullPriceOf(unit))}
              </span>
            </div>
            {unit.status !== 'sold' && (
              <div className="text-right">
                {unit.area ? <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{Math.round(unit.price / unit.area).toLocaleString('pl-PL')} zł/m²</div> : null}
                {(() => {
                  const ex = extrasLine(unit)
                  return ex ? <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{ex}</div> : null
                })()}
              </div>
            )}
          </div>
        )}
      </div>
      {canShowPdf && (
        <button
          onClick={(e) => { e.stopPropagation(); onPdfClick!() }}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white transition-colors bg-white/15 hover:bg-white/25 cursor-pointer"
        >
          <FileDown className="h-3.5 w-3.5" />
          Plan PDF
        </button>
      )}
    </div>
  )
}

function FilterPanel({ filterStatus, setFilterStatus, filterRooms, setFilterRooms, roomOptions, filterAreaMin, setFilterAreaMin, filterAreaMax, setFilterAreaMax, filterGardenMin, setFilterGardenMin, filterGardenMax, setFilterGardenMax, hasFilters, clearFilters, filteredUnits, totalCount }: {
  filterStatus: string; setFilterStatus: (v: string) => void
  filterRooms: string; setFilterRooms: (v: string) => void
  roomOptions: number[]
  filterAreaMin: string; setFilterAreaMin: (v: string) => void
  filterAreaMax: string; setFilterAreaMax: (v: string) => void
  filterGardenMin: string; setFilterGardenMin: (v: string) => void
  filterGardenMax: string; setFilterGardenMax: (v: string) => void
  hasFilters: boolean; clearFilters: () => void
  filteredUnits: Unit[]; totalCount: number
}) {
  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm p-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-7 text-xs border-border/60 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Wszystkie</SelectItem>
            <SelectItem value="available" className="text-xs">Dostępna</SelectItem>
            <SelectItem value="reserved" className="text-xs">Rezerwacja</SelectItem>
            <SelectItem value="sold" className="text-xs">Sprzedana</SelectItem>
          </SelectContent>
        </Select>
        {roomOptions.length > 0 && (
          <Select value={filterRooms} onValueChange={setFilterRooms}>
            <SelectTrigger className="h-7 text-xs border-border/60 bg-background"><SelectValue placeholder="Pokoje" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Wszystkie</SelectItem>
              {roomOptions.map((r) => (
                <SelectItem key={r} value={String(r)} className="text-xs">{r} pokoje</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input className="h-7 text-xs border-border/60 bg-background" placeholder="Pow. min m²" value={filterAreaMin} onChange={(e) => setFilterAreaMin(e.target.value)} type="number" />
        <Input className="h-7 text-xs border-border/60 bg-background" placeholder="Pow. max m²" value={filterAreaMax} onChange={(e) => setFilterAreaMax(e.target.value)} type="number" />
        <Input className="h-7 text-xs border-border/60 bg-background" placeholder="Ogród min m²" value={filterGardenMin} onChange={(e) => setFilterGardenMin(e.target.value)} type="number" />
        <Input className="h-7 text-xs border-border/60 bg-background" placeholder="Ogród max m²" value={filterGardenMax} onChange={(e) => setFilterGardenMax(e.target.value)} type="number" />
      </div>
      {hasFilters && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
          <p className="text-xs" style={{ color: '#3E1718', opacity: 0.7 }}>
            Pokazuje {filteredUnits.length} z {totalCount} nieruchomości
          </p>
          <button onClick={clearFilters} className="text-xs flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: '#6E2E2A' }}>
            <X className="h-3 w-3" /> Wyczyść filtry
          </button>
        </div>
      )}
    </div>
  )
}

function UnitTable({ sortedUnits, selectedUnit, setSelectedUnit, handleSort, SortIcon, onContactClick, onPdfClick, onHistoryClick, projectName, slug }: {
  sortedUnits: Unit[]; selectedUnit: Unit | null; setSelectedUnit: (fn: ((p: Unit | null) => Unit | null)) => void
  onHistoryClick: (unit: Unit) => void
  handleSort: (key: SortKey) => void; SortIcon: React.ComponentType<{ k: SortKey }>
  onContactClick: (subject: string) => void; onPdfClick: (unit: Unit) => void; projectName?: string; slug: string
}) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Mobile: compact table with expandable rows */}
      <div className="sm:hidden">
        <table className="w-full text-xs table-fixed">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '26%' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-border/60 bg-secondary/50">
              {([
                ['label', 'Nr'],
                ['area', 'Pow.'],
                ['price', 'Cena'],
                ['status', 'Status'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  className="px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide cursor-pointer select-none"
                  style={{ color: '#3E1718' }}
                  onClick={() => handleSort(key)}
                >
                  <span className="inline-flex items-center">{label}<SortIcon k={key} /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sortedUnits.map((unit) => {
              const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
              const unitLow30 = lowest30DayPrice(unit)
              const isSelected = selectedUnit?.id === unit.id
              return (
                <Fragment key={unit.id}>
                  <tr
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-secondary/50' : 'active:bg-secondary/30'}`}
                    onClick={() => setSelectedUnit((p) => p?.id === unit.id ? null : unit)}
                  >
                    <td className="px-2 py-2.5 font-semibold align-top" style={{ color: '#3E1718' }}>{unit.label}</td>
                    <td className="px-2 py-2.5 align-top" style={{ color: '#3E1718', opacity: 0.85 }}>{unit.area != null ? `${unit.area} m²` : '—'}</td>
                    <td className="px-2 py-2.5 align-top">
                      <div className="font-semibold leading-tight" style={{ color: '#6E2E2A' }}>
                        {unit.status === 'sold' || !unit.price ? '—' : fmt(fullPriceOf(unit))}
                      </div>
                      {unit.status !== 'sold' && unit.price != null && unit.area ? (
                        <div className="text-[10px] mt-0.5" style={{ color: '#6E2E2A', opacity: 0.7 }}>
                          {Math.round(unit.price / unit.area).toLocaleString('pl-PL')} zł/m²
                        </div>
                      ) : null}
                    </td>
                    <td className="px-2 py-2.5 align-top">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.fill }} />
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                  {isSelected && (
                    <tr className="bg-secondary/30">
                      <td colSpan={4} className="px-3 py-3">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#3E1718', opacity: 0.5 }}>Ogród</div>
                            <div style={{ color: '#3E1718' }}>{unit.gardenArea != null ? `${unit.gardenArea} m²` : '—'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#3E1718', opacity: 0.5 }}>Pokoje</div>
                            <div style={{ color: '#3E1718' }}>{unit.rooms ?? '—'}</div>
                          </div>
                          {(() => {
                            const ex = extrasLine(unit)
                            return ex ? (
                              <div className="col-span-2">
                                <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#3E1718', opacity: 0.5 }}>Dodatki</div>
                                <div className="text-[11px]" style={{ color: '#3E1718', opacity: 0.8 }}>{ex}</div>
                              </div>
                            ) : null
                          })()}
                          {unitLow30 != null && (
                            <div className="col-span-2 text-[10px]" style={{ color: '#3E1718', opacity: 0.6 }}>
                              Najniższa cena z 30 dni: <span style={{ textDecoration: 'line-through' }}>{fmt(unitLow30)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-3">
                          {unit.price != null && unit.status !== 'sold' && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onHistoryClick(unit) }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
                              style={{ color: '#6E2E2A', border: '1px solid rgba(110,46,42,0.3)' }}
                            >
                              <History className="h-3.5 w-3.5" />
                              Historia
                            </button>
                          )}
                          {unit.houseType && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onPdfClick(unit); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
                              style={{ color: '#6E2E2A', border: '1px solid rgba(110,46,42,0.3)' }}
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              PDF
                            </button>
                          )}
                          {unit.status !== 'sold' && (
                            <Button
                              size="sm"
                              className="h-8 text-xs font-medium rounded-lg ml-auto"
                              style={{ backgroundColor: '#6E2E2A' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                onContactClick([projectName, unit.label].filter(Boolean).join(' — '))
                              }}
                            >
                              <Mail className="h-3.5 w-3.5 mr-1.5" />
                              Zapytaj
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {sortedUnits.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm" style={{ color: '#3E1718', opacity: 0.5 }}>
                  Brak wyników dla wybranych filtrów
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Desktop: full table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/50">
              {([
                ['label', 'Nr domu'],
                ['area', 'Pow. m²'],
                ['gardenArea', 'Ogród m²'],
                ['rooms', 'Pokoje'],
                ['price', 'Cena'],
                ['pricePerM2', 'Cena/m²'],
                ['status', 'Status'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none transition-colors hover:opacity-80"
                  style={{ color: '#3E1718' }}
                  onClick={() => handleSort(key)}
                >
                  <span className="flex items-center">{label}<SortIcon k={key} /></span>
                </th>
              ))}
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#3E1718' }}>Typ</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#3E1718' }}>Plan</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sortedUnits.map((unit) => {
              const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
              const unitLow30 = lowest30DayPrice(unit)
              return (
                <tr
                  key={unit.id}
                  className={`hover:bg-secondary/30 transition-colors cursor-pointer ${selectedUnit?.id === unit.id ? 'bg-secondary/50' : ''}`}
                  onClick={() => setSelectedUnit((p) => p?.id === unit.id ? null : unit)}
                >
                  <td className="px-5 py-4 font-semibold" style={{ color: '#3E1718' }}>{unit.label}</td>
                  <td className="px-5 py-4" style={{ color: '#3E1718', opacity: 0.8 }}>{unit.area ? `${unit.area}` : '—'}</td>
                  <td className="px-5 py-4" style={{ color: '#3E1718', opacity: 0.8 }}>{unit.gardenArea ? `${unit.gardenArea}` : '—'}</td>
                  <td className="px-5 py-4" style={{ color: '#3E1718', opacity: 0.8 }}>{unit.rooms ?? '—'}</td>
                  <td className="px-5 py-4 font-semibold" style={{ color: '#6E2E2A' }}>
                    <div className="flex items-center gap-2">
                      <span>{unit.status === 'sold' || !unit.price ? '—' : fmt(fullPriceOf(unit))}</span>
                      {unit.price != null && unit.status !== 'sold' && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onHistoryClick(unit) }}
                          className="inline-flex items-center justify-center h-6 w-6 rounded-md border transition-colors hover:bg-secondary/60"
                          style={{ borderColor: 'rgba(110,46,42,0.3)', color: '#6E2E2A' }}
                          title="Historia cen"
                          aria-label="Historia cen"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {(() => {
                      const ex = extrasLine(unit)
                      return ex ? <div className="text-[10px] font-normal mt-0.5" style={{ color: '#3E1718', opacity: 0.65 }}>{ex}</div> : null
                    })()}
                    {unitLow30 != null && (
                      <div
                        className="text-[10px] font-normal mt-0.5"
                        style={{ color: '#3E1718', opacity: 0.6 }}
                        title="Najniższa cena z ostatnich 30 dni przed obniżką"
                      >
                        <span style={{ textDecoration: 'line-through' }}>{fmt(unitLow30)}</span>
                        <span className="ml-1">(30 dni)</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4" style={{ color: '#6E2E2A', opacity: 0.75 }}>
                    {unit.status === 'sold' || !unit.price || !unit.area ? '—' : `${Math.round(unit.price / unit.area).toLocaleString('pl-PL')} zł`}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.fill }} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#6E2E2A' }}>{unit.houseType?.name ?? '—'}</td>
                  <td className="px-5 py-4">
                    {unit.houseType && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onPdfClick(unit); }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
                        style={{ color: '#6E2E2A', border: '1px solid rgba(110,46,42,0.3)' }}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {unit.status !== 'sold' && (
                      <Button
                        size="sm"
                        className="h-8 text-xs whitespace-nowrap font-medium rounded-lg"
                        style={{ backgroundColor: '#6E2E2A' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onContactClick([projectName, unit.label].filter(Boolean).join(' — '))
                        }}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        Zapytaj
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
            {sortedUnits.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-16 text-center" style={{ color: '#3E1718', opacity: 0.5 }}>
                  Brak wyników dla wybranych filtrów
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Disclaimers shown on every investment page, between the "Schemat inwestycji"
// section and "Typy domów" — visualizations (renders, brick colour) are
// indicative only.
function VisualizationFootnotes() {
  return (
    <div className="max-w-[74rem] mx-auto pt-10 space-y-1.5">
      <p className="text-xs leading-relaxed" style={{ color: '#3E1718', opacity: 0.55 }}>
        * Kolorystyka cegły zaprezentowana na wizualizacjach ma charakter poglądowy i nie stanowi ostatecznego odwzorowania kolorów użytych w realizacji inwestycji.
      </p>
      <p className="text-xs leading-relaxed" style={{ color: '#3E1718', opacity: 0.55 }}>
        * Prezentowane wizualizacje mają charakter wyłącznie poglądowy i nie stanowią odwzorowania wszystkich elementów projektowych ani technicznych.
      </p>
    </div>
  )
}

function HouseTypesCarousel({ data, activeHouseTypeIndex, setActiveHouseTypeIndex, activeFloor, setActiveFloor, floorView, setFloorView, projectName }: {
  data: ProjectData; activeHouseTypeIndex: number; setActiveHouseTypeIndex: (v: number) => void
  activeFloor: number; setActiveFloor: (v: number) => void; floorView: '3d' | '2d'; setFloorView: (v: '3d' | '2d') => void
  projectName?: string
}) {
  if (data.houseTypes.length === 0) return null
  const currentType = data.houseTypes[activeHouseTypeIndex]
  const currentFloor = currentType?.floorPlans[activeFloor]

  return (
    <div className="space-y-5 pt-4">
      <div className="text-center mb-8">
        <h3 className="font-serif text-2xl lg:text-3xl font-semibold mb-2" style={{ color: '#3E1718' }}>
          Typy domów
        </h3>
        <p className="text-muted-foreground text-sm">
          Wybierz typ domu dopasowany do Twoich potrzeb
        </p>
      </div>

      <div className="relative max-w-[74rem] mx-auto">
        {data.houseTypes.length > 1 && (
          <>
            <button
              onClick={() => { setActiveHouseTypeIndex((activeHouseTypeIndex === 0 ? data.houseTypes.length - 1 : activeHouseTypeIndex - 1)); setActiveFloor(0); setFloorView('3d'); }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 z-10 w-10 h-10 flex items-center justify-center rounded-sm transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(110, 46, 42, 0.7)' }}
              aria-label="Poprzedni typ"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => { setActiveHouseTypeIndex((activeHouseTypeIndex === data.houseTypes.length - 1 ? 0 : activeHouseTypeIndex + 1)); setActiveFloor(0); setFloorView('3d'); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 z-10 w-10 h-10 flex items-center justify-center rounded-sm transition-all hover:opacity-80"
              style={{ backgroundColor: '#3E1718' }}
              aria-label="Następny typ"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-secondary/50">
            <h4 className="font-serif text-xl lg:text-2xl font-semibold" style={{ color: '#3E1718' }}>
              {currentType.name}
            </h4>
            <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#6E2E2A' }}>
              {currentType.totalArea ? `${currentType.totalArea} m²` : ''}
            </span>
          </div>

          {currentType.floorPlans.length > 0 ? (
            <div className="flex flex-col lg:flex-row">
              <div className="lg:flex-[2] p-5">
                <div className="flex gap-6 mb-6">
                  {currentType.floorPlans.map((floor, index) => (
                    <button
                      key={floor.id}
                      onClick={() => { setActiveFloor(index); setFloorView('3d'); }}
                      className={`text-left pb-1 transition-all ${activeFloor === index ? 'border-b-2' : ''}`}
                      style={activeFloor === index ? { borderColor: '#6E2E2A' } : {}}
                    >
                      <p className="font-medium" style={{ color: activeFloor === index ? '#3E1718' : '#999' }}>{floor.name}</p>
                      {floor.area && <p className="text-sm" style={{ color: activeFloor === index ? '#6E2E2A' : '#bbb' }}>{floor.area} m²</p>}
                    </button>
                  ))}
                </div>

                {currentFloor && (currentFloor.image3dUrl || currentFloor.image2dUrl) && (
                  <>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                      <img
                        src={floorView === '3d'
                          ? (currentFloor.image3dUrl ?? currentFloor.image2dUrl ?? '')
                          : (currentFloor.image2dUrl ?? currentFloor.image3dUrl ?? '')}
                        alt={resolveAlt(
                          `${currentType.name} - ${currentFloor.name} Rzut ${floorView === '3d' ? '3D' : '2D'}`,
                          houseTypeAlt(projectName ?? '', currentFloor.image3dUrl ?? currentFloor.image2dUrl ?? ''),
                        )}
                        onLoad={applyIntrinsicSize}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex mt-4">
                      {currentFloor.image3dUrl && (
                        <button
                          onClick={() => setFloorView('3d')}
                          className={`px-4 py-2 text-sm font-medium transition-all ${!currentFloor.image2dUrl ? 'rounded-lg' : 'rounded-l-lg'}`}
                          style={floorView === '3d'
                            ? { backgroundColor: '#6E2E2A', color: '#fff' }
                            : { backgroundColor: 'transparent', color: '#3E1718', border: '1px solid', borderColor: 'rgba(0,0,0,0.15)' }}
                        >
                          Rzut 3D
                        </button>
                      )}
                      {currentFloor.image2dUrl && (
                        <button
                          onClick={() => setFloorView('2d')}
                          className={`px-4 py-2 text-sm font-medium transition-all ${!currentFloor.image3dUrl ? 'rounded-lg' : 'rounded-r-lg'}`}
                          style={floorView === '2d'
                            ? { backgroundColor: '#6E2E2A', color: '#fff' }
                            : { backgroundColor: 'transparent', color: '#3E1718', border: '1px solid', borderColor: 'rgba(0,0,0,0.15)' }}
                        >
                          Rzut 2D
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="lg:flex-[1] p-5 lg:border-l border-border/40">
                {currentFloor && currentFloor.rooms.length > 0 && (
                  <div>
                    <div className="flex justify-between mb-3 text-sm font-medium" style={{ color: '#3E1718' }}>
                      <span>Pomieszczenie</span>
                      <span>Powierzchnia</span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {currentFloor.rooms.map((room, index) => (
                        <div key={room.id} className="flex justify-between py-2">
                          <span className="text-sm" style={{ color: '#3E1718', opacity: 0.8 }}>
                            <span className="inline-block w-5">{room.number ?? index + 1}</span>
                            {room.name}
                          </span>
                          <span className="text-sm" style={{ color: '#3E1718' }}>
                            {room.area ? `${room.area} m²` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                    {currentFloor.area && (
                      <div className="flex justify-between mt-3 pt-3 border-t border-border/60">
                        <span className="text-sm font-semibold" style={{ color: '#3E1718' }}>Razem</span>
                        <span className="text-sm font-semibold" style={{ color: '#6E2E2A' }}>{currentFloor.area} m²</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center" style={{ color: '#3E1718', opacity: 0.5 }}>
              Brak planów kondygnacji dla tego typu domu.
            </div>
          )}
        </div>

        {data.houseTypes.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {data.houseTypes.map((_, index) => (
              <button
                key={index}
                onClick={() => { setActiveHouseTypeIndex(index); setActiveFloor(0); setFloorView('3d'); }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${activeHouseTypeIndex === index ? '' : 'opacity-40'}`}
                style={{ backgroundColor: '#6E2E2A' }}
                aria-label={`Typ domu ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UnitDetailCard({ unit, onClose, onContactClick, onPdfClick }: { unit: Unit; onClose: () => void; onContactClick: () => void; onPdfClick: () => void }) {
  const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
  const [historyOpen, setHistoryOpen] = useState(false)
  const omnibusLow = lowest30DayPrice(unit)
  const historyDesc = useMemo(() => {
    if (!unit.priceHistory) return []
    return [...unit.priceHistory]
      .filter(h => h.totalPrice != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [unit.priceHistory])
  return (
    <div className="border-2 rounded-2xl overflow-hidden bg-card shadow-sm" style={{ borderColor: '#6E2E2A' }}>
      <div className="flex items-start justify-between p-5 bg-secondary/30 border-b border-border/60">
        <div>
          <h3 className="text-xl font-serif font-semibold" style={{ color: '#3E1718' }}>{unit.label}</h3>
          {unit.houseType && <p className="text-sm mt-0.5" style={{ color: '#6E2E2A' }}>{unit.houseType.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" style={{ color: '#6E2E2A' }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
          {unit.area && <><dt style={{ color: '#3E1718', opacity: 0.6 }}>Powierzchnia</dt><dd className="font-semibold" style={{ color: '#3E1718' }}>{unit.area} m²</dd></>}
          {unit.gardenArea && <><dt style={{ color: '#3E1718', opacity: 0.6 }}>Ogród</dt><dd className="font-semibold" style={{ color: '#3E1718' }}>{unit.gardenArea} m²</dd></>}
          {unit.rooms && <><dt style={{ color: '#3E1718', opacity: 0.6 }}>Pokoje</dt><dd className="font-semibold" style={{ color: '#3E1718' }}>{unit.rooms}</dd></>}
          {unit.floor && <><dt style={{ color: '#3E1718', opacity: 0.6 }}>Piętro</dt><dd className="font-semibold" style={{ color: '#3E1718' }}>{unit.floor}</dd></>}
          {unit.price && <><dt style={{ color: '#3E1718', opacity: 0.6 }}>Cena</dt><dd className="font-semibold text-lg" style={{ color: '#6E2E2A' }}>{fmt(fullPriceOf(unit))}</dd></>}
          {unit.price && unit.area ? <><dt style={{ color: '#3E1718', opacity: 0.6 }}>Cena/m²</dt><dd className="font-semibold" style={{ color: '#6E2E2A' }}>{Math.round(unit.price / unit.area).toLocaleString('pl-PL')} zł</dd></> : null}
          {priceExtras(unit).map((e) => (
            <span key={e.label} className="contents">
              {e.label === 'parking' ? (
                <span className="col-span-2 italic" style={{ color: '#3E1718', opacity: 0.6 }}>Parking jest zawarty w cenie</span>
              ) : (
                <>
                  <dt style={{ color: '#3E1718', opacity: 0.6 }}>w tym {e.label}</dt>
                  <dd className="font-medium" style={{ color: '#3E1718', opacity: 0.85 }}>{fmt(e.amount)}</dd>
                </>
              )}
            </span>
          ))}
          {omnibusLow != null ? (
            <>
              <dt style={{ color: '#3E1718', opacity: 0.6 }}>Najniższa cena z 30 dni</dt>
              <dd className="font-semibold" style={{ color: '#3E1718', opacity: 0.7, textDecoration: 'line-through' }}>{fmt(omnibusLow)}</dd>
            </>
          ) : null}
        </dl>
        {historyDesc.length > 1 && (
          <div className="mb-5 border border-border/60 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setHistoryOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-secondary/30 hover:bg-secondary/50 transition-colors"
              style={{ color: '#3E1718' }}
            >
              <span>Historia cen ({historyDesc.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
            </button>
            {historyOpen && (
              <ul className="divide-y divide-border/40">
                {historyDesc.map((h, i) => (
                  <li key={h.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span style={{ color: '#3E1718', opacity: 0.7 }}>{fmtDate(h.date)}</span>
                    <span className={`font-semibold ${i === 0 ? '' : ''}`} style={{ color: i === 0 ? '#6E2E2A' : '#3E1718' }}>
                      {fmt(fullPriceOfHistory(h))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {unit.description && <p className="text-sm mb-5" style={{ color: '#3E1718', opacity: 0.8 }}>{unit.description}</p>}
        <div className="flex flex-col gap-2">
          {unit.houseType && (
            <button
              onClick={onPdfClick}
              className="w-full h-11 text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors hover:opacity-80"
              style={{ color: '#6E2E2A', border: '2px solid #6E2E2A' }}
            >
              <FileDown className="h-4 w-4" />
              Pobierz plan (PDF)
            </button>
          )}
          {unit.status !== 'sold' && (
            <Button
              className="w-full h-11 text-sm font-medium rounded-xl"
              style={{ backgroundColor: '#6E2E2A' }}
              onClick={onContactClick}
            >
              <Mail className="h-4 w-4 mr-2" />
              Zapytaj o tę nieruchomość
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
