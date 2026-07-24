'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pencil, MousePointer2, Undo2, Trash2, Save, Upload, Plus,
  X, Check, ZoomIn, ZoomOut, Maximize2, FileUp, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Point = { x: number; y: number }
type Status = 'available' | 'reserved' | 'sold'

interface DrawUnit {
  id: string
  svgElementId: string
  label: string
  status: Status
  points: Point[]
  area: number | null
  gardenArea: number | null
  rooms: number | null
  floors: number | null
  floor: string | null
  buildingLabel: string | null
  price: number | null
  fullPrice: number | null
  parkingPrice: number | null
  storagePrice: number | null
  rightsPrice: number | null
  otherPrice: number | null
  partsType: string | null
  partsLabel: string | null
  roomsType: string | null
  roomsLabel: string | null
  rightsDesc: string | null
  otherDesc: string | null
  description: string | null
  houseTypeId: string | null
}

interface DbUnit {
  id: string
  svgElementId: string
  label: string
  status: string
  area: number | null
  gardenArea: number | null
  rooms: number | null
  floors: number | null
  floor: string | null
  buildingLabel?: string | null
  price: number | null
  fullPrice?: number | null
  parkingPrice?: number | null
  storagePrice?: number | null
  rightsPrice?: number | null
  otherPrice?: number | null
  partsType?: string | null
  partsLabel?: string | null
  roomsType?: string | null
  roomsLabel?: string | null
  rightsDesc?: string | null
  otherDesc?: string | null
  description: string | null
  houseTypeId?: string | null
}

interface EditForm {
  label: string; status: Status; area: string; gardenArea: string
  rooms: string; floors: string; floor: string; buildingLabel: string
  price: string; fullPrice: string; parkingPrice: string; storagePrice: string
  rightsPrice: string; otherPrice: string
  partsType: string; partsLabel: string; roomsType: string; roomsLabel: string
  rightsDesc: string; otherDesc: string
  description: string; houseTypeId: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<Status, string> = {
  available: '#86efac', reserved: '#fde047', sold: '#f87171',
}
const STATUS_LABEL: Record<Status, string> = {
  available: 'Available', reserved: 'Reserved', sold: 'Sold',
}
const SNAP_PX = 10
const EMPTY_FORM: EditForm = {
  label: '', status: 'available', area: '', gardenArea: '',
  rooms: '', floors: '', floor: '', buildingLabel: '', price: '',
  fullPrice: '', parkingPrice: '', storagePrice: '',
  rightsPrice: '', otherPrice: '',
  partsType: '', partsLabel: '', roomsType: '', roomsLabel: '',
  rightsDesc: '', otherDesc: '',
  description: '', houseTypeId: '',
}

// ─── Pure helpers ──────────────────────────────────────────────────────────────

function sanitizeId(label: string) {
  return 'unit-' + label.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

function centroid(pts: Point[]): Point {
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length }
}

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function parseSvgPolygons(svg: string): { id: string; points: Point[] }[] {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const out: { id: string; points: Point[] }[] = []
  doc.querySelectorAll('polygon').forEach(el => {
    const id = el.getAttribute('id') || ''
    const raw = el.getAttribute('points') || ''
    const points = raw.trim().split(/\s+/).flatMap(pair => {
      const [x, y] = pair.split(',').map(Number)
      return isFinite(x) && isFinite(y) ? [{ x, y }] : []
    })
    if (id && points.length >= 3) out.push({ id, points })
  })
  return out
}

function buildSvg(units: DrawUnit[], w: number, h: number) {
  const inner = units
    .filter(u => u.points.length >= 3)
    .map(u => {
      const pts = u.points.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ')
      return `  <polygon id="${u.svgElementId}" data-label="${u.label}" data-status="${u.status}" points="${pts}" />`
    }).join('\n')
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">\n${inner}\n</svg>`
}

function unitToForm(u: DrawUnit): EditForm {
  return {
    label: u.label, status: u.status,
    area: u.area?.toString() || '', gardenArea: u.gardenArea?.toString() || '',
    rooms: u.rooms?.toString() || '', floors: u.floors?.toString() || '',
    floor: u.floor || '', buildingLabel: u.buildingLabel || '',
    price: u.price?.toString() || '',
    fullPrice: u.fullPrice?.toString() || '',
    parkingPrice: u.parkingPrice?.toString() || '',
    storagePrice: u.storagePrice?.toString() || '',
    rightsPrice: u.rightsPrice?.toString() || '',
    otherPrice: u.otherPrice?.toString() || '',
    partsType: u.partsType || '', partsLabel: u.partsLabel || '',
    roomsType: u.roomsType || '', roomsLabel: u.roomsLabel || '',
    rightsDesc: u.rightsDesc || '', otherDesc: u.otherDesc || '',
    description: u.description || '',
    houseTypeId: u.houseTypeId || '',
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface StageInfo {
  id: string
  svgElementId: string
  name: string
  order: number
}

export interface AdminPlanEditorProps {
  projectId: string
  planImageUrl: string | null
  initialUnits: DbUnit[]
  initialSvgContent: string | null
  onPlanImageChange?: (url: string) => void
  houseTypes?: Array<{ id: string; name: string; totalArea?: number | null }>
  stages?: StageInfo[]
  onStagesChange?: () => void
}

export default function AdminPlanEditor({
  projectId,
  planImageUrl,
  initialUnits,
  initialSvgContent,
  onPlanImageChange,
  houseTypes = [],
  stages = [],
  onStagesChange,
}: AdminPlanEditorProps) {
  const stageMode = stages.length > 0

  // ── Stage-mode unit management ──
  const [bottomTab, setBottomTab] = useState<'stages' | 'units'>(stageMode ? 'units' : 'units')
  const [unitList, setUnitList] = useState<DrawUnit[]>([])
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)

  // ── Image ──
  const [imgSrc,  setImgSrc]  = useState<string | null>(planImageUrl)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)

  // ── Units / polygons ──
  const [drawUnits, setDrawUnits] = useState<DrawUnit[]>([])

  // ── Drawing ──
  const [currentPts, setCurrentPts]   = useState<Point[]>([])
  const currentPtsRef                 = useRef<Point[]>([])
  const syncCurrentPts = useCallback((pts: Point[]) => { currentPtsRef.current = pts; setCurrentPts(pts) }, [])
  const [pendingPts,      setPendingPts]      = useState<Point[] | null>(null)
  const [newLabel,        setNewLabel]        = useState('')
  const [newHouseTypeId,  setNewHouseTypeId]  = useState('')
  const [newStageId,      setNewStageId]      = useState('')
  const [creating,        setCreating]        = useState(false)
  const [attachExistingId, setAttachExistingId] = useState('')    // attach polygon to existing unit
  const [redrawingUnitId,  setRedrawingUnitId]  = useState<string | null>(null) // re-draw polygon for unit

  // ── Tool / selection ──
  const [tool,         setTool]        = useState<'draw' | 'select'>('draw')
  const [selectedId,   setSelectedId]  = useState<string | null>(null)
  const [hoveredElem,  setHoveredElem] = useState<string | null>(null)

  // ── Edit form ──
  const [editForm,   setEditForm]   = useState<EditForm>(EMPTY_FORM)
  const [savingUnit, setSavingUnit] = useState(false)

  // ── Viewport ──
  const [zoom, setZoom] = useState(1)
  const [pan,  setPan]  = useState<Point>({ x: 0, y: 0 })
  const isPanning  = useRef(false)
  const panOrigin  = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)

