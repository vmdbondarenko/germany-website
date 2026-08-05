'use client'

import { useEffect, useState, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, Save, Upload, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react'
import { DEFAULT_BAUWEISE, DEFAULT_ERSTE_BAYERISCHE, DEFAULT_HERO, DEFAULT_GALLERY, DEFAULT_NEWS } from '@/lib/content-defaults'

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
  // Single image slot (saved to imageUrl). label/fallback drive the preview,
  // placeholder and "reset". Shared DE/EN.
  singleImage?: { label: string; fallback: string }
  // Small bilingual label field, saved to secondaryCtaLabelDe/En.
  badgeLabel?: string
  // Single primary button: bilingual label (primaryCtaLabelDe/En) + link (primaryCtaHref).
  singleButtonLabel?: string
}

const SECTIONS: SectionDef[] = [
  // Order mirrors the public homepage (app/[locale]/page.tsx + the About
  // component). Erste Bayerische is rendered between 'bauweise' and 'process'.
  { id: 'hero', label: 'Hero', fields: ['eyebrow', 'heading', 'description', 'cta'], hasItems: false, singleImage: { label: 'Hero-Bild', fallback: DEFAULT_HERO.image }, hint: 'Das Hero-Bild wird für DE und EN gemeinsam verwendet.' },
  { id: 'stats', label: 'Kennzahlen (Stats)', fields: [], hasItems: true, hint: 'Pro Kennzahl: Titel = Wert (z. B. „10+“), Beschreibung = Label (z. B. „Jahre Erfahrung“).' },
  { id: 'upcoming', label: 'Demnächst — Überschrift', fields: ['eyebrow', 'heading', 'description'], hasItems: false, hint: 'Überschrift = 1. Zeile, Eyebrow = 2. (hervorgehobene) Zeile, Beschreibung = Untertitel.' },
  { id: 'new-cities', label: 'Neue Städte — Überschrift', fields: ['heading', 'description'], hasItems: true, hint: 'Überschrift + Untertitel; ein Eintrag (Titel + Beschreibung) = die Fußnote.' },
  { id: 'since-founding', label: 'Seit unserer Gründung', fields: ['heading'], hasItems: true, hint: 'Ein Eintrag pro Zeitraum: Titel = Zeitraum; Text = Länderzeilen (z. B. „Ukraine: 820 Familien …“), je Land eine Zeile.' },
  { id: 'values', label: 'Unsere Werte', fields: ['eyebrow', 'heading'], hasItems: true, hint: 'Pro Karte: Titel + Beschreibung. Reihenfolge = Anzeigereihenfolge (Farben sind fest).' },
  { id: 'bauweise', label: 'Bauweise und Entwicklung', fields: ['heading', 'description', 'cta'], hasItems: false, hasImages: true, imageFallbacks: [DEFAULT_BAUWEISE.image1, DEFAULT_BAUWEISE.image2], hint: 'Absätze in der Beschreibung durch eine Leerzeile trennen. Nur der primäre CTA (Label + Link) wird verwendet. Bilder werden für DE und EN gemeinsam verwendet.' },
  { id: 'process', label: 'Warum wir (Process)', fields: ['heading', 'description'], hasItems: true },
  { id: 'distinguishes', label: 'Was uns auszeichnet', fields: ['eyebrow', 'heading', 'description'], hasItems: true },
  { id: 'services', label: 'Wie wir helfen (Services)', fields: ['heading', 'description'], hasItems: true },
  { id: 'interior', label: 'Innenräume', fields: ['heading', 'description'], hasItems: false },
  { id: 'buying', label: 'Kaufprozess — Überschrift', fields: ['heading'], hasItems: false },
  { id: 'investor', label: 'Über das Unternehmen', fields: ['eyebrow', 'heading', 'description'], hasItems: false, badgeLabel: 'Kleines Label', singleButtonLabel: 'Button', hint: 'Beschreibung = Fließtext (Absätze durch Leerzeile trennen). „Kleines Label“ steht über dem Text.' },
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

// ── "Erste Bayerische" — dedicated richer editor (separate from the generic
// SECTIONS loop). Stored as HomeSection "erste-bayerische" + kind-discriminated
// HomeSectionItem rows (hero / wide / block:* / travel / gallery). ──
type EbImg = { imageUrl: string; altDe: string; altEn: string }
type EbBlockS = EbImg & { titleDe: string; titleEn: string; bodyDe: string; bodyEn: string }
type EbTravel = { icon: string; titleDe: string; titleEn: string; descDe: string; descEn: string; metaDe: string; metaEn: string }
type EbState = {
  projectNameDe: string; projectNameEn: string
  headingDe: string; headingEn: string
  introDe: string; introEn: string
  hero: EbImg; wide: EbImg
  location: EbBlockS; nature: EbBlockS; see: EbBlockS
  closingTitleDe: string; closingTitleEn: string; closingBodyDe: string; closingBodyEn: string
  travel: EbTravel[]
  gallery: EbImg[]
}

const EB_D = DEFAULT_ERSTE_BAYERISCHE
// Code-default image paths per slot (shown as preview/placeholder; restored by reset).
const EB_FB = {
  hero: EB_D.hero.image,
  wide: EB_D.wide.image,
  location: EB_D.blocks.location.image,
  nature: EB_D.blocks.nature.image,
  see: EB_D.blocks.see.image,
}

type EbRow = {
  eyebrowDe?: string; eyebrowEn?: string; headingDe?: string; headingEn?: string
  descriptionDe?: string; descriptionEn?: string
  items?: Array<{
    kind?: string; icon?: string; titleDe?: string; titleEn?: string
    descriptionDe?: string; descriptionEn?: string
    imageUrl?: string; imageAltDe?: string; imageAltEn?: string; metaDe?: string; metaEn?: string
  }>
}

// Build the editor state from the DB row, falling back to the shared code
// defaults per field so the editor is always populated (even before any seed).
function ebFromRow(row: EbRow | undefined): EbState {
  const items = row?.items ?? []
  const one = (k: string) => items.find((i) => i.kind === k)
  const many = (k: string) => items.filter((i) => i.kind === k)
  const img = (k: string, fbAlt: { de: string; en: string }): EbImg => {
    const it = one(k)
    return { imageUrl: it?.imageUrl || '', altDe: it?.imageAltDe || fbAlt.de, altEn: it?.imageAltEn || fbAlt.en }
  }
  const block = (k: string, fb: typeof EB_D.blocks.location): EbBlockS => {
    const it = one(k)
    return {
      titleDe: it?.titleDe || fb.title.de, titleEn: it?.titleEn || fb.title.en,
      bodyDe: it?.descriptionDe || fb.body.de, bodyEn: it?.descriptionEn || fb.body.en,
      imageUrl: it?.imageUrl || '', altDe: it?.imageAltDe || fb.alt.de, altEn: it?.imageAltEn || fb.alt.en,
    }
  }
  const closing = one('block:closing')
  const travelItems = many('travel')
  const galleryItems = many('gallery')
  return {
    projectNameDe: row?.eyebrowDe || EB_D.projectName.de, projectNameEn: row?.eyebrowEn || EB_D.projectName.en,
    headingDe: row?.headingDe || EB_D.heading.de, headingEn: row?.headingEn || EB_D.heading.en,
    introDe: row?.descriptionDe || EB_D.intro.de, introEn: row?.descriptionEn || EB_D.intro.en,
    hero: img('hero', EB_D.hero.alt), wide: img('wide', EB_D.wide.alt),
    location: block('block:location', EB_D.blocks.location),
    nature: block('block:nature', EB_D.blocks.nature),
    see: block('block:see', EB_D.blocks.see),
    closingTitleDe: closing?.titleDe || EB_D.blocks.closing.title.de, closingTitleEn: closing?.titleEn || EB_D.blocks.closing.title.en,
    closingBodyDe: closing?.descriptionDe || EB_D.blocks.closing.body.de, closingBodyEn: closing?.descriptionEn || EB_D.blocks.closing.body.en,
    travel: travelItems.length
      ? travelItems.map((it) => ({ icon: it.icon || 'Sparkles', titleDe: it.titleDe || '', titleEn: it.titleEn || '', descDe: it.descriptionDe || '', descEn: it.descriptionEn || '', metaDe: it.metaDe || '', metaEn: it.metaEn || '' }))
      : EB_D.travel.map((t) => ({ icon: t.icon, titleDe: t.title.de, titleEn: t.title.en, descDe: '', descEn: '', metaDe: t.meta.de, metaEn: t.meta.en })),
    gallery: galleryItems.length
      ? galleryItems.map((it) => ({ imageUrl: it.imageUrl || '', altDe: it.imageAltDe || '', altEn: it.imageAltEn || '' }))
      : EB_D.gallery.map((g) => ({ imageUrl: g.image, altDe: g.alt.de, altEn: g.alt.en })),
  }
}

// One image slot: preview + upload/replace + URL + reset-to-fallback + DE/EN alt.
// Top-level (stable identity) so text inputs keep focus while typing.
function EbImageField({
  label, value, fallback, altDe, altEn, busy, onFile, onUrl, onAltDe, onAltEn,
}: {
  label: string; value: string; fallback: string; altDe: string; altEn: string
  busy: boolean; onFile: (f: File) => void; onUrl: (v: string) => void
  onAltDe: (v: string) => void; onAltEn: (v: string) => void
}) {
  const preview = value || fallback
  const usingFallback = !value
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-3 items-start">
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
          <Input value={value} placeholder={fallback} onChange={(e) => onUrl(e.target.value)} />
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>{value ? 'Ersetzen' : 'Hochladen'}</span>
              <input type="file" accept="image/*" className="hidden" disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
            </label>
            <Button type="button" variant="ghost" size="sm" disabled={usingFallback} onClick={() => onUrl('')}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Zurücksetzen
            </Button>
          </div>
        </div>
      </div>
      <BilingualInput label="Alt-Text" de={altDe} en={altEn} onDe={onAltDe} onEn={onAltEn} />
    </div>
  )
}

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

