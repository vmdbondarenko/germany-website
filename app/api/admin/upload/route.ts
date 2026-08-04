import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { isAuthenticated } from '@/lib/auth'
import { buildBlobKey, splitExt } from '@/lib/blob-filename'

// Single shared upload endpoint for the ENTIRE admin panel (Erste Bayerische,
// Bauweise, team photos, project/investment images, homepage sections, galleries
// and any future admin image upload).
//
// All uploads go to the shared PUBLIC Vercel Blob store
// ("germany-website-blob-public"), connected to this project for Production and
// Preview under the BLOB_STORE_PUBLIC_* env vars. We authenticate with that
// store's read-write token and target it explicitly by its store id, uploading
// with access:'public' so the returned direct *.public.blob.vercel-storage.com
// URLs are publicly readable (and allowed by next.config image remotePatterns).
// The separate private store is left untouched and unused here.
const PUBLIC_STORE_TOKEN = process.env.BLOB_STORE_PUBLIC_READ_WRITE_TOKEN
const PUBLIC_STORE_ID = process.env.BLOB_STORE_PUBLIC_STORE_ID

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!PUBLIC_STORE_TOKEN) {
    return NextResponse.json(
      { error: 'Public blob store is not configured (missing BLOB_STORE_PUBLIC_READ_WRITE_TOKEN).' },
      { status: 500 },
    )
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

  // Explicitly scope every request to the public store.
  const auth = { token: PUBLIC_STORE_TOKEN, storeId: PUBLIC_STORE_ID }

  try {
    // Drop the random hash suffix; keep clean names unique with -2, -3, … only
    // when the key already exists. Existing Blob objects are never overwritten.
    const [base, ext] = splitExt(key)
    const { blobs } = await list({ prefix: base, ...auth })
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
      ...auth,
    })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Blob upload error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