  // ── Mouse ──
  const [mouseImg,  setMouseImg]  = useState<Point | null>(null)
  const [nearFirst, setNearFirst] = useState(false)

  // ── Import SVG ──
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null)
  const fileRef      = useRef<HTMLInputElement>(null)
  const labelRef     = useRef<HTMLInputElement>(null)

  // ── Init: merge SVG polygons with DB units / stages ─────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const svgPolys = initialSvgContent ? parseSvgPolygons(initialSvgContent) : []

    // Parse image size from SVG viewBox
    if (initialSvgContent) {
      const doc = new DOMParser().parseFromString(initialSvgContent, 'image/svg+xml')
      const vb = doc.querySelector('svg')?.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
      if (vb?.length === 4 && vb[2] > 0 && vb[3] > 0) setImgSize({ w: vb[2], h: vb[3] })
    }

    if (stageMode) {
      // In stage mode, draw items represent stages
      const merged: DrawUnit[] = stages.map(s => ({
        id: s.id, svgElementId: s.svgElementId, label: s.name,
        status: 'available' as Status,
        points: svgPolys.find(p => p.id === s.svgElementId)?.points || [],
        area: null, gardenArea: null, rooms: null,
        floors: null, floor: null, buildingLabel: null, price: null,
        fullPrice: null, parkingPrice: null, storagePrice: null,
        rightsPrice: null, otherPrice: null,
        partsType: null, partsLabel: null, roomsType: null, roomsLabel: null,
        rightsDesc: null, otherDesc: null,
        description: null, houseTypeId: null,
      }))
      setDrawUnits(merged)
      // Also init actual units list for the Plots tab
      const units: DrawUnit[] = initialUnits.map(u => ({
        id: u.id, svgElementId: u.svgElementId, label: u.label,
        status: (u.status as Status) || 'available',
        points: [],
        area: u.area, gardenArea: u.gardenArea, rooms: u.rooms,
        floors: u.floors, floor: u.floor, buildingLabel: u.buildingLabel ?? null,
        price: u.price,
        fullPrice: u.fullPrice ?? null, parkingPrice: u.parkingPrice ?? null,
        storagePrice: u.storagePrice ?? null, rightsPrice: u.rightsPrice ?? null,
        otherPrice: u.otherPrice ?? null,
        partsType: u.partsType ?? null, partsLabel: u.partsLabel ?? null,
        roomsType: u.roomsType ?? null, roomsLabel: u.roomsLabel ?? null,
        rightsDesc: u.rightsDesc ?? null, otherDesc: u.otherDesc ?? null,
        description: u.description,
        houseTypeId: u.houseTypeId ?? null,
      }))
      setUnitList(units)
    } else {
      const merged: DrawUnit[] = initialUnits.map(u => ({
        id: u.id, svgElementId: u.svgElementId, label: u.label,
        status: (u.status as Status) || 'available',
        points: svgPolys.find(p => p.id === u.svgElementId)?.points || [],
        area: u.area, gardenArea: u.gardenArea, rooms: u.rooms,
        floors: u.floors, floor: u.floor, buildingLabel: u.buildingLabel ?? null,
        price: u.price,
        fullPrice: u.fullPrice ?? null, parkingPrice: u.parkingPrice ?? null,
        storagePrice: u.storagePrice ?? null, rightsPrice: u.rightsPrice ?? null,
        otherPrice: u.otherPrice ?? null,
        partsType: u.partsType ?? null, partsLabel: u.partsLabel ?? null,
        roomsType: u.roomsType ?? null, roomsLabel: u.roomsLabel ?? null,
        rightsDesc: u.rightsDesc ?? null, otherDesc: u.otherDesc ?? null,
        description: u.description,
        houseTypeId: u.houseTypeId ?? null,
      }))
      setDrawUnits(merged)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load image dimensions when URL is set ──────────────────────────────────
  useEffect(() => {
    if (!imgSrc) return
    if (imgSize) return  // already known from SVG viewBox
    const img = new Image()
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = imgSrc
  }, [imgSrc]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fit image ──
  const fitImage = useCallback((size?: { w: number; h: number }) => {
    const s = size ?? imgSize
    if (!s || !containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const z = Math.min(r.width / s.w, r.height / s.h, 1) * 0.92
    setZoom(z)
    setPan({ x: (r.width - s.w * z) / 2, y: (r.height - s.h * z) / 2 })
  }, [imgSize])

  useEffect(() => { if (imgSrc && imgSize) requestAnimationFrame(() => fitImage()) }, [imgSrc, imgSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Focus label input ──
  useEffect(() => { if (pendingPts) setTimeout(() => labelRef.current?.focus(), 30) }, [pendingPts])

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space')  { setSpaceDown(true); e.preventDefault() }
      if (e.key  === 'Escape') { syncCurrentPts([]); setPendingPts(null); setSelectedId(null) }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !stageMode) setDeleteConfirm(selectedId)
    }
    const onUp = (e: KeyboardEvent) => { if (e.code === 'Space') { setSpaceDown(false); isPanning.current = false } }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup',   onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [selectedId, syncCurrentPts]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Coordinate helpers ─────────────────────────────────────────────────────
  const getXY = (e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const toImage  = useCallback((cx: number, cy: number): Point => ({ x: (cx - pan.x) / zoom, y: (cy - pan.y) / zoom }), [pan, zoom])
  const toScreen = useCallback((ix: number, iy: number): Point => ({ x: ix * zoom + pan.x, y: iy * zoom + pan.y }), [pan, zoom])

  // ── DB: auto-save SVG ──────────────────────────────────────────────────────
  const autoSaveSvg = useCallback(async (units: DrawUnit[]) => {
    if (!imgSize) return
    const svg = buildSvg(units, imgSize.w, imgSize.h)
    await fetch(`/api/admin/projects/${projectId}/svg`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svgContent: svg }),
    })
  }, [projectId, imgSize])

  // ── DB: create unit after polygon drawn (unit mode) ────────────────────────
  const confirmPolygon = async () => {
    if (stageMode) return confirmStagePolygon()
    if (!pendingPts) return

    // If redrawing an existing unit, just update its polygon
    if (redrawingUnitId) {
      setDrawUnits(prev => {
        const next = prev.map(u => u.id === redrawingUnitId ? { ...u, points: pendingPts! } : u)
        autoSaveSvg(next)
        return next
      })
      setPendingPts(null); setRedrawingUnitId(null)
      toast.success('Polygon przerysowany')
      return
    }

    if (!newLabel.trim()) return
    setCreating(true)

    const baseId = sanitizeId(newLabel.trim())
    const ids    = drawUnits.map(u => u.svgElementId)
    let svgId    = baseId
    let n        = 2
    while (ids.includes(svgId)) svgId = `${baseId}-${n++}`

    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId, svgElementId: svgId, label: newLabel.trim(), status: 'available',
          houseTypeId: newHouseTypeId || null,
        }),
      })
      if (!res.ok) throw new Error()
      const unit = await res.json()
      const nu: DrawUnit = {
        id: unit.id, svgElementId: svgId, label: newLabel.trim(), status: 'available',
        points: pendingPts, area: null, gardenArea: null, rooms: null,
        floors: null, floor: null, buildingLabel: null, price: null,
        fullPrice: null, parkingPrice: null, storagePrice: null,
        rightsPrice: null, otherPrice: null,
        partsType: null, partsLabel: null, roomsType: null, roomsLabel: null,
        rightsDesc: null, otherDesc: null,
        description: null, houseTypeId: newHouseTypeId || null,
      }
      setDrawUnits(prev => { const next = [...prev, nu]; autoSaveSvg(next); return next })
      setPendingPts(null); setNewLabel(''); setNewHouseTypeId('')
      toast.success(`Added: ${nu.label}`)
    } catch { toast.error('Error creating plot') }
    setCreating(false)
  }

  // ── DB: attach polygon to existing unit ──────────────────────────────────
  const confirmAttachExisting = async () => {
    if (!pendingPts || !attachExistingId) return
    setCreating(true)
    try {
      const existing = initialUnits.find(u => u.id === attachExistingId)
      if (!existing) throw new Error()
      const svgId = existing.svgElementId || sanitizeId(existing.label)
      // Update unit's svgElementId in DB if needed
      if (existing.svgElementId !== svgId) {
        await fetch(`/api/admin/units/${existing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ svgElementId: svgId }),
        })
      }
      const nu: DrawUnit = {
        id: existing.id, svgElementId: svgId, label: existing.label,
        status: (existing.status as Status) || 'available',
        points: pendingPts,
        area: existing.area, gardenArea: existing.gardenArea, rooms: existing.rooms,
        floors: existing.floors, floor: existing.floor, buildingLabel: existing.buildingLabel ?? null,
        price: existing.price,
        fullPrice: existing.fullPrice ?? null, parkingPrice: existing.parkingPrice ?? null,
        storagePrice: existing.storagePrice ?? null, rightsPrice: existing.rightsPrice ?? null,
        otherPrice: existing.otherPrice ?? null,
        partsType: existing.partsType ?? null, partsLabel: existing.partsLabel ?? null,
        roomsType: existing.roomsType ?? null, roomsLabel: existing.roomsLabel ?? null,
        rightsDesc: existing.rightsDesc ?? null, otherDesc: existing.otherDesc ?? null,
        description: existing.description, houseTypeId: existing.houseTypeId ?? null,
      }
      setDrawUnits(prev => { const next = [...prev.filter(u => u.id !== existing.id), nu]; autoSaveSvg(next); return next })
      setPendingPts(null); setAttachExistingId('')
      toast.success(`Przypisano polygon: ${existing.label}`)
    } catch { toast.error('Assignment error') }
    setCreating(false)
  }

  // ── Re-draw polygon for existing unit ─────────────────────────────────────
  const startRedraw = (unitId: string) => {
    setRedrawingUnitId(unitId)
    setSelectedId(null)
    setTool('draw')
    syncCurrentPts([])
    toast('Draw a new polygon, then double-click to close')
  }

  // ── DB: assign polygon to stage (stage mode) ─────────────────────────────
  const confirmStagePolygon = async () => {
    if (!pendingPts || !newStageId) return
    const stage = stages.find(s => s.id === newStageId)
    if (!stage) return
    setCreating(true)

    const svgId = stage.svgElementId || sanitizeId(stage.name)

    try {
      // Update stage svgElementId if needed
      if (stage.svgElementId !== svgId) {
        await fetch(`/api/admin/stages/${stage.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ svgElementId: svgId }),
        })
      }
      // Remove old polygon for this stage if exists, then add new
      const nu: DrawUnit = {
        id: stage.id, svgElementId: svgId, label: stage.name, status: 'available',
        points: pendingPts, area: null, gardenArea: null, rooms: null,
        floors: null, floor: null, buildingLabel: null, price: null,
        fullPrice: null, parkingPrice: null, storagePrice: null,
        rightsPrice: null, otherPrice: null,
        partsType: null, partsLabel: null, roomsType: null, roomsLabel: null,
        rightsDesc: null, otherDesc: null,
        description: null, houseTypeId: null,
      }
      setDrawUnits(prev => {
        const next = [...prev.filter(u => u.id !== stage.id), nu]
        autoSaveSvg(next)
        return next
      })
      setPendingPts(null); setNewStageId('')
      onStagesChange?.()
      toast.success(`Przypisano: ${stage.name}`)
    } catch { toast.error('Error assigning stage') }
    setCreating(false)
  }

  // ── DB: delete unit / remove stage polygon ─────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteIsUnit, setDeleteIsUnit] = useState(false) // true = deleting a unit (not stage polygon)
  const handleDeleteUnit = useCallback((dbId: string) => {
    if (stageMode) {
      // In stage mode on the canvas, just remove polygon from SVG (don't delete the stage itself)
      setDrawUnits(prev => { const next = prev.filter(u => u.id !== dbId); autoSaveSvg(next); return next })
      setSelectedId(null)
      toast('Stage polygon deleted')
      return
    }
    setDeleteIsUnit(false)
    setDeleteConfirm(dbId)
  }, [autoSaveSvg, stageMode])

  const handleDeleteUnitFromList = useCallback((dbId: string) => {
    setDeleteIsUnit(true)
    setDeleteConfirm(dbId)
  }, [])

  const confirmDeleteUnit = useCallback(async () => {
    if (!deleteConfirm) return
    await fetch(`/api/admin/units/${deleteConfirm}`, { method: 'DELETE' })
    if (deleteIsUnit || stageMode) {
      setUnitList(prev => prev.filter(u => u.id !== deleteConfirm))
      setEditingUnitId(null)
    }
    if (!deleteIsUnit) {
      setDrawUnits(prev => { const next = prev.filter(u => u.id !== deleteConfirm); autoSaveSvg(next); return next })
      setSelectedId(null)
    }
    setDeleteConfirm(null)
    setDeleteIsUnit(false)
    toast('Plot deleted')
  }, [deleteConfirm, deleteIsUnit, autoSaveSvg, stageMode])

  // ── DB: save edit form ────────────────────────────────────────────────────
  const saveEditForm = async () => {
    const editId = stageMode ? editingUnitId : selectedId
    if (!editId) return
    setSavingUnit(true)
    const body = {
      label:         editForm.label,
      status:        editForm.status,
      // area is derived from the house type (sum of its room areas) and computed
      // at read time — never entered or stored here.
      gardenArea:    editForm.gardenArea ? parseFloat(editForm.gardenArea) : null,
      rooms:         editForm.rooms      ? parseInt(editForm.rooms)        : null,
      floors:        editForm.floors     ? parseInt(editForm.floors)       : null,
      floor:         editForm.floor      || null,
      buildingLabel: editForm.buildingLabel || null,
      price:         editForm.price      ? parseInt(editForm.price)        : null,
      fullPrice:     editForm.fullPrice  ? parseInt(editForm.fullPrice)    : null,
      parkingPrice:  editForm.parkingPrice ? parseInt(editForm.parkingPrice) : null,
      storagePrice:  editForm.storagePrice ? parseInt(editForm.storagePrice) : null,
      rightsPrice:   editForm.rightsPrice ? parseInt(editForm.rightsPrice)  : null,
      otherPrice:    editForm.otherPrice ? parseInt(editForm.otherPrice)   : null,
      partsType:     editForm.partsType  || null,
      partsLabel:    editForm.partsLabel || null,
      roomsType:     editForm.roomsType  || null,
      roomsLabel:    editForm.roomsLabel || null,
      rightsDesc:    editForm.rightsDesc  || null,
      otherDesc:     editForm.otherDesc  || null,
      description:   editForm.description || null,
      houseTypeId:   editForm.houseTypeId || null,
    }
    await fetch(`/api/admin/units/${editId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (stageMode) {
      setUnitList(prev => prev.map(u => u.id === editId ? { ...u, ...body } : u))
    } else {
      setDrawUnits(prev => prev.map(u => u.id === editId ? { ...u, ...body } : u))
    }
    setSavingUnit(false)
    toast.success('Saved')
  }

  // ── DB: add blank unit (no polygon) ───────────────────────────────────────
  const [addingUnit, setAddingUnit] = useState(false)
  const addBlankUnit = async () => {
    setAddingUnit(true)
    const existingUnits = stageMode ? unitList : drawUnits
    const idx = existingUnits.length + 1
    const label = `Plot ${idx}`
    const baseId = sanitizeId(label)
    const ids = [...drawUnits.map(u => u.svgElementId), ...unitList.map(u => u.svgElementId)]
    let svgId = baseId
    let n = 2
    while (ids.includes(svgId)) svgId = `${baseId}-${n++}`

    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, svgElementId: svgId, label, status: 'available' }),
      })
      if (!res.ok) throw new Error()
      const unit = await res.json()
      const nu: DrawUnit = {
        id: unit.id, svgElementId: svgId, label, status: 'available',
        points: [], area: null, gardenArea: null, rooms: null,
        floors: null, floor: null, buildingLabel: null, price: null,
        fullPrice: null, parkingPrice: null, storagePrice: null,
        rightsPrice: null, otherPrice: null,
        partsType: null, partsLabel: null, roomsType: null, roomsLabel: null,
        rightsDesc: null, otherDesc: null,
        description: null, houseTypeId: null,
      }
      if (stageMode) {
        setUnitList(prev => [...prev, nu])
        setEditingUnitId(nu.id)
        setEditForm(unitToForm(nu))
        setBottomTab('units')
      } else {
        setDrawUnits(prev => [...prev, nu])
        setSelectedId(nu.id)
        setEditForm(unitToForm(nu))
        setTool('select')
      }
      toast.success(`Added: ${label} — fill in the details and draw the polygon later`)
    } catch { toast.error('Error creating plot') }
    setAddingUnit(false)
  }

  // ── DB: update status directly ────────────────────────────────────────────
  const updateStatus = useCallback(async (dbId: string, status: Status) => {
    await fetch(`/api/admin/units/${dbId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    if (stageMode) {
      setUnitList(prev => prev.map(u => u.id === dbId ? { ...u, status } : u))
    } else {
      setDrawUnits(prev => prev.map(u => u.id === dbId ? { ...u, status } : u))
    }
    const editId = stageMode ? editingUnitId : selectedId
    if (editId === dbId) setEditForm(f => ({ ...f, status }))
  }, [selectedId, editingUnitId, stageMode])

  // ── Image upload ──────────────────────────────────────────────────────────
  const onImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingImg(true)
    try {
      const form = new FormData(); form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      const url: string = data.url
      if (!url) throw new Error('No URL returned')

      await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planImageUrl: url }),
      })

      // Reset imgSize so the useEffect reloads dimensions from the new image
      setImgSize(null)
      setImgSrc(url)
      onPlanImageChange?.(url)
      toast.success('Plan wgrany')
    } catch { toast.error('Upload error') }
    setUploadingImg(false); e.target.value = ''
  }

  // ── Import SVG ────────────────────────────────────────────────────────────
  const handleImportSvg = async () => {
    if (!importText.trim()) return
    try {
      const doc = new DOMParser().parseFromString(importText, 'image/svg+xml')
      const vb  = doc.querySelector('svg')?.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
      if (vb?.length === 4 && vb[2] > 0) setImgSize({ w: vb[2], h: vb[3] })

      const polys   = parseSvgPolygons(importText)
      if (!polys.length) { toast.error('No polygons found'); return }

      const existing = new Set(drawUnits.map(u => u.svgElementId))
      const news     = polys.filter(p => !existing.has(p.id))
      const added: DrawUnit[] = []

      for (const poly of news) {
        const label = poly.id.replace(/^unit-/, '').replace(/-/g, ' ')
        const res = await fetch('/api/admin/units', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, svgElementId: poly.id, label, status: 'available' }),
        })
        if (res.ok) {
          const u = await res.json()
          added.push({ id: u.id, svgElementId: poly.id, label, status: 'available', points: poly.points,
            area: null, gardenArea: null, rooms: null, floors: null, floor: null,
            buildingLabel: null, price: null, fullPrice: null, parkingPrice: null, storagePrice: null,
            rightsPrice: null, otherPrice: null, partsType: null, partsLabel: null,
            roomsType: null, roomsLabel: null, rightsDesc: null, otherDesc: null,
            description: null, houseTypeId: null })
        }
      }
      if (added.length) {
        setDrawUnits(prev => { const next = [...prev, ...added]; autoSaveSvg(next); return next })
        toast.success(`Imported ${added.length} plots`)
      }
      setShowImport(false); setImportText('')
    } catch { toast.error('Import error') }
  }

  // ── Viewport events ───────────────────────────────────────────────────────
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
      const f  = e.deltaY < 0 ? 1.12 : 1 / 1.12
      const z  = zoomRef.current
      const nz = Math.min(Math.max(z * f, 0.04), 20)
      const r  = nz / z
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
      isPanning.current = true
    }
  }, [spaceDown, pan])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const { x: cx, y: cy } = getXY(e)
    if (isPanning.current && panOrigin.current) {
      setPan({ x: panOrigin.current.px + cx - panOrigin.current.mx, y: panOrigin.current.py + cy - panOrigin.current.my })
      return
    }
    const ip = toImage(cx, cy); setMouseImg(ip)
    if (tool === 'draw' && currentPtsRef.current.length >= 3) {
      const fp = currentPtsRef.current[0]
      setNearFirst(Math.hypot((fp.x - ip.x) * zoom, (fp.y - ip.y) * zoom) < SNAP_PX)
    } else setNearFirst(false)
    if (tool === 'select') {
      let h: string | null = null
      for (let i = drawUnits.length - 1; i >= 0; i--)
        if (drawUnits[i].points.length >= 3 && pointInPolygon(ip, drawUnits[i].points)) { h = drawUnits[i].svgElementId; break }
      setHoveredElem(h)
    }
  }, [toImage, tool, zoom, drawUnits])

  const onMouseUp    = useCallback(() => { isPanning.current = false; panOrigin.current = null }, [])
  const onMouseLeave = useCallback(() => { setMouseImg(null); setNearFirst(false) }, [])

  const onClick = useCallback((e: React.MouseEvent) => {
    if (isPanning.current || pendingPts || e.detail !== 1) return
    const { x: cx, y: cy } = getXY(e); const ip = toImage(cx, cy)
    if (tool === 'draw') {
      const pts = currentPtsRef.current
      if (pts.length >= 3 && Math.hypot((pts[0].x - ip.x) * zoom, (pts[0].y - ip.y) * zoom) < SNAP_PX) {
        setPendingPts(pts); syncCurrentPts([]); setNewLabel(''); return
      }
      syncCurrentPts([...pts, ip])
    } else {
      let found: DrawUnit | null = null
      for (let i = drawUnits.length - 1; i >= 0; i--)
        if (drawUnits[i].points.length >= 3 && pointInPolygon(ip, drawUnits[i].points)) { found = drawUnits[i]; break }
      if (found) { setSelectedId(found.id); setEditForm(unitToForm(found)) }
      else        { setSelectedId(null) }
    }
  }, [pendingPts, toImage, tool, zoom, syncCurrentPts, drawUnits])

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (tool !== 'draw') return; e.preventDefault()
    const pts = currentPtsRef.current; if (pts.length < 3) return
    setPendingPts(pts); syncCurrentPts([]); setNewLabel('')
  }, [tool, syncCurrentPts])

  const zoomAround = useCallback((f: number) => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const cx = r.width / 2, cy = r.height / 2
    const nz = Math.min(Math.max(zoom * f, 0.04), 20)
    const rt = nz / zoom
    setZoom(nz); setPan(p => ({ x: cx - rt * (cx - p.x), y: cy - rt * (cy - p.y) }))
  }, [zoom])

  // ── Derived ────────────────────────────────────────────────────────────────
  const iz           = 1 / zoom
  const selectedUnit = drawUnits.find(u => u.id === selectedId) ?? null
  const activeEditUnit = stageMode
    ? (editingUnitId ? unitList.find(u => u.id === editingUnitId) ?? null : null)
    : selectedUnit
  const activeEditId = stageMode ? editingUnitId : selectedId
  const labelPos     = pendingPts ? (() => { const c = centroid(pendingPts); return toScreen(c.x, c.y) })() : null

  const getCursor = () => {
    if (spaceDown || isPanning.current) return 'grabbing'
    if (tool === 'draw') return 'crosshair'
    if (hoveredElem)     return 'pointer'
    return 'default'
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col border rounded-xl overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 120px)', minHeight: 900 }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b flex-shrink-0 flex-wrap gap-y-1.5">
        <div className="flex rounded-md overflow-hidden border text-sm">
          <button onClick={() => setTool('draw')} className={`px-3 py-1.5 flex items-center gap-1.5 font-medium transition-colors ${tool === 'draw' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
            <Pencil className="h-3.5 w-3.5" /> Rysuj
          </button>
          <button onClick={() => setTool('select')} className={`px-3 py-1.5 flex items-center gap-1.5 font-medium transition-colors border-l ${tool === 'select' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
            <MousePointer2 className="h-3.5 w-3.5" /> Zaznacz
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <Button variant="outline" size="sm" className="h-8" onClick={() => { if (currentPtsRef.current.length > 0) syncCurrentPts(currentPtsRef.current.slice(0, -1)) }}>
          <Undo2 className="h-3.5 w-3.5 mr-1" /> Cofnij punkt
        </Button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <Button variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()} disabled={uploadingImg}>
          {uploadingImg ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
          {imgSrc ? 'Change plan' : 'Upload plan'}
        </Button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImgUpload} />

        <Button variant="outline" size="sm" className="h-8" onClick={() => setShowImport(true)}>
          <FileUp className="h-3.5 w-3.5 mr-1" /> Wczytaj SVG
        </Button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => zoomAround(1.25)}><ZoomIn className="h-4 w-4" /></Button>
        <span className="text-sm text-gray-500 tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => zoomAround(1 / 1.25)}><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => fitImage()} title="Dopasuj"><Maximize2 className="h-4 w-4" /></Button>

        <div className="h-5 w-px bg-gray-200 mx-1" />
        <Button variant="outline" size="sm" className="h-8" onClick={addBlankUnit} disabled={addingUnit}>
          {addingUnit ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          Add plot
        </Button>

        <span className="ml-auto text-xs text-gray-400 tabular-nums">{stageMode ? `${unitList.length} plots · ${drawUnits.length} stages` : `${drawUnits.length} plots`}</span>
      </div>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-h-0">

        {/* Canvas - full width */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-[#d4d4d4] select-none min-h-[300px]"
          style={{ cursor: getCursor() }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
          onClick={onClick} onDoubleClick={onDoubleClick}
          onContextMenu={e => e.preventDefault()}
        >
          {/* Zoomed workspace */}
          <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
            {imgSrc && imgSize && (
              <>
                <img src={imgSrc} alt="Plan" style={{ display: 'block', width: imgSize.w, height: imgSize.h, maxWidth: 'none' }} draggable={false} />
                <svg style={{ position: 'absolute', top: 0, left: 0, width: imgSize.w, height: imgSize.h, overflow: 'visible' }}>

                  {/* Existing polygons */}
                  {drawUnits.map(unit => {
                    if (unit.points.length < 3) return null
                    const pts   = unit.points.map(p => `${p.x},${p.y}`).join(' ')
                    const color = stageMode ? '#6E2E2A' : STATUS_COLOR[unit.status]
                    const isSel = unit.id === selectedId
                    const isHov = unit.svgElementId === hoveredElem
                    const c     = centroid(unit.points)
                    return (
                      <g key={unit.id}>
                        <polygon points={pts} fill={color} fillOpacity={(isSel || isHov) ? 0.55 : 0.45}
                          stroke="none" />
                        <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central"
                          fontSize={13 * iz} fontWeight="700" fill="#fff"
                          stroke="rgba(0,0,0,0.6)" strokeWidth={3 * iz} paintOrder="stroke"
                          style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: 'Inter,sans-serif' }}
                        >{unit.label}</text>
                      </g>
                    )
                  })}

                  {/* In-progress polygon */}
                  {currentPts.length > 0 && (
                    <g>
                      {currentPts.length >= 2 && mouseImg && (
                        <polygon points={[...currentPts, nearFirst ? currentPts[0] : mouseImg].map(p => `${p.x},${p.y}`).join(' ')} fill="#6E2E2A" fillOpacity={0.12} />
                      )}
                      {currentPts.length >= 2 && (
                        <polyline points={currentPts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#6E2E2A" strokeWidth={1.5 * iz} strokeDasharray={`${5 * iz} ${3 * iz}`} />
                      )}
                      {mouseImg && (
                        <line x1={currentPts[currentPts.length - 1].x} y1={currentPts[currentPts.length - 1].y}
                          x2={nearFirst ? currentPts[0].x : mouseImg.x} y2={nearFirst ? currentPts[0].y : mouseImg.y}
                          stroke="#6E2E2A" strokeWidth={1.5 * iz} strokeDasharray={`${5 * iz} ${3 * iz}`} strokeOpacity={0.55} />
                      )}
                      {currentPts.map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y}
                          r={(i === 0 && nearFirst ? 8 : 4) * iz}
                          fill={i === 0 ? (nearFirst ? '#22c55e' : '#6E2E2A') : '#6E2E2A'}
                          stroke="#fff" strokeWidth={1.5 * iz} />
                      ))}
                      {nearFirst && (
                        <circle cx={currentPts[0].x} cy={currentPts[0].y} r={12 * iz} fill="none"
                          stroke="#22c55e" strokeWidth={1.5 * iz} strokeDasharray={`${4 * iz} ${3 * iz}`} opacity={0.8} />
                      )}
                    </g>
                  )}

                  {/* Pending polygon (awaiting label) */}
                  {pendingPts && (
                    <polygon points={pendingPts.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="#22c55e" fillOpacity={0.25} stroke="#22c55e" strokeWidth={2 * iz}
                      strokeDasharray={`${6 * iz} ${3 * iz}`} />
                  )}
                </svg>
              </>
            )}

            {/* No image placeholder */}
            {!imgSrc && (
              <div className="flex flex-col items-center justify-center gap-3 text-gray-400 rounded-xl border-2 border-dashed border-gray-300 bg-white cursor-pointer hover:border-gray-400 transition-colors"
                style={{ width: 600, height: 400 }} onClick={() => fileRef.current?.click()}>
                <Upload className="h-10 w-10 text-gray-300" />
                <div className="text-center">
                  <p className="font-semibold text-gray-600">Upload plan sytuacyjny (JPG/PNG)</p>
                  <p className="text-sm mt-1 text-gray-400">Click here or use the “Upload plan” button</p>
                </div>
              </div>
            )}
          </div>

          {/* Label input overlay */}
          {pendingPts && labelPos && (
            <div style={{
              position: 'absolute',
              left: Math.min(Math.max(labelPos.x - 130, 8), (containerRef.current?.clientWidth ?? 800) - 280),
              top:  Math.min(Math.max(labelPos.y - 64,  8), (containerRef.current?.clientHeight ?? 600) - 200),
              zIndex: 20,
            }} className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-64" onClick={e => e.stopPropagation()}>
              {stageMode ? (
                <>
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Przypisz do etapu</p>
                  <Select value={newStageId} onValueChange={setNewStageId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>
                      {stages.filter(s => !drawUnits.some(u => u.id === s.id)).map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                      ))}
                      {stages.filter(s => drawUnits.some(u => u.id === s.id)).map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-xs text-gray-400">{s.name} (replace)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="flex-1 h-7" onClick={confirmStagePolygon} disabled={creating || !newStageId}
                      style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
                      {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" /> OK</>}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { setPendingPts(null); setNewStageId('') }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              ) : redrawingUnitId ? (
                <>
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Przerysuj: {drawUnits.find(u => u.id === redrawingUnitId)?.label}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-7" onClick={confirmPolygon} disabled={creating}
                      style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Confirm
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { setPendingPts(null); setRedrawingUnitId(null) }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Attach to existing unit (imported from CSV) */}
                  {(() => {
                    const unassigned = initialUnits.filter(u => !drawUnits.some(d => d.id === u.id))
                    if (unassigned.length === 0) return null
                    return (
                      <div className="mb-3 pb-3 border-b">
                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Assign existing</p>
                        <Select value={attachExistingId} onValueChange={setAttachExistingId}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select plot..." /></SelectTrigger>
                          <SelectContent>
                            {unassigned.map(u => (
                              <SelectItem key={u.id} value={u.id} className="text-xs">
                                {u.label} {u.area ? `(${u.area}m²)` : ''} {u.price ? `${(u.price/1000).toFixed(0)}k` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="flex-1 h-7" onClick={confirmAttachExisting} disabled={creating || !attachExistingId}
                            style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
                            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" /> Przypisz</>}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setAttachExistingId('')}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Or create new unit */}
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Or create a new one</p>
                  <Input ref={labelRef} value={newLabel} onChange={e => setNewLabel(e.target.value)}
                    placeholder="np. Dom 1" className="h-8 text-sm"
                    onKeyDown={e => { if (e.key === 'Enter') confirmPolygon(); if (e.key === 'Escape') { setPendingPts(null); setNewLabel(''); setNewHouseTypeId(''); setAttachExistingId('') } }} />
                  {houseTypes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Typ domu</p>
                      <Select value={newHouseTypeId} onValueChange={setNewHouseTypeId}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select typ" /></SelectTrigger>
                        <SelectContent>
                          {houseTypes.map(ht => (
                            <SelectItem key={ht.id} value={ht.id} className="text-xs">{ht.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="flex-1 h-7" onClick={confirmPolygon} disabled={creating || !newLabel.trim()}
                      style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
                      {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" /> OK</>}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { setPendingPts(null); setNewLabel(''); setNewHouseTypeId(''); setAttachExistingId('') }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Cursor coords */}
          {tool === 'draw' && mouseImg && (
            <div className="absolute bottom-2 left-2 bg-black/55 text-white text-xs px-2 py-1 rounded font-mono pointer-events-none tabular-nums">
              x: {Math.round(mouseImg.x)}  y: {Math.round(mouseImg.y)}
            </div>
          )}

          {/* Hint bar */}
          {tool === 'draw' && imgSrc && !pendingPts && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
              {currentPts.length === 0
                ? (stageMode ? 'Draw the stage area · Scroll = zoom · Space+LMB = pan' : 'Click to start · Scroll = zoom · Space+LMB = pan')
                : currentPts.length < 3 ? `Add punkt (${currentPts.length}/3 min) · Esc = cancel`
                : 'Click the first point or double-click to close'}
            </div>
          )}
        </div>

        {/* ── Edit Form (full-width bar when a unit is selected) ── */}
        {activeEditUnit && (
          <div className="bg-white border-t flex-shrink-0">
            <div className="px-4 py-2 border-b flex items-center justify-between bg-blue-50">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Edit: {activeEditUnit.label}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-7" onClick={saveEditForm} disabled={savingUnit} style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
                  {savingUnit ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Save
                </Button>
                {!stageMode && (
                  <Button size="sm" variant="outline" className="h-7" onClick={() => startRedraw(activeEditUnit.id)} title="Przerysuj polygon">
                    <Pencil className="h-3 w-3 mr-1" /> Przerysuj
                  </Button>
                )}
                <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => stageMode ? handleDeleteUnitFromList(activeEditUnit.id) : handleDeleteUnit(activeEditUnit.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
                <button onClick={() => { if (stageMode) setEditingUnitId(null); else setSelectedId(null) }} className="text-gray-400 hover:text-gray-600 ml-1"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))} className="h-7 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v as Status }))}>
                    <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['available', 'reserved', 'sold'] as Status[]).map(s => (
                        <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Building</Label>
                  <Input value={editForm.buildingLabel} onChange={e => setEditForm(f => ({ ...f, buildingLabel: e.target.value }))} className="h-7 text-xs mt-1" placeholder="G" />
                </div>
                {houseTypes.length > 0 && (
                  <div>
                    <Label className="text-xs">Typ domu</Label>
                    <Select value={editForm.houseTypeId || 'none'} onValueChange={v => setEditForm(f => ({ ...f, houseTypeId: v === 'none' ? '' : v }))}>
                      <SelectTrigger className="h-7 text-xs mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— brak —</SelectItem>
                        {houseTypes.map(ht => (
                          <SelectItem key={ht.id} value={ht.id}>{ht.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Pow. m² is derived from the selected house type (sum of its
                    room areas) — read-only here. No type → no area. */}
                <div>
                  <Label className="text-xs text-muted-foreground">Pow. m²</Label>
                  <div className="h-7 text-xs mt-1 px-2 flex items-center rounded-md border bg-muted text-muted-foreground font-medium">
                    {(() => {
                      const ta = houseTypes.find(ht => ht.id === editForm.houseTypeId)?.totalArea
                      return ta != null ? `${ta} m²` : (editForm.houseTypeId ? '—' : 'Select typ domu')
                    })()}
                  </div>
                </div>
                {[
                  ['gardenArea',   'Garden m²',     'number', '200'],
                  ['rooms',        'Rooms',       'number', '4'  ],
                  ['floors',       'Floors',       'number', '2'  ],
                  ['floor',        'Floor',       'text',   'Parter'],
                  ['price',        'Price PLN',     'number', '1050000'],
                  ['parkingPrice', 'Parking PLN',  'number', '35000'],
                  ['storagePrice', 'Storage €',  'number', '15000'],
                  ['rightsPrice',  'Prawa PLN',    'number', '0'],
                  ['otherPrice',   'Gardenek PLN',  'number', '0'],
                ].map(([key, lbl, type, ph]) => (
                  <div key={key}>
                    <Label className="text-xs">{lbl}</Label>
                    <Input type={type} value={(editForm as unknown as Record<string, string>)[key]}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="h-7 text-xs mt-1" placeholder={ph} />
                  </div>
                ))}
                <div>
                  <Label className="text-xs text-muted-foreground">Full price</Label>
                  <div className="h-7 text-xs mt-1 px-2 flex items-center rounded-md border bg-muted text-muted-foreground font-medium">
                    {editForm.price
                      ? ((parseInt(editForm.price) || 0) + (parseInt(editForm.parkingPrice) || 0) + (parseInt(editForm.storagePrice) || 0) + (parseInt(editForm.rightsPrice) || 0) + (parseInt(editForm.otherPrice) || 0)).toLocaleString('de-DE') + ' PLN'
                      : '—'}
                  </div>
                </div>
                {[
                  ['partsType',  'Parts - type',    'Parking'],
                  ['partsLabel', 'Parts - label',   'P1'],
                  ['roomsType',  'Pomieszcz. - typ','Storage room'],
                  ['roomsLabel', 'Pomieszcz. - ozn.','K1'],
                  ['rightsDesc', 'Prawa - opis',    ''],
                  ['otherDesc',  'Inne - opis',     ''],
                ].map(([key, lbl, ph]) => (
                  <div key={key}>
                    <Label className="text-xs">{lbl}</Label>
                    <Input value={(editForm as unknown as Record<string, string>)[key]}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="h-7 text-xs mt-1" placeholder={ph} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Properties Panel (below map) ── */}
        <div className="h-64 bg-white border-t flex overflow-hidden flex-shrink-0">

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab header */}
            <div className="px-4 py-2 border-b flex items-center justify-between flex-shrink-0">
              {stageMode ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBottomTab('units')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${bottomTab === 'units' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Plots ({unitList.length})
                  </button>
                  <button
                    onClick={() => setBottomTab('stages')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${bottomTab === 'stages' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Etapy ({drawUnits.length}/{stages.length})
                  </button>
                </div>
              ) : (
                <h3 className="font-semibold text-sm text-gray-800">
                  Plots ({drawUnits.length})
                </h3>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Stages tab (stage mode only) */}
              {stageMode && bottomTab === 'stages' && (
                drawUnits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-1">
                    <p>No stages assigned</p>
                    <p className="text-xs">Narysuj polygony na planie</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {drawUnits.map(unit => (
                      <div key={unit.id}
                        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm ${unit.id === selectedId ? 'bg-blue-50' : ''}`}
                        onClick={() => { setSelectedId(unit.id); setTool('select') }}>
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#6E2E2A' }} />
                        <span className="font-medium flex-1 truncate">{unit.label}</span>
                        <button className="text-gray-300 hover:text-red-500 p-0.5 transition-colors"
                          onClick={e => { e.stopPropagation(); handleDeleteUnit(unit.id) }}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Units tab (stage mode) */}
              {stageMode && bottomTab === 'units' && (
                unitList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-1">
                    <p>No plots</p>
                    <p className="text-xs">Use “Add plot” to add</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {unitList.map(unit => (
                      <div key={unit.id}
                        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm ${unit.id === editingUnitId ? 'bg-blue-50' : ''}`}
                        onClick={() => { setEditingUnitId(unit.id); setEditForm(unitToForm(unit)) }}>
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[unit.status] }} />
                        <span className="font-medium flex-1 truncate">{unit.label}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{unit.area ? `${unit.area}m²` : ''}</span>
                        <Select value={unit.status} onValueChange={v => updateStatus(unit.id, v as Status)}>
                          <SelectTrigger className="h-6 text-xs border-0 shadow-none p-0 pr-5 focus:ring-0 w-auto" onClick={e => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['available', 'reserved', 'sold'] as Status[]).map(s => (
                              <SelectItem key={s} value={s} className="text-xs">{STATUS_LABEL[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button className="text-gray-300 hover:text-red-500 p-0.5 transition-colors"
                          onClick={e => { e.stopPropagation(); handleDeleteUnitFromList(unit.id) }}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Units list (non-stage mode) */}
              {!stageMode && (
                drawUnits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-1">
                    <p>No plots</p>
                    <p className="text-xs">Narysuj polygony na planie</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {drawUnits.map(unit => (
                      <div key={unit.id}
                        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm ${unit.id === selectedId ? 'bg-blue-50' : ''}`}
                        onClick={() => { setSelectedId(unit.id); setTool('select'); setEditForm(unitToForm(unit)) }}>
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[unit.status] }} />
                        <span className="font-medium flex-1 truncate">{unit.label}</span>
                        {unit.points.length < 3 && <span className="text-xs text-orange-500 flex-shrink-0">brak polygonu</span>}
                        <span className="text-xs text-gray-400 flex-shrink-0">{unit.area ? `${unit.area}m²` : ''}</span>
                        <Select value={unit.status} onValueChange={v => updateStatus(unit.id, v as Status)}>
                          <SelectTrigger className="h-6 text-xs border-0 shadow-none p-0 pr-5 focus:ring-0 w-auto" onClick={e => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['available', 'reserved', 'sold'] as Status[]).map(s => (
                              <SelectItem key={s} value={s} className="text-xs">{STATUS_LABEL[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button className="text-gray-300 hover:text-red-500 p-0.5 transition-colors"
                          onClick={e => { e.stopPropagation(); handleDeleteUnit(unit.id) }}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Import SVG dialog ── */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[560px] p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-semibold">Wczytaj SVG</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Wklej kod SVG (z Figmy, Inkscape lub eksportu edytora).</p>
            <Textarea value={importText} onChange={e => setImportText(e.target.value)}
              rows={8} className="font-mono text-xs resize-none"
              placeholder={'<svg viewBox="0 0 4000 3000" ...>...'} />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleImportSvg} style={{ backgroundColor: '#6E2E2A', color: 'white' }}>
                <FileUp className="h-4 w-4 mr-1.5" /> Importuj
              </Button>
              <Button variant="outline" onClick={() => { setShowImport(false); setImportText('') }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {/* ── Delete confirmation dialog ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-[400px] p-6 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete plot?</h3>
            <p className="text-sm text-gray-500 mb-1">
              Plot <strong>{(drawUnits.find(u => u.id === deleteConfirm) || unitList.find(u => u.id === deleteConfirm))?.label}</strong> will be permanently deleted along with its price history.
            </p>
            <p className="text-sm text-red-600 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteUnit}>
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete plot
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
