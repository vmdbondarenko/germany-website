'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Upload, Image as ImageIcon, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react'
import { withDerivedAreas } from '@/lib/house-type-area'

type Room = {
  id: string
  name: string
  area: number | null
  number: number | null
}

type FloorPlan = {
  id: string
  name: string
  area: number | null
  image3dUrl: string | null
  image2dUrl: string | null
  rooms: Room[]
}

type HouseType = {
  id: string
  name: string
  totalArea: number | null
  floorPlans: FloorPlan[]
}

interface Props {
  projectId: string
  initialHouseTypes: HouseType[]
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload failed')
  const { url } = await res.json()
  return url
}

export function HouseTypesManager({ projectId, initialHouseTypes }: Props) {
  // Areas are always the sum of room areas — derive on load so existing types
  // display correctly without a write, then keep them in sync on every edit.
  const [houseTypes, setHouseTypes] = useState<HouseType[]>(() =>
    initialHouseTypes.map(withDerivedAreas)
  )
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const [showAddType, setShowAddType] = useState(false)
  const [showAddFloor, setShowAddFloor] = useState<string | null>(null) // houseTypeId
  const [showAddRoom, setShowAddRoom] = useState<string | null>(null) // floorPlanId
  const [uploading, setUploading] = useState<string | null>(null)

  // Add House Type
  const [newType, setNewType] = useState({ name: '' })
  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/house-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        name: newType.name,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setHouseTypes((prev) => [...prev, data])
      setShowAddType(false)
      setNewType({ name: '' })
    }
  }

  const handleDeleteType = async (id: string) => {
    if (!confirm('Delete typ domu i wszystkie jego plany?')) return
    await fetch(`/api/admin/house-types/${id}`, { method: 'DELETE' })
    setHouseTypes((prev) => prev.filter((t) => t.id !== id))
  }

  // Add Floor Plan
  const [newFloor, setNewFloor] = useState({ name: '' })
  const handleAddFloor = async (e: React.FormEvent, houseTypeId: string) => {
    e.preventDefault()
    const res = await fetch('/api/admin/floor-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        houseTypeId,
        name: newFloor.name,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setHouseTypes((prev) =>
        prev.map((t) =>
          t.id === houseTypeId
            ? withDerivedAreas({ ...t, floorPlans: [...t.floorPlans, data] })
            : t
        )
      )
      setShowAddFloor(null)
      setNewFloor({ name: '' })
    }
  }

  const handleDeleteFloor = async (houseTypeId: string, floorId: string) => {
    if (!confirm('Delete this floor?')) return
    await fetch(`/api/admin/floor-plans/${floorId}`, { method: 'DELETE' })
    setHouseTypes((prev) =>
      prev.map((t) =>
        t.id === houseTypeId
          ? withDerivedAreas({ ...t, floorPlans: t.floorPlans.filter((f) => f.id !== floorId) })
          : t
      )
    )
  }

  // Image upload
  const handleImageUpload = async (
    floorPlanId: string,
    houseTypeId: string,
    field: 'image3dUrl' | 'image2dUrl',
    file: File
  ) => {
    setUploading(`${floorPlanId}-${field}`)
    try {
      const url = await uploadImage(file)
      await fetch(`/api/admin/floor-plans/${floorPlanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: url }),
      })
      setHouseTypes((prev) =>
        prev.map((t) =>
          t.id === houseTypeId
            ? {
                ...t,
                floorPlans: t.floorPlans.map((f) =>
                  f.id === floorPlanId ? { ...f, [field]: url } : f
                ),
              }
            : t
        )
      )
    } catch {
      alert('Upload error')
    }
    setUploading(null)
  }

  // Edit room name inline
  const [editingRoomName, setEditingRoomName] = useState<{ roomId: string; value: string } | null>(null)

  const handleUpdateRoomName = async (roomId: string, floorPlanId: string, houseTypeId: string) => {
    if (!editingRoomName || !editingRoomName.value.trim()) { setEditingRoomName(null); return }
    const name = editingRoomName.value.trim()
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setHouseTypes((prev) =>
        prev.map((t) =>
          t.id === houseTypeId
            ? {
                ...t,
                floorPlans: t.floorPlans.map((f) =>
                  f.id === floorPlanId
                    ? { ...f, rooms: f.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)) }
                    : f
                ),
              }
            : t
        )
      )
    }
    setEditingRoomName(null)
  }

  // Edit room area inline
  const [editingArea, setEditingArea] = useState<{ roomId: string; value: string } | null>(null)

  const handleUpdateRoomArea = async (roomId: string, floorPlanId: string, houseTypeId: string) => {
    if (!editingArea) return
    const area = editingArea.value ? parseFloat(editingArea.value) : null
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area }),
    })
    if (res.ok) {
      setHouseTypes((prev) =>
        prev.map((t) =>
          t.id === houseTypeId
            ? withDerivedAreas({
                ...t,
                floorPlans: t.floorPlans.map((f) =>
                  f.id === floorPlanId
                    ? { ...f, rooms: f.rooms.map((r) => (r.id === roomId ? { ...r, area } : r)) }
                    : f
                ),
              })
            : t
        )
      )
    }
    setEditingArea(null)
  }

  // Edit room number inline
  const [editingNumber, setEditingNumber] = useState<{ roomId: string; value: string } | null>(null)

  const handleUpdateRoomNumber = async (roomId: string, floorPlanId: string, houseTypeId: string) => {
    if (!editingNumber) return
    const number = editingNumber.value ? parseInt(editingNumber.value, 10) : null
    if (number != null && Number.isNaN(number)) { setEditingNumber(null); return }
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number }),
    })
    if (res.ok) {
      setHouseTypes((prev) =>
        prev.map((t) =>
          t.id === houseTypeId
            ? {
                ...t,
                floorPlans: t.floorPlans.map((f) =>
                  f.id === floorPlanId
                    ? { ...f, rooms: f.rooms.map((r) => (r.id === roomId ? { ...r, number } : r)) }
                    : f
                ),
              }
            : t
        )
      )
    }
    setEditingNumber(null)
  }

  // Add Room
  const [newRoom, setNewRoom] = useState({ name: '', area: '', number: '' })
  const handleAddRoom = async (e: React.FormEvent, floorPlanId: string, houseTypeId: string) => {
    e.preventDefault()
    // When the admin leaves the number blank, default to the next free number on
    // this floor (max existing + 1) so the new room lands at the end.
    let number: number | null = newRoom.number ? parseInt(newRoom.number, 10) : null
    if (number == null || Number.isNaN(number)) {
      const floor = houseTypes
        .find((t) => t.id === houseTypeId)
        ?.floorPlans.find((f) => f.id === floorPlanId)
      const maxNumber = floor?.rooms.reduce((max, r) => Math.max(max, r.number ?? 0), 0) ?? 0
      number = maxNumber + 1
    }
    const res = await fetch('/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        floorPlanId,
        name: newRoom.name,
        area: newRoom.area ? parseFloat(newRoom.area) : null,
        number,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setHouseTypes((prev) =>
        prev.map((t) =>
          t.id === houseTypeId
            ? withDerivedAreas({
                ...t,
                floorPlans: t.floorPlans.map((f) =>
                  f.id === floorPlanId ? { ...f, rooms: [...f.rooms, data] } : f
                ),
              })
            : t
        )
      )
      setShowAddRoom(null)
      setNewRoom({ name: '', area: '', number: '' })
    }
  }

  // Move a room one position up or down within its floor. Display order follows
  // `Room.number`, so we reorder by SWAPPING the two adjacent rooms' numbers —
  // only those two rooms change, every other room's manually-set number is left
  // untouched. (Use "Przenumeruj 1…N" below to deliberately renumber a floor.)
  const [reordering, setReordering] = useState<string | null>(null) // roomId being moved
  const handleMoveRoom = async (
    houseTypeId: string,
    floorPlanId: string,
    roomId: string,
    direction: 'up' | 'down',
  ) => {
    const ht = houseTypes.find(t => t.id === houseTypeId)
    const fp = ht?.floorPlans.find(f => f.id === floorPlanId)
    if (!fp) return
    const idx = fp.rooms.findIndex(r => r.id === roomId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= fp.rooms.length) return

    const a = fp.rooms[idx]
    const b = fp.rooms[swapIdx]
    // Fall back to position-based numbers when a room has no number yet, so the
    // swap always produces two distinct, sensible values.
    const aNum = a.number ?? idx + 1
    const bNum = b.number ?? swapIdx + 1

    setReordering(roomId)
    const res = await fetch('/api/admin/rooms/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments: [
          { id: a.id, number: bNum },
          { id: b.id, number: aNum },
        ],
      }),
    })
    setReordering(null)
    if (!res.ok) {
      alert('Failed to reorder rooms')
      return
    }
    // Reflect the swap locally: positions swap and the two numbers swap with them.
    setHouseTypes(prev =>
      prev.map(t =>
        t.id === houseTypeId
          ? {
              ...t,
              floorPlans: t.floorPlans.map(f => {
                if (f.id !== floorPlanId) return f
                const newRooms = [...f.rooms]
                newRooms[idx] = { ...b, number: aNum }
                newRooms[swapIdx] = { ...a, number: bNum }
                return { ...f, rooms: newRooms }
              }),
            }
          : t
      )
    )
  }

  // Explicit, opt-in renumber: writes 1..N to the floor's rooms in their current
  // displayed order. Only runs when the admin clicks "Przenumeruj 1…N".
  const handleRenumberFloor = async (houseTypeId: string, floorPlanId: string) => {
    const ht = houseTypes.find(t => t.id === houseTypeId)
    const fp = ht?.floorPlans.find(f => f.id === floorPlanId)
    if (!fp || fp.rooms.length === 0) return
    if (!confirm('Renumber this floor’s rooms to 1…N by current order?')) return
    const orderedIds = fp.rooms.map(r => r.id)
    setReordering(floorPlanId)
    const res = await fetch('/api/admin/rooms/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    })
    setReordering(null)
    if (!res.ok) {
      alert('Failed to renumber rooms')
      return
    }
    setHouseTypes(prev =>
      prev.map(t =>
        t.id === houseTypeId
          ? {
              ...t,
              floorPlans: t.floorPlans.map(f =>
                f.id === floorPlanId
                  ? { ...f, rooms: f.rooms.map((r, i) => ({ ...r, number: i + 1 })) }
                  : f
              ),
            }
          : t
      )
    )
  }

  const handleDeleteRoom = async (floorPlanId: string, houseTypeId: string, roomId: string) => {
    await fetch(`/api/admin/rooms/${roomId}`, { method: 'DELETE' })
    setHouseTypes((prev) =>
      prev.map((t) =>
        t.id === houseTypeId
          ? withDerivedAreas({
              ...t,
              floorPlans: t.floorPlans.map((f) =>
                f.id === floorPlanId
                  ? { ...f, rooms: f.rooms.filter((r) => r.id !== roomId) }
                  : f
              ),
            })
          : t
      )
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>House types ({houseTypes.length})</CardTitle>
          <Button size="sm" onClick={() => setShowAddType(true)} style={{ backgroundColor: '#6E2E2A' }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add typ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {houseTypes.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">
            No house types. Add the first type.
          </p>
        ) : (
          <div className="space-y-3">
            {houseTypes.map((type) => (
              <div key={type.id} className="border rounded-lg overflow-hidden">
                {/* Type header */}
                <div
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => setExpandedType(expandedType === type.id ? null : type.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedType === type.id ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="font-medium">{type.name}</span>
                    <span
                      className="text-sm text-gray-500"
                      title="Sum of room areas (calculated automatically)"
                    >
                      {type.totalArea != null ? `${type.totalArea} m² total` : '— m²'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {type.floorPlans.length} {type.floorPlans.length === 1 ? 'kondygnacja' : 'kondygnacje'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={(e) => { e.stopPropagation(); handleDeleteType(type.id) }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Expanded content */}
                {expandedType === type.id && (
                  <div className="p-4 space-y-4">
                    {/* Floor plans */}
                    {type.floorPlans.map((floor) => (
                      <div key={floor.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm">{floor.name}</h4>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs text-gray-500"
                              title="Sum of this floor’s room areas (calculated automatically)"
                            >
                              {floor.area != null ? `${floor.area} m²` : '— m²'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 h-7 w-7 p-0"
                              onClick={() => handleDeleteFloor(type.id, floor.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Image uploads */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {(['image3dUrl', 'image2dUrl'] as const).map((field) => (
                            <div key={field}>
                              <p className="text-xs text-gray-500 mb-1">
                                {field === 'image3dUrl' ? 'Wizualizacja 3D' : 'Rzut 2D'}
                              </p>
                              {floor[field] ? (
                                <div className="relative group">
                                  <img
                                    src={floor[field]!}
                                    alt={field}
                                    className="w-full h-24 object-cover rounded border"
                                  />
                                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity">
                                    <Upload className="h-5 w-5 text-white" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) handleImageUpload(floor.id, type.id, field, f)
                                      }}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50 transition-colors">
                                  {uploading === `${floor.id}-${field}` ? (
                                    <span className="text-xs text-gray-400">Uploading...</span>
                                  ) : (
                                    <>
                                      <ImageIcon className="h-6 w-6 text-gray-300 mb-1" />
                                      <span className="text-xs text-gray-400">Click to add</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0]
                                      if (f) handleImageUpload(floor.id, type.id, field, f)
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Rooms table */}
                        {floor.rooms.length > 0 && (
                          <Table className="mb-2">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs w-12">Nr</TableHead>
                                <TableHead className="text-xs">Pomieszczenie</TableHead>
                                <TableHead className="text-xs">Pow. m²</TableHead>
                                <TableHead className="w-24" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {floor.rooms.map((room, roomIdx) => (
                                <TableRow key={room.id}>
                                  <TableCell className="text-sm">
                                    {editingNumber?.roomId === room.id ? (
                                      <Input
                                        autoFocus
                                        type="number"
                                        step="1"
                                        className="h-6 w-12 text-sm px-1 py-0"
                                        value={editingNumber.value}
                                        onChange={(e) => setEditingNumber({ roomId: room.id, value: e.target.value })}
                                        onBlur={() => handleUpdateRoomNumber(room.id, floor.id, type.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleUpdateRoomNumber(room.id, floor.id, type.id)
                                          if (e.key === 'Escape') setEditingNumber(null)
                                        }}
                                      />
                                    ) : (
                                      <span
                                        className="cursor-pointer hover:underline hover:text-blue-600"
                                        onClick={() => setEditingNumber({ roomId: room.id, value: room.number != null ? String(room.number) : '' })}
                                      >
                                        {room.number ?? '—'}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {editingRoomName?.roomId === room.id ? (
                                      <Input
                                        autoFocus
                                        className="h-6 text-sm px-1 py-0"
                                        value={editingRoomName.value}
                                        onChange={(e) => setEditingRoomName({ roomId: room.id, value: e.target.value })}
                                        onBlur={() => handleUpdateRoomName(room.id, floor.id, type.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleUpdateRoomName(room.id, floor.id, type.id)
                                          if (e.key === 'Escape') setEditingRoomName(null)
                                        }}
                                      />
                                    ) : (
                                      <span
                                        className="cursor-pointer hover:underline hover:text-blue-600"
                                        onClick={() => setEditingRoomName({ roomId: room.id, value: room.name })}
                                      >
                                        {room.name}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {editingArea?.roomId === room.id ? (
                                      <Input
                                        autoFocus
                                        type="number"
                                        step="0.01"
                                        className="h-6 w-24 text-sm px-1 py-0"
                                        value={editingArea.value}
                                        onChange={(e) => setEditingArea({ roomId: room.id, value: e.target.value })}
                                        onBlur={() => handleUpdateRoomArea(room.id, floor.id, type.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleUpdateRoomArea(room.id, floor.id, type.id)
                                          if (e.key === 'Escape') setEditingArea(null)
                                        }}
                                      />
                                    ) : (
                                      <span
                                        className="cursor-pointer hover:underline hover:text-blue-600"
                                        onClick={() => setEditingArea({ roomId: room.id, value: room.area != null ? String(room.area) : '' })}
                                      >
                                        {room.area ?? '—'}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                        disabled={roomIdx === 0 || reordering === room.id}
                                        onClick={() => handleMoveRoom(type.id, floor.id, room.id, 'up')}
                                        title="Move up"
                                      >
                                        <ArrowUp className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                        disabled={roomIdx === floor.rooms.length - 1 || reordering === room.id}
                                        onClick={() => handleMoveRoom(type.id, floor.id, room.id, 'down')}
                                        title="Move down"
                                      >
                                        <ArrowDown className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                        onClick={() => handleDeleteRoom(floor.id, type.id, room.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setShowAddRoom(floor.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add pomieszczenie
                          </Button>
                          {floor.rooms.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-gray-500"
                              disabled={reordering === floor.id}
                              onClick={() => handleRenumberFloor(type.id, floor.id)}
                              title="Set numbers 1…N by current order"
                            >
                              Przenumeruj 1…N
                            </Button>
                          )}
                        </div>

                        {/* Add room inline dialog */}
                        <Dialog open={showAddRoom === floor.id} onOpenChange={(o) => !o && setShowAddRoom(null)}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add pomieszczenie — {floor.name}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => handleAddRoom(e, floor.id, type.id)}>
                              <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="col-span-2 space-y-2">
                                  <Label>Name pomieszczenia *</Label>
                                  <Input
                                    value={newRoom.name}
                                    onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="np. Salon z aneksem"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Area m²</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={newRoom.area}
                                    onChange={(e) => setNewRoom((p) => ({ ...p, area: e.target.value }))}
                                    placeholder="32.5"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Number</Label>
                                  <Input
                                    type="number"
                                    step="1"
                                    value={newRoom.number}
                                    onChange={(e) => setNewRoom((p) => ({ ...p, number: e.target.value }))}
                                    placeholder="auto"
                                  />
                                  <p className="text-xs text-gray-400">Puste = kolejny numer.</p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowAddRoom(null)}>
                                  Cancel
                                </Button>
                                <Button type="submit" style={{ backgroundColor: '#6E2E2A' }}>
                                  Add
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}

                    {/* Add floor plan button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddFloor(type.id)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add floor
                    </Button>

                    {/* Add floor dialog */}
                    <Dialog open={showAddFloor === type.id} onOpenChange={(o) => !o && setShowAddFloor(null)}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add floor — {type.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => handleAddFloor(e, type.id)}>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="col-span-2 space-y-2">
                              <Label>Name *</Label>
                              <Input
                                value={newFloor.name}
                                onChange={(e) => setNewFloor((p) => ({ ...p, name: e.target.value }))}
                                placeholder="np. Parter, Floor"
                                required
                              />
                            </div>
                            <p className="col-span-2 text-xs text-gray-400">
                              The floor area is calculated automatically from the sum of rooms.
                            </p>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddFloor(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" style={{ backgroundColor: '#6E2E2A' }}>
                              Add
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add House Type Dialog */}
        <Dialog open={showAddType} onOpenChange={setShowAddType}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add typ domu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddType}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newType.name}
                    onChange={(e) => setNewType((p) => ({ ...p, name: e.target.value }))}
                    placeholder="np. Dom A"
                    required
                  />
                </div>
                <p className="col-span-2 text-xs text-gray-400">
                  The total area is calculated automatically from the sum of rooms once floors and rooms are added.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddType(false)}>
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: '#6E2E2A' }}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
