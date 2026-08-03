'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, Save, Upload, RotateCcw } from 'lucide-react'
import { DEFAULT_BAUWEISE } from '@/lib/content-defaults'

// Which fields each homepage section exposes in admin. Mirrors what
// lib/home-content.ts actually reads back per section id.
type FieldKey = 'eyebrow' | 'heading' | 'description' | 'cta'
type SectionDef = {
  id: string
  label: string
  fields: FieldKey[]
  hasItems: boolean
  hint?: string
  // When set, exposes Image 1 / Image 2 management (saved to imageUrl / imageUrl2).
  // imageFallbacks are the code-default paths shown as preview/placeholder and
  // restored by "reset".
  hasImages?: boolean
  imageFallbacks?: [string, string]
}

const SECTIONS: SectionDef[] = [
  { id: 'hero', label: 'Hero', fields: ['eyebrow', 'heading', 'description', 'cta'], hasItems: false },
  { id: 'process', label: 'Warum wir (Process)', fields: ['heading', 'description'], hasItems: true },
  { id: 'distinguishes', label: 'Was uns auszeichnet', fields: ['eyebrow', 'heading', 'description'], hasItems: true },
  { id: 'services', label: 'Wie wir helfen (Services)', fields: ['heading', 'description'], hasItems: true },
  { id: 'interior', label: 'Innenräume', fields: ['heading', 'description'], hasItems: false },
  { id: 'buying', label: 'Kaufprozess — Überschrift', fields: ['heading'], hasItems: false },
  { id: 'buying-help', label: 'Zusätzliche Hilfe — Überschrift', fields: ['heading'], hasItems: false },
  { id: 'investor', label: 'Über das Unternehmen — Überschrift', fields: ['heading'], hasItems: false },
  // ── About-page blocks (Phase 2 Group A) ──
  { id: 'stats', label: 'Kennzahlen (Stats)', fields: [], hasItems: true, hint: 'Pro Kennzahl: Titel = Wert (z. B. „10+“), Beschreibung = Label (z. B. „Jahre Erfahrung“).' },
  { id: 'values', label: 'Unsere Werte', fields: ['eyebrow', 'heading'], hasItems: true, hint: 'Pro Karte: Titel + Beschreibung. Reihenfolge = Anzeigereihenfolge (Farben sind fest).' },
  { id: 'bauweise', label: 'Bauweise und Entwicklung', fields: ['heading', 'description', 'cta'], hasItems: false, hasImages: true, imageFallbacks: [DEFAULT_BAUWEISE.image1, DEFAULT_BAUWEISE.image2], hint: 'Absätze in der Beschreibung durch eine Leerzeile trennen. Nur der primäre CTA (Label + Link) wird verwendet. Bilder werden für DE und EN gemeinsam verwendet.' },
  { id: 'upcoming', label: 'Demnächst — Überschrift', fields: ['eyebrow', 'heading', 'description'], hasItems: false, hint: 'Überschrift = 1. Zeile, Eyebrow = 2. (hervorgehobene) Zeile, Beschreibung = Untertitel.' },
  { id: 'new-cities', label: 'Neue Städte — Überschrift', fields: ['heading', 'description'], hasItems: true, hint: 'Überschrift + Untertitel; ein Eintrag (Titel + Beschreibung) = die Fußnote.' },
  { id: 'since-founding', label: 'Seit unserer Gründung', fields: ['heading'], hasItems: true, hint: 'Ein Eintrag pro Zeitraum: Titel = Zeitraum; Text = Länderzeilen (z. B. „Ukraine: 820 Familien …“), je Land eine Zeile.' },
]

type Item = {
  icon: string
  titleDe: string
  titleEn: string
  descriptionDe: string
  descriptionEn: string
}
type SectionState = {
  eyebrowDe: string; eyebrowEn: string
  headingDe: string; headingEn: string
  descriptionDe: string; descriptionEn: string
  primaryCtaLabelDe: string; primaryCtaLabelEn: string; primaryCtaHref: string
  secondaryCtaLabelDe: string; secondaryCtaLabelEn: string; secondaryCtaHref: string
  imageUrl: string; imageUrl2: string
  items: Item[]
}

const EMPTY_SECTION: SectionState = {
  eyebrowDe: '', eyebrowEn: '', headingDe: '', headingEn: '', descriptionDe: '', descriptionEn: '',
  primaryCtaLabelDe: '', primaryCtaLabelEn: '', primaryCtaHref: '',
  secondaryCtaLabelDe: '', secondaryCtaLabelEn: '', secondaryCtaHref: '',
  imageUrl: '', imageUrl2: '',
  items: [],
}
const EMPTY_ITEM: Item = { icon: '', titleDe: '', titleEn: '', descriptionDe: '', descriptionEn: '' }

