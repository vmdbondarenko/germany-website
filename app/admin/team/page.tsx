'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Loader2, Upload, GripVertical } from 'lucide-react'
import { slugifyBase } from '@/lib/blob-filename'

type TeamMember = { id: string; name: string; role: string; image: string | null; order: number }

async function uploadImage(file: File, name?: string): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  if (name) form.append('name', name)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

export default function TeamAdminPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/team-members')
      .then(r => r.json())
      .then(data => { setMembers(data); setLoading(false) })
  }, [])

  const update = (id: string, field: string, value: string | number) =>
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))

  const save = async (member: TeamMember) => {
    setSaving(member.id)
    await fetch(`/api/admin/team-members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    })
    setSaving(null)
  }

  const add = async () => {
    const res = await fetch('/api/admin/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', role: '', image: null, order: members.length }),
    })
    const created = await res.json()
    setMembers(prev => [...prev, created])
  }

  const remove = async (id: string) => {
    if (!confirm('Usunąć tego członka zespołu?')) return
    await fetch(`/api/admin/team-members/${id}`, { method: 'DELETE' })
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const handlePhoto = async (member: TeamMember, file: File) => {
    setUploading(member.id)
    try {
      const nameSlug = slugifyBase(member.name)
      const url = await uploadImage(file, nameSlug ? `zespol-${nameSlug}` : undefined)
      const updated = { ...member, image: url }
      setMembers(prev => prev.map(m => m.id === member.id ? updated : m))
      await save(updated)
    } catch { /* ignore */ }
    setUploading(null)
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Ładowanie...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Zespół — Kim jesteśmy?</h1>
          <p className="text-xs text-muted-foreground mt-1">Kolejność wyświetlania ustalana polem „Kolejność".</p>
        </div>
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Dodaj osobę</Button>
      </div>

      <div className="space-y-4">
        {members.map(member => (
          <div key={member.id} className="border rounded-xl p-4 bg-card space-y-4">
            <div className="flex items-start gap-4">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />

              {/* Photo */}
              <div className="shrink-0">
                <label className="cursor-pointer block">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors relative bg-muted flex items-center justify-center">
                    {member.image ? (
                      <Image src={member.image} alt={member.name} fill className="object-cover object-top" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                    {uploading === member.id && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(member, f); e.target.value = '' }}
                  />
                </label>
                <p className="text-[10px] text-muted-foreground text-center mt-1">Kliknij aby zmienić</p>
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Imię i nazwisko</Label>
                  <Input
                    value={member.name}
                    className="h-8 text-sm"
                    onChange={e => update(member.id, 'name', e.target.value)}
                    onBlur={() => save(member)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stanowisko</Label>
                  <Input
                    value={member.role}
                    className="h-8 text-sm"
                    onChange={e => update(member.id, 'role', e.target.value)}
                    onBlur={() => save(member)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kolejność</Label>
                  <Input
                    type="number"
                    value={member.order}
                    className="h-8 text-sm w-24"
                    onChange={e => update(member.id, 'order', parseInt(e.target.value) || 0)}
                    onBlur={() => save(member)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">URL zdjęcia (lub prześlij powyżej)</Label>
                  <Input
                    value={member.image ?? ''}
                    className="h-8 text-sm"
                    placeholder="/team/zdjecie.jpg"
                    onChange={e => update(member.id, 'image', e.target.value)}
                    onBlur={() => save(member)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => save(member)} disabled={saving === member.id}>
                  {saving === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Zapisz'}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(member.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Brak członków zespołu. Kliknij „Dodaj osobę".</p>
        )}
      </div>
    </div>
  )
}
