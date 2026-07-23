import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { isAuthenticated } from '@/lib/auth'
import { buildBlobKey, splitExt } from '@/lib/blob-filename'

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Optional contextual base name (no extension). When absent we slugify the
  // original filename — used for technical drawings (house types, floor plans,
  // 2D/3D layouts, site/stage/plan views).
  const name = (form.get('name') as string | null) || null
  const key = buildBlobKey(file.name, name)

  try {
    // Drop the random hash suffix; keep clean names unique with -2, -3, … only
    // when the key already exists. Existing Blob objects are never overwritten.
    const [base, ext] = splitExt(key)
    const { blobs } = await list({ prefix: base })
    const taken = new Set(blobs.map((b) => b.pathname))
    let candidate = key
    let n = 1
    while (taken.has(candidate)) {
      n += 1
      candidate = `${base}-${n}${ext}`
    }

    const blob = await put(candidate, file, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
    })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Blob upload error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
