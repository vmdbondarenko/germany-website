'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft, Save, Trash2, Plus, ExternalLink, ChevronDown, ChevronUp,
  Upload, Loader2, Eye, EyeOff, MapPin, Home, Car, TreePine, ShoppingBag, School,
  Train, Plane, Clock, Zap, Shield, Waves, Building, Sun, Star, Heart, Leaf, Bed,
  Bath, Ruler, Image as ImageIcon, Snowflake, Flame, Shovel,
} from 'lucide-react'
import { HouseTypesManager } from '@/components/admin/house-types-manager'
import AdminPlanEditor from '@/components/admin/admin-plan-editor'
import { AdminPlanViewEditor } from '@/components/admin/admin-plan-view-editor'
import AdminStageEditor from '@/components/admin/admin-stage-editor'

// --- Types ---
type SectionItem = {
  id: string
  sectionId: string
  icon: string | null
  title: string
  titleEn: string | null
  subtitle: string | null
  subtitleEn: string | null
  description: string | null
  descriptionEn: string | null
  mapUrl: string | null
  order: number
}

type ProjectSection = {
  id: string
  projectId: string
  type: string
  label: string | null
  labelEn: string | null
  heading: string | null
  headingEn: string | null
  description: string | null
  descriptionEn: string | null
  imageUrl: string | null
  imageUrl2: string | null
  mapUrl: string | null
  enabled: boolean
  order: number
  items: SectionItem[]
}

type GalleryImage = {
  id: string
  projectId: string
  src: string
  alt: string
  altEn: string | null
  label: string
  labelEn: string | null
  order: number
}

type ProjectDocument = {
  id: string
  projectId: string
  label: string
  fileUrl: string
  order: number
}

type Unit = {
  id: string
  svgElementId: string
  label: string
  status: string
  stage: string | null
  area: number | null
  gardenArea: number | null
  floor: string | null
  rooms: number | null
  floors: number | null
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

type Project = {
  id: string
  name: string
  slug: string
  location: string
  locationEn: string | null
  description: string | null
  descriptionEn: string | null
  svgContent: string | null
  imageUrl: string | null
  planImageUrl: string | null
  status: string
  published: boolean
  heroSubtitle: string | null
  heroSubtitleEn: string | null
  additionalInfoEn: string | null
  contactPhone: string | null
  contactEmail: string | null
  contactAddress: string | null
  investVoivodeship: string | null
  investCounty: string | null
  investMunicipality: string | null
  investCity: string | null
  investStreet: string | null
  investBuildingNr: string | null
  investPostalCode: string | null
  propertyType: string | null
  prospektUrl: string | null
  additionalInfo: string | null
  latitude: number | null
  longitude: number | null
  cityLocationId: string | null
  units: Unit[]
  houseTypes: Array<{
    id: string
    name: string
    totalArea: number | null
    floorPlans: Array<{
      id: string
      name: string
      area: number | null
      image3dUrl: string | null
      image2dUrl: string | null
      rooms: Array<{ id: string; name: string; area: number | null; number: number | null }>
    }>
  }>
  sections: ProjectSection[]
  galleryImages: GalleryImage[]
  documents: ProjectDocument[]
  stages: Array<{
    id: string
    projectId: string
    svgElementId: string
    name: string
    order: number
    published: boolean
    stageViews: Array<{
      id: string
      stageId: string
      name: string
      imageUrl: string | null
      svgContent: string | null
      order: number
    }>
  }>
}

// --- Icon Map ---
const ICON_OPTIONS = [
  'MapPin', 'Home', 'Car', 'TreePine', 'ShoppingBag', 'School', 'Train', 'Plane',
  'Clock', 'Zap', 'Shield', 'Waves', 'Building', 'Sun', 'Star', 'Heart', 'Leaf',
  'Bed', 'Bath', 'Ruler', 'Snowflake', 'Flame', 'Shovel',
] as const

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin, Home, Car, TreePine, ShoppingBag, School, Train, Plane, Clock, Zap,
  Shield, Waves, Building, Sun, Star, Heart, Leaf, Bed, Bath, Ruler, Snowflake, Flame, Shovel,
}

