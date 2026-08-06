"use client"

import { useEffect, useState } from "react"

// Company contact + legal identity editor (SiteSettings singleton, id "main").
// Reads/writes only SiteSettings via /api/admin/site-settings — no environment
// variables or secrets are shown or edited here.

type Fields = {
  companyName: string; managingDirector: string; phone: string; email: string
  street: string; postalCode: string; city: string; country: string
  registerCourt: string; registrationNumber: string; vatId: string
  mapEmbedSrc: string; mapHref: string
  instagramUrl: string; youtubeUrl: string; facebookUrl: string; linkedinUrl: string
  logoUrl: string
}

const EMPTY: Fields = {
  companyName: "", managingDirector: "", phone: "", email: "",
  street: "", postalCode: "", city: "", country: "",
  registerCourt: "", registrationNumber: "", vatId: "",
  mapEmbedSrc: "", mapHref: "",
  instagramUrl: "", youtubeUrl: "", facebookUrl: "", linkedinUrl: "",
  logoUrl: "",
}

const GROUPS: { title: string; fields: { key: keyof Fields; label: string; textarea?: boolean; hint?: string }[] }[] = [
  { title: "Unternehmen", fields: [
    { key: "companyName", label: "Firmenname" },
    { key: "managingDirector", label: "Geschäftsführer/in" },
  ] },
  { title: "Kontakt", fields: [
    { key: "phone", label: "Telefon" },
    { key: "email", label: "E-Mail" },
  ] },
  { title: "Adresse", fields: [
    { key: "street", label: "Straße" },
    { key: "postalCode", label: "PLZ" },
    { key: "city", label: "Stadt" },
    { key: "country", label: "Land (Anzeige, z. B. Deutschland)" },
  ] },
  { title: "Rechtliches", fields: [
    { key: "registerCourt", label: "Registergericht" },
    { key: "registrationNumber", label: "Registernummer" },
    { key: "vatId", label: "USt-IdNr.", hint: "Leer lassen, wenn noch nicht vorhanden." },
  ] },
  { title: "Karte", fields: [
    { key: "mapEmbedSrc", label: "Karten-Embed-URL (iframe src)", textarea: true },
    { key: "mapHref", label: "Karten-Link (öffnen in Google Maps)" },
  ] },
  { title: "Social Media", fields: [
    { key: "instagramUrl", label: "Instagram-URL" },
    { key: "youtubeUrl", label: "YouTube-URL" },
    { key: "facebookUrl", label: "Facebook-URL" },
    { key: "linkedinUrl", label: "LinkedIn-URL" },
  ] },
  { title: "Logo", fields: [
    { key: "logoUrl", label: "Logo-URL", hint: "Optional. Leer = Standard-Logo." },
  ] },
]

export default function SiteSettingsPage() {
  const [form, setForm] = useState<Fields>(EMPTY)
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(true)
  const [showLocationsNav, setShowLocationsNav] = useState(true)
  const [showCompletedNav, setShowCompletedNav] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>("")

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        if (row) {
          setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, row[k] ?? ""])) as Fields })
          setShowLanguageSwitcher(row.showLanguageSwitcher ?? true)
          setShowLocationsNav(row.showLocationsNav ?? true)
          setShowCompletedNav(row.showCompletedNav ?? true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const set = (k: keyof Fields, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    setStatus("")
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, showLanguageSwitcher, showLocationsNav, showCompletedNav }),
      })
      setStatus(res.ok ? "Gespeichert." : "Fehler beim Speichern.")
    } catch {
      setStatus("Fehler beim Speichern.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>

  return (
    <div className="max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-1">Company settings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Contact and legal company data shown in the header, footer, contact section, Impressum, Datenschutz and PDFs.
      </p>

      <div className="space-y-8">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{g.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {g.fields.map((f) => (
                <div key={f.key} className={f.textarea ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.textarea ? (
                    <textarea
                      value={form[f.key]}
                      onChange={(e) => set(f.key, e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      value={form[f.key]}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  )}
                  {f.hint && <p className="text-xs text-gray-400 mt-1">{f.hint}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Sprache</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showLanguageSwitcher}
            onChange={(e) => setShowLanguageSwitcher(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span className="text-sm">
            <span className="font-medium text-gray-800">Sprachumschalter anzeigen</span>
            <span className="block text-xs text-gray-400 mt-0.5">
              Zeigt den DE/EN-Umschalter im Header (Desktop und Mobil). Wenn deaktiviert, ist die
              Website standardmäßig auf Deutsch; die englische Version bleibt unter /en erreichbar.
            </span>
          </span>
        </label>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Navigation</h2>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showLocationsNav}
              onChange={(e) => setShowLocationsNav(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm">
              <span className="font-medium text-gray-800">Standorte im Menü anzeigen</span>
              <span className="block text-xs text-gray-400 mt-0.5">
                Blendet den Menüpunkt „Standorte“ im Header ein/aus (Desktop und Mobil, DE und EN).
                Der Bereich und die Seite /standort bleiben erreichbar.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompletedNav}
              onChange={(e) => setShowCompletedNav(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm">
              <span className="font-medium text-gray-800">Abgeschlossen im Menü anzeigen</span>
              <span className="block text-xs text-gray-400 mt-0.5">
                Blendet den Menüpunkt „Abgeschlossen“ im Header ein/aus (Desktop und Mobil, DE und EN).
                Der Abschnitt bleibt erhalten und über den Anker erreichbar.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </div>
  )
}
