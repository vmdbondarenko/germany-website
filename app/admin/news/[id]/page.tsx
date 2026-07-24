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
  contentEn: string | null
  imageUrl: string | null
  order: number
}

type ApiPost = {
  id: string
  slug: string
  title: string
  titleEn: string | null
  description: string | null
  descriptionEn: string | null
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
    titleEn: '',
    slug: '',
    description: '',
    descriptionEn: '',
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
        titleEn: post.titleEn ?? '',
        slug: post.slug,
        description: post.description ?? '',
        descriptionEn: post.descriptionEn ?? '',
        coverImageUrl: post.coverImageUrl ?? '',
        publishedAt: post.publishedAt ? post.publishedAt.slice(0, 10) : '',
        published: post.published,
      })
      setBlocks(
        post.blocks.map((b) => ({
          type: b.type === 'image' ? 'image' : 'paragraph',
          content: b.content ?? '',
          contentEn: b.contentEn ?? '',
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
          contentEn: b.contentEn || null,
          imageUrl: b.imageUrl || null,
        })),
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'An error occurred')
    } else {
      const post: ApiPost = await res.json()
      setForm((p) => ({ ...p, slug: post.slug }))
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this post?')) return
    await fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
    router.push('/admin/news')
  }

  if (loading || !id) return <div className="py-20 text-center text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/news">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Edit post</h1>
        </div>
        {form.published && form.slug && (
          <Link href={`/aktualnosci/${form.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              View
            </Button>
          </Link>
        )}
      </div>

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
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
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
                  required
                />
                <p className="text-xs text-gray-500">URL: /aktualnosci/{form.slug}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">Kurzbeschreibung · EN</Label>
                  <Textarea
                    id="descriptionEn"
                    value={form.descriptionEn}
                    onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))}
                    rows={3}
                  />
                </div>
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
              <CardTitle>Post content</CardTitle>
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
                <Label htmlFor="published">Published</Label>
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
            {saving ? 'Saving...' : 'Save changes'}
          </Button>

          <Button
            variant="outline"
            onClick={handleDelete}
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete wpis
          </Button>
        </div>
      </div>
    </div>
  )
}
