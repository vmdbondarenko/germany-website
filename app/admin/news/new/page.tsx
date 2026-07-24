'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import { slugify } from '@/lib/slugify'
import { NewsBlocksEditor, type NewsBlock } from '@/components/admin/news-blocks-editor'

export default function NewNewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    titleEn: '',
    slug: '',
    description: '',
    descriptionEn: '',
    coverImageUrl: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    published: false,
  })
  const [blocks, setBlocks] = useState<NewsBlock[]>([])

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }))
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    // Derive the slug from the current title (it may not be saved yet); fall
    // back to original-filename slugification when no title is set.
    const newsSlug = (form.slug || slugify(form.title)).trim()
    if (newsSlug) fd.append('name', `${newsSlug}-aktualnosci-zdjecie-glowne`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setForm((p) => ({ ...p, coverImageUrl: data.url }))
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
        blocks: blocks.map((b) => ({
          type: b.type,
          content: b.content || null,
          contentEn: b.contentEn || null,
          imageUrl: b.imageUrl || null,
        })),
      }),
    })
    if (res.ok) {
      const post = await res.json()
      router.push(`/admin/news/${post.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/news">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-serif font-bold text-gray-900">New post</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel · DE *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="z. B. Neue Wohnungen ab sofort verfügbar"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">Titel · EN</Label>
                    <Input
                      id="titleEn"
                      value={form.titleEn}
                      onChange={(e) => setForm((p) => ({ ...p, titleEn: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug URL *</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="nowe-mieszkania-dostepne"
                    required
                  />
                  <p className="text-xs text-gray-500">URL: /aktualnosci/{form.slug || 'slug'}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">Kurzbeschreibung · EN</Label>
                  <Textarea
                    id="descriptionEn"
                    value={form.descriptionEn}
                    onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Kurzbeschreibung · DE</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Kurzer Teaser für die Übersichtsseite …"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Main image (cover)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverImageUrl">or image URL</Label>
                  <Input
                    id="coverImageUrl"
                    value={form.coverImageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                {form.coverImageUrl && (
                  <img
                    src={form.coverImageUrl}
                    alt="Preview"
                    className="rounded-lg max-h-48 object-cover"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Post content — paragraphs and extra images</CardTitle>
              </CardHeader>
              <CardContent>
                <NewsBlocksEditor blocks={blocks} onChange={setBlocks} postSlug={form.slug || slugify(form.title)} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publikacja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="publishedAt">Data publikacji</Label>
                  <Input
                    id="publishedAt"
                    type="date"
                    value={form.publishedAt}
                    onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">
                    Useful when migrating older posts.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="published"
                    checked={form.published}
                    onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <Label htmlFor="published">Opublikuj</Label>
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
              disabled={loading || uploading}
              style={{ backgroundColor: '#6E2E2A' }}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Create post'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