// ── Completed-projects gallery (HomeSection "gallery") ──
type GalleryCountry = 'poland' | 'ukraine'
type GImg = { imageUrl: string; altDe: string; altEn: string; lead: boolean }
type GalleryState = {
  enabled: boolean
  eyebrowDe: string; eyebrowEn: string
  headingDe: string; headingEn: string
  subtitleDe: string; subtitleEn: string
  polandLabelDe: string; polandLabelEn: string
  ukraineLabelDe: string; ukraineLabelEn: string
  poland: GImg[]
  ukraine: GImg[]
}
type GalleryRow = {
  enabled?: boolean
  eyebrowDe?: string; eyebrowEn?: string; headingDe?: string; headingEn?: string
  descriptionDe?: string; descriptionEn?: string
  primaryCtaLabelDe?: string; primaryCtaLabelEn?: string
  secondaryCtaLabelDe?: string; secondaryCtaLabelEn?: string
  items?: Array<{ kind?: string; imageUrl?: string; imageAltDe?: string; imageAltEn?: string; icon?: string }>
}
const GAL_D = DEFAULT_GALLERY
function galleryFromRow(row: GalleryRow | undefined): GalleryState {
  const items = row?.items ?? []
  const map = (country: GalleryCountry): GImg[] =>
    items.filter((i) => i.kind === country).map((it) => ({
      imageUrl: it.imageUrl || '', altDe: it.imageAltDe || '', altEn: it.imageAltEn || '', lead: it.icon === 'lead',
    }))
  return {
    enabled: row?.enabled ?? true,
    eyebrowDe: row?.eyebrowDe || GAL_D.eyebrow.de, eyebrowEn: row?.eyebrowEn || GAL_D.eyebrow.en,
    headingDe: row?.headingDe || GAL_D.heading.de, headingEn: row?.headingEn || GAL_D.heading.en,
    // Subtitle is optional: keep the saved value (may be empty) once a row exists.
    subtitleDe: row ? (row.descriptionDe || '') : GAL_D.subtitle.de,
    subtitleEn: row ? (row.descriptionEn || '') : GAL_D.subtitle.en,
    polandLabelDe: row?.primaryCtaLabelDe || GAL_D.polandLabel.de, polandLabelEn: row?.primaryCtaLabelEn || GAL_D.polandLabel.en,
    ukraineLabelDe: row?.secondaryCtaLabelDe || GAL_D.ukraineLabel.de, ukraineLabelEn: row?.secondaryCtaLabelEn || GAL_D.ukraineLabel.en,
    poland: map('poland'),
    ukraine: map('ukraine'),
  }
}

