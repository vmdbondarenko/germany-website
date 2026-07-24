'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Pencil, MousePointer2, Trash2, Upload, ZoomIn, ZoomOut, Maximize2, Loader2, Plus, X,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

type Point = { x: number; y: number }

type RefKind = 'unit' | 'stage'

interface ViewPolygon {
  id: string
  refKind: RefKind
  refId: string
  refLabel: string
  points: Point[]
}

interface PlanViewRecord {
  id: string
  name: string
  imageUrl: string | null
  svgContent: string | null
  order: number
}

interface MainPlanUnit {
  id: string
  label: string
  svgElementId: string
}

interface PlanStage {
  id: string
  name: string
  svgElementId: string
}

export interface AdminPlanViewEditorProps {
  projectId: string
  mainPlanUnits: MainPlanUnit[]
  stages: PlanStage[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const SNAP_PX = 10

function centroid(pts: Point[]): Point {
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length }
}

function parseSvgViewPolygons(svg: string): ViewPolygon[] {
  if (!svg || typeof window === 'undefined') return []
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const result: ViewPolygon[] = []
  doc.querySelectorAll('polygon').forEach(el => {
    const id = el.getAttribute('id') || ''
    const stageId = el.getAttribute('data-stage-id') || ''
    const unitId = el.getAttribute('data-unit-id') || ''
    const refKind: RefKind = stageId ? 'stage' : 'unit'
    const refId = stageId || unitId
    const refLabel = el.getAttribute('data-label') || ''
    const raw = el.getAttribute('points') || ''
    const points = raw.trim().split(/\s+/).flatMap(pair => {
      const [x, y] = pair.split(',').map(Number)
      return isFinite(x) && isFinite(y) ? [{ x, y }] : []
    })
    if (id && refId && points.length >= 3) result.push({ id, refKind, refId, refLabel, points })
  })
  return result
}

function buildViewSvg(polygons: ViewPolygon[], w: number, h: number): string {
  const inner = polygons
    .filter(p => p.points.length >= 3)
    .map(p => {
      const pts = p.points.map(pt => `${Math.round(pt.x)},${Math.round(pt.y)}`).join(' ')
      const refAttr = p.refKind === 'stage' ? 'data-stage-id' : 'data-unit-id'
      return `  <polygon id="${p.id}" ${refAttr}="${p.refId}" data-label="${p.refLabel}" points="${pts}" />`
    }).join('\n')
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">\n${inner}\n</svg>`
}

// ─── Sub-component: Single View Canvas ──────────────────────────────────────

function ViewCanvas({
  projectId, view, mainPlanUnits, stages, onViewUpdated,
}: {
  projectId: string
  view: PlanViewRecord
  mainPlanUnits: MainPlanUnit[]
  stages: PlanStage[]
  onViewUpdated: (updated: Partial<PlanViewRecord>) => void
}) {
  const stageMode = stages.length > 0
  const containerRef = useRef<HTMLDivElement>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const panOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const [tool, setTool] = useState<'draw' | 'select'>('draw')
  const [currentPts, setCurrentPts] = useState<Point[]>([])
  const currentPtsRef = useRef<Point[]>([])
  const syncCurrentPts = useCallback((pts: Point[]) => { currentPtsRef.current = pts; setCurrentPts(pts) }, [])
  const [mouseImg, setMouseImg] = useState<Point | null>(null)
  const [nearFirst, setNearFirst] = useState(false)
  const [viewPolygons, setViewPolygons] = useState<ViewPolygon[]>([])
  const [selectedPolyId, setSelectedPolyId] = useState<string | null>(null)
  const [hoveredPolyId, setHoveredPolyId] = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Pending polygon → ref (unit/stage) picker
  const [pendingPts, setPendingPts] = useState<Point[] | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  // ── Init ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (view.svgContent) {
      const doc = new DOMParser().parseFromString(view.svgContent, 'image/svg+xml')
      const vb = doc.querySelector('svg')?.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
      if (vb?.length === 4 && vb[2] > 0) setImgSize({ w: vb[2], h: vb[3] })
      setViewPolygons(parseSvgViewPolygons(view.svgContent))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load image size ──
  useEffect(() => {
    if (!view.imageUrl) return
    const img = new Image()
    img.onload = () => {
      const size = { w: img.naturalWidth, h: img.naturalHeight }
      setImgSize(size)
    }
    img.src = view.imageUrl
  }, [view.imageUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fit ──
  const fitImage = useCallback((size?: { w: number; h: number }) => {
    const s = size ?? imgSize
    if (!s || !containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const z = Math.min(r.width / s.w, r.height / s.h, 1) * 0.92
    setZoom(z)
    setPan({ x: (r.width - s.w * z) / 2, y: (r.height - s.h * z) / 2 })
  }, [imgSize])

  useEffect(() => { if (view.imageUrl && imgSize) requestAnimationFrame(() => fitImage()) }, [view.imageUrl, imgSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard ──
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') { setSpaceDown(true); e.preventDefault() }
      if (e.key === 'Escape') { syncCurrentPts([]); setPendingPts(null); setSelectedPolyId(null); setPickerOpen(false) }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPolyId) handleDeletePoly(selectedPolyId)
    }
    const onUp = (e: KeyboardEvent) => { if (e.code === 'Space') { setSpaceDown(false); isPanning.current = false } }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [selectedPolyId, syncCurrentPts]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Coordinate helpers ──
  const getXY = (e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const toImage = useCallback((cx: number, cy: number): Point => ({ x: (cx - pan.x) / zoom, y: (cy - pan.y) / zoom }), [pan, zoom])
  const toScreen = useCallback((ix: number, iy: number): Point => ({ x: ix * zoom + pan.x, y: iy * zoom + pan.y }), [pan, zoom])

  // ── Auto-save SVG ──
  const autoSaveSvg = useCallback(async (polys: ViewPolygon[]) => {
    if (!imgSize) return
    const svg = buildViewSvg(polys, imgSize.w, imgSize.h)
    await fetch(`/api/admin/projects/${projectId}/plan-views/${view.id}/svg`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svgContent: svg }),
    })
    onViewUpdated({ svgContent: svg })
  }, [projectId, view.id, imgSize, onViewUpdated])

  // ── Delete polygon ──
  const handleDeletePoly = useCallback((polyId: string) => {
    setViewPolygons(prev => { const next = prev.filter(p => p.id !== polyId); autoSaveSvg(next); return next })
    setSelectedPolyId(null)
    toast('Area deleted')
  }, [autoSaveSvg])

  // ── Confirm pick (unit or stage) ──
  const confirmPick = (refKind: RefKind, refId: string, refLabel: string) => {
    if (!pendingPts) return
    // Replace existing polygon for same ref (one polygon per ref per view)
    const newPoly: ViewPolygon = {
      id: `pv-${Date.now()}`,
      refKind,
      refId,
      refLabel,
      points: pendingPts,
    }
    setViewPolygons(prev => {
      const filtered = prev.filter(p => !(p.refKind === refKind && p.refId === refId))
      const next = [...filtered, newPoly]
      autoSaveSvg(next)
      return next
    })
    setPendingPts(null)
    setPickerOpen(false)
    setPickerSearch('')
    toast.success(`Dodano obszar: ${refLabel}`)
  }

  // ── Image upload ──
  const onImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingImg(true)
    try {
      const form = new FormData(); form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const url: string = data.url
      await fetch(`/api/admin/projects/${projectId}/plan-views/${view.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      })
      setImgSize(null)
      onViewUpdated({ imageUrl: url })
      toast.success('Image wgrane')
    } catch { toast.error('Upload error') }
    setUploadingImg(false); e.target.value = ''
  }

  // ── Viewport events ──
  // Use native wheel listener with { passive: false } to allow preventDefault
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12
      const z = zoomRef.current
      const nz = Math.min(Math.max(z * f, 0.04), 20)
      const r = nz / z
      setZoom(nz); setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) }))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (spaceDown && e.button === 0)) {
      e.preventDefault()
      const { x, y } = getXY(e)
      panOrigin.current = { mx: x, my: y, px: pan.x, py: pan.y }
      isPanning.current = true; return
    }
    if (e.button !== 0) return
    const { x: cx, y: cy } = getXY(e)
    const ip = toImage(cx, cy)

    if (tool === 'select') {
      let hit: string | null = null
      for (const poly of viewPolygons) {
        if (pointInPoly(ip, poly.points)) { hit = poly.id; break }
      }
      setSelectedPolyId(hit)
      return
    }

    // Draw tool
    if (nearFirst && currentPtsRef.current.length >= 3) {
      setPendingPts(currentPtsRef.current)
      syncCurrentPts([])
      setNearFirst(false)
      setPickerOpen(true)
      return
    }
    syncCurrentPts([...currentPtsRef.current, ip])
  }, [tool, spaceDown, pan, zoom, nearFirst, viewPolygons, toImage, syncCurrentPts])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const { x: cx, y: cy } = getXY(e)
    if (isPanning.current && panOrigin.current) {
      setPan({ x: panOrigin.current.px + cx - panOrigin.current.mx, y: panOrigin.current.py + cy - panOrigin.current.my })
      return
    }
    const ip = toImage(cx, cy)
    setMouseImg(ip)
    if (currentPtsRef.current.length >= 1) {
      const first = toScreen(currentPtsRef.current[0].x, currentPtsRef.current[0].y)
      const dx = cx - first.x, dy = cy - first.y
      setNearFirst(Math.hypot(dx, dy) < SNAP_PX && currentPtsRef.current.length >= 3)
    }
  }, [toImage, toScreen])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || spaceDown) { isPanning.current = false; panOrigin.current = null }
  }, [spaceDown])

  const iz = 1 / zoom
  const mappedRefIds = new Set(viewPolygons.filter(p => p.refKind === (stageMode ? 'stage' : 'unit')).map(p => p.refId))
  const pickerItems: { id: string; label: string }[] = stageMode
    ? stages.map(s => ({ id: s.id, label: s.name }))
    : mainPlanUnits.map(u => ({ id: u.id, label: u.label }))
  const filteredItems = pickerItems.filter(it =>
    !pickerSearch || it.label.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  if (!view.imageUrl) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
        <Upload className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500 mb-4">Upload an image for this view</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImgUpload} />
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadingImg}>
          {uploadingImg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload image
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <button
            className={`p-1.5 rounded-md transition-colors ${tool === 'draw' ? 'bg-white shadow-sm text-[#6E2E2A]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTool('draw')} title="Rysuj"
          ><Pencil className="h-4 w-4" /></button>
          <button
            className={`p-1.5 rounded-md transition-colors ${tool === 'select' ? 'bg-white shadow-sm text-[#6E2E2A]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTool('select')} title="Zaznacz"
          ><MousePointer2 className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => {
            const nz = Math.min(zoom * 1.25, 20); const r = nz / zoom
            if (containerRef.current) { const rc = containerRef.current.getBoundingClientRect(); const cx = rc.width / 2, cy = rc.height / 2; setZoom(nz); setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) })) }
          }}><ZoomIn className="h-3 w-3" /></Button>
          <span className="text-xs text-gray-500 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => {
            const nz = Math.max(zoom * 0.8, 0.04); const r = nz / zoom
            if (containerRef.current) { const rc = containerRef.current.getBoundingClientRect(); const cx = rc.width / 2, cy = rc.height / 2; setZoom(nz); setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) })) }
          }}><ZoomOut className="h-3 w-3" /></Button>
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => fitImage()} title="Dopasuj"><Maximize2 className="h-3 w-3" /></Button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImgUpload} />
        <Button size="sm" variant="outline" className="h-7" onClick={() => fileRef.current?.click()} disabled={uploadingImg}>
          {uploadingImg ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
          Change
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Canvas - full width */}
        <div
          ref={containerRef}
          className="relative bg-[#e8e8e8] rounded-xl overflow-hidden select-none"
          style={{ height: 450, cursor: spaceDown || isPanning.current ? 'grabbing' : tool === 'draw' ? 'crosshair' : 'default' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { isPanning.current = false; panOrigin.current = null; setMouseImg(null); setNearFirst(false) }}
        >
          <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
            {view.imageUrl && imgSize && (
              <img src={view.imageUrl} alt={view.name} style={{ display: 'block', width: imgSize.w, height: imgSize.h, maxWidth: 'none' }} draggable={false} />
            )}
            {imgSize && (
              <svg style={{ position: 'absolute', top: 0, left: 0, width: imgSize.w, height: imgSize.h, overflow: 'visible' }}>
                {/* Saved polygons */}
                {viewPolygons.map(poly => {
                  const pts = poly.points.map(p => `${p.x},${p.y}`).join(' ')
                  const isSelected = selectedPolyId === poly.id
                  const isHovered = hoveredPolyId === poly.id
                  const c = centroid(poly.points)
                  const fill = '#6E2E2A'
                  const fillOpacity = (isSelected || isHovered) ? 0.25 : 0
                  const stroke = 'transparent'
                  return (
                    <g
                      key={poly.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => tool === 'select' && setSelectedPolyId(poly.id)}
                      onMouseEnter={() => setHoveredPolyId(poly.id)}
                      onMouseLeave={() => setHoveredPolyId(null)}
                    >
                      <polygon
                        points={pts}
                        fill={fill}
                        fillOpacity={fillOpacity}
                        stroke={stroke}
                        strokeWidth={2 * iz}
                      />
                      {(isSelected || isHovered) && (
                        <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central"
                          fontSize={13 * iz} fontWeight="700" fill="#fff"
                          stroke="rgba(0,0,0,0.5)" strokeWidth={3 * iz} paintOrder="stroke"
                          style={{ userSelect: 'none', pointerEvents: 'none' }}
                        >{poly.refLabel}</text>
                      )}
                    </g>
                  )
                })}

                {/* In-progress polygon */}
                {currentPts.length > 0 && (
                  <g>
                    <polyline
                      points={[...currentPts, mouseImg || currentPts[currentPts.length - 1]].map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none" stroke="#6E2E2A" strokeWidth={2 * iz} strokeDasharray={`${6 * iz} ${3 * iz}`}
                    />
                    {currentPts.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={4 * iz} fill={i === 0 && nearFirst ? '#22c55e' : '#6E2E2A'} stroke="#fff" strokeWidth={1.5 * iz} />
                    ))}
                    {nearFirst && <circle cx={currentPts[0].x} cy={currentPts[0].y} r={8 * iz} fill="none" stroke="#22c55e" strokeWidth={2 * iz} opacity={0.6} />}
                  </g>
                )}
              </svg>
            )}
          </div>

          {/* Hint */}
          {tool === 'draw' && !imgSize && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Upload image</div>
          )}
          {tool === 'draw' && imgSize && currentPts.length === 0 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
              Click to start drawing an area
            </div>
          )}
          {tool === 'draw' && nearFirst && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-700/80 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
              Click to close the area
            </div>
          )}
        </div>

        {/* Polygon list (below canvas) */}
        {viewPolygons.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
            <p className="w-full text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Obszary ({viewPolygons.length})</p>
            {viewPolygons.map(poly => (
              <div
                key={poly.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${selectedPolyId === poly.id ? 'bg-[#6E2E2A]/10 text-[#6E2E2A]' : 'bg-white border hover:bg-gray-100 text-gray-700'}`}
                onClick={() => { setTool('select'); setSelectedPolyId(poly.id) }}
              >
                <span className="font-medium">{poly.refLabel}</span>
                <button className="text-gray-400 hover:text-red-500 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleDeletePoly(poly.id) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {viewPolygons.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No areas. Draw an area and select an object.</p>
        )}
      </div>

      {/* Picker Dialog (units or stages depending on stageMode) */}
      <Dialog open={pickerOpen} onOpenChange={(o) => { if (!o) { setPickerOpen(false); setPendingPts(null); syncCurrentPts([]) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{stageMode ? 'Select stage' : 'Select an object from the main plan'}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Szukaj..."
            value={pickerSearch}
            onChange={e => setPickerSearch(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredItems.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No results</p>
            )}
            {filteredItems.map(it => (
              <button
                key={it.id}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${mappedRefIds.has(it.id) ? 'opacity-50' : 'hover:bg-gray-100'}`}
                onClick={() => confirmPick(stageMode ? 'stage' : 'unit', it.id, it.label)}
              >
                <span className="font-medium">{it.label}</span>
                {mappedRefIds.has(it.id) && <span className="text-xs text-gray-400 ml-2">already added</span>}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPickerOpen(false); setPendingPts(null); syncCurrentPts([]) }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function pointInPoly(pt: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminPlanViewEditor({ projectId, mainPlanUnits, stages }: AdminPlanViewEditorProps) {
  const [views, setViews] = useState<PlanViewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/projects/${projectId}/plan-views`)
      .then(r => r.json())
      .then(data => { setViews(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  const handleAddView = async () => {
    if (!newViewName.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/plan-views`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newViewName.trim(), order: views.length }),
      })
      const view = await res.json()
      setViews(prev => [...prev, view])
      setActiveViewId(view.id)
      setShowAddDialog(false)
      setNewViewName('')
      toast.success('Widok dodany')
    } catch { toast.error('Error') }
    setAdding(false)
  }

  const handleDeleteView = async (viewId: string) => {
    if (!confirm('Delete this view?')) return
    await fetch(`/api/admin/projects/${projectId}/plan-views/${viewId}`, { method: 'DELETE' })
    setViews(prev => prev.filter(v => v.id !== viewId))
    if (activeViewId === viewId) setActiveViewId(null)
    toast('View deleted')
  }

  const activeView = views.find(v => v.id === activeViewId) ?? null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Dodatkowe widoki planu</h3>
        <Button size="sm" onClick={() => setShowAddDialog(true)} style={{ backgroundColor: '#6E2E2A' }}>
          <Plus className="h-4 w-4 mr-1.5" />
          New view
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
        </div>
      ) : views.length === 0 ? (
        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm">No additional views.</p>
          <p className="text-xs mt-1">Add a view, upload an image and mark areas linked to main-plan objects.</p>
        </div>
      ) : (
        <div>
          {/* View tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {views.map(v => (
              <div key={v.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveViewId(activeViewId === v.id ? null : v.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeViewId === v.id ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  style={activeViewId === v.id ? { backgroundColor: '#6E2E2A' } : {}}
                >
                  {v.name}
                </button>
                <button onClick={() => handleDeleteView(v.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Active view editor */}
          {activeView && (
            <ViewCanvas
              key={activeView.id}
              projectId={projectId}
              view={activeView}
              mainPlanUnits={mainPlanUnits}
              stages={stages}
              onViewUpdated={(updated) => {
                setViews(prev => prev.map(v => v.id === activeView.id ? { ...v, ...updated } : v))
              }}
            />
          )}
        </div>
      )}

      {/* Add view dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>New view</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name widoku</Label>
              <Input
                placeholder="np. Segment A, Parter, Elewacja"
                value={newViewName}
                onChange={e => setNewViewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddView()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddView} disabled={adding || !newViewName.trim()} style={{ backgroundColor: '#6E2E2A' }}>
              {adding ? 'Dodawanie...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
