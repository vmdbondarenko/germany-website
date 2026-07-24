'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pencil, Search, Loader2 } from 'lucide-react'

type Unit = {
  id: string
  label: string
  buildingLabel: string | null
  svgElementId: string
  status: string
  stage: string | null
  area: number | null
  gardenArea: number | null
  floor: string | null
  rooms: number | null
  floors: number | null
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
  project: { id: string; name: string; slug: string }
  company: { id: string; name: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-red-100 text-red-800',
}

function formatPrice(n: number | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('de-DE').format(n) + ' €'
}

export function UnitsManager({ initialUnits }: { initialUnits: Unit[] }) {
  const [units, setUnits] = useState<Unit[]>(initialUnits)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const projects = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of units) map.set(u.project.id, u.project.name)
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pl'))
  }, [units])

  const companies = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of units) if (u.company) map.set(u.company.id, u.company.name)
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pl'))
  }, [units])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return units.filter(u => {
      if (projectFilter !== 'all' && u.project.id !== projectFilter) return false
      if (companyFilter !== 'all') {
        if (companyFilter === 'none' && u.company) return false
        if (companyFilter !== 'none' && u.company?.id !== companyFilter) return false
      }
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (q.length > 0) {
        const hay = `${u.label} ${u.buildingLabel ?? ''} ${u.project.name} ${u.company?.name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [units, search, projectFilter, companyFilter, statusFilter])

  const stats = useMemo(() => ({
    total: filtered.length,
    available: filtered.filter(u => u.status === 'available').length,
    reserved: filtered.filter(u => u.status === 'reserved').length,
    sold: filtered.filter(u => u.status === 'sold').length,
  }), [filtered])

  const handleSaved = (updated: Unit) => {
    setUnits(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))
    setEditing(null)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Plots</h1>
        <p className="text-gray-500 mt-1">Edit plot parameters — area, price, status</p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj po nazwie, budynku, inwestycji…"
            className="pl-9"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger><SelectValue placeholder="Inwestycja" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie inwestycje</SelectItem>
            {projects.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie firmy</SelectItem>
            <SelectItem value="none">Bez firmy</SelectItem>
            {companies.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 mb-4 text-sm">
        <Badge variant="secondary">Razem: {stats.total}</Badge>
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available: {stats.available}</Badge>
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Reserved: {stats.reserved}</Badge>
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Sold: {stats.sold}</Badge>
      </div>

      <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Inwestycja</th>
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Firma</th>
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Building</th>
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Plot</th>
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs text-right">Pow. (m²)</th>
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs text-right">Rooms</th>
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Floor</th>
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Status</th>
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs text-right">Price</th>
              <th className="px-3 py-2.5 font-semibold text-gray-600 uppercase tracking-wider text-xs text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                  No plots match the filters.
                </td>
              </tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-900">{u.project.name}</td>
                <td className="px-3 py-2 text-gray-600">{u.company?.name ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-3 py-2 text-gray-600">{u.buildingLabel ?? '—'}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{u.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u.area ?? '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u.rooms ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600">{u.floor ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[u.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[u.status] ?? u.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{formatPrice(u.price)}</td>
                <td className="px-3 py-2 text-right">
                  <Button variant="outline" size="sm" onClick={() => setEditing(u)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UnitEditDialog unit={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Edit dialog
// ─────────────────────────────────────────────────────────────────────────

function UnitEditDialog({
  unit,
  onClose,
  onSaved,
}: {
  unit: Unit | null
  onClose: () => void
  onSaved: (u: Unit) => void
}) {
  const [form, setForm] = useState<Partial<Unit>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-seed form whenever a different unit is opened
  useEffect(() => {
    if (unit) {
      setForm({ ...unit })
      setError(null)
    }
  }, [unit])

  if (!unit) return null

  const set = <K extends keyof Unit>(key: K, value: Unit[K] | null) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const numOrNull = (s: string): number | null => {
    if (s.trim() === '') return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }

  const intOrNull = (s: string): number | null => {
    if (s.trim() === '') return null
    const n = parseInt(s, 10)
    return Number.isFinite(n) ? n : null
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        label: form.label,
        buildingLabel: form.buildingLabel,
        status: form.status,
        stage: form.stage,
        // area is derived from the house type's rooms — read-only, never sent.
        gardenArea: form.gardenArea,
        floor: form.floor,
        rooms: form.rooms,
        floors: form.floors,
        price: form.price,
        parkingPrice: form.parkingPrice,
        storagePrice: form.storagePrice,
        rightsPrice: form.rightsPrice,
        otherPrice: form.otherPrice,
        partsType: form.partsType,
        partsLabel: form.partsLabel,
        roomsType: form.roomsType,
        roomsLabel: form.roomsLabel,
        rightsDesc: form.rightsDesc,
        otherDesc: form.otherDesc,
        description: form.description,
      }
      const res = await fetch(`/api/admin/units/${unit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Save failed (${res.status})`)
      }
      const saved = await res.json()
      onSaved({ ...unit, ...saved })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={unit !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit plot: {unit.label}</DialogTitle>
          <DialogDescription>
            {unit.project.name}
            {unit.company ? ` · ${unit.company.name}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input id="label" value={form.label ?? ''} onChange={e => set('label', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="buildingLabel">Building</Label>
            <Input id="buildingLabel" value={form.buildingLabel ?? ''} onChange={e => set('buildingLabel', e.target.value || null)} />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={form.status ?? 'available'} onValueChange={v => set('status', v)}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="stage">Stage</Label>
            <Input id="stage" value={form.stage ?? ''} onChange={e => set('stage', e.target.value || null)} />
          </div>

          <div>
            <Label htmlFor="area">Area (m²)</Label>
            <Input
              id="area"
              type="number"
              step="0.01"
              value={form.area ?? ''}
              readOnly
              disabled
              title="Calculated automatically from the house type’s room sum"
            />
            <p className="text-xs text-gray-400 mt-1">Calculated from the house type’s rooms</p>
          </div>
          <div>
            <Label htmlFor="gardenArea">Garden (m²)</Label>
            <Input id="gardenArea" type="number" step="0.01" value={form.gardenArea ?? ''} onChange={e => set('gardenArea', numOrNull(e.target.value))} />
          </div>

          <div>
            <Label htmlFor="floor">Floor</Label>
            <Input id="floor" value={form.floor ?? ''} onChange={e => set('floor', e.target.value || null)} />
          </div>
          <div>
            <Label htmlFor="rooms">Rooms</Label>
            <Input id="rooms" type="number" value={form.rooms ?? ''} onChange={e => set('rooms', intOrNull(e.target.value))} />
          </div>

          <div>
            <Label htmlFor="floors">Number of floors</Label>
            <Input id="floors" type="number" value={form.floors ?? ''} onChange={e => set('floors', intOrNull(e.target.value))} />
          </div>
          <div />

          <div className="col-span-2 border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Prices (€)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price podstawowa</Label>
                <Input id="price" type="number" value={form.price ?? ''} onChange={e => set('price', intOrNull(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="parkingPrice">Parking</Label>
                <Input id="parkingPrice" type="number" value={form.parkingPrice ?? ''} onChange={e => set('parkingPrice', intOrNull(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="storagePrice">Storage</Label>
                <Input id="storagePrice" type="number" value={form.storagePrice ?? ''} onChange={e => set('storagePrice', intOrNull(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="rightsPrice">Prawa</Label>
                <Input id="rightsPrice" type="number" value={form.rightsPrice ?? ''} onChange={e => set('rightsPrice', intOrNull(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="otherPrice">Inne</Label>
                <Input id="otherPrice" type="number" value={form.otherPrice ?? ''} onChange={e => set('otherPrice', intOrNull(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="col-span-2 border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Descriptiony dodatkowe</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partsType">Parts — type</Label>
                <Input id="partsType" value={form.partsType ?? ''} onChange={e => set('partsType', e.target.value || null)} />
              </div>
              <div>
                <Label htmlFor="partsLabel">Parts — label</Label>
                <Input id="partsLabel" value={form.partsLabel ?? ''} onChange={e => set('partsLabel', e.target.value || null)} />
              </div>
              <div>
                <Label htmlFor="roomsType">Pomieszczenia — typ</Label>
                <Input id="roomsType" value={form.roomsType ?? ''} onChange={e => set('roomsType', e.target.value || null)} />
              </div>
              <div>
                <Label htmlFor="roomsLabel">Pomieszczenia — etykieta</Label>
                <Input id="roomsLabel" value={form.roomsLabel ?? ''} onChange={e => set('roomsLabel', e.target.value || null)} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="rightsDesc">Description praw</Label>
                <Textarea id="rightsDesc" rows={2} value={form.rightsDesc ?? ''} onChange={e => set('rightsDesc', e.target.value || null)} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="otherDesc">Other obligations</Label>
                <Textarea id="otherDesc" rows={2} value={form.otherDesc ?? ''} onChange={e => set('otherDesc', e.target.value || null)} />
              </div>
            </div>
          </div>

          <div className="col-span-2 border-t pt-4 mt-2">
            <Label htmlFor="description">Plot description</Label>
            <Textarea id="description" rows={3} value={form.description ?? ''} onChange={e => set('description', e.target.value || null)} />
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#6E2E2A' }}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
