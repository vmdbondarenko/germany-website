'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus, Trash2, Upload, Loader2, Pencil, MousePointer2, Undo2,
  ChevronDown, ChevronUp, X, ZoomIn, ZoomOut, Maximize2, Save, Eye, EyeOff,
  ArrowUp, ArrowDown,
} from 'lucide-react'
import Image from 'next/image'

// ─── Types ───
type Point = { x: number; y: number }

interface StageView {
  id: string
  stageId: string
  name: string
  imageUrl: string | null
  svgContent: string | null
  order: number
}

interface Stage {
  id: string
  projectId: string
  svgElementId: string
  name: string
  order: number
  published: boolean
  stageViews: StageView[]
}

interface MainUnit {
  id: string
  svgElementId: string
  label: string
  status: string
  stage: string | null
}

// ─── SVG Helpers ───
function parseSvgPolygons(svg: string): { id: string; label: string; points: Point[] }[] {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const out: { id: string; label: string; points: Point[] }[] = []
  doc.querySelectorAll('polygon').forEach(el => {
    const id = el.getAttribute('id') || ''
    const label = el.getAttribute('data-label') || el.getAttribute('data-unit-id') || id
    const raw = el.getAttribute('points') || ''
    const points = raw.trim().split(/\s+/).flatMap(pair => {
      const [x, y] = pair.split(',').map(Number)
      return isFinite(x) && isFinite(y) ? [{ x, y }] : []
    })
    if (id && points.length >= 3) out.push({ id, label, points })
  })
  return out
}

function buildViewSvg(polygons: ViewPolygon[], w: number, h: number): string {
  const inner = polygons
    .filter(p => p.points.length >= 3)
    .map(p => {
      const pts = p.points.map(pt => `${Math.round(pt.x)},${Math.round(pt.y)}`).join(' ')
      return `  <polygon id="${p.id}" data-unit-id="${p.unitId}" data-label="${p.unitLabel}" points="${pts}" />`
    }).join('\n')
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">\n${inner}\n</svg>`
}

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function centroid(pts: Point[]): Point {
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length }
}