// ── Homepage "Aktuelles" (news) section header ──
type NewsState = {
  enabled: boolean
  eyebrowDe: string; eyebrowEn: string
  headingDe: string; headingEn: string
  subtitleDe: string; subtitleEn: string
  allNewsDe: string; allNewsEn: string
}
type NewsRow = {
  enabled?: boolean
  eyebrowDe?: string; eyebrowEn?: string; headingDe?: string; headingEn?: string
  descriptionDe?: string; descriptionEn?: string
  primaryCtaLabelDe?: string; primaryCtaLabelEn?: string
}
const NEWS_D = DEFAULT_NEWS
function newsFromRow(row: NewsRow | undefined): NewsState {
  return {
    enabled: row?.enabled ?? true,
    eyebrowDe: row?.eyebrowDe || NEWS_D.eyebrow.de, eyebrowEn: row?.eyebrowEn || NEWS_D.eyebrow.en,
    headingDe: row?.headingDe || NEWS_D.heading.de, headingEn: row?.headingEn || NEWS_D.heading.en,
    subtitleDe: row?.descriptionDe || NEWS_D.subtitle.de, subtitleEn: row?.descriptionEn || NEWS_D.subtitle.en,
    allNewsDe: row?.primaryCtaLabelDe || NEWS_D.allNewsLabel.de, allNewsEn: row?.primaryCtaLabelEn || NEWS_D.allNewsLabel.en,
  }
}

