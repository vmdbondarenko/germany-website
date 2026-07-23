'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Upload, Trash2, ExternalLink } from 'lucide-react'
import { NewsBlocksEditor, type NewsBlock } from '@/components/admin/news-blocks-editor'

type ApiBlock = {
  id: string
  type: string
  content: string | null
  imageUrl: string | null
  order: number
}

type ApiPost = {
  id: string
  slug: string
  title: string
  description: string | null
  coverImageUrl: string | null
  published: boolean
  publishedAt: string | null
  blocks: ApiBlock[]
}

export default function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    coverImageUrl: '',
    publishedAt: '',
    published: false,
  })
  const [blocks, setBlocks] = useState<NewsBlock[]>([])

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  const load = useCallback(async (postId: string) => {
    setLoading(true)
    const res = await fetch(`/api/admin/news/${postId}`)
    if (res.ok) {
      const post: ApiPost = await res.json()
      setForm({
        title: post.title,
        slug: post.slug,
        description: post.description ?? '',
        coverImageUrl: post.coverImageUrl ?? '',
        publishedAt: post.publishedAt ? post.publishedAt.slice(0, 10) : '',
        published: post.published,
      })
      setBlocks(
        post.blocks.map((b) => ({
          type: b.type === 'image' ? 'image' : 'paragraph',
          content: b.content ?? '',
          imageUrl: b.imageUrl ?? '',
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (id) load(id)
  }, [id, load])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const newsSlug = (form.slug || '').trim()
    if (newsSlug) fd.append('name', `${newsSlug}-aktualnosci-zdjecie-glowne`)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setForm((p) => ({ ...p, coverImageUrl: data.url }))
    setUploading(false)
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/news/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
        blocks: blocks.map((b) => ({
          type: b.type,
          content: b.content || null,
          imageUrl: b.imageUrl || null,
        })),
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Wystąpił błąd')
    } else {
      const post: ApiPost = await res.json()
      setForm((p) => ({ ...p, slug: post.slug }))
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!id || !confirm('Czy na pewno chcesz usunąć ten wpis?')) return
    await fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
    router.push('/admin/news')
  }

  if (loading || !id) return <div className="py-20 text-center text-gray-400">Ładowanie...</div>

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/news">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Powrót
            </Button>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Edytuj wpis</h1>
        </div>
        {form.published && form.slug && (
          <Link href={`/aktualnosci/${form.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Zobacz
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacje podstawowe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-500">URL: /aktualnosci/{form.slug}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Krótki opis (zajawka)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Krótki opis widoczny na liście aktualności..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zdjęcie główne (cover)</CardTitle>
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
                <Label htmlFor="coverImageUrl">lub URL zdjęcia</Label>
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
                  alt="Podgląd"
                  className="rounded-lg max-h-48 object-cover"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Treść wpisu</CardTitle>
            </CardHeader>
            <CardContent>
              <NewsBlocksEditor blocks={blocks} onChange={setBlocks} postSlug={form.slug} />
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
                  Przydatne przy migracji starszych wpisów.
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
                <Label htmlFor="published">Opublikowany</Label>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSave}
            className="w-full"
            disabled={saving || uploading}
            style={{ backgroundColor: '#6E2E2A' }}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>

          <Button
            variant="outline"
            onClick={handleDelete}
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Usuń wpis
          </Button>
        </div>
      </div>
    </div>
  )
}