interface ViewPolygon {
  id: string
  unitId: string
  unitLabel: string
  points: Point[]
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

// ─── Stage View Plan Editor ───
function StageViewPlanEditor({ view, units, onSvgSave }: {
  view: StageView
  units: MainUnit[]
  onSvgSave: (svgContent: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [polygons, setPolygons] = useState<ViewPolygon[]>([])
  const [tool, setTool] = useState<'draw' | 'select'>('draw')
  const [currentPts, setCurrentPts] = useState<Point[]>([])
  const [pendingPts, setPendingPts] = useState<Point[] | null>(null)
  const [pickingUnit, setPickingUnit] = useState(false)
  const [hoveredPoly, setHoveredPoly] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const panOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [mouseImg, setMouseImg] = useState<Point | null>(null)
  const [nearFirst, setNearFirst] = useState(false)
  const SNAP_PX = 10

  // Load existing polygons from SVG
  useEffect(() => {
    if (!view.svgContent) { setPolygons([]); return }
    const parsed = parseSvgPolygons(view.svgContent)
    setPolygons(parsed.map(p => {
      const unitId = (() => {
        const doc = new DOMParser().parseFromString(view.svgContent!, 'image/svg+xml')
        const el = doc.getElementById(p.id)
        return el?.getAttribute('data-unit-id') || ''
      })()
      const unit = units.find(u => u.id === unitId)
      return { id: p.id, unitId, unitLabel: unit?.label || p.label, points: p.points }
    }))
  }, [view.svgContent, units])

  // Load image size
  useEffect(() => {
    if (!view.imageUrl) return
    const img = new window.Image()
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = view.imageUrl
  }, [view.imageUrl])

  const toImgCoords = useCallback((e: React.MouseEvent): Point | null => {
    if (!containerRef.current || !imgSize) return null
    const rect = containerRef.current.getBoundingClientRect()
    const dispW = containerRef.current.clientWidth * zoom
    const dispH = (imgSize.h / imgSize.w) * dispW
    const ox = (e.clientX - rect.left - pan.x) / (dispW / imgSize.w)
    const oy = (e.clientY - rect.top - pan.y) / (dispH / imgSize.h)
    if (ox < 0 || oy < 0 || ox > imgSize.w || oy > imgSize.h) return null
    return { x: Math.round(ox), y: Math.round(oy) }
  }, [imgSize, zoom, pan])

  const autoSave = useCallback((polys: ViewPolygon[]) => {
    if (!imgSize) return
    const svg = buildViewSvg(polys, imgSize.w, imgSize.h)
    onSvgSave(svg)
  }, [imgSize, onSvgSave])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (tool !== 'draw') {
      // Select mode - check if clicked on polygon
      const pt = toImgCoords(e)
      if (!pt) return
      const clicked = polygons.find(p => pointInPolygon(pt, p.points))
      if (clicked) {
        // Delete polygon
        if (confirm(`Delete polygon for "${clicked.unitLabel}"?`)) {
          const next = polygons.filter(p => p.id !== clicked.id)
          setPolygons(next)
          autoSave(next)
        }
      }
      return
    }
    const pt = toImgCoords(e)
    if (!pt) return

    if (currentPts.length >= 2 && nearFirst) {
      // Close polygon
      setPendingPts([...currentPts])
      setPickingUnit(true)
      setCurrentPts([])
      return
    }
    setCurrentPts(prev => [...prev, pt])
  }, [tool, toImgCoords, currentPts, nearFirst, polygons, autoSave])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current && panOrigin.current) {
      setPan({ x: e.clientX - panOrigin.current.mx + panOrigin.current.px, y: e.clientY - panOrigin.current.my + panOrigin.current.py })
      return
    }
    const pt = toImgCoords(e)
    setMouseImg(pt)
    if (pt && currentPts.length >= 2) {
      const first = currentPts[0]
      setNearFirst(Math.hypot(pt.x - first.x, pt.y - first.y) < SNAP_PX * (imgSize ? imgSize.w / (containerRef.current?.clientWidth || 1) : 1))
    } else {
      setNearFirst(false)
    }
  }, [toImgCoords, currentPts, imgSize])

  const confirmUnitPick = (unit: MainUnit) => {
    if (!pendingPts) return
    const newPoly: ViewPolygon = {
      id: `pv-${Date.now()}`,
      unitId: unit.id,
      unitLabel: unit.label,
      points: pendingPts,
    }
    const next = [...polygons.filter(p => p.unitId !== unit.id), newPoly]
    setPolygons(next)
    autoSave(next)
    setPendingPts(null)
    setPickingUnit(false)
  }

  if (!view.imageUrl) {
    return <p className="text-sm text-muted-foreground py-4">First add an image to this view.</p>
  }

  const dispW = containerRef.current?.clientWidth || 800
  const dispH = imgSize ? (imgSize.h / imgSize.w) * dispW : 400

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant={tool === 'draw' ? 'default' : 'outline'} onClick={() => setTool('draw')}>
          <Pencil className="h-3.5 w-3.5 mr-1" />Rysuj
        </Button>
        <Button size="sm" variant={tool === 'select' ? 'default' : 'outline'} onClick={() => setTool('select')}>
          <MousePointer2 className="h-3.5 w-3.5 mr-1" />Zaznacz
        </Button>
        {currentPts.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => { setCurrentPts(prev => prev.slice(0, -1)) }}>
            <Undo2 className="h-3.5 w-3.5 mr-1" />Cofnij
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(z * 1.3, 5))}><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(z / 1.3, 0.3))}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}><Maximize2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Polygons: {polygons.length} · Click to draw a polygon, close it by clicking the first point, then select a plot
      </p>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative border rounded-lg overflow-hidden bg-gray-100 cursor-crosshair"
        style={{ height: Math.min(dispH * zoom, 600) }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseDown={(e) => {
          if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isPanning.current = true
            panOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
          }
        }}
        onMouseUp={() => { isPanning.current = false; panOrigin.current = null }}
        onMouseLeave={() => { isPanning.current = false; setMouseImg(null) }}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '100%' }}>
          {/* Background Image */}
          <img src={view.imageUrl} alt="" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />

          {/* SVG Overlay */}
          {imgSize && (
            <svg
              viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
              className="absolute inset-0"
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              {/* Existing polygons */}
              {polygons.map(p => {
                const c = centroid(p.points)
                const isHovered = hoveredPoly === p.id
                return (
                  <g key={p.id}
                    onMouseEnter={() => setHoveredPoly(p.id)}
                    onMouseLeave={() => setHoveredPoly(null)}
                    style={{ pointerEvents: 'all' }}
                  >
                    <polygon
                      points={p.points.map(pt => `${pt.x},${pt.y}`).join(' ')}
                      fill={isHovered ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.2)'}
                      stroke="#22c55e"
                      strokeWidth={isHovered ? 3 : 2}
                    />
                    <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central"
                      fontSize={Math.max(12, imgSize.w / 60)} fill="white" fontWeight="bold"
                      stroke="black" strokeWidth={0.5} paintOrder="stroke"
                    >{p.unitLabel}</text>
                  </g>
                )
              })}

              {/* Current drawing */}
              {currentPts.length > 0 && (
                <>
                  <polyline
                    points={[...currentPts, ...(mouseImg ? [mouseImg] : [])].map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3"
                  />
                  {currentPts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={i === 0 && nearFirst ? 8 : 4}
                      fill={i === 0 ? '#f59e0b' : '#3b82f6'} stroke="white" strokeWidth={1}
                    />
                  ))}
                </>
              )}
            </svg>
          )}
        </div>
      </div>

      {/* Unit picker dialog */}
      {pickingUnit && pendingPts && (
        <div className="border rounded-lg p-4 bg-amber-50 border-amber-200 space-y-3">
          <p className="text-sm font-medium text-amber-900">Select a plot for this polygon:</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {units.map(u => (
              <Button key={u.id} size="sm" variant="outline" className="text-xs"
                onClick={() => confirmUnitPick(u)}
              >
                {u.label}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => { setPendingPts(null); setPickingUnit(false) }}>
            <X className="h-3.5 w-3.5 mr-1" />Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Main Stage Editor Component ───
export default function AdminStageEditor({ projectId, stages: initialStages, units }: {
  projectId: string
  stages: Stage[]
  units: MainUnit[]
}) {
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [expandedView, setExpandedView] = useState<string | null>(null)
  const [newStageName, setNewStageName] = useState('')
  const [newStageSvgId, setNewStageSvgId] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchStages = useCallback(async () => {
    const res = await fetch(`/api/admin/stages?projectId=${projectId}`)
    if (res.ok) setStages(await res.json())
  }, [projectId])

  const createStage = async () => {
    if (!newStageName || !newStageSvgId) return
    setCreating(true)
    const res = await fetch('/api/admin/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, name: newStageName, svgElementId: newStageSvgId, order: stages.length }),
    })
    if (res.ok) {
      await fetchStages()
      setNewStageName('')
      setNewStageSvgId('')
    }
    setCreating(false)
  }

  const updateStage = async (id: string, data: Partial<Stage>) => {
    // Optimistic — toggle feels instant, then reconcile with the server.
    setStages(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)))
    await fetch(`/api/admin/stages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await fetchStages()
  }

  const deleteStage = async (id: string) => {
    if (!confirm('Delete this stage and all its views?')) return
    await fetch(`/api/admin/stages/${id}`, { method: 'DELETE' })
    await fetchStages()
  }

  const addView = async (stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    const res = await fetch('/api/admin/stage-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId, name: `Widok ${(stage?.stageViews.length || 0) + 1}`, order: stage?.stageViews.length || 0 }),
    })
    if (res.ok) await fetchStages()
  }

  const updateView = async (viewId: string, data: Partial<StageView>) => {
    await fetch(`/api/admin/stage-views/${viewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await fetchStages()
  }

  const deleteView = async (viewId: string) => {
    if (!confirm('Delete this view?')) return
    await fetch(`/api/admin/stage-views/${viewId}`, { method: 'DELETE' })
    await fetchStages()
  }

  // Move a view one position up or down within its stage. Persists the new
  // order via /api/admin/stage-views/reorder, which renumbers 0..N-1 in a
  // single transaction so existing svgContent / dotOverrides stay intact.
  const [reorderingViewId, setReorderingViewId] = useState<string | null>(null)
  const moveView = async (stageId: string, viewId: string, direction: 'up' | 'down') => {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return
    const idx = stage.stageViews.findIndex(v => v.id === viewId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= stage.stageViews.length) return

    const newViews = [...stage.stageViews]
    ;[newViews[idx], newViews[swapIdx]] = [newViews[swapIdx], newViews[idx]]
    const orderedIds = newViews.map(v => v.id)

    setReorderingViewId(viewId)
    const res = await fetch('/api/admin/stage-views/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    })
    setReorderingViewId(null)
    if (!res.ok) {
      alert('Failed to reorder views')
      return
    }
    setStages(prev =>
      prev.map(s =>
        s.id === stageId
          ? { ...s, stageViews: newViews.map((v, i) => ({ ...v, order: i })) }
          : s
      )
    )
  }

  const saveViewSvg = async (viewId: string, svgContent: string) => {
    await fetch(`/api/admin/stage-views/${viewId}/svg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svgContent }),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project stages ({stages.length})</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Draw stage polygons on the main plan (above), then add stages here with matching SVG element IDs. Each stage has its own views with plot polygons.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add stage */}
        <div className="flex items-end gap-3 p-4 border rounded-lg bg-gray-50/50">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Name etapu</Label>
            <Input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="np. Stage 1" className="h-8" />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">SVG element ID (from the main plan)</Label>
            <Input value={newStageSvgId} onChange={e => setNewStageSvgId(e.target.value)} placeholder="np. etap-1" className="h-8" />
          </div>
          <Button size="sm" onClick={createStage} disabled={creating || !newStageName || !newStageSvgId}>
            <Plus className="h-3.5 w-3.5 mr-1" />{creating ? 'Dodawanie...' : 'Add etap'}
          </Button>
        </div>

        {/* Stage list */}
        {stages.map(stage => (
          <div key={stage.id} className="border rounded-lg overflow-hidden">
            {/* Stage header */}
            <div
              className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedStage(prev => prev === stage.id ? null : stage.id)}
            >
              <div className="flex items-center gap-3">
                {expandedStage === stage.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <div>
                  <span className="font-medium text-sm">{stage.name}</span>
                  {stage.published ? (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded ml-2">Widoczny</span>
                  ) : (
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded ml-2">Ukryty</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-2">SVG ID: <code className="bg-gray-100 px-1 rounded">{stage.svgElementId}</code></span>
                  <span className="text-xs text-muted-foreground ml-2">· {stage.stageViews.length} views</span>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant={stage.published ? 'outline' : 'default'}
                  onClick={() => updateStage(stage.id, { published: !stage.published })}
                  title={stage.published ? 'Hide stage on the public site' : 'Show stage on the public site'}
                >
                  {stage.published
                    ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Ukryj</>
                    : <><Eye className="h-3.5 w-3.5 mr-1" />Opublikuj</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => addView(stage.id)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add widok
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteStage(stage.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Stage views */}
            {expandedStage === stage.id && (
              <div className="border-t bg-gray-50/30 p-4 space-y-4">
                {stage.stageViews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No views. Add a view to draw plot polygons.</p>
                ) : (
                  stage.stageViews.map((view, viewIdx) => (
                    <StageViewCard
                      key={view.id}
                      view={view}
                      units={units.filter(u => u.stage === stage.name || !u.stage)}
                      expanded={expandedView === view.id}
                      isFirst={viewIdx === 0}
                      isLast={viewIdx === stage.stageViews.length - 1}
                      reordering={reorderingViewId === view.id}
                      onToggle={() => setExpandedView(prev => prev === view.id ? null : view.id)}
                      onUpdate={(data) => updateView(view.id, data)}
                      onDelete={() => deleteView(view.id)}
                      onMove={(direction) => moveView(stage.id, view.id, direction)}
                      onSvgSave={(svg) => saveViewSvg(view.id, svg)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {stages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">
            No stages. Draw stage polygons on the main plan, then add stages here.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Stage View Card ───
function StageViewCard({
  view, units, expanded, isFirst, isLast, reordering,
  onToggle, onUpdate, onDelete, onMove, onSvgSave,
}: {
  view: StageView
  units: MainUnit[]
  expanded: boolean
  isFirst: boolean
  isLast: boolean
  reordering: boolean
  onToggle: () => void
  onUpdate: (data: Partial<StageView>) => void
  onDelete: () => void
  onMove: (direction: 'up' | 'down') => void
  onSvgSave: (svg: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [editName, setEditName] = useState(view.name)

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span className="text-sm font-medium">{view.name}</span>
          {view.imageUrl && <span className="text-xs text-green-600">● image</span>}
          {view.svgContent && <span className="text-xs text-blue-600">● polygony</span>}
        </div>
        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 disabled:opacity-30"
            disabled={isFirst || reordering}
            onClick={() => onMove('up')}
            title="Move view up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 disabled:opacity-30"
            disabled={isLast || reordering}
            onClick={() => onMove('down')}
            title="Move view down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 w-7 p-0" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 space-y-4">
          {/* Name */}
          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Name widoku</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8"
                onBlur={() => { if (editName !== view.name) onUpdate({ name: editName }) }}
              />
            </div>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label className="text-xs">View image (plan background)</Label>
            <div className="flex gap-2 items-center">
              <Input
                value={view.imageUrl || ''}
                onChange={e => onUpdate({ imageUrl: e.target.value })}
                placeholder="Image URL"
                className="h-8 flex-1"
              />
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                  <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  try {
                    const url = await uploadImage(file)
                    onUpdate({ imageUrl: url })
                  } catch { /* ignore */ }
                  setUploading(false)
                }} />
              </label>
            </div>
            {view.imageUrl && (
              <div className="relative w-40 h-24 rounded-lg overflow-hidden border">
                <Image src={view.imageUrl} alt="" fill className="object-cover" />
              </div>
            )}
          </div>

          {/* Plan editor */}
          <div>
            <Label className="text-xs mb-2 block">Plot polygon editor</Label>
            <StageViewPlanEditor view={view} units={units} onSvgSave={onSvgSave} />
          </div>
        </div>
      )}
    </div>
  )
}
