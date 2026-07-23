'use client'

import { use } from 'react'
import AdminOverlayEditor from '@/components/admin/admin-overlay-editor'

export default function OverlayEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div>
      <AdminOverlayEditor projectId={id} />
    </div>
  )
}
