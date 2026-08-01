'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { Trash2, Plus, Loader2, GripVertical, Upload, Clock, Zap, Wrench, Hammer, Building, Building2, Home, MapPin, Star, Check, Timer, HardHat, TrendingUp } from 'lucide-react'

type Investment = { id: string; title: string; description: string; status: string; titleEn?: string | null; descriptionEn?: string | null; statusEn?: string | null; statusColor: string; icon: string; order: number }
type City = { id: string; city: string; date: string; cityEn?: string | null; dateEn?: string | null; order: number }
type AboutSectionData = { companyName: string; description: string; companyNameEn?: string | null; descriptionEn?: string | null; photos: string[] }

const STATUS_COLORS = ['#5A2A1C', '#6E2E2A', '#3E1718']
const EMPTY_INV = { title: '', description: '', status: '', statusColor: '#6E2E2A', icon: 'Clock', order: 0 }

async function uploadImage(file: File, name?: string): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  if (name) form.append('name', name)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

const ICON_OPTIONS: Array<{ name: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { name: 'Clock', label: 'Zegar', Icon: Clock },
  { name: 'Zap', label: 'Lightning', Icon: Zap },
  { name: 'Wrench', label: 'Klucz', Icon: Wrench },
  { name: 'Hammer', label: 'Hammer', Icon: Hammer },
  { name: 'HardHat', label: 'Kask', Icon: HardHat },
  { name: 'Building', label: 'Building', Icon: Building },
  { name: 'Building2', label: 'Building 2', Icon: Building2 },
  { name: 'Home', label: 'Dom', Icon: Home },
  { name: 'MapPin', label: 'Lokalizacja', Icon: MapPin },
  { name: 'Star', label: 'Gwiazdka', Icon: Star },
  { name: 'Check', label: 'Gotowe', Icon: Check },
  { name: 'Timer', label: 'Timer', Icon: Timer },
  { name: 'TrendingUp', label: 'Wzrost', Icon: TrendingUp },
]
const EMPTY_CITY = { city: '', date: '', order: 0 }

