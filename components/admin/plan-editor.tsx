'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Pencil, MousePointer2, Undo2, Trash2, Copy, Save, Upload,
  X, Check, ZoomIn, ZoomOut, Maximize2, FileUp, FileDown,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Point = { x: number; y: number }
type Status = 'available' | 'reserved' | 'sold'

interface DrawnPolygon {
  id: string
  label: string
  status: Status
  points: Point[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<Status, string> = {
  available: '#86efac',
  reserved:  '#fde047',
  sold:      '#f87171',
}

const STATUS_LABEL: Record<Status, string> = {
  available: 'Available',
  reserved:  'Reserved',
  sold:      'Sold',
}

const SNAP_PX     = 10
const STORAGE_KEY = 'plan-editor-v1'

// ─── Pure helpers ──────────────────────────────────────────────────────────────

function sanitizeId(label: string) {
  return 'unit-' + label.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase()
}

function centroid(pts: Point[]): Point {
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  }
}

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y
    const xj = poly[j].x, yj = poly[j].y
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

function buildSvg(polygons: DrawnPolygon[], w: number, h: number) {
  const inner = polygons
    .map(p => {
      const pts = p.points.map(pt => `${Math.round(pt.x)},${Math.round(pt.y)}`).join(' ')
      return `  <polygon id="${sanitizeId(p.label)}" data-label="${p.label}" data-status="${p.status}" points="${pts}" />`
    })
    .join('\n')
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">\n${inner}\n</svg>`
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PlanEditor() {
  // Image
  const [imgSrc,  setImgSrc]  = useState<string | null>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)

  // Polygons
  const [polygons,    setPolygons]    = useState<DrawnPolygon[]>([])
  const [currentPts,  setCurrentPts]  = useState<Point[]>([])   // in-progress
  const [pendingPts,  setPendingPts]  = useState<Point[] | null>(null) // awaiting label
  const [newLabel,    setNewLabel]    = useState('')

  // currentPts ref for race-condition-free access in dblclick handler
  const currentPtsRef = useRef<Point[]>([])
  const syncCurrentPts = useCallback((pts: Point[]) => {
    currentPtsRef.current = pts
    setCurrentPts(pts)
  }, [])

  // Tool / selection
  const [tool,       setTool]       = useState<'draw' | 'select'>('draw')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId,  setHoveredId]  = useState<string | null>(null)
  const [editLabel,  setEditLabel]  = useState('')