export default function HomeAdminPage() {
  const [state, setState] = useState<Record<string, SectionState>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  // Key = `${sectionId}:${field}` while that image is uploading.
  const [uploading, setUploading] = useState<string | null>(null)
  const [eb, setEb] = useState<EbState>(() => ebFromRow(undefined))
  const [savingEb, setSavingEb] = useState(false)
  const [savedEb, setSavedEb] = useState(false)
  const [gallery, setGallery] = useState<GalleryState>(() => galleryFromRow(undefined))
  const [savingGallery, setSavingGallery] = useState(false)
  const [savedGallery, setSavedGallery] = useState(false)
  const [news, setNews] = useState<NewsState>(() => newsFromRow(undefined))
  const [savingNews, setSavingNews] = useState(false)
  const [savedNews, setSavedNews] = useState(false)

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
        setEb(ebFromRow(byId.get('erste-bayerische') as EbRow | undefined))
        setGallery(galleryFromRow(byId.get('gallery') as GalleryRow | undefined))
        setNews(newsFromRow(byId.get('news') as NewsRow | undefined))
      })
      .finally(() => setLoading(false))
  }, [])

  const patch = (id: string, p: Partial<SectionState>) =>
    setState((s) => ({ ...s, [id]: { ...s[id], ...p } }))

  // Low-level upload → returns the blob URL (or null on failure). `key` drives the
  // per-slot spinner via `uploading`.
  const uploadFile = async (key: string, file: File): Promise<string | null> => {
    setUploading(key)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        // Surface the actual server error (e.g. missing blob token, 401, 413)
        // instead of a generic message.
        let detail = `HTTP ${res.status}`
        try {
          const body = await res.json()
          if (body?.error) detail = body.error
        } catch {
          /* non-JSON body */
        }
        throw new Error(detail)
      }
      const data = await res.json()
      return data.url as string
    } catch (e) {
      alert('Upload fehlgeschlagen: ' + (e instanceof Error ? e.message : String(e)))
      return null
    } finally {
      setUploading(null)
    }
  }

  const uploadImage = async (id: string, field: 'imageUrl' | 'imageUrl2', file: File) => {
    const url = await uploadFile(`${id}:${field}`, file)
    if (url) patch(id, { [field]: url } as Partial<SectionState>)
  }

  // ── Erste Bayerische state helpers ──
  const ebPatch = (p: Partial<EbState>) => setEb((s) => ({ ...s, ...p }))
  const ebPatchImg = (slot: 'hero' | 'wide', p: Partial<EbImg>) =>
    setEb((s) => ({ ...s, [slot]: { ...s[slot], ...p } }))
  const ebPatchBlock = (slot: 'location' | 'nature' | 'see', p: Partial<EbBlockS>) =>
    setEb((s) => ({ ...s, [slot]: { ...s[slot], ...p } }))
  const ebPatchTravel = (idx: number, p: Partial<EbTravel>) =>
    setEb((s) => { const travel = [...s.travel]; travel[idx] = { ...travel[idx], ...p }; return { ...s, travel } })
  const ebPatchGallery = (idx: number, p: Partial<EbImg>) =>
    setEb((s) => { const gallery = [...s.gallery]; gallery[idx] = { ...gallery[idx], ...p }; return { ...s, gallery } })
  const ebMove = <T,>(arr: T[], idx: number, dir: -1 | 1): T[] => {
    const j = idx + dir
    if (j < 0 || j >= arr.length) return arr
    const next = [...arr]; const [it] = next.splice(idx, 1); next.splice(j, 0, it); return next
  }
  const ebUploadImg = async (slot: 'hero' | 'wide', file: File) => {
    const url = await uploadFile(`eb:${slot}`, file); if (url) ebPatchImg(slot, { imageUrl: url })
  }
  const ebUploadBlock = async (slot: 'location' | 'nature' | 'see', file: File) => {
    const url = await uploadFile(`eb:${slot}`, file); if (url) ebPatchBlock(slot, { imageUrl: url })
  }
  const ebUploadGallery = async (idx: number, file: File) => {
    const url = await uploadFile(`eb:gallery:${idx}`, file); if (url) ebPatchGallery(idx, { imageUrl: url })
  }

  const saveEb = async () => {
    setSavingEb(true); setSavedEb(false)
    const blockItem = (kind: string, b: EbBlockS) => ({
      kind, titleDe: b.titleDe, titleEn: b.titleEn, descriptionDe: b.bodyDe, descriptionEn: b.bodyEn,
      imageUrl: b.imageUrl, imageAltDe: b.altDe, imageAltEn: b.altEn,
    })
    const items = [
      { kind: 'hero', imageUrl: eb.hero.imageUrl, imageAltDe: eb.hero.altDe, imageAltEn: eb.hero.altEn },
      blockItem('block:location', eb.location),
      { kind: 'wide', imageUrl: eb.wide.imageUrl, imageAltDe: eb.wide.altDe, imageAltEn: eb.wide.altEn },
      blockItem('block:nature', eb.nature),
      blockItem('block:see', eb.see),
      { kind: 'block:closing', titleDe: eb.closingTitleDe, titleEn: eb.closingTitleEn, descriptionDe: eb.closingBodyDe, descriptionEn: eb.closingBodyEn },
      ...eb.travel.map((t) => ({ kind: 'travel', icon: t.icon, titleDe: t.titleDe, titleEn: t.titleEn, descriptionDe: t.descDe, descriptionEn: t.descEn, metaDe: t.metaDe, metaEn: t.metaEn })),
      ...eb.gallery.filter((g) => g.imageUrl.trim()).map((g) => ({ kind: 'gallery', imageUrl: g.imageUrl, imageAltDe: g.altDe, imageAltEn: g.altEn })),
    ]
    try {
      const res = await fetch('/api/admin/home-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'erste-bayerische', order: 15, enabled: true,
          eyebrowDe: eb.projectNameDe, eyebrowEn: eb.projectNameEn,
          headingDe: eb.headingDe, headingEn: eb.headingEn,
          descriptionDe: eb.introDe, descriptionEn: eb.introEn,
          items,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setSavedEb(true); setTimeout(() => setSavedEb(false), 2500)
    } catch {
      alert('Speichern fehlgeschlagen')
    } finally {
      setSavingEb(false)
    }
  }

  // ── Gallery handlers ──
  const gPatch = (p: Partial<GalleryState>) => setGallery((s) => ({ ...s, ...p }))
  const gImgPatch = (country: GalleryCountry, idx: number, p: Partial<GImg>) =>
    setGallery((s) => { const arr = [...s[country]]; arr[idx] = { ...arr[idx], ...p }; return { ...s, [country]: arr } })
  const gRemove = (country: GalleryCountry, idx: number) =>
    setGallery((s) => ({ ...s, [country]: s[country].filter((_, i) => i !== idx) }))
  const gMove = (country: GalleryCountry, idx: number, dir: -1 | 1) =>
    setGallery((s) => {
      const j = idx + dir
      if (j < 0 || j >= s[country].length) return s
      const arr = [...s[country]]; const [it] = arr.splice(idx, 1); arr.splice(j, 0, it)
      return { ...s, [country]: arr }
    })
  const gSetLead = (country: GalleryCountry, idx: number) =>
    setGallery((s) => ({ ...s, [country]: s[country].map((g, i) => ({ ...g, lead: i === idx })) }))
  const gMoveCountry = (from: GalleryCountry, idx: number) =>
    setGallery((s) => {
      const to: GalleryCountry = from === 'poland' ? 'ukraine' : 'poland'
      const src = [...s[from]]; const [it] = src.splice(idx, 1)
      return { ...s, [from]: src, [to]: [...s[to], { ...it, lead: false }] }
    })
  const gUpload = async (country: GalleryCountry, file: File, idx: number | null) => {
    const url = await uploadFile(`gallery:${country}:${idx ?? 'new'}`, file)
    if (!url) return
    setGallery((s) => {
      const arr = [...s[country]]
      if (idx === null) arr.push({ imageUrl: url, altDe: '', altEn: '', lead: false })
      else arr[idx] = { ...arr[idx], imageUrl: url }
      return { ...s, [country]: arr }
    })
  }

  const saveGallery = async () => {
    setSavingGallery(true); setSavedGallery(false)
    const mk = (arr: GImg[], country: GalleryCountry) =>
      arr.filter((g) => g.imageUrl.trim()).map((g) => ({
        kind: country, imageUrl: g.imageUrl, imageAltDe: g.altDe, imageAltEn: g.altEn, icon: g.lead ? 'lead' : '',
      }))
    const items = [...mk(gallery.poland, 'poland'), ...mk(gallery.ukraine, 'ukraine')]
    try {
      const res = await fetch('/api/admin/home-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'gallery', order: 16, enabled: gallery.enabled,
          eyebrowDe: gallery.eyebrowDe, eyebrowEn: gallery.eyebrowEn,
          headingDe: gallery.headingDe, headingEn: gallery.headingEn,
          descriptionDe: gallery.subtitleDe, descriptionEn: gallery.subtitleEn,
          primaryCtaLabelDe: gallery.polandLabelDe, primaryCtaLabelEn: gallery.polandLabelEn,
          secondaryCtaLabelDe: gallery.ukraineLabelDe, secondaryCtaLabelEn: gallery.ukraineLabelEn,
          items,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setSavedGallery(true); setTimeout(() => setSavedGallery(false), 2500)
    } catch {
      alert('Speichern fehlgeschlagen')
    } finally {
      setSavingGallery(false)
    }
  }

  // ── News section-header handlers ──
  const nPatch = (p: Partial<NewsState>) => setNews((s) => ({ ...s, ...p }))
  const saveNews = async () => {
    setSavingNews(true); setSavedNews(false)
    try {
      const res = await fetch('/api/admin/home-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'news', order: 17, enabled: news.enabled,
          eyebrowDe: news.eyebrowDe, eyebrowEn: news.eyebrowEn,
          headingDe: news.headingDe, headingEn: news.headingEn,
          descriptionDe: news.subtitleDe, descriptionEn: news.subtitleEn,
          primaryCtaLabelDe: news.allNewsDe, primaryCtaLabelEn: news.allNewsEn,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setSavedNews(true); setTimeout(() => setSavedNews(false), 2500)
    } catch {
      alert('Speichern fehlgeschlagen')
    } finally {
      setSavingNews(false)
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

  const ersteBayerischeEditor = (
      <section className="border-2 border-[#6E2E2A]/20 rounded-xl p-5 space-y-5 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Erste Bayerische <span className="text-sm font-normal text-gray-400">— Investitionsabschnitt</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Erscheint auf der Startseite direkt nach „Bauweise und Entwicklung“. Bilder werden für DE &amp; EN gemeinsam verwendet.
            </p>
          </div>
          <Button onClick={saveEb} disabled={savingEb} size="sm" style={{ backgroundColor: '#6E2E2A' }}>
            {savingEb ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {savedEb ? 'Gespeichert ✓' : 'Speichern'}
          </Button>
        </div>

        <BilingualInput label="Projektname" de={eb.projectNameDe} en={eb.projectNameEn}
          onDe={(v) => ebPatch({ projectNameDe: v })} onEn={(v) => ebPatch({ projectNameEn: v })} />
        <BilingualInput label="Hauptüberschrift" de={eb.headingDe} en={eb.headingEn}
          onDe={(v) => ebPatch({ headingDe: v })} onEn={(v) => ebPatch({ headingEn: v })} />
        <BilingualInput label="Einleitungstext" textarea de={eb.introDe} en={eb.introEn}
          onDe={(v) => ebPatch({ introDe: v })} onEn={(v) => ebPatch({ introEn: v })} />

        {/* Hero image */}
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Hero-Bild</p>
          <EbImageField label="Hero" value={eb.hero.imageUrl} fallback={EB_FB.hero}
            altDe={eb.hero.altDe} altEn={eb.hero.altEn} busy={uploading === 'eb:hero'}
            onFile={(f) => ebUploadImg('hero', f)} onUrl={(v) => ebPatchImg('hero', { imageUrl: v })}
            onAltDe={(v) => ebPatchImg('hero', { altDe: v })} onAltEn={(v) => ebPatchImg('hero', { altEn: v })} />
        </div>

        {/* Text subsections with supporting images */}
        {(['location', 'nature', 'see'] as const).map((slot) => {
          const labels: Record<typeof slot, string> = {
            location: 'Abschnitt 1 — Lage & Anbindung',
            nature: 'Abschnitt 2 — Natur & Umgebung',
            see: 'Abschnitt 3 — Zeuthener See & Marina',
          }
          const b = eb[slot]
          return (
            <div key={slot} className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">{labels[slot]}</p>
              <BilingualInput label="Zwischenüberschrift" de={b.titleDe} en={b.titleEn}
                onDe={(v) => ebPatchBlock(slot, { titleDe: v })} onEn={(v) => ebPatchBlock(slot, { titleEn: v })} />
              <BilingualInput label="Text" textarea de={b.bodyDe} en={b.bodyEn}
                onDe={(v) => ebPatchBlock(slot, { bodyDe: v })} onEn={(v) => ebPatchBlock(slot, { bodyEn: v })} />
              <EbImageField label="Begleitbild" value={b.imageUrl} fallback={EB_FB[slot]}
                altDe={b.altDe} altEn={b.altEn} busy={uploading === `eb:${slot}`}
                onFile={(f) => ebUploadBlock(slot, f)} onUrl={(v) => ebPatchBlock(slot, { imageUrl: v })}
                onAltDe={(v) => ebPatchBlock(slot, { altDe: v })} onAltEn={(v) => ebPatchBlock(slot, { altEn: v })} />
            </div>
          )
        })}

        {/* Wide full-width image */}
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Weites Naturbild (volle Breite)</p>
          <EbImageField label="Weites Bild" value={eb.wide.imageUrl} fallback={EB_FB.wide}
            altDe={eb.wide.altDe} altEn={eb.wide.altEn} busy={uploading === 'eb:wide'}
            onFile={(f) => ebUploadImg('wide', f)} onUrl={(v) => ebPatchImg('wide', { imageUrl: v })}
            onAltDe={(v) => ebPatchImg('wide', { altDe: v })} onAltEn={(v) => ebPatchImg('wide', { altEn: v })} />
        </div>

        {/* Closing paragraph */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Abschlussabsatz</p>
          <BilingualInput label="Text" textarea de={eb.closingBodyDe} en={eb.closingBodyEn}
            onDe={(v) => ebPatch({ closingBodyDe: v })} onEn={(v) => ebPatch({ closingBodyEn: v })} />
        </div>

        {/* Travel entries */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Reisezeiten &amp; Infrastruktur</p>
          {eb.travel.map((t, idx) => (
            <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50">
              <div className="flex items-center justify-between gap-2">
                <Input className="max-w-[240px]" value={t.icon} placeholder="Icon (Train, Route, ShoppingCart, Plane)"
                  onChange={(e) => ebPatchTravel(idx, { icon: e.target.value })} />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => ebPatch({ travel: ebMove(eb.travel, idx, -1) })}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled={idx === eb.travel.length - 1} onClick={() => ebPatch({ travel: ebMove(eb.travel, idx, 1) })}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => ebPatch({ travel: eb.travel.filter((_, i) => i !== idx) })}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <BilingualInput label="Titel" de={t.titleDe} en={t.titleEn}
                onDe={(v) => ebPatchTravel(idx, { titleDe: v })} onEn={(v) => ebPatchTravel(idx, { titleEn: v })} />
              <BilingualInput label="Beschreibung (optional)" de={t.descDe} en={t.descEn}
                onDe={(v) => ebPatchTravel(idx, { descDe: v })} onEn={(v) => ebPatchTravel(idx, { descEn: v })} />
              <BilingualInput label="Zeit / Distanz" de={t.metaDe} en={t.metaEn}
                onDe={(v) => ebPatchTravel(idx, { metaDe: v })} onEn={(v) => ebPatchTravel(idx, { metaEn: v })} />
            </div>
          ))}
          <Button variant="outline" size="sm"
            onClick={() => ebPatch({ travel: [...eb.travel, { icon: 'MapPin', titleDe: '', titleEn: '', descDe: '', descEn: '', metaDe: '', metaEn: '' }] })}>
            <Plus className="h-4 w-4 mr-1.5" /> Eintrag hinzufügen
          </Button>
          <p className="text-xs text-gray-400">Icons: Train, Route, ShoppingCart, Plane, MapPin, Home, Trees …</p>
        </div>

        {/* Gallery */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Galerie <span className="font-normal text-gray-400">(optional, 3–6 Bilder)</span></p>
          {eb.gallery.map((g, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">Galeriebild {idx + 1}</Label>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => ebPatch({ gallery: ebMove(eb.gallery, idx, -1) })}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled={idx === eb.gallery.length - 1} onClick={() => ebPatch({ gallery: ebMove(eb.gallery, idx, 1) })}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => ebPatch({ gallery: eb.gallery.filter((_, i) => i !== idx) })}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <EbImageField label={`Galeriebild ${idx + 1}`} value={g.imageUrl} fallback=""
                altDe={g.altDe} altEn={g.altEn} busy={uploading === `eb:gallery:${idx}`}
                onFile={(f) => ebUploadGallery(idx, f)} onUrl={(v) => ebPatchGallery(idx, { imageUrl: v })}
                onAltDe={(v) => ebPatchGallery(idx, { altDe: v })} onAltEn={(v) => ebPatchGallery(idx, { altEn: v })} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => ebPatch({ gallery: [...eb.gallery, { imageUrl: '', altDe: '', altEn: '' }] })}>
            <Plus className="h-4 w-4 mr-1.5" /> Galeriebild hinzufügen
          </Button>
        </div>

        <p className="text-xs text-gray-400">
          Leere Text-/Bildfelder verwenden den im Code hinterlegten Standard. „Zurücksetzen“ stellt das Standardbild wieder her. Änderungen erst nach „Speichern“ aktiv.
        </p>
      </section>
  )

  // Rendered in the map immediately after the „Seit unserer Gründung“ block
  // (matches the public homepage order).
  const galleryEditor = (
      <section className="border-2 border-[#6E2E2A]/20 rounded-xl p-5 space-y-5 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Galerie <span className="text-sm font-normal text-gray-400">— Abgeschlossene Projekte</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Erscheint auf der Startseite direkt nach „Über das Unternehmen / Wer wir sind“. Bilder, Reihenfolge, Land und Lead-Auswahl gelten für DE &amp; EN gemeinsam; nur Texte/Alt-Texte sind pro Sprache.
            </p>
          </div>
          <Button onClick={saveGallery} disabled={savingGallery} size="sm" style={{ backgroundColor: '#6E2E2A' }}>
            {savingGallery ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {savedGallery ? 'Gespeichert ✓' : 'Speichern'}
          </Button>
        </div>

        {/* Visibility */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={gallery.enabled} onChange={(e) => gPatch({ enabled: e.target.checked })} className="h-4 w-4" />
          <span className="text-sm font-medium text-gray-800">Abschnitt anzeigen</span>
          <span className="text-xs text-gray-400">(aus = Galerie auf DE &amp; EN ausgeblendet; Inhalte bleiben gespeichert)</span>
        </label>

        {/* Section texts */}
        <BilingualInput label="Eyebrow" de={gallery.eyebrowDe} en={gallery.eyebrowEn}
          onDe={(v) => gPatch({ eyebrowDe: v })} onEn={(v) => gPatch({ eyebrowEn: v })} />
        <BilingualInput label="Überschrift" de={gallery.headingDe} en={gallery.headingEn}
          onDe={(v) => gPatch({ headingDe: v })} onEn={(v) => gPatch({ headingEn: v })} />
        <BilingualInput label="Untertitel (optional)" textarea de={gallery.subtitleDe} en={gallery.subtitleEn}
          onDe={(v) => gPatch({ subtitleDe: v })} onEn={(v) => gPatch({ subtitleEn: v })} />
        <BilingualInput label="Tab „Polen“" de={gallery.polandLabelDe} en={gallery.polandLabelEn}
          onDe={(v) => gPatch({ polandLabelDe: v })} onEn={(v) => gPatch({ polandLabelEn: v })} />
        <BilingualInput label="Tab „Ukraine“" de={gallery.ukraineLabelDe} en={gallery.ukraineLabelEn}
          onDe={(v) => gPatch({ ukraineLabelDe: v })} onEn={(v) => gPatch({ ukraineLabelEn: v })} />

        {/* Images per country */}
        {(['poland', 'ukraine'] as const).map((country) => {
          const label = country === 'poland' ? 'Polen' : 'Ukraine'
          const other = country === 'poland' ? 'Ukraine' : 'Polen'
          const arr = gallery[country]
          const addKey = `gallery:${country}:new`
          return (
            <div key={country} className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">{label} <span className="font-normal text-gray-400">({arr.length} Bilder)</span></p>
                <label className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                  {uploading === addKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Bild hinzufügen</span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploading === addKey}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) gUpload(country, f, null); e.target.value = '' }} />
                </label>
              </div>
              {arr.length === 0 && <p className="text-xs text-gray-400">Noch keine Bilder. Mit „Bild hinzufügen“ hochladen.</p>}
              {arr.map((g, idx) => {
                const key = `gallery:${country}:${idx}`
                return (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50 grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-3">
                    <div className="relative w-40 h-28 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {g.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">kein Bild</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="radio" name={`lead-${country}`} checked={g.lead} onChange={() => gSetLead(country, idx)} />
                          Lead-Bild
                        </label>
                        <span className="flex-1" />
                        <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => gMove(country, idx, -1)} aria-label="Nach oben"><ArrowUp className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" disabled={idx === arr.length - 1} onClick={() => gMove(country, idx, 1)} aria-label="Nach unten"><ArrowDown className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => gMoveCountry(country, idx)}>→ {other}</Button>
                        <Button variant="ghost" size="sm" onClick={() => gRemove(country, idx)} aria-label="Löschen"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                          {uploading === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          <span>Ersetzen</span>
                          <input type="file" accept="image/*" className="hidden" disabled={uploading === key}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) gUpload(country, f, idx); e.target.value = '' }} />
                        </label>
                        <Input value={g.imageUrl} placeholder="Bild-URL" onChange={(e) => gImgPatch(country, idx, { imageUrl: e.target.value })} />
                      </div>
                      <BilingualInput label="Alt-Text" de={g.altDe} en={g.altEn}
                        onDe={(v) => gImgPatch(country, idx, { altDe: v })} onEn={(v) => gImgPatch(country, idx, { altEn: v })} />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
        <p className="text-xs text-gray-400">Nur Fotos — keine Titel/Beschreibungen. „Lead-Bild“ = großes Bild oben je Land. Reihenfolge per ▲▼ getrennt je Land. Änderungen erst nach „Speichern“ aktiv.</p>
      </section>
  )

  // Rendered immediately after the „Über das Unternehmen" (investor) block —
  // controls the header copy of the homepage "Aktuelles" scroller. The articles
  // themselves are managed under /admin/news.
  const newsSettingsEditor = (
    <section className="border-2 border-[#6E2E2A]/20 rounded-xl p-5 space-y-5 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Aktuelles <span className="text-sm font-normal text-gray-400">— Abschnittsüberschrift</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Erscheint auf der Startseite direkt nach „Über das Unternehmen". Nur die Kopfzeile; die Beiträge werden unter „News" verwaltet.
          </p>
        </div>
        <Button onClick={saveNews} disabled={savingNews} size="sm" style={{ backgroundColor: '#6E2E2A' }}>
          {savingNews ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          {savedNews ? 'Gespeichert ✓' : 'Speichern'}
        </Button>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={news.enabled} onChange={(e) => nPatch({ enabled: e.target.checked })} className="h-4 w-4" />
        <span className="text-sm font-medium text-gray-800">Abschnitt anzeigen</span>
        <span className="text-xs text-gray-400">(aus = Aktuelles auf der Startseite ausgeblendet; Beiträge bleiben gespeichert)</span>
      </label>

      <BilingualInput label="Label (Eyebrow)" de={news.eyebrowDe} en={news.eyebrowEn}
        onDe={(v) => nPatch({ eyebrowDe: v })} onEn={(v) => nPatch({ eyebrowEn: v })} />
      <BilingualInput label="Überschrift" de={news.headingDe} en={news.headingEn}
        onDe={(v) => nPatch({ headingDe: v })} onEn={(v) => nPatch({ headingEn: v })} />
      <BilingualInput label="Untertitel" textarea de={news.subtitleDe} en={news.subtitleEn}
        onDe={(v) => nPatch({ subtitleDe: v })} onEn={(v) => nPatch({ subtitleEn: v })} />
      <BilingualInput label="Button-Text (Alle Neuigkeiten)" de={news.allNewsDe} en={news.allNewsEn}
        onDe={(v) => nPatch({ allNewsDe: v })} onEn={(v) => nPatch({ allNewsEn: v })} />
      <p className="text-xs text-gray-400">Leere Felder verwenden den Standardtext. Änderungen erst nach „Speichern" aktiv.</p>
    </section>
  )

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
          <Fragment key={def.id}>
            <section className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white">
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
            {def.badgeLabel && (
              <BilingualInput label={def.badgeLabel} de={s.secondaryCtaLabelDe} en={s.secondaryCtaLabelEn}
                onDe={(v) => patch(def.id, { secondaryCtaLabelDe: v })} onEn={(v) => patch(def.id, { secondaryCtaLabelEn: v })} />
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

            {def.singleButtonLabel && (
              <div className="space-y-3 border-t pt-3">
                <BilingualInput label={`${def.singleButtonLabel} · Text`} de={s.primaryCtaLabelDe} en={s.primaryCtaLabelEn}
                  onDe={(v) => patch(def.id, { primaryCtaLabelDe: v })} onEn={(v) => patch(def.id, { primaryCtaLabelEn: v })} />
                <div>
                  <Label className="text-xs text-gray-500">{def.singleButtonLabel} · Link</Label>
                  <Input value={s.primaryCtaHref} onChange={(e) => patch(def.id, { primaryCtaHref: e.target.value })} placeholder="#kontakt" />
                </div>
              </div>
            )}

            {def.singleImage && (() => {
              const value = s.imageUrl
              const fallback = def.singleImage.fallback
              const preview = value || fallback
              const usingFallback = !value
              const key = `${def.id}:imageUrl`
              return (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium text-gray-700">{def.singleImage.label} <span className="font-normal text-gray-400">(DE &amp; EN gemeinsam)</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-[12rem_1fr] gap-3 items-start">
                    <div className="relative w-48 h-28 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt={`${def.singleImage.label} Vorschau`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">kein Bild</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {usingFallback && <span className="text-[11px] text-gray-400">Standardbild</span>}
                      <Input value={value} placeholder={fallback} onChange={(e) => patch(def.id, { imageUrl: e.target.value })} />
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                          {uploading === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          <span>{value ? 'Ersetzen' : 'Hochladen'}</span>
                          <input type="file" accept="image/*" className="hidden" disabled={uploading === key}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(def.id, 'imageUrl', f); e.target.value = '' }} />
                        </label>
                        <Button type="button" variant="ghost" size="sm" disabled={usingFallback}
                          onClick={() => patch(def.id, { imageUrl: '' })}>
                          <RotateCcw className="h-4 w-4 mr-1.5" /> Zurücksetzen
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">„Zurücksetzen“ stellt das im Code hinterlegte Standardbild wieder her. Änderungen erst nach „Speichern“ aktiv.</p>
                </div>
              )
            })()}

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
            {def.id === 'bauweise' && ersteBayerischeEditor}
            {def.id === 'since-founding' && galleryEditor}
            {def.id === 'investor' && newsSettingsEditor}
          </Fragment>
        )
      })}
    </div>
  )
}