// Two stacked inputs (DE над EN) for a translatable single-line field.
function BilingualInput({
  label, de, en, onDe, onEn, textarea,
}: {
  label: string; de: string; en: string
  onDe: (v: string) => void; onEn: (v: string) => void; textarea?: boolean
}) {
  const Cmp = textarea ? Textarea : Input
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <Label className="text-xs text-gray-500">{label} · DE</Label>
        <Cmp value={de} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onDe(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs text-gray-500">{label} · EN</Label>
        <Cmp value={en} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onEn(e.target.value)} />
      </div>
    </div>
  )
}

export default function HomeAdminPage() {
  const [state, setState] = useState<Record<string, SectionState>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  // Key = `${sectionId}:${field}` while that image is uploading.
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/home-sections')
      .then((r) => r.json())
      .then((rows: Array<Record<string, unknown> & { id: string; items?: Item[] }>) => {
        const byId = new Map(rows.map((r) => [r.id, r]))
        const next: Record<string, SectionState> = {}
        for (const def of SECTIONS) {
          const r = byId.get(def.id)
          next[def.id] = {
            ...EMPTY_SECTION,
            ...(r
              ? {
                  eyebrowDe: (r.eyebrowDe as string) || '', eyebrowEn: (r.eyebrowEn as string) || '',
                  headingDe: (r.headingDe as string) || '', headingEn: (r.headingEn as string) || '',
                  descriptionDe: (r.descriptionDe as string) || '', descriptionEn: (r.descriptionEn as string) || '',
                  primaryCtaLabelDe: (r.primaryCtaLabelDe as string) || '', primaryCtaLabelEn: (r.primaryCtaLabelEn as string) || '',
                  primaryCtaHref: (r.primaryCtaHref as string) || '',
                  secondaryCtaLabelDe: (r.secondaryCtaLabelDe as string) || '', secondaryCtaLabelEn: (r.secondaryCtaLabelEn as string) || '',
                  secondaryCtaHref: (r.secondaryCtaHref as string) || '',
                  imageUrl: (r.imageUrl as string) || '', imageUrl2: (r.imageUrl2 as string) || '',
                  items: (r.items as Item[])?.map((it) => ({
                    icon: it.icon || '', titleDe: it.titleDe || '', titleEn: it.titleEn || '',
                    descriptionDe: it.descriptionDe || '', descriptionEn: it.descriptionEn || '',
                  })) ?? [],
                }
              : {}),
          }
        }
        setState(next)
      })
      .finally(() => setLoading(false))
  }, [])

  const patch = (id: string, p: Partial<SectionState>) =>
    setState((s) => ({ ...s, [id]: { ...s[id], ...p } }))

  const uploadImage = async (id: string, field: 'imageUrl' | 'imageUrl2', file: File) => {
    const key = `${id}:${field}`
    setUploading(key)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('upload failed')
      const data = await res.json()
      patch(id, { [field]: data.url } as Partial<SectionState>)
    } catch {
      alert('Upload fehlgeschlagen')
    } finally {
      setUploading(null)
    }
  }

  const patchItem = (id: string, idx: number, p: Partial<Item>) =>
    setState((s) => {
      const items = [...s[id].items]
      items[idx] = { ...items[idx], ...p }
      return { ...s, [id]: { ...s[id], items } }
    })

  const save = async (id: string) => {
    setSaving(id)
    setSavedMsg(null)
    try {
      const res = await fetch('/api/admin/home-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...state[id] }),
      })
      if (!res.ok) throw new Error('save failed')
      setSavedMsg(id)
      setTimeout(() => setSavedMsg(null), 2500)
    } catch {
      alert('Speichern fehlgeschlagen')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <div className="p-8 flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Laden…</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Startseite</h1>
        <p className="text-gray-500 mt-1">Inhalte der Startseiten-Abschnitte — pro Sprache (DE / EN). Leere Felder verwenden den Standardtext.</p>
      </div>

      {SECTIONS.map((def) => {
        const s = state[def.id]
        if (!s) return null
        return (
          <section key={def.id} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{def.label}</h2>
              <Button onClick={() => save(def.id)} disabled={saving === def.id} size="sm" style={{ backgroundColor: '#6E2E2A' }}>
                {saving === def.id ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                {savedMsg === def.id ? 'Gespeichert ✓' : 'Speichern'}
              </Button>
            </div>

            {def.fields.includes('eyebrow') && (
              <BilingualInput label="Label" de={s.eyebrowDe} en={s.eyebrowEn}
                onDe={(v) => patch(def.id, { eyebrowDe: v })} onEn={(v) => patch(def.id, { eyebrowEn: v })} />
            )}
            {def.fields.includes('heading') && (
              <BilingualInput label="Überschrift" de={s.headingDe} en={s.headingEn}
                onDe={(v) => patch(def.id, { headingDe: v })} onEn={(v) => patch(def.id, { headingEn: v })} />
            )}
            {def.fields.includes('description') && (
              <BilingualInput label="Beschreibung" textarea de={s.descriptionDe} en={s.descriptionEn}
                onDe={(v) => patch(def.id, { descriptionDe: v })} onEn={(v) => patch(def.id, { descriptionEn: v })} />
            )}
            {def.fields.includes('cta') && (
              <div className="space-y-3 border-t pt-3">
                <BilingualInput label="Button 1 · Text" de={s.primaryCtaLabelDe} en={s.primaryCtaLabelEn}
                  onDe={(v) => patch(def.id, { primaryCtaLabelDe: v })} onEn={(v) => patch(def.id, { primaryCtaLabelEn: v })} />
                <div>
                  <Label className="text-xs text-gray-500">Button 1 · Link</Label>
                  <Input value={s.primaryCtaHref} onChange={(e) => patch(def.id, { primaryCtaHref: e.target.value })} placeholder="#verkauf" />
                </div>
                <BilingualInput label="Button 2 · Text" de={s.secondaryCtaLabelDe} en={s.secondaryCtaLabelEn}
                  onDe={(v) => patch(def.id, { secondaryCtaLabelDe: v })} onEn={(v) => patch(def.id, { secondaryCtaLabelEn: v })} />
                <div>
                  <Label className="text-xs text-gray-500">Button 2 · Link</Label>
                  <Input value={s.secondaryCtaHref} onChange={(e) => patch(def.id, { secondaryCtaHref: e.target.value })} placeholder="#unternehmen" />
                </div>
              </div>
            )}

            {def.hasImages && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-medium text-gray-700">Bilder <span className="font-normal text-gray-400">(DE &amp; EN gemeinsam)</span></p>
                {([
                  { field: 'imageUrl' as const, label: 'Bild 1', value: s.imageUrl, fallback: def.imageFallbacks?.[0] ?? '' },
                  { field: 'imageUrl2' as const, label: 'Bild 2', value: s.imageUrl2, fallback: def.imageFallbacks?.[1] ?? '' },
                ]).map(({ field, label, value, fallback }) => {
                  const preview = value || fallback
                  const usingFallback = !value
                  const key = `${def.id}:${field}`
                  return (
                    <div key={field} className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-3 items-start">
                      <div className="relative w-36 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt={`${label} Vorschau`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">kein Bild</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-500">{label}</Label>
                          {usingFallback && <span className="text-[11px] text-gray-400">Standardbild</span>}
                        </div>
                        <Input value={value} placeholder={fallback} onChange={(e) => patch(def.id, { [field]: e.target.value } as Partial<SectionState>)} />
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                            {uploading === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            <span>{value ? 'Ersetzen' : 'Hochladen'}</span>
                            <input type="file" accept="image/*" className="hidden" disabled={uploading === key}
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(def.id, field, f); e.target.value = '' }} />
                          </label>
                          <Button type="button" variant="ghost" size="sm" disabled={usingFallback}
                            onClick={() => patch(def.id, { [field]: '' } as Partial<SectionState>)}>
                            <RotateCcw className="h-4 w-4 mr-1.5" /> Zurücksetzen
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <p className="text-xs text-gray-400">„Zurücksetzen“ stellt das im Code hinterlegte Standardbild wieder her. Änderungen erst nach „Speichern“ aktiv.</p>
              </div>
            )}

            {def.hasItems && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-medium text-gray-700">Elemente</p>
                {s.items.map((it, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <Input className="max-w-[220px]" value={it.icon} placeholder="Icon (z.B. MapPin)" onChange={(e) => patchItem(def.id, idx, { icon: e.target.value })} />
                      <Button variant="ghost" size="sm" onClick={() => patch(def.id, { items: s.items.filter((_, i) => i !== idx) })}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <BilingualInput label="Titel" de={it.titleDe} en={it.titleEn}
                      onDe={(v) => patchItem(def.id, idx, { titleDe: v })} onEn={(v) => patchItem(def.id, idx, { titleEn: v })} />
                    <BilingualInput label="Text" textarea de={it.descriptionDe} en={it.descriptionEn}
                      onDe={(v) => patchItem(def.id, idx, { descriptionDe: v })} onEn={(v) => patchItem(def.id, idx, { descriptionEn: v })} />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => patch(def.id, { items: [...s.items, { ...EMPTY_ITEM }] })}>
                  <Plus className="h-4 w-4 mr-1.5" /> Element hinzufügen
                </Button>
                <p className="text-xs text-gray-400">Icon-Namen: MapPin, Home, Trees, Settings, Layers, PenLine, ArrowUpToLine, HandCoins, Hammer, KeyRound, ShieldCheck, Sparkles</p>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