  // Viewport
  const [zoom, setZoom] = useState(1)
  const [pan,  setPan]  = useState<Point>({ x: 0, y: 0 })
  const isPanning  = useRef(false)
  const panOrigin  = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)

  // Mouse tracking (image-space)
  const [mouseImg,  setMouseImg]  = useState<Point | null>(null)
  const [nearFirst, setNearFirst] = useState(false)

  // UI panels
  const [showSvg,         setShowSvg]         = useState(false)
  const [showLoad,        setShowLoad]        = useState(false)
  const [loadText,        setLoadText]        = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const fileRef      = useRef<HTMLInputElement>(null)
  const labelRef     = useRef<HTMLInputElement>(null)

  // ─── Init: restore from localStorage ───────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.polygons) setPolygons(saved.polygons)
        if (saved.imgW && saved.imgH) setImgSize({ w: saved.imgW, h: saved.imgH })
      }
    } catch { /* ignore */ }
  }, [])

  // ─── Auto-save ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (polygons.length > 0 || imgSize) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        polygons,
        imgW: imgSize?.w,
        imgH: imgSize?.h,
      }))
    }
  }, [polygons, imgSize])

  // ─── Focus label input when overlay appears ─────────────────────────────────
  useEffect(() => {
    if (pendingPts) setTimeout(() => labelRef.current?.focus(), 30)
  }, [pendingPts])

  // ─── Coordinate helpers ─────────────────────────────────────────────────────
  const getContainerXY = (e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const toImage  = useCallback((cx: number, cy: number): Point => ({
    x: (cx - pan.x) / zoom,
    y: (cy - pan.y) / zoom,
  }), [pan, zoom])

  const toScreen = useCallback((ix: number, iy: number): Point => ({
    x: ix * zoom + pan.x,
    y: iy * zoom + pan.y,
  }), [pan, zoom])

  // ─── Fit image to container ─────────────────────────────────────────────────
  const fitImage = useCallback((size?: { w: number; h: number }) => {
    const s = size ?? imgSize
    if (!s || !containerRef.current) return
    const r  = containerRef.current.getBoundingClientRect()
    const z  = Math.min(r.width / s.w, r.height / s.h, 1) * 0.95
    setZoom(z)
    setPan({ x: (r.width - s.w * z) / 2, y: (r.height - s.h * z) / 2 })
  }, [imgSize])

  // ─── Undo ───────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (currentPtsRef.current.length > 0) {
      syncCurrentPts(currentPtsRef.current.slice(0, -1))
    } else {
      setPolygons(ps => ps.slice(0, -1))
    }
  }, [syncCurrentPts])

  // ─── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space')               { setSpaceDown(true); e.preventDefault() }
      if (e.key  === 'Escape')              { syncCurrentPts([]); setPendingPts(null); setSelectedId(null) }
      if ((e.key === 'Delete' || e.key === 'Backspace') && tag !== 'INPUT') {
        setSelectedId(id => { if (id) setPolygons(ps => ps.filter(p => p.id !== id)); return null })
      }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleUndo() }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') { setSpaceDown(false); isPanning.current = false }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup',   onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [handleUndo, syncCurrentPts])

  // ─── Mouse wheel (zoom) ─────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const { x: cx, y: cy } = getContainerXY(e as unknown as React.MouseEvent)
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const nz     = Math.min(Math.max(zoom * factor, 0.04), 20)
    const r      = nz / zoom
    setZoom(nz)
    setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) }))
  }, [zoom])

  // ─── Mouse down (pan start) ─────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (spaceDown && e.button === 0)) {
      e.preventDefault()
      const { x, y }  = getContainerXY(e)
      panOrigin.current = { mx: x, my: y, px: pan.x, py: pan.y }
      isPanning.current = true
    }
  }, [spaceDown, pan])

  // ─── Mouse move ─────────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const { x: cx, y: cy } = getContainerXY(e)

    // Pan
    if (isPanning.current && panOrigin.current) {
      const dx = cx - panOrigin.current.mx
      const dy = cy - panOrigin.current.my
      setPan({ x: panOrigin.current.px + dx, y: panOrigin.current.py + dy })
      return
    }

    const ip = toImage(cx, cy)
    setMouseImg(ip)

    // Snap-to-first check
    if (tool === 'draw' && currentPtsRef.current.length >= 3) {
      const fp  = currentPtsRef.current[0]
      const sdx = (fp.x - ip.x) * zoom
      const sdy = (fp.y - ip.y) * zoom
      setNearFirst(Math.hypot(sdx, sdy) < SNAP_PX)
    } else {
      setNearFirst(false)
    }

    // Hover (select mode)
    if (tool === 'select') {
      let h: string | null = null
      for (let i = polygons.length - 1; i >= 0; i--) {
        if (pointInPolygon(ip, polygons[i].points)) { h = polygons[i].id; break }
      }
      setHoveredId(h)
    }
  }, [toImage, tool, zoom, polygons])

  const onMouseUp    = useCallback(() => { isPanning.current = false; panOrigin.current = null }, [])
  const onMouseLeave = useCallback(() => { setMouseImg(null); setNearFirst(false) }, [])

  // ─── Click (draw point / select) ────────────────────────────────────────────
  const onClick = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) return
    if (pendingPts)        return
    if (e.detail !== 1)    return  // ignore 2nd click of dblclick

    const { x: cx, y: cy } = getContainerXY(e)
    const ip = toImage(cx, cy)

    if (tool === 'draw') {
      // Snap to first point → close polygon
      const pts = currentPtsRef.current
      if (pts.length >= 3) {
        const fp  = pts[0]
        const sdx = (fp.x - ip.x) * zoom
        const sdy = (fp.y - ip.y) * zoom
        if (Math.hypot(sdx, sdy) < SNAP_PX) {
          setPendingPts(pts)
          syncCurrentPts([])
          setNewLabel('')
          return
        }
      }
      syncCurrentPts([...pts, ip])
    } else {
      let found: string | null = null
      for (let i = polygons.length - 1; i >= 0; i--) {
        if (pointInPolygon(ip, polygons[i].points)) { found = polygons[i].id; break }
      }
      setSelectedId(found)
      setEditLabel(found ? (polygons.find(p => p.id === found)?.label ?? '') : '')
    }
  }, [pendingPts, toImage, tool, zoom, syncCurrentPts, polygons])

  // ─── Double-click (close polygon) ───────────────────────────────────────────
  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (tool !== 'draw') return
    e.preventDefault()
    const pts = currentPtsRef.current
    if (pts.length < 3) return
    setPendingPts(pts)
    syncCurrentPts([])
    setNewLabel('')
  }, [tool, syncCurrentPts])

  // ─── Confirm label ──────────────────────────────────────────────────────────
  const confirmLabel = useCallback(() => {
    if (!pendingPts || !newLabel.trim()) return
    const poly: DrawnPolygon = {
      id:     crypto.randomUUID(),
      label:  newLabel.trim(),
      status: 'available',
      points: pendingPts,
    }
    setPolygons(ps => [...ps, poly])
    setPendingPts(null)
    setNewLabel('')
    toast.success(`Added: ${poly.label}`)
  }, [pendingPts, newLabel])

  // ─── Image upload ───────────────────────────────────────────────────────────
  const onImgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const size = { w: img.naturalWidth, h: img.naturalHeight }
      setImgSrc(url)
      setImgSize(size)
      requestAnimationFrame(() => fitImage(size))
    }
    img.src = url
    e.target.value = ''
  }, [fitImage])

  // ─── Polygon mutations ──────────────────────────────────────────────────────
  const updateStatus = useCallback((id: string, status: Status) => {
    setPolygons(ps => ps.map(p => p.id === id ? { ...p, status } : p))
  }, [])

  const updateLabel = useCallback((id: string, label: string) => {
    setPolygons(ps => ps.map(p => p.id === id ? { ...p, label } : p))
  }, [])

  const deletePolygon = useCallback((id: string) => {
    setPolygons(ps => ps.filter(p => p.id !== id))
    setSelectedId(cur => cur === id ? null : cur)
  }, [])

  // ─── Zoom toolbar helpers ───────────────────────────────────────────────────
  const zoomAround = useCallback((factor: number) => {
    if (!containerRef.current) return
    const r  = containerRef.current.getBoundingClientRect()
    const cx = r.width / 2, cy = r.height / 2
    const nz = Math.min(Math.max(zoom * factor, 0.04), 20)
    const rt = nz / zoom
    setZoom(nz)
    setPan(p => ({ x: cx - rt * (cx - p.x), y: cy - rt * (cy - p.y) }))
  }, [zoom])

  // ─── SVG export ─────────────────────────────────────────────────────────────
  const svgString    = imgSize ? buildSvg(polygons, imgSize.w, imgSize.h) : ''
  const handleCopySvg = () => { navigator.clipboard.writeText(svgString); toast.success('SVG skopiowany do schowka') }
  const handleSave    = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ polygons, imgW: imgSize?.w, imgH: imgSize?.h }))
    toast.success('Saved in browser')
  }
  const handleDownloadSvg = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'plan.svg' })
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Import SVG ─────────────────────────────────────────────────────────────
  const handleImportSvg = () => {
    if (!loadText.trim()) return
    try {
      const doc   = new DOMParser().parseFromString(loadText, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')
      const vb    = svgEl?.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
      if (vb?.length === 4 && vb[2] > 0 && vb[3] > 0) setImgSize({ w: vb[2], h: vb[3] })

      const imported: DrawnPolygon[] = []
      doc.querySelectorAll('polygon').forEach(el => {
        const label  = el.getAttribute('data-label') || el.getAttribute('id') || ''
        const status = (el.getAttribute('data-status') ?? 'available') as Status
        const raw    = el.getAttribute('points') ?? ''
        const points = raw.trim().split(/\s+/).flatMap(pair => {
          const parts = pair.split(',')
          if (parts.length !== 2) return []
          const [x, y] = parts.map(Number)
          return isFinite(x) && isFinite(y) ? [{ x, y }] : []
        })
        if (points.length >= 3 && label) imported.push({ id: crypto.randomUUID(), label, status, points })
      })

      if (!imported.length) { toast.error('No polygons found in SVG'); return }
      setPolygons(ps => [...ps, ...imported])
      setShowLoad(false)
      setLoadText('')
      toast.success(`Loaded ${imported.length} polygon(s)`)
    } catch { toast.error('SVG parsing error') }
  }

  // ─── Derived ────────────────────────────────────────────────────────────────
  const selectedPoly = polygons.find(p => p.id === selectedId) ?? null
  const iz           = 1 / zoom  // inverse zoom — keeps SVG sizes constant on screen

  const getCursor = () => {
    if (spaceDown || isPanning.current) return 'grabbing'
    if (tool === 'draw')  return 'crosshair'
    if (hoveredId)        return 'pointer'
    return 'default'
  }

  // Label overlay position (screen-space, within container)
  const labelPos: Point | null = pendingPts
    ? (() => { const c = centroid(pendingPts); return toScreen(c.x, c.y) })()
    : null

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col border rounded-xl overflow-hidden shadow-sm bg-white"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b flex-shrink-0 flex-wrap gap-y-1">

        {/* Draw / Select toggle */}
        <div className="flex rounded-md overflow-hidden border text-sm">
          <button
            onClick={() => setTool('draw')}
            className={`px-3 py-1.5 flex items-center gap-1.5 font-medium transition-colors ${tool === 'draw' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-700'}`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Rysuj polygon
          </button>
          <button
            onClick={() => setTool('select')}
            className={`px-3 py-1.5 flex items-center gap-1.5 font-medium transition-colors border-l ${tool === 'select' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-700'}`}
          >
            <MousePointer2 className="h-3.5 w-3.5" />
            Zaznacz
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <Button variant="outline" size="sm" onClick={handleUndo} className="h-8">
          <Undo2 className="h-3.5 w-3.5 mr-1" /> Cofnij
        </Button>

        {!showClearConfirm ? (
          <Button variant="outline" size="sm" className="h-8" onClick={() => setShowClearConfirm(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-md border px-2 py-1">
            <span className="text-xs text-red-600 font-medium">Na pewno?</span>
            <Button
              size="sm" variant="destructive" className="h-6 text-xs px-2"
              onClick={() => {
                setPolygons([]); syncCurrentPts([]); setPendingPts(null); setSelectedId(null)
                localStorage.removeItem(STORAGE_KEY); setShowClearConfirm(false)
                toast('Wyczyszczono wszystko')
              }}
            >Tak</Button>
            <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setShowClearConfirm(false)}>Nie</Button>
          </div>
        )}

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Image upload */}
        <Button variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5 mr-1" /> Wgraj plan
        </Button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImgUpload} />

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Zoom */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => zoomAround(1.25)}><ZoomIn className="h-4 w-4" /></Button>
        <span className="text-sm text-gray-500 tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => zoomAround(1 / 1.25)}><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => fitImage()} title="Dopasuj do okna"><Maximize2 className="h-4 w-4" /></Button>

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8" onClick={() => setShowLoad(true)}>
            <FileUp className="h-3.5 w-3.5 mr-1" /> Wczytaj SVG
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setShowSvg(v => !v)}>
            <FileDown className="h-3.5 w-3.5 mr-1" /> Eksportuj SVG
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={handleCopySvg} disabled={!imgSize}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Kopiuj SVG
          </Button>
          <Button size="sm" className="h-8" onClick={handleSave} style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </div>

      {/* ── Main workspace + sidebar ── */}
      <div className="flex flex-1 min-h-0">

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-[#e8e8e8] select-none"
          style={{ cursor: getCursor() }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onContextMenu={e => e.preventDefault()}
        >
          {/* Workspace (scaled + panned) */}
          <div
            style={{
              position:        'absolute',
              transformOrigin: '0 0',
              transform:       `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {/* Image */}
            {imgSrc && imgSize && (
              <>
                <img
                  src={imgSrc}
                  alt="Plan sytuacyjny"
                  style={{ display: 'block', width: imgSize.w, height: imgSize.h, maxWidth: 'none' }}
                  draggable={false}
                />

                {/* SVG overlay */}
                <svg
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: imgSize.w, height: imgSize.h,
                    overflow: 'visible',
                  }}
                >
                  {/* ── Existing polygons ── */}
                  {polygons.map(poly => {
                    const pts       = poly.points.map(p => `${p.x},${p.y}`).join(' ')
                    const color     = STATUS_COLOR[poly.status]
                    const isSel     = poly.id === selectedId
                    const isHov     = poly.id === hoveredId
                    const opacity   = (isSel || isHov) ? 0.55 : 0.45
                    const c         = centroid(poly.points)
                    return (
                      <g key={poly.id}>
                        <polygon
                          points={pts}
                          fill={color}
                          fillOpacity={opacity}
                          stroke="none"
                        />
                        <text
                          x={c.x} y={c.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={13 * iz}
                          fontWeight="700"
                          fill="#fff"
                          stroke="rgba(0,0,0,0.6)"
                          strokeWidth={3 * iz}
                          paintOrder="stroke"
                          style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}
                        >{poly.label}</text>
                      </g>
                    )
                  })}

                  {/* ── In-progress polygon ── */}
                  {currentPts.length > 0 && (() => {
                    const preview = mouseImg
                      ? [...currentPts, nearFirst ? currentPts[0] : mouseImg]
                      : currentPts
                    return (
                      <g>
                        {/* Fill preview */}
                        {currentPts.length >= 2 && mouseImg && (
                          <polygon
                            points={preview.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="#6E2E2A"
                            fillOpacity={0.12}
                          />
                        )}
                        {/* Drawn edges */}
                        {currentPts.length >= 2 && (
                          <polyline
                            points={currentPts.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#6E2E2A"
                            strokeWidth={1.5 * iz}
                            strokeDasharray={`${5 * iz} ${3 * iz}`}
                          />
                        )}
                        {/* Preview line to cursor */}
                        {mouseImg && (
                          <line
                            x1={currentPts[currentPts.length - 1].x}
                            y1={currentPts[currentPts.length - 1].y}
                            x2={nearFirst ? currentPts[0].x : mouseImg.x}
                            y2={nearFirst ? currentPts[0].y : mouseImg.y}
                            stroke="#6E2E2A"
                            strokeWidth={1.5 * iz}
                            strokeDasharray={`${5 * iz} ${3 * iz}`}
                            strokeOpacity={0.55}
                          />
                        )}
                        {/* Point dots */}
                        {currentPts.map((pt, i) => (
                          <circle
                            key={i}
                            cx={pt.x} cy={pt.y}
                            r={(i === 0 && nearFirst ? 8 : 4) * iz}
                            fill={i === 0 ? (nearFirst ? '#22c55e' : '#6E2E2A') : '#6E2E2A'}
                            stroke="#fff"
                            strokeWidth={1.5 * iz}
                          />
                        ))}
                        {/* Snap ring around first point */}
                        {nearFirst && (
                          <circle
                            cx={currentPts[0].x} cy={currentPts[0].y}
                            r={12 * iz}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={1.5 * iz}
                            strokeDasharray={`${4 * iz} ${3 * iz}`}
                            opacity={0.8}
                          />
                        )}
                      </g>
                    )
                  })()}

                  {/* ── Pending polygon (awaiting label) ── */}
                  {pendingPts && (
                    <polygon
                      points={pendingPts.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="#22c55e"
                      fillOpacity={0.25}
                      stroke="#22c55e"
                      strokeWidth={2 * iz}
                      strokeDasharray={`${6 * iz} ${3 * iz}`}
                    />
                  )}
                </svg>
              </>
            )}

            {/* No image placeholder (in workspace so it's centered before image upload) */}
            {!imgSrc && (
              <div
                className="flex flex-col items-center justify-center gap-3 text-gray-400 rounded-xl border-2 border-dashed border-gray-300 bg-white cursor-pointer hover:border-gray-400 transition-colors"
                style={{ width: 560, height: 380 }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-gray-300" />
                <div className="text-center">
                  <p className="font-semibold text-gray-600">Wgraj plan sytuacyjny</p>
                  <p className="text-sm mt-1">Click here or use the “Upload plan” button na pasku</p>
                  <p className="text-xs mt-1 text-gray-400">JPG, PNG — supports plans 4000×3000 px and larger</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Label input overlay ── */}
          {pendingPts && labelPos && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(Math.max(labelPos.x - 110, 8), (containerRef.current?.clientWidth ?? 800) - 232),
                top:  Math.min(Math.max(labelPos.y - 64,  8), (containerRef.current?.clientHeight ?? 600) - 112),
                zIndex: 20,
              }}
              className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-56"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Plot label</p>
              <Input
                ref={labelRef}
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="np. 8G/2"
                className="h-8 text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter')  { confirmLabel() }
                  if (e.key === 'Escape') { setPendingPts(null); setNewLabel('') }
                }}
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="flex-1 h-7" onClick={confirmLabel} style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
                  <Check className="h-3.5 w-3.5 mr-1" /> OK
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { setPendingPts(null); setNewLabel('') }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Cursor coordinates ── */}
          {tool === 'draw' && mouseImg && imgSize && (
            <div className="absolute bottom-2 left-2 bg-black/55 text-white text-xs px-2 py-1 rounded font-mono pointer-events-none tabular-nums">
              x: {Math.round(mouseImg.x)}  y: {Math.round(mouseImg.y)}
            </div>
          )}

          {/* ── Hint bar (draw mode) ── */}
          {tool === 'draw' && imgSrc && !pendingPts && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
              {currentPts.length === 0
                ? 'Click to start drawing · Scroll = zoom · Middle button / Space+LMB = pan'
                : currentPts.length < 3
                  ? `Click to add a point (${currentPts.length}/3 min) · Esc = cancel`
                  : 'Click the first point or double-click to close · Esc = cancel'
              }
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-72 bg-white border-l flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-2.5 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-800">Plots</h3>
            <span className="text-xs text-gray-400 tabular-nums">{polygons.length}</span>
          </div>

          {/* Selected polygon editor */}
          {selectedPoly && (
            <div className="px-4 py-3 border-b bg-blue-50 flex-shrink-0">
              <p className="text-[10px] font-bold text-blue-700 mb-2 uppercase tracking-wider">Zaznaczony</p>
              <Input
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                onBlur={() => updateLabel(selectedPoly.id, editLabel)}
                onKeyDown={e => { if (e.key === 'Enter') updateLabel(selectedPoly.id, editLabel) }}
                className="h-7 text-sm mb-2"
                placeholder="Label"
              />
              <Select value={selectedPoly.status} onValueChange={v => updateStatus(selectedPoly.id, v as Status)}>
                <SelectTrigger className="h-7 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['available', 'reserved', 'sold'] as Status[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="destructive" size="sm" className="w-full mt-2 h-7 text-xs"
                onClick={() => deletePolygon(selectedPoly.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete polygon
              </Button>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {polygons.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-1">
                <p>No plots</p>
                <p className="text-xs">Narysuj polygony na planie</p>
              </div>
            ) : (
              <div className="divide-y">
                {polygons.map(poly => {
                  const isSel = poly.id === selectedId
                  const color = STATUS_COLOR[poly.status]
                  return (
                    <div
                      key={poly.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${isSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => { setSelectedId(poly.id); setEditLabel(poly.label); setTool('select') }}
                    >
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-medium flex-1 truncate">{poly.label}</span>
                      <Select
                        value={poly.status}
                        onValueChange={v => updateStatus(poly.id, v as Status)}
                      >
                        <SelectTrigger
                          className="h-6 text-xs border-0 shadow-none p-0 pr-5 focus:ring-0 w-auto"
                          onClick={e => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['available', 'reserved', 'sold'] as Status[]).map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{STATUS_LABEL[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        className="text-gray-300 hover:text-red-500 p-0.5 transition-colors"
                        onClick={e => { e.stopPropagation(); deletePolygon(poly.id) }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SVG Export panel ── */}
      {showSvg && (
        <div className="border-t bg-white flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 border-b">
            <span className="text-sm font-semibold">Eksport SVG</span>
            <span className="text-xs text-gray-400 ml-1">
              {polygons.length} polygon{polygons.length !== 1 ? 's' : ''} · viewBox {imgSize ? `${imgSize.w}×${imgSize.h}` : '—'}
            </span>
            <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={() => setShowSvg(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <Textarea
              value={svgString}
              readOnly
              rows={6}
              className="font-mono text-xs resize-none"
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="h-8" onClick={handleCopySvg} style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Kopiuj SVG
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={handleDownloadSvg}>
                <FileDown className="h-3.5 w-3.5 mr-1" /> Download .svg
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Load SVG dialog ── */}
      {showLoad && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowLoad(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-[580px] max-w-full mx-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-semibold">Wczytaj SVG</h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowLoad(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Wklej kod SVG (z Figmy, Inkscape itp.) z elementami <code className="bg-gray-100 px-1 rounded text-xs">&lt;polygon&gt;</code> with attributes <code className="bg-gray-100 px-1 rounded text-xs">data-label</code> i <code className="bg-gray-100 px-1 rounded text-xs">data-status</code>.
            </p>
            <Textarea
              value={loadText}
              onChange={e => setLoadText(e.target.value)}
              rows={10}
              className="font-mono text-xs resize-none"
              placeholder={'<svg viewBox="0 0 4000 3000" xmlns="http://www.w3.org/2000/svg">\n  <polygon data-label="8G/2" data-status="available" points="120,80 340,80 340,260 120,260" />\n</svg>'}
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleImportSvg} style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
                <FileUp className="h-4 w-4 mr-1.5" /> Importuj
              </Button>
              <Button variant="outline" onClick={() => { setShowLoad(false); setLoadText('') }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