// --- Section type config ---
const SECTION_TYPES: Array<{
  type: string; label: string; defaultLabel: string; defaultOrder: number
  hasItems?: boolean; hasImage?: boolean; hasImage2?: boolean; hasMap?: boolean; hasDescription?: boolean
}> = [
  { type: 'key_features', label: 'Key features', defaultLabel: 'Merkmale', hasItems: true, hasImage: false, hasDescription: false, defaultOrder: 1 },
  { type: 'lokalizacja', label: 'Location', defaultLabel: 'Standort', hasItems: true, hasImage: true, hasMap: true, defaultOrder: 2 },
  { type: 'otoczenie', label: 'Surroundings', defaultLabel: 'Umgebung', hasItems: true, hasImage: true, defaultOrder: 3 },
  { type: 'o_inwestycji', label: 'About the project', defaultLabel: 'Über das Projekt', hasImage: true, hasImage2: true, defaultOrder: 4 },
  { type: 'udogodnienia', label: 'Amenities', defaultLabel: 'Ausstattung', hasItems: true, hasImage: true, defaultOrder: 5 },
  { type: 'dodatki', label: 'Extras', defaultLabel: 'Extras', hasImage: true, defaultOrder: 6 },
  { type: 'dom', label: 'House', defaultLabel: 'Haus', hasImage: true, defaultOrder: 7 },
  { type: 'standard', label: 'Standard', defaultLabel: 'Standard', hasItems: true, defaultOrder: 8 },
  { type: 'jak_kupic', label: 'How to buy', defaultLabel: 'Wie kaufen Sie Ihre Traumimmobilie?', hasDescription: false, hasImage: false, defaultOrder: 10 },
  { type: 'jak_pomoc', label: 'How else can we help?', defaultLabel: 'Wie wir zusätzlich helfen', hasItems: true, defaultOrder: 11 },
  { type: 'o_inwestorze', label: 'About the investor', defaultLabel: 'Über das Unternehmen', hasImage: true, defaultOrder: 12 },
]

function getTypeConfig(type: string) {
  return SECTION_TYPES.find(t => t.type === type) || SECTION_TYPES[0]
}

// --- Upload helper ---
async function uploadImage(file: File, name?: string): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  if (name) form.append('name', name)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

// --- Collapsible Section ---
function CollapsibleCard({ title, children, defaultOpen = false, badge }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card>
      <CardHeader className="cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{title}</CardTitle>
            {badge}
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}

// --- Image Upload Field ---
function ImageUploadField({ label: fieldLabel, value, onChange, uploadName }: {
  label: string; value: string; onChange: (v: string) => void; uploadName?: string
}) {
  const [uploading, setUploading] = useState(false)
  return (
    <div className="space-y-2">
      <Label>{fieldLabel}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL or upload a file"
          className="flex-1"
        />
        <label className="cursor-pointer">
          <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setUploading(true)
              try {
                const url = await uploadImage(file, uploadName)
                onChange(url)
              } catch { /* ignore */ }
              setUploading(false)
            }}
          />
        </label>
      </div>
      {value && (
        <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
          <Image src={value} alt="" fill className="object-cover" />
        </div>
      )}
    </div>
  )
}

