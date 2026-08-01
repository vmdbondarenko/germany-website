'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, Save } from 'lucide-react'

// Which fields each homepage section exposes in admin. Mirrors what
// lib/home-content.ts actually reads back per section id.
type FieldKey = 'eyebrow' | 'heading' | 'description' | 'cta'
type SectionDef = {
  id: string
  label: string
  fields: FieldKey[]
  hasItems: boolean
  hint?: string
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
  items: Item[]
}

const EMPTY_SECTION: SectionState = {
  eyebrowDe: '', eyebrowEn: '', headingDe: '', headingEn: '', descriptionDe: '', descriptionEn: '',
  primaryCtaLabelDe: '', primaryCtaLabelEn: '', primaryCtaHref: '',
  secondaryCtaLabelDe: '', secondaryCtaLabelEn: '', secondaryCtaHref: '',
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
