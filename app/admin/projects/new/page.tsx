'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import { slugify } from '@/lib/slugify'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    slug: '',
    location: '',
    description: '',
    status: 'active',
    imageUrl: '',
    svgContent: '',
  })

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug || slugify(name),
    }))
  }

  const handleSvgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, svgContent: ev.target?.result as string }))
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const project = await res.json()
      router.push(`/admin/projects/${project.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Wystąpił błąd')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Powrót
          </Button>
        </Link>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Nowa inwestycja</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informacje podstawowe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nazwa inwestycji *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="np. Osiedle Szlacheckie"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug URL *</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="np. osiedle-szlacheckie"
                    required
                  />
                  <p className="text-xs text-gray-500">URL: /inwestycje/{form.slug || 'slug'}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lokalizacja *</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="np. Kraków, ul. Lipowa 12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Opis</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Opis inwestycji..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL zdjęcia głównego</Label>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan zagospodarowania (SVG)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="svgFile">Wgraj plik SVG</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="svgFile"
                      type="file"
                      accept=".svg,image/svg+xml"
                      onChange={handleSvgFile}
                      className="cursor-pointer"
                    />
                    <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="svgContent">lub wklej kod SVG</Label>
                  <Textarea
                    id="svgContent"
                    value={form.svgContent}
                    onChange={(e) => setForm((p) => ({ ...p, svgContent: e.target.value }))}
                    placeholder="<svg>...</svg>"
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>
                {form.svgContent && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2">Podgląd SVG:</p>
                    <div
                      className="max-h-64 overflow-auto"
                      dangerouslySetInnerHTML={{ __html: form.svgContent }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ustawienia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktywna</SelectItem>
                      <SelectItem value="planned">Planowana</SelectItem>
                      <SelectItem value="completed">Zakończona</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{ backgroundColor: '#6E2E2A' }}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Zapisywanie...' : 'Utwórz inwestycję'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