// --- Section Item Editor ---
function SectionItemEditor({ item, onUpdate, onDelete, showIcon = true, showMapUrl = false }: {
  item: SectionItem; onUpdate: (data: Partial<SectionItem>) => void; onDelete: () => void; showIcon?: boolean; showMapUrl?: boolean
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Element #{item.order + 1}</span>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {showIcon && (
          <div className="space-y-1">
            <Label className="text-xs">Ikona</Label>
            <Select value={item.icon || 'MapPin'} onValueChange={(v) => onUpdate({ icon: v })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((icon) => {
                  const Icon = ICON_MAP[icon]
                  return (
                    <SelectItem key={icon} value={icon}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />{icon}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Order</Label>
          <Input type="number" value={item.order} className="h-8" onChange={(e) => onUpdate({ order: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Titel · DE</Label>
          <Input value={item.title} onChange={(e) => onUpdate({ title: e.target.value })} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Titel · EN</Label>
          <Input value={item.titleEn || ''} onChange={(e) => onUpdate({ titleEn: e.target.value || null })} className="h-8" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Untertitel · DE</Label>
          <Input value={item.subtitle || ''} onChange={(e) => onUpdate({ subtitle: e.target.value || null })} className="h-8" placeholder="z. B. 1,4 km – 3 Min. mit dem Auto" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Untertitel · EN</Label>
          <Input value={item.subtitleEn || ''} onChange={(e) => onUpdate({ subtitleEn: e.target.value || null })} className="h-8" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Beschreibung · DE</Label>
          <Input value={item.description || ''} onChange={(e) => onUpdate({ description: e.target.value || null })} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Beschreibung · EN</Label>
          <Input value={item.descriptionEn || ''} onChange={(e) => onUpdate({ descriptionEn: e.target.value || null })} className="h-8" />
        </div>
      </div>
      {showMapUrl && (
        <div className="space-y-1">
          <Label className="text-xs">Link Google Maps</Label>
          <Input
            value={item.mapUrl || ''}
            onChange={(e) => onUpdate({ mapUrl: e.target.value || null })}
            className="h-8"
            placeholder="https://www.google.com/maps/.../@52.2297,21.0122,17z"
          />
          <p className="text-[10px] text-muted-foreground">
            Paste a Google Maps link or enter “lat,lng” (e.g. 52.2297,21.0122). A pin will appear on the location map.
          </p>
        </div>
      )}
    </div>
  )
}

// --- Section Editor ---
function SectionEditor({ section, projectId, projectSlug, onUpdate, onRefresh }: {
  section: ProjectSection | null; projectId: string; projectSlug: string; type: string; onUpdate: (s: ProjectSection) => void; onRefresh: () => void
}) {
  const [saving, setSaving] = useState(false)
  const typeConfig = getTypeConfig(section?.type || '')
  const s = section

  const saveSection = async (data: Partial<ProjectSection>) => {
    if (!s) return
    setSaving(true)
    const res = await fetch(`/api/admin/sections/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(updated)
    }
    setSaving(false)
  }

  const addItem = async () => {
    if (!s) return
    const res = await fetch('/api/admin/section-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionId: s.id,
        icon: 'MapPin',
        title: 'New item',
        order: s.items.length,
      }),
    })
    if (res.ok) onRefresh()
  }

  const updateItem = async (itemId: string, data: Partial<SectionItem>) => {
    await fetch(`/api/admin/section-items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    onRefresh()
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete ten element?')) return
    await fetch(`/api/admin/section-items/${itemId}`, { method: 'DELETE' })
    onRefresh()
  }

  if (!s) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => saveSection({ enabled: !s.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${s.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-muted-foreground">{s.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Label · DE</Label>
          <Input value={s.label || ''} onChange={(e) => onUpdate({ ...s, label: e.target.value })} onBlur={() => saveSection({ label: s.label })} placeholder={typeConfig.defaultLabel} />
        </div>
        <div className="space-y-2">
          <Label>Label · EN</Label>
          <Input value={s.labelEn || ''} onChange={(e) => onUpdate({ ...s, labelEn: e.target.value })} onBlur={() => saveSection({ labelEn: s.labelEn })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Überschrift · DE</Label>
          <Input value={s.heading || ''} onChange={(e) => onUpdate({ ...s, heading: e.target.value })} onBlur={() => saveSection({ heading: s.heading })} />
        </div>
        <div className="space-y-2">
          <Label>Überschrift · EN</Label>
          <Input value={s.headingEn || ''} onChange={(e) => onUpdate({ ...s, headingEn: e.target.value })} onBlur={() => saveSection({ headingEn: s.headingEn })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reihenfolge</Label>
        <Input type="number" value={s.order} onChange={(e) => onUpdate({ ...s, order: parseInt(e.target.value) || 0 })} onBlur={() => saveSection({ order: s.order })} className="max-w-[120px]" />
      </div>

      {typeConfig.hasDescription !== false && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Beschreibung · DE</Label>
            <Textarea value={s.description || ''} rows={3} onChange={(e) => onUpdate({ ...s, description: e.target.value })} onBlur={() => saveSection({ description: s.description })} />
          </div>
          <div className="space-y-2">
            <Label>Beschreibung · EN</Label>
            <Textarea value={s.descriptionEn || ''} rows={3} onChange={(e) => onUpdate({ ...s, descriptionEn: e.target.value })} onBlur={() => saveSection({ descriptionEn: s.descriptionEn })} />
          </div>
        </div>
      )}

      {typeConfig.hasImage && (
        <ImageUploadField
          label="Image"
          value={s.imageUrl || ''}
          onChange={(v) => { onUpdate({ ...s, imageUrl: v }); saveSection({ imageUrl: v }) }}
          uploadName={projectSlug && s.type ? `${projectSlug}-${s.type}-01` : undefined}
        />
      )}

      {typeConfig.hasImage2 && (
        <ImageUploadField
          label="Image 2"
          value={s.imageUrl2 || ''}
          onChange={(v) => { onUpdate({ ...s, imageUrl2: v }); saveSection({ imageUrl2: v }) }}
          uploadName={projectSlug && s.type ? `${projectSlug}-${s.type}-02` : undefined}
        />
      )}

      {typeConfig.hasMap && (
        <div className="space-y-2">
          <Label>Link Google Maps</Label>
          <Input value={s.mapUrl || ''} onChange={(e) => onUpdate({ ...s, mapUrl: e.target.value })} onBlur={() => saveSection({ mapUrl: s.mapUrl })} placeholder="https://maps.google.com/?q=..." />
        </div>
      )}

      {typeConfig.hasItems && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Elementy ({s.items.length})</Label>
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {s.items.map((item) => (
              <SectionItemEditor
                key={item.id}
                item={item}
                onUpdate={(data) => updateItem(item.id, data)}
                onDelete={() => deleteItem(item.id)}
                showMapUrl={s.type === 'lokalizacja'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Gallery Editor ---
function GalleryEditor({ images, projectId, projectSlug, onRefresh }: {
  images: GalleryImage[]; projectId: string; projectSlug: string; onRefresh: () => void
}) {
  const addImage = async () => {
    await fetch('/api/admin/gallery-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, src: '', alt: '', label: '', order: images.length }),
    })
    onRefresh()
  }

  const updateImage = async (id: string, data: Partial<GalleryImage>) => {
    await fetch(`/api/admin/gallery-images/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    onRefresh()
  }

  const deleteImage = async (id: string) => {
    if (!confirm('Delete this image?')) return
    await fetch(`/api/admin/gallery-images/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Images galerii ({images.length})</Label>
        <Button size="sm" variant="outline" onClick={addImage}>
          <Plus className="h-3.5 w-3.5 mr-1" />Add image
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img.id} className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">#{img.order + 1}</span>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteImage(img.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {img.src ? (
              <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                <Image src={img.src} alt={img.alt} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
            <ImageUploadField
              label="Image URL"
              value={img.src}
              onChange={(v) => updateImage(img.id, { src: v })}
              uploadName={projectSlug ? `${projectSlug}-galeria-${String(img.order + 1).padStart(2, '0')}` : undefined}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Alt-Text · DE</Label>
                <Input value={img.alt} className="h-8" onChange={(e) => updateImage(img.id, { alt: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Alt-Text · EN</Label>
                <Input value={img.altEn || ''} className="h-8" onChange={(e) => updateImage(img.id, { altEn: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Label · DE</Label>
                <Input value={img.label} className="h-8" onChange={(e) => updateImage(img.id, { label: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label · EN</Label>
                <Input value={img.labelEn || ''} className="h-8" onChange={(e) => updateImage(img.id, { labelEn: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reihenfolge</Label>
              <Input type="number" value={img.order} className="h-8 max-w-[120px]" onChange={(e) => updateImage(img.id, { order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- File Upload Field (generic, not image-only) ---
function FileUploadField({ label: fieldLabel, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  return (
    <div className="space-y-2">
      <Label>{fieldLabel}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="File URL or upload"
          className="flex-1"
        />
        <label className="cursor-pointer">
          <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </span>
          </Button>
          <input
            type="file"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setUploading(true)
              try {
                const url = await uploadImage(file)
                onChange(url)
              } catch { /* ignore */ }
              setUploading(false)
            }}
          />
        </label>
      </div>
    </div>
  )
}

// --- Documents Editor ---
function ProjectDocumentsEditor({ documents, projectId, onRefresh }: {
  documents: ProjectDocument[]; projectId: string; onRefresh: () => void
}) {
  const addDocument = async () => {
    await fetch('/api/admin/project-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, label: 'Download plik', fileUrl: '', order: documents.length }),
    })
    onRefresh()
  }

  const updateDocument = async (id: string, data: Partial<ProjectDocument>) => {
    await fetch(`/api/admin/project-documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    onRefresh()
  }

  const deleteDocument = async (id: string) => {
    if (!confirm('Delete ten plik?')) return
    await fetch(`/api/admin/project-documents/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Pliki do pobrania ({documents.length})</Label>
        <Button size="sm" variant="outline" onClick={addDocument}>
          <Plus className="h-3.5 w-3.5 mr-1" />Add plik
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">#{doc.order + 1}</span>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteDocument(doc.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Name przycisku</Label>
              <Input
                value={doc.label}
                className="h-8"
                onChange={(e) => updateDocument(doc.id, { label: e.target.value })}
                placeholder="np. Cennik, Prospekt informacyjny"
              />
            </div>
            <FileUploadField
              label="Plik"
              value={doc.fileUrl}
              onChange={(v) => updateDocument(doc.id, { fileUrl: v })}
            />
            <div className="space-y-1">
              <Label className="text-xs">Order</Label>
              <Input
                type="number"
                value={doc.order}
                className="h-8"
                onChange={(e) => updateDocument(doc.id, { order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Main Page ---
export default function EditProjectPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [locations, setLocations] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/admin/projects/${id}`)
    if (res.ok) {
      const data = await res.json()
      setProject(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  useEffect(() => {
    fetch('/api/admin/locations').then(r => r.ok ? r.json() : []).then(setLocations).catch(() => {})
  }, [])

  // Initialize missing sections
  useEffect(() => {
    if (!project) return
    const existingTypes = project.sections.map(s => s.type)
    const missing = SECTION_TYPES.filter(t => !existingTypes.includes(t.type))
    if (missing.length === 0) return

    Promise.all(missing.map(t =>
      fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          type: t.type,
          label: t.defaultLabel,
          enabled: false,
          order: t.defaultOrder,
        }),
      })
    )).then(() => fetchProject())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  const handleSaveDetails = async () => {
    if (!project) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: project.name,
        slug: project.slug,
        location: project.location,
        locationEn: project.locationEn,
        description: project.description,
        descriptionEn: project.descriptionEn,
        status: project.status,
        published: project.published,
        imageUrl: project.imageUrl,
        heroSubtitle: project.heroSubtitle,
        heroSubtitleEn: project.heroSubtitleEn,
        contactPhone: project.contactPhone,
        contactEmail: project.contactEmail,
        contactAddress: project.contactAddress,
        investVoivodeship: project.investVoivodeship,
        investCounty: project.investCounty,
        investMunicipality: project.investMunicipality,
        investCity: project.investCity,
        investStreet: project.investStreet,
        investBuildingNr: project.investBuildingNr,
        investPostalCode: project.investPostalCode,
        propertyType: project.propertyType,
        prospektUrl: project.prospektUrl,
        additionalInfo: project.additionalInfo,
        additionalInfoEn: project.additionalInfoEn,
        latitude: project.latitude,
        longitude: project.longitude,
        cityLocationId: project.cityLocationId,
      }),
    })
    if (res.ok) {
      setSuccess('Saved!')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('Save error')
    }
    setSaving(false)
  }

  const handleDeleteProject = async () => {
    if (!confirm(`Delete projekt "${project?.name}"? This action cannot be undone.`)) return
    if (!confirm(`Confirm again: permanently delete project "${project?.name}" with all plots and data?`)) return
    await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
    router.push('/admin')
  }

  const updateSection = (updated: ProjectSection) => {
    setProject(p => p ? {
      ...p,
      sections: p.sections.map(s => s.id === updated.id ? updated : s)
    } : p)
  }

  const getSectionByType = (type: string) => project?.sections.find(s => s.type === type) || null

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
  if (!project) return <div className="text-center py-20 text-gray-400">Nie znaleziono projektu</div>

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-serif font-bold text-gray-900">{project.name}</h1>
        <Link href={`/projekte/${project.slug}`} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Preview publiczny
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={handleDeleteProject}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete projekt
        </Button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Basic Info + Status + Published */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={project.name} onChange={(e) => setProject(p => p ? { ...p, name: e.target.value } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>Slug URL</Label>
                  <Input value={project.slug} onChange={(e) => setProject(p => p ? { ...p, slug: e.target.value } : p)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Standort · DE</Label>
                  <Input value={project.location} onChange={(e) => setProject(p => p ? { ...p, location: e.target.value } : p)} placeholder="z. B. München, Musterstraße 1" />
                </div>
                <div className="space-y-2">
                  <Label>Standort · EN</Label>
                  <Input value={project.locationEn || ''} onChange={(e) => setProject(p => p ? { ...p, locationEn: e.target.value } : p)} />
                </div>
              </div>
              <ImageUploadField
                label="Main image (hero)"
                value={project.imageUrl || ''}
                onChange={(v) => setProject(p => p ? { ...p, imageUrl: v } : p)}
                uploadName={project.slug ? `${project.slug}-zdjecie-glowne` : undefined}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero-Untertitel · DE</Label>
                  <Input
                    value={project.heroSubtitle || ''}
                    onChange={(e) => setProject(p => p ? { ...p, heroSubtitle: e.target.value } : p)}
                    placeholder="z. B. Ihr komfortables Haus mit Garten"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero-Untertitel · EN</Label>
                  <Input
                    value={project.heroSubtitleEn || ''}
                    onChange={(e) => setProject(p => p ? { ...p, heroSubtitleEn: e.target.value } : p)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Beschreibung (Meta) · DE</Label>
                  <Textarea value={project.description || ''} rows={3} onChange={(e) => setProject(p => p ? { ...p, description: e.target.value } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung (Meta) · EN</Label>
                  <Textarea value={project.descriptionEn || ''} rows={3} onChange={(e) => setProject(p => p ? { ...p, descriptionEn: e.target.value } : p)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Published Toggle */}
          <Card>
            <CardHeader><CardTitle>Publikacja</CardTitle></CardHeader>
            <CardContent>
              <button
                onClick={() => setProject(p => p ? { ...p, published: !p.published } : p)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  project.published
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors ${project.published ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${project.published ? 'left-5' : 'left-0.5'}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{project.published ? 'Opublikowano' : 'Opublikuj na stronie'}</p>
                  <p className="text-xs opacity-70">{project.published ? 'Widoczne w Nasze inwestycje' : 'Add do listy Nasze inwestycje'}</p>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent>
              <Select value={project.status} onValueChange={(v) => setProject(p => p ? { ...p, status: v } : p)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (for sale)</SelectItem>
                  <SelectItem value="planned">Planned (coming soon)</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Active → available projects • Completed → finished projects
              </p>
            </CardContent>
          </Card>

          {/* City location (landing page) */}
          <Card>
            <CardHeader><CardTitle>City (strona lokalizacji)</CardTitle></CardHeader>
            <CardContent>
              <Select
                value={project.cityLocationId ?? '__none__'}
                onValueChange={(v) => setProject(p => p ? { ...p, cityLocationId: v === '__none__' ? null : v } : p)}
              >
                <SelectTrigger><SelectValue placeholder="No assignment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (served at /projekte/{project.slug})</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {project.cityLocationId
                  ? <>Address: <code>/{locations.find(l => l.id === project.cityLocationId)?.slug}/{project.slug}</code>. Old address <code>/projekte/{project.slug}</code> redirects (308).</>
                  : <>Without a city the project is served at <code>/projekte/{project.slug}</code>. Add locations in the “Locations” tab.</>}
              </p>
            </CardContent>
          </Card>

          {/* Unit Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{project.units.filter(u => u.status === 'available').length}</div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{project.units.filter(u => u.status === 'reserved').length}</div>
                  <div className="text-xs text-gray-500">Reserved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{project.units.filter(u => u.status === 'sold').length}</div>
                  <div className="text-xs text-gray-500">Sold</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveDetails} className="w-full" disabled={saving} style={{ backgroundColor: '#6E2E2A' }}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mb-6">
        <CollapsibleCard title="Kontakt">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={project.contactPhone || ''} onChange={(e) => setProject(p => p ? { ...p, contactPhone: e.target.value } : p)} placeholder="+49 175 5080012" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={project.contactEmail || ''} onChange={(e) => setProject(p => p ? { ...p, contactEmail: e.target.value } : p)} placeholder="kontakt@vmd.pl" />
            </div>
            <div className="space-y-2">
              <Label>Office address</Label>
              <Input value={project.contactAddress || ''} onChange={(e) => setProject(p => p ? { ...p, contactAddress: e.target.value } : p)} placeholder="Musterstraße 110, München" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Save changes with the button above to update contact details.</p>
        </CollapsibleCard>
      </div>

      {/* Company & Investment Location */}
      <div className="mb-6">
        <CollapsibleCard title="Company & project location">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-3">Project location (CSV columns 30-37)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Region</Label>
                  <Input value={project.investVoivodeship || ''} onChange={(e) => setProject(p => p ? { ...p, investVoivodeship: e.target.value } : p)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Powiat</Label>
                  <Input value={project.investCounty || ''} onChange={(e) => setProject(p => p ? { ...p, investCounty: e.target.value } : p)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Gmina</Label>
                  <Input value={project.investMunicipality || ''} onChange={(e) => setProject(p => p ? { ...p, investMunicipality: e.target.value } : p)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  <Input value={project.investCity || ''} onChange={(e) => setProject(p => p ? { ...p, investCity: e.target.value } : p)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ulica</Label>
                  <Input value={project.investStreet || ''} onChange={(e) => setProject(p => p ? { ...p, investStreet: e.target.value } : p)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nr budynku</Label>
                  <Input value={project.investBuildingNr || ''} onChange={(e) => setProject(p => p ? { ...p, investBuildingNr: e.target.value } : p)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kod pocztowy</Label>
                  <Input value={project.investPostalCode || ''} onChange={(e) => setProject(p => p ? { ...p, investPostalCode: e.target.value } : p)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Property type</Label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={project.propertyType || 'Apartment'}
                    onChange={(e) => setProject(p => p ? { ...p, propertyType: e.target.value } : p)}
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Dom jednorodzinny">Dom jednorodzinny</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t space-y-1">
                <Label className="text-xs">URL prospektu informacyjnego</Label>
                <Input value={project.prospektUrl || ''} onChange={(e) => setProject(p => p ? { ...p, prospektUrl: e.target.value } : p)} placeholder="https://..." />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Save changes with the button above to update.</p>
        </CollapsibleCard>
      </div>

      {/* All Section Editors */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-serif font-bold text-gray-900">Sekcje strony projektu</h2>
        <p className="text-sm text-muted-foreground">Enable or disable sections with the toggle. Each section is fully configurable.</p>

        {SECTION_TYPES.map((typeConfig) => {
          const section = getSectionByType(typeConfig.type)
          return (
            <CollapsibleCard
              key={typeConfig.type}
              title={typeConfig.label}
              badge={
                section ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${section.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {section.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                ) : null
              }
            >
              {section ? (
                <SectionEditor
                  section={section}
                  projectId={project.id}
                  projectSlug={project.slug}
                  type={typeConfig.type}
                  onUpdate={updateSection}
                  onRefresh={fetchProject}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Loading sekcji...</p>
              )}
            </CollapsibleCard>
          )
        })}
      </div>

      {/* Gallery */}
      <div className="mb-6">
        <CollapsibleCard title="Gallery">
          <GalleryEditor images={project.galleryImages} projectId={project.id} projectSlug={project.slug} onRefresh={fetchProject} />
        </CollapsibleCard>
      </div>

      {/* Informacje dodatkowe */}
      <div className="mb-6">
        <CollapsibleCard
          title="Informacje dodatkowe"
          badge={
            (project.documents.length > 0 || project.additionalInfo)
              ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Aktywne</span>
              : undefined
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Infotext · DE</Label>
                <Textarea
                  value={project.additionalInfo || ''}
                  rows={4}
                  onChange={(e) => setProject(p => p ? { ...p, additionalInfo: e.target.value } : p)}
                  placeholder="z. B. Dokumente zum Download, Preisliste, Hinweise usw."
                />
              </div>
              <div className="space-y-2">
                <Label>Infotext · EN</Label>
                <Textarea
                  value={project.additionalInfoEn || ''}
                  rows={4}
                  onChange={(e) => setProject(p => p ? { ...p, additionalInfoEn: e.target.value } : p)}
                />
              </div>
            </div>
            <div>
              <Button size="sm" variant="outline" onClick={handleSaveDetails} disabled={saving}>
                <Save className="h-3.5 w-3.5 mr-1.5" />Text speichern
              </Button>
            </div>
            <div className="border-t pt-4">
              <ProjectDocumentsEditor
                documents={project.documents}
                projectId={project.id}
                onRefresh={fetchProject}
              />
            </div>
          </div>
        </CollapsibleCard>
      </div>

      {/* Link to overlay editor (dot placement + north compass) */}
      <div className="mb-4">
        <Link
          href={`/admin/projects/${id}/overlay`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border/60 hover:bg-secondary/50"
          style={{ color: '#6E2E2A' }}
        >
          <MapPin className="h-4 w-4" />
          Point positions and compass
        </Link>
      </div>

      {/* Interactive Plan Editor */}
      <div className="mb-6">
        <AdminPlanEditor
          projectId={id}
          planImageUrl={project.planImageUrl}
          initialUnits={project.units}
          initialSvgContent={project.svgContent}
          houseTypes={project.houseTypes.map(ht => ({ id: ht.id, name: ht.name, totalArea: ht.totalArea }))}
          onPlanImageChange={(url) => setProject(p => p ? { ...p, planImageUrl: url } : p)}
          stages={project.stages.map(s => ({ id: s.id, svgElementId: s.svgElementId, name: s.name, order: s.order }))}
          onStagesChange={fetchProject}
        />
      </div>

      {/* Plan View Editor */}
      <div className="mb-6">
        <AdminPlanViewEditor
          projectId={id}
          mainPlanUnits={project.units.map(u => ({ id: u.id, label: u.label, svgElementId: u.svgElementId }))}
          stages={project.stages.map(s => ({ id: s.id, name: s.name, svgElementId: s.svgElementId }))}
        />
      </div>

      {/* Stage Editor */}
      <div className="mb-6">
        <AdminStageEditor
          projectId={id}
          stages={project.stages}
          units={project.units.map(u => ({ id: u.id, svgElementId: u.svgElementId, label: u.label, status: u.status, stage: u.stage }))}
        />
      </div>

      {/* Units Table removed — all unit management is inside AdminPlanEditor above */}

      {/* House Types Manager */}
      {project.houseTypes !== undefined && (
        <div className="mt-6">
          <HouseTypesManager projectId={id} initialHouseTypes={project.houseTypes} />
        </div>
      )}

    </div>
  )
}
