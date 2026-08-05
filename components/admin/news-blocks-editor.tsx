'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, ChevronUp, ChevronDown, Type, ImageIcon, Upload } from 'lucide-react'

export type NewsBlock = {
  type: 'paragraph' | 'image'
  content: string
  contentEn?: string
  imageUrl: string
}

export function NewsBlocksEditor({
  blocks,
  onChange,
  postSlug,
}: {
  blocks: NewsBlock[]
  onChange: (blocks: NewsBlock[]) => void
  postSlug?: string
}) {
  const [uploading, setUploading] = useState<number | null>(null)

  const update = (idx: number, patch: Partial<NewsBlock>) => {
    onChange(blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b)))
  }

  const remove = (idx: number) => {
    onChange(blocks.filter((_, i) => i !== idx))
  }

  const move = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= blocks.length) return
    const copy = [...blocks]
    ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
    onChange(copy)
  }

  const addParagraph = () => {
    onChange([...blocks, { type: 'paragraph', content: '', imageUrl: '' }])
  }

  const addImage = () => {
    onChange([...blocks, { type: 'image', content: '', imageUrl: '' }])
  }

  const uploadImage = async (idx: number, file: File) => {
    setUploading(idx)
    const fd = new FormData()
    fd.append('file', file)
    // Sequence among image blocks up to and including this one.
    const slug = (postSlug || '').trim()
    if (slug) {
      const seq = blocks.slice(0, idx + 1).filter((b) => b.type === 'image').length
      fd.append('name', `${slug}-aktualnosci-${String(seq).padStart(2, '0')}`)
    }
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) update(idx, { imageUrl: data.url })
    setUploading(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addParagraph}>
          <Type className="h-4 w-4 mr-1.5" />
          Absatz hinzufügen
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addImage}>
          <ImageIcon className="h-4 w-4 mr-1.5" />
          Bild hinzufügen
        </Button>
      </div>

      {blocks.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          Keine Blöcke. Fügen Sie einen Absatz oder ein Bild hinzu.
        </p>
      )}

      {blocks.map((block, idx) => (
        <Card key={idx} className="bg-gray-50">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                {block.type === 'paragraph' ? (
                  <>
                    <Type className="h-3.5 w-3.5" />
                    Absatz #{idx + 1}
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3.5 w-3.5" />
                    Bild #{idx + 1}
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => move(idx, 1)}
                  disabled={idx === blocks.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(idx)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {block.type === 'paragraph' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Absatz · DE</Label>
                  <Textarea
                    value={block.content}
                    onChange={(e) => update(idx, { content: e.target.value })}
                    placeholder="Absatztext …"
                    rows={5}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Absatz · EN</Label>
                  <Textarea
                    value={block.contentEn ?? ''}
                    onChange={(e) => update(idx, { contentEn: e.target.value })}
                    rows={5}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading === idx}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadImage(idx, f)
                    }}
                    className="cursor-pointer"
                  />
                  <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">oder Bild-URL</Label>
                  <Input
                    value={block.imageUrl}
                    onChange={(e) => update(idx, { imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                {block.imageUrl && (
                  <img
                    src={block.imageUrl}
                    alt=""
                    className="rounded-lg max-h-64 object-cover"
                  />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bildunterschrift · DE (optional)</Label>
                    <Input
                      value={block.content}
                      onChange={(e) => update(idx, { content: e.target.value })}
                      placeholder="z. B. Luftaufnahme des Projekts"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bildunterschrift · EN (optional)</Label>
                    <Input
                      value={block.contentEn ?? ''}
                      onChange={(e) => update(idx, { contentEn: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
