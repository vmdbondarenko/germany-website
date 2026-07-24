'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Loader2, ExternalLink } from 'lucide-react'
import { slugifyBase } from '@/lib/blob-filename'

type Location = {
  id: string
  name: string
  nameEn?: string | null
  slug: string
  order: number
  centerLat: number | null
  centerLng: number | null
  zoom: number | null
  _count?: { projects: number }
}

export default function LocationsAdminPage() {
  const [items, setItems] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/locations')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false) })
  }, [])

  const update = (id: string, field: keyof Location, value: string | number | null) =>
    setItems(prev => prev.map(l => (l.id === id ? { ...l, [field]: value } : l)))

  const save = async (loc: Location) => {
    setSaving(loc.id)
    await fetch(`/api/admin/locations/${loc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loc),
    })
    setSaving(null)
  }

  const add = async () => {
    const res = await fetch('/api/admin/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', slug: '', order: items.length }),
    })
    const created = await res.json()
    setItems(prev => [...prev, created])
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this location? Assigned projects will revert to /inwestycje/{slug}.')) return
    await fetch(`/api/admin/locations/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(l => l.id !== id))
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Locations (city pages)</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Each location creates a page <code>/{'{slug}'}</code> (np. <code>/domy-pod-warszawa</code>).
            Projects are assigned in the project editor.
          </p>
        </div>
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add location</Button>
      </div>

      <div className="space-y-4">
        {items.map(loc => (
          <div key={loc.id} className="border rounded-xl p-4 bg-card space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name · DE (H1 / Seitentitel)</Label>
                <Input
                  value={loc.name}
                  className="h-8 text-sm"
                  placeholder="Häuser bei München"
                  onChange={e => {
                    const name = e.target.value
                    update(loc.id, 'name', name)
                    if (!loc.slug) update(loc.id, 'slug', slugifyBase(name))
                  }}
                  onBlur={() => save(loc)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Name · EN</Label>
                <Input
                  value={loc.nameEn ?? ''}
                  className="h-8 text-sm"
                  onChange={e => update(loc.id, 'nameEn', e.target.value)}
                  onBlur={() => save(loc)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug (URL)</Label>
                <Input
                  value={loc.slug}
                  className="h-8 text-sm"
                  placeholder="domy-pod-warszawa"
                  onChange={e => update(loc.id, 'slug', e.target.value)}
                  onBlur={() => save(loc)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Order</Label>
                <Input
                  type="number"
                  value={loc.order}
                  className="h-8 text-sm"
                  onChange={e => update(loc.id, 'order', parseInt(e.target.value) || 0)}
                  onBlur={() => save(loc)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Map center — lat</Label>
                <Input
                  value={loc.centerLat ?? ''}
                  className="h-8 text-sm"
                  placeholder="auto"
                  onChange={e => update(loc.id, 'centerLat', e.target.value === '' ? null : Number(e.target.value))}
                  onBlur={() => save(loc)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Map center — lng</Label>
                <Input
                  value={loc.centerLng ?? ''}
                  className="h-8 text-sm"
                  placeholder="auto"
                  onChange={e => update(loc.id, 'centerLng', e.target.value === '' ? null : Number(e.target.value))}
                  onBlur={() => save(loc)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Map zoom</Label>
                <Input
                  value={loc.zoom ?? ''}
                  className="h-8 text-sm"
                  placeholder="auto"
                  onChange={e => update(loc.id, 'zoom', e.target.value === '' ? null : Number(e.target.value))}
                  onBlur={() => save(loc)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{loc._count?.projects ?? 0} projects</span>
                {loc.slug && (
                  <a
                    href={`/${loc.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    /{loc.slug} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => save(loc)} disabled={saving === loc.id}>
                  {saving === loc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(loc.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No locations yet. Click “Add location”.
          </p>
        )}
      </div>
    </div>
  )
}