export default function AboutAdminPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [aboutSection, setAboutSection] = useState<AboutSectionData>({ companyName: '', description: '', photos: [] })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/upcoming-investments').then(r => r.json()),
      fetch('/api/admin/new-cities').then(r => r.json()),
      fetch('/api/admin/about-section').then(r => r.json()),
    ]).then(([inv, cit, about]) => {
      setInvestments(inv)
      setCities(cit)
      if (about) setAboutSection(about)
      setLoading(false)
    })
  }, [])

  const saveAboutSection = async (data?: AboutSectionData) => {
    setSaving('about')
    await fetch('/api/admin/about-section', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data ?? aboutSection),
    })
    setSaving(null)
  }

  const addPhoto = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const seq = String(aboutSection.photos.length + 1).padStart(2, '0')
      const url = await uploadImage(file, `jednopietrowa-warszawa-o-firmie-${seq}`)
      const updated = { ...aboutSection, photos: [...aboutSection.photos, url] }
      setAboutSection(updated)
      await saveAboutSection(updated)
    } catch { /* ignore */ }
    setUploadingPhoto(false)
  }

  const removePhoto = async (index: number) => {
    const updated = { ...aboutSection, photos: aboutSection.photos.filter((_, i) => i !== index) }
    setAboutSection(updated)
    await saveAboutSection(updated)
  }

  // ── Investments ─────────────────────────────────────────────────────────────

  const saveInvestment = async (inv: Investment) => {
    setSaving(inv.id)
    await fetch(`/api/admin/upcoming-investments/${inv.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inv),
    })
    setSaving(null)
  }

  const addInvestment = async () => {
    const body = { ...EMPTY_INV, order: investments.length }
    const res = await fetch('/api/admin/upcoming-investments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const created = await res.json()
    setInvestments(prev => [...prev, created])
  }

  const deleteInvestment = async (id: string) => {
    await fetch(`/api/admin/upcoming-investments/${id}`, { method: 'DELETE' })
    setInvestments(prev => prev.filter(i => i.id !== id))
  }

  const updateInvestment = (id: string, field: string, value: string | number) => {
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // ── Cities ───────────────────────────────────────────────────────────────────

  const saveCity = async (city: City) => {
    setSaving(city.id)
    await fetch(`/api/admin/new-cities/${city.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(city),
    })
    setSaving(null)
  }

  const addCity = async () => {
    const body = { ...EMPTY_CITY, order: cities.length }
    const res = await fetch('/api/admin/new-cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const created = await res.json()
    setCities(prev => [...prev, created])
  }

  const deleteCity = async (id: string) => {
    await fetch(`/api/admin/new-cities/${id}`, { method: 'DELETE' })
    setCities(prev => prev.filter(c => c.id !== id))
  }

  const updateCity = (id: string, field: string, value: string | number) => {
    setCities(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-12">
      <h1 className="text-2xl font-semibold">Section O firmie — dane dynamiczne</h1>

      {/* ── O firmie ─────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">About — content</h2>
        <div className="border rounded-xl p-4 space-y-4 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Firmenname · DE</Label>
              <Input
                value={aboutSection.companyName}
                onChange={e => setAboutSection(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="z. B. Muster Immobilien GmbH"
              />
            </div>
            <div className="space-y-2">
              <Label>Firmenname · EN</Label>
              <Input
                value={aboutSection.companyNameEn ?? ''}
                onChange={e => setAboutSection(prev => ({ ...prev, companyNameEn: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Beschreibung · DE (Absätze durch Leerzeile getrennt)</Label>
              <Textarea
                value={aboutSection.description}
                onChange={e => setAboutSection(prev => ({ ...prev, description: e.target.value }))}
                rows={12}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung · EN</Label>
              <Textarea
                value={aboutSection.descriptionEn ?? ''}
                onChange={e => setAboutSection(prev => ({ ...prev, descriptionEn: e.target.value }))}
                rows={12}
                className="text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Gallery images (first 3 shown in the grid)</Label>
            <div className="flex flex-wrap gap-3">
              {aboutSection.photos.map((url, i) => (
                <div key={i} className="relative w-32 h-24 rounded-lg overflow-hidden border group">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded">{i + 1}</span>
                </div>
              ))}
              <label className="w-32 h-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 cursor-pointer transition-colors">
                {uploadingPhoto ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={e => { const f = e.target.files?.[0]; if (f) addPhoto(f); e.target.value = '' }}
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveAboutSection()} disabled={saving === 'about'}>
              {saving === 'about' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        </div>
      </section>

      {/* ── Upcoming Investments ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Upcoming projects</h2>
            <p className="text-xs text-muted-foreground mt-0.5">The first item (order=0) is shown in the large card on the left.</p>
          </div>
          <Button size="sm" onClick={addInvestment}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>
        <div className="space-y-4">
          {investments.map((inv) => (
            <div key={inv.id} className="border rounded-xl p-4 space-y-3 bg-card">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Titel · DE</Label>
                    <Input className="h-8 text-sm mt-1" value={inv.title}
                      onChange={e => updateInvestment(inv.id, 'title', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Titel · EN</Label>
                    <Input className="h-8 text-sm mt-1" value={inv.titleEn ?? ''}
                      onChange={e => updateInvestment(inv.id, 'titleEn', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Status · DE</Label>
                    <Input className="h-8 text-sm mt-1" value={inv.status}
                      onChange={e => updateInvestment(inv.id, 'status', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Status · EN</Label>
                    <Input className="h-8 text-sm mt-1" value={inv.statusEn ?? ''}
                      onChange={e => updateInvestment(inv.id, 'statusEn', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Beschreibung · DE</Label>
                  <Textarea className="text-sm mt-1 min-h-[60px]" value={inv.description}
                    onChange={e => updateInvestment(inv.id, 'description', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Beschreibung · EN</Label>
                  <Textarea className="text-sm mt-1 min-h-[60px]" value={inv.descriptionEn ?? ''}
                    onChange={e => updateInvestment(inv.id, 'descriptionEn', e.target.value)} />
                </div>
              </div>
              <div className="flex items-start gap-4 flex-wrap">
                <div>
                  <Label className="text-xs">Kolor statusu</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {STATUS_COLORS.map(c => (
                      <button key={c} onClick={() => updateInvestment(inv.id, 'statusColor', c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${inv.statusColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                    <Input className="h-7 w-28 text-xs" value={inv.statusColor}
                      onChange={e => updateInvestment(inv.id, 'statusColor', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Ikona statusu</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {ICON_OPTIONS.map(({ name, label, Icon }) => (
                      <button
                        key={name}
                        title={label}
                        onClick={() => updateInvestment(inv.id, 'icon', name)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border-2 transition-all ${inv.icon === name ? 'border-gray-800 bg-gray-100' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <Icon className="h-4 w-4 text-gray-700" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-16">
                  <Label className="text-xs">Order</Label>
                  <Input type="number" className="h-8 text-sm mt-1" value={inv.order}
                    onChange={e => updateInvestment(inv.id, 'order', parseInt(e.target.value) || 0)} />
                </div>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => saveInvestment(inv)} disabled={saving === inv.id}>
                    {saving === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteInvestment(inv.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {investments.length === 0 && <p className="text-sm text-muted-foreground">No upcoming investments.</p>}
        </div>
      </section>

      {/* ── New Cities ───────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Nowe miasta</h2>
          <Button size="sm" onClick={addCity}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>
        <div className="space-y-3">
          {cities.map((city) => (
            <div key={city.id} className="border rounded-xl p-4 bg-card">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Stadt · DE</Label>
                    <Input className="h-8 text-sm mt-1 uppercase" value={city.city}
                      onChange={e => updateCity(city.id, 'city', e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <Label className="text-xs">Stadt · EN</Label>
                    <Input className="h-8 text-sm mt-1 uppercase" value={city.cityEn ?? ''}
                      onChange={e => updateCity(city.id, 'cityEn', e.target.value.toUpperCase())} />
                  </div>
                  <div className="hidden md:block" />
                  <div>
                    <Label className="text-xs">Datum · DE (z. B. ab 10.01.2026)</Label>
                    <Input className="h-8 text-sm mt-1" value={city.date}
                      onChange={e => updateCity(city.id, 'date', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Datum · EN</Label>
                    <Input className="h-8 text-sm mt-1" value={city.dateEn ?? ''}
                      onChange={e => updateCity(city.id, 'dateEn', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Order</Label>
                    <Input type="number" className="h-8 text-sm mt-1" value={city.order}
                      onChange={e => updateCity(city.id, 'order', parseInt(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => saveCity(city)} disabled={saving === city.id}>
                    {saving === city.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteCity(city.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {cities.length === 0 && <p className="text-sm text-muted-foreground">No cities.</p>}
        </div>
      </section>
    </div>
  )
}
